"use client";

import { useEffect, useState } from "react";
import { FormField, FormActions } from "@/app/components/forms/FormPrimitives";
import { useSession } from "next-auth/react";
import type { ToastData } from "@/app/components/Toast";
import RichTextEditor from "@/app/components/statute/RichTextEditor";
import { stripStatuteHtml } from "@/lib/statute-rich-text";

type Statute = {
  id: string;
  content: string;
  updatedAt: string;
};

type StatuteVersion = {
  id: string;
  content: string;
  summary?: string | null;
  authorId?: string | null;
  createdAt: string;
};

type StatuteEditorProps = {
  onToast: (message: string, type?: ToastData["type"]) => void;
};

export default function StatuteEditor({ onToast }: StatuteEditorProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [statute, setStatute] = useState<Statute | null>(null);
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState<string | undefined>(undefined);
  const [versions, setVersions] = useState<StatuteVersion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit =
    session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/statute");
        if (!res.ok) {
          onToast("Nie udało się wczytać regulaminu", "error");
          return;
        }

        const data = await res.json();
        setStatute(data);
        setContent(data?.content ?? "");

        const versionsRes = await fetch("/api/statute/versions");
        if (!versionsRes.ok) {
          onToast("Nie udało się wczytać historii zmian", "error");
          return;
        }

        const vs = await versionsRes.json();
        setVersions(Array.isArray(vs) ? vs : []);
      } catch {
        onToast("Nie udało się wczytać regulaminu", "error");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [onToast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canEdit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/statute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, summary }),
      });
      if (!res.ok) {
        let msg = "Błąd podczas zapisu";
        try {
          const payload = await res.json();
          msg = payload?.error ?? msg;
        } catch {
          // ignore json parse
        }
        onToast(msg, "error");
        return;
      }

      let updated;
      try {
        updated = await res.json();
      } catch {
        onToast("Błąd podczas zapisu", "error");
        return;
      }

      setStatute(updated);
      setContent(updated?.content ?? content);
      setSummary(undefined);

      const versionsRes = await fetch("/api/statute/versions");
      if (versionsRes.ok) {
        const vs = await versionsRes.json();
        setVersions(Array.isArray(vs) ? vs : []);
      }
      onToast("Zapisano regulamin", "success");
    } catch (err) {
      onToast((err as Error).message || "Błąd podczas zapisu", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
          Ładowanie regulaminu...
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Treść regulaminu"
          error={undefined}
          helpText="Możesz wkleić gotowo sformatowaną treść, używać wcięć klawiszem Tab albo zaimportować PDF i Markdown. Zachowujemy nagłówki, listy, pogrubienia, podkreślenia i kursywę."
        >
          <RichTextEditor
            value={content}
            onChange={setContent}
            disabled={!canEdit || isSubmitting}
            placeholder="Wklej sformatowany tekst regulaminu"
            onToast={onToast}
          />
        </FormField>

        <FormField label="Notatka do historii (opcjonalnie)">
          <input
            className="w-full rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white"
            value={summary ?? ""}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Krótki opis zmiany"
            disabled={!canEdit || isSubmitting}
          />
        </FormField>

        <div className="flex items-center justify-between">
          <div className="text-sm text-white/70">
            Ostatnia aktualizacja: {statute?.updatedAt ?? "-"}
          </div>
          <FormActions
            onCancel={() => {}}
            submitLabel="Zapisz"
            isSubmitting={isSubmitting}
            disabled={!canEdit}
          />
        </div>
      </form>

      <div>
        <h3 className="text-lg font-medium text-white">Historia zmian</h3>
        <div className="mt-3 space-y-2 text-sm text-white/80">
          {versions.length === 0 ? (
            <div className="text-white/50">Brak zapisanych wersji.</div>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="rounded-md border border-white/8 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {v.summary ?? "Aktualizacja"}
                    </div>
                    <div className="text-xs text-white/60">{v.createdAt}</div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-white/70">
                  {stripStatuteHtml(v.content).slice(0, 200)}
                  {stripStatuteHtml(v.content).length > 200 ? "..." : ""}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
