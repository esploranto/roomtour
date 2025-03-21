import React from "react";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.jsx";
import { Button } from "@/components/ui/button.tsx";
import { MapPin } from "lucide-react";
import DateRangePicker from "@/components/ui/date-picker";

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
  nameInputRef
}) => {
  const dateRange = {
    from: startDate,
    to: endDate
  };

  const handleDateRangeChange = (range) => {
    if (range) {
      setStartDate(range.from || null);
      setEndDate(range.to || null);
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  };

  const handleDateRangeClear = () => {
    setStartDate(null);
    setEndDate(null);
  };

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
          ref={nameInputRef}
          onFocus={(e) => {
            console.log("Поле Название получило фокус", e.target);
            const valueLength = e.target.value.length;
            e.target.setSelectionRange(valueLength, valueLength);
          }}
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

      <div className="space-y-2">
        <Label>Даты проживания</Label>
        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          onClear={handleDateRangeClear}
          placeholder="Выберите даты проживания"
          minDate={new Date(2000, 0, 1)}
          maxDate={new Date(2100, 0, 1)}
        />
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