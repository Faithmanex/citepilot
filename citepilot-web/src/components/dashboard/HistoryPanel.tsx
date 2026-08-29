"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AuditResponse } from "@/lib/types";
import { History, FileText, Calendar, Trash2, ArrowUpRight, Sparkles, Loader2 } from "lucide-react";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Signed-out state renders its own block before the loading branch, so
    // skip fetching without touching loading state.
    if (!user) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/audits/history");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setAudits(data.audits || []);
        }
      } catch (err) {
        console.warn("Failed to fetch audit history:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this audit report from history?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/audits/history?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAudits((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="bg-[#ffffff] rounded-lg border border-[#ebebeb] p-8 text-center max-w-2xl mx-auto shadow-none">
        <div className="w-14 h-14 rounded-lg bg-[#e6f4f2] text-[#027e6f] flex items-center justify-center mx-auto mb-4">
          <History className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-extrabold text-[#0e101a] font-display mb-2">Audit History & Saved Reports</h3>
        <p className="text-sm text-[#545454] mb-6 max-w-md mx-auto">
          Sign in or create a free CitePilot account to automatically save your manuscript audits and reload past diagnostic reports at any time.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-[#027e6f] hover:bg-[#02665a] text-white font-semibold text-sm rounded-lg shadow-none transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Sign In / Create Account
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#ffffff] rounded-lg border border-[#ebebeb] p-12 text-center shadow-none">
        <Loader2 className="w-6 h-6 animate-spin text-[#027e6f] mx-auto mb-3" />
        <p className="text-sm text-[#545454]">Loading your past manuscript audits...</p>
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="bg-[#ffffff] rounded-lg border border-[#ebebeb] p-12 text-center shadow-none">
        <div className="w-12 h-12 rounded-lg bg-[#f5f5f5] text-[#545454] flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-extrabold text-[#0e101a] font-display mb-1">No Saved Audits Yet</h3>
        <p className="text-sm text-[#545454] max-w-md mx-auto">
          Run your first citation audit in the Manuscript tab. Your diagnostic findings and reports will be saved here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#0e101a] font-display">Audit History</h2>
          <p className="text-xs text-[#545454] mt-0.5">
            Select any previously audited document to reload full findings, style warnings, and export reports.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-[#ffffff] border border-[#ebebeb] rounded-lg text-[#545454]">
          {audits.length} Saved {audits.length === 1 ? "Audit" : "Audits"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {audits.map((audit) => {
          const formattedDate = new Date(audit.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={audit.id}
              onClick={() => onLoadAudit(audit)}
              className="group bg-[#ffffff] hover:bg-[#f5f5f5] border border-[#ebebeb] hover:border-[#027e6f]/40 rounded-lg p-5 shadow-none transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#e6f4f2] text-[#027e6f] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0e101a] group-hover:text-[#027e6f] transition-colors line-clamp-1">
                        {audit.document_name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-[#707070]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, audit.id)}
                    disabled={deletingId === audit.id}
                    className="text-[#707070] hover:text-[#b91c1c] p-1.5 rounded-lg hover:bg-[#fee2e2]/60 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete saved audit"
                  >
                    {deletingId === audit.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#b91c1c]" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3 p-2.5 bg-[#f5f5f5] border border-[#ebebeb] rounded-lg text-center">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#707070] tracking-wider">Style</span>
                    <span className="text-xs font-bold text-[#0e101a] uppercase">{audit.citation_style}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#707070] tracking-wider">Citations</span>
                    <span className="text-xs font-bold text-[#0e101a]">{audit.citation_count}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#707070] tracking-wider">References</span>
                    <span className="text-xs font-bold text-[#0e101a]">{audit.reference_count}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#ebebeb] text-xs">
                <span className="text-[#707070] font-medium">
                  {audit.word_count > 0 ? `${audit.word_count.toLocaleString()} words` : `${audit.audit_mode} mode`}
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-[#027e6f] group-hover:translate-x-0.5 transition-transform">
                  Load Report <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
