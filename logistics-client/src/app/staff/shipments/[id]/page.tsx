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
  Package,
  MapPin,
  Clock,
  Shield,
  Truck,
  User,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function StaffShipmentManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Assign form state
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Status update state
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // OTP state
  const [otpStage, setOtpStage] = useState<"pickup" | "delivery">("pickup");
  const [otpCode, setOtpCode] = useState("");
  const [sentOtpDevNotice, setSentOtpDevNotice] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  const loadShipmentData = async () => {
    try {
      setLoading(true);
      const [shipRes, drvRes, vehRes] = await Promise.all([
        fetch(`/api/shipments/${id}`),
        fetch("/api/drivers"),
        fetch("/api/vehicles"),
      ]);

      const [shipJson, drvJson, vehJson] = await Promise.all([
        shipRes.json(),
        drvRes.json(),
        vehRes.json(),
      ]);

      if (!shipRes.ok) {
        setError(shipJson.error || "Failed to load shipment");
      } else {
        setShipment(shipJson.shipment);
        setSelectedDriverId(shipJson.shipment.assignedDriverId || "");
        setSelectedVehicleId(shipJson.shipment.vehicleId || "");
      }

      if (drvRes.ok) setDrivers(drvJson.drivers || []);
      if (vehRes.ok) setVehicles(vehJson.vehicles || []);
    } catch (err) {
      setError("Network error loading shipment management console");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipmentData();
  }, [id]);

  // Handle Driver / Vehicle assignment
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) return;
    setError("");
    setSuccessMsg("");
    setAssigning(true);

    try {
      const res = await fetch(`/api/shipments/${id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: selectedDriverId,
          vehicleId: selectedVehicleId || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to assign driver/vehicle");
      } else {
        setSuccessMsg("Driver and vehicle assigned successfully!");
        loadShipmentData();
      }
    } catch (err) {
      setError("Network error during assignment");
    } finally {
      setAssigning(false);
    }
  };

  // Handle generic status transition
  const handleStatusTransition = async (nextStatus: ShipmentStatus) => {
    setError("");
    setSuccessMsg("");
    setUpdatingStatus(true);

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
        loadShipmentData();
      }
    } catch (err) {
      setError("Network error updating status");
    } finally {
      setUpdatingStatus(false);
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
          setOtpCode(json.otp); // Pre-fill in dev mode for instant testing!
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
        loadShipmentData();
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
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-400" />
        <p className="text-sm">Loading operations control room...</p>
      </div>
    );
  }

  if (error && !shipment) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Error Loading Shipment</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link
          href="/staff/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!shipment) return null;

  const allowedNextStatuses = getNextAllowedStatuses(shipment.status);
  const isPickupGated = shipment.status === "CREATED";
  const isDeliveryGated = shipment.status === "OUT_FOR_DELIVERY";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/staff/dashboard"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="text-xs text-slate-400 font-mono">Consignment Operations</div>
            <h1 className="text-2xl font-bold text-white font-mono tracking-tight">
              {shipment.trackingId}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadShipmentData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh State"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href={`/track/${shipment.trackingId}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-blue-400 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Public View
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Control, Right Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Controls & Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-400">Current Lifecycle State</span>
                <div className="mt-1">
                  <StatusBadge status={shipment.status} size="lg" />
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="text-slate-400 block">Created On</span>
                <span className="font-mono text-slate-200">
                  {new Date(shipment.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Route Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-mono uppercase text-[10px]">Pickup Origin</span>
                <div className="font-bold text-white text-sm">{shipment.senderName}</div>
                <div className="text-slate-300">{shipment.senderAddress}</div>
                <div className="text-slate-400 font-mono">{shipment.senderEmail}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-mono uppercase text-[10px]">Destination</span>
                <div className="font-bold text-white text-sm">{shipment.receiverName}</div>
                <div className="text-slate-300">{shipment.receiverAddress}</div>
                <div className="text-slate-400 font-mono">
                  {shipment.receiverPhone} • {shipment.receiverEmail}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400">
              <span>Type: <strong className="text-slate-200">{shipment.type}</strong></span>
              <span>Weight: <strong className="text-slate-200">{shipment.weightKg} kg</strong></span>
              <span>Coords: <span className="font-mono text-slate-300">{shipment.destLat.toFixed(3)}, {shipment.destLng.toFixed(3)}</span></span>
            </div>
          </div>

          {/* Smart ETA & Delay Risk Telemetry Card */}
          {shipment.eta && (
            <div className="p-6 rounded-2xl glass-card border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-slate-900/50 to-slate-900/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Smart AI Telemetry & Delay Risk Prediction
                  </h2>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    shipment.eta.delayRiskLevel === "HIGH"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : shipment.eta.delayRiskLevel === "MEDIUM"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  }`}
                >
                  {shipment.eta.delayRiskLevel} RISK ({shipment.eta.delayRiskScore}% Risk)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Estimated Arrival</span>
                  <span className="font-bold text-white text-sm">
                    {new Date(shipment.eta.predictedDeliveryDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {new Date(shipment.eta.predictedDeliveryDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Remaining Time</span>
                  <span className="font-bold text-indigo-300 text-sm">
                    {Math.floor(shipment.eta.estimatedDurationMinutes / 60)}h {shipment.eta.estimatedDurationMinutes % 60}m
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{shipment.eta.estimatedDurationMinutes} total mins</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Remaining Dist</span>
                  <span className="font-bold text-white text-sm">{shipment.eta.distanceKm} km</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Road-calibrated</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">AI Confidence</span>
                  <span className="font-bold text-emerald-400 text-sm">{shipment.eta.confidencePercent}%</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Telemetry model</span>
                </div>
              </div>

              {shipment.eta.delayRiskFactors && shipment.eta.delayRiskFactors.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-medium block mb-1.5">Delay Analysis Factors:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {shipment.eta.delayRiskFactors.map((factor: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                      >
                        • {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lifecycle Action Center (Buttons strictly restricted to valid next statuses) */}
          <div className="p-6 rounded-2xl glass-card border border-blue-500/30 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">State Machine Action Center</h2>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Rule-Enforced
              </span>
            </div>

            {/* OTP Gated Transition Panel: CREATED -> PICKED_UP */}
            {isPickupGated && (
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <KeyRound className="h-4 w-4" />
                  Pickup OTP Verification Required (CREATED → PICKED_UP)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Per system rules, moving to <strong>PICKED_UP</strong> requires verifying the 6-digit
                  OTP sent to the sender (<strong>{shipment.senderEmail}</strong>).
                </p>

                {sentOtpDevNotice && (
                  <div className="p-3 rounded-lg bg-indigo-900/50 border border-indigo-400/50 text-indigo-200 text-xs">
                    Demo OTP Code: <strong className="font-mono text-base tracking-widest text-white">{sentOtpDevNotice}</strong>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendOtp("pickup")}
                    disabled={otpLoading}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sentOtpDevNotice ? "Resend Pickup OTP" : "Send Pickup OTP"}
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

            {/* OTP Gated Transition Panel: OUT_FOR_DELIVERY -> DELIVERED */}
            {isDeliveryGated && (
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                  <KeyRound className="h-4 w-4" />
                  Delivery OTP Verification Required (OUT_FOR_DELIVERY → DELIVERED)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Per system rules, moving to <strong>DELIVERED</strong> requires verifying the 6-digit
                  OTP sent to the receiver (<strong>{shipment.receiverEmail}</strong>).
                </p>

                {sentOtpDevNotice && (
                  <div className="p-3 rounded-lg bg-purple-900/50 border border-purple-400/50 text-purple-200 text-xs">
                    Demo OTP Code: <strong className="font-mono text-base tracking-widest text-white">{sentOtpDevNotice}</strong>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendOtp("delivery")}
                    disabled={otpLoading}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sentOtpDevNotice ? "Resend Delivery OTP" : "Send Delivery OTP"}
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
                      Verify & Deliver
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Non-OTP Status Transition Buttons */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Optional Status Note / Reason:
              </label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Arrived at central sorting hub, delayed due to weather, etc."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 mb-3"
              />

              <div className="space-y-2">
                <span className="text-xs text-slate-400 block font-medium">
                  Valid Next Statuses According to State Machine:
                </span>

                {allowedNextStatuses.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900/60 text-slate-400 text-xs text-center border border-slate-800">
                    Shipment has reached terminal status ({shipment.status}). No further transitions allowed.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {allowedNextStatuses.map((st) => {
                      // Check if this status requires OTP instead
                      const requiresOtp =
                        (shipment.status === "CREATED" && st === "PICKED_UP") ||
                        (shipment.status === "OUT_FOR_DELIVERY" && st === "DELIVERED");

                      if (requiresOtp) {
                        return (
                          <div
                            key={st}
                            className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-400 flex items-center gap-1.5"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                            {st} (Requires OTP Verification Above)
                          </div>
                        );
                      }

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleStatusTransition(st)}
                          disabled={updatingStatus}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50"
                        >
                          {updatingStatus ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Transition to {st}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Driver & Vehicle Assignment Card */}
          <form onSubmit={handleAssign} className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-3">
              <Truck className="h-4 w-4 text-amber-400" />
              Dispatch Assignment (Driver & Vehicle)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Assign Driver</label>
                <select
                  required
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.isOnline ? "🟢 Online" : "⚪ Offline"} ({d.phone || "No phone"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Assign Vehicle (Optional)</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- No Vehicle Assigned --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} ({v.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={assigning || !selectedDriverId}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-600/20 disabled:opacity-50"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>Save Assignment</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Append-Only Timeline */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <h2 className="text-base font-bold text-white">Event Audit Log</h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Immutable append-only ledger of every status change and assignment
            </p>
            <Timeline events={shipment.events || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
