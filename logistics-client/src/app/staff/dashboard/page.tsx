"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { ShipmentData } from "@/types";
import { ShipmentStatus } from "@prisma/client";
import {
  Package,
  Search,
  PlusCircle,
  RefreshCw,
  Filter,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
} from "lucide-react";

export default function StaffDashboardPage() {
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      params.set("limit", "50");

      const res = await fetch(`/api/shipments?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load dashboard data");
      } else {
        setShipments(json.shipments || []);
        setTotal(json.total || 0);
      }
    } catch (err) {
      setError("Network error while loading data");
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute status counts for the metric cards
  const statusCounts: Record<string, number> = {
    ALL: total,
    CREATED: 0,
    PICKED_UP: 0,
    IN_TRANSIT: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    FAILED: 0,
    RESCHEDULED: 0,
    RETURNED: 0,
  };

  shipments.forEach((s) => {
    if (statusCounts[s.status] != null) {
      statusCounts[s.status]++;
    }
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operations Dispatcher Hub</h1>
          <p className="text-xs text-slate-400">
            Monitor real-time shipments, assign fleets, and manage lifecycle handoffs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/staff/shipments/new"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-lg shadow-blue-600/25"
          >
            <PlusCircle className="h-4 w-4" />
            Create Shipment
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {[
          { key: "ALL", label: "Total Orders", count: total, color: "text-white" },
          { key: "CREATED", label: "Created", count: statusCounts.CREATED, color: "text-sky-400" },
          { key: "PICKED_UP", label: "Picked Up", count: statusCounts.PICKED_UP, color: "text-indigo-400" },
          { key: "IN_TRANSIT", label: "In Transit", count: statusCounts.IN_TRANSIT, color: "text-amber-400" },
          { key: "OUT_FOR_DELIVERY", label: "Out For Deliv", count: statusCounts.OUT_FOR_DELIVERY, color: "text-purple-400" },
          { key: "DELIVERED", label: "Delivered", count: statusCounts.DELIVERED, color: "text-emerald-400" },
          { key: "FAILED", label: "Failed", count: statusCounts.FAILED, color: "text-rose-400" },
          { key: "RESCHEDULED", label: "Rescheduled", count: statusCounts.RESCHEDULED, color: "text-orange-400" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setSelectedStatus(item.key)}
            className={`p-3 rounded-xl border text-left transition ${
              selectedStatus === item.key
                ? "bg-slate-800 border-blue-500/80 shadow-md shadow-blue-500/10"
                : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <span className="text-[10px] text-slate-400 font-medium block truncate">
              {item.label}
            </span>
            <span className={`text-xl font-bold font-mono ${item.color}`}>
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl glass-card border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Tracking ID, Sender, Receiver, Address..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition w-full sm:w-auto"
          >
            <option value="ALL">All Statuses</option>
            {Object.values(ShipmentStatus).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="rounded-2xl glass-card border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-400" />
            <p className="text-xs">Loading operational shipments...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-400 text-xs">{error}</div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Package className="h-8 w-8 mx-auto text-slate-500" />
            <p className="text-xs">No shipments matching current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Tracking ID</th>
                  <th className="px-4 py-3">Route (From → To)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Driver</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {shipments.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-white group-hover:text-blue-400 transition">
                      <Link href={`/staff/shipments/${s.id}`}>{s.trackingId}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <div className="truncate max-w-[200px]" title={`${s.senderAddress} -> ${s.receiverAddress}`}>
                        <span className="text-slate-400 font-mono">From:</span> {s.senderName} <br />
                        <span className="text-slate-400 font-mono">To:</span> {s.receiverName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {s.assignedDriver ? (
                        <div>
                          <div className="font-medium text-white">{s.assignedDriver.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {s.assignedDriver.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-medium text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {s.vehicle ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-[10px] text-slate-300">
                          {s.vehicle.plate}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/staff/shipments/${s.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-xs font-medium transition"
                      >
                        Manage
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
