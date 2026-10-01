"use client";

import React, { useEffect, useState } from "react";
import { VehicleData } from "@/types";
import { VehicleType } from "@prisma/client";
import { Truck, Plus, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [plate, setPlate] = useState("");
  const [type, setType] = useState<VehicleType>(VehicleType.VAN);
  const [creating, setCreating] = useState(false);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vehicles");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load vehicles");
      } else {
        setVehicles(json.vehicles || []);
      }
    } catch (err) {
      setError("Network error loading vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate: plate.trim().toUpperCase(),
          type,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to register vehicle");
      } else {
        setSuccess(`Vehicle "${plate.toUpperCase()}" registered successfully`);
        setPlate("");
        loadVehicles();
      }
    } catch (err) {
      setError("Network error registering vehicle");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Fleet & Vehicle Management</h1>
          <p className="text-xs text-slate-400">
            Configure delivery vehicles across Bike, Van, Truck, and EV categories
          </p>
        </div>
        <button
          onClick={loadVehicles}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Create Form */}
        <form
          onSubmit={handleCreateVehicle}
          className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-3">
            <Plus className="h-4 w-4 text-blue-400" />
            Add Vehicle to Fleet
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">License Plate</label>
            <input
              type="text"
              required
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="e.g. PB-65-AB-7777"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs uppercase font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Vehicle Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as VehicleType)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value={VehicleType.BIKE}>BIKE (Two-Wheeler Quick Courier)</option>
              <option value={VehicleType.VAN}>VAN (Medium Cargo Van)</option>
              <option value={VehicleType.TRUCK}>TRUCK (Heavy Duty Interstate)</option>
              <option value={VehicleType.EV}>EV (Zero Emission Electric Vehicle)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Register Vehicle
          </button>
        </form>

        {/* Right: Existing Vehicles */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-400" />
              Active Fleet ({vehicles.length})
            </h2>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading fleet...</div>
            ) : vehicles.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No vehicles registered yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono font-bold text-white text-sm">{v.plate}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        {v.type}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      {v.driver ? (
                        <span>
                          Driver: <strong className="text-slate-200">{v.driver.name}</strong>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">No assigned primary driver</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
