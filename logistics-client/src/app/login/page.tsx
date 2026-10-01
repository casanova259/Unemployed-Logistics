"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefillEmail = searchParams.get("email");
    if (prefillEmail) {
      setEmail(prefillEmail);
      if (prefillEmail.startsWith("admin")) setPassword("admin123");
      else if (prefillEmail.startsWith("staff")) setPassword("staff123");
      else if (prefillEmail.startsWith("driver")) setPassword("driver123");
      else if (prefillEmail.startsWith("customer")) setPassword("customer123");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
      } else {
        const callback = searchParams.get("callbackUrl");
        if (callback) {
          router.push(callback);
        } else {
          // Fetch current user role to redirect cleanly
          const meRes = await fetch("/api/user/me");
          if (meRes.ok) {
            const data = await meRes.json();
            const role = data.user?.role;
            if (role === "CUSTOMER") router.push("/customer/shipments");
            else if (role === "DRIVER") router.push("/driver/assignments");
            else router.push("/staff/dashboard");
          } else {
            router.push("/");
          }
        }
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred during sign-in.");
      setLoading(false);
    }
  };

  const handleQuickLogin = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError("");
  };

  return (
    <div className="max-w-md mx-auto my-8 p-8 rounded-2xl glass-card border border-slate-800 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
          <Package className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Sign In to LogiFlow</h1>
        <p className="text-xs text-slate-400">
          Enter your credentials to access your operations console
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. staff1@logistics.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Fill Demo Roles */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <p className="text-xs text-slate-400 font-medium">Quick Fill Demo Account:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickLogin("staff1@logistics.com", "staff123")}
            className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition"
          >
            <div className="font-semibold text-slate-200">Staff / Dispatcher</div>
            <div className="text-slate-500 font-mono text-[10px]">staff1@logistics.com</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("driver1@logistics.com", "driver123")}
            className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition"
          >
            <div className="font-semibold text-slate-200">Driver</div>
            <div className="text-slate-500 font-mono text-[10px]">driver1@logistics.com</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("customer1@logistics.com", "customer123")}
            className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition"
          >
            <div className="font-semibold text-slate-200">Customer</div>
            <div className="text-slate-500 font-mono text-[10px]">customer1@logistics.com</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("admin@logistics.com", "admin123")}
            className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition"
          >
            <div className="font-semibold text-slate-200">Admin</div>
            <div className="text-slate-500 font-mono text-[10px]">admin@logistics.com</div>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-blue-400 hover:underline font-medium">
          Create one here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
