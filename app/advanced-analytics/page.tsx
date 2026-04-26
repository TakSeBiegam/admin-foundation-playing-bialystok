"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Globe,
  Smartphone,
  TrendingUp,
  Users,
  Lock,
} from "lucide-react";
import { MultiSeriesAreaChart } from "@/app/components/ui/analytics-charts";

import { useAdminAccess } from "@/app/components/AdminAccessProvider";
import Sidebar from "@/app/components/Sidebar";
import Skeleton from "@/app/components/ui/skeleton";
import type { AdvancedAnalytics } from "@/lib/analytics";

function isoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const numberFormatter = new Intl.NumberFormat("pl-PL");

function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value));
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return remainder > 0 ? `${minutes} min ${remainder} s` : `${minutes} min`;
}

function formatReportDate(value: string): string {
  if (!/^\d{8}$/.test(value)) {
    return value;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));
  const date = new Date(year, month, day);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "short",
  });
}

export default function AdvancedAnalyticsPage() {
  const { canAccess, loading: accessLoading } = useAdminAccess();

  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const defaultEnd = isoDate(today);
  const defaultStart = isoDate(
    new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
  );
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [topPagesLimit, setTopPagesLimit] = useState<number>(6);

  const canReadAdvancedAnalytics = canAccess("ADVANCED_ANALYTICS", "read");

  useEffect(() => {
    if (accessLoading) {
      return;
    }

    if (!canReadAdvancedAnalytics) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadAnalytics() {
      setLoading(true);

      try {
        const qs = new URLSearchParams({
          startDate,
          endDate,
          topPagesLimit: String(topPagesLimit),
        });

        const response = await fetch(
          `/api/analytics/advanced?${qs.toString()}`,
          {
            cache: "no-store",
          },
        );

        const data = (await response.json()) as AdvancedAnalytics;

        if (!response.ok) {
          throw new Error(data.error || "Nie udalo sie pobrac danych GA4.");
        }

        if (active) {
          setAnalytics(data);
        }
      } catch (error) {
        if (active) {
          setAnalytics({
            configured: true,
            source: "ga4",
            error:
              error instanceof Error
                ? error.message
                : "Nie udalo sie zaladowac zaawansowanych statystyk.",
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      active = false;
    };
  }, [accessLoading, canReadAdvancedAnalytics]);

  function applyFilters() {
    void (async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          startDate,
          endDate,
          topPagesLimit: String(topPagesLimit),
        });
        const response = await fetch(
          `/api/analytics/advanced?${qs.toString()}`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as AdvancedAnalytics;
        if (!response.ok) throw new Error(data.error || "Błąd pobierania");
        setAnalytics(data);
      } catch (e) {
        setAnalytics({
          configured: true,
          source: "ga4",
          error: e instanceof Error ? e.message : String(e),
        });
      } finally {
        setLoading(false);
      }
    })();
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        {accessLoading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="rounded-4xl border border-white/10 bg-[#121212] px-8 py-10 text-center text-white/65">
              Ladowanie statystyk...
            </div>
          </div>
        ) : !canReadAdvancedAnalytics ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-lg rounded-4xl border border-white/10 bg-[#121212] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-white">
                Brak dostepu
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Ta rola nie ma prawa odczytu dla zaawansowanych statystyk GA4.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
                Zaawansowane
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                Statystyki GA4
              </h1>
              <p className="mt-2 text-sm text-white/55">
                Rozszerzone metryki z Google Analytics 4.
                {analytics?.lastUpdated ? (
                  <>
                    {" "}
                    · Zaktualizowane:{" "}
                    {new Date(analytics.lastUpdated).toLocaleString("pl-PL")}
                  </>
                ) : null}
                {/* Top Pages */}
                {(() => {
                  const topPages = analytics?.topPages ?? [];
                  if (topPages.length === 0) return null;
                  const max = Math.max(...topPages.map((p) => p.views), 1);
                  return (
                    <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            Top stron
                          </h3>
                          <p className="mt-1 text-sm text-white/50">
                            Najczęściej odwiedzane podstrony
                          </p>
                        </div>
                        <BarChart3 className="h-5 w-5 text-white/35" />
                      </div>

                      <div className="mt-4 space-y-2">
                        {topPages.map((page) => (
                          <div
                            key={page.path}
                            className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/3 px-4 py-3"
                          >
                            <p className="truncate text-sm text-white max-w-[60%]">
                              {page.path}
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="w-40">
                                <div className="h-1.5 rounded-full bg-white/10">
                                  <div
                                    className="h-full rounded-full bg-brand-yellow"
                                    style={{
                                      width: `${Math.round((page.views / max) * 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <span className="shrink-0 text-sm font-medium text-white">
                                {formatNumber(page.views)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </p>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/50">Od</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-md bg-[#0b0b0b] px-3 py-1 text-sm text-white/80"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-white/50">Do</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-md bg-[#0b0b0b] px-3 py-1 text-sm text-white/80"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-white/50">Top stron</label>
                <select
                  value={topPagesLimit}
                  onChange={(e) => setTopPagesLimit(Number(e.target.value))}
                  className="rounded-md bg-[#0b0b0b] px-3 py-1 text-sm text-white/80"
                >
                  <option value={3}>3</option>
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div>
                <button
                  onClick={applyFilters}
                  className="rounded-full bg-brand-yellow px-4 py-1 text-sm font-medium text-black"
                >
                  Zastosuj
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
                <Skeleton className="h-64 w-full" />
              </div>
            ) : !analytics?.configured ? (
              <div className="rounded-3xl border border-white/10 bg-[#121212] px-5 py-6 text-sm text-white/75">
                Analityka GA4 nie jest jeszcze skonfigurowana. Ustaw
                GOOGLE_ANALYTICS_PROPERTY_ID, GOOGLE_ANALYTICS_CLIENT_EMAIL i
                GOOGLE_ANALYTICS_PRIVATE_KEY, a potem zrestartuj panel.
              </div>
            ) : analytics?.error ? (
              <div className="rounded-3xl border border-brand-red/20 bg-brand-red/10 px-5 py-6 text-sm text-white/82">
                {analytics.error}
              </div>
            ) : analytics.metrics ? (
              <div className="space-y-8">
                {/* Main Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                        Aktywni Użytkownicy
                      </p>
                      <Users className="h-4 w-4 text-white/35" />
                    </div>
                    <p className="mt-4 text-3xl font-semibold text-white">
                      {formatNumber(analytics.metrics.activeUsers)}
                    </p>
                    {analytics.metrics.newUsers > 0 && (
                      <p className="mt-2 text-xs text-white/45">
                        {formatNumber(analytics.metrics.newUsers)} nowych
                      </p>
                    )}
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                        Sesje
                      </p>
                      <TrendingUp className="h-4 w-4 text-white/35" />
                    </div>
                    <p className="mt-4 text-3xl font-semibold text-white">
                      {formatNumber(analytics.metrics.sessions)}
                    </p>
                    <p className="mt-2 text-xs text-white/45">
                      {formatNumber(analytics.metrics.engagedSessions)}{" "}
                      zaangażowanych
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                        Odsłony stron
                      </p>
                      <BarChart3 className="h-4 w-4 text-white/35" />
                    </div>
                    <p className="mt-4 text-3xl font-semibold text-white">
                      {formatNumber(analytics.metrics.screenPageViews)}
                    </p>
                    <p className="mt-2 text-xs text-white/45">
                      Średnia:{" "}
                      {(
                        analytics.metrics.screenPageViews /
                        Math.max(analytics.metrics.sessions, 1)
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                        Średni czas sesji
                      </p>
                      <TrendingUp className="h-4 w-4 text-white/35" />
                    </div>
                    <p className="mt-4 text-3xl font-semibold text-white">
                      {formatDuration(analytics.metrics.averageSessionDuration)}
                    </p>
                    <p className="mt-2 text-xs text-white/45">
                      Engagement:{" "}
                      {formatPercent(analytics.metrics.engagementRate)}
                    </p>
                  </div>
                </div>

                {/* Time series chart for gaining users + sessions */}
                {analytics.usersByDay && analytics.usersByDay.length > 0 ? (
                  <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Ruch w czasie
                        </h3>
                        <p className="mt-1 text-sm text-white/50">
                          Aktywni użytkownicy i sesje — zakres wybrany powyżej
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <MultiSeriesAreaChart
                        labels={analytics.usersByDay
                          .slice()
                          .reverse()
                          .map((d) => formatReportDate(d.date))}
                        series={[
                          {
                            name: "Aktywni użytkownicy",
                            color: "#FFD166",
                            data: analytics.usersByDay
                              .slice()
                              .reverse()
                              .map((d) => d.activeUsers),
                          },
                          {
                            name: "Sesje",
                            color: "#4CC9F0",
                            data: analytics.usersByDay
                              .slice()
                              .reverse()
                              .map((d) => d.sessions),
                          },
                        ]}
                        height={200}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Wskaźnik odbijania
                        </h3>
                        <p className="mt-1 text-sm text-white/50">
                          Odsetek sesji bez interakcji
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-end gap-4">
                      <p className="text-4xl font-semibold text-white">
                        {formatPercent(analytics.metrics.bounceRate)}
                      </p>
                      <div className="mb-2 text-xs text-white/45">
                        {analytics.metrics.bounceRate > 50
                          ? "Wymagana optymalizacja"
                          : "W normie"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Użytkownicy powracający
                        </h3>
                        <p className="mt-1 text-sm text-white/50">
                          Udział wśród aktywnych użytkowników
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-end gap-4">
                      <p className="text-4xl font-semibold text-white">
                        {formatPercent(analytics.metrics.returningUsersRate)}
                      </p>
                      <div className="mb-2 text-xs text-white/45">
                        {formatNumber(analytics.metrics.returningUsers)} z{" "}
                        {formatNumber(analytics.metrics.activeUsers)} aktywnych
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Devices */}
                {analytics.topDevices && analytics.topDevices.length > 0 ? (
                  <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Najczęstsze urządzenia
                        </h3>
                        <p className="mt-1 text-sm text-white/50">
                          Kategoria urządzenia użytkowników
                        </p>
                      </div>
                      <Smartphone className="h-5 w-5 text-white/35" />
                    </div>

                    <div className="mt-4 space-y-2">
                      {analytics.topDevices.map((device) => (
                        <div
                          key={device.device}
                          className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/3 px-4 py-3"
                        >
                          <p className="text-sm font-medium text-white">
                            {device.device}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="w-24">
                              <div className="h-1.5 rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-brand-yellow"
                                  style={{ width: `${device.percentage}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-right text-xs font-medium text-white/65">
                              {formatPercent(device.percentage)} (
                              {formatNumber(device.sessions)})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Top Countries */}
                {analytics.topCountries && analytics.topCountries.length > 0 ? (
                  <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Użytkownicy wg kraju
                        </h3>
                        <p className="mt-1 text-sm text-white/50">
                          Liczba aktywnych użytkowników i sesji
                        </p>
                      </div>
                      <Globe className="h-5 w-5 text-white/35" />
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="px-4 py-2 text-left text-xs uppercase tracking-[0.18em] text-white/35">
                              Kraj
                            </th>
                            <th className="px-4 py-2 text-right text-xs uppercase tracking-[0.18em] text-white/35">
                              Użytkownicy
                            </th>
                            <th className="px-4 py-2 text-right text-xs uppercase tracking-[0.18em] text-white/35">
                              Sesje
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {analytics.topCountries.map((country) => (
                            <tr key={country.country}>
                              <td className="px-4 py-3 text-white">
                                {country.country}
                              </td>
                              <td className="px-4 py-3 text-right text-white">
                                {formatNumber(country.users)}
                              </td>
                              <td className="px-4 py-3 text-right text-white/65">
                                {formatNumber(country.sessions)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {/* Top Referrers */}
                {analytics.topDomains && analytics.topDomains.length > 0 ? (
                  <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Źródła ruchu
                        </h3>
                        <p className="mt-1 text-sm text-white/50">
                          Najczęstsze źródła wysyłające ruch
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {analytics.topDomains.map((domain) => (
                        <div
                          key={domain.domain}
                          className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/3 px-4 py-3"
                        >
                          <p className="truncate text-sm text-white">
                            {domain.domain}
                          </p>
                          <span className="shrink-0 text-sm font-medium text-white">
                            {formatNumber(domain.referrals)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Daily Statistics */}
                {analytics.usersByDay && analytics.usersByDay.length > 0 ? (
                  <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Statystyki dzienne
                        </h3>
                        <p className="mt-1 text-sm text-white/50">
                          Ostatnie 7 dni
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="px-4 py-2 text-left text-xs uppercase tracking-[0.18em] text-white/35">
                              Data
                            </th>
                            <th className="px-4 py-2 text-right text-xs uppercase tracking-[0.18em] text-white/35">
                              Użytkownicy
                            </th>
                            <th className="px-4 py-2 text-right text-xs uppercase tracking-[0.18em] text-white/35">
                              Sesje
                            </th>
                            <th className="px-4 py-2 text-right text-xs uppercase tracking-[0.18em] text-white/35">
                              Odsłony
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {analytics.usersByDay.map((day) => (
                            <tr key={day.date}>
                              <td className="px-4 py-3 text-white">
                                {formatReportDate(day.date)}
                              </td>
                              <td className="px-4 py-3 text-right text-white">
                                {formatNumber(day.activeUsers)}
                              </td>
                              <td className="px-4 py-3 text-right text-white/65">
                                {formatNumber(day.sessions)}
                              </td>
                              <td className="px-4 py-3 text-right text-white/65">
                                {formatNumber(day.pageViews)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-[#121212] px-5 py-6 text-sm text-white/75">
                GA4 nie zwrocilo jeszcze danych dla tego widoku.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
