import React from "react";
import { Button } from "@/components/ui/button"; // Импорт компонента Button
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Если хотите использовать Card

export default function Home() {
  return (
    <div className="text-center mt-8">
      <h1 className="text-3xl font-bold">🏡 Добро пожаловать в Roomtour!</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>Левая колонка</Card>
        <Card>Правая колонка</Card>
      </div>
      {/* Можно использовать и Card, если нужно */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Пример карточки</CardTitle>
        </CardHeader>
        <CardContent>
          Здесь может быть информация.
        </CardContent>
      </Card>
    </div>
  );
}