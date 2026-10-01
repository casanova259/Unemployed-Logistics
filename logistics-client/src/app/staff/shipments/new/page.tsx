"use client";

import React from "react";
import ShipmentCreateForm from "@/components/ShipmentCreateForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function StaffNewShipmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/staff/dashboard"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Consignment (Staff)</h1>
          <p className="text-xs text-slate-400">
            Dispatch a new order across regional hubs with auto-generated tracking
          </p>
        </div>
      </div>

      <ShipmentCreateForm redirectBaseUrl="/staff/shipments" isStaff={true} />
    </div>
  );
}
