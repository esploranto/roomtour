import api from './config';

/**
 * Сервис для работы с API профиля пользователя
 */
const userService = {
  /**
   * Получить профиль пользователя
   * @param {string} username - Имя пользователя
   * @returns {Promise<Object>} Данные профиля
   */
  getProfile: async (username) => {
    const response = await api.get(`/users/${username}/`);
    return response.data;
  },

  /**
   * Обновить описание профиля пользователя
   * @param {string} username - Имя пользователя
   * @param {string} description - Новое описание профиля
   * @returns {Promise<Object>} Обновленные данные профиля
   */
  updateDescription: async (username, description) => {
    const response = await api.patch(`/users/${username}/`, { description });
    // Очищаем кэш профиля пользователя
    api.clearCacheFor(`/users/${username}/`);
    return response.data;
  },

  /**
   * Обновить аватар пользователя
   * @param {string} username - Имя пользователя
   * @param {FormData} formData - FormData с изображением аватара
   * @returns {Promise<Object>} Обновленные данные профиля
   */
  updateAvatar: async (username, formData) => {
    const response = await api.post(`/users/${username}/avatar/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Очищаем кэш профиля пользователя
    api.clearCacheFor(`/users/${username}/`);
    return response.data;
  },

  /**
   * Поделиться профилем (получить ссылку для шаринга)
   * @param {string} username - Имя пользователя
   * @returns {Promise<Object>} Данные для шаринга
   */
  shareProfile: async (username) => {
    const response = await api.get(`/users/${username}/share/`);
    return response.data;
  }
};

export default userService; 