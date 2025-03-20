import React, { useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { format, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { X } from "lucide-react";
import * as Dialog from '@radix-ui/react-dialog';
import { AuthContext } from "@/context/AuthContext";
import { placesService } from "@/api";
import { usePlaces } from "@/lib/hooks";
import { useToast } from "@/context/ToastContext";
import { networkService } from '../../services/networkService';
import { queueService } from '../../services/queueService';
import { useDragAndDrop } from '@/context/DragAndDropContext';
import { isValidDate, parseDate, parseDateRange, formatDateRange } from '@/lib/utils.ts';
import PhotoUploadArea from './PhotoUploadArea';
import PlaceForm from './PlaceForm';
import { triggerNewPlaceConfetti } from "@/components/ui/confetti";

export default function AddPlacePopup({ isOpen, onClose, onPlaceAdded, onPlaceUpdated, place }) {
  console.log('AddPlacePopup рендерится с пропсами:', { isOpen, place });
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { setOnDropCallback } = useDragAndDrop();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [disabledPhotos, setDisabledPhotos] = useState({});
  const [deletedPhotos, setDeletedPhotos] = useState([]);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [initialFormState, setInitialFormState] = useState({});
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false);
  const [endDatePopoverOpen, setEndDatePopoverOpen] = useState(false);
  
  const { mutate } = usePlaces();
  
  const { showSuccess, showError } = useToast();

  const isEditMode = Boolean(place);

  useEffect(() => {
    if (isOpen) {
      const savedForm = localStorage.getItem('addPlaceForm');
      if (savedForm && !formChanged) {
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
        } catch (e) {
          console.error('Ошибка при восстановлении формы:', e);
          localStorage.removeItem('addPlaceForm');
        }
      }
    }
  }, [isOpen]);

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
      
      if (hasChanges) {
        const formState = {
          name,
          address,
          comment,
          rating,
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null,
        };
        localStorage.setItem('addPlaceForm', JSON.stringify(formState));
      }
    }
  }, [name, address, comment, rating, photos, startDate, endDate, isOpen]);

  const handleStartDateSelect = (date) => {
    if (!date) return;
    
    setStartDate(date);
    setStartDatePopoverOpen(false);
    
    // Если дата заезда позже даты выезда, сбрасываем дату выезда
    if (endDate && date > endDate) {
      setEndDate(null);
    }
  };

  const handleEndDateSelect = (date) => {
    if (!date) return;
    
    setEndDate(date);
    setEndDatePopoverOpen(false);
    
    // Если дата выезда раньше даты заезда, сбрасываем дату заезда
    if (startDate && date < startDate) {
      setStartDate(null);
    }
  };

  const handleFiles = useCallback((files) => {
    console.log('Получены файлы:', files);
    if (!files || !files.length) return;

    // Преобразуем FileList в массив
    const filesArray = Array.from(files);
    console.log('Массив файлов:', filesArray);

    // Фильтруем только изображения
    const imageFiles = filesArray.filter(file => {
      const isImage = file.type.startsWith('image/');
      console.log('Файл:', file.name, 'тип:', file.type, 'является изображением:', isImage);
      return isImage;
    });

    if (!imageFiles.length) {
      console.log('Нет подходящих изображений');
      return;
    }

    // Создаем превью для каждого файла
    const newPhotos = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    console.log('Подготовленные фото:', newPhotos);

    // Обновляем состояние
    setPhotos(prevPhotos => {
      const updatedPhotos = [...prevPhotos, ...newPhotos];
      console.log('Обновленный список фото:', updatedPhotos);
      return updatedPhotos;
    });
  }, []);

  const removePhoto = (photoId, isExisting = false) => {
    if (isExisting) {
      console.log(`Удаление существующего фото с ID: ${photoId}`);
      setDeletedPhotos(prev => [...prev, photoId]);
      setExistingPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } else {
      console.log(`Удаление нового фото с индексом: ${photoId}`);
      setDisabledPhotos(prev => ({
        ...prev,
        [photoId]: true
      }));
    }
  };

  const restorePhoto = (index) => {
    setDisabledPhotos(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
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
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    setRating(0);
    setError(null);
    setUploadProgress(0);
    setDisabledPhotos({});
    setShowMap(false);
    setFormChanged(false);
    
    localStorage.removeItem('addPlaceForm');
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
    e.preventDefault();
    
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
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
        placeData.dates = `${format(startDate, 'dd.MM.yyyy')} – ${format(endDate, 'dd.MM.yyyy')}`;
      }

      let updatedPlace;
      
      if (isEditMode) {
        console.log('Обновляем существующее место:', place.id);
        // Добавляем ID удаленных фотографий
        if (deletedPhotos.length > 0) {
          placeData.deleted_image_ids = deletedPhotos;
        }
        
        // Обновляем место
        updatedPlace = await placesService.updatePlace(place.slug || place.id, placeData);
        console.log('Место успешно обновлено:', updatedPlace);
        
        // Загружаем новые фотографии, если они есть
        const activePhotos = photos.filter((_, index) => !disabledPhotos[index]);
        if (activePhotos.length > 0) {
          console.log('Загружаем новые фотографии:', activePhotos.length);
          const formData = new FormData();
          activePhotos.forEach(photo => formData.append('images', photo.file));
          
          const uploadedImages = await placesService.uploadImages(place.slug || place.id, formData);
          console.log('Фотографии успешно загружены:', uploadedImages);
          
          // Обновляем место с новыми фотографиями
          updatedPlace = {
            ...updatedPlace,
            images: [...updatedPlace.images, ...uploadedImages]
          };
        }
        
        // Вызываем колбэк обновления
        if (onPlaceUpdated) {
          console.log('Вызываем onPlaceUpdated с обновленными данными:', updatedPlace);
          onPlaceUpdated(updatedPlace);
        }
      } else {
        // Создаем новое место
        updatedPlace = await placesService.createPlace(placeData);
        console.log('Новое место создано:', updatedPlace);
        
        // Загружаем фотографии для нового места
        const activePhotos = photos.filter((_, index) => !disabledPhotos[index]);
        if (activePhotos.length > 0) {
          console.log('Загружаем фотографии для нового места:', activePhotos.length);
          const formData = new FormData();
          activePhotos.forEach(photo => formData.append('images', photo.file));
          
          const uploadedImages = await placesService.uploadImages(updatedPlace.slug || updatedPlace.id, formData);
          console.log('Фотографии успешно загружены:', uploadedImages);
          
          // Обновляем место с новыми фотографиями
          updatedPlace = {
            ...updatedPlace,
            images: uploadedImages
          };
        }
        
        // Вызываем колбэк создания
        if (onPlaceAdded) {
          console.log('Вызываем onPlaceAdded с данными нового места:', updatedPlace);
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

  // Устанавливаем колбэк для обработки файлов
  useEffect(() => {
    console.log('Устанавливаем колбэк, isOpen:', isOpen);
    
    const callback = (files) => {
      console.log('Колбэк вызван с файлами:', files);
      handleFiles(files);
    };

    if (isOpen) {
      setOnDropCallback(() => callback);
    } else {
      setOnDropCallback(null);
    }

    return () => {
      console.log('Очищаем колбэк');
      setOnDropCallback(null);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isEditMode && place) {
      console.log('AddPlacePopup: Редактирование места:', place);
      console.log('AddPlacePopup: Значение place.dates:', place.dates);
      
      // Не загружаем заполнители в поля формы
      setName(place.name === 'Без названия' ? "" : (place.name || ""));
      setAddress(place.location === 'Без адреса' ? "" : (place.location || ""));
      setComment(place.review || "");
      setRating(place.rating || 0);
      
      let parsedStartDate = null;
      let parsedEndDate = null;
      
      if (place.dates) {
        console.log('AddPlacePopup: Начинаем парсинг dates:', place.dates);
        [parsedStartDate, parsedEndDate] = parseDateRange(place.dates);
        console.log('AddPlacePopup: Результат парсинга:', {
          parsedStartDate,
          parsedEndDate,
          rawDates: place.dates
        });
        
        setStartDate(parsedStartDate);
        setEndDate(parsedEndDate);
        
        console.log('AddPlacePopup: Установлены даты в состояние:', {
          startDate: parsedStartDate,
          endDate: parsedEndDate
        });
      } else {
        console.log('AddPlacePopup: place.dates отсутствует');
      }
      
      if (place.images && place.images.length > 0) {
        setExistingPhotos(place.images);
      }
      
      setInitialFormState({
        name: place.name === 'Без названия' ? "" : (place.name || ""),
        address: place.location === 'Без адреса' ? "" : (place.location || ""),
        comment: place.review || "",
        rating: place.rating || 0,
        startDate: parsedStartDate,
        endDate: parsedEndDate
      });
      
      console.log('AddPlacePopup: Установлен initialFormState:', {
        startDate: parsedStartDate,
        endDate: parsedEndDate
      });
    }
  }, [isOpen, isEditMode, place]);

  // Добавляем логи для отслеживания изменений состояния дат
  useEffect(() => {
    if (isEditMode) {
      console.log('AddPlacePopup: Изменение состояния дат:', {
        startDate,
        endDate
      });
    }
  }, [startDate, endDate, isEditMode]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => {
        console.log('Dialog onOpenChange вызван с:', open);
        if (!open) {
          onClose();
        }
      }}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/50 z-[100] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
        />
        <Dialog.Content 
          className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 rounded-xl sm:max-w-5xl max-h-[90vh] w-[90vw] flex flex-col overflow-hidden shadow-xl z-[101] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"

          onOpenAutoFocus={(e) => {
            console.log('DialogContent onOpenAutoFocus вызван');
            e.preventDefault();
          }}
          onCloseAutoFocus={(e) => {
            console.log('DialogContent onCloseAutoFocus вызван');
            e.preventDefault();
          }}
        >
        <div className="p-6 pb-4 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <Dialog.Title className="text-xl font-semibold">
            {isEditMode ? 'Редактирование места' : 'Новое место'}
          </Dialog.Title>
          <Dialog.Close asChild>
            <button
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => onClose()}
            >
              <X className="h-5 w-5 text-gray-500" />
              <span className="sr-only">Закрыть</span>
            </button>
          </Dialog.Close>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mx-6 mb-4">
            {error}
          </div>
        )}
        
        {loading && uploadProgress > 0 && (
          <div className="flex-1 overflow-y-auto p-6 pt-2 pb-20">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-center mt-1">
              {uploadProgress < 100 ? 'Загрузка...' : 'Загрузка завершена!'}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex-1 p-6 pt-2 flex flex-col overflow-auto max-h-[calc(100vh-10rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {/* Левая колонка - форма */}
            <div className="md:sticky md:top-0 md:self-start md:max-h-[calc(90vh-14rem)]">
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
                startDatePopoverOpen={startDatePopoverOpen}
                setStartDatePopoverOpen={setStartDatePopoverOpen}
                endDatePopoverOpen={endDatePopoverOpen}
                setEndDatePopoverOpen={setEndDatePopoverOpen}
                handleStartDateSelect={handleStartDateSelect}
                handleEndDateSelect={handleEndDateSelect}
              />
            </div>

            {/* Правая колонка - фотографии */}
            <div className="md:flex md:flex-col md:h-[calc(90vh-14rem)] md:overflow-y-auto">
              <div className="bg-white dark:bg-gray-800">
                <PhotoUploadArea 
                  photos={photos}
                  existingPhotos={existingPhotos}
                  disabledPhotos={disabledPhotos}
                  onFileSelect={handleFiles}
                  onRemovePhoto={removePhoto}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {existingPhotos.map((photo, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden h-[120px]">
                      <img 
                        src={photo.url || photo.image_url} 
                        alt={`Preview ${index}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(photo.id, true)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Удалить фото"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                {photos.map((photo, index) => (
                  !disabledPhotos[index] && (
                    <div key={`new-${index}`} className="relative group">
                      <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden h-[120px]">
                        <img 
                          src={photo.preview} 
                          alt={`Preview ${index}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemovePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Удалить фото"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </form>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end space-x-4">
          <Dialog.Close asChild>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={loading}
              >
                Отмена
              </Button>
            </Dialog.Close>
            <Button 
              onClick={handleSubmit} 
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