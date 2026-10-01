"use client";

import React, { useEffect, useState } from "react";
import { HubData } from "@/types";
import { MapPin, Plus, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function AdminHubsPage() {
  const [hubs, setHubs] = useState<HubData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [creating, setCreating] = useState(false);

  const loadHubs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hubs");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load hubs");
      } else {
        setHubs(json.hubs || []);
      }
    } catch (err) {
      setError("Network error loading hubs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHubs();
  }, []);

  const handleCreateHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);

    try {
      const res = await fetch("/api/hubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim(),
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to create hub");
      } else {
        setSuccess(`Hub "${name}" registered successfully`);
        setName("");
        setCity("");
        setLat("");
        setLng("");
        loadHubs();
      }
    } catch (err) {
      setError("Network error creating hub");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Regional Hub Management</h1>
          <p className="text-xs text-slate-400">
            Define distribution centers, transit terminals, and geographical routing points
          </p>
        </div>
        <button
          onClick={loadHubs}
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
        {/* Left: Create Hub Form */}
        <form
          onSubmit={handleCreateHub}
          className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-3">
            <Plus className="h-4 w-4 text-blue-400" />
            Register New Hub
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Hub Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jaipur Logistics Gateway"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Jaipur"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="26.9124"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="75.7873"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save Hub
          </button>
        </form>

        {/* Right: Existing Hubs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              Active Distribution Hubs ({hubs.length})
            </h2>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading hubs...</div>
            ) : hubs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No hubs registered yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hubs.map((hub) => (
                  <div
                    key={hub.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-white text-sm">{hub.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                        {hub.city}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      Coordinates: {hub.lat.toFixed(4)}, {hub.lng.toFixed(4)}
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
