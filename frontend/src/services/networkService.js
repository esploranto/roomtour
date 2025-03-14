import { queueService } from './queueService';
import { placesService } from '@/api';

class NetworkService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Set();
    this.syncListeners = new Set();
    
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  handleOnline = async () => {
    this.isOnline = true;
    this.notifyListeners();
    await this.processQueue();
  };

  handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners();
  };

  addListener(callback) {
    this.listeners.add(callback);
    // Сразу вызываем колбэк с текущим состоянием
    callback(this.isOnline);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  addSyncListener(callback) {
    this.syncListeners.add(callback);
  }

  removeSyncListener(callback) {
    this.syncListeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.isOnline));
  }

  notifySyncListeners(isSyncing) {
    this.syncListeners.forEach(callback => callback(isSyncing));
  }

  async processQueue() {
    if (!this.isOnline) return;

    const queue = await queueService.getQueue();
    if (queue.length === 0) return;

    this.notifySyncListeners(true);
    
    for (const operation of queue) {
      try {
        if (operation.type === 'createPlace') {
          // Создаем место
          const newPlace = await placesService.createPlace(operation.data);
          
          // Если есть фотографии, загружаем их
          if (operation.files && operation.files.length > 0) {
            const formData = new FormData();
            const validFiles = operation.files.filter(file => file && typeof file === 'object');
            
            if (validFiles.length > 0) {
              validFiles.forEach(file => {
                formData.append('images', file);
              });
              
              const identifier = newPlace.slug || newPlace.id;
              try {
                await placesService.uploadImages(identifier, formData);
              } catch (uploadError) {
                console.error('Error uploading images:', uploadError);
                // Продолжаем выполнение, даже если загрузка изображений не удалась
              }
            }
          }
          
          // Удаляем операцию из очереди после успешного выполнения
          await queueService.removeFromQueue(operation.id);
        } else if (operation.type === 'updatePlace') {
          const identifier = operation.identifier;
          await placesService.updatePlace(identifier, operation.data);
          
          if (operation.files && operation.files.length > 0) {
            const formData = new FormData();
            const validFiles = operation.files.filter(file => file && typeof file === 'object');
            
            if (validFiles.length > 0) {
              validFiles.forEach(file => {
                formData.append('images', file);
              });
              
              try {
                await placesService.uploadImages(identifier, formData);
              } catch (uploadError) {
                console.error('Error uploading images:', uploadError);
              }
            }
          }
          
          await queueService.removeFromQueue(operation.id);
        }
      } catch (error) {
        console.error('Error processing queued operation:', error);
        await queueService.updateOperationStatus(operation.id, 'error');
      }
    }

    this.notifySyncListeners(false);
  }
}

const networkService = new NetworkService();

export { networkService };
export default networkService; 