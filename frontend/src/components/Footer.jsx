import React from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Footer() {
  return (
    <footer className="mt-8 pt-4 pb-12 p-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm rounded-t-xl">
      {/* Контейнер, который на мобильных в колонку, на десктопе в ряд */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Левая колонка: текст */}
        <p className="max-w-md">
          Find real interior designs, train your eye and apply to life. Find real
          interior designs, train your eye and apply to life.
        </p>

        {/* Правая колонка: переключатель языка (шире) */}
        <div>
          <LanguageSwitcher className="w-[120px]" />
        </div>
      </div>
    </footer>
  );
}