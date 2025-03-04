import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  const location = useLocation();

  // Пример логики: если URL — главная страница, isHome = true
  const isHome = location.pathname === "/";
  // Временно задаем логин как true/false для теста
  const isLoggedIn = true; // Меняй на false, чтобы проверить кнопку "Войти"

  return (
    <div className="min-h-screen flex flex-col">
      {/* Хедер */}
      <Header isLoggedIn={isLoggedIn} isHome={isHome} />

      {/* Основной контент (растягивается на всю высоту) */}
      <main className="flex-1 container mx-auto p-4">
        <Outlet />
      </main>

      {/* Футер (прибит к низу) */}
      <Footer />
    </div>
  );
}