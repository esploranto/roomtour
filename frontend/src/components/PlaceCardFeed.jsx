import React from "react";
import PlaceCard from "@/components/ui/PlaceCard";

export default function PlaceCardFeed({ places, username }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
      {places.map((place) => (
        <PlaceCard
          key={place.id}
          to={`/${username}/${place.id}`} // формируем URL вида /username/placeId
          title={place.title}
          dates={place.dates}
          rating={place.rating}
          icon={place.icon} // можно передать иконку, если есть
        />
      ))}
    </div>
  );
}