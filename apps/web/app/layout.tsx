import "./globals.css";
import React from "react";
import { Inter, Archivo, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["700", "800", "900"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata = {
  title: "Bidstand — Realtime Player Auction",
  description: "Run live IPL-style player auctions with realtime bidding, squad budgets, and instant results.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-dvh bg-[#0B0F17] text-[#F4F6FA] font-sans antialiased selection:bg-[#F5B83D] selection:text-[#0B0F17]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
