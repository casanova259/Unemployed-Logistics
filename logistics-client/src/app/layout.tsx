import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "@/provider/AppProviders";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "LogiFlow | Logistics & Shipment Management",
  description: "Enterprise-grade real-time shipment tracking, operations dispatcher, and lifecycle management platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark antialiased`}>
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <AppProviders>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© 2026 LogiFlow Platform • BidWars 2026 (Problem 441604)</p>
              <p className="font-mono text-slate-600">PostgreSQL • Redis • Express Realtime • Auth.js v5</p>
            </div>
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
