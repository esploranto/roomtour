import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function LoginPopup({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>Войти в Roomtour</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button onClick={onClose} className="w-full">Войти через Telegram</Button>
          <Button onClick={onClose} className="w-full">Войти через почту</Button>
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