import React, { useState, useContext } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ArrowUp, MoreVertical, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { getInitials } from "@/lib/utils.ts";
import { AuthContext } from "@/context/AuthContext";

export default function ProfileCard({ 
  username, 
  placesCount, 
  description = "", 
  avatarUrl = null,
  onDescriptionChange = () => {},
  onShare = () => {},
  onEditProfile = () => {}
}) {
  const { user } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description);

  // Используем данные из AuthContext, если это профиль текущего пользователя
  const displayUsername = user && user.username === username ? user.username : username;
  const displayAvatarUrl = user && user.username === username ? user.avatarUrl : avatarUrl;

  console.log("ProfileCard - User from AuthContext:", user);
  console.log("ProfileCard - Username prop:", username);
  console.log("ProfileCard - Display username:", displayUsername);

  const handleSaveDescription = () => {
    onDescriptionChange(editedDescription);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedDescription(description);
    setIsEditing(false);
  };

  return (
    <div className="w-full md:w-1/2 flex justify-self-center p-8 pb-12 mb-10 rounded-3xl shadow-sm bg-gray-100 dark:bg-gray-800">
      <div className="flex flex-col md:flex-row gap-4">
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
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onShare}
                title="Поделиться"
              >
                <ArrowUp size={20} />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    title="Дополнительные действия"
                  >
                    <MoreVertical size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEditProfile}>
                    <Edit className="mr-2 h-4 w-4" />
                    Редактировать профиль
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Описание профиля */}
          <div className="mt-4">
            {isEditing ? (
              <div>
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Расскажите о себе..."
                  className="min-h-[80px]"
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleSaveDescription}>Сохранить</Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>Отмена</Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                  {description || "Нет описания"}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-0 right-0" 
                  onClick={() => setIsEditing(true)}
                >
                  <Edit size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 