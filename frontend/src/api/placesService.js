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
   */
  getPlace: async (identifier) => {
    const response = await api.get(`/places/${identifier}/`);
    return response.data;
  },

  /**
   * Создать новое место
   * @param {Object} placeData - Данные места
   * @returns {Promise<Object>} Созданное место
   */
  createPlace: async (placeData) => {
    const response = await api.post('/places/', placeData);
    // Очищаем кэш списка мест после создания нового места
    api.clearCacheFor('/places/');
    return response.data;
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
   * @returns {Promise<Object>} Обновленное место
   */
  updatePlace: async (identifier, placeData) => {
    const response = await api.put(`/places/${identifier}/`, placeData);
    // Очищаем кэш после обновления
    api.clearCacheFor(`/places/${identifier}/`);
    api.clearCacheFor('/places/');
    return response.data;
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