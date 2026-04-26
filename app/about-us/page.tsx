"use client";

import ContentBlocksAdminPage from "@/app/components/content/ContentBlocksAdminPage";

export default function AboutUsAdminPage() {
  return (
    <ContentBlocksAdminPage
      pageKey="about-us"
      resource="ABOUT_US_PAGE"
      title="O nas"
      description="Zarzadzaj blokami strony O nas."
      emptyTitle="Brak blokow podstrony O nas"
      emptyDescription="Dodaj pierwszy blok, aby wypelnic podstrone O nas."
      defaultCategoryKey="hero"
    />
  );
}
