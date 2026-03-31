export type Role = "ADMIN" | "MODERATOR" | "EDITOR";

export interface AdminUser {
  id: string;
  email?: string | null;
  username?: string | null;
  role: Role;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  date: string;       // YYYY-MM-DD
  location?: string | null;
  time?: string | null;
  facebookUrl?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  MODERATOR: "Moderator",
  EDITOR: "Redaktor",
};

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "#F13738",
  MODERATOR: "#FEE600",
  EDITOR: "#4ade80",
};

