import { Outlet, useLocation, useOutletContext } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useState } from "react";

export default function Layout() {
  const location = useLocation();
  const [lastAddedPlace, setLastAddedPlace] = useState(null);

  // Обработчик добавления нового места
  const handlePlaceAdded = (newPlace) => {
    setLastAddedPlace(newPlace);
  };

  // Пример логики: если URL — главная страница, isHome = true
  const isHome = location.pathname === "/";
  // Временно задаем логин как true/false для теста
  const isLoggedIn = false; // Меняй на false, чтобы проверить кнопку "Войти"

  return (
    <div className="flex flex-col min-h-screen">
      {/* Хедер */}
      <Header isLoggedIn={isLoggedIn} isHome={isHome} onPlaceAdded={handlePlaceAdded} />

      {/* Основной контент (растягивается на всю высоту) */}
      <main className="flex-1 overflow-auto">
        <Outlet context={{ lastAddedPlace }} />
      </main>

      {/* Футер (прибит к низу) */}
      <Footer />
    </div>
  );
}