"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import { ShipmentData } from "@/types";
import { ShipmentStatus } from "@prisma/client";
import { getNextAllowedStatuses } from "@/lib/stateMachine";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Clock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function DriverShipmentActionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [sentOtpDevNotice, setSentOtpDevNotice] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

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
      setError("Network error loading shipment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipment();
  }, [id]);

  // Handle generic status transition
  const handleTransition = async (nextStatus: ShipmentStatus) => {
    setError("");
    setSuccessMsg("");
    setUpdating(true);

    try {
      const res = await fetch(`/api/shipments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          note: statusNote.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || `Failed to transition status to ${nextStatus}`);
      } else {
        setSuccessMsg(`Status advanced to ${nextStatus}`);
        setStatusNote("");
        loadShipment();
      }
    } catch (err) {
      setError("Network error updating status");
    } finally {
      setUpdating(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async (stage: "pickup" | "delivery") => {
    setError("");
    setSuccessMsg("");
    setSentOtpDevNotice(null);
    setOtpLoading(true);

    try {
      const res = await fetch(`/api/shipments/${id}/otp/${stage}/send`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || `Failed to send ${stage} OTP`);
      } else {
        setSuccessMsg(json.message);
        if (json.otp) {
          setSentOtpDevNotice(json.otp);
          setOtpCode(json.otp); // Pre-fill in dev mode for quick demo
        }
      }
    } catch (err) {
      setError("Network error sending OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (stage: "pickup" | "delivery") => {
    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP code");
      return;
    }
    setError("");
    setSuccessMsg("");
    setOtpLoading(true);

    try {
      const res = await fetch(`/api/shipments/${id}/otp/${stage}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpCode }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || `Failed to verify ${stage} OTP`);
      } else {
        setSuccessMsg(json.message);
        setOtpCode("");
        setSentOtpDevNotice(null);
        loadShipment();
      }
    } catch (err) {
      setError("Network error verifying OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-amber-400" />
        <p className="text-sm">Loading driver action view...</p>
      </div>
    );
  }

  if (error && !shipment) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link
          href="/driver/assignments"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deliveries
        </Link>
      </div>
    );
  }

  if (!shipment) return null;

  const allowedNextStatuses = getNextAllowedStatuses(shipment.status);
  const isPickupGated = shipment.status === "CREATED";
  const isDeliveryGated = shipment.status === "OUT_FOR_DELIVERY";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/driver/assignments"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="text-xs text-slate-400 font-mono">Driver Operational Console</div>
            <h1 className="text-2xl font-bold text-white font-mono">{shipment.trackingId}</h1>
          </div>
        </div>

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
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-amber-400 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Public Tracking
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Order Card */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs text-slate-500 font-mono">Status:</span>
            <div className="mt-1">
              <StatusBadge status={shipment.status} size="lg" />
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-500 block">Vehicle</span>
            <span className="font-mono text-slate-200">
              {shipment.vehicle?.plate || "Unassigned"}
            </span>
          </div>
        </div>

        {/* Origin / Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono uppercase text-[10px]">Pickup From</span>
            <div className="font-bold text-white text-sm">{shipment.senderName}</div>
            <div className="text-slate-300">{shipment.senderAddress}</div>
            <div className="text-slate-400 font-mono">{shipment.senderEmail}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono uppercase text-[10px]">Deliver To</span>
            <div className="font-bold text-white text-sm">{shipment.receiverName}</div>
            <div className="text-slate-300">{shipment.receiverAddress}</div>
            <div className="text-slate-400 font-mono">
              {shipment.receiverPhone} • {shipment.receiverEmail}
            </div>
          </div>
        </div>
      </div>

      {/* Driver Action Panel */}
      <div className="p-6 rounded-2xl glass-card border border-amber-500/30 space-y-5">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Driver Status & OTP Actions</h2>
        </div>

        {/* 1. Pickup Verification (CREATED -> PICKED_UP) */}
        {isPickupGated && (
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <KeyRound className="h-4 w-4" />
              Pickup Verification from Sender
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ask sender (<strong>{shipment.senderName}</strong>) for their 6-digit OTP code to verify
              loading and advance to <strong>PICKED_UP</strong>.
            </p>

            {sentOtpDevNotice && (
              <div className="p-2.5 rounded-lg bg-indigo-900/40 border border-indigo-400/40 text-indigo-200 text-xs">
                Demo OTP Code: <strong className="font-mono text-base text-white ml-2">{sentOtpDevNotice}</strong>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => handleSendOtp("pickup")}
                disabled={otpLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center justify-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {sentOtpDevNotice ? "Resend OTP" : "Send Pickup OTP"}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="6-digit OTP"
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono tracking-widest text-center w-32 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleVerifyOtp("pickup")}
                  disabled={otpLoading || otpCode.length !== 6}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verify & Mark Picked Up
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Delivery Verification (OUT_FOR_DELIVERY -> DELIVERED) */}
        {isDeliveryGated && (
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
              <KeyRound className="h-4 w-4" />
              Delivery Verification from Recipient
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ask recipient (<strong>{shipment.receiverName}</strong>) for their 6-digit OTP code to verify
              handoff and complete delivery.
            </p>

            {sentOtpDevNotice && (
              <div className="p-2.5 rounded-lg bg-purple-900/40 border border-purple-400/40 text-purple-200 text-xs">
                Demo OTP Code: <strong className="font-mono text-base text-white ml-2">{sentOtpDevNotice}</strong>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => handleSendOtp("delivery")}
                disabled={otpLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition flex items-center justify-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {sentOtpDevNotice ? "Resend OTP" : "Send Delivery OTP"}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="6-digit OTP"
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono tracking-widest text-center w-32 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => handleVerifyOtp("delivery")}
                  disabled={otpLoading || otpCode.length !== 6}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verify & Mark Delivered
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Generic Action Buttons */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Driver Delivery Note (Optional):
          </label>
          <input
            type="text"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="e.g. En-route on highway, arrived at gate, receiver unavailable"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 mb-3"
          />

          <div className="space-y-2">
            <span className="text-xs text-slate-400 block font-medium">Available Actions:</span>

            {allowedNextStatuses.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-900 text-slate-400 text-xs text-center border border-slate-800">
                Shipment has reached terminal state ({shipment.status}). No further actions required.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {allowedNextStatuses.map((st) => {
                  const requiresOtp =
                    (shipment.status === "CREATED" && st === "PICKED_UP") ||
                    (shipment.status === "OUT_FOR_DELIVERY" && st === "DELIVERED");

                  if (requiresOtp) {
                    return null; // Handled in OTP panel above
                  }

                  const isFail = st === "FAILED";

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleTransition(st)}
                      disabled={updating}
                      className={`px-4 py-2 rounded-xl text-white font-medium text-xs transition flex items-center gap-1.5 shadow-md ${
                        isFail
                          ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                          : "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20"
                      } disabled:opacity-50`}
                    >
                      {updating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Mark as {st}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Card */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          <h2 className="text-base font-bold text-white">Event Log</h2>
        </div>
        <Timeline events={shipment.events || []} />
      </div>
    </div>
  );
}
