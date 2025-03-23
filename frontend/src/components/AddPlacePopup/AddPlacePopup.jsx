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
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const nameInputRef = React.useRef(null);

  const { mutate } = usePlaces();
  
  const { showSuccess, showError } = useToast();

  const isEditMode = Boolean(place);

  // Флаг для отслеживания первого рендера компонента
  const isFirstRender = React.useRef(true);

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
        console.log("Устанавливаю фокус на поле Название (первый рендер пустой формы)");
        
        // Используем большую задержку для гарантированной установки фокуса
        setTimeout(() => {
          if (nameInputRef.current) {
            nameInputRef.current.focus();
            console.log("Фокус установлен через ref");
          } else {
            // Запасной вариант через DOM API
            const nameInput = document.getElementById('name');
            if (nameInput) {
              nameInput.focus();
              console.log("Фокус установлен через DOM API");
            } else {
              console.log("Элемент инпута не найден ни через ref, ни через DOM API");
            }
          }
        }, 500);
      } else {
        console.log("Форма была ранее заполнена или заполнена сейчас, фокус не устанавливается");
        console.log("wasFormPreviouslyFilled:", wasFormPreviouslyFilled);
        console.log("isFormCurrentlyEmpty:", isFormCurrentlyEmpty);
        console.log("Текущее состояние формы:", { name, address, comment, rating, photos: photos.length, startDate, endDate, hasAttemptedSubmit });
      }
      
      // Сбрасываем флаг первого рендера
      isFirstRender.current = false;
    }
    
    // При закрытии формы сбрасываем флаг первого рендера
    if (!isOpen) {
      isFirstRender.current = true;
    }
  }, [isOpen, isEditMode, name, address, comment, rating, photos, startDate, endDate, hasAttemptedSubmit]);

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
  }, [isOpen, isEditMode]);

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

  // Обработчик добавления фотографий
  const handleAddPhotos = (newFiles) => {
    if (!newFiles || newFiles.length === 0) return;
    
    // Проверяем, не превышает ли общее количество фото максимальное число
    if (photos.length + newFiles.length > 10) {
      alert('Максимальное количество фотографий: 10');
      return;
    }
    
    // Фильтруем файлы, которые уже есть в списке (по имени и размеру)
    const uniqueNewFiles = newFiles.filter(file => {
      const isDuplicate = photos.some(photo => {
        if (photo.file instanceof File) {
          return photo.file.name === file.name && 
                 photo.file.size === file.size;
        }
        return false;
      });
      return !isDuplicate;
    });
    
    // Добавляем только новые файлы
    if (uniqueNewFiles.length > 0) {
      const newPhotos = uniqueNewFiles.map(file => {
        const preview = URL.createObjectURL(file);
        return {
          id: Date.now() + '_' + Math.random().toString(36).substring(2, 9),
          file,
          preview,
          isNew: true
        };
      });
      
      setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
      setFormChanged(true);
    }
  };

  // Обработчик удаления фотографии
  const handleDeletePhoto = (photo, index) => {
    // Если это существующее фото с сервера (имеет _id)
    if (photo._id) {
      setDeletedPhotos(prev => [...prev, photo]);
      setPhotos(prev => prev.filter(p => p._id !== photo._id));
    } 
    // Если это новое фото (имеет id, но не _id)
    else if (photo.id || photo.isNew) {
      setPhotos(prev => prev.filter((_, i) => i !== index));
    }
    // Просто по индексу если ничего не подходит
    else {
      setPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos.splice(index, 1);
        return newPhotos;
      });
    }
    
    setFormChanged(true);
  };

  // Обработчик восстановления фотографии
  const handleRestorePhoto = (photo, index) => {
    if (!photo) return;
    
    // Добавляем фото обратно в основной список
    setPhotos(prev => [...prev, photo]);
    
    // Удаляем из списка удаленных фото
    setDeletedPhotos(prev => {
      const newDeleted = [...prev];
      newDeleted.splice(index, 1);
      return newDeleted;
    });
    
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
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    setRating(0);
    setError(null);
    setUploadProgress(0);
    setDisabledPhotos({});
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
    e.preventDefault();
    
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
        placeData.dates = `${format(startDate, 'dd.MM.yyyy')} – ${format(endDate, 'dd.MM.yyyy')}`;
      }

      let updatedPlace;
      
      if (isEditMode) {
        console.log('Обновляем существующее место:', place.id);
        
        // Добавляем ID удаленных фотографий
        if (deletedPhotos.length > 0) {
          placeData.deleted_image_ids = deletedPhotos.map(photo => photo.id).filter(Boolean);
        }
        
        // Обновляем место
        updatedPlace = await placesService.updatePlace(place.slug || place.id, placeData);
        console.log('Место успешно обновлено:', updatedPlace);
        
        // Загружаем новые фотографии, если они есть
        const newPhotos = photos.filter(photo => !photo.id); // Фильтруем только новые фото (без id)
        if (newPhotos.length > 0) {
          console.log('Загружаем новые фотографии:', newPhotos.length);
          const formData = new FormData();
          
          newPhotos.forEach(photo => {
            // Определяем, что именно добавлять в formData
            if (photo.file instanceof File) {
              formData.append('images', photo.file);
            } else if (photo instanceof File) {
              formData.append('images', photo);
            }
          });
          
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
        if (photos.length > 0) {
          console.log('Загружаем фотографии для нового места:', photos.length);
          const formData = new FormData();
          
          photos.forEach(photo => {
            // Определяем, что именно добавлять в formData
            if (photo.file instanceof File) {
              formData.append('images', photo.file);
            } else if (photo instanceof File) {
              formData.append('images', photo);
            }
          });
          
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

  // Глобальный обработчик для drag-and-drop
  useEffect(() => {
    if (!isOpen) return;
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        // Фильтруем только изображения
        const imageFiles = Array.from(e.dataTransfer.files).filter(
          file => file.type.startsWith('image/')
        );
        
        if (imageFiles.length > 0) {
          handleAddPhotos(imageFiles);
        }
      }
    };
    
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    // Добавляем обработчики событий
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragover', handleDragOver);
    
    // Очищаем обработчики при закрытии или размонтировании
    return () => {
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragover', handleDragOver);
    };
  }, [isOpen, handleAddPhotos]); // Зависимость от isOpen для добавления/удаления обработчиков

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
        // Переносим существующие изображения в photos
        setPhotos(place.images);
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
            // Предотвращаем стандартное поведение автофокуса
            e.preventDefault();
            // Не устанавливаем фокус здесь, эта логика теперь в useEffect
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
            <div className="md:sticky md:top-2 md:self-start md:max-h-[calc(90vh-14rem)]">
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
            <div className="md:flex md:flex-col md:min-h-[350px] md:max-h-[calc(80vh-10rem)]">
              <div className="w-full h-full">
                <PhotoUploadArea 
                  photos={photos}
                  deletedPhotos={deletedPhotos}
                  onAddPhotos={handleAddPhotos}
                  onDeletePhoto={handleDeletePhoto}
                  onRestorePhoto={handleRestorePhoto}
                  onReorderPhotos={handleReorderPhotos}
                  maxPhotos={10}
                />
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