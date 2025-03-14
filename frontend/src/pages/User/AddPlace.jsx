import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AddPlacePopup from "@/components/AddPlacePopup/AddPlacePopup";

export default function AddPlace() {
  const [isPopupOpen, setIsPopupOpen] = useState(true);
  const navigate = useNavigate();
  const { username } = useParams();

  const handleClose = () => {
    setIsPopupOpen(false);
    // Перенаправляем пользователя на страницу профиля после закрытия попапа
    navigate(`/${username}`);
  };

  return (
    <AddPlacePopup isOpen={isPopupOpen} onClose={handleClose} />
  );
} 