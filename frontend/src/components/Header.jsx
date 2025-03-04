import { Link } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

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
            <Link to="/add" className="btn">
              + Добавить место
            </Link>
          ) : (
            <Link to="/profile" className="btn">
              Профиль
            </Link>
          )
        ) : (
          <Link to="/login" className="btn">
            Войти
          </Link>
        )}

        {/* Переключатель темы */}
        <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
}