import React from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react"; // Иконка по умолчанию

export default function PlaceCard({ to, title, dates, rating, icon: Icon }) {
  const PlaceIcon = Icon || Home;

  const cardContent = (
    <div className="relative p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 transition-all duration-200 hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
      {/* Заголовок карточки */}
      <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h2>
      {/* Даты проживания */}
      <p className="text-gray-600 dark:text-gray-300 mb-8">{dates}</p>
      {/* Рейтинг в левом нижнем углу */}
      <div className="absolute bottom-2 left-2 text-3xl font-bold text-gray-900 dark:text-white">
        {rating}
      </div>
      {/* Иконка места в правом нижнем углу */}
      <div className="absolute bottom-2 right-2 text-gray-600 dark:text-gray-300">
        <PlaceIcon size={24} />
      </div>
    </div>
  );

  return to ? <Link to={to}>{cardContent}</Link> : cardContent;
}