"use client";

import React, { useState } from "react";
import { EmailNotificationResult } from "@/lib/types";
import { CheckCircle2, Eye, Mail, X } from "lucide-react";

interface EmailToastModalProps {
  notification: EmailNotificationResult | null;
  onDismiss: () => void;
}

export function EmailToastModal({
  notification,
  onDismiss,
}: EmailToastModalProps) {
  const [showFullHtml, setShowFullHtml] = useState(false);

  if (!notification) return null;

  return (
    <>
      {/* Floating Bottom-Right Toast */}
      <div className="fixed bottom-5 right-5 z-40 w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-900">
                  Candidate Email Triggered
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    notification.mode === "live"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {notification.mode === "live" ? "Resend Live" : "Mock Mode"}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-600 truncate">
                <span className="font-medium text-slate-800">To:</span>{" "}
                {notification.to}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-900 line-clamp-1">
                {notification.subject}
              </p>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                {notification.previewText}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowFullHtml(true)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview Email HTML
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Full HTML Email Preview Modal */}
      {showFullHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Automated Candidate Email Preview
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      notification.mode === "live"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {notification.mode === "live"
                      ? "Sent via Resend API"
                      : "Resend Mock Mode"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {notification.note}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullHtml(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-slate-100 bg-white px-6 py-3 text-xs space-y-1">
              <div>
                <span className="font-semibold text-slate-500 w-16 inline-block">
                  To:
                </span>
                <span className="font-medium text-slate-900">
                  {notification.to}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 w-16 inline-block">
                  Subject:
                </span>
                <span className="font-semibold text-slate-900">
                  {notification.subject}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
              <div
                dangerouslySetInnerHTML={{ __html: notification.htmlBody }}
              />
            </div>

            <div className="flex items-center justify-end border-t border-slate-200 bg-white px-6 py-3">
              <button
                type="button"
                onClick={() => setShowFullHtml(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
