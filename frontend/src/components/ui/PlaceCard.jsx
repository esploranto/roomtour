import React from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react"; // Иконка по умолчанию

export default function PlaceCard({ to, title, dates, rating, icon: Icon, imageUrl }) {
  const PlaceIcon = Icon || Home;

  const cardContent = (
    <div className="relative p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 transition-all duration-200 hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer h-[500px] flex flex-col">
      {/* Изображение места (если есть) */}
      {imageUrl ? (
        <div className="mb-3 h-64 overflow-hidden rounded">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="mb-3 h-64 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
          <PlaceIcon size={64} className="text-gray-400 dark:text-gray-500" />
        </div>
      )}
      
      {/* Контент карточки */}
      <div className="flex-grow flex flex-col">
        {/* Заголовок карточки */}
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h2>
        {/* Даты проживания */}
        <p className="text-gray-600 dark:text-gray-300 mb-4">{dates}</p>
        {/* Растягивающийся пустой блок */}
        <div className="flex-grow"></div>
        {/* Рейтинг в левом нижнем углу */}
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {rating}
        </div>
      </div>
      
      {/* Иконка места в правом нижнем углу */}
      <div className="absolute bottom-4 right-4 text-gray-600 dark:text-gray-300">
        <PlaceIcon size={24} />
      </div>
    </div>
  );

  return to ? <Link to={to} className="block h-full">{cardContent}</Link> : cardContent;
}