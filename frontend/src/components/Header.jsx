import { Link } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header({ isLoggedIn, isHome }) {
  const { theme, toggleTheme } = useContext(ThemeContext); // Получаем текущую тему и функцию переключения

  return (
    <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 shadow-md">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        <Link to="/">🏡 Roomtour</Link>
      </h1>

      <div className="flex items-center gap-4">
        {/* Логика кнопки */}
        {isLoggedIn ? (
          isHome ? (
            <Button variant="outline" asChild>
              <Link to="/add">+ Добавить место</Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link to="/profile">Профиль</Link>
            </Button>
          )
        ) : (
          <Button variant="outline" asChild>
            <Link to="/login">Войти</Link>
          </Button>
        )}

        {/* Переключатель темы */}
        <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
}