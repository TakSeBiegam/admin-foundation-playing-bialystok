"use client";
import { useState, useEffect } from "react";
import { CalendarDays, Handshake, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Sidebar from "@/app/components/Sidebar";
import { gql } from "@/lib/graphql";
import type { Event, Partner, AdminUser, Role } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

const DASHBOARD_QUERY = `query {
  events { id title date location time }
  partners { id name }
  users { id email username role }
}`;

export default function DashboardPage() {
  const { data: session } = useSession();
  const currentRole = (session?.user?.role as Role) ?? "EDITOR";
  const displayName = session?.user?.name ?? session?.user?.email ?? "Admin";

  const [events, setEvents] = useState<Event[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gql<{ events: Event[]; partners: Partner[]; users: AdminUser[] }>(
      DASHBOARD_QUERY,
    )
      .then((d) => {
        setEvents(d.events ?? []);
        setPartners(d.partners ?? []);
        setUsers(d.users ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const upcomingEvents = [...events]
    .filter((e) => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const stats = [
    {
      label: "Wydarzeń",
      value: events.length,
      icon: CalendarDays,
      href: "/events",
      accent: "#FEE600",
    },
    {
      label: "Partnerów",
      value: partners.length,
      icon: Handshake,
      href: "/partners",
      accent: "#F13738",
    },
    ...(currentRole === "ADMIN"
      ? [
          {
            label: "Użytkowników",
            value: users.length,
            icon: Users,
            href: "/users",
            accent: "#4ade80",
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/50 text-sm mt-1">
            Witaj, <span className="text-white">{displayName}</span> ·{" "}
            <span className="text-white/40">{ROLE_LABELS[currentRole]}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {stats.map((stat) => (
            <Link
              key={stat.href}
              href={stat.href}
              className="group flex items-center gap-5 bg-[#111111] border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all duration-200"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: `${stat.accent}15`,
                  border: `1px solid ${stat.accent}30`,
                }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.accent }} />
              </div>
              <div className="flex-1">
                <p className="text-white/50 text-xs uppercase tracking-wide font-medium">
                  {stat.label}
                </p>
                <p className="text-3xl font-black text-white mt-0.5">
                  {loading ? "-" : stat.value}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Upcoming events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Nadchodzące wydarzenia</h2>
            <Link
              href="/events"
              className="text-[#FEE600] text-sm hover:underline flex items-center gap-1"
            >
              Wszystkie <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center py-8 text-white/30 gap-3">
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Ładowanie...
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-10 text-white/30 bg-[#111111] border border-white/10 rounded-lg">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Brak nadchodzących wydarzeń</p>
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 overflow-hidden">
              {upcomingEvents.map((event, i) => (
                <div
                  key={event.id}
                  className={`flex items-center gap-4 px-5 py-4 bg-[#111111] hover:bg-[#1a1a1a] transition-colors
                                        ${i < upcomingEvents.length - 1 ? "border-b border-white/5" : ""}`}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-[#FEE600]/10 border border-[#FEE600]/20 rounded flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-[#FEE600]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {event.title}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {event.location}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white/60 text-xs">
                      {new Date(event.date).toLocaleDateString("pl-PL", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                    {event.time && (
                      <p className="text-white/30 text-xs mt-0.5">
                        {event.time}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
