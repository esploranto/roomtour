import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

export default function PlaceCard({ to, title, dates, rating, icon: Icon, imageUrl, images = [], location }) {
  const PlaceIcon = Icon || Home;
  const hasImages = images.length > 0 || imageUrl;
  const carouselApiRef = useRef(null);
  const containerRef = useRef(null);
  
  // Исправляем дублирование изображений
  // Если imageUrl уже есть в images, не добавляем его снова
  let allImages = [];
  if (imageUrl) {
    const imageUrlExists = images.some(img => img.image_url === imageUrl);
    if (!imageUrlExists) {
      allImages = [{ image_url: imageUrl }, ...images];
    } else {
      allImages = [...images];
    }
  } else {
    allImages = [...images];
  }
  
  const multipleImages = allImages.length > 1;
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  // Обработчик для предотвращения всплытия события клика по стрелкам
  const handleCarouselControlClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Обработчик для обновления активного индекса слайда
  const handleSlideChange = (api) => {
    if (api) {
      setActiveIndex(api.selectedScrollSnap());
      carouselApiRef.current = api;
    }
  };

  // Обработчик движения мыши для последовательного переключения слайдов
  const handleMouseMove = (e) => {
    if (!multipleImages || !carouselApiRef.current || !hovering) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const containerWidth = rect.width;
    
    // Вычисляем, какой слайд должен быть активен в зависимости от положения мыши
    // Делим ширину контейнера на количество слайдов
    const totalSlides = allImages.length;
    const slideWidth = containerWidth / totalSlides;
    
    // Определяем индекс слайда на основе положения мыши
    const targetIndex = Math.min(
      Math.floor(x / slideWidth),
      totalSlides - 1
    );
    
    // Если текущий индекс отличается от целевого, переключаем слайд
    if (activeIndex !== targetIndex) {
      carouselApiRef.current.scrollTo(targetIndex);
    }
  };

  // Эффект для добавления обработчика движения мыши
  useEffect(() => {
    const container = containerRef.current;
    if (container && multipleImages) {
      container.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [multipleImages, hovering, activeIndex]);

  const cardContent = (
    <div className="relative border dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 transition-all duration-200 hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer overflow-hidden">
      {/* Изображение или карусель */}
      <div 
        ref={containerRef}
        className="relative"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Если только одно изображение, показываем его напрямую */}
        {hasImages && !multipleImages ? (
          <div className="relative h-64 w-full">
            <img
              src={allImages[0].image_url}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          /* Если несколько изображений, показываем карусель */
          <Carousel 
            className="w-full"
            disableKeyboardControls={true} // Отключаем навигацию с клавиатуры
            opts={{
              dragFree: true,
              skipSnaps: true,
              loop: true, // Включаем зацикливание карусели
            }}
            setApi={(api) => {
              carouselApiRef.current = api;
              api?.on("select", () => handleSlideChange(api));
            }}
          >
            <CarouselContent>
              {hasImages ? (
                allImages.map((img, index) => (
                  <CarouselItem key={index}>
                    <div className="relative h-64 w-full">
                      <img
                        src={img.image_url}
                        alt={`${title} - изображение ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <PlaceIcon size={64} className="text-gray-400 dark:text-gray-500" />
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            
            {/* Показываем стрелки только если есть больше одного изображения */}
            {multipleImages && (
              <>
                <div onClick={handleCarouselControlClick}>
                  <CarouselPrevious className="left-2 -translate-x-0" />
                </div>
                <div onClick={handleCarouselControlClick}>
                  <CarouselNext className="right-2 translate-x-0" />
                </div>
              </>
            )}
          </Carousel>
        )}

        {/* Индикаторы для множественных изображений */}
        {multipleImages && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {allImages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Бейдж с локацией */}
        {location && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-sm font-medium px-3 py-1 rounded-full">
              {location}
            </span>
          </div>
        )}
      </div>

      {/* Информация о месте */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{title}</h2>
            <p className="text-gray-600 dark:text-gray-300">{dates}</p>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {rating}
          </div>
        </div>
      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="block h-full">
      {cardContent}
    </Link>
  ) : cardContent;
}