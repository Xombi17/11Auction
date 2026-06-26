import "./globals.css";
import React from "react";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "Bidstand — Realtime Player Auction",
  description: "Elite realtime IPL-style player auction room",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} min-h-screen bg-[#09090b] text-white flex flex-col antialiased selection:bg-white selection:text-black`}>
        {children}
      </body>
    </html>
  );
}
