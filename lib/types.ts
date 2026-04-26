export type Role = "ADMIN" | "MODERATOR" | "EDITOR" | "OWNER";

export type AdminResource =
  | "AUTH"
  | "DASHBOARD"
  | "EVENTS"
  | "PARTNERS"
  | "CATALOG"
  | "GALLERY"
  | "MESSAGES"
  | "USERS"
  | "STATUTE"
  | "ROLE_PERMISSIONS"
  | "AUDIT_LOGS"
  | "ADVANCED_ANALYTICS";

export type AuditAction =
  | "LOGIN"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "RESET_PASSWORD"
  | "ARCHIVE"
  | "UNARCHIVE"
  | "MARK_READ"
  | "MARK_UNREAD"
  | "ADD_NOTE"
  | "ROLE_CHANGE"
  | "PERMISSION_CHANGE";

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

export interface BoardGame {
  id: string;
  title: string;
  description: string;
  playerBucket: string;
  playTime?: string | null;
  category?: string | null;
  difficulty?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type BoardGameSortMode = "AZ" | "ZA" | "PLAYERS" | "ORDER";

export interface BoardGameCatalogPageData {
  items: BoardGame[];
  totalCount: number;
  hasMore: boolean;
  nextOffset?: number | null;
  categories: string[];
  difficulties: string[];
  catalogTotalCount: number;
  catalogWithImagesCount: number;
}

export type GalleryFolder =
  | "all"
  | "events"
  | "partners"
  | "offer"
  | "board-games"
  | "general";

export interface GalleryAsset {
  url: string;
  pathname: string;
  previewUrl: string;
  contentType?: string | null;
  uploadedAt: string;
  size: number;
}

export interface GalleryListResponse {
  items: GalleryAsset[];
  hasMore: boolean;
  nextCursor?: string;
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

export interface RolePermission {
  role: Role;
  resource: AdminResource;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  updatedAt: string;
  updatedBy?: AdminUser | null;
}

export interface AuditLogEntry {
  id: string;
  actor?: AdminUser | null;
  actorRole?: Role | null;
  resource: AdminResource;
  action: AuditAction;
  resourceId?: string | null;
  summary: string;
  details?: string | null;
  createdAt: string;
}

export interface Statute {
  id: string;
  content: string;
  updatedAt: string;
}

export interface StatuteVersion {
  id: string;
  content: string;
  summary?: string | null;
  authorId?: string | null;
  createdAt: string;
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

