import React, { useState, useEffect, useCallback, useRef } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, RotateCcw, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import './PhotoUploadArea.css';

// Заглушка для недоступных изображений
const FALLBACK_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22286%22%20height%3D%22180%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20286%20180%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_17ed57ea7f6%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A14pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_17ed57ea7f6%22%3E%3Crect%20width%3D%22286%22%20height%3D%22180%22%20fill%3D%22%23999%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22107.1953125%22%20y%3D%2296.3%22%3E286x180%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';

// Максимальное количество фото
const MAX_PHOTOS = 100;

// Сортируемый элемент фото
const SortablePhotoItem = ({id, url, index, onDelete}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`photo-item ${isDragging ? 'dragging' : ''}`}
    >
      <div className="photo-preview">
        <img src={url} alt={`Фото ${index + 1}`} />
        <div className="photo-controls">
          <button
            className="delete-photo"
            onClick={onDelete}
          >
            <X size={16} />
          </button>
          <div {...attributes} {...listeners} className="drag-handle">
            <GripVertical size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

const PhotoUploadArea = ({ 
  photos = [], 
  deletedPhotos = [],
  onAddPhotos, 
  onDeletePhoto, 
  onRestorePhoto, 
  onReorderPhotos,
  maxPhotos = MAX_PHOTOS
}) => {
  const [photoItems, setPhotoItems] = useState([]);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Настройка сенсоров для DndContext
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );
  
  // Проверка доступности изображения
  const checkImageExists = async (url) => {
    return new Promise((resolve) => {
      if (!url || url.startsWith('data:')) {
        resolve(false);
        return;
      }
      
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      
      // Таймаут на случай, если изображение не загружается долго
      setTimeout(() => resolve(false), 5000);
    });
  };
  
  // Подготовка фотографий для отображения
  useEffect(() => {
    console.log('PhotoUploadArea: Обновление photos:', photos);
    
    const preparePhotos = async () => {
      const preparedItems = await Promise.all(
        photos.map(async (photo, index) => {
          let imageUrl;
          let photoId = photo.id || photo._id || `new-${index}`;
          
          // Для новых файлов (загруженных пользователем)
          if (photo instanceof File || (photo.file instanceof File)) {
            imageUrl = URL.createObjectURL(photo instanceof File ? photo : photo.file);
            return { id: photoId, url: imageUrl, isNewFile: true, originalIndex: index };
          }
          
          // Для существующих фотографий с сервера
          imageUrl = photo.url || photo.image_url || photo.source;
          
          if (!imageUrl) {
            console.warn('Отсутствует URL для фото:', photo);
            imageUrl = FALLBACK_IMAGE;
          }
          
          // Проверяем, является ли URL относительным, и если да, формируем абсолютный URL
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:')) {
            // Предполагаем, что это относительный путь, добавляем базовый URL сервера
            const baseUrl = window.location.origin;
            imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
          }
          
          // Проверяем доступность изображения
          const imageExists = await checkImageExists(imageUrl);
          if (!imageExists) {
            console.warn('Изображение недоступно, используем заглушку:', imageUrl);
            imageUrl = FALLBACK_IMAGE;
          }

          return { id: photoId, url: imageUrl, originalIndex: index };
        })
      );

      console.log('PhotoUploadArea: Подготовленные фото:', preparedItems);
      setPhotoItems(preparedItems);
    };
    
    preparePhotos();
  }, [photos]);

  // Очистка URL объектов при размонтировании
  useEffect(() => {
    return () => {
      photoItems.forEach(item => {
        if (item.url && item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [photoItems]);

  // Настройка глобального обработчика перетаскивания файлов
  useEffect(() => {
    // Обработчики событий перетаскивания на уровне документа
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!isDragOver) {
        setIsDragOver(true);
      }
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Проверяем, что курсор вышел за пределы окна
      const rect = document.documentElement.getBoundingClientRect();
      if (
        e.clientX <= rect.left ||
        e.clientX >= rect.right ||
        e.clientY <= rect.top ||
        e.clientY >= rect.bottom
      ) {
        setIsDragOver(false);
      }
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter(
          file => file.type.startsWith('image/')
        );
        
        if (files.length > 0) {
          // Проверяем, не превышен ли лимит
          if (photos.length + files.length > maxPhotos) {
            alert(`Превышен лимит количества фотографий. Максимум: ${maxPhotos}.`);
            return;
          }
          
          onAddPhotos(files);
        }
      }
    };
    
    // Добавляем глобальные обработчики событий
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    
    // Очистка обработчиков при размонтировании
    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, [isDragOver, onAddPhotos, photos.length, maxPhotos]);

  // Обработчик выбора файлов
  const handleFileSelect = useCallback((event) => {
    const files = Array.from(event.target.files).filter(
      file => file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      // Проверяем, не превышен ли лимит
      if (photos.length + files.length > maxPhotos) {
        alert(`Превышен лимит количества фотографий. Максимум: ${maxPhotos}.`);
        return;
      }
      
      onAddPhotos(files);
    }
    
    // Сбрасываем значение input, чтобы можно было выбрать те же файлы повторно
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onAddPhotos, photos.length, maxPhotos]);

  // Обработчик drag-and-drop
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const activeIndex = photoItems.findIndex(item => item.id === active.id);
      const overIndex = photoItems.findIndex(item => item.id === over.id);
      
      // Вызываем функцию для обновления порядка фотографий в родительском компоненте
      onReorderPhotos(activeIndex, overIndex);
    }
  }, [photoItems, onReorderPhotos]);

  // Пустое состояние
  const EmptyState = () => (
    <div 
      className={`empty-upload-area ${isDragOver ? 'drag-over' : ''}`}
      ref={dropZoneRef}
    >
      <div className="empty-upload-text">
        Перетащите фото в любое место браузера
      </div>
      <Button 
        className="select-photos-button"
        onClick={() => fileInputRef.current?.click()}
      >
        Выбрать фото
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        className="hidden"
        style={{ display: 'none' }}
      />
    </div>
  );

  // Состояние с фотографиями
  const PhotoGrid = () => (
    <div className="photo-grid-container">
      <div className="photo-upload-header">
        <span>Фотографии ({photoItems.length}/{maxPhotos})</span>
        <Button 
          className="add-more-photos-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={photoItems.length >= maxPhotos}
        >
          Добавить еще
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          multiple
          className="hidden"
          style={{ display: 'none' }}
        />
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={photoItems.map(item => item.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="photo-grid">
            {photoItems.map((item, index) => (
              <SortablePhotoItem
                key={item.id}
                id={item.id}
                url={item.url}
                index={index}
                onDelete={() => onDeletePhoto(photos[item.originalIndex], item.originalIndex)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {deletedPhotos.length > 0 && (
        <div className="deleted-photos-section">
          <h4>Удаленные фотографии</h4>
          <div className="deleted-photos-grid">
            {deletedPhotos.map((photo, index) => (
              <div key={`deleted-${photo.id || index}`} className="deleted-photo-item">
                <img 
                  src={photo.url || photo.image_url || FALLBACK_IMAGE} 
                  alt={`Удаленное фото ${index + 1}`} 
                />
                <button
                  className="restore-photo"
                  onClick={() => onRestorePhoto(photo, index)}
                >
                  <RotateCcw size={16} />
                  <span>Восстановить</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`photo-upload-container ${isDragOver ? 'drag-over-global' : ''}`}>
      <div className={`${photoItems.length > 0 ? 'upload-area-with-photos' : 'upload-area-empty'}`}>
        {photoItems.length === 0 ? <EmptyState /> : <PhotoGrid />}
      </div>
      
      {/* Визуальный индикатор перетаскивания для всего окна */}
      {isDragOver && (
        <div className="global-drop-indicator">
          <div className="drop-indicator-content">
            <span>Отпустите для загрузки фотографий</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUploadArea; 