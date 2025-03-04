import { useParams } from "react-router-dom";

export default function AddPlace() {
  const { username } = useParams();

  return (
    <div>
      <h1>Добавить новое место</h1>
      <form>
        <input type="text" placeholder="Название места" />
        <input type="text" placeholder="Адрес" />
        <textarea placeholder="Комментарии" />
        <button type="submit">Добавить</button>
      </form>
    </div>
  );
}