import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.jsx";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
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
import { usePlaces } from "@/lib/hooks";
import { useToast } from "@/context/ToastContext";

export default function AddPlacePopup({ isOpen, onClose, onPlaceAdded }) {
  const { user } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Получаем функцию мутации из хука usePlaces
  const { mutate } = usePlaces();
  
  // Получаем функции для отображения уведомлений
  const { showSuccess, showError } = useToast();

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

  // Форма валидна, если есть хотя бы фотографии
  const isFormValid = photos.length > 0;

  const resetForm = () => {
    setName("");
    setAddress("");
    setComment("");
    setStartDate(null);
    setEndDate(null);
    // Освобождаем URL объектов перед очисткой
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    setRating(5);
    setError(null);
    setUploadProgress(0);
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
      };

      // Отправляем данные на сервер для создания места
      const newPlace = await placesService.createPlace(placeData);
      console.log('Созданное место:', newPlace);
      setUploadProgress(30);
      
      // Если есть фотографии, загружаем их
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(photo => {
          formData.append('images', photo.file);
        });
        
        // Используем ID или slug для загрузки изображений
        const identifier = newPlace.slug && newPlace.slug.trim() !== '' 
          ? newPlace.slug 
          : newPlace.id;
        
        console.log(`Загружаем изображения для места с идентификатором: ${identifier}`);
        
        try {
          // Загружаем изображения для созданного места
          const uploadedImages = await placesService.uploadImages(identifier, formData);
          console.log('Загруженные изображения:', uploadedImages);
          setUploadProgress(100);
          
          // Добавляем URL изображений к объекту места
          newPlace.images = uploadedImages;
        } catch (uploadError) {
          console.error("Ошибка при загрузке изображений:", uploadError);
          // Даже если загрузка изображений не удалась, мы все равно продолжаем
          // так как место уже создано
          showError("Не удалось загрузить некоторые изображения, но место было создано");
        }
      }
      
      // Добавляем дополнительные поля для фронтенда
      const placeForUI = {
        ...newPlace,
        title: newPlace.name,
        dates: formattedDates,
      };

      console.log('Подготовленное место для UI:', placeForUI);

      // Вызываем колбэк для обновления списка мест в родительском компоненте
      if (onPlaceAdded) {
        onPlaceAdded(placeForUI);
      }
      
      // Обновляем кэш SWR
      mutate();
      
      // Показываем уведомление об успехе
      showSuccess('Место успешно добавлено!');

      // Сбрасываем форму и закрываем попап
      resetForm();
      onClose();
    } catch (err) {
      console.error("Ошибка при добавлении места:", err);
      setError("Не удалось добавить место. Пожалуйста, попробуйте позже.");
      showError("Не удалось добавить место. Пожалуйста, попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>Новое место</DialogTitle>
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
                {photos.length > 0 ? `Выбрано файлов: ${photos.length}` : "Файлы не выбраны"}
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
            
            {photos.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
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
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              variant="outline" 
              className="w-full sm:w-auto"
            >
              {loading ? "Добавление..." : "Добавить место"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 