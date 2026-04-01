"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  Globe,
  Handshake,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import Sidebar from "@/app/components/Sidebar";
import PartnerModal, {
  type PartnerFormValues,
} from "@/app/components/PartnerModal";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import ToastContainer, { type ToastData } from "@/app/components/Toast";
import { Button } from "@/app/components/ui/button";
import { gql } from "@/lib/graphql";
import type { Partner } from "@/lib/types";

const PARTNERS_QUERY = `query { partners { id name logoUrl websiteUrl description } }`;
const CREATE_PARTNER = `mutation CreatePartner($input: CreatePartnerInput!) {
  createPartner(input: $input) { id name logoUrl websiteUrl description }
}`;
const UPDATE_PARTNER = `mutation UpdatePartner($id: ID!, $input: UpdatePartnerInput!) {
  updatePartner(id: $id, input: $input) { id name logoUrl websiteUrl description }
}`;
const DELETE_PARTNER = `mutation DeletePartner($id: ID!) { deletePartner(id: $id) }`;

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastData["type"] = "success") => {
      setToasts((previous) => [...previous, { id: Date.now(), message, type }]);
    },
    [],
  );

  const removeToast = (id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  const loadPartners = useCallback(async () => {
    try {
      const data = await gql<{ partners: Partner[] }>(PARTNERS_QUERY);
      setPartners(data.partners ?? []);
    } catch {
      addToast("Błąd podczas ładowania partnerów", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadPartners();
  }, [loadPartners]);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (partner: Partner) => {
    setEditTarget(partner);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleSave = async (data: PartnerFormValues) => {
    try {
      if (editTarget) {
        await gql(UPDATE_PARTNER, {
          id: editTarget.id,
          input: {
            name: data.name || undefined,
            logoUrl: data.logoUrl || undefined,
            websiteUrl: data.websiteUrl || undefined,
            description: data.description || undefined,
          },
        });
        addToast(`Zaktualizowano: "${data.name}"`);
      } else {
        await gql(CREATE_PARTNER, {
          input: {
            name: data.name,
            logoUrl: data.logoUrl || undefined,
            websiteUrl: data.websiteUrl || undefined,
            description: data.description || undefined,
          },
        });
        addToast(`Dodano: "${data.name}"`);
      }

      await loadPartners();
    } catch (error) {
      addToast((error as Error).message || "Błąd zapisu", "error");
    }

    closeModal();
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await gql(DELETE_PARTNER, { id: deleteTarget.id });
      addToast(`Usunięto: "${deleteTarget.name}"`, "error");
      await loadPartners();
    } catch (error) {
      addToast((error as Error).message || "Błąd usuwania", "error");
    }

    setDeleteTarget(null);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Partnerzy</h1>
            <p className="mt-1 text-sm text-white/50">
              {loading ? "Ładowanie..." : `${partners.length} partnerów`}
            </p>
          </div>

          <Button onClick={openCreate} variant="default">
            <PlusCircle className="h-4 w-4" />
            Dodaj partnera
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <span className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Ładowanie...
          </div>
        ) : partners.length === 0 ? (
          <div className="py-20 text-center text-white/40">
            <Handshake className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="text-lg">Brak partnerów</p>
            <p className="mt-1 text-sm">
              Kliknij przycisk Dodaj partnera, aby zacząć.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#1a1a1a] text-xs uppercase tracking-wide text-white/50">
                  <th className="px-4 py-3 text-left font-medium">Partner</th>
                  <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                    Opis
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">
                    Strona
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner, index) => (
                  <tr
                    key={partner.id}
                    className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${index % 2 === 0 ? "" : "bg-white/[0.01]"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a]">
                          {partner.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={partner.logoUrl}
                              alt={partner.name}
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-xs font-bold text-white/40">
                              {initials(partner.name)}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-white">{partner.name}</p>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-white/50 md:table-cell">
                      <p className="max-w-[220px] truncate">
                        {partner.description ?? "-"}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {partner.websiteUrl ? (
                        <a
                          href={partner.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-brand-yellow/70 transition-colors hover:text-brand-yellow"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          <span className="max-w-[180px] truncate">
                            {partner.websiteUrl.replace(/^https?:\/\//, "")}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-white/20">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(partner)}
                          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-brand-yellow/10 hover:text-brand-yellow"
                          title="Edytuj"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(partner)}
                          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-brand-red/10 hover:text-brand-red"
                          title="Usuń"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <PartnerModal
        open={modalOpen}
        partner={editTarget}
        onSave={handleSave}
        onClose={closeModal}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Usuń partnera"
        description={`Czy na pewno chcesz usunąć "${deleteTarget?.name}"? Tej operacji nie można cofnąć.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
