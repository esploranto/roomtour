import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Plus } from "lucide-react";
import { ThemeContext } from "@/context/ThemeContext";
import { AuthContext } from "@/context/AuthContext";
import LoginPopup from "@/components/LoginPopup";
import AddPlacePopup from "@/components/AddPlacePopup";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function Header() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { isLoggedIn, user, login, logout } = useContext(AuthContext);
  const [loginPopupOpen, setLoginPopupOpen] = useState(false);
  const [addPlacePopupOpen, setAddPlacePopupOpen] = useState(false);
  const { t } = useTranslation();

  const openLoginPopup = () => setLoginPopupOpen(true);
  const closeLoginPopup = () => setLoginPopupOpen(false);
  
  const openAddPlacePopup = () => setAddPlacePopupOpen(true);
  const closeAddPlacePopup = () => setAddPlacePopupOpen(false);

  return (
    <header className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {/* Логотип */}
      <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
        🏡 Roomtour
      </Link>

      {/* Правая часть */}
      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          // Если пользователь залогинен, показываем кнопку "+ Добавить место"
          <Button variant="outline" onClick={openAddPlacePopup}>
            <Plus className="mr-1 h-4 w-4" /> {t("addPlace")}
          </Button>
        ) : (
          // Если не залогинен, показываем кнопку "Войти"
          <Button variant="outline" onClick={openLoginPopup}>
            {t("login")}
          </Button>
        )}

        {isLoggedIn && (
          // Аватар пользователя (если залогинен)
          <Avatar className="w-9 h-9">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.username} />
            ) : (
              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
            )}
          </Avatar>
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
      <AddPlacePopup isOpen={addPlacePopupOpen} onClose={closeAddPlacePopup} />
    </header>
  );
}