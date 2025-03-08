import * as React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select.tsx";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const selectedLang = i18n.language === "en" ? "en" : "ru";

  const handleChange = (value) => {
    i18n.changeLanguage(value);
  };

  return (
    <>
      <style jsx="true">{`
        .no-arrow [data-radix-select-icon] {
          display: none;
        }
      `}</style>
      <Select value={selectedLang} onValueChange={handleChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        {/* Передаём свой класс для непрозрачного фона */}
        <SelectContent className="bg-white dark:bg-gray-800">
          <SelectItem value="ru">Russian</SelectItem>
          <SelectItem value="en">English</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}