import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { format } from "date-fns";
import { X } from "lucide-react";
import * as Dialog from '@radix-ui/react-dialog';
import { AuthContext } from "@/context/AuthContext";
import { placesService } from "@/api";
import { usePlaces } from "@/lib/hooks";
import { useToast } from "@/context/ToastContext";
import { useDragAndDrop } from '@/context/DragAndDropContext';
import { parseDateRange } from '@/lib/utils.ts';
import PhotoUploadArea from './PhotoUploadArea';
import PlaceForm from './PlaceForm';

// Хук для определения размера экрана
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  useEffect(() => {
    // Обработчик изменения размера окна
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      
      // Вызывем обработчик сразу, чтобы установить начальное значение
      handleResize();
      
      // Очистка событий при размонтировании
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  return windowSize;
}

export default function AddPlacePopup({ isOpen, onClose, onPlaceAdded, onPlaceUpdated, place }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { setOnDropCallback, setAcceptsFiles, setAcceptedFileTypes } = useDragAndDrop();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [deletedPhotos, setDeletedPhotos] = useState([]);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [initialFormState, setInitialFormState] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const nameInputRef = useRef(null);
  const { showSuccess, showError } = useToast();
  const { mutate } = usePlaces();
  const isEditMode = Boolean(place);
  const isFirstRender = useRef(true);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  // Обработчик добавления фотографий - определяем как функцию, а не useCallback
  function processAddPhotos(newFiles) {
    if (!newFiles || newFiles.length === 0) return;
    
    console.log("Получены файлы для загрузки:", newFiles);
    
    // Проверяем, не превышает ли общее количество фото максимальное число (50)
    if (photos.length + newFiles.length > 50) {
      showError('Максимальное количество фотографий: 50');
      return;
    }
    
    try {
      // Фильтруем файлы, которые уже есть в списке
      const uniqueNewFiles = newFiles.filter(file => {
        // Проверяем, является ли объект файлом
        if (!(file instanceof File)) {
          console.warn('Объект не является файлом:', file);
          return false;
        }
        
        const isDuplicate = photos.some(photo => {
          if (photo.file instanceof File) {
            return photo.file.name === file.name && 
                   photo.file.size === file.size;
          }
          return false;
        });
        return !isDuplicate;
      });
      
      console.log("Уникальные файлы для добавления:", uniqueNewFiles);
      
      // Добавляем только новые файлы
      if (uniqueNewFiles.length > 0) {
        const newPhotos = uniqueNewFiles.map(file => ({
          id: Date.now() + '_' + Math.random().toString(36).substring(2, 9),
          file,
          preview: URL.createObjectURL(file),
          isNew: true
        }));
        
        setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
        setFormChanged(true);
      }
    } catch (err) {
      console.error("Ошибка при добавлении фото:", err);
      showError('Ошибка при добавлении фото: ' + err.message);
    }
  }
  
  // Оборачиваем нашу функцию в useCallback для оптимизации
  const handleAddPhotos = useCallback((files) => processAddPhotos(files), [photos.length, showError]);

  // Настраиваем глобальное перетаскивание файлов
  useEffect(() => {
    // Определяем обработчик файлов в useEffect, чтобы избежать циклической зависимости
    function handleFiles(files) {
      if (files && files.length > 0) {
        console.log('AddPlacePopup: получены файлы из контекста drag-and-drop', files.length);
        processAddPhotos(files);
      }
    }
    
    if (isOpen) {
      console.log('AddPlacePopup: форма открыта, включаем прием файлов');
      // Включаем прием файлов при открытии формы
      setAcceptsFiles(true);
      // Устанавливаем принимаемые типы файлов (только изображения)
      setAcceptedFileTypes(['image/*']);
      // Устанавливаем колбэк для обработки перетаскиваемых файлов
      setOnDropCallback(handleFiles);
    }
    
    // Очищаем при закрытии
    return () => {
      console.log('AddPlacePopup: форма закрыта или размонтирована, отключаем прием файлов');
      setAcceptsFiles(false);
      setOnDropCallback(null);
    };
  }, [isOpen, setAcceptsFiles, setAcceptedFileTypes, setOnDropCallback]);

  // Устанавливаем фокус на поле "Название" только при первом рендере пустой формы
  useEffect(() => {
    if (isOpen && !isEditMode && isFirstRender.current) {
      // Проверка на наличие данных в localStorage
      const wasFormPreviouslyFilled = localStorage.getItem('addPlaceForm') !== null;
      
      // Проверка текущего состояния формы
      const isFormCurrentlyEmpty = 
        name === "" && 
        address === "" && 
        comment === "" && 
        rating === 0 && 
        photos.length === 0 &&
        startDate === null &&
        endDate === null &&
        !hasAttemptedSubmit;
      
      // Устанавливаем фокус только если форма никогда не заполнялась И сейчас пуста
      if (!wasFormPreviouslyFilled && isFormCurrentlyEmpty) {
        // Используем большую задержку для гарантированной установки фокуса
        setTimeout(() => {
          if (nameInputRef.current) {
            nameInputRef.current.focus();
          } else {
            // Запасной вариант через DOM API
            const nameInput = document.getElementById('name');
            if (nameInput) {
              nameInput.focus();
            }
          }
        }, 500);
      }
      
      // Сбрасываем флаг первого рендера
      isFirstRender.current = false;
    }
    
    // При закрытии формы сбрасываем флаг первого рендера
    if (!isOpen) {
      isFirstRender.current = true;
    }
  }, [isOpen, isEditMode, name, address, comment, rating, photos, startDate, endDate, hasAttemptedSubmit]);

  // Восстанавливаем форму из localStorage, если нужно
  useEffect(() => {
    if (isOpen) {
      // Восстанавливаем форму из localStorage только если:
      // 1. Это режим редактирования ИЛИ
      // 2. Была попытка добавления и пользователь закрыл форму
      const savedForm = localStorage.getItem('addPlaceForm');
      const wasAttemptedSubmit = localStorage.getItem('addPlaceAttemptedSubmit') === 'true';
      
      if (savedForm && (isEditMode || wasAttemptedSubmit) && !formChanged) {
        try {
          const parsedForm = JSON.parse(savedForm);
          setName(parsedForm.name || "");
          setAddress(parsedForm.address || "");
          setComment(parsedForm.comment || "");
          setRating(parsedForm.rating || 0);
          
          if (parsedForm.startDate) {
            setStartDate(new Date(parsedForm.startDate));
          }
          if (parsedForm.endDate) {
            setEndDate(new Date(parsedForm.endDate));
          }
          
          setInitialFormState({
            name: parsedForm.name || "",
            address: parsedForm.address || "",
            comment: parsedForm.comment || "",
            rating: parsedForm.rating || 0,
            startDate: parsedForm.startDate ? new Date(parsedForm.startDate) : null,
            endDate: parsedForm.endDate ? new Date(parsedForm.endDate) : null,
          });
          
          setHasAttemptedSubmit(wasAttemptedSubmit);
        } catch (e) {
          console.error('Ошибка при восстановлении формы:', e);
          localStorage.removeItem('addPlaceForm');
          localStorage.removeItem('addPlaceAttemptedSubmit');
        }
      }
    }
  }, [isOpen, isEditMode, formChanged]);

  // Сохраняем форму в localStorage при изменениях
  useEffect(() => {
    if (isOpen) {
      const hasChanges = 
        name !== "" || 
        address !== "" || 
        comment !== "" || 
        rating !== 0 || 
        photos.length > 0 ||
        startDate !== null ||
        endDate !== null;
      
      setFormChanged(hasChanges);
      
      // Сохраняем в localStorage только если была попытка добавления места
      if (hasChanges && hasAttemptedSubmit) {
        const formState = {
          name,
          address,
          comment,
          rating,
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null,
        };
        localStorage.setItem('addPlaceForm', JSON.stringify(formState));
        localStorage.setItem('addPlaceAttemptedSubmit', 'true');
      }
    }
  }, [name, address, comment, rating, photos, startDate, endDate, isOpen, hasAttemptedSubmit]);

  // Обработчик удаления фотографии
  const handleDeletePhoto = (index) => {
    // Получаем фото, которое нужно удалить
    const photoToDelete = photos[index];
    if (!photoToDelete) return;
    
    console.log('[DEBUG] Удаление фото:', index, photoToDelete);
    
    // Если это существующее фото с сервера (имеет числовой ID или строковый без подчеркивания)
    const isExistingServerPhoto = photoToDelete._id || 
      (photoToDelete.id && (typeof photoToDelete.id === 'number' || (typeof photoToDelete.id === 'string' && !photoToDelete.id.includes('_'))));
      
    if (isExistingServerPhoto) {
      setDeletedPhotos(prev => [...prev, photoToDelete]);
      setPhotos(prev => prev.filter((_, i) => i !== index));
    } 
    // Если это новое фото
    else {
      setPhotos(prev => {
        const newPhotos = [...prev];
        const deletedPhoto = newPhotos.splice(index, 1)[0];
        if (deletedPhoto && deletedPhoto.preview) {
          URL.revokeObjectURL(deletedPhoto.preview);
        }
        return newPhotos;
      });
    }
    
    setFormChanged(true);
  };

  // Обработчик восстановления фотографии
  const handleRestorePhoto = (index) => {
    // Получаем фото, которое нужно восстановить
    const photoToRestore = deletedPhotos[index];
    if (!photoToRestore) return;
    
    console.log('[DEBUG] Восстановление фото:', index, photoToRestore);
    
    // Проверяем, не превышает ли общее количество фото максимальное число
    if (photos.length >= 50) {
      showError('Максимальное количество фотографий: 50');
      return;
    }
    
    // Добавляем фото обратно в основной список
    setPhotos(prev => [...prev, photoToRestore]);
    
    // Удаляем из списка удаленных фото
    setDeletedPhotos(prev => prev.filter((_, i) => i !== index));
    
    setFormChanged(true);
  };

  // Обработчик изменения порядка фотографий
  const handleReorderPhotos = (fromIndex, toIndex) => {
    setPhotos(prevPhotos => {
      const result = [...prevPhotos];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
    
    setFormChanged(true);
  };

  const isFormValid = 
    name.trim() !== "" || 
    address.trim() !== "" || 
    comment.trim() !== "" || 
    rating > 0 || 
    photos.length > 0 ||
    startDate !== null ||
    endDate !== null;

  const resetForm = () => {
    setName("");
    setAddress("");
    setComment("");
    setStartDate(null);
    setEndDate(null);
    photos.forEach(photo => photo.preview && URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    setRating(0);
    setError(null);
    setShowMap(false);
    setFormChanged(false);
    setHasAttemptedSubmit(false);
    
    // Очищаем localStorage полностью только если не в режиме редактирования
    if (!isEditMode) {
      localStorage.removeItem('addPlaceForm');
      localStorage.removeItem('addPlaceAttemptedSubmit');
    }
  };

  const safelyCloseForm = () => {
    if (formChanged) {
      onClose();
    } else {
      resetForm();
      onClose();
    }
  };

  const handleCancel = () => {
    if (formChanged) {
      if (window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите закрыть форму?')) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (loading) return;
    
    setLoading(true);
    setError(null);
    setHasAttemptedSubmit(true);
    
    try {
      // Подготавливаем данные места
      const placeData = {
        name: name.trim() || "Без названия",
        location: address.trim() || "Без адреса",
        review: comment.trim(),
        rating: rating || null
      };

      // Если есть даты, форматируем их
      if (startDate && endDate) {
        // Используем прямой формат дат DD.MM.YYYY для надежности
        placeData.dates = `${format(startDate, 'dd.MM.yyyy')} – ${format(endDate, 'dd.MM.yyyy')}`;
        console.log("[DEBUG] Сохраняем диапазон дат:", placeData.dates);
      }

      let updatedPlace;
      
      if (isEditMode) {
        // Добавляем ID удаленных фотографий
        if (deletedPhotos.length > 0) {
          // Фильтруем только числовые ID фотографий с сервера (исключаем временные ID новых фото)
          const serverDeletedIds = deletedPhotos
            .map(photo => photo.id)
            .filter(id => typeof id === 'number');
          
          console.log('[DEBUG] ID фотографий для удаления (только числовые):', serverDeletedIds);
          
          if (serverDeletedIds.length > 0) {
            placeData.deleted_image_ids = serverDeletedIds;
          }
        }
        
        // Обновляем место
        console.log('[DEBUG] Отправляем запрос на обновление места:', placeData);
        updatedPlace = await placesService.updatePlace(place.slug || place.id, placeData);
        console.log('[DEBUG] Место после обновления:', updatedPlace);
        
        // Загружаем новые фотографии, если они есть
        const newPhotos = photos.filter(photo => photo.file && (!photo.id || typeof photo.id === 'string')); 
        console.log('[DEBUG] Общее количество фотографий:', photos.length);
        console.log('[DEBUG] Новые фотографии для загрузки:', newPhotos.length);
        
        if (newPhotos.length > 0) {
          const formData = new FormData();
          let photosAdded = 0;
          
          newPhotos.forEach((photo, index) => {
            if (photo.file instanceof File) {
              console.log(`[DEBUG] Добавляем файл ${index + 1}:`, photo.file.name);
              formData.append('images', photo.file);
              photosAdded++;
            }
          });
          
          if (photosAdded > 0) {
            console.log('[DEBUG] Отправляем запрос на загрузку изображений, всего файлов:', photosAdded);
            try {
              const uploadedImages = await placesService.uploadImages(place.slug || place.id, formData);
              console.log('[DEBUG] Результат загрузки изображений:', uploadedImages);
              
              // Перезагружаем место, чтобы получить актуальные данные
              updatedPlace = await placesService.getPlace(place.slug || place.id);
              console.log('[DEBUG] Место после загрузки изображений:', updatedPlace);
            } catch (uploadError) {
              console.error('[DEBUG] Ошибка при загрузке изображений:', uploadError);
            }
          }
        }
        
        // Обновляем порядок фотографий если есть фото с сервера (с числовыми ID)
        const serverPhotoIds = photos
          .map(photo => photo.id)
          .filter(id => typeof id === 'number');
        
        console.log('[DEBUG] ID фотографий на сервере для обновления порядка:', serverPhotoIds);
        
        if (serverPhotoIds.length > 0) {
          try {
            console.log('[DEBUG] Отправляем запрос на обновление порядка фото');
            const orderResult = await placesService.updateImageOrder(place.slug || place.id, serverPhotoIds);
            console.log('[DEBUG] Результат обновления порядка:', orderResult);
            
            // Загружаем финальное состояние места
            updatedPlace = await placesService.getPlace(place.slug || place.id);
          } catch (orderError) {
            console.error('[DEBUG] Ошибка при обновлении порядка фото:', orderError);
          }
        }
        
        console.log('[DEBUG] Финальное состояние места после всех операций:', updatedPlace);
        
        // Вызываем колбэк обновления
        if (onPlaceUpdated) {
          console.log('[DEBUG] Вызываем колбэк обновления с данными:', updatedPlace);
          onPlaceUpdated(updatedPlace);
        }
      } else {
        // Создаем новое место
        updatedPlace = await placesService.createPlace(placeData);
        console.log('[DEBUG] Создано новое место:', updatedPlace);
        
        // Загружаем фотографии для нового места
        if (photos.length > 0) {
          const formData = new FormData();
          let photosAdded = 0;
          
          photos.forEach(photo => {
            if (photo.file instanceof File) {
              formData.append('images', photo.file);
              photosAdded++;
            }
          });
          
          if (photosAdded > 0) {
            console.log('[DEBUG] Загружаем фото для нового места, всего:', photosAdded);
            try {
              const uploadedImages = await placesService.uploadImages(updatedPlace.slug || updatedPlace.id, formData);
              console.log('[DEBUG] Загруженные изображения для нового места:', uploadedImages);
              
              // Перезагружаем место для получения актуальных данных
              updatedPlace = await placesService.getPlace(updatedPlace.slug || updatedPlace.id);
            } catch (uploadError) {
              console.error('[DEBUG] Ошибка при загрузке изображений для нового места:', uploadError);
            }
          }
        }
        
        // Вызываем колбэк создания
        if (onPlaceAdded) {
          console.log('[DEBUG] Вызываем колбэк добавления с данными:', updatedPlace);
          onPlaceAdded(updatedPlace);
        }
      }

      // Обновляем кэш SWR
      mutate();
      
      // Показываем уведомление об успехе
      showSuccess(isEditMode ? 'Место успешно обновлено' : 'Место успешно добавлено');
      
      // Сбрасываем форму и закрываем попап
      resetForm();
      onClose();
      
      // Если это новое место, перенаправляем на его страницу
      if (!isEditMode && updatedPlace) {
        sessionStorage.setItem('fromAddPlace', 'true');
        navigate(`/${user.username}/${updatedPlace.slug || updatedPlace.id}?isNew=true`);
      }
    } catch (err) {
      console.error('Ошибка при сохранении места:', err);
      setError(err.message || 'Произошла ошибка при сохранении места');
      showError(err.message || 'Произошла ошибка при сохранении места');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isEditMode && place) {
      // Не загружаем заполнители в поля формы
      setName(place.name === 'Без названия' ? "" : (place.name || ""));
      setAddress(place.location === 'Без адреса' ? "" : (place.location || ""));
      setComment(place.review || "");
      setRating(place.rating || 0);
      
      let parsedStartDate = null;
      let parsedEndDate = null;
      
      if (place.dates) {
        [parsedStartDate, parsedEndDate] = parseDateRange(place.dates);
        
        setStartDate(parsedStartDate);
        setEndDate(parsedEndDate);
      }
      
      if (place.images && place.images.length > 0) {
        // Преобразуем существующие изображения в нужный формат
        const formattedImages = place.images.map(image => ({
          id: image.id || image._id,
          image_url: image.url || image.image_url,
          url: image.url || image.image_url,
          source: image.url || image.image_url,
          options: {
            type: 'local',
            metadata: {
              photoId: image.id || image._id
            }
          }
        }));
        setPhotos(formattedImages);
      }
      
      setInitialFormState({
        name: place.name === 'Без названия' ? "" : (place.name || ""),
        address: place.location === 'Без адреса' ? "" : (place.location || ""),
        comment: place.review || "",
        rating: place.rating || 0,
        startDate: parsedStartDate,
        endDate: parsedEndDate
      });
    }
  }, [isOpen, isEditMode, place]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/50 z-[900] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
        />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] max-h-[90vh] w-[90vw] max-w-[1200px] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden flex flex-col z-[1000]"
          onInteractOutside={(e) => {
            if (formChanged) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (formChanged) {
              e.preventDefault();
            }
          }}
          style={{ 
            height: isMobile ? 'auto' : '90vh',
            maxHeight: 'calc(100vh - 40px)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Dialog.Title className="text-xl font-bold p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-30">
            {isEditMode ? "Редактирование места" : "Добавление нового места"}
            <Dialog.Close asChild>
              <button 
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  safelyCloseForm();
                }}
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </Dialog.Close>
          </Dialog.Title>

          <form 
            className="flex-grow overflow-auto h-full flex flex-col" 
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
          >
            <div className={`flex-grow p-4 flex flex-col md:flex-row gap-4 ${isMobile ? 'overflow-auto' : 'overflow-hidden'}`} style={{ 
              height: isMobile ? 'auto' : 'calc(100% - 140px)'
            }}>
              {/* Левая колонка - форма */}
              <div className="w-full md:w-1/2 md:h-full overflow-visible px-2 mb-4 md:mb-0 order-1 md:order-1">
                <PlaceForm 
                  name={name}
                  setName={setName}
                  address={address}
                  setAddress={setAddress}
                  comment={comment}
                  setComment={setComment}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  rating={rating}
                  setRating={setRating}
                  showMap={showMap}
                  setShowMap={setShowMap}
                  nameInputRef={nameInputRef}
                />
              </div>

              {/* Правая колонка - фотографии */}
              <div className="w-full md:w-1/2 md:h-full overflow-visible relative z-20 px-2 flex order-2 md:order-2" style={{
                height: isMobile ? 'auto' : '100%',
                minHeight: isMobile ? '600px' : 'auto'
              }}>
                <PhotoUploadArea 
                  photos={photos}
                  deletedPhotos={deletedPhotos}
                  onAddPhotos={handleAddPhotos}
                  onDeletePhoto={handleDeletePhoto}
                  onRestorePhoto={handleRestorePhoto}
                  onReorderPhotos={handleReorderPhotos}
                  maxPhotos={50}
                />
              </div>
            </div>
          </form>

          <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end space-x-4">
            <Dialog.Close asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancel();
                  }}
                  disabled={loading}
                >
                  Отмена
                </Button>
              </Dialog.Close>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit();
                }}
                disabled={loading || !isFormValid}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    {isEditMode ? "Сохранение..." : "Добавление..."}
                  </>
                ) : (
                  isEditMode ? "Сохранить" : "Добавить место"
                )}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 