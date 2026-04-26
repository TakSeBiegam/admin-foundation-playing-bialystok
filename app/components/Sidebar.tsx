"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useMemo } from "react";

import { useAdminAccess } from "@/app/components/AdminAccessProvider";
import { adminNavGroups } from "@/lib/admin-resources";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type AdminResource, type Role } from "@/lib/types";

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const fallbackRoleVisibility: Partial<Record<AdminResource, Role[]>> = {
  USERS: ["ADMIN", "OWNER"],
  ROLE_PERMISSIONS: ["ADMIN", "OWNER"],
  AUDIT_LOGS: ["ADMIN", "OWNER"],
};

function canSeeByFallbackRole(resource: AdminResource, role: Role) {
  const allowedRoles = fallbackRoleVisibility[resource];
  return !allowedRoles || allowedRoles.includes(role);
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { canAccess, error, loading } = useAdminAccess();
  const userRole = (session?.user?.role as Role) ?? "EDITOR";
  const displayName = session?.user?.name ?? session?.user?.email ?? "Admin";

  const visibleGroups = useMemo(() => {
    return adminNavGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (loading || error) {
            return canSeeByFallbackRole(item.resource, userRole);
          }

          return canAccess(item.resource, "read");
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [canAccess, error, loading, userRole]);

  function renderNavItem(
    item: (typeof visibleGroups)[number]["items"][number],
    nested = false,
  ) {
    const active = isItemActive(pathname, item.href);

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            active
              ? "border border-brand-yellow/20 bg-brand-yellow/10 text-brand-yellow"
              : "text-white/70 hover:bg-white/5 hover:text-white",
            nested && "text-[13px]",
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <aside className="flex min-h-screen w-60 flex-col border-r border-white/10 bg-[#111111]">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-brand-red">
            <span className="text-sm font-black text-white">GB</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">Grający</p>
            <p className="text-xs text-white/60">Białystok - Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {loading && userRole !== "OWNER" ? (
          <ul className="space-y-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <li
                key={index}
                className="h-10 animate-pulse rounded-md bg-white/5"
              />
            ))}
          </ul>
        ) : null}

        {!loading && visibleGroups.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/65">
            Brak widocznych modulow dla tej roli.
          </div>
        ) : null}

        {!loading ? (
          <div className="space-y-4">
            {visibleGroups.map((group) => {
              if (group.sidebarVariant === "single") {
                return (
                  <ul key={group.key} className="space-y-1">
                    {group.items.map((item) => renderNavItem(item))}
                  </ul>
                );
              }

              return (
                <section key={group.key}>
                  <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/32">
                    {group.label}
                  </p>
                  <ul className="ml-4 space-y-1 border-l border-white/10 pl-3">
                    {group.items.map((item) => renderNavItem(item, true))}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-md border border-brand-red/25 bg-brand-red/10 px-3 py-3 text-xs text-white/75">
            Nie udalo sie zsynchronizowac uprawnien. Pokazuje widok awaryjny na
            podstawie roli.
          </div>
        ) : null}
      </nav>

      <div className="space-y-3 border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#2a2a2a]">
            <span className="text-xs font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-medium text-white">
              {displayName}
            </p>
            <p className="text-xs text-white/40">{ROLE_LABELS[userRole]}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Wyloguj się
        </button>
      </div>
    </aside>
  );
}
