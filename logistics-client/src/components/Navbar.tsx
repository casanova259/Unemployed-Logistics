"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useAppSelector } from "@/redux/hooks";
import { Role } from "@prisma/client";
import { Package, Truck, Compass, PlusCircle, LogOut, LogIn, UserPlus, Shield } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { status } = useSession();
  const user = useAppSelector((state) => state.user.user);
  const isAuthenticated = status === "authenticated" && !!user;

  const role = user?.role;

  return (
    <header className="sticky top-0 z-50 glass-nav border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link
            href={
              !role
                ? "/"
                : role === Role.CUSTOMER
                ? "/customer/shipments"
                : role === Role.DRIVER
                ? "/driver/assignments"
                : "/staff/dashboard"
            }
            className="flex items-center gap-2 text-white font-bold text-lg tracking-tight group"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span>
              Logi<span className="text-blue-400">Flow</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/track"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                pathname.startsWith("/track")
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Compass className="h-4 w-4" />
              Track Package
            </Link>

            {isAuthenticated && (
              <>
                {/* Customer Links */}
                {role === Role.CUSTOMER && (
                  <>
                    <Link
                      href="/customer/shipments"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        pathname === "/customer/shipments"
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      My Shipments
                    </Link>
                    <Link
                      href="/customer/shipments/new"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                        pathname === "/customer/shipments/new"
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Book Shipment
                    </Link>
                  </>
                )}

                {/* Staff / Admin Links */}
                {(role === Role.STAFF || role === Role.ADMIN) && (
                  <>
                    <Link
                      href="/staff/dashboard"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        pathname === "/staff/dashboard"
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      Operations Hub
                    </Link>
                    <Link
                      href="/staff/shipments/new"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                        pathname === "/staff/shipments/new"
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Create Order
                    </Link>
                    {role === Role.ADMIN && (
                      <>
                        <Link
                          href="/admin/hubs"
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                            pathname.startsWith("/admin/hubs")
                              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                          }`}
                        >
                          Regional Hubs
                        </Link>
                        <Link
                          href="/admin/vehicles"
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                            pathname.startsWith("/admin/vehicles")
                              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                          }`}
                        >
                          <Truck className="h-4 w-4" />
                          Fleet
                        </Link>
                      </>
                    )}
                  </>
                )}

                {/* Driver Links */}
                {role === Role.DRIVER && (
                  <Link
                    href="/driver/assignments"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      pathname.startsWith("/driver")
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    My Deliveries
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        {/* User / Auth CTA */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-slate-200">{user.name}</span>
                <span className="text-xs px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 font-mono text-slate-400">
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
              >
                <UserPlus className="h-4 w-4" />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
