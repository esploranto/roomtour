import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Создаем контекст
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
  const dragCounter = React.useRef(0);

  // Проверяем, соответствует ли тип файла допустимым типам
  const isFileTypeAccepted = useCallback((file) => {
    // Если принимаются все типы файлов
    if (acceptedFileTypes.includes('*/*')) return true;
    
    // Проверка каждого файла на соответствие принимаемым MIME-типам
    return acceptedFileTypes.some(type => {
      // Обрабатываем подстановочные типы, например 'image/*'
      if (type.endsWith('/*')) {
        const mainType = type.split('/')[0];
        return file.type.startsWith(mainType + '/');
      }
      // Точное совпадение MIME-типа
      return file.type === type;
    });
  }, [acceptedFileTypes]);

  // Обработчик перетаскивания
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Обработчик начала перетаскивания
  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current++;
    
    // Проверяем, есть ли файлы в событии перетаскивания
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingFile(true);
    }
  }, []);

  // Обработчик выхода из зоны перетаскивания
  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current--;
    
    if (dragCounter.current === 0) {
      setIsDraggingFile(false);
    }
  }, []);

  // Обработчик сброса файлов
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('DragAndDropContext: handleDrop сработал');
    
    dragCounter.current = 0;
    setIsDraggingFile(false);
    
    // Проверяем, принимает ли компонент файлы и есть ли они в событии
    if (acceptsFiles && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log(`DragAndDropContext: получено ${e.dataTransfer.files.length} файлов`);
      
      // Преобразуем FileList в массив
      const files = Array.from(e.dataTransfer.files);
      
      // Фильтруем файлы по допустимым типам
      const acceptedFiles = files.filter(file => {
        const isAccepted = isFileTypeAccepted(file);
        if (!isAccepted) {
          console.log(`Файл ${file.name} не соответствует допустимым типам`);
        }
        return isAccepted;
      });
      
      console.log(`DragAndDropContext: отфильтровано ${acceptedFiles.length} файлов по типу`);
      
      // Вызываем коллбэк с отфильтрованными файлами, если он задан
      if (acceptedFiles.length > 0 && typeof onDropCallback === 'function') {
        console.log('DragAndDropContext: вызываем onDropCallback');
        onDropCallback(acceptedFiles);
      }
    }
  }, [acceptsFiles, isFileTypeAccepted, onDropCallback]);

  useEffect(() => {
    // Добавляем глобальные обработчики событий перетаскивания
    if (acceptsFiles) {
      console.log('DragAndDropContext: включен прием файлов');
      
      window.addEventListener('dragenter', handleDragIn);
      window.addEventListener('dragleave', handleDragOut);
      window.addEventListener('dragover', handleDrag);
      window.addEventListener('drop', handleDrop);
      
      return () => {
        window.removeEventListener('dragenter', handleDragIn);
        window.removeEventListener('dragleave', handleDragOut);
        window.removeEventListener('dragover', handleDrag);
        window.removeEventListener('drop', handleDrop);
      };
    } else {
      // Очищаем слушатели, если компонент не принимает файлы
      window.removeEventListener('dragenter', handleDragIn);
      window.removeEventListener('dragleave', handleDragOut);
      window.removeEventListener('dragover', handleDrag);
      window.removeEventListener('drop', handleDrop);
      
      // Сброс состояния
      dragCounter.current = 0;
      setIsDraggingFile(false);
    }
  }, [acceptsFiles, handleDrag, handleDragIn, handleDragOut, handleDrop]);

  return (
    <DragAndDropContext.Provider
      value={{
        isDraggingFile,
        setAcceptsFiles,
        setAcceptedFileTypes,
        setOnDropCallback,
      }}
    >
      {children}
    </DragAndDropContext.Provider>
  );
}

export function useDragAndDrop() {
  return useContext(DragAndDropContext);
} 