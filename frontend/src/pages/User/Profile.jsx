import React, { useContext, useEffect } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft } from "lucide-react";
import PlaceCardFeed from "@/components/PlaceCardFeed";
import ProfileCard from "@/components/ui/profileCard.jsx";
import { AuthContext } from "@/context/AuthContext";
import { usePlaces, useUserProfile } from "@/lib/hooks";
import { useToast } from "@/context/ToastContext";

export default function Profile() {
  // Получаем данные пользователя из AuthContext
  const { user } = useContext(AuthContext);
  const { username: urlUsername } = useParams();
  const { lastAddedPlace } = useOutletContext() || {};
  const { showSuccess, showError, showInfo } = useToast();
  
  // Используем хук для получения мест
  const { places, isLoading, error, mutate } = usePlaces();
  
  // Используем хук для получения профиля пользователя
  const username = urlUsername || user?.username;
  const { 
    profile, 
    updateDescription, 
    shareProfile 
  } = useUserProfile(username);
  
  // Обновляем список мест при добавлении нового через попап
  useEffect(() => {
    if (lastAddedPlace) {
      console.log('Profile - Добавлено новое место, обновляем список:', lastAddedPlace);
      // Вызываем revalidate для обновления данных
      mutate();
      
      // Не показываем уведомление, так как пользователь должен быть перенаправлен на страницу места
      // showSuccess('Место успешно добавлено!');
    }
  }, [lastAddedPlace, mutate]);

  const handleDescriptionChange = async (newDescription) => {
    console.log("Обновляем описание профиля:", newDescription);
    const success = await updateDescription(newDescription);
    if (success) {
      console.log("Описание профиля успешно обновлено");
      showSuccess('Описание профиля успешно обновлено');
    } else {
      console.error("Не удалось обновить описание профиля");
      showError('Не удалось обновить описание профиля');
    }
  };

  const handleShare = async () => {
    console.log("Делимся профилем:", username);
    const shareData = await shareProfile();
    
    // Используем Web Share API, если он доступен
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Профиль ${username} на RoomTour`,
          text: `Посмотрите места, которые посетил ${username}`,
          url: shareData.shareUrl || window.location.href,
        });
        console.log("Профиль успешно расшарен");
        showSuccess('Профиль успешно расшарен');
      } catch (error) {
        console.error("Ошибка при шаринге:", error);
        // Если Web Share API не сработал, копируем ссылку в буфер обмена
        copyToClipboard(shareData.shareUrl || window.location.href);
      }
    } else {
      // Если Web Share API не поддерживается, копируем ссылку в буфер обмена
      copyToClipboard(shareData.shareUrl || window.location.href);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log("Ссылка скопирована в буфер обмена");
        showInfo('Ссылка скопирована в буфер обмена');
      })
      .catch(err => {
        console.error("Не удалось скопировать ссылку:", err);
        showError('Не удалось скопировать ссылку');
      });
  };

  const handleEditProfile = () => {
    // Логика для редактирования профиля
    console.log("Editing profile:", username);
    showInfo('Редактирование профиля пока не реализовано');
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
      {(user || profile) && (
        <ProfileCard 
          username={username}
          placesCount={places.length}
          description={profile?.description || ""}
          avatarUrl={profile?.avatarUrl || user?.avatarUrl}
          onDescriptionChange={handleDescriptionChange}
          onShare={handleShare}
          onEditProfile={handleEditProfile}
        />
      )}

      {/* Лента карточек мест с передачей username */}
      <PlaceCardFeed username={username} />
    </div>
  );
}