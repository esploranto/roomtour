import AppRouter from "./router";
import { ThemeProvider } from "@/context/ThemeContext";
import { DragAndDropProvider } from "@/context/DragAndDropContext";
import "./index.css";
import "./styles/global.css";

export default function App() {
  return (
    <ThemeProvider>
      <DragAndDropProvider>
        <div className="container mx-auto p-4 pb-0">
          <AppRouter />
        </div>
      </DragAndDropProvider>
    </ThemeProvider>
  );
}