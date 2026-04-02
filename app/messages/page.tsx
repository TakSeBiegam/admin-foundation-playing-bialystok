"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  CheckCheck,
  Clock3,
  MailWarning,
  MessageSquarePlus,
  UserRound,
} from "lucide-react";
import Sidebar from "@/app/components/Sidebar";
import ToastContainer, { type ToastData } from "@/app/components/Toast";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { gql } from "@/lib/graphql";
import { cn } from "@/lib/utils";
import type { ContactSubmission, Role } from "@/lib/types";

const CONTACT_SUBMISSIONS_QUERY = `
  query ContactSubmissions($archived: Boolean!) {
    contactSubmissions(archived: $archived) {
      id
      firstName
      lastName
      phone
      message
      isRead
      readAt
      archived
      lastNoteAt
      createdAt
      readBy {
        id
        email
        username
        role
        createdAt
      }
    }
  }
`;

const CONTACT_SUBMISSION_QUERY = `
  query ContactSubmission($id: ID!) {
    contactSubmission(id: $id) {
      id
      firstName
      lastName
      phone
      message
      isRead
      readAt
      archived
      lastNoteAt
      createdAt
      updatedAt
      readBy {
        id
        email
        username
        role
        createdAt
      }
      notes {
        id
        submissionId
        note
        createdAt
        updatedAt
        author {
          id
          email
          username
          role
          createdAt
        }
      }
    }
  }
`;

const MARK_CONTACT_SUBMISSION_READ = `
  mutation MarkContactSubmissionRead($id: ID!, $readerUserId: ID!) {
    markContactSubmissionRead(id: $id, readerUserId: $readerUserId) {
      id
      isRead
      readAt
      readBy {
        id
        email
        username
        role
        createdAt
      }
    }
  }
`;

const MARK_CONTACT_SUBMISSION_UNREAD = `
  mutation MarkContactSubmissionUnread($id: ID!) {
    markContactSubmissionUnread(id: $id) {
      id
      isRead
      readAt
      readBy {
        id
        email
        username
        role
        createdAt
      }
    }
  }
`;

const ADD_CONTACT_SUBMISSION_NOTE = `
  mutation AddContactSubmissionNote($input: AddContactSubmissionNoteInput!) {
    addContactSubmissionNote(input: $input) {
      id
      submissionId
    }
  }
`;

