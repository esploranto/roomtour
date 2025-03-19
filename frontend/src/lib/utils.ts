import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid, isSameMonth, isSameYear, parse as dateParse } from "date-fns";
import { ru, enUS } from "date-fns/locale";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
}

/**
 * Проверяет, является ли объект валидной датой
 * @param {any} date - объект для проверки
 * @returns {boolean} - true, если объект является валидной датой
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Парсит строку даты в формате DD.MM.YYYY в объект Date
 * @param {string} dateString - строка даты в формате DD.MM.YYYY
 * @returns {Date|null} - объект Date или null, если строка некорректна
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') return null;
  
  // Проверяем соответствие формату DD.MM.YYYY
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(dateString.trim())) return null;
  
  try {
    const date = dateParse(dateString.trim(), "dd.MM.yyyy", new Date());
    return isValid(date) ? date : null;
  } catch (e) {
    console.error('Ошибка при парсинге даты:', e, dateString);
    return null;
  }
}

// Получаем текущий язык из localStorage или используем русский по умолчанию
export function getCurrentLocale(): Locale {
  const currentLang = localStorage.getItem('lang') || 'ru';
  return currentLang === 'en' ? enUS : ru;
}

/**
 * Форматирует диапазон дат в формате "2–8 мар 2025" или "25 фев – 8 мар 2025"
 * @param {Date} startDate - дата начала
 * @param {Date} endDate - дата окончания
 * @returns {string} - отформатированный диапазон дат
 */
export function formatDateRange(startDate: Date | null, endDate: Date | null): string {
  if (!isValidDate(startDate) && !isValidDate(endDate)) return '';
  
  const locale = getCurrentLocale();
  
  if (isValidDate(startDate) && !isValidDate(endDate)) {
    // Форматируем одиночную дату с месяцем в нижнем регистре
    const formattedDate = format(startDate as Date, "d MMM yyyy", { locale })
      .replace('.', ''); // Убираем точку после месяца
    return formattedDate.charAt(0) + formattedDate.slice(1).toLowerCase();
  }
  
  if (!isValidDate(startDate) && isValidDate(endDate)) {
    // Форматируем одиночную дату с месяцем в нижнем регистре
    const formattedDate = format(endDate as Date, "d MMM yyyy", { locale })
      .replace('.', ''); // Убираем точку после месяца
    return formattedDate.charAt(0) + formattedDate.slice(1).toLowerCase();
  }
  
  // Если обе даты валидны
  const sameMonth = isSameMonth(startDate as Date, endDate as Date);
  const sameYear = isSameYear(startDate as Date, endDate as Date);
  
  // Проверяем, совпадают ли даты полностью
  if (startDate && endDate && startDate.getTime() === endDate.getTime()) {
    // Если даты одинаковые, возвращаем одну дату
    const formattedDate = format(startDate, "d MMM yyyy", { locale })
      .replace('.', ''); // Убираем точку после месяца
    return formattedDate.charAt(0) + formattedDate.slice(1).toLowerCase();
  }
  
  if (sameMonth && sameYear) {
    // Формат "2–8 мар 2025"
    const startDay = format(startDate as Date, "d", { locale });
    const endDateFormatted = format(endDate as Date, "d MMM yyyy", { locale })
      .replace('.', ''); // Убираем точку после месяца
    const endDateLower = endDateFormatted.charAt(0) + endDateFormatted.slice(1).toLowerCase();
    return `${startDay}–${endDateLower}`;
  } else if (sameYear) {
    // Формат "25 фев – 8 мар 2025"
    const startDateFormatted = format(startDate as Date, "d MMM", { locale })
      .replace('.', ''); // Убираем точку после месяца
    const startDateLower = startDateFormatted.charAt(0) + startDateFormatted.slice(1).toLowerCase();
    
    const endDateFormatted = format(endDate as Date, "d MMM yyyy", { locale })
      .replace('.', ''); // Убираем точку после месяца
    const endDateLower = endDateFormatted.charAt(0) + endDateFormatted.slice(1).toLowerCase();
    
    return `${startDateLower} – ${endDateLower}`;
  } else {
    // Разные годы, показываем полные даты
    const startDateFormatted = format(startDate as Date, "d MMM yyyy", { locale })
      .replace('.', ''); // Убираем точку после месяца
    const startDateLower = startDateFormatted.charAt(0) + startDateFormatted.slice(1).toLowerCase();
    
    const endDateFormatted = format(endDate as Date, "d MMM yyyy", { locale })
      .replace('.', ''); // Убираем точку после месяца
    const endDateLower = endDateFormatted.charAt(0) + endDateFormatted.slice(1).toLowerCase();
    
    return `${startDateLower} – ${endDateLower}`;
  }
}

/**
 * Парсит строку диапазона дат в формате "DD.MM.YYYY – DD.MM.YYYY" или "DD.MM.YYYY - DD.MM.YYYY"
 * @param {string} dateRangeString - строка в формате "DD.MM.YYYY – DD.MM.YYYY"
 * @returns {[Date|null, Date|null]} - массив из двух элементов: начальная и конечная даты
 */
export function parseDateRange(dateString: string): [Date | null, Date | null] {
  if (!dateString) {
    return [null, null];
  }

  console.log('parseDateRange - входная строка:', dateString);

  // Объект для преобразования русских месяцев в числа
  const monthsRu: { [key: string]: number } = {
    'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'июн': 5,
    'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11
  };

  try {
    // Функция для парсинга даты в формате "8 мар 2025" или просто "8"
    const parseRussianDate = (datePart: string, defaultMonth?: string, defaultYear?: string): Date | null => {
      const parts = datePart.trim().split(' ');
      
      if (parts.length === 3) {
        // Полная дата "8 мар 2025"
        const [day, month, year] = parts;
        const monthNum = monthsRu[month.toLowerCase()];
        if (monthNum !== undefined) {
          return new Date(parseInt(year), monthNum, parseInt(day));
        }
      } else if (parts.length === 1 && defaultMonth && defaultYear) {
        // Только день "8" с дефолтным месяцем и годом
        const day = parts[0];
        const monthNum = monthsRu[defaultMonth.toLowerCase()];
        if (monthNum !== undefined) {
          return new Date(parseInt(defaultYear), monthNum, parseInt(day));
        }
      }
      return null;
    };

    // Проверяем, содержит ли строка разделитель диапазона
    if (dateString.match(/[-–—]/)) {
      // Разбиваем строку по разделителю (дефис или тире)
      const parts = dateString.split(/[-–—]/);
      
      if (parts.length === 2) {
        // Получаем месяц и год из второй части (они всегда там есть)
        const endParts = parts[1].trim().split(' ');
        if (endParts.length === 3) {
          const [_, month, year] = endParts;
          
          // Парсим начальную дату (может быть только число или полная дата)
          const startDate = parseRussianDate(parts[0], month, year);
          // Парсим конечную дату (всегда полная)
          const endDate = parseRussianDate(parts[1]);

          console.log('parseDateRange - результат парсинга диапазона:', { startDate, endDate });
          return [startDate, endDate];
        }
      }
    } else {
      // Обрабатываем одиночную дату
      const date = parseRussianDate(dateString);
      console.log('parseDateRange - результат парсинга одиночной даты:', { date });
      return [date, date]; // Возвращаем одну и ту же дату как начало и конец
    }
    
    console.log('parseDateRange - неверный формат строки с датами');
    return [null, null];
  } catch (error) {
    console.error('parseDateRange - ошибка при парсинге:', error);
    return [null, null];
  }
}