"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Search, ArrowRight, Package } from "lucide-react";

export default function TrackSearchPage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      router.push(`/track/${trackingId.trim().toUpperCase()}`);
    }
  };

  const sampleIds = [
    { id: "SHP-10010001", status: "CREATED", city: "Delhi" },
    { id: "SHP-10010002", status: "PICKED_UP", city: "Chandigarh" },
    { id: "SHP-10010003", status: "IN_TRANSIT", city: "Ludhiana" },
    { id: "SHP-10010004", status: "OUT_FOR_DELIVERY", city: "Chandigarh" },
    { id: "SHP-10010005", status: "DELIVERED", city: "Amritsar" },
    { id: "SHP-10010006", status: "FAILED", city: "Delhi" },
    { id: "SHP-10010007", status: "RESCHEDULED", city: "Ludhiana" },
    { id: "SHP-10010008", status: "RETURNED", city: "Chandigarh" },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Compass className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Public Shipment Tracking</h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Look up live delivery progress, status milestones, and destination city with zero login required.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-2.5 p-2 rounded-2xl glass-card border border-slate-700/80 shadow-2xl"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            required
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter tracking ID (e.g. SHP-10010004)"
            className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 uppercase font-mono transition"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
        >
          Track Now
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* Quick Search Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Demo Shipments Across Stages
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {sampleIds.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(`/track/${item.id}`)}
              className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-mono font-bold text-white group-hover:text-blue-400 transition block">
                  {item.id}
                </span>
                <span className="text-[10px] text-slate-500">To {item.city}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                {item.status}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
