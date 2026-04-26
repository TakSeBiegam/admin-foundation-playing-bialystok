"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { History, Lock, RefreshCcw } from "lucide-react";

import { useAdminAccess } from "@/app/components/AdminAccessProvider";
import Sidebar from "@/app/components/Sidebar";
import ToastContainer, { type ToastData } from "@/app/components/Toast";
import { Button } from "@/app/components/ui/button";
import AutocompleteInput, {
  type AutocompleteOption,
} from "@/app/components/forms/AutocompleteInput";
import { FormField, FormSelect } from "@/app/components/forms/FormPrimitives";
import {
  getAdminResourceLabel,
  getRoleLabel,
  managedAdminResources,
} from "@/lib/admin-resources";
import { gql } from "@/lib/graphql";
import type {
  AdminResource,
  AdminUser,
  AuditAction,
  AuditLogEntry,
} from "@/lib/types";

const AUDIT_LOGS_QUERY = `
  query AuditLogsPage($input: AuditLogQueryInput) {
    auditLogs(input: $input) {
      id
      actor {
        id
        email
        username
        role
      }
      actorRole
      resource
      action
      resourceId
      summary
      details
      createdAt
    }
  }
`;

const USERS_QUERY = `
  query AuditLogUsers {
    users {
      id
      email
      username
      role
      createdAt
    }
  }
`;

const actionOptions: AuditAction[] = [
  "LOGIN",
  "CREATE",
  "UPDATE",
  "DELETE",
  "RESET_PASSWORD",
  "ARCHIVE",
  "UNARCHIVE",
  "MARK_READ",
  "MARK_UNREAD",
  "ADD_NOTE",
  "ROLE_CHANGE",
  "PERMISSION_CHANGE",
];

const actionLabels: Record<AuditAction, string> = {
  LOGIN: "Logowanie",
  CREATE: "Utworzenie",
  UPDATE: "Aktualizacja",
  DELETE: "Usuniecie",
  RESET_PASSWORD: "Reset hasla",
  ARCHIVE: "Archiwizacja",
  UNARCHIVE: "Przywrocenie",
  MARK_READ: "Oznaczenie jako przeczytane",
  MARK_UNREAD: "Oznaczenie jako nieprzeczytane",
  ADD_NOTE: "Dodanie notatki",
  ROLE_CHANGE: "Zmiana roli",
  PERMISSION_CHANGE: "Zmiana uprawnien",
};

function formatActor(log: AuditLogEntry) {
  if (log.actor?.email) {
    return log.actor.email;
  }

  if (log.actorRole) {
    return getRoleLabel(log.actorRole);
  }

  return "System";
}

function formatDetails(details?: string | null) {
  if (!details) {
    return "Brak dodatkowych szczegolow.";
  }

  try {
    return JSON.stringify(JSON.parse(details), null, 2);
  } catch {
    return details;
  }
}

function buildUserOption(user: AdminUser): AutocompleteOption | null {
  const primaryValue = (user.email ?? user.username ?? user.id)?.trim();
  if (!primaryValue) {
    return null;
  }

  const secondaryLabel =
    user.username && user.email && user.username !== user.email
      ? user.username
      : undefined;

  return {
    value: primaryValue,
    label: primaryValue,
    description: [secondaryLabel, getRoleLabel(user.role)]
      .filter(Boolean)
      .join(" · "),
    keywords: [user.id, user.email ?? "", user.username ?? ""],
  };
}

