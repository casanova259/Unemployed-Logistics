"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import { PublicTrackingResponse } from "@/lib/services/trackingService";
import {
  ArrowLeft,
  MapPin,
  Package,
  Weight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  Navigation,
  Sparkles,
  Timer,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const LiveShipmentMap = dynamic(() => import("@/components/LiveShipmentMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full bg-slate-900/60 flex flex-col items-center justify-center text-xs text-slate-400 animate-pulse rounded-2xl border border-slate-800 space-y-2">
      <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
      <span>Loading interactive route map...</span>
    </div>
  ),
});

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
        setData(json.tracking || json);
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
      <div className="max-w-5xl mx-auto py-16 text-center space-y-3">
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

  // Derive latest known GPS waypoint
  const timelineEvents = data.timeline || data.events || [];
  const latestEventWithCoords = [...timelineEvents]
    .reverse()
    .find((ev) => ev.lat != null && ev.lng != null);

  const currentPos: [number, number] | null =
    latestEventWithCoords?.lat && latestEventWithCoords?.lng
      ? [latestEventWithCoords.lat, latestEventWithCoords.lng]
      : null;

  const eta = data.eta;

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
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

        {/* Smart AI ETA & Delay Risk Prediction Widget */}
        {eta && data.status !== "DELIVERED" && data.status !== "RETURNED" && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-500/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                    Smart Machine Learning Telemetry
                  </span>
                  <div className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Timer className="h-4 w-4 text-emerald-400" />
                    <span>Estimated Arrival: {eta.formattedDeliveryDate}</span>
                  </div>
                </div>
              </div>

              {/* Delay Risk Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Delay Risk:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    eta.delayRiskLevel === "LOW"
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      : eta.delayRiskLevel === "MEDIUM"
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                  }`}
                >
                  {eta.delayRiskLevel === "LOW" ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {eta.delayRiskLevel} ({eta.delayRiskScore}% risk)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                  {eta.confidencePercent}% Confidence
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2 pt-1">
              <p className="text-slate-300">{eta.statusExplanation}</p>
              <div className="flex flex-wrap gap-1.5">
                {eta.delayRiskFactors.map((factor, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700 text-slate-400"
                  >
                    • {factor}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Safe details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block mb-1">Destination</span>
            <div className="flex items-center gap-1.5 font-semibold text-white text-sm">
              <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              {data.receiverCity || data.destination?.city || "In Transit"}
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
            <span className="text-slate-500 block mb-1">Destination Coords</span>
            <div className="font-mono text-slate-300 text-xs truncate">
              {data.destLat?.toFixed(3)}, {data.destLng?.toFixed(3)}
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-blue-400" />
          <span>
            <strong>Safe Public Tracking:</strong> Customer personal details, phone numbers, and
            street addresses are securely shielded in accordance with privacy requirements.
          </span>
        </div>
      </div>

      {/* Interactive Map & Timeline Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaflet Live Map with OSRM Routing */}
        <div className="lg:col-span-7 flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Navigation className="h-3.5 w-3.5 text-blue-400" />
              Live Interactive Route & Telemetry
            </div>
            <span className="text-[11px] text-slate-500">OSRM Road Network</span>
          </div>
          <div className="h-[460px] w-full">
            <LiveShipmentMap
              origin={[data.originLat, data.originLng]}
              destination={[data.destLat, data.destLng]}
              currentPos={currentPos}
            />
          </div>
        </div>

        {/* Append-Only Lifecycle Milestones */}
        <div className="lg:col-span-5 p-6 rounded-2xl glass-card border border-slate-700/80 space-y-4 max-h-[495px] overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="h-4 w-4 text-blue-400" />
            <h2 className="text-base font-bold text-white">Milestone Timeline</h2>
          </div>
          <Timeline events={timelineEvents} />
        </div>
      </div>
    </div>
  );
}
