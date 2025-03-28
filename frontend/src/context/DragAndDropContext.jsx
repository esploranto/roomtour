import React, { createContext, useContext, useState, useCallback } from 'react';

// Создаем контекст для drag-and-drop
const DragAndDropContext = createContext({
  isDraggingFile: false,
  setAcceptsFiles: () => {},
  setAcceptedFileTypes: () => {},
  setOnDropCallback: () => {},
});

export function DragAndDropProvider({ children }) {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [acceptsFiles, setAcceptsFiles] = useState(false);
  const [acceptedFileTypes, setAcceptedFileTypes] = useState(['*/*']);
  const [onDropCallback, setOnDropCallback] = useState(null);

  const isFileTypeAccepted = useCallback((file) => {
    // Если принимаются все типы файлов
    if (acceptedFileTypes.includes('*/*')) return true;
    
    // Если это изображение и мы принимаем изображения
    if (file.type.startsWith('image/') && acceptedFileTypes.includes('image/*')) {
      return true;
    }
    
    // Точное совпадение MIME-типа
    return acceptedFileTypes.includes(file.type);
  }, [acceptedFileTypes]);

  return (
    <DragAndDropContext.Provider
      value={{
        isDraggingFile,
        setIsDraggingFile,
        setAcceptsFiles,
        setAcceptedFileTypes,
        setOnDropCallback,
        acceptsFiles,
        acceptedFileTypes,
        onDropCallback,
        isFileTypeAccepted
      }}
    >
      {children}
    </DragAndDropContext.Provider>
  );
}

export function useDragAndDrop() {
  return useContext(DragAndDropContext);
} 