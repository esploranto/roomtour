import React from "react";
import { Button } from "@/components/ui/button.tsx";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils.ts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.jsx";
import { Calendar } from "@/components/ui/calendar.jsx";

export default function DatePicker({ 
  value, 
  onChange, 
  onClear,
  placeholder = "Выберите дату",
  disabled = false,
  popoverOpen,
  onPopoverOpenChange,
}) {
  return (
    <Popover open={popoverOpen} onOpenChange={onPopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal relative",
            !value && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            <>
              <span>{format(value, "d MMMM yyyy", { locale: ru })}</span>
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onClear();
                  }
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 rounded-full p-1 cursor-pointer"
              >
                <X size={16} />
              </div>
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
} 