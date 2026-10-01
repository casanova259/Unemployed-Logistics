import React from "react";
import StatusBadge from "./StatusBadge";
import { ShipmentStatus } from "@prisma/client";

export interface TimelineEventItem {
  id: string;
  status: ShipmentStatus | string;
  note?: string | null;
  lat?: number | null;
  lng?: number | null;
  createdAt: string | Date;
  createdByUser?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

interface TimelineProps {
  events: TimelineEventItem[];
}

export default function Timeline({ events }: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 text-sm">
        No tracking events recorded yet.
      </div>
    );
  }

  // Sort ascending for chronological narrative
  const sorted = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-700/60">
      {sorted.map((ev, idx) => {
        const isLatest = idx === sorted.length - 1;
        const dateObj = new Date(ev.createdAt);
        const formattedDate = dateObj.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const formattedTime = dateObj.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div key={ev.id} className="relative flex items-start gap-4 group">
            {/* Timeline node marker */}
            <div
              className={`absolute -left-[30px] top-1.5 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${
                isLatest
                  ? "bg-blue-600 border-blue-400 shadow-md shadow-blue-500/50"
                  : "bg-slate-800 border-slate-600"
              }`}
            >
              {isLatest && <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
            </div>

            {/* Event content card */}
            <div className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5 hover:border-slate-600/80 transition">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <StatusBadge status={ev.status} size="sm" />
                <span className="text-xs text-slate-400 font-mono">
                  {formattedDate} at {formattedTime}
                </span>
              </div>

              {ev.note && <p className="text-sm text-slate-200 mt-1">{ev.note}</p>}

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                {ev.createdByUser && (
                  <span>
                    By <strong className="text-slate-300">{ev.createdByUser.name}</strong> (
                    {ev.createdByUser.role})
                  </span>
                )}
                {ev.lat != null && ev.lng != null && (
                  <span className="font-mono text-slate-500">
                    Location: {ev.lat.toFixed(4)}, {ev.lng.toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
