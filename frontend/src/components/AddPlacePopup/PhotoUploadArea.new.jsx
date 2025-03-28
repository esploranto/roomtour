import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X, RotateCcw } from 'lucide-react';
import './PhotoUploadArea.css';
import { useDragAndDrop } from '@/context/DragAndDropContext';

export default function PhotoUploadArea({
  photos = [],
  deletedPhotos = [],
  onAddPhotos,
  onDeletePhoto,
  onRestorePhoto,
  onReorderPhotos,
  maxPhotos = 10
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  
  const { isDraggingFile } = useDragAndDrop();
  
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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    console.log('Обработка события drop в PhotoUploadArea');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log(`Получены ${e.dataTransfer.files.length} файлов через drop-событие`);
      // Преобразуем FileList в массив для дальнейшей работы
      const files = Array.from(e.dataTransfer.files);
      
      // Фильтруем только изображения
      const imageFiles = files.filter(file => {
        const isImage = file.type.startsWith('image/');
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

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    onReorderPhotos(result.source.index, result.destination.index);
  };

  // Показываем пустое состояние, если нет фото и удаленных фото
  const isEmpty = photos.length === 0 && deletedPhotos.length === 0;
  
  // Вычисляем, можно ли добавлять еще фотографии
  const canAddMorePhotos = photos.length < maxPhotos;

  return (
    <div 
      className={`photo-upload-area ${isDragOver || isDraggingFile ? 'drag-over' : ''} ${isEmpty ? 'empty' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
          onDragEnd={handleDragEnd}
          canAddMorePhotos={canAddMorePhotos}
          onClick={handleButtonClick}
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
  onDragEnd, 
  canAddMorePhotos, 
  onClick 
}) {
  return (
    <div className="photo-grid-container">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="photos" direction="horizontal">
          {(provided) => (
            <div 
              className="photo-grid" 
              {...provided.droppableProps} 
              ref={provided.innerRef}
            >
              {photos.map((photo, index) => (
                <Draggable 
                  key={photo.id || `photo-${index}`} 
                  draggableId={photo.id?.toString() || `photo-${index}`} 
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      className={`photo-item ${snapshot.isDragging ? 'dragging' : ''}`}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
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
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

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
          )}
        </Droppable>
      </DragDropContext>

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