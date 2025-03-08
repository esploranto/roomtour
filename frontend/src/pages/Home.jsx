import React from "react";
import { Button } from "@/components/ui/button.tsx"; // Импорт компонента Button
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx"; // Если хотите использовать Card
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="text-center mt-8 space-y-6">
      <h1 className="text-3xl font-bold">{t("welcome")}</h1>
      <p>{t("lead")}</p>

      <Button variant="outline" asChild>
        <Link to="/profile">Перейти в профиль</Link>
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>Левая колонка</Card>
        <Card>Правая колонка</Card>
      </div>


    </div>
  );
}