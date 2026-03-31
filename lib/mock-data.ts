import type { Event, Partner } from "./types";

export const initialEvents: Event[] = [
    {
        id: "1",
        title: "Planszówki Johnny'ego",
        date: "2026-07-28",
        time: "18:00",
        description:
            "Zapraszamy na comiesięczne spotkanie planszówkowe Johnny'ego. Zagramy w gry dla każdego - od familijnych po strategiczne. Wejście wolne!",
        location: "Kawiarnia META, ul. Lipowa 1, Białystok",
        facebookUrl: "",
        createdAt: "2026-01-01T00:00:00Z",
    },
    {
        id: "2",
        title: "Zmiana Kawałka",
        date: "2026-07-28",
        time: "19:00",
        description:
            "Zapraszamy do klubu Zmiana Klimatu w Białymstoku.",
        location: "Zmiana Klimatu, ul. Warszawska 6",
        facebookUrl: "https://facebook.com",
        createdAt: "2026-01-01T00:00:00Z",
    },
    {
        id: "3",
        title: "Planszówki Johnny'ego",
        date: "2026-09-02",
        time: "18:00",
        description:
            "Kolejna edycja Planszówek Johnny'ego - tym razem z nowymi tytułami!",
        location: "Kawiarnia META, ul. Lipowa 1, Białystok",
        facebookUrl: "https://facebook.com",
        createdAt: "2026-01-01T00:00:00Z",
    },
];

export const initialPartners: Partner[] = [
    { id: "1", name: "Kawiarnia META", websiteUrl: "https://example.com", description: "Nasze ulubione miejsce spotkań planszówkowych." },
    { id: "2", name: "Zmiana Klimatu", websiteUrl: "https://example.com", description: "Kultowy białostocki klub muzyczny." },
    { id: "3", name: "Biblioteka Miejska", websiteUrl: "https://example.com", description: "Miejskie centrum kultury i nauki." },
    { id: "4", name: "Kino Forum", websiteUrl: "https://example.com", description: "Kino z bogatym repertuarem i salą na eventy." },
];
