import React, { useEffect, useState, useRef } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import './PhotoUploadArea.css';

// Регистрируем плагины
registerPlugin(
  FilePondPluginImageExifOrientation,
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType
);

const PhotoUploadArea = ({ 
  photos = [], 
  deletedPhotos = [],
  onAddPhotos, 
  onDeletePhoto, 
  onRestorePhoto, 
  onReorderPhotos,
  maxPhotos = 10
}) => {
  const [files, setFiles] = useState([]);
  const filepondRef = useRef(null);
  
  // Получение источника для изображения
  const getImageSource = (photo) => {
    // Если фото уже есть на сервере и у него есть URL
    if (photo.url) {
      return photo.url;
    }
    
    // Если фото - это File объект из FormData
    if (photo.file instanceof File) {
      return photo.file;
    }
    
    // Если есть preview URL (для вновь загруженных фото)
    if (photo.preview) {
      return photo.preview;
    }
    
    // Если есть непосредственно file
    if (photo.file) {
      return photo.file;
    }
    
    // В крайнем случае возвращаем само фото (если это File объект)
    return photo;
  };
  
  // Подготовка файлов для FilePond
  useEffect(() => {
    const preparedFiles = photos.map(photo => ({
      source: getImageSource(photo),
      options: {
        type: 'local',
        metadata: {
          photoId: photo.id || photo._id
        }
      }
    }));
    
    setFiles(preparedFiles);
  }, [photos]);
  
  // Текст для лейбла в зависимости от наличия фотографий
  const labelIdleText = photos.length > 0 
    ? `Перетащите изображения сюда или <span class="filepond--label-action">Выберите</span> (осталось ${maxPhotos - photos.length} из ${maxPhotos})`
    : `Перетащите изображения сюда или <span class="filepond--label-action">Выберите</span> (до ${maxPhotos} фото)`;
    
  // Обработчик добавления файлов
  const handleFilesAdded = (fileItems) => {
    if (!fileItems || fileItems.length === 0 || !onAddPhotos) return;
    
    // Получаем только новые файлы, которые еще не были добавлены
    const newFiles = fileItems
      .map(fileItem => fileItem.file)
      .filter(file => {
        // Проверяем, что файл не существует среди текущих фото
        const exists = photos.some(photo => {
          if (photo.file instanceof File) {
            return photo.file.name === file.name && 
                   photo.file.size === file.size &&
                   photo.file.lastModified === file.lastModified;
          }
          return false;
        });
        return !exists;
      });
    
    if (newFiles.length > 0) {
      onAddPhotos(newFiles);
    }
  };
  
  // Обработчик удаления файла
  const handleFileRemove = (file, index, originalIndex) => {
    if (!onDeletePhoto) return;
    
    // Находим ID фото для удаления
    const photoToDelete = photos[originalIndex];
    if (photoToDelete) {
      onDeletePhoto(photoToDelete, originalIndex);
    }
    
    return true;
  };
  
  // Обработчик восстановления файла
  const handleFileRestore = (uniqueFileId) => {
    if (!onRestorePhoto) return;
    
    // Извлекаем индекс из ID
    const match = uniqueFileId.match(/filepond-(\d+)-/);
    if (match && match[1]) {
      const index = parseInt(match[1], 10);
      const photoToRestore = deletedPhotos.find((photo, i) => i === index);
      
      if (photoToRestore) {
        onRestorePhoto(photoToRestore, index);
      }
    }
  };
  
  // Обработчик изменения порядка файлов
  const handleFileReorder = (files, origin, target) => {
    if (!onReorderPhotos) return;
    
    onReorderPhotos(origin, target);
  };
  
  // Очистка URL объектов при размонтировании
  useEffect(() => {
    return () => {
      photos.forEach(photo => {
        if (photo.preview && typeof photo.preview === 'string') {
          URL.revokeObjectURL(photo.preview);
        }
      });
    };
  }, [photos]);
  
  return (
    <div className="photo-upload-container">
      <div className={`${photos.length > 0 ? 'upload-area-with-photos' : 'upload-area-empty'}`}>
        <div className={`${photos.length > 0 ? 'filepond-has-photos' : 'filepond-empty'}`}>
          <FilePond
            ref={filepondRef}
            files={files}
            onupdatefiles={() => {}}
            allowMultiple={true}
            maxFiles={maxPhotos}
            instantUpload={false}
            allowReorder={true}
            allowFileTypeValidation={true}
            acceptedFileTypes={['image/*']}
            labelIdle={labelIdleText}
            labelFileTypeNotAllowed="Только изображения"
            labelTapToCancel="Нажмите для отмены"
            labelTapToRetry="Нажмите для повтора"
            labelTapToUndo="Нажмите для отмены"
            labelButtonRemoveItem="Удалить"
            labelButtonAbortItemLoad="Отменить"
            labelButtonSubmitItemLoad="Загрузить"
            onaddfile={(err, file) => {
              if (!err && file) {
                handleFilesAdded([file]);
              }
            }}
            onremovefile={(file, origin, index) => {
              handleFileRemove(file, index, file.id);
            }}
            onrestorefile={(error, file, id) => {
              handleFileRestore(id);
            }}
            onreorderfiles={(files, origin, target) => {
              handleFileReorder(files, origin, target);
            }}
            credits={false}
          />
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadArea; 