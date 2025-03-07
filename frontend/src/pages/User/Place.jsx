import React from "react";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import image1 from "@/images/IMG_7927.jpeg";
import image2 from "@/images/IMG_7932.jpeg";
import image3 from "@/images/IMG_7966.jpeg";

export default function Place() {
  const { username, placeId } = useParams();

  // Тестовые данные для изображений карусели
  const images = [
    {
      src: image1,
      alt: "Фото 1"
    },
    {
      src: image2,
      alt: "Фото 2"
    },
    {
      src: image3,
      alt: "Фото 3"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Верхняя часть: Заголовок, кнопка "Поделиться" и рейтинг */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold">Квартира на Исполкомской</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">Поделиться</Button>
          <div className="text-5xl font-medium">10</div>
        </div>
      </div>

      {/* Адрес и даты */}
      <p className="text-gray-500 mb-1">Питер, Исполкомская ул., 17</p>
      <p className="mb-6">17–21 сен 2023</p>

      {/* Стандартная карусель */}
      <div className="relative mb-8">
        <Carousel 
          opts={{
            align: "center",
            loop: true
          }}
          className="w-full max-h-[500px]"
        >
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index} className="flex items-center justify-center">
                <div className="flex items-center justify-center h-full w-full p-2">
                  <img 
                    src={image.src} 
                    alt={image.alt} 
                    className="max-h-[450px] w-auto object-contain rounded-md mx-auto" 
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      </div>

      {/* Две колонки: Понравилось / Не понравилось */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border p-4 rounded-md">
          <h2 className="font-bold mb-2">Понравилось</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Кухня, телек, ремонт, техника (холодильник, плита, микроволновка).
            Кровать удобная, окна на улицу, классная ванная.
          </p>
        </div>
        <div className="border p-4 rounded-md">
          <h2 className="font-bold mb-2">Не понравилось</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Вода в ванной ржавеет, радиаторы шумят. Соседи курят на лестнице.
            Нет нормального вида из окна. Двор колодец, внутрь мало света.
          </p>
        </div>
      </div>

      {/* Блок "Оценки" */}
      <div className="mb-6">
        <h2 className="font-bold mb-2">Оценки</h2>
        <div className="flex flex-col gap-2">
          <Button variant="outline">Чистота</Button>
          <Button variant="outline">Красота</Button>
          <Button variant="outline">Кухня</Button>
          <Button variant="outline">Ванная</Button>
          <Button variant="outline">Спальня</Button>
          <Button variant="outline">Вид из окна</Button>
        </div>
      </div>

      {/* Место на карте */}
      <div className="mb-6">
        <h2 className="font-bold mb-2">Место на карте</h2>
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-md" />
      </div>
    </div>
  );
}