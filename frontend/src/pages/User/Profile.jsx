import { useParams, Link } from "react-router-dom";

export default function Profile() {
  const { username } = useParams();

  return (
    <div>
      <h1>👤 {username}</h1>
      <p>Здесь будут все места пользователя</p>
      <ul>
        <li><Link to={`/`}>← На главную</Link></li>
        <li><Link to={`/${username}/place`}>Место, где жил</Link></li>
        <li><Link to={`/${username}/edit`}>Редактировать профиль</Link></li>
        <li><Link to={`/${username}/add`}>➕ Добавить место</Link></li>
      </ul>
    </div>
  );
}