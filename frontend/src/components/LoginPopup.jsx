import React from "react";
import { Button } from "@/components/ui/button";

export default function LoginPopup({ onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-md">
        <h2 className="text-xl font-bold mb-4">Войти в Roomtour</h2>
        <div className="flex flex-col gap-2">
          <Button onClick={onClose}>Войти через Telegram</Button>
          <Button onClick={onClose}>Войти через почту</Button>
        </div>
        <button onClick={onClose} className="mt-4 underline">
          Закрыть
        </button>
      </div>
    </div>
  );
}