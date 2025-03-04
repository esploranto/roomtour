import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout"; 
import Home from "./pages/Home";
import Profile from "./pages/User/Profile";
import EditProfile from "./pages/User/EditProfile";
import AddPlace from "./pages/User/AddPlace";
import Place from "./pages/User/Place";
import NotFound from "./pages/NotFound";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Главная страница (лендинг) */}
        <Route index element={<Home />} />

        {/* Профиль пользователя */}
        <Route path=":username" element={<Profile />} />

        {/* Редактирование профиля */}
        <Route path=":username/edit" element={<EditProfile />} />

        {/* Добавление нового места */}
        <Route path=":username/add" element={<AddPlace />} />

        {/* Конкретное место */}
        <Route path=":username/:placeId" element={<Place />} />

        {/* Страница 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}