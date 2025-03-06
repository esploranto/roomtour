import React from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import PlaceCard from "@/components/ui/PlaceCard";


export default function Profile() {
  const { username } = useParams();

  return (
    <div className="p-4">
      {/* Кнопка "Назад на главную" */}
      <Button variant="outline" asChild className="mb-4">
        <Link to="/">
          <ArrowLeft size={16} className="mr-2" />
          Назад на главную
        </Link>
      </Button>

      {/* Заголовок профиля */}
      <h1 className="text-2xl font-bold mb-4">{username}</h1>

      {/* Карточка с местом проживания */}
      <PlaceCard
        title="Гостиница Сибирь"
        dates="01.01.2023 — 07.01.2023"
        rating={8}
      />

      {/* Кнопка "Добавить место" */}
      <Button variant="outline" asChild>
        <Link to={`/${username}/add`}>
          <Plus size={16} className="mr-2" />
          Добавить место
        </Link>
      </Button>
    </div>
  );
}