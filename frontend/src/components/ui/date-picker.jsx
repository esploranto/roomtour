import React, { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils.ts";
import * as Popover from "@radix-ui/react-popover";
import { Calendar } from "@/components/ui/calendar.jsx";

export default function DatePicker({ 
  value, 
  onChange, 
  onClear,
  placeholder = "Выберите дату",
  disabled = false,
  popoverOpen,
  onPopoverOpenChange,
  minDate,
  maxDate,
}) {
  // Используем внутреннее состояние, если внешнее не предоставлено
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Используем внешнее состояние, если оно есть, или внутреннее, если нет
  const isOpen = popoverOpen !== undefined ? popoverOpen : internalOpen;
  
  // Обработчик изменения состояния
  const handleOpenChange = (open) => {
    console.log('DatePicker handleOpenChange:', open);
    // Вызываем внешний обработчик, если он есть
    if (onPopoverOpenChange) {
      onPopoverOpenChange(open);
    } else {
      // Иначе используем внутреннее состояние
      setInternalOpen(open);
    }
  };
  
  // Обработчик выбора даты
  const handleSelect = (date) => {
    console.log('DatePicker handleSelect:', date);
    if (onChange) {
      onChange(date);
    }
    // Закрываем попап после выбора даты
    handleOpenChange(false);
  };

  // Форматирование даты без точки после месяца
  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return placeholder;
    }
    
    const formattedDate = format(date, "d MMM yyyy", { locale: ru }).replace('.', '');
    return formattedDate.charAt(0) + formattedDate.slice(1).toLowerCase();
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal relative",
            !value && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value && value instanceof Date && !isNaN(value.getTime()) ? (
            <>
              <span>{formatDate(value)}</span>
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClear) onClear();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    if (onClear) onClear();
                  }
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-full p-1 cursor-pointer"
              >
                <X size={16} />
              </div>
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          className="z-[9999] w-auto p-0 bg-white dark:bg-gray-800 rounded-md shadow-md" 
          align="start" 
          sideOffset={4}
          onInteractOutside={(e) => {
            console.log('DatePicker onInteractOutside');
            // Предотвращаем закрытие попапа при клике вне его
            // e.preventDefault();
          }}
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            disabled={(date) => {
              if (disabled) return true;
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            initialFocus
            locale={ru}
            fromDate={minDate}
            toDate={maxDate}
            classNames={{
              day_selected: "bg-blue-500 text-white hover:bg-blue-600 hover:text-white font-bold",
            }}
            styles={{
              day_hover: { 
                backgroundColor: '#e0f2fe', 
                color: '#1e40af',
                fontWeight: 'normal'
              },
              day_selected: { 
                backgroundColor: '#3b82f6', 
                color: 'white',
                fontWeight: 'bold',
              },
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}