"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Database,
  ExternalLink,
  Layers,
  Mail,
  RefreshCw,
} from "lucide-react";

interface NavbarProps {
  storageMode?: "supabase-prisma" | "local-fallback";
  emailMode?: "live" | "mock";
  onResetDemoData?: () => void;
  isSeeding?: boolean;
}

export function Navbar({
  storageMode = "local-fallback",
  emailMode = "mock",
  onResetDemoData,
  isSeeding = false,
}: NavbarProps) {
  const pathname = usePathname();
  const isCareers = pathname?.startsWith("/careers");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo & Mode Switcher */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  LedgerPro
                </span>
                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200/60">
                  ATS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Recruiting & Pipeline Triage
              </p>
            </div>
          </Link>

          <nav className="flex items-center rounded-lg bg-slate-100 p-1 text-xs font-medium">
            <Link
              href="/"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                !isCareers
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
              Recruiter View
            </Link>
            <Link
              href="/careers"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                isCareers
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
              Public Job Board (Candidate View)
            </Link>
          </nav>
        </div>

        {/* System Status Indicators & Demo Seed Action */}
        <div className="flex items-center gap-2 text-xs">
          <div
            title={
              storageMode === "supabase-prisma"
                ? "Connected to Supabase PostgreSQL via Prisma ORM"
                : "Running with Local Persistent Store (Configure DATABASE_URL in .env for Supabase)"
            }
            className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium border ${
              storageMode === "supabase-prisma"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            <Database className="h-3 w-3" />
            {storageMode === "supabase-prisma"
              ? "DB: Supabase Postgres"
              : "DB: Ready (Local/Supabase)"}
          </div>

          <div
            title={
              emailMode === "live"
                ? "Resend API key active — sending live emails"
                : "Resend Mock Mode active — status change emails are logged and previewed in UI"
            }
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium border ${
              emailMode === "live"
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <Mail className="h-3 w-3" />
            {emailMode === "live" ? "Email: Resend Live" : "Email: Mock Preview"}
          </div>

          {onResetDemoData && (
            <button
              type="button"
              onClick={onResetDemoData}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors cursor-pointer"
              title="Reset and populate sample LedgerPro jobs & candidate applications"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-slate-500 ${
                  isSeeding ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Reset Demo Data</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
