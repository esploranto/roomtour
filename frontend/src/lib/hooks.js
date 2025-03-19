import useSWR from 'swr';
import { placesService, userService } from '@/api';
import { format } from 'date-fns';
import { getCurrentLocale } from '@/lib/utils.ts';

/**
 * Кастомный хук для получения списка всех мест с кэшированием
 * @returns {Object} Объект с данными, состоянием загрузки и ошибкой
 */
export function usePlaces() {
  const { data, error, isLoading, mutate } = useSWR(
    'places',
    async () => {
      const data = await placesService.getAllPlaces();
      
      // Преобразуем данные с сервера в формат для UI
      return data.map(place => ({
        id: place.id,
        slug: place.slug,
        title: place.name,
        dates: place.dates || formatDateRange(place.created_at),
        rating: place.rating,
        icon: null,
        location: place.location,
        review: place.review,
        images: place.images
      }));
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 минута
    }
  );

  return {
    places: data || [],
    isLoading,
    error,
    mutate
  };
}

/**
 * Кастомный хук для получения конкретного места по slug или id с кэшированием
 * @param {string|number} identifier - Slug или ID места
 * @returns {Object} Объект с данными, состоянием загрузки и ошибкой
 */
export function usePlace(identifier) {
  const { data, error, isLoading, mutate } = useSWR(
    identifier ? `place/${identifier}` : null,
    async () => {
      return await placesService.getPlace(identifier);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 минута
    }
  );

  return {
    place: data,
    isLoading,
    error,
    mutate
  };
}

/**
 * Кастомный хук для работы с профилем пользователя
 * @param {string} username - Имя пользователя
 * @returns {Object} Объект с данными профиля, состоянием загрузки, ошибкой и функциями для обновления
 */
export function useUserProfile(username) {
  const { data, error, isLoading, mutate } = useSWR(
    username ? `user/${username}` : null,
    async () => {
      try {
        return await userService.getProfile(username);
      } catch (error) {
        // Если API еще не реализовано, возвращаем моковые данные
        console.warn('API для профиля пользователя не реализовано, используем моковые данные');
        return {
          username,
          description: "Собираю места, в которых жил в поездках. Вдохновляюсь удачными решениями в дизайне и красивыми интерьерами.",
          avatarUrl: null
        };
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 минута
    }
  );

  /**
   * Обновить описание профиля
   * @param {string} newDescription - Новое описание
   */
  const updateDescription = async (newDescription) => {
    try {
      // Оптимистичное обновление UI
      mutate(
        { ...data, description: newDescription },
        false // не делаем ревалидацию сразу
      );
      
      // Отправляем запрос на сервер
      await userService.updateDescription(username, newDescription);
      
      // Ревалидируем данные после успешного обновления
      mutate();
      
      return true;
    } catch (error) {
      console.error('Ошибка при обновлении описания:', error);
      // Ревалидируем данные, чтобы вернуть предыдущее состояние
      mutate();
      return false;
    }
  };

  /**
   * Поделиться профилем
   */
  const shareProfile = async () => {
    try {
      const shareData = await userService.shareProfile(username);
      return shareData;
    } catch (error) {
      console.error('Ошибка при получении данных для шаринга:', error);
      // Если API не реализовано, возвращаем базовую ссылку
      return { shareUrl: window.location.href };
    }
  };

  return {
    profile: data,
    isLoading,
    error,
    updateDescription,
    shareProfile,
    mutate
  };
}

/**
 * Форматирование даты для отображения
 * @param {string} createdAt - Дата создания в формате ISO
 * @returns {string} Отформатированная дата
 */
function formatDateRange(createdAt) {
  if (!createdAt) return "";
  
  const date = new Date(createdAt);
  const locale = getCurrentLocale();
  // Используем format из date-fns с удалением точки
  const formattedDate = format(date, "d MMM yyyy", { locale })
    .replace('.', ''); // Убираем точку после месяца
  return formattedDate.charAt(0) + formattedDate.slice(1).toLowerCase();
} 