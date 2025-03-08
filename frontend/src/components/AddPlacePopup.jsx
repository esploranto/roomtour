import React, { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.jsx";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils.ts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.jsx";
import { Calendar } from "@/components/ui/calendar.jsx";

export default function AddPlacePopup({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [photo, setPhoto] = useState(null);

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const isFormValid = name && address && startDate && endDate && photo;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Здесь будет логика отправки данных на сервер
    console.log({
      name,
      address,
      startDate,
      endDate,
      comment,
      photo,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>Новое место</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="photo" className="block mb-2">Фото места</Label>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => document.getElementById('photo').click()}
              >
                Загрузить фото
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {photo ? photo.name : "Файл не выбран"}
              </span>
            </div>
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          <div>
            <Label htmlFor="name" className="block mb-2">Название места</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название места"
              required
            />
          </div>

          <div>
            <Label htmlFor="address" className="block mb-2">Адрес</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Введите адрес"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="block mb-2">Дата заезда</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "PPP", { locale: ru })
                    ) : (
                      <span>Выберите дату</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="endDate" className="block mb-2">Дата выезда</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="endDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                    disabled={!startDate}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "PPP", { locale: ru })
                    ) : (
                      <span>Выберите дату</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="comment" className="block mb-2">Комментарий</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Введите комментарий"
              rows={3}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Отмена
            </Button>
            <Button type="submit" disabled={!isFormValid} variant="outline" className="w-full sm:w-auto">
              Добавить место
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 