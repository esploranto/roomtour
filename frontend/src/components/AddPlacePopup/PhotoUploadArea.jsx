import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, RotateCcw, GripVertical } from 'lucide-react';
import './PhotoUploadArea.css';
import { useDragAndDrop } from '@/context/DragAndDropContext';

export default function PhotoUploadArea({
  photos = [],
  deletedPhotos = [],
  onAddPhotos,
  onDeletePhoto,
  onRestorePhoto,
  onReorderPhotos,
  maxPhotos = 50
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  
  const { 
    isDraggingFile,
    setIsDraggingFile,
    acceptsFiles,
    acceptedFileTypes,
    isFileTypeAccepted
  } = useDragAndDrop();
  
  // Установка обработчиков событий drag-and-drop
  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    };
    
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingFile(true);
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setIsDraggingFile(false);
      
      console.log('Обработка события drop в PhotoUploadArea');
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        console.log(`Получены ${e.dataTransfer.files.length} файлов через drop-событие`);
        
        // Преобразуем FileList в массив для дальнейшей работы
        const files = Array.from(e.dataTransfer.files);
        
        // Фильтруем только изображения
        const imageFiles = files.filter(file => {
          const isImage = isFileTypeAccepted(file);
          if (!isImage) {
            console.log(`Файл ${file.name} не является изображением (${file.type})`);
          }
          return isImage;
        });
        
        console.log(`Отфильтровано ${imageFiles.length} файлов изображений`);
        
        if (imageFiles.length > 0) {
          onAddPhotos(imageFiles);
        }
      }
    };
    
    // Добавляем обработчики на всю страницу, чтобы можно было перетаскивать файлы куда угодно
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('drop', handleDrop);
    
    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('drop', handleDrop);
    };
  }, [setIsDraggingFile, isFileTypeAccepted, onAddPhotos]);

  const handleFileInputChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      console.log(`Выбрано ${files.length} файлов через input`);
      onAddPhotos(files);
      // Сбрасываем значение input для возможности повторного выбора тех же файлов
      e.target.value = '';
    }
  };

  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Обработчики для перетаскивания и сортировки фото
  const handlePhotoOnDragStart = (index) => {
    setDraggedItem(index);
  };

  const handlePhotoOnDragEnter = (index) => {
    setDragOverItem(index);
  };

  const handlePhotoOnDragEnd = () => {
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      onReorderPhotos(draggedItem, dragOverItem);
    }
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Показываем пустое состояние, если нет фото и удаленных фото
  const isEmpty = photos.length === 0 && deletedPhotos.length === 0;
  
  // Вычисляем, можно ли добавлять еще фотографии
  const canAddMorePhotos = photos.length < maxPhotos;

  return (
    <div 
      className={`photo-upload-area ${isDragOver || isDraggingFile ? 'drag-over' : ''} ${isEmpty ? 'empty' : ''}`}
      onClick={(e) => {
        // Предотвращаем всплытие клика только если клик на контейнер, а не на дочерние элементы
        if (e.target.classList.contains('photo-upload-area') || 
            e.target.classList.contains('photo-upload-area-empty')) {
          e.stopPropagation();
          handleButtonClick(e);
        }
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        multiple
        className="hidden-file-input"
        style={{ display: 'none' }}
        onClick={(e) => e.stopPropagation()}
      />

      {isEmpty ? (
        <EmptyState 
          canAddMorePhotos={canAddMorePhotos} 
          maxPhotos={maxPhotos} 
          onClick={handleButtonClick}
          isDragging={isDragOver || isDraggingFile}
        />
      ) : (
        <PhotoGrid 
          photos={photos}
          deletedPhotos={deletedPhotos}
          onDeletePhoto={onDeletePhoto}
          onRestorePhoto={onRestorePhoto}
          canAddMorePhotos={canAddMorePhotos}
          onClick={handleButtonClick}
          onDragStart={handlePhotoOnDragStart}
          onDragEnter={handlePhotoOnDragEnter}
          onDragEnd={handlePhotoOnDragEnd}
          draggedItem={draggedItem}
          dragOverItem={dragOverItem}
        />
      )}
    </div>
  );
}

function EmptyState({ canAddMorePhotos, maxPhotos, onClick, isDragging }) {
  return (
    <div 
      className={`photo-upload-area-empty ${isDragging ? 'dragging' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (canAddMorePhotos) {
          onClick(e);
        }
      }}
    >
      {canAddMorePhotos ? (
        <>
          <div className="upload-icon">
            <Plus className="w-8 h-8" />
          </div>
          <div className="upload-text">
            <p className="main-text">Добавьте фото</p>
            <p className="sub-text">Нажмите здесь или перетащите фото</p>
          </div>
        </>
      ) : (
        <div className="upload-text">
          <p className="main-text">Максимум {maxPhotos} фото</p>
          <p className="sub-text">Удалите существующие фото, чтобы добавить новые</p>
        </div>
      )}
    </div>
  );
}

function PhotoGrid({ 
  photos, 
  deletedPhotos, 
  onDeletePhoto, 
  onRestorePhoto, 
  canAddMorePhotos, 
  onClick,
  onDragStart,
  onDragEnter,
  onDragEnd,
  draggedItem,
  dragOverItem
}) {
  return (
    <div className="photo-grid-container">
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div
            key={photo.id || `photo-${index}`}
            className={`photo-item ${draggedItem === index ? 'dragging' : ''} ${dragOverItem === index ? 'drag-over-item' : ''}`}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnter={() => onDragEnter(index)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={onDragEnd}
          >
            <div className="photo-preview">
              <img 
                src={photo.preview || photo.url || photo.image_url || photo.source} 
                alt={`Фото ${index + 1}`} 
                className="img-preview"
              />
              <button 
                className="delete-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeletePhoto(photo, index);
                }}
                title="Удалить фото"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="drag-handle">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="photo-index">{index + 1}</div>
            </div>
          </div>
        ))}

        {canAddMorePhotos && (
          <div 
            className="add-photo-btn" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClick(e);
            }}
          >
            <Plus className="w-6 h-6" />
          </div>
        )}
      </div>

      {deletedPhotos.length > 0 && (
        <div className="deleted-photos-container">
          <h3 className="deleted-photos-title">Удаленные фото</h3>
          <div className="deleted-photos-grid">
            {deletedPhotos.map((photo, index) => (
              <div className="deleted-photo-item" key={`deleted-${photo.id || index}`}>
                <div className="photo-preview deleted">
                  <img 
                    src={photo.preview || photo.url || photo.image_url || photo.source} 
                    alt={`Удаленное фото ${index + 1}`} 
                    className="img-preview"
                  />
                  <button 
                    className="restore-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRestorePhoto(photo, index);
                    }}
                    title="Восстановить фото"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 