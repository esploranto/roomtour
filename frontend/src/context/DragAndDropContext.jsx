import React, { createContext, useContext, useState, useRef } from 'react';

const DragAndDropContext = createContext();

export function DragAndDropProvider({ children }) {
  const [isDragging, setIsDragging] = useState(false);
  const [onDropCallback, setOnDropCallback] = useState(null);
  const dragCounter = useRef(0);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    console.log('Получены файлы в handleDrop:', e.dataTransfer.files);
    console.log('Колбэк существует:', !!onDropCallback);
    
    if (!onDropCallback) {
      console.log('Нет колбэка для обработки файлов');
      return;
    }
    
    if (!e.dataTransfer.files?.length) {
      console.log('Нет файлов для обработки');
      return;
    }
    
    console.log('Вызываем колбэк с файлами');
    onDropCallback(e.dataTransfer.files);
  };

  return (
    <DragAndDropContext.Provider value={{ 
      isDragging,
      setIsDragging,
      setOnDropCallback
    }}>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="min-h-screen"
      >
        {isDragging && (
          <div className="fixed inset-0 bg-blue-500 bg-opacity-10 pointer-events-none z-50 border-2 border-blue-500 border-dashed dialog-drag-overlay" />
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
