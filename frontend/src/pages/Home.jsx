import React from "react";
import { Button } from "@/components/ui/button.tsx"; // Импорт компонента Button
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx"; // Если хотите использовать Card
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="text-center mt-16 space-y-8">
      <h1 className="text-8xl font-medium">{t("welcome")}</h1>
      <p className="text-xl md:w-2/3 xl:w-2/3 mx-auto">{t("lead")}</p>

      <Button variant="outline" asChild>
        <Link to="/sergeyfrolov">Перейти в профиль</Link>
      </Button>


    </div>
  );
}