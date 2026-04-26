"use client";

import ContentBlocksAdminPage from "@/app/components/content/ContentBlocksAdminPage";

export default function OfferPage() {
  return (
    <ContentBlocksAdminPage
      pageKey="offer"
      resource="OFFER_PAGE"
      title="Oferta"
      description="Zarzadzaj blokami strony oferty."
      emptyTitle="Brak blokow oferty"
      emptyDescription="Dodaj pierwszy blok, aby zbudowac modularna strone oferty."
      defaultCategoryKey="hero"
    />
  );
}
