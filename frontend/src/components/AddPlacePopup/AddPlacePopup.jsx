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
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
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
  
  console.log("AddPlacePopup рендеринг:", {
    isOpen,
    isEditMode,
    savedForm: localStorage.getItem('addPlaceForm')
  });
  
  // Обработчик для загрузки фотографий
  const processAddPhotos = useCallback((newFiles) => {
    try {
      console.log("processAddPhotos вызван с:", newFiles);
      
      // Защитная проверка
      if (!newFiles) {
        console.log("newFiles равен null или undefined, выход из функции");
        return;
      }
      
      // Проверяем, является ли newFiles массивом
      if (!Array.isArray(newFiles)) {
        console.log("newFiles не является массивом, выход из функции");
        return;
      }
      
      // Проверяем, не пустой ли массив
      if (newFiles.length === 0) {
        console.log("newFiles - пустой массив, выход из функции");
        return;
      }
      
      console.log("Прошли все проверки, обрабатываем файлы");
      
      // Создаем временный массив для хранения валидных файлов
      const uniqueNewFiles = [];
      
      // Проверяем каждый файл вручную
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        
        // Проверяем, что объект является файлом
        if (!(file instanceof File)) {
          console.log("Файл не является экземпляром File:", file);
          continue;
        }
        
        // Проверяем, что такой файл еще не добавлен
        let isDuplicate = false;
        
        for (let j = 0; j < photos.length; j++) {
          const photo = photos[j];
          
          // Если у элемента есть свойство file и это объект File, проверяем его имя, размер и дату
          if (photo.file instanceof File) {
            if (photo.file.name === file.name && 
                photo.file.size === file.size &&
                photo.file.lastModified === file.lastModified) {
              isDuplicate = true;
              break;
            }
          }
        }
        
        if (!isDuplicate) {
          uniqueNewFiles.push(file);
        }
      }
      
      console.log("Найдено уникальных файлов:", uniqueNewFiles.length);
      
      // Добавляем только новые файлы
      if (uniqueNewFiles.length > 0) {
        // Преобразуем файлы в объекты фото
        const newPhotos = uniqueNewFiles.map(file => ({
          id: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          file,
          url: URL.createObjectURL(file),
          previewUrl: URL.createObjectURL(file),
          order: photos.length // Устанавливаем порядок для нового фото
        }));
        
        console.log("Подготовлено новых фото для добавления:", newPhotos.length);
        
        // Обновляем состояние
        setPhotos(prev => [...prev, ...newPhotos]);
        setFormChanged(true);
      }
    } catch (err) {
      console.error("Ошибка при добавлении фото:", err);
      showError("Не удалось добавить фотографии");
    }
  }, [photos, showError, setPhotos, setFormChanged]);

  // Мемоизируем обработчик для предотвращения лишних рендеров
  const handleAddPhotos = useCallback((files) => {
    console.log("handleAddPhotos вызван с:", files);
    
    // Преобразуем FileList в массив, если необходимо
    const fileArray = files instanceof FileList ? Array.from(files) : files;
    
    if (fileArray && Array.isArray(fileArray) && fileArray.length > 0) {
      processAddPhotos(fileArray);
    } else {
      console.log("handleAddPhotos: нет файлов для обработки или данные некорректны");
    }
  }, [processAddPhotos]);
  
  // Обработчик для изображений, полученных не через стандартный инпут
  const onExternalFilesReceived = useCallback((files) => {
    console.log("onExternalFilesReceived вызван с:", files);
    
    // Преобразуем FileList в массив, если необходимо
    const fileArray = files instanceof FileList ? Array.from(files) : files;
    
    if (fileArray && Array.isArray(fileArray) && fileArray.length > 0) {
      processAddPhotos(fileArray);
    } else {
      console.log("onExternalFilesReceived: нет файлов для обработки или данные некорректны");
    }
  }, [processAddPhotos]);
  
  // Настраиваем прием файлов через drag-and-drop
  useEffect(() => {
    // Активируем drag-and-drop, когда форма открыта
    if (isOpen) {
      // Создаем функцию-обработчик событий для поддержки событий FilesReceived
      const handleFilesReceived = (e) => {
        console.log("Получено событие FilesReceived:", e);
        if (e && e.detail && e.detail.files) {
          console.log("Передача файлов в onExternalFilesReceived");
          onExternalFilesReceived(e.detail.files);
        } else {
          console.log("Событие FilesReceived не содержит файлов:", e);
        }
      };
      
      // Настраиваем drag-and-drop через контекст
      console.log("Настраиваем drag-and-drop для открытой формы");
      setAcceptsFiles(true);
      setAcceptedFileTypes(['image/jpeg', 'image/png', 'image/jpg', 'image/webp']);
      setOnDropCallback((files) => {
        console.log("Вызван onDropCallback с:", files);
        if (files) {
          onExternalFilesReceived(files);
        } else {
          console.log("onDropCallback вызван с null или undefined");
        }
      });
      
      // Добавляем обработчик кастомного события
      document.addEventListener('FilesReceived', handleFilesReceived);
      
      // Очищаем обработчик при закрытии
      return () => {
        console.log("Очищаем обработчики для drag-and-drop");
        document.removeEventListener('FilesReceived', handleFilesReceived);
        setAcceptsFiles(false);
        setOnDropCallback(null);
      };
    } else {
      // Если форма закрыта, отключаем drag-and-drop
      console.log("Отключаем drag-and-drop для закрытой формы");
      setAcceptsFiles(false);
      setOnDropCallback(null);
      return () => {};
    }
  }, [isOpen, onExternalFilesReceived, setAcceptsFiles, setAcceptedFileTypes, setOnDropCallback]);
  
  // Автосохранение формы в localStorage
  useEffect(() => {
    if (!isOpen || isEditMode) return;
    
    // Проверяем, заполнена ли форма
    const wasFormPreviouslyFilled = localStorage.getItem('addPlaceForm') !== null;
    
    // Проверяем, пуста ли форма сейчас
    const isFormCurrentlyEmpty =
      name === "" &&
      address === "" &&
      pros === "" &&
      cons === "" &&
      photos.length === 0 &&
      startDate === null &&
      endDate === null &&
      rating === 0;
      
    // Если форма пуста и ранее не была заполнена, или пользователь пытался отправить форму, не сохраняем
    if ((isFormCurrentlyEmpty && !wasFormPreviouslyFilled) || hasAttemptedSubmit) {
      return;
    }
    
    // Сохраняем форму в localStorage
    localStorage.setItem('addPlaceForm', JSON.stringify({
      name,
      address,
      pros,
      cons,
      rating,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null
    }));
  }, [isOpen, isEditMode, name, address, pros, cons, rating, photos, startDate, endDate, hasAttemptedSubmit]);
  
  // Восстановление формы из localStorage при открытии
  useEffect(() => {
    if (!isOpen || isEditMode) return;
    
    try {
      const savedForm = localStorage.getItem('addPlaceForm');
      const wasAttemptedSubmit = localStorage.getItem('addPlaceAttemptedSubmit') === 'true';
      setHasAttemptedSubmit(wasAttemptedSubmit);
      
      if (savedForm) {
        const parsedForm = JSON.parse(savedForm);
        setName(parsedForm.name || "");
        setAddress(parsedForm.address || "");
        setPros(parsedForm.pros || "");
        setCons(parsedForm.cons || "");
        setRating(parsedForm.rating || 0);
        
        // Восстанавливаем даты
        if (parsedForm.startDate) {
          setStartDate(new Date(parsedForm.startDate));
        }
        if (parsedForm.endDate) {
          setEndDate(new Date(parsedForm.endDate));
        }
        
        // Устанавливаем начальное состояние формы для отслеживания изменений
        setInitialFormState({
          name: parsedForm.name || "",
          address: parsedForm.address || "",
          pros: parsedForm.pros || "",
          cons: parsedForm.cons || "",
          rating: parsedForm.rating || 0,
          photos: [],
          startDate: parsedForm.startDate ? new Date(parsedForm.startDate) : null,
          endDate: parsedForm.endDate ? new Date(parsedForm.endDate) : null
        });
      }
    } catch (e) {
      console.error('Ошибка при восстановлении формы:', e);
    }
  }, [isOpen, isEditMode]);
  
  // Отслеживание изменений в форме
  useEffect(() => {
    if (!isOpen) return;
    
    // Определяем, были ли внесены изменения
    const hasChanges =
      name !== initialFormState.name ||
      address !== initialFormState.address ||
      pros !== initialFormState.pros ||
      cons !== initialFormState.cons ||
      rating !== initialFormState.rating ||
      photos.length !== initialFormState.photos.length ||
      startDate !== initialFormState.startDate ||
      endDate !== initialFormState.endDate;
      
    // Сохраняем текущее состояние формы
    const formState = {
      name,
      address,
      pros,
      cons,
      rating,
      photos,
      startDate,
      endDate
    };
    
    setFormChanged(hasChanges);
    setInitialFormState(formState);
  }, [name, address, pros, cons, rating, photos, startDate, endDate, isOpen, hasAttemptedSubmit]);
  
  // Обработчик для удаления фотографии
  const handleDeletePhoto = (index) => {
    try {
      const photoToDelete = photos[index];
      
      // Обновляем состояние фото
      setPhotos(prev => {
        const newPhotos = [...prev];
        const deletedPhoto = newPhotos.splice(index, 1)[0];
        
        // Если это существующее фото с сервера, добавляем его в список удаленных
        const isExistingServerPhoto = photoToDelete._id || 
                                     (photoToDelete.id && typeof photoToDelete.id === 'number');
                                     
        if (isExistingServerPhoto && !deletedPhotos.includes(photoToDelete)) {
          setDeletedPhotos(prev => [...prev, photoToDelete]);
        }
        
        return newPhotos;
      });
      
      setFormChanged(true);
    } catch (error) {
      console.error('Ошибка при удалении фото:', error);
      showError('Не удалось удалить фото');
    }
  };
  
  // Обработчик для восстановления удаленной фотографии
  const handleRestorePhoto = (index) => {
    try {
      const photoToRestore = deletedPhotos[index];
      
      // Удаляем фото из списка удаленных
      setDeletedPhotos(prev => {
        const newDeletedPhotos = [...prev];
        newDeletedPhotos.splice(index, 1);
        return newDeletedPhotos;
      });
      
      // Добавляем фото обратно в основной список
      setPhotos(prev => [...prev, photoToRestore]);
      setFormChanged(true);
    } catch (error) {
      console.error('Ошибка при восстановлении фото:', error);
      showError('Не удалось восстановить фото');
    }
  };
  
  // Обработчик для изменения порядка фотографий
  const handleReorderPhotos = (fromIndex, toIndex) => {
    setPhotos(prevPhotos => {
      const result = [...prevPhotos];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
    
    setFormChanged(true);
  };
  
  // Проверка валидности формы
  const isFormValid =
    ((name.trim() !== "" ||
      address.trim() !== "" ||
      pros.trim() !== "" ||
      cons.trim() !== "" ||
      photos.length > 0 ||
      startDate !== null ||
      endDate !== null ||
      rating > 0) &&
     !loading) ||
    isEditMode;
    
  // Сброс формы
  const resetForm = () => {
    setName("");
    setAddress("");
    setPros("");
    setCons("");
    setStartDate(null);
    setEndDate(null);
    setPhotos([]);
    setDeletedPhotos([]);
    setRating(0);
    setError(null);
    setLoading(false);
    setFormChanged(false);
    setHasAttemptedSubmit(false);
    localStorage.removeItem('addPlaceForm');
    localStorage.removeItem('addPlaceAttemptedSubmit');
  };
  
  // Безопасное закрытие формы с сохранением данных
  const safelyCloseForm = () => {
    if (isEditMode) {
      // Если это режим редактирования, просто закрываем форму
      onClose();
    } else {
      // Если форма не менялась, просто закрываем ее
      if (!formChanged) {
        resetForm();
      }
      onClose();
    }
  };
  
  // Обработчик для кнопки "Отмена"
  const handleCancel = () => {
    // Если форма не менялась или это режим редактирования, просто закрываем ее
    if (!formChanged || isEditMode) {
      safelyCloseForm();
      return;
    }
    
    // Показываем диалоговое окно подтверждения
    if (confirm("Вы уверены, что хотите закрыть форму? Все несохраненные данные будут потеряны.")) {
      resetForm();
      onClose();
    }
  };

  // Обработчик для удаления места
  const handleDeletePlace = () => {
    return; // Функция не реализована
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Устанавливаем флаг попытки отправки
    setHasAttemptedSubmit(true);
    localStorage.setItem('addPlaceAttemptedSubmit', 'true');
    
    if (!isFormValid) {
      showError("Пожалуйста, заполните хотя бы одно поле");
      return;
    }
    
    // Начинаем загрузку
    setLoading(true);
    setError(null);
    
    // Форматируем дату для отправки
    const formatDate = (date) => date ? format(date, 'dd.MM.yyyy') : '';
    let formattedDate = '';
    
    // Если есть обе даты, форматируем диапазон
    if (startDate && endDate) {
      formattedDate = `${formatDate(startDate)} – ${formatDate(endDate)}`;
    } 
    // Если только одна дата, используем ее
    else if (startDate) {
      formattedDate = formatDate(startDate);
    } else if (endDate) {
      formattedDate = formatDate(endDate);
    }
    
    let updatedPlace = null;
    
    try {
      if (isEditMode) {
        // Подготовка данных для редактирования
        const placeData = {
          name: name.trim() || "Без названия",
          location: address.trim() || "Без адреса",
          pros: pros.trim(),
          cons: cons.trim(),
          rating: rating || null
        };
        
        if (formattedDate) {
          placeData.dates = formattedDate;
        }
        
        // Собираем ID фотографий для удаления
        const photoIdsToDelete = deletedPhotos
          .map(photo => photo.id)
          .filter(id => typeof id === 'number');
          
        if (photoIdsToDelete.length > 0) {
          placeData.deleted_photos = photoIdsToDelete;
        }
        
        // Обновляем основные данные места
        updatedPlace = await placesService.updatePlace(place.slug || place.id, placeData);
        
        // Загружаем новые фотографии, если они есть
        const newPhotoFiles = photos
          .filter(photo => photo.file instanceof File)
          .map(photo => ({ file: photo.file }));
          
        if (newPhotoFiles.length > 0) {
          const formData = new FormData();
          newPhotoFiles.forEach(photo => {
            formData.append('images', photo.file);
          });
          
          // Загружаем изображения
          await placesService.uploadImages(place.slug || place.id, formData);
          
          // Перезагружаем место для получения актуальных данных
          updatedPlace = await placesService.getPlace(place.slug || place.id);
        }
        
        // Обновляем порядок фотографий если есть фото с сервера
        const serverPhotoIds = photos
          .map(photo => photo.id)
          .filter(id => typeof id === 'number');
          
        if (serverPhotoIds.length > 0) {
          await placesService.updateImageOrder(place.slug || place.id, serverPhotoIds);
          
          // Получаем финальное состояние места
          updatedPlace = await placesService.getPlace(place.slug || place.id);
        }
        
        // Обновляем кэш SWR
        mutate();
        
        // Указываем, что место было отредактировано
        sessionStorage.setItem('fromEditPlace', 'true');
        
        // Очищаем localStorage от данных формы
        localStorage.removeItem('addPlaceForm');
        localStorage.removeItem('addPlaceAttemptedSubmit');
        
        // Показываем уведомление об успехе
        showSuccess('Место успешно обновлено');
        
        // Обновляем UI и закрываем форму
        if (onPlaceUpdated) {
          onPlaceUpdated(updatedPlace);
        }
      } else {
        // Создание нового места
        // Подготавливаем данные для отправки на бэкенд
        const placeData = {
          name: name.trim() || "Без названия",
          location: address.trim() || "Без адреса",
          pros: pros.trim(),
          cons: cons.trim(),
          rating: rating || null
        };
        
        if (formattedDate) {
          placeData.dates = formattedDate;
        }
        
        // Проверяем, есть ли у нас аутентифицированный пользователь
        if (user) {
          placeData.user_id = user.id;
          placeData.username = user.username;
        }
        
        // Подготавливаем файлы фотографий
        const newPhotoFiles = photos
          .filter(photo => photo.file instanceof File)
          .map(photo => ({ file: photo.file }));
          
        // Создаем место (с фотографиями или без)
        updatedPlace = await placesService.createPlace(placeData, newPhotoFiles);
        
        // Обновляем кэш SWR
        mutate();
        
        // Показываем конфетти при успешном добавлении места
        sessionStorage.setItem('fromAddPlace', 'true');
        
        // Очищаем localStorage после успешного добавления
        localStorage.removeItem('addPlaceForm');
        localStorage.removeItem('addPlaceAttemptedSubmit');
        
        // Показываем уведомление об успехе
        showSuccess('Вы успешно добавили место');
        
        // Перенаправляем на страницу нового места
        if (updatedPlace) {
          navigate(`/${user.username}/${updatedPlace.slug || updatedPlace.id}?isNew=true`);
        }
      }
      
      // Завершаем операцию для обоих режимов
      resetForm();
      setLoading(false);
      onClose();
      
    } catch (error) {
      console.error('Ошибка при сохранении места:', error);
      setError(error.message || 'Произошла ошибка при сохранении данных');
      setLoading(false);
    }
  };
  
  // При открытии попапа в режиме редактирования загружаем данные места
  useEffect(() => {
    if (isOpen && isEditMode && place) {
      // Устанавливаем поля формы из данных места
      setName(place.name || "");
      setAddress(place.location || "");
      setPros(place.pros || "");
      setCons(place.cons || "");
      setRating(place.rating || 0);
      
      // Устанавливаем даты, если они есть
      if (place.dates) {
        try {
          const [start, end] = parseDateRange(place.dates);
          if (start) setStartDate(start);
          if (end) setEndDate(end);
        } catch (e) {
          console.error('Ошибка при парсинге дат:', e);
        }
      }
      
      // Устанавливаем фотографии
      if (place.images && Array.isArray(place.images)) {
        const formattedImages = place.images.map(img => ({
          id: img.id,
          url: img.image_url,
          previewUrl: img.image_url,
          order: img.order || 0
        }));
        
        setPhotos(formattedImages);
      }
      
      // Устанавливаем начальное состояние формы для отслеживания изменений
      setInitialFormState({
        name: place.name || "",
        address: place.location || "",
        pros: place.pros || "",
        cons: place.cons || "",
        rating: place.rating || 0,
        photos: place.images || [],
        startDate: null,
        endDate: null
      });
    }
  }, [isOpen, isEditMode, place]);

  return (
    <Dialog.Root 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      initialFocus={isOpen && !isEditMode && !localStorage.getItem('addPlaceForm') ? nameInputRef : undefined}
    >
      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/50 z-[900] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
        />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] max-h-[90vh] w-[90vw] max-w-[1200px] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden flex flex-col z-[1000]"
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
                tabIndex="-1"
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
            <div className={`flex-grow p-4 flex flex-col md:flex-row gap-4 ${isMobile ? 'overflow-auto' : 'overflow-hidden'}`} style={{ 
              height: isMobile ? 'auto' : 'calc(100% - 140px)'
            }}>
              {/* Левая колонка - форма */}
              <div className="w-full md:w-1/2 md:h-full overflow-auto px-2 mb-4 md:mb-0 order-1 md:order-1 scrollbar-hide">
                <PlaceForm 
                  name={name}
                  setName={setName}
                  address={address}
                  setAddress={setAddress}
                  pros={pros}
                  setPros={setPros}
                  cons={cons}
                  setCons={setCons}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  rating={rating}
                  setRating={setRating}
                  showMap={showMap}
                  setShowMap={setShowMap}
                  nameInputRef={nameInputRef}
                  autoFocusName={isOpen && !isEditMode && !localStorage.getItem('addPlaceForm')}
                />
              </div>

              {/* Правая колонка - фотографии */}
              <div className="w-full md:w-1/2 md:h-full overflow-auto relative z-20 px-2 flex order-2 md:order-2 scrollbar-hide" style={{
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