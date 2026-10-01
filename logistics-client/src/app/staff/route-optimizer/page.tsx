"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Waypoint, OptimizedRouteResult } from "@/lib/services/routeOptimizer";
import {
  ArrowLeft,
  Route,
  Sparkles,
  Zap,
  TrendingDown,
  Clock,
  MapPin,
  Truck,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Navigation,
  ShieldCheck,
} from "lucide-react";

const RouteOptimizerMap = dynamic(
  () => import("@/components/RouteOptimizerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[440px] w-full bg-slate-900/60 flex items-center justify-center text-xs text-slate-400 animate-pulse rounded-2xl border border-slate-800">
        Loading route optimization map...
      </div>
    ),
  }
);

const DEFAULT_HUBS: Waypoint[] = [
  { id: "hub-chd", name: "Chandigarh Gateway Hub", city: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { id: "hub-ldh", name: "Ludhiana Industrial Freight Center", city: "Ludhiana", lat: 30.901, lng: 75.8573 },
  { id: "hub-asr", name: "Amritsar Border Cargo Center", city: "Amritsar", lat: 31.634, lng: 74.8723 },
  { id: "hub-del", name: "Delhi Central Logistics Park", city: "New Delhi", lat: 28.6139, lng: 77.209 },
  { id: "hub-pan", name: "Panipat Textile Feeder", city: "Panipat", lat: 29.3909, lng: 76.9635 },
  { id: "hub-jlr", name: "Jalandhar Sports Logistics Post", city: "Jalandhar", lat: 31.326, lng: 75.5762 },
];

export default function RouteOptimizerPage() {
  const [originId, setOriginId] = useState<string>("hub-chd");
  const [destId, setDestId] = useState<string>("hub-del");
  const [selectedStops, setSelectedStops] = useState<string[]>(["hub-jlr", "hub-ldh"]);
  const [vehicle, setVehicle] = useState<string>("Tata 407 (4-Ton Linehaul)");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizedRouteResult | null>(null);
  const [error, setError] = useState("");

  const handleOptimize = async () => {
    try {
      setLoading(true);
      setError("");

      const origin = DEFAULT_HUBS.find((h) => h.id === originId) || DEFAULT_HUBS[0];
      const destination = DEFAULT_HUBS.find((h) => h.id === destId) || DEFAULT_HUBS[3];
      const stops = selectedStops
        .map((sId) => DEFAULT_HUBS.find((h) => h.id === sId))
        .filter((h): h is Waypoint => h != null);

      const res = await fetch("/api/optimize-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, stops, destination }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to optimize route");
      } else {
        setResult(json.result);
      }
    } catch (err) {
      setError("Network error while calculating optimal route");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleOptimize();
  }, []);

  const toggleStop = (id: string) => {
    if (selectedStops.includes(id)) {
      setSelectedStops(selectedStops.filter((s) => s !== id));
    } else {
      setSelectedStops([...selectedStops, id]);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/staff/dashboard"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-400 font-semibold uppercase">
                AI Logistics Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                2-Opt TSP & OSRM
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Dynamic Route Optimizer
            </h1>
          </div>
        </div>

        <button
          onClick={handleOptimize}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 text-amber-300" />
          )}
          Calculate Optimal Sequence
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Main Grid: Left Controls, Right Map & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Route Configuration */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Route className="h-4 w-4 text-blue-400" />
              Consignment Corridor Setup
            </h2>

            {/* Origin Hub */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Origin Dispatch Hub
              </label>
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {DEFAULT_HUBS.map((h) => (
                  <option key={h.id} value={h.id} disabled={h.id === destId}>
                    {h.name} ({h.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Hub */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Destination Target Hub
              </label>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {DEFAULT_HUBS.map((h) => (
                  <option key={h.id} value={h.id} disabled={h.id === originId}>
                    {h.name} ({h.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Intermediate Drops Checklist */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-400">
                  Intermediate Stops & Cross-Docks
                </label>
                <span className="text-[10px] text-slate-500">Auto-Sequenced</span>
              </div>

              <div className="space-y-1.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
                {DEFAULT_HUBS.filter((h) => h.id !== originId && h.id !== destId).map((hub) => {
                  const isChecked = selectedStops.includes(hub.id);
                  return (
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => toggleStop(hub.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                        isChecked
                          ? "bg-blue-600/20 border border-blue-500/40 text-blue-300"
                          : "hover:bg-slate-800 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className={`h-3.5 w-3.5 ${isChecked ? "text-blue-400" : "text-slate-500"}`} />
                        <span className="font-medium text-left">{hub.city}</span>
                      </div>
                      <span className="text-[10px] font-mono">
                        {isChecked ? "Included" : "+ Add"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Assigned Fleet Vehicle
              </label>
              <select
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="Tata 407 (4-Ton Linehaul)">PB-65-AX-1024 • Tata 407 (4-Ton Linehaul)</option>
                <option value="Mahindra Bolero Maxi">DL-01-TC-8890 • Mahindra Bolero Maxi (Express)</option>
                <option value="Eicher Pro 2049">CH-01-BK-4421 • Eicher Pro 2049 (Heavy Freight)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map & Efficiency Metrics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Efficiency Banner */}
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/30">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono block">Optimized Distance</span>
                <span className="text-xl font-bold font-mono text-white">
                  {result.totalDistanceKm} <span className="text-xs text-slate-400">km</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono block">Travel Time</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {result.formattedDuration}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono block">Distance Saved</span>
                <span className="text-xl font-bold font-mono text-blue-400 flex items-center gap-1">
                  <TrendingDown className="h-4 w-4" />
                  {result.distanceSavedKm} km
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono block">Efficiency Gain</span>
                <span className="text-xl font-bold font-mono text-purple-400">
                  +{result.efficiencySavingsPercent}%
                </span>
              </div>
            </div>
          )}

          {/* Map */}
          <div className="h-[440px] w-full">
            <RouteOptimizerMap
              waypoints={result?.orderedWaypoints || []}
              routeGeometry={result?.routeGeometryCoordinates || []}
            />
          </div>

          {/* Sequential Waypoint Itinerary */}
          {result && (
            <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">
                    Optimized Waypoint Sequence & Leg Breakdown
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {result.orderedWaypoints.length} nodes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {result.orderedWaypoints.map((wp, idx) => (
                  <div
                    key={wp.id}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1 relative"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-400">
                        {idx === 0
                          ? "Stop 1: Origin"
                          : idx === result.orderedWaypoints.length - 1
                          ? `Stop ${idx + 1}: Final Destination`
                          : `Stop ${idx + 1}: Cross-Dock`}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {wp.lat.toFixed(2)}, {wp.lng.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white truncate">{wp.name}</div>
                    <div className="text-[11px] text-slate-400">{wp.city}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
