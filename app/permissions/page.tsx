"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";

import { useAdminAccess } from "@/app/components/AdminAccessProvider";
import Sidebar from "@/app/components/Sidebar";
import ToastContainer, { type ToastData } from "@/app/components/Toast";
import { Badge } from "@/app/components/ui/badge";
import {
  adminNavGroups,
  getAdminResourceLabel,
  getRoleLabel,
  permissionActionLabels,
  permissionEditableRoles,
  type PermissionActionKey,
} from "@/lib/admin-resources";
import { gql } from "@/lib/graphql";
import type { AdminResource, Role, RolePermission } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_PERMISSIONS_QUERY = `
  query AdminRolePermissions {
    rolePermissions {
      role
      resource
      canRead
      canWrite
      canDelete
      updatedAt
      updatedBy {
        id
        email
        username
        role
      }
    }
  }
`;

const UPDATE_ROLE_PERMISSION = `
  mutation UpdateRolePermission($input: UpdateRolePermissionInput!) {
    updateRolePermission(input: $input) {
      role
      resource
      canRead
      canWrite
      canDelete
      updatedAt
      updatedBy {
        id
        email
        username
        role
      }
    }
  }
`;

function permissionKey(role: Role, resource: AdminResource) {
  return `${role}:${resource}`;
}

function emptyPermission(role: Role, resource: AdminResource): RolePermission {
  return {
    role,
    resource,
    canRead: false,
    canWrite: false,
    canDelete: false,
    updatedAt: new Date(0).toISOString(),
    updatedBy: null,
  };
}

function getPermissionStatus(permission: RolePermission) {
  const enabledActions = [
    permission.canRead ? "R" : null,
    permission.canWrite ? "W" : null,
    permission.canDelete ? "D" : null,
  ].filter(Boolean);

  return enabledActions.length > 0
    ? enabledActions.join(" / ")
    : "Brak dostepu";
}

const permissionActions: PermissionActionKey[] = ["read", "write", "delete"];

function isPermissionActionEnabled(
  permission: RolePermission,
  action: PermissionActionKey,
) {
  if (action === "read") {
    return permission.canRead;
  }

  if (action === "write") {
    return permission.canWrite;
  }

  return permission.canDelete;
}

