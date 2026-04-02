"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Users,
  RefreshCw,
  Copy,
  CheckCheck,
  AtSign,
  User as UserIcon,
} from "lucide-react";
import Sidebar from "@/app/components/Sidebar";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import ToastContainer, { type ToastData } from "@/app/components/Toast";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { gql } from "@/lib/graphql";
import type { AdminUser, Role } from "@/lib/types";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/types";
import { useForm } from "react-hook-form";

// ─── GraphQL docs ────────────────────────────────────────────────
const USERS_QUERY = `query { users { id email username role createdAt } }`;
const CREATE_USER = `mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) { id email username role createdAt }
}`;
const UPDATE_USER = `mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) { id email username role createdAt }
}`;
const DELETE_USER = `mutation DeleteUser($id: ID!) { deleteUser(id: $id) }`;
const RESET_PASSWORD = `mutation ResetPassword($id: ID!) { resetUserPassword(id: $id) }`;

// ─── User Modal ───────────────────────────────────────────────────
type CreateMode = "email" | "username";

type UserFormValues = {
  createMode: CreateMode;
  email: string;
  username: string;
  password: string;
  role: Role;
};

type EditFormValues = {
  email: string;
  username: string;
  role: Role;
  password: string;
};

function UserModal({
  open,
  user,
  onSave,
  onClose,
  currentRole,
}: {
  open: boolean;
  user?: AdminUser | null;
  onSave: (data: UserFormValues | EditFormValues) => void;
  onClose: () => void;
  currentRole?: Role | undefined;
}) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserFormValues & EditFormValues>({
    defaultValues: {
      createMode: "email",
      email: "",
      username: "",
      password: "",
      role: "EDITOR",
    },
  });
  const createMode = watch("createMode");
  const normalizedCurrentRole = (currentRole ?? "").toString().toUpperCase();
  const canChangeRole =
    normalizedCurrentRole === "OWNER" || normalizedCurrentRole === "ADMIN";
  const canAssignOwner = normalizedCurrentRole === "OWNER";
  useEffect(() => {
    if (user) {
      reset({
        email: user.email ?? "",
        username: user.username ?? "",
        role: user.role,
        password: "",
        createMode: "email",
      });
    } else {
      reset({
        createMode: "email",
        email: "",
        username: "",
        password: "",
        role: "EDITOR",
      });
    }
  }, [user, open, reset]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-[#111111] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {user ? "Edytuj użytkownika" : "Nowy użytkownik"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 pt-2">
          {!user && (
            <div className="space-y-1.5">
              <Label>Sposób tworzenia konta</Label>
              <div className="flex gap-2">
                {(["email", "username"] as CreateMode[]).map((m) => (
                  <label
                    key={m}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={m}
                      {...register("createMode")}
                      className="accent-brand-yellow"
                    />
                    <span className="text-white/70 text-sm flex items-center gap-1">
                      {m === "email" ? (
                        <>
                          <AtSign className="w-3.5 h-3.5" /> Email
                        </>
                      ) : (
                        <>
                          <UserIcon className="w-3.5 h-3.5" /> Nazwa użytkownika
                        </>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {(!user || user.email) && (createMode === "email" || user) && (
            <div className="space-y-1.5">
              <Label htmlFor="u-email">
                Email {!user && createMode === "email" && "*"}
              </Label>
              <Input
                id="u-email"
                type="email"
                placeholder="user@example.com"
                {...register("email", {
                  required:
                    !user && createMode === "email"
                      ? "Email jest wymagany"
                      : false,
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Podaj poprawny email",
                  },
                })}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-brand-red text-xs">{errors.email.message}</p>
              )}
            </div>
          )}

          {(!user || user.username) && (createMode === "username" || user) && (
            <div className="space-y-1.5">
              <Label htmlFor="u-username">
                Nazwa użytkownika {!user && createMode === "username" && "*"}
              </Label>
              <Input
                id="u-username"
                placeholder="jankowalski"
                {...register("username", {
                  required:
                    !user && createMode === "username"
                      ? "Nazwa użytkownika jest wymagana"
                      : false,
                  pattern: {
                    value: /^[a-z0-9._-]{3,}$/,
                    message:
                      "Tylko małe litery, cyfry, kropki, myślniki (min 3 znaki)",
                  },
                })}
                aria-invalid={!!errors.username}
              />
              {errors.username && (
                <p className="text-brand-red text-xs">
                  {errors.username.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="u-role">Rola *</Label>
            <select
              id="u-role"
              {...register("role", { required: true })}
              disabled={!canChangeRole}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-yellow/60 transition-colors"
            >
              <option value="EDITOR">Redaktor</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Administrator</option>
              <option value="OWNER" disabled={!canAssignOwner}>
                Właściciel
              </option>
            </select>
          </div>

          {(!user || createMode === "username") && (
            <div className="space-y-1.5">
              <Label htmlFor="u-password">
                Hasło{" "}
                {!user && createMode === "username"
                  ? "(opcjonalne - jeśli puste, wylosuje się)"
                  : "(opcjonalne - zmień tylko jeśli chcesz)"}
              </Label>
              <Input
                id="u-password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" variant="default">
              {user ? "Zapisz" : "Utwórz"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Generated password popup ─────────────────────────────────────
function GeneratedPasswordModal({
  open,
  password,
  onClose,
}: {
  open: boolean;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm bg-[#111111] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Wygenerowane hasło</DialogTitle>
        </DialogHeader>
        <p className="text-white/60 text-sm">
          Skopiuj to hasło i przekaż użytkownikowi. Nie będzie ono ponownie
          wyświetlone.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <code className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-brand-yellow text-sm font-mono tracking-wider">
            {password}
          </code>
          <button
            onClick={copy}
            className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {copied ? (
              <CheckCheck className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="default" onClick={onClose}>
            Gotowe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function UsersPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const currentRole = session?.user?.role as Role | undefined;
  const currentId = session?.user?.id;
  const lastRoleSyncAttemptRef = useRef<Role | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Prefer authoritative role from backend users list when available
  const effectiveRole: Role | undefined =
    users.find((u) => u.id === currentId)?.role ?? currentRole;
  const [ownerConfirmOpen, setOwnerConfirmOpen] = useState(false);
  const [pendingOwnerData, setPendingOwnerData] = useState<
    UserFormValues | EditFormValues | null
  >(null);
  const [ownerCountdown, setOwnerCountdown] = useState(10);

  const addToast = (message: string, type: ToastData["type"] = "success") =>
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  const removeToast = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    if (!ownerConfirmOpen) return;
    setOwnerCountdown(10);
    const t = setInterval(() => {
      setOwnerCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [ownerConfirmOpen]);

  useEffect(() => {
    if (status === "loading" || loading) return;
    if (
      session &&
      effectiveRole &&
      effectiveRole !== "ADMIN" &&
      effectiveRole !== "OWNER"
    )
      router.replace("/dashboard");
  }, [session, effectiveRole, loading, router, status]);

  useEffect(() => {
    if (status === "loading" || loading || !session || !effectiveRole) return;

    if (effectiveRole === currentRole) {
      lastRoleSyncAttemptRef.current = null;
      return;
    }

    if (lastRoleSyncAttemptRef.current === effectiveRole) return;

    lastRoleSyncAttemptRef.current = effectiveRole;
    void updateSession();
  }, [session, status, loading, effectiveRole, currentRole, updateSession]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await gql<{ users: AdminUser[] }>(USERS_QUERY);
      setUsers(data.users ?? []);
    } catch {
      addToast("Błąd podczas ładowania użytkowników", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };
  const openEdit = (u: AdminUser) => {
    setEditTarget(u);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const performSave = async (
    d: UserFormValues | EditFormValues,
    target: AdminUser | null,
  ) => {
    try {
      if (target) {
        await gql(UPDATE_USER, {
          id: target.id,
          input: {
            email: d.email || undefined,
            username: d.username || undefined,
            role: d.role || undefined,
            password: d.password || undefined,
          },
        });
        addToast(`Zaktualizowano użytkownika`);
      } else {
        const createData = d as UserFormValues;

        const res = await gql<{ createUser: AdminUser }>(CREATE_USER, {
          input: {
            email:
              (createData.createMode === "email"
                ? createData.email
                : undefined) || undefined,
            username:
              (createData.createMode === "username"
                ? createData.username
                : undefined) || undefined,
            role: createData.role,
            password: createData.password || undefined,
          },
        });
        addToast(
          `Utworzono użytkownika: ${res.createUser.email ?? res.createUser.username}`,
        );

        // If no password set (email mode or username with no password), show generated
        if (!createData.password) {
          const pw = await gql<{ resetUserPassword: string }>(RESET_PASSWORD, {
            id: res.createUser.id,
          });
          setGeneratedPassword(pw.resetUserPassword);
          setPwModalOpen(true);
        }
      }
      await loadUsers();

      if (target?.id === currentId) {
        await updateSession();
      }
    } catch (e) {
      addToast((e as Error).message || "Błąd zapisu", "error");
    }
  };

  const handleSave = async (data: UserFormValues | EditFormValues) => {
    const d = data as UserFormValues & EditFormValues;

    // If assigning OWNER to someone else, show confirmation with delay
    const assigningOwnerToOther =
      d.role === "OWNER" && (!editTarget || editTarget.id !== currentId);

    if (assigningOwnerToOther) {
      setPendingOwnerData(d);
      setOwnerCountdown(10);
      setOwnerConfirmOpen(true);
      return;
    }

    await performSave(d, editTarget);
    closeModal();
  };

  const confirmOwnerAssignment = async () => {
    if (!pendingOwnerData) return;
    await performSave(pendingOwnerData, editTarget);
    setOwnerConfirmOpen(false);
    setPendingOwnerData(null);
    closeModal();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await gql(DELETE_USER, { id: deleteTarget.id });
      addToast(`Usunięto użytkownika`, "error");
      await loadUsers();
    } catch (e) {
      addToast((e as Error).message || "Błąd usuwania", "error");
    }
    setDeleteTarget(null);
  };

  const handleResetPassword = async (u: AdminUser) => {
    try {
      const res = await gql<{ resetUserPassword: string }>(RESET_PASSWORD, {
        id: u.id,
      });
      setGeneratedPassword(res.resetUserPassword);
      setPwModalOpen(true);
    } catch (e) {
      addToast((e as Error).message || "Błąd resetowania hasła", "error");
    }
  };

  if (
    status !== "loading" &&
    !loading &&
    effectiveRole &&
    effectiveRole !== "ADMIN" &&
    effectiveRole !== "OWNER"
  )
    return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Użytkownicy</h1>
            <p className="text-white/50 text-sm mt-1">
              {loading ? "Ładowanie…" : `${users.length} kont`}
            </p>
          </div>
          <Button onClick={openCreate} variant="default">
            <PlusCircle className="w-4 h-4" /> Dodaj użytkownika
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3" />
            Ładowanie…
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Brak użytkowników</p>
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a1a1a] border-b border-white/10 text-white/50 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">
                    Użytkownik
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                    Rola
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                    Data dodania
                  </th>
                  <th className="text-right px-4 py-3 font-medium">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const isCurrentUser = u.id === currentId;
                  const displayName = u.email ?? u.username ?? u.id;
                  const color = ROLE_COLORS[u.role];

                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-white/5 hover:bg-white/2 transition-colors ${i % 2 === 0 ? "" : "bg-white/1"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                            style={{
                              backgroundColor: `${color}20`,
                              border: `1px solid ${color}30`,
                              color,
                            }}
                          >
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium flex items-center gap-1.5">
                              {displayName}
                              {isCurrentUser && (
                                <span className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded font-normal">
                                  Ty
                                </span>
                              )}
                            </p>
                            {u.email && u.username && (
                              <p className="text-white/40 text-xs">
                                @{u.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${color}20`,
                            color,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs hidden lg:table-cell">
                        {new Date(u.createdAt).toLocaleDateString("pl-PL", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResetPassword(u)}
                            className="p-1.5 text-white/40 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded-md transition-colors"
                            title="Resetuj hasło"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 text-white/40 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded-md transition-colors"
                            title="Edytuj"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {!isCurrentUser && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 text-white/40 hover:text-brand-red hover:bg-brand-red/10 rounded-md transition-colors"
                              title="Usuń"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <UserModal
        open={modalOpen}
        user={editTarget}
        onSave={handleSave}
        onClose={closeModal}
        currentRole={effectiveRole}
      />
      <GeneratedPasswordModal
        open={pwModalOpen}
        password={generatedPassword}
        onClose={() => setPwModalOpen(false)}
      />
      <Dialog
        open={ownerConfirmOpen}
        onOpenChange={(v) => !v && setOwnerConfirmOpen(false)}
      >
        <DialogContent className="max-w-md bg-[#111111] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              Nadajesz rolę Właściciela
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/60 text-sm">
            Nadajesz użytkownikowi rolę Właściciela — osoba otrzyma takie same
            prawa jak Ty, dostęp do wszystkich elementów strony oraz możliwość
            pozbawienia Cię uprawnień. Ta operacja może całkowicie zmienić
            dostęp do konta.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setOwnerConfirmOpen(false);
                setPendingOwnerData(null);
              }}
            >
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={confirmOwnerAssignment}
              disabled={ownerCountdown > 0}
            >
              {ownerCountdown > 0
                ? `Akceptuj (${ownerCountdown}s)`
                : "Akceptuj"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Usuń użytkownika"
        description={`Czy na pewno chcesz usunąć konto „${deleteTarget?.email ?? deleteTarget?.username}"? Tej operacji nie można cofnąć.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
