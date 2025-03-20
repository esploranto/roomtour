import { Outlet, useLocation, useOutletContext } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import SyncStatus from './SyncStatus';

export default function Layout() {
  const location = useLocation();
  const [lastAddedPlace, setLastAddedPlace] = useState(null);
  const { isLoggedIn } = useContext(AuthContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Обработчик добавления нового места
  const handlePlaceAdded = (newPlace) => {
    console.log('Layout - handlePlaceAdded получил newPlace:', newPlace);
    setLastAddedPlace(newPlace);
  };

  // Обработчик открытия/закрытия диалога
  const handleDialogStateChange = (isOpen) => {
    setIsDialogOpen(isOpen);
  };

  // Пример логики: если URL — главная страница, isHome = true
  const isHome = location.pathname === "/";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Хедер */}
      <Header 
        isLoggedIn={isLoggedIn} 
        isHome={isHome} 
        onPlaceAdded={handlePlaceAdded} 
        onDialogStateChange={handleDialogStateChange}
      />

      {/* Основной контент (растягивается на всю высоту) */}
      <main className="flex-1 overflow-visible">
        <SyncStatus isDialogOpen={isDialogOpen} />
        <Outlet context={{ lastAddedPlace, onDialogStateChange: handleDialogStateChange }} />
      </main>

      {/* Футер (прибит к низу) */}
      <Footer />
    </div>
  );
}