import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

/**
 * Компонент для отображения всплывающих уведомлений
 * @param {Object} props - Свойства компонента
 * @param {string} props.type - Тип уведомления (success, error, info)
 * @param {string} props.message - Текст уведомления
 * @param {number} props.duration - Длительность отображения в миллисекундах
 * @param {Function} props.onClose - Функция, вызываемая при закрытии уведомления
 */
const Toast = ({ type = 'info', message, duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) setTimeout(onClose, 300); // Даем время для анимации
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) setTimeout(onClose, 300); // Даем время для анимации
  };

  // Определяем стили в зависимости от типа уведомления
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  // Определяем иконку в зависимости от типа уведомления
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg border shadow-lg transition-all duration-300 ${getTypeStyles()} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      role="alert"
    >
      <div className="flex items-center">
        <div className="mr-2">{getIcon()}</div>
        <div className="text-sm font-medium">{message}</div>
      </div>
      <button
        type="button"
        className="ml-4 inline-flex items-center justify-center rounded-md p-1 hover:bg-opacity-20 hover:bg-gray-500 focus:outline-none"
        onClick={handleClose}
        aria-label="Закрыть"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast; 