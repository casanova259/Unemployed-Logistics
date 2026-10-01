"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Shield,
  Truck,
  ArrowRight,
  Compass,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      router.push(`/track/${trackingId.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Enterprise Logistics & Real-time Delivery Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Next-Generation <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Shipment Operations & Tracking
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Centralized delivery orchestration with OTP-verified pickup & delivery handoffs,
          role-isolated dispatcher control, and privacy-first public tracking.
        </p>

        {/* Quick Track Input Bar */}
        <form
          onSubmit={handleTrackSubmit}
          className="max-w-xl mx-auto mt-6 flex flex-col sm:flex-row items-center gap-2.5 p-2 rounded-2xl glass-card border border-slate-700/60 shadow-2xl shadow-blue-500/10"
        >
          <div className="relative flex-1 w-full">
            <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter Tracking ID (e.g. SHP-10010001)"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
          >
            Track
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span>Try quick demo IDs:</span>
          {["SHP-10010001", "SHP-10010003", "SHP-10010004", "SHP-10010005"].map((id) => (
            <button
              key={id}
              onClick={() => router.push(`/track/${id}`)}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 font-mono text-blue-300 transition"
            >
              {id}
            </button>
          ))}
        </div>
      </section>

      {/* Demo Credentials Quick-Card */}
      <section className="max-w-4xl mx-auto p-6 rounded-2xl glass-card border border-blue-500/20 bg-gradient-to-b from-blue-950/20 to-slate-900/40">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Hackathon Demo Logins (Pre-seeded)</h2>
        </div>
        <p className="text-sm text-slate-300 mb-4">
          Click any role below to prefill login credentials on the sign-in page:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/login?email=staff1@logistics.com&role=STAFF"
            className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-white group-hover:text-blue-400 transition">
                Staff (Dispatcher)
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                staff123
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">staff1@logistics.com</p>
          </Link>

          <Link
            href="/login?email=driver1@logistics.com&role=DRIVER"
            className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-white group-hover:text-blue-400 transition">
                Driver
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                driver123
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">driver1@logistics.com</p>
          </Link>

          <Link
            href="/login?email=customer1@logistics.com&role=CUSTOMER"
            className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-white group-hover:text-blue-400 transition">
                Customer
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                customer123
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">customer1@logistics.com</p>
          </Link>

          <Link
            href="/login?email=admin@logistics.com&role=ADMIN"
            className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-white group-hover:text-blue-400 transition">
                Admin
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                admin123
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">admin@logistics.com</p>
          </Link>
        </div>
      </section>

      {/* Core Architectural Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white text-base">OTP-Gated Lifecycle</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Strict state machine guarantees shipments cannot be marked Picked-Up or Delivered
            without genuine 6-digit OTP verification from sender and receiver.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white text-base">Realtime Transport & Hooks</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Stateless Express + Socket.IO microservice coordinates identities and emits shipment
            changes with zero-fail tolerance to main database operations.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white text-base">Privacy-Safe Tracking</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Public viewers can observe shipment progress, city destination, and milestone events
            while personal PII (email, phone, address) is completely shielded.
          </p>
        </div>
      </section>
    </div>
  );
}
