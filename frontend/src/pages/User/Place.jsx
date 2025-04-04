import React, { useRef, useEffect, useState, useContext } from "react";
import { Button } from "@/components/ui/button.tsx";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel.tsx";
import { ArrowLeft, MoreVertical, Edit, Trash2, X, ChevronLeft, ChevronRight, Share, MapPin, CalendarDays, ThumbsUp, Annoyed } from "lucide-react";
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
import { triggerNewPlaceConfetti, triggerEditPlaceConfetti } from "@/components/ui/confetti";

export default function Place() {
  const { username, placeId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isNew = searchParams.get('isNew') === 'true';
  const carouselRef = useRef(null);
  const mapRef = useRef(null);
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
  
  const [place, setPlace] = useState(null);
  
  // Получаем место по ID
  const fetchPlace = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await placesService.getPlace(placeId);
      
      // Проверяем, что данные получены
      if (!data) {
        setError({ status: 404, message: 'Место не найдено' });
        setIsLoading(false);
        return;
      }
      
      // Проверяем формат изображений
      if (data.images && !Array.isArray(data.images)) {
        data.images = [];
      }
      
      // Обрабатываем изображения
      if (data.images && data.images.length > 0) {
        // Фильтруем некорректные изображения
        data.images = data.images.filter(image => {
          if (!image || !image.image_url) {
            return false;
          }
          return true;
        });
        
        // Сортируем изображения по полю order, если оно присутствует
        if (data.images.length > 0 && data.images[0].order !== undefined) {
          data.images.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      }
      
      // Устанавливаем данные места
      setPlace(data);
      setIsLoading(false);
      
      // Проверяем, было ли место только что добавлено
      const fromAddPlace = sessionStorage.getItem('fromAddPlace');
      if (fromAddPlace === 'true') {
        try {
          triggerNewPlaceConfetti();
          sessionStorage.removeItem('fromAddPlace');
        } catch (confettiError) {
          console.error('Ошибка при запуске конфетти:', confettiError);
        }
      }
    } catch (err) {
      console.error('Ошибка при загрузке места:', err);
      const errorMessage = err.message || 'Не удалось загрузить данные места';
      setError({ status: err.status || 500, message: errorMessage });
      setIsLoading(false);
    }
  };

  // Загружаем место при монтировании компонента или изменении ID
  useEffect(() => {
    if (placeId) {
      fetchPlace();
    }
    
    // Очищаем при размонтировании
    return () => {
      if (place && place.images) {
        // Освобождаем ресурсы
      }
    };
  }, [placeId]);

  useEffect(() => {
    if (isNew) {
      triggerNewPlaceConfetti();
      // Удаляем параметр isNew из URL
      searchParams.delete('isNew');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  }, []);

  // Устанавливаем фокус на карусель после загрузки компонента
  useEffect(() => {
    if (carouselRef.current && place && place.images && place.images.length > 0) {
      // Находим элемент карусели и устанавливаем фокус
      const carouselElement = carouselRef.current;
      
      // Используем setTimeout для гарантии, что DOM полностью загружен
      setTimeout(() => {
        if (carouselElement) {
          carouselElement.focus();
          
          // Добавляем обработчик для навигации по карусели
          const handleCarouselKeyDown = (e) => {
            if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
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
          
          // Добавляем обработчик на элемент карусели, а не на window
          carouselElement.addEventListener('keydown', handleCarouselKeyDown);
          
          // Очищаем обработчик при размонтировании
          return () => {
            carouselElement.removeEventListener('keydown', handleCarouselKeyDown);
          };
        }
      }, 300);
    }
  }, [place]);

  // Добавляем глобальный обработчик для открытия полноэкранного режима при нажатии стрелок
  useEffect(() => {
    // Обработчик только когда НЕ в полноэкранном режиме и есть изображения
    if (!fullscreenImage && place && place.images && place.images.length > 0) {
      const handleGlobalKeyDown = (e) => {
        // Открываем полноэкранный режим при нажатии стрелок
        // Только если нет активного элемента ввода
        const activeElement = document.activeElement;
        const isInputActive = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' || 
          activeElement === carouselRef.current
        );
        
        if (!isInputActive && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          e.preventDefault();
          
          if (e.key === 'ArrowLeft') {
            // Открываем с последним изображением при нажатии стрелки влево
            const lastIndex = place.images.length - 1;
            openFullscreenImage(place.images[lastIndex], lastIndex);
          } else if (e.key === 'ArrowRight') {
            // Открываем с первым изображением при нажатии стрелки вправо
            openFullscreenImage(place.images[0], 0);
          }
        }
      };
      
      // Добавляем глобальный обработчик
      window.addEventListener('keydown', handleGlobalKeyDown);
      
      // Очищаем обработчик при размонтировании или при изменении состояния
      return () => {
        window.removeEventListener('keydown', handleGlobalKeyDown);
      };
    }
  }, [place, fullscreenImage, carouselRef]);

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
    triggerEditPlaceConfetti();
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

  // Переход к карте
  const scrollToMap = () => {
    if (mapRef.current) {
      mapRef.current.scrollIntoView({ behavior: 'smooth' });
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
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" asChild>
            <Link to={`/${username}`}>
              <ArrowLeft size={16} className="mr-2" />
              Назад к профилю
            </Link>
          </Button>
        </div>
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Загрузка данных места...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="default"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Назад
          </Button>
        </div>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-4">
            {error.status === 404 ? 'Место не найдено' : 'Произошла ошибка'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error.message || 'Попробуйте обновить страницу или вернуться позже'}
          </p>
          <Button onClick={() => navigate(-1)}>
            Вернуться назад
          </Button>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" asChild>
            <Link to={`/${username}`}>
              <ArrowLeft size={16} className="mr-2" />
              Назад к профилю
            </Link>
          </Button>
        </div>
        <div className="text-center p-8">
          <p className="text-gray-600">Место не найдено</p>
        </div>
      </div>
    );
  }

  // Определяем настройки карусели в зависимости от количества изображений
  const hasImages = place.images && place.images.length > 0;
  const imagesCount = hasImages ? place.images.length : 0;

  return (
    <div className="container mx-auto py-8">
      {/* Навигация */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" asChild>
          <Link to={`/${username}`}>
            <ArrowLeft size={16} className="mr-2" />
            Назад к профилю
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 pt-8">
        {/* Левая колонка - информация о месте */}
        <div className="md:w-2/5 md:sticky md:top-24 md:self-start">
          <div className="bg-gray-100 dark:bg-gray-800/60 rounded-2xl p-6 pb-12 space-y-8 ">
            {/* Заголовок с кнопками */}
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-medium pr-4">
                {(place.name !== undefined && place.name !== null && place.name !== 'Без названия') 
                  ? String(place.name) 
                  : 'Без названия'}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Поделиться"
                  className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Share className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      title="Дополнительные действия"
                      disabled={isDeleting}
                      className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border-none rounded-lg space-y-0">
                    <DropdownMenuItem onClick={handleEditPlace} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors items-start gap-0.5 rounded-md">
                      <Edit className="mr-2 h-4 w-4 mt-0.5" />
                      Редактировать место
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDeleteClick}
                      className="text-red-600 focus:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-0.5 rounded-md"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Адрес с кнопкой "На карте" */}
            {place.location && place.location !== 'Без адреса' && (
              <div className="mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-6 w-6 mr-1" />
                  <p className="text-gray-700 dark:text-gray-300 mr-2">{place.location}</p>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="text-gray-500 dark:text-gray-500 py-1 px-2 h-auto bg-gray-100 dark:bg-gray-800" 
                    onClick={scrollToMap}
                  >
                    <span>На карте</span>
                  </Button>
                </div>
              </div>
            )}
            
            {/* Даты */}
            {place.dates && (
              <div className="mb-4">
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-6 w-6 mr-1" />
                  <p className="text-gray-700 dark:text-gray-300">
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
              </div>
            )}
            
            {/* Тип жилья */}
            {place.type && (
              <div className="mb-4">
                <h2 className="text-lg font-medium mb-1">Тип жилья</h2>
                <p className="text-gray-700 dark:text-gray-300">{place.type}</p>
              </div>
            )}
            
            {/* Что понравилось */}
            {(place.pros && place.pros.trim() !== "") && (
              <div className="mb-4">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-6 w-6 mr-1" />
                  <p className="text-gray-700 dark:text-gray-300">{place.pros}</p>
                </div>
              </div>
            )}
            
            {/* Что не понравилось */}
            {(place.cons && place.cons.trim() !== "") && (
              <div className="mb-4">
                <div className="flex items-center gap-1">
                  <Annoyed className="h-6 w-6 mr-1" />
                  <p className="text-gray-700 dark:text-gray-300">{place.cons}</p>
                </div>
              </div>
            )}
            
            {/* Оценка */}
            <div className="mb-4">
              <h2 className="text-lg font-medium mb-1">Оценка</h2>
              <div className="flex items-center">
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
                <span className="ml-2 font-medium">{place.rating}/5</span>
              </div>
            </div>
            
            {/* Место в рейтинге */}
            {place.rank && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <div className="text-xl font-bold">{place.rank}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">место</div>
                  <Link to="/рейтинг" className="text-blue-600 dark:text-blue-400 text-sm mt-1 block">
                    в моём рейтинге
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка - фотографии */}
        <div className="md:w-3/5">
          {hasImages ? (
            <div className="mb-0">
              {/* Десктоп - грид с фотографиями */}
              <div className="hidden md:grid grid-cols-2 md:grid-cols-2 gap-1 overflow-hidden rounded-2xl">
                {place.images.map((image, index) => (
                  <div 
                    key={index} 
                    className="relative rounded-sm aspect-square cursor-pointer overflow-hidden"
                    onClick={() => openFullscreenImage(image, index)}
                  >
                    <img
                      src={image.image_url}
                      alt={`${place.name} - изображение ${index + 1}`}
                      className="h-full w-full rounded-sm object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
              
              {/* Мобильный - карусель */}
              <div className="md:hidden rounded-2xl overflow-hidden">
                <Carousel 
                  ref={carouselRef} 
                  className="w-full"
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                >
                  <CarouselContent>
                    {place.images.map((image, index) => (
                      <CarouselItem key={index} className="basis-full">
                        <div 
                          className="relative aspect-square cursor-pointer overflow-hidden"
                          onClick={() => openFullscreenImage(image, index)}
                        >
                          <img
                            src={image.image_url}
                            alt={`${place.name} - изображение ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              </div>
            </div>
          ) : (
            <div className="mb-8 bg-gray-100 dark:bg-gray-800 h-64 flex items-center justify-center rounded-2xl">
              <p className="text-gray-500 dark:text-gray-400">Нет изображений</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Карта (добавим позже) */}
      <div ref={mapRef} className="mt-12">
        <h2 className="text-2xl font-medium mb-4">Расположение</h2>
        <div className="bg-gray-100 dark:bg-gray-800 h-96 rounded-2xl flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Карта будет добавлена позже</p>
        </div>
      </div>
      
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
              className="max-h-[80vh] max-w-[90vw] object-contain"
            />
            
            {/* Превью изображений (thumbnails) */}
            {imagesCount > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-0 overflow-x-auto max-w-[90vw] p-2">
                {place.images.map((image, index) => (
                  <div
                    key={index}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                      index === fullscreenIndex ? 'border-white opacity-100' : 'border-transparent opacity-70'
                    }`}
                    onClick={() => {
                      setFullscreenIndex(index);
                      setFullscreenImage(place.images[index]);
                    }}
                  >
                    <img 
                      src={image.image_url} 
                      alt={`Превью ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}