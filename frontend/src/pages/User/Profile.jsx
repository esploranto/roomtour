import React from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import PlaceCardFeed from "@/components/PlaceCardFeed";


export default function Profile() {
  // Тестовые данные для карточек
  const dummyPlaces = [
    { id: 1, title: "Place 1", dates: "01.01.2023 – 05.01.2023", rating: 8, icon: null, to: "/${username}/{place}" },
    { id: 2, title: "Place 2", dates: "06.01.2023 – 10.01.2023", rating: 7, icon: null },
    { id: 3, title: "Place 3", dates: "11.01.2023 – 15.01.2023", rating: 9, icon: null },
    { id: 4, title: "Place 4", dates: "16.01.2023 – 20.01.2023", rating: 6, icon: null },
  ];
  const { username } = useParams();

  return (
    <div className="pt-12">
      {/* Кнопка "Назад на главную" */}
      <Button variant="outline" asChild className="mb-4">
        <Link to="/">
          <ArrowLeft size={16} className="mr-0" />
          На главную
        </Link>
      </Button>

      {/* Заголовок профиля */}
      <h1 className="text-2xl font-bold mb-4">{username}</h1>

      {/* Лента карточек мест */}
      <PlaceCardFeed places={dummyPlaces} username={username} />

    </div>
  );
}