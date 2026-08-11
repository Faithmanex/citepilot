import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://citepilot.com"),
  title: "CitePilot — Academic Citation & Reference List Audit",
  description:
    "Check your citations before you submit. CitePilot audits your in-text citations and reference list against Crossref metadata — so you can submit your research with complete confidence.",
  icons: { icon: "/brand/icon-mark.svg", apple: "/brand/icon-app.svg" },
  openGraph: {
    title: "CitePilot — Academic Citation & Reference List Audit",
    description:
      "Check your citations before you submit. Audit manuscript citations and reference entries against Crossref metadata.",
    images: [{ url: "/brand/og-image.svg", width: 1200, height: 630, alt: "CitePilot Social Preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CitePilot — Academic Citation Audit",
    description: "Check your citations before you submit. Audited against Crossref metadata.",
    images: ["/brand/twitter-card.svg"],
  },
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
      <body className="bg-paper text-ink" suppressHydrationWarning>
        <noscript>
          <div style={{ padding: "20px", textAlign: "center", background: "#FAF6EC", color: "#221D16" }}>
            CitePilot requires JavaScript to perform automated academic citation audits. Please enable JavaScript in your browser to continue.
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
