import React, { useRef, useEffect, useState, useContext } from "react";
import { Button } from "@/components/ui/button.tsx";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel.tsx";
import { ArrowLeft, MoreVertical, Edit, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { usePlace, usePlaces } from "@/lib/hooks";
import { AuthContext } from "@/context/AuthContext";
import { placesService } from "@/api";
import { useToast } from "@/context/ToastContext";
import { parseDateRange, formatDateRange } from "@/lib/utils.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu.tsx";
import AddPlacePopup from "@/components/AddPlacePopup/AddPlacePopup";
import ConfirmDialog from "@/components/ui/confirm-dialog";

export default function Place() {
  const { username, placeId } = useParams();
  const carouselRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useToast();
  const { mutate: mutatePlaces } = usePlaces();
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Состояние для полноэкранного просмотра изображений
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  
  console.log('Place - монтирование компонента');
  
  const [place, setPlace] = useState(null);
  
  useEffect(() => {
    console.log('Place - получены параметры из URL:', { username, placeId });
    setIsLoading(true);
    
    const fetchPlace = async () => {
      try {
        const data = await placesService.getPlace(placeId);
        console.log('Place - получены данные места:', data);
        setPlace(data);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке места:', err);
        setError(err);
        showError('Не удалось загрузить данные места');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlace();
  }, [placeId, showError]);

  // Устанавливаем фокус на карусель после загрузки компонента
  useEffect(() => {
    if (carouselRef.current && place && place.images && place.images.length > 0) {
      // Находим элемент карусели и устанавливаем фокус
      const carouselElement = carouselRef.current;
      
      // Используем setTimeout для гарантии, что DOM полностью загружен
      setTimeout(() => {
        if (carouselElement) {
          carouselElement.focus();
          
          // Добавляем глобальный обработчик клавиатурных событий
          const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              // Предотвращаем стандартное поведение (прокрутку страницы)
              e.preventDefault();
              
              // Эмулируем клик по соответствующей кнопке
              if (e.key === 'ArrowLeft') {
                const prevButton = carouselElement.querySelector('[data-carousel-prev]');
                if (prevButton) prevButton.click();
              } else {
                const nextButton = carouselElement.querySelector('[data-carousel-next]');
                if (nextButton) nextButton.click();
              }
            }
          };
          
          // Добавляем обработчик
          window.addEventListener('keydown', handleKeyDown);
          
          // Очищаем обработчик при размонтировании
          return () => {
            window.removeEventListener('keydown', handleKeyDown);
          };
        }
      }, 300);
    }
  }, [place]);

  // Обработчик для клавиатурной навигации в полноэкранном режиме
  useEffect(() => {
    if (fullscreenImage) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setFullscreenImage(null);
        } else if (e.key === 'ArrowLeft') {
          showPreviousFullscreenImage();
        } else if (e.key === 'ArrowRight') {
          showNextFullscreenImage();
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      // Блокируем прокрутку страницы
      document.body.style.overflow = 'hidden';
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        // Восстанавливаем прокрутку страницы
        document.body.style.overflow = 'auto';
      };
    }
  }, [fullscreenImage, fullscreenIndex]);

  // Обработчик для редактирования места
  const handleEditPlace = () => {
    console.log('Place - открываем попап редактирования');
    setIsEditPopupOpen(true);
    console.log('isEditPopupOpen установлен в:', true);
  };

  // Обработчик для обновления места после редактирования
  const handlePlaceUpdated = (updatedPlace) => {
    console.log('Place - вызван handlePlaceUpdated с данными:', updatedPlace);
    setPlace(updatedPlace);
    console.log('Place - состояние обновлено:', updatedPlace);
    setIsEditPopupOpen(false);
  };

  // Обработчик для открытия диалога подтверждения удаления
  const handleDeleteClick = () => {
    setIsConfirmDialogOpen(true);
  };

  // Обработчик для удаления места
  const handleDeletePlace = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      
      // Получаем идентификатор места
      const identifier = place.slug && place.slug.trim() !== '' 
        ? place.slug 
        : place.id;
      
      // Удаляем место
      await placesService.deletePlace(identifier);
      
      // Обновляем список мест в кэше SWR
      mutatePlaces();
      
      // Показываем уведомление об успехе
      showSuccess('Вы удалили место');
      
      // Перенаправляем на страницу профиля
      navigate(`/${username}`);
    } catch (err) {
      console.error('Ошибка при удалении места:', err);
      setError(err);
      showError('Не удалось удалить место. Пожалуйста, попробуйте позже.');
      setIsDeleting(false);
    }
  };

  // Полноэкранный просмотр изображений - исправляем проверку изображений
  const openFullscreenImage = (image, index) => {
    if (!image || !image.image_url) {
      console.warn('Попытка открыть некорректное изображение:', image);
      return;
    }
    setFullscreenImage(image);
    setFullscreenIndex(index);
  };

  // Обработчик для показа предыдущего изображения в полноэкранном режиме
  const showPreviousFullscreenImage = () => {
    if (place && place.images && place.images.length > 0) {
      const newIndex = (fullscreenIndex - 1 + place.images.length) % place.images.length;
      const newImage = place.images[newIndex];
      if (newImage && newImage.image_url) {
        setFullscreenIndex(newIndex);
        setFullscreenImage(newImage);
      } else {
        console.warn('Некорректное предыдущее изображение:', newImage);
      }
    }
  };

  // Обработчик для показа следующего изображения в полноэкранном режиме
  const showNextFullscreenImage = () => {
    if (place && place.images && place.images.length > 0) {
      const newIndex = (fullscreenIndex + 1) % place.images.length;
      const newImage = place.images[newIndex];
      if (newImage && newImage.image_url) {
        setFullscreenIndex(newIndex);
        setFullscreenImage(newImage);
      } else {
        console.warn('Некорректное следующее изображение:', newImage);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="outline" asChild className="mb-4">
          <Link to={`/${username}`}>
            <ArrowLeft size={16} className="mr-2" />
            Назад к профилю
          </Link>
        </Button>
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Загрузка данных места...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="outline" asChild className="mb-4">
          <Link to={`/${username}`}>
            <ArrowLeft size={16} className="mr-2" />
            Назад к профилю
          </Link>
        </Button>
        <div className="p-8">
          <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
            Не удалось загрузить данные места. Пожалуйста, попробуйте позже.
          </div>
          
          {/* Отладочная информация (только в режиме разработки) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-bold mb-2">Отладочная информация:</h3>
              <pre className="text-xs overflow-auto">{JSON.stringify(error, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button variant="outline" asChild className="mb-4">
          <Link to={`/${username}`}>
            <ArrowLeft size={16} className="mr-2" />
            Назад к профилю
          </Link>
        </Button>
        <div className="text-center p-8">
          <p className="text-gray-600">Место не найдено</p>
        </div>
      </div>
    );
  }

  // Определяем настройки карусели в зависимости от количества изображений
  const hasImages = place.images && place.images.length > 0;
  const imagesCount = hasImages ? place.images.length : 0;
  
  // Определяем класс для CarouselItem в зависимости от количества изображений
  const getCarouselItemClass = () => {
    if (imagesCount === 1) {
      return "basis-full"; // Одно изображение занимает всю ширину
    } else if (imagesCount === 2) {
      return "md:basis-1/2"; // Два изображения в ряд
    } else {
      return "md:basis-1/2 lg:basis-1/3"; // Три и более изображений
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Кнопка "Назад к профилю" */}
      <Button variant="outline" asChild className="mb-4">
        <Link to={`/${username}`}>
          <ArrowLeft size={16} className="mr-2" />
          Назад к профилю
        </Link>
      </Button>

      <div className="flex justify-between items-start mb-2">
        <h1 className="text-3xl font-bold">{place.name}</h1>
        
        {/* Кнопка с троеточием (отображается всегда) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              title="Дополнительные действия"
              disabled={isDeleting}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800">
            <DropdownMenuItem onClick={handleEditPlace}>
              <Edit className="mr-2 h-4 w-4" />
              Редактировать место
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDeleteClick}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <p className="text-gray-600 mb-6">{place.location}</p>

      {/* Даты */}
      {place.dates && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Даты проживания</h2>
          <p className="text-gray-700">
            {(() => {
              // Парсим и форматируем даты в нужном формате
              const [startDate, endDate] = parseDateRange(place.dates);
              if (startDate || endDate) {
                return formatDateRange(startDate, endDate);
              }
              return place.dates; // Fallback на исходный формат, если парсинг не удался
            })()}
          </p>
        </div>
      )}

      {/* Карусель с изображениями */}
      {hasImages ? (
        <div className="mb-8">
          <Carousel 
            ref={carouselRef} 
            className="w-full max-w-5xl mx-auto"
            opts={{
              align: "start",
              loop: true,
            }}
            tabIndex={0} // Делаем карусель фокусируемой
          >
            <CarouselContent className="max-h-[500px]">
              {place.images.map((image, index) => (
                <CarouselItem key={index} className={`h-full ${getCarouselItemClass()}`}>
                  <div className="p-1 h-full flex items-center justify-center">
                    <img
                      src={image.image_url}
                      alt={`${place.name} - изображение ${index + 1}`}
                      className="max-h-[480px] w-auto object-contain rounded-lg mx-auto cursor-pointer"
                      onClick={() => openFullscreenImage(image, index)}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {imagesCount > 1 && (
              <>
                <CarouselPrevious className="left-2" data-carousel-prev />
                <CarouselNext className="right-2" data-carousel-next />
              </>
            )}
          </Carousel>
        </div>
      ) : (
        <div className="mb-8 bg-gray-100 h-64 flex items-center justify-center rounded-lg">
          <p className="text-gray-500">Нет изображений</p>
        </div>
      )}

      {/* Рейтинг */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Рейтинг</h2>
        <div className="flex">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={`text-2xl ${
                i < place.rating ? "text-yellow-500" : "text-gray-300"
              }`}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Отзыв */}
      {place.review && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Отзыв</h2>
          <p className="text-gray-700">{place.review}</p>
        </div>
      )}
      
      {/* Попап редактирования места */}
      {console.log('Рендерим AddPlacePopup, isOpen:', isEditPopupOpen)}
      <AddPlacePopup 
        isOpen={isEditPopupOpen} 
        onClose={() => {
          console.log('Закрываем попап');
          setIsEditPopupOpen(false);
        }} 
        place={place}
        onPlaceUpdated={handlePlaceUpdated}
      />
      
      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleDeletePlace}
        title="Удаление места"
        description="Вы уверены, что хотите удалить это место? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
      />
      
      {/* Полноэкранный просмотр изображения */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Кнопка закрытия */}
            <button 
              className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
              onClick={() => setFullscreenImage(null)}
            >
              <X size={24} />
            </button>
            
            {/* Навигационные кнопки */}
            {imagesCount > 1 && (
              <>
                <button 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
                  onClick={showPreviousFullscreenImage}
                >
                  <ChevronLeft size={32} />
                </button>
                <button 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
                  onClick={showNextFullscreenImage}
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
            
            {/* Изображение */}
            <img 
              src={fullscreenImage.image_url} 
              alt={`${place.name} - полноэкранное изображение`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
            
            {/* Индикатор текущего изображения (кружочки) */}
            {imagesCount > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {place.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === fullscreenIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    onClick={() => {
                      setFullscreenIndex(index);
                      setFullscreenImage(place.images[index]);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}