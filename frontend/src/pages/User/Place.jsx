import React, { useRef } from "react";
import { Button } from "@/components/ui/button.tsx";
import { useParams, Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel.tsx";
import { ArrowLeft } from "lucide-react";
import { usePlace } from "@/lib/hooks";

export default function Place() {
  // Здесь placeId может быть как id, так и slug
  const { username, placeId } = useParams();
  const carouselRef = useRef(null);
  
  // Используем новый хук для получения данных места
  const { place, isLoading, error } = usePlace(placeId);

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2">Загрузка данных места...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
          Не удалось загрузить данные места. Пожалуйста, попробуйте позже.
        </div>
        
        {/* Кнопка "Назад к профилю" */}
        <Button variant="outline" asChild className="mb-4">
          <Link to={`/${username}`}>
            <ArrowLeft size={16} className="mr-2" />
            Назад к профилю
          </Link>
        </Button>
        
        {/* Отладочная информация (только в режиме разработки) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">Отладочная информация:</h3>
            <pre className="text-xs overflow-auto">{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  if (!place) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Место не найдено</p>
        
        {/* Кнопка "Назад к профилю" */}
        <Button variant="outline" asChild className="mt-4">
          <Link to={`/${username}`}>
            <ArrowLeft size={16} className="mr-2" />
            Назад к профилю
          </Link>
        </Button>
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

      <h1 className="text-3xl font-bold mb-2">{place.name}</h1>
      <p className="text-gray-600 mb-6">{place.location}</p>

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
          >
            <CarouselContent className="max-h-[500px]">
              {place.images.map((image, index) => (
                <CarouselItem key={index} className={`h-full ${getCarouselItemClass()}`}>
                  <div className="p-1 h-full flex items-center justify-center">
                    <img
                      src={image.image_url}
                      alt={`${place.name} - изображение ${index + 1}`}
                      className="max-h-[480px] w-auto object-contain rounded-lg mx-auto"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {imagesCount > 1 && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
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

      {/* Дата добавления */}
      <div className="text-sm text-gray-500">
        Добавлено: {new Date(place.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}