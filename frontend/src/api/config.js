import axios from 'axios';

// Создаем простой кэш для GET-запросов
const cache = new Map();
const CACHE_DURATION = 60 * 1000; // 1 минута в миллисекундах

// Базовый экземпляр axios для API-запросов
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Для cookies, если используется сессионная аутентификация
});

// Функция для генерации ключа кэша
const getCacheKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
};

// Функция для проверки валидности кэша
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp < CACHE_DURATION);
};

// Добавляем логирование запросов в режиме разработки
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
    
    // Проверяем кэш только для GET-запросов
    if (config.method === 'get') {
      const cacheKey = getCacheKey(config);
      const cachedResponse = cache.get(cacheKey);
      
      if (isCacheValid(cachedResponse)) {
        console.log(`Using cached response for: ${config.url}`);
        
        // Возвращаем кэшированный ответ и прерываем цепочку запросов
        return Promise.reject({
          __CACHE_HIT__: true,
          cachedResponse: cachedResponse.data
        });
      }
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Перехватчик ответов для обработки ошибок и кэширования
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    
    // Кэшируем только GET-запросы
    if (response.config.method === 'get') {
      const cacheKey = getCacheKey(response.config);
      cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
    }
    
    return response;
  },
  (error) => {
    // Проверяем, является ли это кэшированным ответом
    if (error.__CACHE_HIT__) {
      return error.cachedResponse;
    }
    
    // Обработка ошибок API
    if (error.response) {
      // Ошибка от сервера (4xx, 5xx)
      console.error('API Error:', error.response.status, error.response.data);
      
      // Специальная обработка для 404
      if (error.response.status === 404) {
        console.warn(`Resource not found: ${error.config.url}`);
        // Для GET-запросов можно вернуть пустой результат вместо ошибки
        if (error.config.method === 'get') {
          if (error.config.url.includes('/users/')) {
            return Promise.resolve({ data: { username: null, places: [] } });
          }
        }
      }
      
      // Сохраняем оригинальный объект ошибки
      return Promise.reject(error);
    } else if (error.request) {
      // Запрос был сделан, но ответ не получен
      console.error('API Request Error (No Response):', error.request);
      const networkError = new Error('Не удалось подключиться к серверу. Пожалуйста, проверьте подключение к интернету.');
      networkError.response = { status: 0 };
      return Promise.reject(networkError);
    } else {
      // Ошибка при настройке запроса
      console.error('API Setup Error:', error.message);
      const setupError = new Error('Произошла ошибка при отправке запроса. Пожалуйста, попробуйте позже.');
      setupError.response = { status: 0 };
      return Promise.reject(setupError);
    }
  }
);

// Метод для очистки кэша
api.clearCache = () => {
  cache.clear();
  console.log('API cache cleared');
};

// Метод для очистки конкретного ключа кэша
api.clearCacheFor = (url, params = {}) => {
  const cacheKey = getCacheKey({ method: 'get', url, params });
  const deleted = cache.delete(cacheKey);
  console.log(`Cache for ${url} ${deleted ? 'cleared' : 'not found'}`);
};

export default api; 