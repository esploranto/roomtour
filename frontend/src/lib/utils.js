import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const handleStartDateSelect = (date, endDate, setStartDate, setStartDatePopoverOpen) => {
  if (endDate && date > endDate) {
    return;
  }
  setStartDate(date);
  setStartDatePopoverOpen(false);
};

export const handleEndDateSelect = (date, startDate, setEndDate, setEndDatePopoverOpen) => {
  if (startDate && date < startDate) {
    return;
  }
  setEndDate(date);
  setEndDatePopoverOpen(false);
}; 