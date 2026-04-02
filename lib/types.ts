export type Role = "ADMIN" | "MODERATOR" | "EDITOR" | "OWNER";

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

export interface OfferBlock {
  id: string;
  section: string;
  blockType: string;
  badge?: string | null;
  title?: string | null;
  subtitle?: string | null;
  content?: string | null;
  items: string[];
  highlight?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactSubmissionNote {
  id: string;
  submissionId: string;
  note: string;
  author: AdminUser;
  createdAt: string;
  updatedAt: string;
}

export interface ContactSubmission {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  readBy?: AdminUser | null;
  archived?: boolean;
  lastNoteAt?: string | null;
  notes?: ContactSubmissionNote[];
  createdAt: string;
  updatedAt: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  MODERATOR: "Moderator",
  EDITOR: "Redaktor",
  OWNER: "Właściciel",
};

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "#F13738",
  MODERATOR: "#FEE600",
  EDITOR: "#4ade80",
  OWNER: "#9b59b6",
};

