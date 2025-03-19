import React, { useState, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';

// Импорт стилей Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function SwiperCarousel({ 
  images = [], 
  title = "",
  hovering = false,
  onSlideChange = () => {},
}) {
  const multipleImages = images.length > 1;
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);

  // Обработчик изменения слайда
  const handleSlideChange = (swiper) => {
    console.log("Slide changed to:", swiper.activeIndex);
    setActiveIndex(swiper.activeIndex);
    onSlideChange(swiper.activeIndex);
  };

  // Функции для ручного переключения слайдов с использованием useCallback
  const goNext = useCallback((e) => {
    console.log("goNext clicked");
    // Обязательно останавливаем всплытие и предотвращаем действие по умолчанию
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      console.log("Event propagation stopped");
    }
    
    if (swiperInstance) {
      console.log("Calling swiperInstance.slideNext()");
      swiperInstance.slideNext();
    }
  }, [swiperInstance]);

  const goPrev = useCallback((e) => {
    console.log("goPrev clicked");
    // Обязательно останавливаем всплытие и предотвращаем действие по умолчанию
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      console.log("Event propagation stopped");
    }
    
    if (swiperInstance) {
      console.log("Calling swiperInstance.slidePrev()");
      swiperInstance.slidePrev();
    }
  }, [swiperInstance]);

  // Обработчик инициализации Swiper
  const handleSwiperInit = (swiper) => {
    console.log("Swiper initialized:", swiper ? "successfully" : "failed");
    setSwiperInstance(swiper);
  };

  // Динамическая пагинация с центрированием активного буллита
  const paginationOptions = {
    clickable: true,
    dynamicBullets: true,
    dynamicMainBullets: 1, // Показываем 1 главный буллит (активный) и по 2 с каждой стороны
    renderBullet: function (index, className) {
      // Для всех слайдов используем одинаковый рендеринг (без уменьшения)
      return `<span class="${className}"></span>`;
    },
  };

  // Предотвращаем всплытие события для всего контейнера карусели
  const handleContainerClick = (e) => {
    // Не останавливаем всплытие для обычных кликов на карусель
    console.log("SwiperCarousel container clicked");
  };

  return (
    <div 
      className="relative w-full h-64"
      onClick={handleContainerClick}
    >
      <Swiper
        modules={[Navigation, Pagination, A11y]}
        spaceBetween={0}
        slidesPerView={1}
        loop={multipleImages}
        pagination={multipleImages ? paginationOptions : false}
        onSlideChange={handleSlideChange}
        onSwiper={handleSwiperInit}
        className="h-full"
        centeredSlides={true}
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="relative h-64 w-full">
              <img
                src={image.image_url}
                alt={`${title} - изображение ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Кастомные стрелки, которые появляются только при наведении */}
      {multipleImages && hovering && (
        <>
          <button 
            className="swiper-nav-button prev absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/20 rounded-full w-10 h-10 flex items-center justify-center opacity-100 cursor-pointer"
            aria-label="Предыдущий слайд"
            onClick={goPrev}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="swiper-nav-button next absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/20 rounded-full w-10 h-10 flex items-center justify-center opacity-100 cursor-pointer"
            aria-label="Следующий слайд"
            onClick={goNext}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
} 