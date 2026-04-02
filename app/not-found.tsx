"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import React from "react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-bold">Ups! Nie znaleziono tej strony.</h1>
        <p className="text-base text-neutral-300">
          Ktoś przesunął pionek z planszy administracyjnej — ta podstrona nie istnieje.
        </p>
        <div>
          <Button size="lg" variant="default" onClick={() => router.push("/")}>Wróć do strony głównej</Button>
        </div>
      </div>
    </div>
  );
}
