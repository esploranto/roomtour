import api from './config';

/**
 * Сервис для работы с API мест проживания
 */
const placesService = {
  /**
   * Получить список всех мест
   * @returns {Promise<Array>} Массив мест
   */
  getAllPlaces: async () => {
    const response = await api.get('/places/');
    return response.data;
  },

  /**
   * Получить место по slug или id
   * @param {string|number} identifier - Slug или ID места
   * @returns {Promise<Object>} Данные места
   * @throws {Error} Если место не найдено или произошла ошибка
   */
  getPlace: async (identifier) => {
    try {
      const response = await api.get(`/places/${identifier}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        const errorMessage = error.response.data.detail || `Место с идентификатором ${identifier} не найдено`;
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  /**
   * Создать новое место
   * @param {Object} placeData - Данные места
   * @param {Array} photos - Массив файлов фотографий
   * @returns {Promise<Object>} Созданное место
   */
  createPlace: async (placeData, photos = []) => {
    // Сначала создаем место
    const response = await api.post('/places/', placeData);
    const createdPlace = response.data;

    // Если есть фотографии, загружаем их
    if (photos.length > 0) {
      const formData = new FormData();
      photos.forEach(photo => {
        formData.append('images', photo.file);
      });

      const identifier = createdPlace.slug || createdPlace.id;
      const uploadedImages = await placesService.uploadImages(identifier, formData);
      createdPlace.images = uploadedImages;
    }

    // Очищаем кэш списка мест после создания нового места
    api.clearCacheFor('/places/');
    return createdPlace;
  },

  /**
   * Загрузить изображения для места
   * @param {string|number} identifier - Slug или ID места
   * @param {FormData} formData - FormData с изображениями
   * @returns {Promise<Array>} Массив загруженных изображений
   */
  uploadImages: async (identifier, formData) => {
    const response = await api.post(`/places/${identifier}/upload_images/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Очищаем кэш конкретного места после загрузки изображений
    api.clearCacheFor(`/places/${identifier}/`);
    return response.data;
  },

  /**
   * Обновить существующее место
   * @param {string|number} identifier - Slug или ID места
   * @param {Object} placeData - Данные для обновления
   * @param {Array} newPhotos - Массив новых файлов фотографий
   * @param {Array} deletedPhotos - Массив ID удаленных фотографий
   * @returns {Promise<Object>} Обновленное место
   */
  updatePlace: async (identifier, placeData, newPhotos = [], deletedPhotos = []) => {
    // Если есть ID удаленных фотографий, добавляем их в данные
    if (deletedPhotos.length > 0) {
      placeData.deleted_photos = deletedPhotos;
    }

    // Обновляем основные данные места
    const response = await api.put(`/places/${identifier}/`, placeData);
    let updatedPlace = response.data;

    // Если есть новые фотографии, загружаем их
    if (newPhotos.length > 0) {
      const formData = new FormData();
      newPhotos.forEach(photo => {
        formData.append('images', photo.file);
      });

      const uploadedImages = await placesService.uploadImages(identifier, formData);
      updatedPlace.images = [...(updatedPlace.images || []), ...uploadedImages];
    }

    // Очищаем кэш после обновления
    api.clearCacheFor(`/places/${identifier}/`);
    api.clearCacheFor('/places/');
    return updatedPlace;
  },

  /**
   * Удалить место
   * @param {string|number} identifier - Slug или ID места для удаления
   * @returns {Promise<void>}
   */
  deletePlace: async (identifier) => {
    await api.delete(`/places/${identifier}/`);
    // Очищаем кэш после удаления
    api.clearCacheFor(`/places/${identifier}/`);
    api.clearCacheFor('/places/');
  },

  /**
   * Очистить весь кэш мест
   * @returns {void}
   */
  clearCache: () => {
    api.clearCacheFor('/places/');
  },

  // Оставляем старые методы для обратной совместимости
  getPlaceBySlug: async (slug) => {
    return placesService.getPlace(slug);
  }
};

export default placesService; 