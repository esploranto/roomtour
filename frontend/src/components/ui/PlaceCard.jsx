import React from "react";
import { Home } from "lucide-react"; // Используем Home как иконку по умолчанию

// Компонент принимает пропсы: title — название места,
// dates — период проживания, rating — оценка, icon — иконка (опционально)
export default function PlaceCard({ title, dates, rating, icon: Icon }) {
  // Если не передана иконка через пропсы, используем Home
  const PlaceIcon = Icon || Home;

  return (
    <div className="relative p-4 border rounded-lg shadow-md bg-white dark:bg-gray-800">
      {/* Заголовок карточки */}
      <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
        {title}
      </h2>
      {/* Даты проживания */}
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        {dates}
      </p>
      {/* Оценка в левом нижнем углу */}
      <div className="absolute bottom-2 left-2 text-3xl font-bold text-gray-900 dark:text-white">
        {rating}
      </div>
      {/* Иконка места в правом нижнем углу */}
      <div className="absolute bottom-2 right-2 text-gray-600 dark:text-gray-300">
        <PlaceIcon size={24} />
      </div>
    </div>
  );
}