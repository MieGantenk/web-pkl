import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";

import { Providers } from "./providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Sistem PKL — SMK-IT As-Syifa",
    template: "%s — Sistem PKL",
  },
  description:
    "Sistem Informasi Praktik Kerja Lapangan SMK-IT As-Syifa Boarding School.",
  other: {
    "page-type": "software",
    "site-kind": "software",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      data-type="software"
      className={`${jakarta.variable} ${sora.variable}`}
    >
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