const ARCHIVE_CONTACT_SUBMISSION = `
  mutation ArchiveContactSubmission($id: ID!, $archived: Boolean!) {
    archiveContactSubmission(id: $id, archived: $archived) {
      id
      archived
      lastNoteAt
    }
  }
`;

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function userLabel(user?: ContactSubmission["readBy"]) {
  if (!user) {
    return "-";
  }

  return user.username || user.email || "Nieznany użytkownik";
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const role = (session?.user?.role as Role) ?? "EDITOR";
  const canSeeReader = role === "ADMIN" || role === "OWNER";

  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [archivedView, setArchivedView] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<ContactSubmission | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [postingNote, setPostingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastData["type"] = "success") => {
      setToasts((current) => [
        ...current,
        { id: Date.now() + Math.floor(Math.random() * 1000), message, type },
      ]);
    },
    [],
  );

  const removeToast = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const loadSubmissions = useCallback(async () => {
    try {
      const data = await gql<{ contactSubmissions: ContactSubmission[] }>(
        CONTACT_SUBMISSIONS_QUERY,
        { archived: archivedView },
      );

      const nextSubmissions = data.contactSubmissions ?? [];
      setSubmissions(nextSubmissions);

      if (nextSubmissions.length === 0) {
        setSelectedId(null);
        setSelectedSubmission(null);
        return;
      }

      setSelectedId((current) => {
        if (!current) {
          return nextSubmissions[0].id;
        }

        const exists = nextSubmissions.some(
          (submission) => submission.id === current,
        );
        return exists ? current : nextSubmissions[0].id;
      });
    } catch (error) {
      addToast(
        (error as Error).message || "Błąd ładowania formularzy",
        "error",
      );
    } finally {
      setLoadingList(false);
    }
  }, [addToast, archivedView]);

  // track last-seen note timestamps per submission to detect new notes
  const lastNoteMapRef = useRef<Record<string, string | null>>({});

  // modified loadSubmissionDetails: return fetched data for callers
  const loadSubmissionDetails = useCallback(
    async (id: string): Promise<ContactSubmission | null> => {
      setLoadingDetails(true);
      try {
        const data = await gql<{ contactSubmission: ContactSubmission }>(
          CONTACT_SUBMISSION_QUERY,
          { id },
        );
        const submission = data.contactSubmission ?? null;
        setSelectedSubmission(submission);
        return submission;
      } catch (error) {
        setSelectedSubmission(null);
        addToast(
          (error as Error).message || "Błąd ładowania szczegółów formularza",
          "error",
        );
        return null;
      } finally {
        setLoadingDetails(false);
      }
    },
    [addToast],
  );

  // Poll submissions periodically to detect new notes
  useEffect(() => {
    // initialize map from current submissions
    lastNoteMapRef.current = submissions.reduce(
      (acc, s) => {
        acc[s.id] = (s as any).lastNoteAt ?? null;
        return acc;
      },
      {} as Record<string, string | null>,
    );

    const id = setInterval(async () => {
      try {
        const data = await gql<{ contactSubmissions: ContactSubmission[] }>(
          CONTACT_SUBMISSIONS_QUERY,
          { archived: archivedView },
        );
        const fresh = data.contactSubmissions ?? [];

        for (const s of fresh) {
          const prev = lastNoteMapRef.current[s.id] ?? null;
          const curr = (s as any).lastNoteAt ?? null;
          if (curr && prev && curr !== prev) {
            // new note detected
            addToast(`Nowa notatka: ${s.firstName} ${s.lastName}`);
          }
        }

        lastNoteMapRef.current = fresh.reduce(
          (acc, s) => {
            acc[s.id] = (s as any).lastNoteAt ?? null;
            return acc;
          },
          {} as Record<string, string | null>,
        );

        setSubmissions(fresh);
      } catch (e) {
        // ignore
      }
    }, 7000);

    return () => clearInterval(id);
  }, [addToast, archivedView, submissions]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedSubmission(null);
      return;
    }

    void loadSubmissionDetails(selectedId);
  }, [selectedId, loadSubmissionDetails]);

  const unreadCount = useMemo(
    () => submissions.filter((submission) => !submission.isRead).length,
    [submissions],
  );

  const toggleReadStatus = async () => {
    if (!selectedSubmission) {
      return;
    }

    if (!session?.user?.id) {
      addToast("Brak aktywnej sesji użytkownika", "error");
      return;
    }

    setUpdatingStatus(true);
    try {
      if (selectedSubmission.isRead) {
        await gql(MARK_CONTACT_SUBMISSION_UNREAD, {
          id: selectedSubmission.id,
        });
        addToast("Formularz oznaczono jako nieprzeczytany");
      } else {
        await gql(MARK_CONTACT_SUBMISSION_READ, {
          id: selectedSubmission.id,
          readerUserId: session.user.id,
        });
        addToast("Formularz oznaczono jako przeczytany");
      }

      await loadSubmissions();
      await loadSubmissionDetails(selectedSubmission.id);
    } catch (error) {
      addToast(
        (error as Error).message || "Nie udało się zmienić statusu formularza",
        "error",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const addNote = async () => {
    if (!selectedSubmission) {
      return;
    }

    if (!session?.user?.id) {
      addToast("Brak aktywnej sesji użytkownika", "error");
      return;
    }

    const note = noteDraft.trim();
    if (!note) {
      addToast("Notatka nie może być pusta", "error");
      return;
    }

    setPostingNote(true);
    try {
      await gql(ADD_CONTACT_SUBMISSION_NOTE, {
        input: {
          submissionId: selectedSubmission.id,
          authorUserId: session.user.id,
          note,
        },
      });

      setNoteDraft("");
      addToast("Dodano notatkę");
      const fresh = await loadSubmissionDetails(selectedSubmission.id);
      if (fresh?.lastNoteAt) {
        lastNoteMapRef.current[selectedSubmission.id] = fresh.lastNoteAt;
      }
    } catch (error) {
      addToast(
        (error as Error).message || "Nie udało się dodać notatki",
        "error",
      );
    } finally {
      setPostingNote(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Formularze kontaktowe
            </h1>
            <p className="mt-1 text-sm text-white/50">
              {loadingList
                ? "Ładowanie formularzy..."
                : `${submissions.length} formularzy, ${unreadCount} nieprzeczytanych`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="overflow-hidden rounded-lg border border-white/10">
            <div className="border-b border-white/10 bg-[#1a1a1a] px-4 py-3">
              <h2 className="text-sm font-semibold text-white">
                Lista zgłoszeń
              </h2>
              <div className="mt-2 flex gap-2">
                <Button
                  variant={archivedView ? "ghost" : "default"}
                  onClick={async () => {
                    setArchivedView(false);
                    setLoadingList(true);
                    try {
                      const data = await gql<{
                        contactSubmissions: ContactSubmission[];
                      }>(CONTACT_SUBMISSIONS_QUERY, { archived: false });
                      setSubmissions(data.contactSubmissions ?? []);
                    } finally {
                      setLoadingList(false);
                    }
                  }}
                >
                  Aktualne
                </Button>
                <Button
                  variant={archivedView ? "default" : "ghost"}
                  onClick={async () => {
                    setArchivedView(true);
                    setLoadingList(true);
                    try {
                      const data = await gql<{
                        contactSubmissions: ContactSubmission[];
                      }>(CONTACT_SUBMISSIONS_QUERY, { archived: true });
                      setSubmissions(data.contactSubmissions ?? []);
                    } finally {
                      setLoadingList(false);
                    }
                  }}
                >
                  Archiwum
                </Button>
              </div>
            </div>

            {loadingList ? (
              <div className="flex items-center justify-center py-14 text-white/40">
                <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Ładowanie...
              </div>
            ) : submissions.length === 0 ? (
              <div className="py-14 text-center text-white">
                <MailWarning className="mx-auto mb-3 h-10 w-10 opacity-40" />
                Brak formularzy kontaktowych
              </div>
            ) : (
              <div className="max-h-[72vh] overflow-y-auto">
                {submissions.map((submission) => {
                  const isActive = submission.id === selectedId;
                  return (
                    <button
                      key={submission.id}
                      type="button"
                      onClick={() => setSelectedId(submission.id)}
                      className={cn(
                        "w-full border-b border-white/5 px-4 py-3 text-left transition-colors",
                        isActive ? "bg-white/[0.07]" : "hover:bg-white/3",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">
                          {submission.firstName} {submission.lastName}
                        </p>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                            submission.isRead
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-brand-red/15 text-brand-red",
                          )}
                        >
                          {submission.isRead ? "Przeczytane" : "Nowe"}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-white/50">
                        {formatDateTime(submission.createdAt)}
                      </p>

                      <p className="mt-2 text-sm text-white/70">
                        {submission.message.slice(0, 120)}
                        {submission.message.length > 120 ? "..." : ""}
                      </p>

                      {canSeeReader &&
                      submission.isRead &&
                      submission.readBy ? (
                        <p className="mt-1 text-xs text-white/45">
                          Odczytał: {userLabel(submission.readBy)}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-white/10 bg-[#111111]">
            <div className="border-b border-white/10 bg-[#1a1a1a] px-4 py-3">
              <h2 className="text-sm font-semibold text-white">
                Szczegóły i notatki
              </h2>
            </div>

            {!selectedId ? (
              <div className="py-14 text-center text-white/40">
                Wybierz formularz z listy po lewej stronie
              </div>
            ) : loadingDetails ? (
              <div className="flex items-center justify-center py-14 text-white/40">
                <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Ładowanie szczegółów...
              </div>
            ) : !selectedSubmission ? (
              <div className="py-14 text-center text-white/40">
                Nie udało się załadować szczegółów
              </div>
            ) : (
              <div className="space-y-6 p-4">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {selectedSubmission.firstName}{" "}
                        {selectedSubmission.lastName}
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        Dodano: {formatDateTime(selectedSubmission.createdAt)}
                      </p>
                    </div>

                    <Button
                      variant={
                        selectedSubmission.isRead ? "secondary" : "default"
                      }
                      onClick={toggleReadStatus}
                      disabled={updatingStatus}
                    >
                      <CheckCheck className="h-4 w-4" />
                      {selectedSubmission.isRead
                        ? "Oznacz jako nieprzeczytane"
                        : "Oznacz jako przeczytane"}
                    </Button>
                    <Button
                      variant={
                        selectedSubmission.archived ? "ghost" : "destructive"
                      }
                      onClick={async () => {
                        if (!selectedSubmission) return;
                        try {
                          await gql(ARCHIVE_CONTACT_SUBMISSION, {
                            id: selectedSubmission.id,
                            archived: !selectedSubmission.archived,
                          });
                          addToast(
                            selectedSubmission.archived
                              ? "Przywrócono zgłoszenie"
                              : "Zarchiwizowano zgłoszenie",
                          );
                          await loadSubmissions();
                          await loadSubmissionDetails(selectedSubmission.id);
                        } catch (e) {
                          addToast(
                            (e as Error).message || "Błąd archiwizacji",
                            "error",
                          );
                        }
                      }}
                    >
                      {selectedSubmission.archived ? "Przywróć" : "Archiwizuj"}
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-white/70">
                    {selectedSubmission.phone ? (
                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-white/40" />
                        Telefon: {selectedSubmission.phone}
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-white/40" />
                      Status:{" "}
                      {selectedSubmission.isRead ? "Przeczytane" : "Nowe"}
                    </div>
                    {canSeeReader ? (
                      <div className="flex items-center gap-2">
                        <CheckCheck className="h-4 w-4 text-white/40" />
                        Odczytał: {userLabel(selectedSubmission.readBy)}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-md border border-white/10 bg-black/40 p-4">
                    <p className="whitespace-pre-wrap text-sm text-white/80">
                      {selectedSubmission.message}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <h3 className="mb-3 text-sm font-semibold text-white">
                    Notatki
                  </h3>

                  <div className="mb-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                    {(selectedSubmission.notes ?? []).length === 0 ? (
                      <p className="text-sm text-white/40">Brak notatek</p>
                    ) : (
                      selectedSubmission.notes?.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-md border border-white/10 bg-black/30 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-xs text-white/50">
                              {note.author.username ||
                                note.author.email ||
                                "Użytkownik"}
                            </p>
                            <p className="text-xs text-white/35">
                              {formatDateTime(note.createdAt)}
                            </p>
                          </div>
                          <p className="whitespace-pre-wrap text-sm text-white/80">
                            {note.note}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-3">
                    <Textarea
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="Dodaj notatkę do formularza..."
                      className="min-h-25 bg-[#1a1a1a]"
                    />
                    <Button onClick={addNote} disabled={postingNote}>
                      <MessageSquarePlus className="h-4 w-4" />
                      {postingNote ? "Zapisywanie..." : "Dodaj notatkę"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
