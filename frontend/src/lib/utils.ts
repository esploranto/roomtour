import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name) {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length === 1) {
    // Если имя одно слово, берем первые две буквы
    return parts[0].substring(0, 2).toUpperCase();
  }
  // Если два и более слов, берем первую букву первого и второго слова
  return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
}