import React from "react";
import PlaceCard from "@/components/ui/PlaceCard.jsx";
import { usePlaces } from "@/lib/hooks";

export default function PlaceCardFeed({ username, initialPlaces = null }) {
  // Используем хук для получения данных, если initialPlaces не предоставлен
  const { places: fetchedPlaces, isLoading, error } = initialPlaces ? { places: initialPlaces, isLoading: false, error: null } : usePlaces();
  
  // Используем initialPlaces, если они предоставлены, иначе используем данные из хука
  const places = initialPlaces || fetchedPlaces;
  
  // Создаем копию массива и переворачиваем его, чтобы последние добавленные элементы были в начале
  const reversedPlaces = [...places].reverse();
  
  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2">Загрузка мест...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
        Не удалось загрузить места. Пожалуйста, попробуйте позже.
      </div>
    );
  }
  
  if (!places || places.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Нет добавленных мест</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-10">
      {reversedPlaces.map((place, index) => {
        // Определяем идентификатор для URL
        const placeIdentifier = place.slug && place.slug.trim() !== '' 
          ? place.slug 
          : place.id;
          
        return (
          <div key={place.id} className="h-full">
            <PlaceCard
              to={`/${username}/${placeIdentifier}`}
              title={place.title}
              dates={place.dates}
              rating={place.rating}
              icon={place.icon}
              location={place.location}
              images={place.images || []}
              imageUrl={place.images && place.images.length > 0 ? place.images[0].image_url : null}
            />
          </div>
        );
      })}
    </div>
  );
}