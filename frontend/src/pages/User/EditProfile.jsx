import { useParams } from "react-router-dom";

export default function EditProfile() {
  const { username } = useParams();

  return (
    <div>
      <h1>Редактирование профиля {username}</h1>
      <form>
        <label>Описание профиля:</label>
        <input type="text" placeholder="Напишите о себе" />
        <button type="submit">Сохранить</button>
      </form>
    </div>
  );
}