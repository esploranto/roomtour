import React, { createContext, useState, useContext } from 'react';
import Toast from '@/components/ui/Toast';

// Создаем контекст
const ToastContext = createContext();

/**
 * Провайдер для управления уведомлениями
 * @param {Object} props - Свойства компонента
 * @param {React.ReactNode} props.children - Дочерние компоненты
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Добавить новое уведомление
   * @param {string} message - Текст уведомления
   * @param {string} type - Тип уведомления (success, error, info)
   * @param {number} duration - Длительность отображения в миллисекундах
   */
  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    return id;
  };

  /**
   * Удалить уведомление по ID
   * @param {number} id - ID уведомления
   */
  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  /**
   * Добавить уведомление об успехе
   * @param {string} message - Текст уведомления
   * @param {number} duration - Длительность отображения в миллисекундах
   */
  const showSuccess = (message, duration = 3000) => {
    return addToast(message, 'success', duration);
  };

  /**
   * Добавить уведомление об ошибке
   * @param {string} message - Текст уведомления
   * @param {number} duration - Длительность отображения в миллисекундах
   */
  const showError = (message, duration = 4000) => {
    return addToast(message, 'error', duration);
  };

  /**
   * Добавить информационное уведомление
   * @param {string} message - Текст уведомления
   * @param {number} duration - Длительность отображения в миллисекундах
   */
  const showInfo = (message, duration = 3000) => {
    return addToast(message, 'info', duration);
  };

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo, removeToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * Хук для использования уведомлений в компонентах
 * @returns {Object} Объект с функциями для отображения уведомлений
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast должен использоваться внутри ToastProvider');
  }
  return context;
};

export default ToastContext; 