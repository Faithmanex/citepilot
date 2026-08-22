import type { Metadata } from "next";
import { Caveat, Courier_Prime, Inter, JetBrains_Mono, Manrope } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthContext";
import "./globals.css";

const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-type",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-dash",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

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
    <html
      lang="en"
      className={`${courierPrime.variable} ${caveat.variable} ${inter.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <head>
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
