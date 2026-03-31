"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  LayoutList,
  MapPin,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import Sidebar from "@/app/components/Sidebar";
import EventModal, { type EventFormValues } from "@/app/components/EventModal";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import ToastContainer, { type ToastData } from "@/app/components/Toast";
import { Button } from "@/app/components/ui/button";
import { gql } from "@/lib/graphql";
import type { Event } from "@/lib/types";

const EVENTS_QUERY = `query { events { id title description date location time facebookUrl imageUrl createdAt } }`;
const CREATE_EVENT = `mutation CreateEvent($input: CreateEventInput!) {
  createEvent(input: $input) { id title description date location time facebookUrl imageUrl createdAt }
}`;
const UPDATE_EVENT = `mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
  updateEvent(id: $id, input: $input) { id title description date location time facebookUrl imageUrl createdAt }
}`;
const DELETE_EVENT = `mutation DeleteEvent($id: ID!) { deleteEvent(id: $id) }`;

const DAYS_PL = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
const MONTHS_PL = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

type ViewMode = "list" | "calendar";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function CalendarView({
  events,
  onEdit,
  onDelete,
}: {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const eventsByDate = events.reduce<Record<string, Event[]>>((accumulator, event) => {
    const key = event.date.slice(0, 10);
    accumulator[key] ??= [];
    accumulator[key].push(event);
    return accumulator;
  }, {});

  const goToPreviousMonth = () => {
    if (month === 0) {
      setYear((value) => value - 1);
      setMonth(11);
      return;
    }

    setMonth((value) => value - 1);
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setYear((value) => value + 1);
      setMonth(0);
      return;
    }

    setMonth((value) => value + 1);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Poprzedni
        </button>
        <h2 className="font-semibold text-white">
          {MONTHS_PL[month]} {year}
        </h2>
        <button
          type="button"
          onClick={goToNextMonth}
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          Następny
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className="grid grid-cols-7 border-b border-white/10 bg-[#1a1a1a]">
          {DAYS_PL.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium uppercase tracking-wide text-white/40"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }).map((_, index) => {
            const dayNumber = index - startOffset + 1;
            const isCurrentMonth = dayNumber >= 1 && dayNumber <= lastDay.getDate();
            const dateKey = isCurrentMonth
              ? `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`
              : "";
            const dayEvents = dateKey ? (eventsByDate[dateKey] ?? []) : [];
            const isToday = dateKey === todayKey;

            return (
              <div
                key={`${month}-${index}`}
                className={`min-h-[92px] border-b border-r border-white/5 p-1.5 ${isCurrentMonth ? "bg-[#111111]" : "bg-[#0a0a0a]"}`}
              >
                {isCurrentMonth ? (
                  <>
                    <span
                      className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                        isToday ? "bg-[#FEE600] text-black" : "text-white/40"
                      }`}
                    >
                      {dayNumber}
                    </span>
                    <div className="space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="group relative truncate rounded border border-[#F13738]/30 bg-[#F13738]/20 px-1 py-0.5 text-[10px] text-[#F13738] transition-colors hover:bg-[#F13738]/30"
                          title={event.title}
                        >
                          <span>{event.title}</span>
                          <div className="absolute right-0 top-0 z-10 hidden gap-0.5 rounded border border-white/10 bg-[#1a1a1a] p-0.5 group-hover:flex">
                            <button
                              type="button"
                              onClick={() => onEdit(event)}
                              className="p-0.5 text-white/60 hover:text-[#FEE600]"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(event)}
                              className="p-0.5 text-white/60 hover:text-[#F13738]"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    setToasts((previous) => [...previous, { id: Date.now(), message, type }]);
  }, []);

  const removeToast = (id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  const loadEvents = useCallback(async () => {
    try {
      const data = await gql<{ events: Event[] }>(EVENTS_QUERY);
      setEvents(data.events ?? []);
    } catch {
      addToast("Błąd podczas ładowania wydarzeń", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditTarget(event);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleSave = async (data: EventFormValues) => {
    try {
      if (editTarget) {
        await gql(UPDATE_EVENT, {
          id: editTarget.id,
          input: {
            title: data.title || undefined,
            description: data.description || undefined,
            date: data.date || undefined,
            location: data.location || undefined,
            time: data.time || undefined,
            facebookUrl: data.facebookUrl || undefined,
            imageUrl: data.imageUrl || undefined,
          },
        });
        addToast(`Zaktualizowano: "${data.title}"`);
      } else {
        await gql(CREATE_EVENT, {
          input: {
            title: data.title,
            description: data.description || undefined,
            date: data.date,
            location: data.location || undefined,
            time: data.time || undefined,
            facebookUrl: data.facebookUrl || undefined,
            imageUrl: data.imageUrl || undefined,
          },
        });
        addToast(`Dodano: "${data.title}"`);
      }

      await loadEvents();
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
      await gql(DELETE_EVENT, { id: deleteTarget.id });
      addToast(`Usunięto: "${deleteTarget.title}"`, "error");
      await loadEvents();
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
            <h1 className="text-2xl font-bold text-white">Wydarzenia</h1>
            <p className="mt-1 text-sm text-white/50">
              {loading ? "Ładowanie..." : `${events.length} wydarzeń`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-white/10 bg-[#1a1a1a] p-1">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
              >
                <LayoutList className="h-4 w-4" />
                Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "calendar" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
              >
                <CalendarRange className="h-4 w-4" />
                Kalendarz
              </button>
            </div>

            <Button onClick={openCreate} variant="default">
              <PlusCircle className="h-4 w-4" />
              Dodaj wydarzenie
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <span className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Ładowanie...
          </div>
        ) : viewMode === "calendar" ? (
          <CalendarView
            events={events}
            onEdit={openEdit}
            onDelete={(event) => setDeleteTarget(event)}
          />
        ) : events.length === 0 ? (
          <div className="py-20 text-center text-white/40">
            <CalendarDays className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="text-lg">Brak wydarzeń</p>
            <p className="mt-1 text-sm">Kliknij "Dodaj wydarzenie", aby zacząć.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#1a1a1a] text-xs uppercase tracking-wide text-white/50">
                  <th className="px-4 py-3 text-left font-medium">Tytuł</th>
                  <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Data</th>
                  <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Lokalizacja</th>
                  <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Godzina</th>
                  <th className="px-4 py-3 text-right font-medium">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr
                    key={event.id}
                    className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${index % 2 === 0 ? "" : "bg-white/[0.01]"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-[#F13738]/20 bg-[#F13738]/10">
                          <CalendarDays className="h-3.5 w-3.5 text-[#F13738]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-tight text-white">{event.title}</p>
                          {event.facebookUrl ? (
                            <a
                              href={event.facebookUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 flex items-center gap-1 text-xs text-white/30 hover:text-[#FEE600]"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Facebook
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-white/60 md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-white/30" />
                        {formatDate(event.date)}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-white/60 lg:table-cell">
                      {event.location ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-white/30" />
                          <span className="max-w-[180px] truncate">{event.location}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-white/60 lg:table-cell">
                      {event.time ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-white/30" />
                          {event.time}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(event)}
                          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-[#FEE600]/10 hover:text-[#FEE600]"
                          title="Edytuj"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(event)}
                          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-[#F13738]/10 hover:text-[#F13738]"
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

      <EventModal open={modalOpen} event={editTarget} onSave={handleSave} onClose={closeModal} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Usuń wydarzenie"
        description={`Czy na pewno chcesz usunąć "${deleteTarget?.title}"? Tej operacji nie można cofnąć.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}