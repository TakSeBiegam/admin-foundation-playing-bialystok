"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CalendarDays,
  Handshake,
  BriefcaseBusiness,
  MessageSquareText,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: Role[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Wydarzenia", href: "/events", icon: CalendarDays },
  { label: "Partnerzy", href: "/partners", icon: Handshake },
  { label: "Oferta", href: "/offer", icon: BriefcaseBusiness },
  { label: "Formularze", href: "/messages", icon: MessageSquareText },
  {
    label: "Użytkownicy",
    href: "/users",
    icon: Users,
    roles: ["ADMIN", "OWNER"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user?.role as Role) ?? "EDITOR";
  const displayName = session?.user?.name ?? session?.user?.email ?? "Admin";

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  );

  return (
    <aside className="w-60 min-h-screen bg-[#111111] border-r border-white/10 flex flex-col">
      {/* Brand header */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-brand-red flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm">GB</span>
          </div>
          <div className="leading-tight">
            <p className="text-white font-bold text-sm">Grający</p>
            <p className="text-white/60 text-xs">Białystok - Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20"
                      : "text-white/70 hover:text-white hover:bg-white/5",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-white/10 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="leading-tight overflow-hidden">
            <p className="text-white text-xs font-medium truncate">
              {displayName}
            </p>
            <p className="text-white/40 text-xs">{ROLE_LABELS[userRole]}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-white/50 hover:text-white hover:bg-white/5 text-xs font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Wyloguj się
        </button>
      </div>
    </aside>
  );
}
