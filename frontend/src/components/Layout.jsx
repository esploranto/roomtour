import { Outlet, useLocation, useOutletContext } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function Layout() {
  const location = useLocation();
  const [lastAddedPlace, setLastAddedPlace] = useState(null);
  const { isLoggedIn } = useContext(AuthContext);

  // Обработчик добавления нового места
  const handlePlaceAdded = (newPlace) => {
    console.log('Layout - handlePlaceAdded получил newPlace:', newPlace);
    setLastAddedPlace(newPlace);
  };

  // Пример логики: если URL — главная страница, isHome = true
  const isHome = location.pathname === "/";

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