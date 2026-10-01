"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import { ShipmentData } from "@/types";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  Shield,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Truck,
  User,
} from "lucide-react";

export default function CustomerShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadShipment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/shipments/${id}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load shipment details");
      } else {
        setShipment(json.shipment);
      }
    } catch (err) {
      setError("Network error while loading shipment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipment();
  }, [id]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-400" />
        <p className="text-sm">Loading shipment...</p>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Shipment Not Accessible</h2>
        <p className="text-xs text-slate-400">{error || "You do not have permission to view this order."}</p>
        <Link
          href="/customer/shipments"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Shipments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/customer/shipments"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Shipments
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={loadShipment}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href={`/track/${shipment.trackingId}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-blue-400 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Public Tracking Link
          </Link>
        </div>
      </div>

      {/* Main Shipment Card */}
      <div className="p-6 rounded-2xl glass-card border border-slate-700/80 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="text-xs font-mono text-slate-400 mb-1">Tracking ID</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {shipment.trackingId}
            </h1>
          </div>
          <StatusBadge status={shipment.status} size="lg" />
        </div>

        {/* Gated OTP Information Notice for Customer */}
        {shipment.status === "CREATED" && (
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs text-blue-200 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-blue-300">
              <Shield className="h-4 w-4 text-blue-400" />
              Pickup Verification Required
            </div>
            <p className="text-slate-300 leading-relaxed">
              When the assigned courier driver arrives to collect this package, they will request
              your 6-digit Pickup OTP sent to <strong>{shipment.senderEmail}</strong>.
            </p>
          </div>
        )}

        {/* Addresses & Dispatch Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-500 font-medium block">Pickup From (Sender)</span>
            <div className="font-semibold text-white text-sm">{shipment.senderName}</div>
            <div className="text-xs text-slate-400">{shipment.senderAddress}</div>
            <div className="text-xs text-slate-500">{shipment.senderEmail}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-500 font-medium block">Deliver To (Receiver)</span>
            <div className="font-semibold text-white text-sm">{shipment.receiverName}</div>
            <div className="text-xs text-slate-400">{shipment.receiverAddress}</div>
            <div className="text-xs text-slate-500">{shipment.receiverPhone}</div>
          </div>
        </div>

        {/* Meta stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block">Package Type</span>
            <span className="font-semibold text-slate-200">{shipment.type}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Weight</span>
            <span className="font-semibold text-slate-200">{shipment.weightKg} kg</span>
          </div>
          <div>
            <span className="text-slate-500 block">Assigned Driver</span>
            <span className="font-semibold text-slate-200">
              {shipment.assignedDriver ? shipment.assignedDriver.name : "Pending Assignment"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Vehicle</span>
            <span className="font-semibold text-slate-200">
              {shipment.vehicle ? shipment.vehicle.plate : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="p-6 rounded-2xl glass-card border border-slate-700/80 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          <h2 className="text-base font-bold text-white">Tracking Timeline</h2>
        </div>
        <Timeline events={shipment.events || []} />
      </div>
    </div>
  );
}
