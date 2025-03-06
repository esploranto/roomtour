import AppRouter from "./router";
import { ThemeProvider } from "@/context/ThemeContext"; // Импорт провайдера темы

export default function App() {
  return (
    <ThemeProvider>
      <div className="container mx-auto p-4 pb-0">
        <AppRouter />
      </div>
    </ThemeProvider>
  );
}