import { openDB } from 'idb';

const DB_NAME = 'roomtour_offline';
const STORE_NAME = 'operations_queue';
const DB_VERSION = 1;

// Инициализация базы данных
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { 
          keyPath: 'id',
          autoIncrement: true 
        });
      }
    },
  });
};

// Слушатели изменений очереди
const queueChangeListeners = new Set();

// Добавление слушателя изменений очереди
const addQueueChangeListener = (callback) => {
  queueChangeListeners.add(callback);
};

// Удаление слушателя изменений очереди
const removeQueueChangeListener = (callback) => {
  queueChangeListeners.delete(callback);
};

// Уведомление всех слушателей об изменении очереди
const notifyQueueListeners = () => {
  queueChangeListeners.forEach(callback => callback());
};

// Добавление операции в очередь
const addToQueue = async (operation) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  const id = await store.add({
    ...operation,
    timestamp: Date.now(),
    status: 'pending'
  });
  
  await tx.complete;
  notifyQueueListeners();
  return id;
};

// Получение всех операций из очереди
const getQueue = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

// Удаление операции из очереди
const removeFromQueue = async (id) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
  notifyQueueListeners();
};

// Обновление статуса операции
const updateOperationStatus = async (id, status) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  const operation = await store.get(id);
  if (operation) {
    operation.status = status;
    await store.put(operation);
  }
  
  await tx.complete;
  notifyQueueListeners();
};

// Проверка наличия операций в очереди
const hasOperations = async () => {
  const queue = await getQueue();
  return queue.length > 0;
};

const queueService = {
  addToQueue,
  getQueue,
  removeFromQueue,
  updateOperationStatus,
  hasOperations,
  addQueueChangeListener,
  removeQueueChangeListener
};

export { queueService };
export default queueService; 