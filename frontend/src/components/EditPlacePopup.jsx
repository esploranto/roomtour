import React, { useState, useContext, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.jsx";
import { CalendarIcon, X } from "lucide-react";
import { format, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils.ts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.jsx";
import { Calendar } from "@/components/ui/calendar.jsx";
import { AuthContext } from "@/context/AuthContext";
import { placesService } from "@/api";
import { usePlace } from "@/lib/hooks";
import { useToast } from "@/context/ToastContext";

export default function EditPlacePopup({ isOpen, onClose, place, onPlaceUpdated }) {
  const { user } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Состояние для отслеживания изменений в форме
  const [formChanged, setFormChanged] = useState(false);
  const [initialFormState, setInitialFormState] = useState({});
  
  // Получаем функцию мутации из хука usePlace
  const { mutate } = usePlace(place?.id || place?.slug);
  
  // Получаем функции для отображения уведомлений
  const { showSuccess, showError } = useToast();

  // Заполняем форму данными места при открытии попапа
  useEffect(() => {
    if (place && isOpen) {
      const placeName = place.name || "";
      const placeAddress = place.location || "";
      const placeComment = place.review || "";
      const placeRating = place.rating || 5;
      
      setName(placeName);
      setAddress(placeAddress);
      setComment(placeComment);
      setRating(placeRating);
      
      // Обрабатываем существующие изображения
      let placeExistingPhotos = [];
      if (place.images && place.images.length > 0) {
        placeExistingPhotos = place.images.map(img => ({
          id: img.id,
          image_url: img.image_url
        }));
        setExistingPhotos(placeExistingPhotos);
      } else {
        setExistingPhotos([]);
      }
      
      // Обрабатываем даты, если они есть
      let placeStartDate = null;
      let placeEndDate = null;
      if (place.dates) {
        try {
          const datesParts = place.dates.split(' – ');
          if (datesParts[0]) {
            placeStartDate = parse(datesParts[0], 'dd.MM.yyyy', new Date());
            setStartDate(placeStartDate);
          }
          if (datesParts[1]) {
            placeEndDate = parse(datesParts[1], 'dd.MM.yyyy', new Date());
            setEndDate(placeEndDate);
          }
        } catch (e) {
          console.error('Ошибка при парсинге дат:', e);
        }
      }
      
      // Сохраняем начальное состояние формы для отслеживания изменений
      setInitialFormState({
        name: placeName,
        address: placeAddress,
        comment: placeComment,
        rating: placeRating,
        startDate: placeStartDate,
        endDate: placeEndDate,
        existingPhotos: JSON.stringify(placeExistingPhotos)
      });
      
      // Сбрасываем флаг изменений при открытии формы
      setFormChanged(false);
      
      // Сбрасываем новые фотографии
      photos.forEach(photo => URL.revokeObjectURL(photo.preview));
      setPhotos([]);
    }
  }, [place, isOpen]);

  // Проверяем, были ли внесены изменения в форму
  useEffect(() => {
    if (isOpen && initialFormState && Object.keys(initialFormState).length > 0) {
      const currentExistingPhotos = JSON.stringify(existingPhotos);
      
      const hasChanges = 
        name !== initialFormState.name ||
        address !== initialFormState.address ||
        comment !== initialFormState.comment ||
        rating !== initialFormState.rating ||
        photos.length > 0 ||
        currentExistingPhotos !== initialFormState.existingPhotos ||
        (startDate !== initialFormState.startDate && 
          (startDate || initialFormState.startDate)) ||
        (endDate !== initialFormState.endDate && 
          (endDate || initialFormState.endDate));
      
      setFormChanged(hasChanges);
    }
  }, [name, address, comment, rating, photos, existingPhotos, startDate, endDate, initialFormState, isOpen]);

  // Функция для безопасного закрытия формы с проверкой изменений
  const safelyCloseForm = useCallback(() => {
    if (formChanged) {
      if (window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите закрыть форму?')) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  }, [formChanged, onClose]);

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
    }
  };

  const removePhoto = (index) => {
    setPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      // Освобождаем URL объекта перед удалением
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const removeExistingPhoto = (index) => {
    setExistingPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  // Форма валидна, если есть хотя бы одно фото (существующее или новое)
  const isFormValid = photos.length > 0 || existingPhotos.length > 0;

  const resetForm = () => {
    setName("");
    setAddress("");
    setComment("");
    setStartDate(null);
    setEndDate(null);
    // Освобождаем URL объектов перед очисткой
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    setExistingPhotos([]);
    setRating(5);
    setError(null);
    setUploadProgress(0);
    setFormChanged(false);
    setInitialFormState({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Проверяем, что есть хотя бы фотографии
    if (!isFormValid) {
      showError('Пожалуйста, добавьте хотя бы одну фотографию');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Форматируем даты в строку для отображения
      const formattedDates = `${startDate ? format(startDate, "dd.MM.yyyy", { locale: ru }) : ''} – ${endDate ? format(endDate, "dd.MM.yyyy", { locale: ru }) : ''}`;
      
      // Создаем объект с данными для API
      const placeData = {
        name: name || 'Без названия',
        location: address || 'Без адреса',
        rating: rating,
        review: comment,
        // Добавляем список ID существующих изображений, которые нужно сохранить
        image_ids: existingPhotos.map(photo => photo.id).filter(id => id)
      };

      console.log('Отправляем на сервер список ID изображений для сохранения:', placeData.image_ids);

      // Получаем идентификатор места
      const identifier = place.slug && place.slug.trim() !== '' 
        ? place.slug 
        : place.id;

      // Отправляем данные на сервер для обновления места
      const updatedPlace = await placesService.updatePlace(identifier, placeData);
      console.log('Обновленное место:', updatedPlace);
      setUploadProgress(30);
      
      // Если есть новые фотографии, загружаем их
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(photo => {
          formData.append('images', photo.file);
        });
        
        console.log(`Загружаем новые изображения для места с идентификатором: ${identifier}`);
        
        try {
          // Загружаем изображения для обновленного места
          const uploadedImages = await placesService.uploadImages(identifier, formData);
          console.log('Загруженные изображения:', uploadedImages);
          setUploadProgress(100);
          
          // Добавляем URL изображений к объекту места
          updatedPlace.images = [...existingPhotos, ...uploadedImages];
        } catch (uploadError) {
          console.error("Ошибка при загрузке изображений:", uploadError);
          showError("Не удалось загрузить некоторые изображения, но место было обновлено");
        }
      } else {
        // Если новых фото нет, просто используем существующие
        updatedPlace.images = existingPhotos;
      }
      
      // Добавляем дополнительные поля для фронтенда
      const placeForUI = {
        ...updatedPlace,
        title: updatedPlace.name,
        dates: formattedDates,
        id: updatedPlace.id,
        slug: updatedPlace.slug
      };

      console.log('Подготовленное место для UI:', placeForUI);

      // Показываем уведомление об успехе
      showSuccess('Место успешно обновлено!');
      
      // Обновляем кэш SWR
      mutate();

      // Закрываем попап и сбрасываем форму
      resetForm();
      onClose();

      // Вызываем колбэк для обновления данных места в родительском компоненте
      if (onPlaceUpdated) {
        console.log('EditPlacePopup - вызываем onPlaceUpdated с данными:', placeForUI);
        onPlaceUpdated(placeForUI);
      } else {
        console.error('EditPlacePopup - onPlaceUpdated не определен');
      }
    } catch (err) {
      console.error("Ошибка при обновлении места:", err);
      setError("Не удалось обновить место. Пожалуйста, попробуйте позже.");
      showError("Не удалось обновить место. Пожалуйста, попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          // Если диалог закрывается через крестик или клик вне диалога,
          // проверяем, были ли внесены изменения
          safelyCloseForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>Редактирование места</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {loading && uploadProgress > 0 && (
          <div className="mb-4">
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="photo" className="block mb-2">Фото места</Label>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => document.getElementById('photo').click()}
              >
                Загрузить фото
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {photos.length > 0 ? `Новых файлов: ${photos.length}` : "Новые файлы не выбраны"}
              </span>
            </div>
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              multiple
            />
            
            {/* Отображаем существующие фотографии */}
            {existingPhotos.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Существующие фото:</p>
                <div className="grid grid-cols-3 gap-2">
                  {existingPhotos.map((photo, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <img 
                        src={photo.image_url} 
                        alt={`Existing ${index}`} 
                        className="w-full h-20 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Отображаем новые фотографии */}
            {photos.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Новые фото:</p>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={`new-${index}`} className="relative">
                      <img 
                        src={photo.preview} 
                        alt={`Preview ${index}`} 
                        className="w-full h-20 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="name" className="block mb-2">Название места</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название места"
              required
            />
          </div>

          <div>
            <Label htmlFor="address" className="block mb-2">Адрес</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Введите адрес"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="block mb-2">Дата заезда</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "PPP", { locale: ru })
                    ) : (
                      <span>Выберите дату</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="endDate" className="block mb-2">Дата выезда</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="endDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                    disabled={!startDate}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "PPP", { locale: ru })
                    ) : (
                      <span>Выберите дату</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="rating" className="block mb-2">Оценка (1-5)</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    star <= rating ? "text-yellow-500" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="comment" className="block mb-2">Комментарий</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Введите комментарий"
              rows={3}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={safelyCloseForm} className="w-full sm:w-auto">
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              variant="outline" 
              className="w-full sm:w-auto"
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 