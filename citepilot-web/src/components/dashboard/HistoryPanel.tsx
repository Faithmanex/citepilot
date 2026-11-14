"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AuditResponse } from "@/lib/types";
import {
  History,
  FileText,
  Calendar,
  Trash2,
  ArrowUpRight,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Modal from "../ui/Modal";

interface SavedAudit {
  id: string;
  document_name: string;
  citation_style: string;
  audit_mode: string;
  word_count: number;
  citation_count: number;
  reference_count: number;
  score: number;
  created_at: string;
  results: AuditResponse;
}

interface HistoryPanelProps {
  onLoadAudit: (audit: SavedAudit) => void;
  onOpenAuth: () => void;
}

export default function HistoryPanel({ onLoadAudit, onOpenAuth }: HistoryPanelProps) {
  const { user } = useAuth();
  const [audits, setAudits] = useState<SavedAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedAudit | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    // Signed-out state renders its own block before the loading branch, so
    // skip fetching without touching loading state.
    if (!user) return;
    const controller = new AbortController();

    fetch("/api/audits/history", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          let message = `History could not be loaded (status ${res.status}).`;
          try {
            const body = await res.json();
            if (body?.error) message = body.error;
          } catch {
            /* keep status message */
          }
          throw new Error(message);
        }
        return res.json();
      })
      .then((data) => setAudits(data.audits || []))
      .catch((err: Error) => {
        if (err?.name === "AbortError") return;
        setLoadError(err.message || "History could not be loaded.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [user, reloadToken]);

  const confirmDelete = async () => {
    const audit = pendingDelete;
    if (!audit) return;
    setDeletingId(audit.id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/audits/history?id=${encodeURIComponent(audit.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        let message = `Delete failed (status ${res.status}).`;
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
          /* keep status message */
        }
        throw new Error(message);
      }
      setAudits((prev) => prev.filter((a) => a.id !== audit.id));
      setPendingDelete(null);
    } catch (err) {
      setDeleteError((err as Error).message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <section
        aria-labelledby="history-signed-out-heading"
        className="bg-[#ffffff] rounded-lg border border-[#d9cfb8] p-8 text-center max-w-2xl mx-auto shadow-none"
      >
        <div className="w-14 h-14 rounded-lg bg-[#e7e9f5] text-[#2c3e8c] flex items-center justify-center mx-auto mb-4">
          <History className="w-7 h-7" aria-hidden="true" />
        </div>
        <h2
          id="history-signed-out-heading"
          className="text-xl font-extrabold text-[#221d16] font-display mb-2"
        >
          Audit history and saved reports
        </h2>
        <p className="text-sm text-[#5c5344] mb-6 max-w-md mx-auto">
          Sign in or create a free CitePilot account to save manuscript audits and
          reload past reports at any time.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 min-h-11 bg-[#2c3e8c] hover:bg-[#24357a] text-white font-semibold text-sm rounded-lg shadow-none transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Sign in / create account
        </button>
      </section>
    );
  }

  if (loading) {
    return (
      <div
        className="bg-[#ffffff] rounded-lg border border-[#d9cfb8] p-12 text-center shadow-none"
        role="status"
        aria-live="polite"
      >
        <Loader2
          className="w-6 h-6 animate-spin motion-reduce:animate-none text-[#2c3e8c] mx-auto mb-3"
          aria-hidden="true"
        />
        <p className="text-sm text-[#5c5344]">Loading your past manuscript audits…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <section
        aria-labelledby="history-error-heading"
        className="bg-[#ffffff] rounded-lg border border-[#ddb3aa] p-8 text-center shadow-none"
      >
        <AlertCircle className="w-7 h-7 text-[#a32b21] mx-auto mb-3" aria-hidden="true" />
        <h2
          id="history-error-heading"
          className="text-lg font-extrabold text-[#221d16] font-display mb-1"
        >
          History could not be loaded
        </h2>
        <p role="alert" className="text-sm text-[#5c5344] max-w-md mx-auto mb-4">
          {loadError}
        </p>
        <button
          onClick={() => {
            setLoading(true);
            setLoadError(null);
            setReloadToken((token) => token + 1);
          }}
          className="px-5 py-2.5 min-h-11 bg-[#2c3e8c] hover:bg-[#24357a] text-white font-semibold text-sm rounded-lg cursor-pointer"
        >
          Try again
        </button>
      </section>
    );
  }

  if (audits.length === 0) {
    return (
      <section
        aria-labelledby="history-empty-heading"
        className="bg-[#ffffff] rounded-lg border border-[#d9cfb8] p-12 text-center shadow-none"
      >
        <div className="w-12 h-12 rounded-lg bg-[#faf6ec] text-[#5c5344] flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2
          id="history-empty-heading"
          className="text-lg font-extrabold text-[#221d16] font-display mb-1"
        >
          No saved audits yet
        </h2>
        <p className="text-sm text-[#5c5344] max-w-md mx-auto">
          Run your first citation audit in the Editor panel. Signed-in users’ audit
          results are saved here automatically.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="history-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            id="history-heading"
            className="text-xl font-extrabold text-[#221d16] font-display"
          >
            Audit history
          </h2>
          <p className="text-xs text-[#5c5344] mt-0.5">
            Reload a previous audit to restore its document, style, mode, and
            findings.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-[#ffffff] border border-[#d9cfb8] rounded-lg text-[#5c5344]">
          {audits.length} saved {audits.length === 1 ? "audit" : "audits"}
        </span>
      </div>

      <div aria-live="polite" className="min-h-0">
        {deleteError && (
          <p
            role="alert"
            className="mb-2 text-xs font-semibold text-[#a32b21] bg-[#f3dcd6] border border-[#ddb3aa] rounded-lg p-2.5"
          >
            {deleteError}
          </p>
        )}
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
        {audits.map((audit) => {
          const formattedDate = new Date(audit.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <li key={audit.id}>
              <article className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 shadow-none flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#e7e9f5] text-[#2c3e8c] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#221d16] line-clamp-1">
                          {audit.document_name}
                        </h3>
                        <p className="flex items-center gap-1 text-[11px] text-[#5c5344]">
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                          <span>{formattedDate}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(audit)}
                      disabled={deletingId === audit.id}
                      className="text-[#6b6152] hover:text-[#a32b21] p-2 min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-[#f3dcd6]/60 transition-colors disabled:opacity-50"
                      aria-label={`Delete saved audit for ${audit.document_name}`}
                    >
                      {deletingId === audit.id ? (
                        <Loader2
                          className="w-4 h-4 animate-spin motion-reduce:animate-none text-[#a32b21]"
                          aria-hidden="true"
                        />
                      ) : (
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  <dl className="grid grid-cols-3 gap-2 my-3 p-2.5 bg-[#faf6ec] border border-[#d9cfb8] rounded-lg text-center">
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-[#5c5344] tracking-wider">
                        Style
                      </dt>
                      <dd className="text-xs font-bold text-[#221d16]">{audit.citation_style}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-[#5c5344] tracking-wider">
                        Citations
                      </dt>
                      <dd className="text-xs font-bold text-[#221d16]">{audit.citation_count}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-[#5c5344] tracking-wider">
                        References
                      </dt>
                      <dd className="text-xs font-bold text-[#221d16]">{audit.reference_count}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#d9cfb8]">
                  <span className="text-xs text-[#5c5344] font-medium">
                    {audit.word_count > 0
                      ? `${audit.word_count.toLocaleString()} words`
                      : `${audit.audit_mode} mode`}
                    {audit.audit_mode ? ` · ${audit.audit_mode === "full" ? "whole document" : "references only"}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => onLoadAudit(audit)}
                    className="inline-flex items-center gap-1 min-h-11 px-3 text-xs font-bold text-[#2c3e8c] hover:underline rounded-lg cursor-pointer"
                    aria-label={`Load audit report for ${audit.document_name}`}
                  >
                    Load report <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete saved audit?"
        description={
          pendingDelete
            ? `“${pendingDelete.document_name}” will be removed from your history. This cannot be undone.`
            : undefined
        }
        initialFocusId="confirm-delete-cancel"
      >
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <button
            id="confirm-delete-cancel"
            type="button"
            onClick={() => setPendingDelete(null)}
            className="min-h-11 px-4 rounded-lg border border-[#8f836c] text-xs font-bold text-[#221d16] bg-white hover:bg-[#faf6ec] cursor-pointer"
          >
            Keep audit
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={deletingId !== null}
            className="min-h-11 px-4 rounded-lg bg-[#a32b21] hover:bg-[#7d1f18] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {deletingId ? "Deleting…" : "Delete audit"}
          </button>
        </div>
      </Modal>
    </section>
  );
}
