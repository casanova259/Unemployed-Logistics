"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HubData } from "@/types";
import {
  Package,
  MapPin,
  User,
  Mail,
  Phone,
  Weight,
  Layers,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ShipmentCreateFormProps {
  redirectBaseUrl: string;
  isStaff?: boolean;
}

export default function ShipmentCreateForm({
  redirectBaseUrl,
  isStaff = false,
}: ShipmentCreateFormProps) {
  const router = useRouter();

  const [hubs, setHubs] = useState<HubData[]>([]);
  const [loadingHubs, setLoadingHubs] = useState(true);

  // Form State
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderAddress, setSenderAddress] = useState("");

  const [receiverName, setReceiverName] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");

  // Origin Hub / Coords
  const [originType, setOriginType] = useState<"hub" | "custom">("hub");
  const [originHubId, setOriginHubId] = useState("");
  const [originLat, setOriginLat] = useState("30.7333");
  const [originLng, setOriginLng] = useState("76.7794");

  // Destination Hub / Coords
  const [destType, setDestType] = useState<"hub" | "custom">("hub");
  const [destHubId, setDestHubId] = useState("");
  const [destLat, setDestLat] = useState("28.6139");
  const [destLng, setDestLng] = useState("77.2090");

  const [weightKg, setWeightKg] = useState("2.5");
  const [type, setType] = useState("Standard Parcel");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHubs() {
      try {
        const res = await fetch("/api/hubs");
        const json = await res.json();
        if (res.ok && json.hubs?.length) {
          setHubs(json.hubs);
          setOriginHubId(json.hubs[0].id);
          setOriginLat(json.hubs[0].lat.toString());
          setOriginLng(json.hubs[0].lng.toString());

          const second = json.hubs[1] || json.hubs[0];
          setDestHubId(second.id);
          setDestLat(second.lat.toString());
          setDestLng(second.lng.toString());
        }
      } catch (err) {
        console.warn("Failed to load hubs:", err);
      } finally {
        setLoadingHubs(false);
      }
    }
    loadHubs();
  }, []);

  const handleOriginHubChange = (id: string) => {
    setOriginHubId(id);
    const selected = hubs.find((h) => h.id === id);
    if (selected) {
      setOriginLat(selected.lat.toString());
      setOriginLng(selected.lng.toString());
      if (!senderAddress) {
        setSenderAddress(`${selected.name}, ${selected.city}`);
      }
    }
  };

  const handleDestHubChange = (id: string) => {
    setDestHubId(id);
    const selected = hubs.find((h) => h.id === id);
    if (selected) {
      setDestLat(selected.lat.toString());
      setDestLng(selected.lng.toString());
      if (!receiverAddress) {
        setReceiverAddress(`${selected.name}, ${selected.city}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        senderAddress: senderAddress.trim(),
        receiverName: receiverName.trim(),
        receiverEmail: receiverEmail.trim(),
        receiverPhone: receiverPhone.trim(),
        receiverAddress: receiverAddress.trim(),
        originLat: parseFloat(originLat),
        originLng: parseFloat(originLng),
        destLat: parseFloat(destLat),
        destLng: parseFloat(destLng),
        originHubId: originType === "hub" ? originHubId || null : null,
        destHubId: destType === "hub" ? destHubId || null : null,
        weightKg: parseFloat(weightKg),
        type: type.trim(),
      };

      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to create shipment");
        setSubmitting(false);
      } else {
        router.push(`${redirectBaseUrl}/${json.shipment.id}`);
      }
    } catch (err) {
      setError("An unexpected error occurred while creating shipment");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Sender & Receiver Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sender Card */}
        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-3">
            <User className="h-4 w-4 text-blue-400" />
            Sender Information (Pickup Origin)
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Sender Name</label>
            <input
              type="text"
              required
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Sender Email (Receives Pickup OTP)
            </label>
            <input
              type="email"
              required
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="sender@example.com"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Sender Address</label>
            <input
              type="text"
              required
              value={senderAddress}
              onChange={(e) => setSenderAddress(e.target.value)}
              placeholder="e.g. Sector 17 Market, Chandigarh"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Origin Coordinates / Hub */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Origin Location Mode:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOriginType("hub")}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                    originType === "hub"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Regional Hub
                </button>
                <button
                  type="button"
                  onClick={() => setOriginType("custom")}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                    originType === "custom"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Custom Lat/Lng
                </button>
              </div>
            </div>

            {originType === "hub" ? (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Select Origin Hub</label>
                <select
                  value={originHubId}
                  onChange={(e) => handleOriginHubChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  {hubs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Origin Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={originLat}
                    onChange={(e) => setOriginLat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Origin Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={originLng}
                    onChange={(e) => setOriginLng(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Receiver Card */}
        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-3">
            <MapPin className="h-4 w-4 text-emerald-400" />
            Receiver Information (Delivery Destination)
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Receiver Name</label>
            <input
              type="text"
              required
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Receiver Email (Receives Delivery OTP)
            </label>
            <input
              type="email"
              required
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              placeholder="receiver@example.com"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Receiver Phone</label>
            <input
              type="tel"
              required
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              placeholder="+91-9876543210"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Receiver Address</label>
            <input
              type="text"
              required
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="e.g. Connaught Place, New Delhi"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Destination Coordinates / Hub */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Destination Location Mode:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDestType("hub")}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                    destType === "hub"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Regional Hub
                </button>
                <button
                  type="button"
                  onClick={() => setDestType("custom")}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                    destType === "custom"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Custom Lat/Lng
                </button>
              </div>
            </div>

            {destType === "hub" ? (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Select Destination Hub</label>
                <select
                  value={destHubId}
                  onChange={(e) => handleDestHubChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  {hubs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Dest Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={destLat}
                    onChange={(e) => setDestLat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Dest Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={destLng}
                    onChange={(e) => setDestLng(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Package Specs Card */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white border-b border-slate-800 pb-3">
          <Package className="h-4 w-4 text-purple-400" />
          Consignment Details
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Shipment Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="Standard Parcel">Standard Parcel</option>
              <option value="Express Delivery">Express Delivery</option>
              <option value="Fragile Consignment">Fragile Consignment</option>
              <option value="Perishable Goods">Perishable Goods</option>
              <option value="Document / Letter">Document / Letter</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Weight (in kg)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 2.5"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Registering Shipment...
            </>
          ) : (
            <>
              Confirm & Create Shipment
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
