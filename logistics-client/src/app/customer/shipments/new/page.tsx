"use client";

import React from "react";
import ShipmentCreateForm from "@/components/ShipmentCreateForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewCustomerShipmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/customer/shipments"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Book New Shipment</h1>
          <p className="text-xs text-slate-400">
            Specify origin, destination, and package details to generate a tracking ID
          </p>
        </div>
      </div>

      <ShipmentCreateForm redirectBaseUrl="/customer/shipments" />
    </div>
  );
}
