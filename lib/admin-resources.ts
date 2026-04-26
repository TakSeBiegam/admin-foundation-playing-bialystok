import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  Handshake,
  History,
  ImageIcon,
  Info,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";

import type { AdminResource, Role } from "@/lib/types";

export type PermissionActionKey = "read" | "write" | "delete";

export interface AdminNavItem {
  label: string;
  href: string;
  resource: AdminResource;
  icon: LucideIcon;
  description: string;
  supportedActions?: PermissionActionKey[];
}

export interface AdminNavGroup {
  key: string;
  label: string;
  description: string;
  defaultOpen?: boolean;
  sidebarVariant?: "single" | "group";
  items: AdminNavItem[];
}

export const managedAdminResources: AdminResource[] = [
  "DASHBOARD",
  "OFFER_PAGE",
  "ABOUT_US_PAGE",
  "EVENTS",
  "PARTNERS",
  "CATALOG",
  "GALLERY",
  "MESSAGES",
  "USERS",
  "STATUTE",
  "ROLE_PERMISSIONS",
  "AUDIT_LOGS",
  "ADVANCED_ANALYTICS",
];

export const adminResourceLabels: Record<AdminResource, string> = {
  AUTH: "Autoryzacja",
  DASHBOARD: "Dashboard",
  OFFER_PAGE: "Oferta",
  ABOUT_US_PAGE: "O nas",
  EVENTS: "Wydarzenia",
  PARTNERS: "Partnerzy",
  CATALOG: "Katalog",
  GALLERY: "Galeria",
  MESSAGES: "Wiadomosci",
  USERS: "Uzytkownicy",
  ROLE_PERMISSIONS: "Uprawnienia rol",
  AUDIT_LOGS: "Logi aktywnosci",
  STATUTE: "Regulamin",
  ADVANCED_ANALYTICS: "Zaawansowane statystyki",
};

export const roleLabels: Record<Role, string> = {
  OWNER: "Wlasciciel",
  ADMIN: "Administrator",
  MODERATOR: "Moderator",
  EDITOR: "Redaktor",
};

export const permissionActionLabels: Record<PermissionActionKey, string> = {
  read: "Podglad",
  write: "Edycja",
  delete: "Usuwanie",
};

export const permissionEditableRoles: Role[] = ["EDITOR", "MODERATOR", "ADMIN"];

export const adminNavGroups: AdminNavGroup[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Widok startowy panelu administracyjnego.",
    sidebarVariant: "single",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        resource: "DASHBOARD",
        icon: LayoutDashboard,
        description: "Szybki przeglad tego, co dzieje sie w panelu.",
        supportedActions: ["read"],
      },
    ],
  },
  {
    key: "events",
    label: "Wydarzenia",
    description: "Publikacje, harmonogram i karta wydarzen.",
    sidebarVariant: "single",
    items: [
      {
        label: "Wydarzenia",
        href: "/events",
        resource: "EVENTS",
        icon: CalendarDays,
        description: "Karty wydarzen i harmonogram publikacji.",
        supportedActions: ["read", "write", "delete"],
      },
    ],
  },
  {
    key: "messages",
    label: "Wiadomosci",
    description: "Inbox formularza kontaktowego i archiwum.",
    sidebarVariant: "single",
    items: [
      {
        label: "Wiadomosci",
        href: "/messages",
        resource: "MESSAGES",
        icon: Mail,
        description: "Zapytania z formularza kontaktowego i archiwum.",
        supportedActions: ["read", "delete"],
      },
    ],
  },
  {
    key: "users",
    label: "Uzytkownicy",
    description: "Konta zespolu i role dostepowe.",
    sidebarVariant: "single",
    items: [
      {
        label: "Uzytkownicy",
        href: "/users",
        resource: "USERS",
        icon: Users,
        description: "Konta, role i reset hasla.",
        supportedActions: ["read", "write", "delete"],
      },
    ],
  },
  // {
  //   key: "page-configurator",
  //   label: "Konfigurator stron",
  //   description: "Edycja blokow i tresci dla glownych podstron.",
  //   defaultOpen: true,
  //   sidebarVariant: "group",
  //   items: [
  //     {
  //       label: "Oferta",
  //       href: "/offer",
  //       resource: "OFFER_PAGE",
  //       icon: FileText,
  //       description: "Bloki oferty, CTA i modulowe sekcje.",
  //       supportedActions: ["read", "write"],
  //     },
  //     {
  //       label: "O nas",
  //       href: "/about-us",
  //       resource: "ABOUT_US_PAGE",
  //       icon: Info,
  //       description: "Hero, fakty, CTA i tresci o fundacji.",
  //       supportedActions: ["read", "write"],
  //     },
  //       {
  //         label: "Regulamin",
  //         href: "/statute",
  //         resource: "STATUTE",
  //         icon: FileText,
  //         description: "Edycja tresci regulaminu i historia zmian.",
  //         supportedActions: ["read", "write"],
  //       },
  //   ],
  // },
  {
    key: "assets",
    label: "Zasoby",
    description:
      "Powtarzalne listy, media i obiekty wykorzystywane na stronie.",
    defaultOpen: true,
    sidebarVariant: "group",
    items: [
      {
        label: "Katalog",
        href: "/catalog",
        resource: "CATALOG",
        icon: BookOpen,
        description: "Planszowki, wiek, trudnosc i czas gry.",
        supportedActions: ["read", "write", "delete"],
      },
      {
        label: "Partnerzy",
        href: "/partners",
        resource: "PARTNERS",
        icon: Handshake,
        description: "Logotypy, linki i opisy wspolpracy.",
        supportedActions: ["read", "write", "delete"],
      },
      {
        label: "Galeria",
        href: "/gallery",
        resource: "GALLERY",
        icon: ImageIcon,
        description: "Biblioteka mediow wykorzystywana w tresciach.",
        supportedActions: ["read", "write", "delete"],
      },
    ],
  },
  {
    key: "advanced",
    label: "Zaawansowane",
    description: "Uprawnienia, polityki dostepu i logi aktywnosci.",
    sidebarVariant: "group",
    items: [
      {
        label: "Statystyki GA4",
        href: "/advanced-analytics",
        resource: "ADVANCED_ANALYTICS",
        icon: BarChart3,
        description: "Rozszerzone statystyki i metryki z Google Analytics 4.",
        supportedActions: ["read"],
      },
      {
        label: "Uprawnienia",
        href: "/permissions",
        resource: "ROLE_PERMISSIONS",
        icon: ShieldCheck,
        description: "Role, zakres dostepu i polityki R/W/D.",
        supportedActions: ["read", "write"],
      },
      {
        label: "Logi aktywnosci",
        href: "/activity-log",
        resource: "AUDIT_LOGS",
        icon: History,
        description: "Trwaly dziennik logowan i wszystkich zmian.",
        supportedActions: ["read"],
      },
    ],
  },
];

export function getAdminResourceLabel(resource: AdminResource): string {
  return adminResourceLabels[resource] ?? resource;
}

export function getRoleLabel(role: Role): string {
  return roleLabels[role] ?? role;
}
