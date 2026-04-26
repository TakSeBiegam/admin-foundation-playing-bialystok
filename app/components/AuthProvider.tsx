"use client";

import { SessionProvider } from "next-auth/react";

import { AdminAccessProvider } from "@/app/components/AdminAccessProvider";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AdminAccessProvider>{children}</AdminAccessProvider>
    </SessionProvider>
  );
}
