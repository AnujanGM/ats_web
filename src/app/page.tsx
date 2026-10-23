"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  APPLICATION_STATUS_ORDER,
  ApplicationStatus,
  ApplicationWithJob,
  EmailNotificationResult,
  JobWithCounts,
  STATUS_CONFIG,
} from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateJobModal } from "@/components/CreateJobModal";
import { ApplyModal } from "@/components/ApplyModal";
import { CandidateDrawer } from "@/components/CandidateDrawer";
import { EmailToastModal } from "@/components/EmailToastModal";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  Filter,
  Kanban,
  Loader2,
  Mail,
  MapPin,
  Plus,
  Search,
  Table2,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

export default function RecruiterDashboardPage() {
  const [jobs, setJobs] = useState<JobWithCounts[]>([]);
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [storageMode, setStorageMode] = useState<
    "supabase-prisma" | "local-fallback"
  >("local-fallback");
  const [emailMode, setEmailMode] = useState<"live" | "mock">("mock");
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Active workspace tab & layout view
  const [activeTab, setActiveTab] = useState<"applications" | "jobs">(
    "applications"
  );
  const [layoutMode, setLayoutMode] = useState<"table" | "kanban">("table");

  // Filters
  const [selectedJobId, setSelectedJobId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<
    ApplicationStatus | "ALL"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals & Drawer state
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null
  );
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [emailToast, setEmailToast] = useState<EmailNotificationResult | null>(
    null
  );

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/applications"),
      ]);
      const jobsData = await jobsRes.json();
      const appsData = await appsRes.json();

      if (jobsRes.ok) {
        setJobs(jobsData.jobs || []);
        setStorageMode(jobsData.storageMode || "local-fallback");
        setEmailMode(jobsData.emailMode || "mock");
      }
      if (appsRes.ok) {
        setApplications(appsData.applications || []);
      }
    } catch (error) {
      console.error("Failed to load ATS dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Reset / Re-seed demo data
  async function handleResetDemoData() {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        await fetchAllData();
        setSelectedJobId("ALL");
        setSelectedStatus("ALL");
        setSearchQuery("");
      }
    } finally {
      setIsSeeding(false);
    }
  }

  // Filtered applications (combining job filter, status filter, and search query)
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (selectedJobId !== "ALL" && app.jobId !== selectedJobId) {
        return false;
      }
      if (selectedStatus !== "ALL" && app.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchName = app.candidateName.toLowerCase().includes(q);
        const matchEmail = app.candidateEmail.toLowerCase().includes(q);
        const matchJob = app.job.title.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchJob) return false;
      }
      return true;
    });
  }, [applications, selectedJobId, selectedStatus, searchQuery]);

  // Pipeline counts scoped by selectedJobId (so selecting a job shows that job's funnel)
  const stageCounts = useMemo(() => {
    const jobScopedApps =
      selectedJobId === "ALL"
        ? applications
        : applications.filter((a) => a.jobId === selectedJobId);

    const counts: Record<ApplicationStatus | "ALL", number> = {
      ALL: jobScopedApps.length,
      NEW: 0,
      SCREENING: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
    };

    for (const app of jobScopedApps) {
      counts[app.status] = (counts[app.status] || 0) + 1;
    }
    return counts;
  }, [applications, selectedJobId]);

  // Selected candidate for slide-over drawer
  const activeCandidate = useMemo(
    () => applications.find((a) => a.id === selectedCandidateId) || null,
    [applications, selectedCandidateId]
  );

  // Change candidate pipeline status & trigger email notification
  async function handleStatusChange(
    applicationId: string,
    newStatus: ApplicationStatus
  ) {
    setUpdatingAppId(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.application) {
        setApplications((prev) =>
          prev.map((a) => (a.id === applicationId ? data.application : a))
        );
        if (data.emailNotification) {
          setEmailToast(data.emailNotification);
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingAppId(null);
    }
  }

  // Delete candidate application
  async function handleDeleteApplication(applicationId: string) {
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== applicationId));
        if (selectedCandidateId === applicationId) {
          setSelectedCandidateId(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete application:", err);
    }
  }

  // Toggle job status (OPEN / CLOSED)
  async function handleToggleJobStatus(job: JobWithCounts) {
    const nextStatus = job.status === "OPEN" ? "CLOSED" : "OPEN";
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.job) {
        setJobs((prev) => prev.map((j) => (j.id === job.id ? data.job : j)));
      }
    } catch (err) {
      console.error("Failed to update job status:", err);
    }
  }

  // Delete job posting
  async function handleDeleteJob(jobId: string) {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        setApplications((prev) => prev.filter((a) => a.jobId !== jobId));
        if (selectedJobId === jobId) {
          setSelectedJobId("ALL");
        }
      }
    } catch (err) {
      console.error("Failed to delete job:", err);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        storageMode={storageMode}
        emailMode={emailMode}
        onResetDemoData={handleResetDemoData}
        isSeeding={isSeeding}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Recruiter Talent Pipeline
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Triage incoming candidates, filter by role or stage, and dispatch
              automatic status updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsApplyOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <UserPlus className="h-4 w-4 text-emerald-600" />
              Add Candidate Application
            </button>

            <button
              type="button"
              onClick={() => setIsCreateJobOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Job Posting
            </button>
          </div>
        </div>

        {/* Interactive Hiring Pipeline Funnel Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("applications");
              setSelectedStatus("ALL");
            }}
            className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
              selectedStatus === "ALL" && activeTab === "applications"
                ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/15"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Candidates
              </span>
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">
                {stageCounts.ALL}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                All stages
              </span>
            </div>
          </button>

          {APPLICATION_STATUS_ORDER.map((stage) => {
            const cfg = STATUS_CONFIG[stage];
            const isSelected =
              selectedStatus === stage && activeTab === "applications";
            return (
              <button
                key={stage}
                type="button"
                onClick={() => {
                  setActiveTab("applications");
                  setSelectedStatus(stage === selectedStatus ? "ALL" : stage);
                }}
                className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? `${cfg.badgeBg} ${cfg.badgeBorder} ring-2 ring-indigo-500/15`
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    {cfg.label}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${cfg.dotColor}`} />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900">
                    {stageCounts[stage]}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {stageCounts.ALL > 0
                      ? `${Math.round(
                          (stageCounts[stage] / stageCounts.ALL) * 100
                        )}%`
                      : "0%"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Workspace Navigation Tabs + Controls */}
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("applications")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "applications"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Applications ({filteredApplications.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("jobs")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "jobs"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Job Postings ({jobs.length})
            </button>
          </div>

          {activeTab === "applications" && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setLayoutMode("table")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  layoutMode === "table"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Table2 className="h-3.5 w-3.5" />
                Table View
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("kanban")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  layoutMode === "kanban"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Kanban className="h-3.5 w-3.5" />
                Pipeline Board
              </button>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* TAB 1: APPLICATIONS PIPELINE VIEW                                 */}
        {/* ================================================================= */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            {/* Search & Filters Toolbar */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by candidate name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Filter by Job & Status */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Filter:</span>
                </div>

                {/* Job Filter Dropdown */}
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="ALL">All Job Postings ({jobs.length})</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} ({job._count?.applications ?? 0})
                    </option>
                  ))}
                </select>

                {/* Status Filter Dropdown */}
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(
                      e.target.value as ApplicationStatus | "ALL"
                    )
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="ALL">All Statuses</option>
                  {APPLICATION_STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_CONFIG[status].label} ({stageCounts[status]})
                    </option>
                  ))}
                </select>

                {(selectedJobId !== "ALL" ||
                  selectedStatus !== "ALL" ||
                  searchQuery.trim() !== "") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJobId("ALL");
                      setSelectedStatus("ALL");
                      setSearchQuery("");
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Loading candidate pipeline...
                </p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center">
                <Users className="h-9 w-9 text-slate-300" />
                <h3 className="mt-3 text-sm font-bold text-slate-900">
                  No matching applications found
                </h3>
                <p className="mt-1 max-w-sm text-xs text-slate-500">
                  Try clearing your active search/status filters or submit a new
                  candidate application.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJobId("ALL");
                      setSelectedStatus("ALL");
                      setSearchQuery("");
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Clear Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsApplyOpen(true)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    + Add Candidate
                  </button>
                </div>
              </div>
            ) : layoutMode === "table" ? (
              /* ============================================================= */
              /* HIGH-DENSITY RECRUITER TABLE VIEW                             */
              /* ============================================================= */
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-3.5">Candidate</th>
                        <th className="px-4 py-3.5">Job Role</th>
                        <th className="px-4 py-3.5">Current Stage</th>
                        <th className="px-4 py-3.5">Move Stage (Auto-Email)</th>
                        <th className="px-4 py-3.5">Resume</th>
                        <th className="px-4 py-3.5">Applied</th>
                        <th className="px-5 py-3.5 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredApplications.map((app) => {
                        const isRowUpdating = updatingAppId === app.id;
                        return (
                          <tr
                            key={app.id}
                            className="hover:bg-slate-50/90 transition-colors group"
                          >
                            {/* Candidate Name & Email */}
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => setSelectedCandidateId(app.id)}
                                className="text-left group-hover:text-indigo-600 transition-colors cursor-pointer"
                              >
                                <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600">
                                  {app.candidateName}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1 text-slate-500">
                                  <Mail className="h-3 w-3 text-slate-400" />
                                  {app.candidateEmail}
                                </div>
                              </button>
                              {app.coverNote && (
                                <p className="mt-1.5 line-clamp-1 max-w-xs text-[11px] text-slate-500 italic">
                                  &ldquo;{app.coverNote}&rdquo;
                                </p>
                              )}
                            </td>

                            {/* Job Role */}
                            <td className="px-4 py-4">
                              <div className="font-semibold text-slate-800">
                                {app.job.title}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {app.job.department} · {app.job.location}
                              </div>
                            </td>

                            {/* Current Status Badge */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <StatusBadge status={app.status} />
                            </td>

                            {/* Quick Status Pipeline Selector */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <select
                                  value={app.status}
                                  disabled={isRowUpdating}
                                  onChange={(e) =>
                                    handleStatusChange(
                                      app.id,
                                      e.target.value as ApplicationStatus
                                    )
                                  }
                                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 cursor-pointer"
                                >
                                  {APPLICATION_STATUS_ORDER.map((stage) => (
                                    <option key={stage} value={stage}>
                                      → {STATUS_CONFIG[stage].label}
                                    </option>
                                  ))}
                                </select>
                                {isRowUpdating && (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                                )}
                              </div>
                            </td>

                            {/* Resume Link */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <a
                                href={app.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={
                                  app.resumeUrl.startsWith("data:")
                                    ? app.resumeName || "Resume.pdf"
                                    : undefined
                                }
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                              >
                                <FileText className="h-3 w-3" />
                                <span className="max-w-[110px] truncate">
                                  {app.resumeName || "Resume"}
                                </span>
                                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                              </a>
                            </td>

                            {/* Applied Date */}
                            <td className="px-4 py-4 whitespace-nowrap text-slate-500">
                              {new Date(app.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </td>

                            {/* View Drawer Button */}
                            <td className="px-5 py-4 whitespace-nowrap text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedCandidateId(app.id)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors cursor-pointer"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* ============================================================= */
              /* KANBAN PIPELINE BOARD VIEW                                    */
              /* ============================================================= */
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                {APPLICATION_STATUS_ORDER.map((stage) => {
                  const cfg = STATUS_CONFIG[stage];
                  const stageApps = filteredApplications.filter(
                    (a) => a.status === stage
                  );

                  return (
                    <div
                      key={stage}
                      className="flex flex-col rounded-2xl border border-slate-200 bg-slate-100/70 p-3"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between px-1 pb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${cfg.dotColor}`}
                          />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            {cfg.label}
                          </h3>
                        </div>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                          {stageApps.length}
                        </span>
                      </div>

                      {/* Cards */}
                      <div className="flex-1 space-y-2.5">
                        {stageApps.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-300/80 bg-white/50 py-8 text-center text-[11px] text-slate-400">
                            No candidates in {cfg.label}
                          </div>
                        ) : (
                          stageApps.map((app) => {
                            const currentIdx = APPLICATION_STATUS_ORDER.indexOf(
                              app.status
                            );
                            const nextStage =
                              currentIdx < 3
                                ? APPLICATION_STATUS_ORDER[currentIdx + 1]
                                : null;

                            return (
                              <div
                                key={app.id}
                                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-indigo-300 transition-all space-y-2.5"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedCandidateId(app.id)
                                    }
                                    className="text-left font-bold text-xs text-slate-900 hover:text-indigo-600 cursor-pointer"
                                  >
                                    {app.candidateName}
                                  </button>
                                  <a
                                    href={app.resumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Open Resume"
                                    className="text-slate-400 hover:text-indigo-600"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                  </a>
                                </div>

                                <p className="text-[11px] font-medium text-indigo-700 line-clamp-1">
                                  {app.job.title}
                                </p>

                                {app.coverNote && (
                                  <p className="text-[11px] text-slate-500 line-clamp-2">
                                    {app.coverNote}
                                  </p>
                                )}

                                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedCandidateId(app.id)
                                    }
                                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                                  >
                                    Details
                                  </button>

                                  {nextStage && (
                                    <button
                                      type="button"
                                      disabled={updatingAppId === app.id}
                                      onClick={() =>
                                        handleStatusChange(app.id, nextStage)
                                      }
                                      className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                                    >
                                      Move to {STATUS_CONFIG[nextStage].label}
                                      <ArrowRight className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: JOB POSTINGS MANAGEMENT                                    */}
        {/* ================================================================= */}
        {activeTab === "jobs" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {jobs.map((job) => {
              const appCount = applications.filter(
                (a) => a.jobId === job.id
              ).length;

              return (
                <div
                  key={job.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            job.status === "OPEN"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {job.status === "OPEN" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {job.status}
                        </span>
                        <h3 className="mt-2 text-base font-bold text-slate-900">
                          {job.title}
                        </h3>
                      </div>

                      <div className="rounded-xl bg-indigo-50 px-3 py-1.5 text-center border border-indigo-100">
                        <span className="block text-base font-bold text-indigo-700">
                          {appCount}
                        </span>
                        <span className="text-[10px] font-semibold uppercase text-indigo-600">
                          Applicants
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {job.department}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {job.location}
                      </span>
                      {job.salaryRange && (
                        <span className="font-medium text-slate-700">
                          {job.salaryRange}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-3">
                      {job.description}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJobId(job.id);
                        setActiveTab("applications");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <Users className="h-3.5 w-3.5" />
                      View {appCount} Candidates
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleJobStatus(job)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        {job.status === "OPEN" ? "Close Role" : "Reopen Role"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job.id)}
                        title="Delete Job Posting"
                        className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <CreateJobModal
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        onCreated={(newJob) => setJobs((prev) => [newJob, ...prev])}
      />

      <ApplyModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        jobs={jobs}
        defaultJobId={selectedJobId !== "ALL" ? selectedJobId : undefined}
        onSubmitted={(newApp, emailNotification) => {
          setApplications((prev) => [newApp, ...prev]);
          if (emailNotification) {
            setEmailToast(emailNotification);
          }
        }}
      />

      <CandidateDrawer
        application={activeCandidate}
        onClose={() => setSelectedCandidateId(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteApplication}
        updatingId={updatingAppId}
      />

      <EmailToastModal
        notification={emailToast}
        onDismiss={() => setEmailToast(null)}
      />
    </div>
  );
}
