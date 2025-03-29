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
import LogoLightMode from "@/assets/logo/logo-light-mode.svg";
import LogoDarkMode from "@/assets/logo/logo-dark-mode.svg";

export default function Header({ onPlaceAdded, onDialogStateChange }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { isLoggedIn, user } = useContext(AuthContext);
  const [loginPopupOpen, setLoginPopupOpen] = useState(false);
  const [addPlacePopupOpen, setAddPlacePopupOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Функция для форматирования имени пользователя в URL
  const formatUsernameForUrl = (username) => {
    return username.toLowerCase().replace(/\s+/g, '-');
  };

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
    if (onPlaceAdded) {
      onPlaceAdded(newPlace);
    }
  };

  return (
    <>
      <header className="header relative">
        <div className="container mx-auto px-4 py-1">
          <div className="flex justify-between items-center h-20">
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
                <Button variant="outline" onClick={openAddPlacePopup} className="md:flex">
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:inline ml-1">{t("addPlace")}</span>
                </Button>
              ) : (
                <Button variant="outline" onClick={openLoginPopup}>
                  Войти
                </Button>
              )}

              {isLoggedIn && (
                <Link to={`/${formatUsernameForUrl(user.username)}`}>
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
                aria-label={theme === "light" ? "Включить темную тему" : "Включить светлую тему"}
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Всплывающие окна */}
        <LoginPopup isOpen={loginPopupOpen} onClose={closeLoginPopup} />
        <AddPlacePopup 
          isOpen={addPlacePopupOpen} 
          onClose={closeAddPlacePopup} 
          onPlaceAdded={handlePlaceAdded}
        />
      </header>
      {/* Спейсер для контента под фиксированным хедером */}
      <div className="h-20" />
    </>
  );
}