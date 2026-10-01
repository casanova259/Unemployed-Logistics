"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import { PublicTrackingResponse } from "@/lib/services/trackingService";
import {
  Compass,
  ArrowLeft,
  MapPin,
  Package,
  Weight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Clock,
} from "lucide-react";

export default function TrackDetailPage({
  params,
}: {
  params: Promise<{ trackingId: string }>;
}) {
  const { trackingId } = use(params);
  const [data, setData] = useState<PublicTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchTracking = async () => {
    try {
      const res = await fetch(`/api/track/${trackingId}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to find tracking records for this ID");
        setData(null);
      } else {
        setData(json.tracking);
        setError("");
      }
    } catch (err) {
      setError("Failed to load tracking data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [trackingId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTracking();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-3">
        <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading tracking history...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Tracking ID Not Found</h2>
        <p className="text-sm text-slate-400">{error || `No records for "${trackingId}"`}</p>
        <div className="pt-2">
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Try Another ID
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/track"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </Link>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xs font-medium text-slate-300 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Status
        </button>
      </div>

      {/* Main Status Header Card */}
      <div className="p-6 rounded-2xl glass-card border border-slate-700/80 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 font-mono">
              <Package className="h-3.5 w-3.5 text-blue-400" />
              Tracking Number
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {data.trackingId}
            </h1>
          </div>
          <StatusBadge status={data.status} size="lg" />
        </div>

        {/* Safe details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block mb-1">Destination</span>
            <div className="flex items-center gap-1.5 font-semibold text-white text-sm">
              <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              {data.receiverCity}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block mb-1">Package Type</span>
            <div className="flex items-center gap-1.5 font-semibold text-white text-sm">
              <Package className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              {data.type}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block mb-1">Weight</span>
            <div className="flex items-center gap-1.5 font-semibold text-white text-sm">
              <Weight className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              {data.weightKg} kg
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block mb-1">Coords (Dest)</span>
            <div className="font-mono text-slate-300 text-xs truncate">
              {data.destLat.toFixed(3)}, {data.destLng.toFixed(3)}
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-blue-400" />
          <span>
            <strong>Safe Public Tracking:</strong> Customer personal details, phone numbers, and
            street addresses are securely shielded.
          </span>
        </div>
      </div>

      {/* Lifecycle Timeline */}
      <div className="p-6 rounded-2xl glass-card border border-slate-700/80 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          <h2 className="text-base font-bold text-white">Delivery Lifecycle & Milestones</h2>
        </div>
        <Timeline events={data.timeline} />
      </div>
    </div>
  );
}
