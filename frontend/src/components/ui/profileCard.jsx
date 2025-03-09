import React, { useState, useContext } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Share, MoreVertical, Edit, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { getInitials } from "@/lib/utils.ts";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ProfileCard({ 
  username, 
  placesCount, 
  description = "", 
  avatarUrl = null,
  onDescriptionChange = () => {},
  onShare = () => {},
  onEditProfile = () => {}
}) {
  const { user, logout } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description);
  const navigate = useNavigate();

  // Используем данные из AuthContext, если это профиль текущего пользователя
  const displayUsername = user?.username || username;
  const displayAvatarUrl = user?.avatarUrl || avatarUrl;
  
  // Добавляем отладочную информацию
  console.log("ProfileCard - Current user:", user?.username);
  console.log("ProfileCard - Profile username:", username);
  console.log("ProfileCard - Are they equal?:", user?.username === username);

  const handleSaveDescription = () => {
    onDescriptionChange(editedDescription);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedDescription(description);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="w-full xl:w-1/2 flex justify-self-center p-8 pb-12 mb-10 rounded-3xl shadow-sm bg-gray-100 dark:bg-gray-800">
      <div className="w-full flex flex-col md:flex-row gap-4">
        {/* Аватар */}
        <div className="flex-shrink-0">
          <Avatar className="h-24 w-24">
            <AvatarImage src={displayAvatarUrl} alt={displayUsername} />
            <AvatarFallback>{getInitials(displayUsername)}</AvatarFallback>
          </Avatar>
        </div>

        {/* Информация о пользователе */}
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{displayUsername}</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {placesCount} {placesCount === 1 ? "место" : 
                  placesCount > 1 && placesCount < 5 ? "места" : "мест"}
              </p>
            </div>
            
            {/* Кнопки действий */}
            <div className="flex gap-2 items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onShare}
                title="Поделиться"
              >
                <Share className="h-5 w-5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    title="Дополнительные действия"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Редактировать описание
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Описание профиля */}
          <div className="mt-4">
            {isEditing ? (
              <div className="w-full">
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Расскажите о себе..."
                  className="min-h-[80px] w-full resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={handleSaveDescription}>Сохранить</Button>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>Отмена</Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                {description || "Нет описания"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 