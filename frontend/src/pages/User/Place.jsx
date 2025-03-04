import { useParams, Link } from "react-router-dom";

export default function Place() {
  const { username, placeId } = useParams();

  return (
    <div>
      <h1>📍 {placeId}</h1>
      <p>Описание места, фото, рейтинг...</p>
      <Link to={`/${username}`}>← Назад к профилю</Link>
    </div>
  );
}