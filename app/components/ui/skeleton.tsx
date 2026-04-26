import { cn } from "@/lib/utils";

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-2xl bg-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
    />
  );
}
