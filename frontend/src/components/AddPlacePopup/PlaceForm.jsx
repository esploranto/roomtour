import React from "react";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.jsx";
import { Button } from "@/components/ui/button.tsx";
import { MapPin } from "lucide-react";
import DatePicker from "@/components/ui/date-picker.jsx";

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
  handleStartDateSelect,
  handleEndDateSelect
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
          <div className="relative z-[100]">
            <DatePicker
              value={startDate}
              onChange={handleStartDateSelect}
              onClear={() => {
                setStartDate(null);
                setEndDate(null);
              }}
              placeholder="Заезд"
              popoverOpen={startDatePopoverOpen}
              onPopoverOpenChange={setStartDatePopoverOpen}
              maxDate={endDate}
            />
          </div>
          <div className="relative z-[100]">
            <DatePicker
              value={endDate}
              onChange={handleEndDateSelect}
              onClear={() => setEndDate(null)}
              placeholder="Выезд"
              popoverOpen={endDatePopoverOpen}
              onPopoverOpenChange={setEndDatePopoverOpen}
              minDate={startDate}
            />
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