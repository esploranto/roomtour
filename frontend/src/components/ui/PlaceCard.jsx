import React, { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { parseDateRange, formatDateRange } from "@/lib/utils.ts";
import SwiperCarousel from "./SwiperCarousel";

export default function PlaceCard({ to, title, dates, rating, icon: Icon, imageUrl, images = [], location }) {
  const PlaceIcon = Icon || Home;
  const hasImages = images.length > 0 || imageUrl;
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
  // Состояние для отслеживания кликов по навигации
  const [navigationClicked, setNavigationClicked] = useState(false);

  // Обработчик изменения слайда
  const handleSlideChange = useCallback((index) => {
    console.log("PlaceCard: slide changed to index", index);
    setActiveIndex(index);
  }, []);

  // Обработчик клика на карточку для отладки
  const handleCardClick = useCallback((e) => {
    console.log("PlaceCard: card clicked", e.target);
    // Проверяем, был ли клик на кнопках навигации
    const isNavigationClick = e.target.closest('.swiper-nav-button');
    if (isNavigationClick) {
      console.log("PlaceCard: Navigation click detected in card click");
      setNavigationClicked(true);
      // Не нужно останавливать всплытие здесь, так как мы хотим, чтобы событие дошло до кнопки навигации
    } else {
      setNavigationClicked(false);
    }
  }, []);

  // Функция для обработки onMouseEnter с небольшой задержкой
  const handleMouseEnter = useCallback(() => {
    setHovering(true);
  }, []);

  // Функция для обработки onMouseLeave
  const handleMouseLeave = useCallback(() => {
    setHovering(false);
  }, []);

  // Обработчик клика на ссылку
  const handleLinkClick = useCallback((e) => {
    console.log("PlaceCard: Link clicked, navigationClicked:", navigationClicked);
    
    // Проверяем, был ли клик на кнопках навигации
    const isNavigationClick = e.target.closest('.swiper-nav-button');
    
    if (isNavigationClick || navigationClicked) {
      console.log("PlaceCard: Preventing link navigation due to navigation click");
      e.preventDefault();
      return false;
    }
  }, [navigationClicked]);

  const cardContent = (
    <div 
      className="relative border dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 transition-all duration-200 hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Изображение или карусель */}
      <div 
        ref={containerRef}
        className="relative group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
          /* Если несколько изображений, показываем карусель Swiper */
          hasImages && multipleImages && (
            <SwiperCarousel 
              images={allImages} 
              title={title} 
              hovering={hovering}
              onSlideChange={handleSlideChange}
            />
          )
        )}

        {/* Если нет изображений, показываем плейсхолдер */}
        {!hasImages && (
          <div className="h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <PlaceIcon size={64} className="text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>

      {/* Информация о месте */}
      <div className="p-4">
        <div className="flex justify-between items-start gap-10">
          <div className="flex-grow">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-1">{title}</h2>
            {location && (
              <p className="text-gray-900 dark:text-gray-300 mb-1">{location}</p>
            )}
            <p className="text-gray-500 dark:text-gray-300">
              {dates ? (() => {
                // Парсим и форматируем даты в новом формате
                const [startDate, endDate] = parseDateRange(dates);
                if (startDate || endDate) {
                  return formatDateRange(startDate, endDate);
                }
                return dates; // Fallback на исходный формат, если парсинг не удался
              })() : ''}
            </p>
          </div>
          <div className="text-3xl font-light text-gray-900 dark:text-white">
            {rating}
          </div>
        </div>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link 
        to={to} 
        className="block h-full" 
        onClick={handleLinkClick}
      >
        {cardContent}
      </Link>
    );
  }
  
  return cardContent;
}