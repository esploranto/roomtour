import React, { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import ReactDOM from "react-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Модальное окно для увеличенного просмотра
function CarouselModal({ isOpen, onClose, children, onPrev, onNext, canPrev, canNext }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div className="relative max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {children}
        {canPrev && (
          <Button
            variant="outline"
            size="icon"
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2"
          >
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Previous slide</span>
          </Button>
        )}
        {canNext && (
          <Button
            variant="outline"
            size="icon"
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <ArrowRight className="h-6 w-6" />
            <span className="sr-only">Next slide</span>
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
}

// Основной компонент карусели с модальным просмотром
export function CarouselWithModal({ children, ...props }) {
  // Инициализируем embla-carousel для стандартной карусели
  const [emblaRef, emblaApi] = useEmblaCarousel({ axis: "x" });
  // Преобразуем дочерние элементы в массив
  const itemsArray = React.Children.toArray(children);
  const itemCount = itemsArray.length;

  // Состояния: активный слайд и модальное окно
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // При клике на слайд открываем модальное окно и сохраняем индекс
  const handleItemClick = useCallback((index) => {
    setActiveIndex(index);
    setModalOpen(true);
  }, []);

  // Добавляем обработчик клика к каждому слайду
  const modifiedItems = itemsArray.map((child, index) =>
    React.cloneElement(child, {
      onClick: () => handleItemClick(index),
      className: cn("cursor-pointer", child.props.className),
    })
  );

  // Функции переключения слайдов: обновляют embla и активный индекс
  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      setActiveIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
      setActiveIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  return (
    <>
      {/* Обычная карусель */}
      <div ref={emblaRef} className="relative overflow-hidden">
        {/* Оборачиваем слайды в flex-контейнер */}
        <div className="flex">{modifiedItems}</div>
        {/* Стрелки для обычного режима */}
        <Button
          variant="outline"
          onClick={scrollPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Previous</span>
        </Button>
        <Button
          variant="outline"
          onClick={scrollNext}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          <ArrowRight className="h-6 w-6" />
          <span className="sr-only">Next</span>
        </Button>
      </div>
      {/* Модальное окно для увеличенного просмотра */}
      <CarouselModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onPrev={scrollPrev}
        onNext={scrollNext}
        canPrev={itemCount > 1}
        canNext={itemCount > 1}
      >
        <div className="w-full">{itemsArray[activeIndex]}</div>
      </CarouselModal>
    </>
  );
}

export const CarouselItem = React.forwardRef((props, ref) => (
  <div
    ref={ref}
    role="group"
    aria-roledescription="slide"
    className={cn("w-full flex-shrink-0", props.className)}
    {...props}
  />
));
CarouselItem.displayName = "CarouselItem";

export default CarouselWithModal;