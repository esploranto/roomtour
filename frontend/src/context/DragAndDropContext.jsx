import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const DragAndDropContext = createContext();

export function DragAndDropProvider({ children }) {
  const [isDragging, setIsDragging] = useState(false);
  const [onDropCallback, setOnDropCallback] = useState(null);
  const [acceptsFiles, setAcceptsFiles] = useState(true); // По умолчанию принимаем файлы
  const [acceptedFileTypes, setAcceptedFileTypes] = useState(['image/*']);
  const dragCounter = useRef(0);

  // Обновляем класс body при изменении isDragging
  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('drag-over');
    } else {
      document.body.classList.remove('drag-over');
    }
    
    // Очистка при размонтировании
    return () => {
      document.body.classList.remove('drag-over');
    };
  }, [isDragging]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Увеличиваем счетчик перетаскиваний
    dragCounter.current++;
    
    // Проверяем, что перетаскиваются файлы нужного типа
    if (e.dataTransfer.types.includes('Files') && acceptsFiles) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Устанавливаем иконку перетаскивания как копирование
    if (acceptsFiles) {
      e.dataTransfer.dropEffect = 'copy';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Уменьшаем счетчик перетаскиваний
    dragCounter.current--;
    
    // Если счетчик стал 0, скрываем индикатор перетаскивания
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Сбрасываем состояние перетаскивания и счетчик
    setIsDragging(false);
    dragCounter.current = 0;
    
    // Проверяем, что есть функция обратного вызова и принимаем файлы
    if (!onDropCallback || !acceptsFiles) {
      return;
    }
    
    // Проверяем наличие файлов
    if (!e.dataTransfer.files?.length) {
      return;
    }
    
    // Фильтруем файлы по типу, если указаны принимаемые типы
    let files = Array.from(e.dataTransfer.files);
    
    if (acceptedFileTypes.length > 0 && acceptedFileTypes[0] !== '*') {
      files = files.filter(file => {
        return acceptedFileTypes.some(type => {
          // Обработка wildcard типов, например 'image/*'
          if (type.endsWith('/*')) {
            const mainType = type.split('/')[0];
            return file.type.startsWith(`${mainType}/`);
          }
          return file.type === type;
        });
      });
    }
    
    // Если остались файлы после фильтрации, вызываем колбэк
    if (files.length > 0) {
      onDropCallback(files);
    }
  };

  return (
    <DragAndDropContext.Provider value={{ 
      isDragging,
      setIsDragging,
      setOnDropCallback,
      setAcceptsFiles,
      setAcceptedFileTypes,
      acceptsFiles,
      acceptedFileTypes
    }}>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="min-h-screen"
      >
        {isDragging && acceptsFiles && (
          <div className="global-drop-overlay">
            <div className="global-drop-overlay__content">
              Отпустите файлы для загрузки
            </div>
          </div>
        )}
        {children}
      </div>
    </DragAndDropContext.Provider>
  );
}

export function useDragAndDrop() {
  const context = useContext(DragAndDropContext);
  if (!context) {
    throw new Error('useDragAndDrop must be used within a DragAndDropProvider');
  }
  return context;
}
