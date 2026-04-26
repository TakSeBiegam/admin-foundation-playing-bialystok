"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { useAdminAccess } from "@/app/components/AdminAccessProvider";
import Sidebar from "@/app/components/Sidebar";
import Skeleton from "@/app/components/ui/skeleton";
import { getRoleLabel } from "@/lib/admin-resources";
import { gql } from "@/lib/graphql";
import type { AdminUser, Event, Partner, Role } from "@/lib/types";

const DASHBOARD_EVENTS_QUERY = `
  query DashboardEvents {
    events {
      id
      title
      date
      location
      time
    }
  }
`;

const DASHBOARD_PARTNERS_QUERY = `
  query DashboardPartners {
    partners {
      id
      name
    }
  }
`;

const DASHBOARD_USERS_QUERY = `
  query DashboardUsers {
    users {
      id
      email
      username
      role
    }
  }
`;

type AnalyticsSummary = {
  configured: boolean;
  source: "ga4";
  propertyId?: string;
  totals?: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    averageSessionDurationSeconds: number;
    bounceRate: number;
  };
  topPages?: Array<{
    path: string;
    views: number;
  }>;
  error?: string;
};

const numberFormatter = new Intl.NumberFormat("pl-PL");

function formatMetric(value: number) {
  return numberFormatter.format(Math.round(value));
}

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${Math.round(seconds)} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return remainder > 0 ? `${minutes} min ${remainder} s` : `${minutes} min`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatPagePath(path: string) {
  const normalized = path.trim();
  return normalized === "" || normalized === "/" ? "Strona glowna" : normalized;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { canAccess, loading: accessLoading } = useAdminAccess();
  const currentRole = (session?.user?.role as Role) ?? "EDITOR";
  const displayName = session?.user?.name ?? session?.user?.email ?? "Admin";

  const [events, setEvents] = useState<Event[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const canReadDashboard = canAccess("DASHBOARD", "read");
  const canReadEvents = canAccess("EVENTS", "read");
  const canReadPartners = canAccess("PARTNERS", "read");
  const canReadUsers = canAccess("USERS", "read");

  useEffect(() => {
    if (accessLoading) {
      return;
    }

    if (!canReadDashboard) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadDashboardData() {
      setLoading(true);

      try {
        const [eventsData, partnersData, usersData, analyticsData] =
          await Promise.all([
            canReadEvents
              ? gql<{ events: Event[] }>(DASHBOARD_EVENTS_QUERY)
              : Promise.resolve({ events: [] }),
            canReadPartners
              ? gql<{ partners: Partner[] }>(DASHBOARD_PARTNERS_QUERY)
              : Promise.resolve({ partners: [] }),
            canReadUsers
              ? gql<{ users: AdminUser[] }>(DASHBOARD_USERS_QUERY)
              : Promise.resolve({ users: [] }),
            fetch("/api/analytics", { cache: "no-store" })
              .then(async (response) => {
                const payload = (await response.json()) as AnalyticsSummary & {
                  error?: string;
                };

                if (!response.ok) {
                  throw new Error(
                    payload.error || "Nie udalo sie pobrac statystyk.",
                  );
                }

                return payload;
              })
              .catch((error) => ({
                configured: true,
                source: "ga4" as const,
                error:
                  error instanceof Error
                    ? error.message
                    : "Nie udalo sie pobrac statystyk.",
              })),
          ]);

        if (!active) {
          return;
        }

        setEvents(eventsData.events ?? []);
        setPartners(partnersData.partners ?? []);
        setUsers(usersData.users ?? []);
        setAnalytics(analyticsData);
      } catch {
        if (!active) {
          return;
        }

        setEvents([]);
        setPartners([]);
        setUsers([]);
        setAnalytics({
          configured: true,
          source: "ga4",
          error: "Nie udalo sie zaladowac danych dashboardu.",
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      active = false;
    };
  }, [
    accessLoading,
    canReadDashboard,
    canReadEvents,
    canReadPartners,
    canReadUsers,
  ]);

  const today = new Date();
  const upcomingEvents = [...events]
    .filter((event) => new Date(event.date) >= today)
    .sort(
      (left, right) =>
        new Date(left.date).getTime() - new Date(right.date).getTime(),
    )
    .slice(0, 5);

  const stats = [
    canReadEvents
      ? {
          label: "Wydarzenia",
          value: events.length,
          href: "/events",
        }
      : null,
    canReadPartners
      ? {
          label: "Partnerzy",
          value: partners.length,
          href: "/partners",
        }
      : null,
    canReadUsers
      ? {
          label: "Uzytkownicy",
          value: users.length,
          href: "/users",
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    value: number;
    href: string;
  }>;

  const analyticsCards = analytics?.totals
    ? [
        {
          label: "Odslony",
          value: formatMetric(analytics.totals.pageViews),
        },
        {
          label: "Sesje",
          value: formatMetric(analytics.totals.sessions),
        },
        {
          label: "Aktywni uzytkownicy",
          value: formatMetric(analytics.totals.activeUsers),
        },
        {
          label: "Sredni czas sesji",
          value: formatDuration(analytics.totals.averageSessionDurationSeconds),
        },
      ]
    : [];

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        {accessLoading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="rounded-2xl bg-[#0f0f0f] px-8 py-10 text-center text-white/60">
              Ladowanie dashboardu...
            </div>
          </div>
        ) : !canReadDashboard ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-lg rounded-2xl bg-[#0f0f0f] p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/60">
                <Lock className="h-5 w-5" />
              </div>
              <h1 className="mt-4 text-2xl font-semibold text-white">
                Brak dostepu do dashboardu
              </h1>
              <p className="mt-2 text-sm text-white/55">
                Ta rola nie ma prawa odczytu dla widoku startowego panelu.
              </p>
            </div>
          </div>
        ) : (
          <>
            <header className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
                Panel startowy
              </p>
              <div className="mt-1 flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold text-white">
                    Dashboard
                  </h1>
                  <p className="mt-1 text-sm text-white/55">
                    Witaj,{" "}
                    <span className="text-white font-medium">
                      {displayName}
                    </span>{" "}
                    · {getRoleLabel(currentRole)}
                  </p>
                </div>
                <div className="text-sm text-white/55">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/3 px-3 py-1 text-xs">
                    {currentRole}
                  </span>
                </div>
              </div>
            </header>

            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.length > 0 ? (
                stats.map((stat) => (
                  <OverviewTile
                    key={stat.href}
                    label={stat.label}
                    value={loading ? "-" : String(stat.value)}
                    href={stat.href}
                  />
                ))
              ) : (
                <div className="text-sm text-white/55">
                  Brak danych podsumowania.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              <section className="rounded-2xl bg-[#0f0f0f] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Statystyki strony
                    </h2>
                    <p className="text-sm text-white/50">Ostatnie 7 dni</p>
                  </div>
                  {analytics?.configured && analytics.propertyId ? (
                    <div className="text-xs text-white/55">
                      GA4 {analytics.propertyId}
                    </div>
                  ) : null}
                </div>

                {analytics?.configured && analytics.totals ? (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {analyticsCards.map((card) => (
                          <MetricBox
                            key={card.label}
                            label={card.label}
                            value={card.value}
                            highlight={card.label === "Aktywni uzytkownicy"}
                          />
                        ))}
                      </div>

                      <div className="mt-4">
                        <TopPagesList
                          topPages={analytics.topPages ?? []}
                          bounceRate={analytics.totals.bounceRate}
                        />
                      </div>
                    </div>

                    <div className="hidden md:block">
                      <div className="rounded-xl bg-white/3 p-4">
                        <p className="text-xs text-white/55">Sesje</p>
                        <p className="mt-1 text-2xl font-semibold text-white">
                          {formatMetric(analytics.totals.sessions)}
                        </p>

                        <div className="mt-4">
                          <p className="text-xs text-white/55">
                            Sredni czas sesji
                          </p>
                          <p className="mt-1 text-sm text-white">
                            {formatDuration(
                              analytics.totals.averageSessionDurationSeconds,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : analytics && !analytics.configured ? (
                  <div className="mt-4 rounded-xl bg-white/3 p-4 text-sm text-white/70">
                    Analityka nie jest jeszcze skonfigurowana. Po podlaczeniu
                    GA4 tutaj pojawi sie szybki podglad ruchu.
                  </div>
                ) : analytics?.configured && analytics.error ? (
                  <div className="mt-4 rounded-md bg-brand-red/10 p-4 text-sm text-white/85">
                    {analytics.error}
                  </div>
                ) : loading ? (
                  <div className="mt-4 space-y-3">
                    <Skeleton className="h-6 w-40" />
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                ) : null}
              </section>

              <aside className="space-y-4">
                <UpcomingEventsPanel
                  events={upcomingEvents}
                  canReadEvents={canReadEvents}
                  loading={loading}
                />

                <div className="rounded-2xl bg-[#0f0f0f] p-4">
                  <h3 className="text-sm font-semibold text-white">
                    Szybkie akcje
                  </h3>
                  <div className="mt-3 flex flex-col gap-2">
                    {canReadEvents ? (
                      <Link
                        href="/events"
                        className="text-sm text-white/75 hover:underline"
                      >
                        Wydarzenia
                      </Link>
                    ) : null}
                    {canReadPartners ? (
                      <Link
                        href="/partners"
                        className="text-sm text-white/75 hover:underline"
                      >
                        Partnerzy
                      </Link>
                    ) : null}
                    {canReadUsers ? (
                      <Link
                        href="/users"
                        className="text-sm text-white/75 hover:underline"
                      >
                        Uzytkownicy
                      </Link>
                    ) : null}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function OverviewTile({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <Link
      href={href ?? "#"}
      className="block rounded-lg bg-white/3 p-4 hover:bg-white/5"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-white/50">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </Link>
  );
}

function MetricBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 ${highlight ? "bg-white/5" : "bg-white/3"}`}
    >
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function TopPagesList({
  topPages,
  bounceRate,
}: {
  topPages: Array<{ path: string; views: number }>;
  bounceRate: number;
}) {
  if ((topPages ?? []).length === 0) {
    return (
      <div className="mt-3 text-sm text-white/55">
        Brak danych o podstronach do wyswietlenia.
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">
          Najczesciej ogladane podstrony
        </h3>
        <div className="text-xs text-white/55">
          Bounce {formatPercent(bounceRate)}
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {topPages.map((p) => (
          <div
            key={p.path}
            className="flex items-center justify-between rounded-md bg-white/4 p-2"
          >
            <div className="truncate text-sm text-white/80">
              {formatPagePath(p.path)}
            </div>
            <div className="ml-4 text-sm font-medium text-white">
              {formatMetric(p.views)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingEventsPanel({
  events,
  canReadEvents,
  loading,
}: {
  events: Event[];
  canReadEvents: boolean;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl bg-[#0f0f0f] p-4">
      <h3 className="text-sm font-semibold text-white">
        Nadchodzace wydarzenia
      </h3>
      {!canReadEvents ? (
        <div className="mt-3 text-sm text-white/55">
          Ta rola nie ma odczytu do wydarzen.
        </div>
      ) : loading ? (
        <div className="mt-3 text-sm text-white/55">Ladowanie...</div>
      ) : events.length === 0 ? (
        <div className="mt-3 text-sm text-white/55">
          Brak nadchodzacych wydarzen.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {events.map((e) => (
            <div key={e.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="truncate text-sm text-white">{e.title}</div>
                <div className="mt-0.5 text-xs text-white/55">{e.location}</div>
              </div>
              <div className="ml-3 text-xs text-white/55 text-right">
                <div>
                  {new Date(e.date).toLocaleDateString("pl-PL", {
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
                {e.time ? <div className="mt-1">{e.time}</div> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
