import type { AuditResponse, CitationStyle, AuditMode } from "./types";

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:8000/api/v1";
  }
  return typeof window !== "undefined"
    ? `${window.location.origin}/api/v1`
    : "http://localhost:8000/api/v1";
}

export async function runAudit(
  formData: FormData
): Promise<AuditResponse> {
  const resp = await fetch(`${getApiBase()}/analyse`, {
    method: "POST",
    body: formData,
  });
  if (!resp.ok) {
    let errorMsg = "API server returned error";
    try {
      const errData = await resp.json();
      errorMsg = errData.detail || errData.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return resp.json();
}

export async function exportPdf(
  data: AuditResponse
): Promise<Blob> {
  const resp = await fetch(`${getApiBase()}/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    let errorMsg = "Export PDF failed";
    try {
      const errData = await resp.json();
      errorMsg = errData.detail || errData.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return resp.blob();
}

export async function exportDocx(
  text: string,
  analysisData: AuditResponse
): Promise<Blob> {
  const resp = await fetch(`${getApiBase()}/export/docx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, analysis_data: analysisData }),
  });
  if (!resp.ok) {
    let errorMsg = "Export DOCX failed";
    try {
      const errData = await resp.json();
      errorMsg = errData.detail || errData.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return resp.blob();
}
