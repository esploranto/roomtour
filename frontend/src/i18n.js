import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Определяем переводы
const resources = {
  ru: {
    translation: {
      welcome: "Румтур",
      lead: "Сохраняйте места для воспоминаний, делитесь с другими и ищите вдохновение",
      login: "Войти через Telegram",
      addPlace: "Добавить место",
      profile: "Профиль",
      // Добавь другие переводы
    }
  },
  en: {
    translation: {
      welcome: "Roomtour",
      lead: "Keep places to remember, share and look for inspiration",
      login: "Log in with Telegram",
      addPlace: "Add Place",
      profile: "Profile",
      // Добавь другие переводы
    }
  }
};

i18n
  .use(initReactI18next) // подключаем плагин react-i18next
  .init({
    resources,
    lng: "ru", // язык по умолчанию
    fallbackLng: "en", // язык на случай отсутствия перевода
    interpolation: {
      escapeValue: false // React и так экранирует данные
    }
  });

export default i18n;