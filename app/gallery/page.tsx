"use client";

import { Images } from "lucide-react";
import GalleryBrowser from "@/app/components/GalleryBrowser";
import Sidebar from "@/app/components/Sidebar";

export default function GalleryPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Galeria zasobów</h1>
          </div>
        </div>

        <GalleryBrowser />
      </main>
    </div>
  );
}
