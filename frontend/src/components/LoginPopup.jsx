import React, { useContext } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPopup({ isOpen, onClose }) {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleTelegramLogin = () => {
    const username = "Sergey Frolov";
    // Тестовые данные пользователя
    const testUser = {
      username,
      avatarUrl: "", // можно добавить URL аватара, если нужно
      profileUrl: username.toLowerCase().replace(/\s+/g, '')
    };

    // Вызываем функцию входа из контекста
    login(testUser);
    
    // Закрываем попап
    onClose();

    // Перенаправляем на страницу профиля
    navigate(`/${testUser.profileUrl}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>Войти в Roomtour</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={handleTelegramLogin} className="w-full">
            Войти через Telegram
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Войти через почту
          </Button>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}