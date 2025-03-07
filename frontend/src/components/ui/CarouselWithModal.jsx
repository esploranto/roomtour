import React, { useState, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

// Модальное окно для увеличенного просмотра
function ImageModal({ isOpen, onClose, currentIndex, images, onPrev, onNext, canScrollPrev, canScrollNext }) {
  // Обработчик клавиш для модального окна
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && canScrollPrev) onPrev();
      else if (e.key === "ArrowRight" && canScrollNext) onNext();
    },
    [onClose, onPrev, onNext, canScrollPrev, canScrollNext]
  );

  // Добавляем и удаляем обработчик клавиш
  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // Блокируем прокрутку страницы при открытом модальном окне
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // Восстанавливаем прокрутку при закрытии
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="relative w-full h-full flex items-center justify-center" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-screen max-w-full flex items-center justify-center">
          {images[currentIndex]}
        </div>
        
        {/* Кнопка закрытия */}
        <Button
          variant="outline"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
        >
          <X className="h-6 w-6" />
          <span className="sr-only">Закрыть</span>
        </Button>
        
        {/* Кнопка "Предыдущий" */}
        {canScrollPrev && (
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
          >
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Предыдущий слайд</span>
          </Button>
        )}
        
        {/* Кнопка "Следующий" */}
        {canScrollNext && (
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
          >
            <ArrowRight className="h-6 w-6" />
            <span className="sr-only">Следующий слайд</span>
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
}

// Компонент карусели с модальным окном
export function CarouselWithModal({ images, className, ...props }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [api, setApi] = useState(null);
  
  // Обработчики для переключения слайдов
  const handlePrev = useCallback(() => {
    if (api && api.canScrollPrev()) {
      api.scrollPrev();
      setCurrentIndex(api.selectedScrollSnap());
    }
  }, [api]);

  const handleNext = useCallback(() => {
    if (api && api.canScrollNext()) {
      api.scrollNext();
      setCurrentIndex(api.selectedScrollSnap());
    }
  }, [api]);

  // Обновляем текущий индекс при изменении выбранного слайда
  const handleSelect = useCallback(() => {
    if (api) {
      setCurrentIndex(api.selectedScrollSnap());
    }
  }, [api]);

  // Подписываемся на событие выбора слайда
  useEffect(() => {
    if (!api) return;
    
    api.on("select", handleSelect);
    
    return () => {
      api.off("select", handleSelect);
    };
  }, [api, handleSelect]);

  // Обработчик клика по изображению
  const handleImageClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Настройки для карусели, чтобы изображения не обрезались
  const carouselOptions = {
    align: "center",
    containScroll: "trimSnaps",
  };

  return (
    <>
      <Carousel 
        setApi={setApi} 
        className={cn("w-full", className)} 
        opts={carouselOptions}
        {...props}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div 
                className="flex items-center justify-center w-full h-full cursor-pointer" 
                onClick={handleImageClick}
              >
                {React.cloneElement(image, {
                  className: cn(
                    image.props.className,
                    "max-h-full max-w-full object-contain mx-auto"
                  )
                })}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>

      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentIndex={currentIndex}
        images={images}
        onPrev={handlePrev}
        onNext={handleNext}
        canScrollPrev={api?.canScrollPrev() || false}
        canScrollNext={api?.canScrollNext() || false}
      />
    </>
  );
}

export default CarouselWithModal;