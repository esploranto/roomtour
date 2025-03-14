import React from "react";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.jsx";
import { Button } from "@/components/ui/button.tsx";
import { MapPin, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import { Calendar } from "@/components/ui/calendar.jsx";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import DatePicker from "@/components/ui/date-picker.jsx";
import { handleStartDateSelect, handleEndDateSelect } from "@/lib/utils";

const PlaceForm = ({
  name,
  setName,
  address,
  setAddress,
  comment,
  setComment,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  rating,
  setRating,
  showMap,
  setShowMap,
  startDatePopoverOpen,
  setStartDatePopoverOpen,
  endDatePopoverOpen,
  setEndDatePopoverOpen,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name" className="block mb-2">Название</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например «Выходные на майские»"
          autoComplete="off"
          aria-autocomplete="none"
        />
      </div>

      <div>
        <Label htmlFor="address" className="block mb-2">Адрес</Label>
        <div className="flex">
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Укажите адрес"
            className="flex-grow rounded-r-none"
            autoComplete="off"
            aria-autocomplete="none"
          />
          <Button 
            type="button" 
            variant="outline" 
            className="rounded-l-none border-l-0"
            onClick={() => setShowMap(!showMap)}
          >
            Карта
          </Button>
        </div>

        {showMap && (
          <div className="mt-2 border rounded-md p-4 h-[200px] flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MapPin className="mx-auto mb-2" />
              <p>Функционал карты будет добавлен позже</p>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label className="block mb-2">Даты проживания</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Popover open={startDatePopoverOpen} onOpenChange={setStartDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: ru }) : "Дата заезда"}
                </Button>
              </PopoverTrigger>
              {startDate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setStartDate(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    setStartDatePopoverOpen(false);
                    if (endDate && date > endDate) {
                      setEndDate(null);
                    }
                  }}
                  disabled={(date) => endDate && date > endDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={endDatePopoverOpen} onOpenChange={setEndDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: ru }) : "Дата выезда"}
                </Button>
              </PopoverTrigger>
              {endDate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setEndDate(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date);
                    setEndDatePopoverOpen(false);
                    if (startDate && date < startDate) {
                      setStartDate(null);
                      setStartDatePopoverOpen(true);
                    }
                  }}
                  disabled={(date) => startDate && date < startDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="comment" className="block mb-2">Комментарий</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Опишите опыт проживания"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="rating" className="block mb-2">Оценка</Label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl ${
                star <= rating ? "text-yellow-500" : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaceForm; 