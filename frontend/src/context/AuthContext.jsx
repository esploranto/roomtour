// src/context/AuthContext.jsx
import React, { createContext, useState } from "react";

export const AuthContext = createContext({
  isLoggedIn: false,
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  // Для теста можно установить начальное значение пользователя:
  const [user, setUser] = useState({
    username: "Sergey Frolov",
    avatarUrl: "", // тестовый аватар
  });
  // Если user не равен null, считаем, что пользователь залогинен
  const isLoggedIn = Boolean(user);

  // Тестовые функции логина/выхода
  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}