export default function PermissionsPage() {
  const { data: session } = useSession();
  const {
    canAccess,
    loading: accessLoading,
    refreshPermissions,
  } = useAdminAccess();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>(
    permissionEditableRoles[0],
  );
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const canRead = canAccess("ROLE_PERMISSIONS", "read");
  const canWrite = canAccess("ROLE_PERMISSIONS", "write");
  const currentRole = (session?.user?.role ?? null) as Role | null;

  useEffect(() => {
    if (currentRole && permissionEditableRoles.includes(currentRole)) {
      setSelectedRole(currentRole);
    }
  }, [currentRole]);

  const addToast = useCallback(
    (message: string, type: ToastData["type"] = "success") => {
      setToasts((current) => [...current, { id: Date.now(), message, type }]);
    },
    [],
  );

  function removeToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  const permissionMap = useMemo(() => {
    return permissions.reduce<Record<string, RolePermission>>(
      (acc, permission) => {
        acc[permissionKey(permission.role, permission.resource)] = permission;
        return acc;
      },
      {},
    );
  }, [permissions]);

  const resourceGroups = useMemo(() => {
    return adminNavGroups
      .map((group) => ({
        key: group.key,
        label: group.label,
        description: group.description,
        items: group.items,
      }))
      .filter((group) => group.items.length > 0);
  }, []);

  const allManagedItems = useMemo(
    () => resourceGroups.flatMap((group) => group.items),
    [resourceGroups],
  );

  const roleSummaries = useMemo(() => {
    return permissionEditableRoles.map((role) => {
      const rolePermissions = allManagedItems.map(
        (item) =>
          permissionMap[permissionKey(role, item.resource)] ??
          emptyPermission(role, item.resource),
      );

      return {
        role,
        resourcesEnabled: rolePermissions.filter(
          (permission) =>
            permission.canRead || permission.canWrite || permission.canDelete,
        ).length,
        readEnabled: rolePermissions.filter((permission) => permission.canRead)
          .length,
        writeEnabled: rolePermissions.filter(
          (permission) => permission.canWrite,
        ).length,
        deleteEnabled: rolePermissions.filter(
          (permission) => permission.canDelete,
        ).length,
      };
    });
  }, [allManagedItems, permissionMap]);

  const selectedRoleSummary = useMemo(() => {
    return (
      roleSummaries.find((summary) => summary.role === selectedRole) ??
      roleSummaries[0]
    );
  }, [roleSummaries, selectedRole]);

  const selectedRoleLatestUpdate = useMemo(() => {
    return [...permissions]
      .filter((permission) => permission.role === selectedRole)
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      )[0];
  }, [permissions, selectedRole]);

  const loadPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gql<{ rolePermissions: RolePermission[] }>(
        ROLE_PERMISSIONS_QUERY,
      );
      setPermissions(data.rolePermissions ?? []);
    } catch (error) {
      addToast(
        (error as Error).message || "Nie udalo sie pobrac uprawnien.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (accessLoading) {
      return;
    }

    if (!canRead) {
      setLoading(false);
      return;
    }

    void loadPermissions();
  }, [accessLoading, canRead, loadPermissions]);

  async function togglePermission(
    role: Role,
    resource: AdminResource,
    action: PermissionActionKey,
  ) {
    if (!canWrite) {
      return;
    }

    const existing =
      permissionMap[permissionKey(role, resource)] ??
      emptyPermission(role, resource);
    const nextPermission = {
      role,
      resource,
      canRead: action === "read" ? !existing.canRead : existing.canRead,
      canWrite: action === "write" ? !existing.canWrite : existing.canWrite,
      canDelete: action === "delete" ? !existing.canDelete : existing.canDelete,
    };

    if (!nextPermission.canRead && nextPermission.canWrite) {
      nextPermission.canRead = true;
    }

    if (!nextPermission.canRead && nextPermission.canDelete) {
      nextPermission.canRead = true;
    }

    const key = `${role}:${resource}:${action}`;
    setSavingKey(key);

    try {
      await gql<{ updateRolePermission: RolePermission }>(
        UPDATE_ROLE_PERMISSION,
        { input: nextPermission },
      );
      await loadPermissions();
      addToast(
        `Zmieniono ${permissionActionLabels[action].toLowerCase()} dla roli ${getRoleLabel(role).toLowerCase()} w module ${getAdminResourceLabel(resource).toLowerCase()}.`,
      );

      if (currentRole === role) {
        await refreshPermissions();
      }
    } catch (error) {
      addToast(
        (error as Error).message || "Nie udalo sie zapisac uprawnienia.",
        "error",
      );
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 px-5 py-5 sm:px-6 xl:px-7 xl:py-6">
        {accessLoading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="rounded-3xl border border-white/10 bg-[#121212] px-6 py-8 text-center text-sm text-white/65">
              Ladowanie macierzy uprawnien...
            </div>
          </div>
        ) : !canRead ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-lg rounded-3xl border border-white/10 bg-[#121212] p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
                <Lock className="h-5 w-5" />
              </div>
              <h1 className="mt-4 text-xl font-semibold text-white">
                Brak dostepu do uprawnien
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Ta rola nie ma prawa odczytu dla panelu RBAC. Dostep moze nadac
                administrator lub wlasciciel.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-3xl border border-white/10 bg-[#121212] px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35">
                  Security / IAM
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold text-white">
                    Uprawnienia rol
                  </h1>
                </div>
              </div>

              <div className="min-w-65 rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/65">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                  Ostatnia zmiana dla wybranej roli
                </p>
                <p className="mt-2 font-medium text-white">
                  {selectedRoleLatestUpdate
                    ? `${new Date(selectedRoleLatestUpdate.updatedAt).toLocaleString("pl-PL")} · ${selectedRoleLatestUpdate.updatedBy?.email ?? selectedRoleLatestUpdate.updatedBy?.username ?? getRoleLabel(selectedRole)}`
                    : "Brak danych"}
                </p>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
                <section className="rounded-3xl border border-white/10 bg-[#121212] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                        Wybierz role
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {roleSummaries.map((summary) => {
                      const active = summary.role === selectedRole;

                      return (
                        <button
                          key={summary.role}
                          type="button"
                          onClick={() => setSelectedRole(summary.role)}
                          aria-pressed={active}
                          className={cn(
                            "w-full rounded-[18px] border px-3.5 py-3 text-left transition-colors",
                            active
                              ? "border-brand-yellow/25 bg-brand-yellow/10"
                              : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">
                                {getRoleLabel(summary.role)}
                              </p>
                              <p className="mt-1 text-xs text-white/48">
                                {summary.resourcesEnabled} zasobow z aktywnym
                                dostepem
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-white/55">
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                                  R {summary.readEnabled}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                                  W {summary.writeEnabled}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                                  D {summary.deleteEnabled}
                                </span>
                              </div>
                            </div>
                            {currentRole === summary.role ? (
                              <Badge
                                variant="outline"
                                className="shrink-0 border-white/10 bg-black/25 text-[10px] uppercase tracking-[0.16em] text-white/58"
                              >
                                Twoja rola
                              </Badge>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-[#121212] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                    Zasady edycji
                  </p>
                  <div className="mt-3 space-y-2 text-xs leading-relaxed text-white/52">
                    <p>Zmiany dzialaja natychmiast po kliknieciu.</p>
                    <p>
                      Zapis i usuwanie utrzymuja tez odczyt, zeby rola nie
                      stracila kontekstu pracy w module.
                    </p>
                  </div>
                </section>
              </aside>

              <section className="space-y-4">
                <section className="rounded-3xl border border-white/10 bg-[#121212] px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                        Zakres konfiguracji
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-white">
                          {getRoleLabel(selectedRole)}
                        </h2>
                        {currentRole === selectedRole ? (
                          <Badge
                            variant="outline"
                            className="border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.16em] text-white/58"
                          >
                            Biezaca rola
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {permissionActions.map((action) => (
                        <Badge
                          key={action}
                          variant="outline"
                          className="border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/62"
                        >
                          {permissionActionLabels[action]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </section>

                {loading ? (
                  <div className="rounded-3xl border border-white/10 bg-[#121212] py-18 text-center text-sm text-white/65">
                    Ladowanie danych RBAC...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {resourceGroups.map((group) => {
                      const groupEnabledCount = group.items.filter((item) => {
                        const permission =
                          permissionMap[
                            permissionKey(selectedRole, item.resource)
                          ] ?? emptyPermission(selectedRole, item.resource);

                        return (
                          permission.canRead ||
                          permission.canWrite ||
                          permission.canDelete
                        );
                      }).length;

                      return (
                        <section
                          key={group.key}
                          className="overflow-hidden rounded-3xl border border-white/10 bg-[#121212]"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
                            <div>
                              <h3 className="text-sm font-semibold text-white">
                                {group.label}
                              </h3>
                              <p className="mt-1 text-xs leading-relaxed text-white/50">
                                {group.description}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className="border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/55"
                              >
                                {group.items.length} modulow
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-emerald-300/18 bg-emerald-300/10 px-3 py-1 text-[11px] font-medium text-emerald-200"
                              >
                                {groupEnabledCount} aktywnych
                              </Badge>
                            </div>
                          </div>

                          <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.6fr)_110px_110px_110px] lg:gap-3 lg:px-5 lg:py-3 lg:text-[11px] lg:uppercase lg:tracking-[0.18em] lg:text-white/35">
                            <span>Modul</span>
                            <span className="text-center">Odczyt</span>
                            <span className="text-center">Zapis</span>
                            <span className="text-center">Usuwanie</span>
                          </div>

                          <div className="divide-y divide-white/6">
                            {group.items.map((item) => {
                              const permission =
                                permissionMap[
                                  permissionKey(selectedRole, item.resource)
                                ] ??
                                emptyPermission(selectedRole, item.resource);
                              const hasAnyAccess =
                                permission.canRead ||
                                permission.canWrite ||
                                permission.canDelete;

                              return (
                                <article
                                  key={item.resource}
                                  className="px-4 py-4 lg:px-5"
                                >
                                  <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1.6fr)_110px_110px_110px] lg:items-center lg:gap-3">
                                    <div className="min-w-0">
                                      <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/65">
                                          <item.icon className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-sm font-medium text-white">
                                              {item.label}
                                            </h4>
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                "rounded-full px-2.5 py-1 text-[10px] font-medium tracking-[0.14em]",
                                                hasAnyAccess
                                                  ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                                                  : "border-white/10 bg-white/5 text-white/45",
                                              )}
                                            >
                                              {getPermissionStatus(permission)}
                                            </Badge>
                                          </div>

                                          <p className="mt-1 text-xs leading-relaxed text-white/48">
                                            {item.description}
                                          </p>
                                          <p className="mt-2 text-[11px] leading-relaxed text-white/35">
                                            {permission.updatedBy?.email ||
                                            permission.updatedBy?.username
                                              ? `Ostatnia zmiana: ${permission.updatedBy?.email ?? permission.updatedBy?.username}`
                                              : "Brak recznej aktualizacji dla tego zasobu."}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {permissionActions.map((action) => {
                                      const supportsAction =
                                        item.supportedActions &&
                                        !item.supportedActions.includes(action)
                                          ? false
                                          : true;
                                      const cellKey = `${selectedRole}:${item.resource}:${action}`;

                                      if (!supportsAction) {
                                        return (
                                          <div
                                            key={action}
                                            className="flex h-9 w-full items-center justify-center rounded-xl border border-white/6 bg-transparent text-[11px] text-white/40"
                                            aria-hidden="true"
                                          >
                                            —
                                          </div>
                                        );
                                      }

                                      const active = isPermissionActionEnabled(
                                        permission,
                                        action,
                                      );

                                      return (
                                        <button
                                          key={action}
                                          type="button"
                                          aria-pressed={active}
                                          disabled={
                                            !canWrite || savingKey === cellKey
                                          }
                                          onClick={() =>
                                            togglePermission(
                                              selectedRole,
                                              item.resource,
                                              action,
                                            )
                                          }
                                          className={cn(
                                            "flex h-9 w-full items-center justify-center rounded-xl border text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
                                            active
                                              ? "border-brand-yellow/25 bg-brand-yellow/10 text-brand-yellow"
                                              : "border-white/10 bg-white/5 text-white/55",
                                            !canWrite || savingKey === cellKey
                                              ? "cursor-not-allowed opacity-60"
                                              : "hover:border-white/20 hover:text-white",
                                          )}
                                        >
                                          {permissionActionLabels[action]}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {!canWrite ? (
              <div className="mt-5 rounded-[20px] border border-brand-yellow/25 bg-brand-yellow/10 px-4 py-3 text-sm text-white/75">
                Ta rola moze tylko przegladac macierz uprawnien. Edycje wykonuje
                administrator lub wlasciciel.
              </div>
            ) : null}
          </>
        )}
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
