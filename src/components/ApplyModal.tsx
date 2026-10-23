"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import {
  ApplicationWithJob,
  EmailNotificationResult,
  JobWithCounts,
} from "@/lib/types";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobWithCounts[];
  defaultJobId?: string;
  onSubmitted: (
    app: ApplicationWithJob,
    emailNotification?: EmailNotificationResult
  ) => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function ApplyModal({
  isOpen,
  onClose,
  jobs,
  defaultJobId,
  onSubmitted,
}: ApplyModalProps) {
  const openJobs = jobs.filter((j) => j.status === "OPEN");
  const selectableJobs = openJobs.length > 0 ? openJobs : jobs;

  const [jobId, setJobId] = useState(
    defaultJobId || selectableJobs[0]?.id || ""
  );
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [resumeMode, setResumeMode] = useState<"file" | "link">("file");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeLink, setResumeLink] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync defaultJobId when modal opens for a specific role
  React.useEffect(() => {
    if (defaultJobId) {
      setJobId(defaultJobId);
    } else if (!jobId && selectableJobs[0]?.id) {
      setJobId(selectableJobs[0].id);
    }
  }, [defaultJobId, selectableJobs, jobId]);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setResumeFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(
        `Selected file (${(file.size / (1024 * 1024)).toFixed(
          2
        )} MB) exceeds the 5 MB maximum size limit.`
      );
      e.target.value = "";
      setResumeFile(null);
      return;
    }
    setResumeFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!jobId) {
      setError("Please select a job position.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalResumeUrl = "";
      let finalResumeName: string | null = null;

      if (resumeMode === "file") {
        if (!resumeFile) {
          throw new Error(
            "Please select a resume file (PDF, DOC, or DOCX up to 5 MB) or switch to Resume Link."
          );
        }

        const formData = new FormData();
        formData.append("file", resumeFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload resume file.");
        }

        finalResumeUrl = uploadData.resumeUrl;
        finalResumeName = uploadData.resumeName;
      } else {
        if (!resumeLink.trim()) {
          throw new Error("Please enter a valid link to your resume or portfolio.");
        }
        finalResumeUrl = resumeLink.trim();
        finalResumeName = "External Resume Link";
      }

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          candidateName,
          candidateEmail,
          resumeUrl: finalResumeUrl,
          resumeName: finalResumeName,
          coverNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application.");
      }

      onSubmitted(data.application, data.emailNotification);
      setCandidateName("");
      setCandidateEmail("");
      setResumeFile(null);
      setResumeLink("");
      setCoverNote("");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit application."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Submit Candidate Application
              </h2>
              <p className="text-xs text-slate-500">
                Enter candidate details and upload a resume (≤ 5 MB) or link
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Job Posting <span className="text-rose-500">*</span>
            </label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {selectableJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} — {job.department} ({job.location})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Jordan Vance"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="jordan.vance@example.com"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Resume Upload or External Link Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Resume <span className="text-rose-500">*</span>
              </label>
              <div className="inline-flex rounded-md bg-slate-100 p-0.5 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setResumeMode("file")}
                  className={`flex items-center gap-1 rounded px-2 py-0.5 transition-all cursor-pointer ${
                    resumeMode === "file"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Upload className="h-3 w-3" />
                  Upload File (≤ 5MB)
                </button>
                <button
                  type="button"
                  onClick={() => setResumeMode("link")}
                  className={`flex items-center gap-1 rounded px-2 py-0.5 transition-all cursor-pointer ${
                    resumeMode === "link"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Link2 className="h-3 w-3" />
                  Paste Resume Link
                </button>
              </div>
            </div>

            {resumeMode === "file" ? (
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {resumeFile ? (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-900">
                        {resumeFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {(resumeFile.size / 1024).toFixed(1)} KB — Ready to
                        upload to Supabase Storage
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileText className="h-6 w-6 text-slate-400 mb-1.5" />
                    <p className="text-xs font-semibold text-slate-700">
                      Click to choose a resume file
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      PDF, DOC, or DOCX up to 5 MB
                    </p>
                  </>
                )}
              </label>
            ) : (
              <input
                type="url"
                placeholder="https://drive.google.com/... or https://linkedin.com/in/..."
                value={resumeLink}
                onChange={(e) => setResumeLink(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cover Note (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Briefly share relevant achievements, fintech experience, or why you want to join LedgerPro..."
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
