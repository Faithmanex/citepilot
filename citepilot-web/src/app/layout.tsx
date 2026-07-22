import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CitePilot — Accessible Academic Citation & Audit Dashboard",
  description:
    "Verify every citation in your manuscript against Crossref, PubMed, OpenAlex and Retraction Watch. Supports APA, MLA, Chicago, Harvard, IEEE, Vancouver, OSCOLA, Turabian.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Caveat:wght@500;700&family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="bg-paper text-ink" suppressHydrationWarning>{children}</body>
    </html>
  );
}
