import React, { useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft, Plus } from "lucide-react";
import PlaceCardFeed from "@/components/PlaceCardFeed";
import ProfileCard from "@/components/ui/profileCard.jsx";
import { AuthContext } from "@/context/AuthContext";


export default function Profile() {
  // Получаем данные пользователя из AuthContext
  const { user } = useContext(AuthContext);
  
  // Тестовые данные для карточек
  const dummyPlaces = [
    { id: 1, title: "Place 1", dates: "01.01.2023 – 05.01.2023", rating: 8, icon: null, to: "/${username}/{place}" },
    { id: 2, title: "Place 2", dates: "06.01.2023 – 10.01.2023", rating: 7, icon: null },
    { id: 3, title: "Place 3", dates: "11.01.2023 – 15.01.2023", rating: 9, icon: null },
    { id: 4, title: "Place 4", dates: "16.01.2023 – 20.01.2023", rating: 6, icon: null },
    { id: 5, title: "Place 5", dates: "11.01.2023 – 15.01.2023", rating: 9, icon: null },
    { id: 6, title: "Place 6", dates: "16.01.2023 – 20.01.2023", rating: 6, icon: null },
    { id: 7, title: "Place 7", dates: "11.01.2023 – 15.01.2023", rating: 9, icon: null },
    { id: 8, title: "Place 8", dates: "16.01.2023 – 20.01.2023", rating: 6, icon: null },
  ];
  const { username: urlUsername } = useParams();
  const [userDescription, setUserDescription] = useState("Собираю места, в которых жил в поездках. Вдохновляюсь удачными решениями в дизайне и красивыми интерьерами.");

  // Всегда используем данные из AuthContext для демонстрации
  // В реальном приложении нужно будет загружать данные пользователя с сервера
  // на основе urlUsername
  
  console.log("User from AuthContext:", user);

  const handleDescriptionChange = (newDescription) => {
    setUserDescription(newDescription);
    // Здесь можно добавить логику для сохранения описания на сервере
  };

  const handleShare = () => {
    // Логика для шаринга профиля
    console.log("Sharing profile:", user.username);
  };

  const handleEditProfile = () => {
    // Логика для редактирования профиля
    console.log("Editing profile:", user.username);
  };

  return (
    <div className="pt-12">
      {/* Кнопка "Назад на главную" */}
      <Button variant="outline" asChild className="mb-4">
        <Link to="/">
          <ArrowLeft size={16} className="mr-0" />
          На главную
        </Link>
      </Button>

      {/* Карточка профиля пользователя */}
      {user && (
        <ProfileCard 
          username={user.username}
          placesCount={dummyPlaces.length}
          description={userDescription}
          avatarUrl={user.avatarUrl}
          onDescriptionChange={handleDescriptionChange}
          onShare={handleShare}
          onEditProfile={handleEditProfile}
        />
      )}

      {/* Лента карточек мест */}
      <PlaceCardFeed places={dummyPlaces} username={urlUsername} />

    </div>
  );
}