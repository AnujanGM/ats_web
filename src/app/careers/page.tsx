"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ApplyModal } from "@/components/ApplyModal";
import { EmailToastModal } from "@/components/EmailToastModal";
import {
  ApplicationWithJob,
  EmailNotificationResult,
  JobWithCounts,
} from "@/lib/types";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function PublicCareersPage() {
  const [jobs, setJobs] = useState<JobWithCounts[]>([]);
  const [storageMode, setStorageMode] = useState<
    "supabase-prisma" | "local-fallback"
  >("local-fallback");
  const [emailMode, setEmailMode] = useState<"live" | "mock">("mock");
  const [isLoading, setIsLoading] = useState(true);

  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(
    undefined
  );
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<ApplicationWithJob | null>(
    null
  );
  const [emailToast, setEmailToast] = useState<EmailNotificationResult | null>(
    null
  );

  useEffect(() => {
    async function loadJobs() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/jobs");
        const data = await res.json();
        if (res.ok) {
          setJobs(data.jobs || []);
          setStorageMode(data.storageMode || "local-fallback");
          setEmailMode(data.emailMode || "mock");
        }
      } catch (err) {
        console.error("Failed to fetch open jobs:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadJobs();
  }, []);

  const openJobs = jobs.filter((j) => j.status === "OPEN");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar storageMode={storageMode} emailMode={emailMode} />

      {/* Hero Banner */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/60">
            <Sparkles className="h-3.5 w-3.5" />
            Careers at LedgerPro
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Build the Financial OS for Modern Enterprises
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Join our engineering, product, and customer teams solving complex
            multi-entity accounting, real-time payment settlement, and treasury
            automation.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Recent Application Confirmation Banner */}
        {submittedApp && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-emerald-950">
                  Application Submitted Successfully!
                </h3>
                <p className="mt-1 text-xs text-emerald-800">
                  Thank you,{" "}
                  <span className="font-semibold">
                    {submittedApp.candidateName}
                  </span>
                  ! Your application for{" "}
                  <span className="font-semibold">
                    {submittedApp.job.title}
                  </span>{" "}
                  is now in our recruiting pipeline under{" "}
                  <span className="underline">Recruiter View</span>, and a
                  confirmation email has been triggered to{" "}
                  <span className="font-semibold">
                    {submittedApp.candidateEmail}
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Open Positions ({openJobs.length})
          </h2>
          <span className="text-xs text-slate-500">
            Upload PDF/DOCX resume (≤ 5 MB) or share a portfolio link
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            <p className="mt-2 text-xs font-medium text-slate-500">
              Loading open positions...
            </p>
          </div>
        ) : openJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No open roles at the moment.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Switch to the Recruiter View to publish a new job posting.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {openJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs hover:border-indigo-300 transition-all"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                        {job.department}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {job.type}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {job.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {job.department}
                      </span>
                      {job.salaryRange && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                          {job.salaryRange}
                        </span>
                      )}
                    </div>

                    <p className="pt-1 text-xs leading-relaxed text-slate-600">
                      {job.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setIsApplyModalOpen(true);
                    }}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Apply for this Role
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        jobs={jobs}
        defaultJobId={selectedJobId}
        onSubmitted={(app, emailNotification) => {
          setSubmittedApp(app);
          if (emailNotification) {
            setEmailToast(emailNotification);
          }
        }}
      />

      <EmailToastModal
        notification={emailToast}
        onDismiss={() => setEmailToast(null)}
      />
    </div>
  );
}
