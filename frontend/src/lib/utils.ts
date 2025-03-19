import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid, isSameMonth, isSameYear, parse as dateParse } from "date-fns";
import { ru } from "date-fns/locale";

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

/**
 * Форматирует диапазон дат в формате "2–8 мар 2025" или "25 фев – 8 мар 2025"
 * @param {Date} startDate - дата начала
 * @param {Date} endDate - дата окончания
 * @returns {string} - отформатированный диапазон дат
 */
export function formatDateRange(startDate: Date | null, endDate: Date | null): string {
  if (!isValidDate(startDate) && !isValidDate(endDate)) return '';
  
  if (isValidDate(startDate) && !isValidDate(endDate)) {
    // Форматируем одиночную дату с месяцем в нижнем регистре
    const formattedDate = format(startDate as Date, "d MMM yyyy", { locale: ru })
      .replace('.', ''); // Убираем точку после месяца
    return formattedDate.charAt(0) + formattedDate.slice(1).toLowerCase();
  }
  
  if (!isValidDate(startDate) && isValidDate(endDate)) {
    // Форматируем одиночную дату с месяцем в нижнем регистре
    const formattedDate = format(endDate as Date, "d MMM yyyy", { locale: ru })
      .replace('.', ''); // Убираем точку после месяца
    return formattedDate.charAt(0) + formattedDate.slice(1).toLowerCase();
  }
  
  // Если обе даты валидны
  const sameMonth = isSameMonth(startDate as Date, endDate as Date);
  const sameYear = isSameYear(startDate as Date, endDate as Date);
  
  if (sameMonth && sameYear) {
    // Формат "2–8 мар 2025"
    const startDay = format(startDate as Date, "d", { locale: ru });
    const endDateFormatted = format(endDate as Date, "d MMM yyyy", { locale: ru })
      .replace('.', ''); // Убираем точку после месяца
    const endDateLower = endDateFormatted.charAt(0) + endDateFormatted.slice(1).toLowerCase();
    return `${startDay}–${endDateLower}`;
  } else if (sameYear) {
    // Формат "25 фев – 8 мар 2025"
    const startDateFormatted = format(startDate as Date, "d MMM", { locale: ru })
      .replace('.', ''); // Убираем точку после месяца
    const startDateLower = startDateFormatted.charAt(0) + startDateFormatted.slice(1).toLowerCase();
    
    const endDateFormatted = format(endDate as Date, "d MMM yyyy", { locale: ru })
      .replace('.', ''); // Убираем точку после месяца
    const endDateLower = endDateFormatted.charAt(0) + endDateFormatted.slice(1).toLowerCase();
    
    return `${startDateLower} – ${endDateLower}`;
  } else {
    // Разные годы, показываем полные даты
    const startDateFormatted = format(startDate as Date, "d MMM yyyy", { locale: ru })
      .replace('.', ''); // Убираем точку после месяца
    const startDateLower = startDateFormatted.charAt(0) + startDateFormatted.slice(1).toLowerCase();
    
    const endDateFormatted = format(endDate as Date, "d MMM yyyy", { locale: ru })
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
export function parseDateRange(dateRangeString: string): [Date | null, Date | null] {
  if (!dateRangeString || typeof dateRangeString !== 'string') {
    return [null, null];
  }
  
  try {
    // Поддерживаем различные разделители: обычный дефис, короткое тире и длинное тире
    const splitRegex = /\s*[-–—]\s*/;
    const dateParts = dateRangeString.split(splitRegex);
    
    const startDateStr = dateParts[0]?.trim();
    const endDateStr = dateParts[1]?.trim();
    
    return [
      parseDate(startDateStr), 
      parseDate(endDateStr)
    ];
  } catch (error) {
    console.error('Ошибка при обработке строки диапазона дат:', error, dateRangeString);
    return [null, null];
  }
}