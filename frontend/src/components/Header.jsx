import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Moon, Sun, Plus } from "lucide-react";
import { ThemeContext } from "@/context/ThemeContext";
import { AuthContext } from "@/context/AuthContext";
import LoginPopup from "@/components/LoginPopup";
import AddPlacePopup from "./AddPlacePopup/AddPlacePopup";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar.tsx";
import { getInitials } from "@/lib/utils.ts";
import { useTranslation } from "react-i18next";
import LogoLightMode from "@/images/logo-light-mode.svg";
import LogoDarkMode from "@/images/logo-dark-mode.svg";

export default function Header({ onPlaceAdded, onDialogStateChange }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { isLoggedIn, user } = useContext(AuthContext);
  const [loginPopupOpen, setLoginPopupOpen] = useState(false);
  const [addPlacePopupOpen, setAddPlacePopupOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Уведомляем родительский компонент об изменении состояния диалогов
  useEffect(() => {
    if (onDialogStateChange) {
      onDialogStateChange(loginPopupOpen || addPlacePopupOpen);
    }
  }, [loginPopupOpen, addPlacePopupOpen, onDialogStateChange]);

  const openLoginPopup = () => setLoginPopupOpen(true);
  const closeLoginPopup = () => setLoginPopupOpen(false);
  
  const openAddPlacePopup = () => setAddPlacePopupOpen(true);
  const closeAddPlacePopup = () => setAddPlacePopupOpen(false);

  const handlePlaceAdded = (newPlace) => {
    closeAddPlacePopup();
    
    // Добавляем отладочный вывод
    console.log('Header - handlePlaceAdded получил newPlace:', newPlace);
    
    if (onPlaceAdded) {
      onPlaceAdded(newPlace);
    }
    
    // Перенаправление теперь выполняется в AddPlacePopup.jsx
  };

  return (
    <header className="flex justify-between items-center p-3 pt-1 pb-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {/* Логотип */}
      <Link to="/" className="flex items-center text-xl font-bold text-gray-900 dark:text-white">
        <img 
          src={theme === "light" ? LogoLightMode : LogoDarkMode} 
          alt="Roomtour Logo" 
          className="h-14 mr-2" 
        />
        {t("logo")}
      </Link>

      {/* Правая часть */}
      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          <Button variant="outline" onClick={openAddPlacePopup}>
            <Plus className="mr-1 h-4 w-4" /> {t("addPlace")}
          </Button>
        ) : (
          <Button variant="outline" onClick={openLoginPopup}>
            Войти
          </Button>
        )}

        {isLoggedIn && (
          <Link to={`/${user.username.toLowerCase().replace(/\s+/g, '')}`}>
            <Avatar className="w-9 h-9 cursor-pointer">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.username} />
              ) : (
                <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
              )}
            </Avatar>
          </Link>
        )}

        {/* Переключатель темы */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* Всплывающие окна */}
      <LoginPopup isOpen={loginPopupOpen} onClose={closeLoginPopup} />
      <AddPlacePopup 
        isOpen={addPlacePopupOpen} 
        onClose={closeAddPlacePopup} 
        onPlaceAdded={handlePlaceAdded}
      />
    </header>
  );
}