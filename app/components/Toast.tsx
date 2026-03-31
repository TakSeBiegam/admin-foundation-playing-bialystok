"use client";
import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error";

export interface ToastData {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastProps {
    toasts: ToastData[];
    onRemove: (id: number) => void;
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: number) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 3000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm font-medium min-w-[260px] max-w-sm animate-in slide-in-from-right-5 fade-in duration-200",
                toast.type === "success"
                    ? "bg-[#1a1a1a] border-[#FEE600]/30 text-white"
                    : "bg-[#1a1a1a] border-[#F13738]/30 text-white"
            )}
        >
            {toast.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-[#FEE600] flex-shrink-0" />
            ) : (
                <XCircle className="w-4 h-4 text-[#F13738] flex-shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
                onClick={() => onRemove(toast.id)}
                className="text-white/40 hover:text-white transition-colors ml-1"
                aria-label="Zamknij"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

export default function ToastContainer({ toasts, onRemove }: ToastProps) {
    if (toasts.length === 0) return null;
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onRemove={onRemove} />
            ))}
        </div>
    );
}
