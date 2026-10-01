"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { ShipmentData } from "@/types";
import { Package, PlusCircle, ArrowRight, RefreshCw, MapPin } from "lucide-react";

export default function CustomerShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadShipments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/shipments");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load shipments");
      } else {
        setShipments(json.shipments || []);
      }
    } catch (err) {
      setError("Network error while loading your shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Shipments</h1>
          <p className="text-xs text-slate-400">
            Track and manage your outgoing and incoming consignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadShipments}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/customer/shipments/new"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-lg shadow-blue-600/25"
          >
            <PlusCircle className="h-4 w-4" />
            Book Shipment
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-400" />
          <p className="text-xs">Loading your shipments...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-sm">
          {error}
        </div>
      ) : shipments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-card border border-slate-800 space-y-4">
          <Package className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="font-semibold text-white">No Shipments Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You have not booked any shipments yet. Get started by creating your first order.
          </p>
          <Link
            href="/customer/shipments/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
          >
            <PlusCircle className="h-4 w-4" />
            Book Your First Shipment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shipments.map((s) => (
            <Link
              key={s.id}
              href={`/customer/shipments/${s.id}`}
              className="p-5 rounded-2xl glass-card border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-mono font-bold text-white group-hover:text-blue-400 transition">
                    {s.trackingId}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.type} • {s.weightKg} kg</div>
                </div>
                <StatusBadge status={s.status} size="sm" />
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-mono w-14 shrink-0">From:</span>
                  <span className="truncate">{s.senderAddress}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-mono w-14 shrink-0">To:</span>
                  <span className="truncate">{s.receiverAddress}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
                <span className="text-blue-400 group-hover:translate-x-1 transition flex items-center gap-1 font-medium">
                  View Details <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
