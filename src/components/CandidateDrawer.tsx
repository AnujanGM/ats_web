"use client";

import React from "react";
import {
  APPLICATION_STATUS_ORDER,
  ApplicationStatus,
  ApplicationWithJob,
  STATUS_CONFIG,
} from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Trash2,
  X,
} from "lucide-react";

interface CandidateDrawerProps {
  application: ApplicationWithJob | null;
  onClose: () => void;
  onStatusChange: (appId: string, newStatus: ApplicationStatus) => void;
  onDelete: (appId: string) => void;
  updatingId: string | null;
}

export function CandidateDrawer({
  application,
  onClose,
  onStatusChange,
  onDelete,
  updatingId,
}: CandidateDrawerProps) {
  if (!application) return null;

  const isUpdating = updatingId === application.id;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl border-l border-slate-200">
        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 bg-slate-50">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">
                {application.candidateName}
              </h2>
              <StatusBadge status={application.status} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <a
                href={`mailto:${application.candidateEmail}`}
                className="inline-flex items-center gap-1 hover:text-indigo-600 font-medium"
              >
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {application.candidateEmail}
              </a>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Applied{" "}
                {new Date(application.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Applied Role Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Applied Position
            </div>
            <div className="mt-1 font-bold text-slate-900 text-sm">
              {application.job.title}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                {application.job.department}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {application.job.location}
              </span>
            </div>
          </div>

          {/* Interactive Hiring Pipeline Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Hiring Pipeline Stage
              </label>
              <span className="text-[11px] text-slate-500">
                Changing stage automatically emails candidate
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
              {APPLICATION_STATUS_ORDER.map((stage, idx) => {
                const cfg = STATUS_CONFIG[stage];
                const isActive = application.status === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    disabled={isUpdating || isActive}
                    onClick={() => onStatusChange(application.id, stage)}
                    className={`relative flex flex-col items-start rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                      isActive
                        ? `${cfg.badgeBg} ${cfg.badgeBorder} ring-2 ring-indigo-500/20`
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    } disabled:cursor-default`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={`h-2 w-2 rounded-full ${cfg.dotColor}`}
                      />
                      {idx < 3 && (
                        <ArrowRight className="h-3 w-3 text-slate-300 hidden sm:block" />
                      )}
                    </div>
                    <span
                      className={`mt-1.5 text-xs font-bold ${
                        isActive ? cfg.badgeText : "text-slate-800"
                      }`}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isActive ? "Current" : "Move here"}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {STATUS_CONFIG[application.status].shortDescription}
            </p>
          </div>

          {/* Resume Document Section */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Resume / CV
            </label>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {application.resumeName || "Candidate_Resume.pdf"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {application.resumeUrl.startsWith("data:")
                      ? "Uploaded file (Stored inline)"
                      : application.resumeUrl}
                  </p>
                </div>
              </div>

              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={
                  application.resumeUrl.startsWith("data:")
                    ? application.resumeName || "Resume.pdf"
                    : undefined
                }
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Resume
              </a>
            </div>
          </div>

          {/* Cover Note Section */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Candidate Cover Note
            </label>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {application.coverNote ? (
                application.coverNote
              ) : (
                <span className="italic text-slate-400">
                  No cover note provided with this application.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => onDelete(application.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove Application
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
