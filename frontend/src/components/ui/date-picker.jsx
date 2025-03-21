import React, { useState, useEffect } from "react";
import { format, isAfter, isBefore } from "date-fns";
import { ru } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight, CalendarIcon, X } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { cn, getCurrentLocale } from "@/lib/utils";

import "react-day-picker/dist/style.css";

/**
 * DateRangePicker компонент для выбора диапазона дат
 */
function DateRangePicker({
  value = { from: undefined, to: undefined },
  onChange,
  onClear,
  placeholder = "Выберите даты",
  disabled = false,
  popoverOpen,
  onPopoverOpenChange,
  minDate,
  maxDate
}) {
  // Управление открытием/закрытием календаря
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = popoverOpen !== undefined ? popoverOpen : internalOpen;
  const locale = getCurrentLocale();
  const [isMobile, setIsMobile] = useState(false);
  
  // Определяем размер экрана для адаптивности
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  const handleOpenChange = (open) => {
    if (onPopoverOpenChange) {
      onPopoverOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };
  
  const handleSelect = (range) => {
    // Вызываем onChange даже если range может быть undefined
    if (onChange) {
      onChange(range || { from: undefined, to: undefined });
    }
    
    // Закрываем календарь только если выбран полный диапазон дат
    if (range && range.from && range.to) {
      handleOpenChange(false);
    }
  };

  // Форматирование строки с диапазоном дат
  const formatDateRange = (range) => {
    if (!range || (!range.from && !range.to)) {
      return placeholder;
    }
    
    if (range.from && range.to) {
      const fromYear = range.from.getFullYear();
      const toYear = range.to.getFullYear();
      
      const fromDate = format(range.from, "d MMM", { locale }).replace('.', '');
      const toDate = format(
        range.to,
        fromYear === toYear ? "d MMM yyyy" : "d MMM yyyy", 
        { locale }
      ).replace('.', '');
      
      if (fromYear === toYear) {
        return `${fromDate} – ${toDate}`.toLowerCase();
      } else {
        const fromDateWithYear = format(range.from, "d MMM yyyy", { locale }).replace('.', '');
        return `${fromDateWithYear} – ${toDate}`.toLowerCase();
      }
    }
    
    if (range.from) {
      return format(range.from, "d MMM yyyy", { locale }).replace('.', '').toLowerCase();
    }
    
    if (range.to) {
      return format(range.to, "d MMM yyyy", { locale }).replace('.', '').toLowerCase();
    }
    
    return placeholder;
  };

  // Функция для отключения дат на основе выбранного диапазона
  const disabledDays = (date) => {
    // Если выбран диапазон, то отключаем даты ДО даты заезда
    if (value && value.from) {
      // Если мы выбираем вторую дату (дату выезда)
      if (value.from && !value.to) {
        return isBefore(date, value.from);
      }
    }
    
    // Если указан минимальный или максимальный диапазон дат
    if (minDate && isBefore(date, minDate)) {
      return true;
    }
    
    if (maxDate && isAfter(date, maxDate)) {
      return true;
    }

    // Отключаем по условию disabled
    return disabled;
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal relative",
            !value.from && !value.to && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{formatDateRange(value)}</span>
          {(value.from || value.to) && (
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
          )}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          className="z-[9999] max-w-[calc(100vw-40px)] w-auto md:max-w-[540px] p-0 shadow-lg bg-white dark:bg-gray-900 rounded-md" 
          align="start" 
          sideOffset={4}
        >
          <style>
            {`
              .rdp {
                --rdp-cell-size: 36px;
                --rdp-accent-color: #2463EB;
                --rdp-background-color: rgba(36, 99, 235, 0.2);
                --rdp-accent-color-dark: #2463EB;
                --rdp-background-color-dark: rgba(36, 99, 235, 0.4);
                --rdp-outline: none;
                --rdp-selected-color: white;
                margin: 0;
                padding: 4px;
                width: 100%;
              }
              
              .dark .rdp {
                --rdp-accent-color: #3b82f6;
                --rdp-background-color: rgba(59, 130, 246, 0.4);
              }
              
              /* Настройка таблицы для предотвращения обрезания */
              .rdp-months {
                display: flex;
                justify-content: space-around;
                width: 100%;
              }
              
              .rdp-table {
                width: 100%;
                table-layout: fixed;
              }
              
              /* Непрерывный диапазон без промежутков */
              .rdp-day_range_start:not(.rdp-day_range_end),
              .rdp-day_range_end:not(.rdp-day_range_start) {
                border-radius: 0;
              }
              
              .rdp-day_range_middle {
                border-radius: 0;
              }
              
              .rdp-day_range_start {
                border-top-left-radius: 100% !important;
                border-bottom-left-radius: 100% !important;
              }
              
              .rdp-day_range_end {
                border-top-right-radius: 100% !important;
                border-bottom-right-radius: 100% !important;
              }
              
              /* Даты в диапазоне должны быть соединены */
              .rdp-day {
                margin: 0;
                width: var(--rdp-cell-size);
                max-width: var(--rdp-cell-size);
                height: var(--rdp-cell-size);
              }
              
              .rdp-day_selected, 
              .rdp-day_selected:focus-visible, 
              .rdp-day_selected:hover {
                color: white;
                opacity: 1;
                background-color: var(--rdp-accent-color);
              }
              
              .rdp-day_range_middle {
                color: #000;
                background-color: var(--rdp-background-color);
              }
              
              .dark .rdp-day_range_middle {
                color: white;
              }
              
              .rdp-month {
                min-height: 280px;
                width: 100%;
              }
              
              .rdp-caption {
                padding: 0 0.5rem;
              }
              
              .rdp-caption_label {
                font-size: 0.875rem;
                font-weight: 500;
              }
              
              .rdp-nav {
                gap: 0.25rem;
              }
              
              .rdp-nav_button {
                width: 24px;
                height: 24px;
              }
              
              .rdp-head_cell {
                font-size: 0.75rem;
              }
              
              .rdp {
                border-radius: 0.5rem;
              }
            `}
          </style>
          <DayPicker
            mode="range"
            defaultMonth={value.from || new Date()}
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={isMobile ? 1 : 2}
            disabled={disabledDays}
            initialFocus
            locale={ru}
            showOutsideDays={false}
            className="p-2 w-full"
            toDate={maxDate}
            fromDate={minDate}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

DateRangePicker.displayName = "DateRangePicker";

export { DateRangePicker };
export default DateRangePicker;