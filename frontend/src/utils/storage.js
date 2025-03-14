/**
 * Проверяет доступность localStorage в текущем окружении
 * @returns {boolean} true, если localStorage доступен, иначе false
 */
export const isLocalStorageAvailable = () => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}; 