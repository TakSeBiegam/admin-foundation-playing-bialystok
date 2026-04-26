"use client";

import { useCallback, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import StatuteEditor from "@/app/components/statute/StatuteEditor";
import ToastContainer, { type ToastData } from "@/app/components/Toast";

export default function StatuteAdminPage() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastData["type"] = "success") => {
      setToasts((previous) => [
        ...previous,
        { id: Date.now() + Math.random(), message, type },
      ]);
    },
    [],
  );

  const removeToast = useCallback((id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  return (
    <div className="flex h-screen bg-[#0d0b08]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 py-8 md:px-8 md:py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white">Regulamin</h1>
            <p className="mt-2 text-white/70">
              Zarządzaj treścią i historią zmian regulaminu
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1a1814] p-8 backdrop-blur-sm">
            <StatuteEditor onToast={addToast} />
          </div>
        </div>
      </main>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
