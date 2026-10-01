"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { ShipmentData } from "@/types";
import { Truck, ArrowRight, RefreshCw, MapPin, Package, AlertCircle } from "lucide-react";

export default function DriverAssignmentsPage() {
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/shipments");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load driver assignments");
      } else {
        setShipments(json.shipments || []);
      }
    } catch (err) {
      setError("Network error loading driver assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Driver Assigned Deliveries</h1>
          <p className="text-xs text-slate-400">
            Active shipments assigned to your vehicle for pickup and delivery handoff
          </p>
        </div>
        <button
          onClick={loadAssignments}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-400" />
          <p className="text-xs">Loading assigned orders...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      ) : shipments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-card border border-slate-800 space-y-3">
          <Truck className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="font-semibold text-white">No Assigned Deliveries</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You currently have no shipments assigned. Check back once dispatch assigns your route.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shipments.map((s) => (
            <Link
              key={s.id}
              href={`/driver/shipments/${s.id}`}
              className="p-5 rounded-2xl glass-card border border-slate-800 hover:border-amber-500/50 transition flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-mono font-bold text-white group-hover:text-amber-400 transition">
                    {s.trackingId}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {s.type} • {s.weightKg} kg
                  </div>
                </div>
                <StatusBadge status={s.status} size="sm" />
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono w-14 shrink-0">Pickup:</span>
                  <div>
                    <span className="font-semibold text-white">{s.senderName}</span>
                    <span className="text-slate-400 block truncate">{s.senderAddress}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono w-14 shrink-0">Dropoff:</span>
                  <div>
                    <span className="font-semibold text-white">{s.receiverName}</span>
                    <span className="text-slate-400 block truncate">{s.receiverAddress}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px]">
                  Vehicle: {s.vehicle?.plate || "None"}
                </span>
                <span className="text-amber-400 group-hover:translate-x-1 transition flex items-center gap-1 font-medium">
                  Perform Delivery Action <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