export default function ActivityLogPage() {
  const { canAccess, loading: accessLoading } = useAdminAccess();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState<AdminResource | "">("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "">("");
  const [actorFilter, setActorFilter] = useState("");
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const deferredActorFilter = useDeferredValue(actorFilter.trim());

  const canRead = canAccess("AUDIT_LOGS", "read");
  const canReadUsers = canAccess("USERS", "read");

  const addToast = useCallback(
    (message: string, type: ToastData["type"] = "success") => {
      setToasts((current) => [...current, { id: Date.now(), message, type }]);
    },
    [],
  );

  const removeToast = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const input = {
        limit: 120,
        ...(resourceFilter ? { resource: resourceFilter } : {}),
        ...(actionFilter ? { action: actionFilter } : {}),
        ...(deferredActorFilter ? { actorId: deferredActorFilter } : {}),
      };

      const data = await gql<{ auditLogs: AuditLogEntry[] }>(AUDIT_LOGS_QUERY, {
        input,
      });
      setLogs(data.auditLogs ?? []);
    } catch (error) {
      addToast(
        (error as Error).message || "Nie udalo sie pobrac logow aktywnosci.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [actionFilter, addToast, deferredActorFilter, resourceFilter]);

  const loadUsers = useCallback(async () => {
    if (!canReadUsers) {
      setUsers([]);
      return;
    }

    try {
      const data = await gql<{ users: AdminUser[] }>(USERS_QUERY);
      setUsers(data.users ?? []);
    } catch {
      setUsers([]);
    }
  }, [canReadUsers]);

  useEffect(() => {
    if (accessLoading) {
      return;
    }

    if (!canRead) {
      setLoading(false);
      return;
    }

    void loadLogs();
  }, [accessLoading, canRead, loadLogs]);

  useEffect(() => {
    if (accessLoading || !canRead) {
      return;
    }

    void loadUsers();
  }, [accessLoading, canRead, loadUsers]);

  const actorOptions = useMemo(() => {
    const options: AutocompleteOption[] = [];
    const seen = new Set<string>();

    const appendUser = (user: AdminUser | null | undefined) => {
      if (!user) {
        return;
      }

      const option = buildUserOption(user);
      if (!option) {
        return;
      }

      const normalizedValue = option.value.trim().toLowerCase();
      if (seen.has(normalizedValue)) {
        return;
      }

      seen.add(normalizedValue);
      options.push(option);
    };

    users.forEach(appendUser);
    logs.forEach((log) => appendUser(log.actor ?? undefined));

    return options;
  }, [logs, users]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        {accessLoading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="rounded-4xl border border-white/10 bg-[#121212] px-8 py-10 text-center text-white/65">
              Ladowanie logow aktywnosci...
            </div>
          </div>
        ) : !canRead ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-lg rounded-4xl border border-white/10 bg-[#121212] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-white">
                Brak dostepu do logow
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Tylko role z prawem odczytu dla audit log moga przegladac
                historie operacji.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
                  Security / Audit Trail
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-white">
                  Logi aktywnosci
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
                  Trwaly dziennik logowan, zmian tresci, zmian rol i
                  aktualizacji uprawnien. Kazdy wpis jest zapisywany po stronie
                  backendu i nie zalezy od UI.
                </p>
              </div>

              <Button onClick={() => void loadLogs()} variant="outline">
                <RefreshCcw className="h-4 w-4" />
                Odswiez
              </Button>
            </div>

            <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <FormField label="Zasob" htmlFor="log-resource-filter">
                    <FormSelect
                      id="log-resource-filter"
                      value={resourceFilter}
                      onChange={(event) =>
                        setResourceFilter(
                          event.target.value as AdminResource | "",
                        )
                      }
                    >
                      <option value="">Wszystkie zasoby</option>
                      <option value="AUTH">Autoryzacja</option>
                      {managedAdminResources.map((resource) => (
                        <option key={resource} value={resource}>
                          {getAdminResourceLabel(resource)}
                        </option>
                      ))}
                    </FormSelect>
                  </FormField>

                  <FormField label="Akcja" htmlFor="log-action-filter">
                    <FormSelect
                      id="log-action-filter"
                      value={actionFilter}
                      onChange={(event) =>
                        setActionFilter(event.target.value as AuditAction | "")
                      }
                    >
                      <option value="">Wszystkie akcje</option>
                      {actionOptions.map((action) => (
                        <option key={action} value={action}>
                          {actionLabels[action]}
                        </option>
                      ))}
                    </FormSelect>
                  </FormField>

                  <FormField
                    label="Uzytkownik"
                    htmlFor="log-actor-filter"
                    helpText="Wpisz email lub login, a system podpowie pasujace konta."
                  >
                    <AutocompleteInput
                      id="log-actor-filter"
                      value={actorFilter}
                      options={actorOptions}
                      placeholder="np. kurylo.ao@gmail.com"
                      emptyText="Brak pasujacych kont."
                      onChange={setActorFilter}
                    />
                  </FormField>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5 text-sm text-white/60">
                <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                  Zakres wpisow
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {logs.length}
                </p>
                <p className="mt-2">
                  Limit pojedynczego pobrania wynosi 120 wpisow, posortowanych
                  od najnowszych.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[28px] border border-white/10 bg-[#121212] py-24 text-center text-white/65">
                Pobieranie danych audit log...
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-white/12 bg-[#121212] py-24 text-center text-white">
                <History className="mx-auto mb-4 h-12 w-12 opacity-30" />
                <p className="text-lg font-medium">
                  Brak wpisow dla tych filtrow
                </p>
                <p className="mt-2 text-sm text-white/50">
                  Zmniejsz zakres filtrow albo odswiez widok po kolejnych
                  operacjach.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <article
                    key={log.id}
                    className="rounded-[28px] border border-white/10 bg-[#121212] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-brand-yellow/25 bg-brand-yellow/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-brand-yellow">
                            {actionLabels[log.action]}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-white/60">
                            {getAdminResourceLabel(log.resource)}
                          </span>
                        </div>

                        <h2 className="mt-3 text-lg font-medium text-white">
                          {log.summary}
                        </h2>
                        <p className="mt-2 text-sm text-white/50">
                          {formatActor(log)} ·{" "}
                          {new Date(log.createdAt).toLocaleString("pl-PL")}
                        </p>
                      </div>

                      {log.resourceId ? (
                        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/50">
                          id: {log.resourceId}
                        </div>
                      ) : null}
                    </div>

                    <details className="mt-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                      <summary className="cursor-pointer text-sm font-medium text-white/78">
                        Szczegoly wpisu
                      </summary>
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed text-white/58">
                        {formatDetails(log.details)}
                      </pre>
                    </details>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
