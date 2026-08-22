"use client";

import { useCallback, useState } from "react";
import type { AuditMode, AuditResponse, CitationStyle } from "@/lib/types";
import { runAudit } from "@/lib/api";
import { checkAuditEntitlement } from "@/lib/gating";
import { computeScore } from "@/lib/auditStats";

export interface ErrorModalState {
  visible: boolean;
  title: string;
  message: string;
}

interface UseAuditParams {
  text: string;
  file: File | null;
  style: CitationStyle;
  mode: AuditMode;
  documentName: string;
  isPro: boolean;
  user: { id: string } | null;
  showToast: (message: string) => void;
  onSuccess: (data: AuditResponse) => void;
  onUpgradeRequired: () => void;
}

export function useAudit({
  text,
  file,
  style,
  mode,
  documentName,
  isPro,
  user,
  showToast,
  onSuccess,
  onUpgradeRequired,
}: UseAuditParams) {
  const [progress, setProgress] = useState({
    visible: false,
    message: "Parsing document…",
    pct: 0,
  });
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    visible: false,
    title: "",
    message: "",
  });

  const runAuditFn = useCallback(async () => {
    const textVal = text.trim();
    if (!textVal && !file) {
      showToast("Please upload a document file or paste manuscript text.");
      return;
    }

    // Check tier gating for length & citations
    const entitlement = checkAuditEntitlement(textVal, isPro);
    if (!entitlement.allowed) {
      showToast(entitlement.reason || "Audit limit exceeded for Free plan.");
      onUpgradeRequired();
      return;
    }

    setProgress({ visible: true, message: "Parsing document structure…", pct: 25 });

    const formData = new FormData();
    if (file) formData.append("file", file);
    if (textVal) formData.append("text", textVal);
    formData.append("citation_style", style);
    formData.append("mode", mode);

    try {
      setProgress((p) => ({
        ...p,
        message: "Extracting citations & querying Crossref + OpenAlex…",
        pct: 65,
      }));
      const data = await runAudit(formData);
      onSuccess(data);
      setProgress({ visible: false, message: "Audit Complete!", pct: 100 });
      showToast("Manuscript audit completed successfully!");

      // Auto-save audit for authenticated users in the background
      if (user) {
        await saveAuditToHistory({
          documentName,
          style,
          mode,
          wordCount:
            entitlement.wordCount || textVal.split(/\s+/).filter(Boolean).length,
          citationCount: data.citations?.length || 0,
          referenceCount: data.references?.length || 0,
          score: computeScore(data),
          results: data,
        });
      }
    } catch (err) {
      setProgress({ visible: false, message: "", pct: 0 });
      const msg = (err as Error).message;
      showToast("Audit Error: " + msg);
      setErrorModal({
        visible: true,
        title: "Audit Execution Error",
        message: msg,
      });
    }
  }, [
    text,
    file,
    style,
    mode,
    documentName,
    isPro,
    user,
    showToast,
    onSuccess,
    onUpgradeRequired,
  ]);

  const closeErrorModal = useCallback(() => {
    setErrorModal((prev) => ({ ...prev, visible: false }));
  }, []);

  return { progress, errorModal, runAudit: runAuditFn, closeErrorModal };
}

interface SaveAuditPayload {
  documentName: string;
  style: CitationStyle;
  mode: AuditMode;
  wordCount: number;
  citationCount: number;
  referenceCount: number;
  score: number;
  results: AuditResponse;
}

async function saveAuditToHistory({
  documentName,
  style,
  mode,
  wordCount,
  citationCount,
  referenceCount,
  score,
  results,
}: SaveAuditPayload) {
  try {
    await fetch("/api/audits/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_name: documentName,
        citation_style: style,
        audit_mode: mode,
        word_count: wordCount,
        citation_count: citationCount,
        reference_count: referenceCount,
        score,
        results,
      }),
    });
  } catch (saveErr) {
    console.warn("Could not auto-save audit history:", saveErr);
  }
}
