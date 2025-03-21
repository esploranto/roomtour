import React from "react";
import PlaceCard from "@/components/ui/PlaceCard.jsx";
import { usePlaces } from "@/lib/hooks";

export default function PlaceCardFeed({ username, initialPlaces = null }) {
  // Используем хук для получения данных, если initialPlaces не предоставлен
  const { places: fetchedPlaces, isLoading, error } = initialPlaces ? { places: initialPlaces, isLoading: false, error: null } : usePlaces();
  
  // Используем initialPlaces, если они предоставлены, иначе используем данные из хука
  const places = initialPlaces || fetchedPlaces;
  
  // Отладочный лог для проверки данных
  console.log('Raw places data:', places?.map(p => ({
    id: p.id,
    title: p.title,
    created_at: p.created_at,
    updated_at: p.updated_at,
    date_obj: p.created_at ? new Date(p.created_at) : 'No created_at'
  })));
  
  // Сортируем места по дате создания в обратном порядке
  const sortedPlaces = places ? [...places].sort((a, b) => {
    // Проверяем наличие дат создания
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 
                 a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 
                 b.updated_at ? new Date(b.updated_at).getTime() : 0;
                 
    console.log(`Comparing dates for "${a.title}" (${aDate}) vs "${b.title}" (${bDate})`);
    
    // Если обе даты валидны, сравниваем их
    if (aDate && bDate) {
      return bDate - aDate;
    }
    
    // Если только одна из дат валидна, ставим элемент с датой выше
    if (aDate) return -1;
    if (bDate) return 1;
    
    // Если нет дат, сравниваем по ID (чтобы сохранить стабильную сортировку)
    return b.id - a.id;
  }) : [];
  
  // Отладочный лог для проверки сортировки
  console.log('Sorted places:', sortedPlaces?.map(p => ({
    id: p.id,
    title: p.title,
    created_at: p.created_at,
    updated_at: p.updated_at
  })));
  
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-24 auto-rows-fr overflow-visible">
      {sortedPlaces.map((place, index) => {
        // Определяем идентификатор для URL
        const placeIdentifier = place.slug && place.slug.trim() !== '' 
          ? place.slug 
          : place.id;
          
        return (
          <div key={place.id} className="min-w-0 overflow-visible">
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