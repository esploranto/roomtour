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
  
  // Обработчик добавления фотографий - определяем как функцию, а не useCallback
  function processAddPhotos(newFiles) {
    if (!newFiles || newFiles.length === 0) return;
    
    console.log("Получены файлы для загрузки:", newFiles);
    
    // Проверяем, не превышает ли общее количество фото максимальное число (10)
    if (photos.length + newFiles.length > 10) {
      showError('Максимальное количество фотографий: 10');
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
    function handleFiles(files) {
      if (files && files.length > 0) {
        processAddPhotos(files);
      }
    }
    
    if (isOpen) {
      // Включаем прием файлов при открытии формы
      setAcceptsFiles(true);
      // Устанавливаем принимаемые типы файлов (только изображения)
      setAcceptedFileTypes(['image/*']);
      // Устанавливаем колбэк для обработки перетаскиваемых файлов
      setOnDropCallback(handleFiles);
    } else {
      // Отключаем перетаскивание при закрытии формы
      setAcceptsFiles(false);
      setOnDropCallback(null);
    }
    
    return () => {
      // Очищаем колбэк при размонтировании
      setAcceptsFiles(false);
      setOnDropCallback(null);
    };
  }, [isOpen, setAcceptsFiles, setAcceptedFileTypes, setOnDropCallback, photos, showError]);

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
  const handleDeletePhoto = (photo, index) => {
    // Если это существующее фото с сервера
    if (photo._id || photo.id) {
      const photoToDelete = photos[index];
      if (photoToDelete) {
        setDeletedPhotos(prev => [...prev, photoToDelete]);
        setPhotos(prev => prev.filter((_, i) => i !== index));
      }
    } 
    // Если это новое фото
    else {
      setPhotos(prev => {
        const newPhotos = [...prev];
        const deletedPhoto = newPhotos.splice(index, 1)[0];
        if (deletedPhoto.preview) {
          URL.revokeObjectURL(deletedPhoto.preview);
        }
        return newPhotos;
      });
    }
    
    setFormChanged(true);
  };

  // Обработчик восстановления фотографии
  const handleRestorePhoto = (photo, index) => {
    if (!photo) return;
    
    // Проверяем, не превышает ли общее количество фото максимальное число
    if (photos.length >= 10) {
      showError('Максимальное количество фотографий: 10');
      return;
    }
    
    // Добавляем фото обратно в основной список
    setPhotos(prev => [...prev, photo]);
    
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
        placeData.dates = `${format(startDate, 'dd.MM.yyyy')} – ${format(endDate, 'dd.MM.yyyy')}`;
      }

      let updatedPlace;
      
      if (isEditMode) {
        // Добавляем ID удаленных фотографий
        if (deletedPhotos.length > 0) {
          placeData.deleted_image_ids = deletedPhotos.map(photo => photo.id).filter(Boolean);
        }
        
        // Обновляем место
        updatedPlace = await placesService.updatePlace(place.slug || place.id, placeData);
        
        // Загружаем новые фотографии, если они есть
        const newPhotos = photos.filter(photo => !photo.id); // Фильтруем только новые фото (без id)
        if (newPhotos.length > 0) {
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
          
          // Обновляем место с новыми фотографиями
          updatedPlace = {
            ...updatedPlace,
            images: [...updatedPlace.images, ...uploadedImages]
          };
        }
        
        // Вызываем колбэк обновления
        if (onPlaceUpdated) {
          onPlaceUpdated(updatedPlace);
        }
      } else {
        // Создаем новое место
        updatedPlace = await placesService.createPlace(placeData);
        
        // Загружаем фотографии для нового места
        if (photos.length > 0) {
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
          
          // Обновляем место с новыми фотографиями
          updatedPlace = {
            ...updatedPlace,
            images: uploadedImages
          };
        }
        
        // Вызываем колбэк создания
        if (onPlaceAdded) {
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
            className="flex-grow overflow-hidden h-full flex flex-col" 
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
          >
            <div className="flex-grow overflow-auto p-6 flex flex-col md:flex-row gap-6" style={{ minHeight: '550px' }}>
              {/* Левая колонка - форма */}
              <div className="md:w-1/2 md:h-full overflow-y-auto px-2">
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
              <div className="md:w-1/2 md:h-full overflow-y-auto relative z-20 px-2 flex">
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