"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";

import { managedAdminResources } from "@/lib/admin-resources";
import { gql } from "@/lib/graphql";
import type { AdminResource, Role, RolePermission } from "@/lib/types";

type PermissionAction = "read" | "write" | "delete";

interface AdminAccessContextValue {
  permissions: RolePermission[];
  loading: boolean;
  error: string | null;
  canAccess: (resource: AdminResource, action?: PermissionAction) => boolean;
  refreshPermissions: () => Promise<void>;
}

const AdminAccessContext = createContext<AdminAccessContextValue | undefined>(
  undefined,
);

const MY_PERMISSIONS_QUERY = `
  query AdminMyPermissions {
    myPermissions {
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

function buildOwnerPermissions(role: Role): RolePermission[] {
  const updatedAt = new Date().toISOString();

  return managedAdminResources.map((resource) => ({
    role,
    resource,
    canRead: true,
    canWrite: true,
    canDelete: true,
    updatedAt,
    updatedBy: null,
  }));
}

export function AdminAccessProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentRole = (session?.user?.role ?? null) as Role | null;

  const permissionsByResource = useMemo(() => {
    return permissions.reduce<Record<string, RolePermission>>(
      (acc, permission) => {
        acc[permission.resource] = permission;
        return acc;
      },
      {},
    );
  }, [permissions]);

  const loadPermissions = useCallback(async () => {
    if (status === "loading") {
      return;
    }

    if (status !== "authenticated" || !currentRole) {
      setPermissions([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (currentRole === "OWNER") {
      setPermissions(buildOwnerPermissions(currentRole));
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await gql<{ myPermissions: RolePermission[] }>(
        MY_PERMISSIONS_QUERY,
      );
      setPermissions(response.myPermissions ?? []);
    } catch (caughtError) {
      setPermissions([]);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Nie udalo sie pobrac uprawnien.",
      );
    } finally {
      setLoading(false);
    }
  }, [currentRole, status]);

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  const canAccess = useCallback(
    (resource: AdminResource, action: PermissionAction = "read"): boolean => {
      if (currentRole === "OWNER") {
        return true;
      }

      const permission = permissionsByResource[resource];
      if (!permission) {
        return false;
      }

      if (action === "write") {
        return permission.canWrite;
      }

      if (action === "delete") {
        return permission.canDelete;
      }

      return permission.canRead;
    },
    [currentRole, permissionsByResource],
  );

  const contextValue = useMemo<AdminAccessContextValue>(
    () => ({
      permissions,
      loading,
      error,
      canAccess,
      refreshPermissions: loadPermissions,
    }),
    [permissions, loading, error, canAccess, loadPermissions],
  );

  return (
    <AdminAccessContext.Provider value={contextValue}>
      {children}
    </AdminAccessContext.Provider>
  );
}

export function useAdminAccess() {
  const context = useContext(AdminAccessContext);
  if (!context) {
    throw new Error("useAdminAccess must be used inside AdminAccessProvider");
  }

  return context;
}
