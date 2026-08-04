"use client";

import { useRef, useState, useCallback } from "react";
import { UploadCloud, FileText, Trash2, Sparkles } from "lucide-react";

const ALLOWED_EXTENSIONS = [".docx", ".pdf", ".txt", ".rtf", ".bib"];

const SAMPLE_TEXT = `Abstract
Recent advancements in deep learning have transformed biomedical research (Smith et al., 2021). However, citation integrity remains a critical issue in academic literature (Johnson & Lee, 2019).

References
Smith, J., Davis, R., & Taylor, M. (2021). Neural Networks in Genomics. Nature Biotechnology, 39(4), 450-462.
Johnson, K., & Lee, S. (2019). Citation Accuracy in Modern Publishing. Journal of Academic Integrity, 12(2), 115-130.`;

interface InputAreaProps {
  onFileSelect: (file: File) => void;
  onTextChange: (text: string) => void;
  onClear: () => void;
  hasFile: boolean;
  hasText: boolean;
}

export default function InputArea({
  onFileSelect,
  onTextChange,
  onClear,
  hasFile,
  hasText,
}: InputAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pastedText, setPastedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback(
    (file: File) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) return;
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileChange(file);
    },
    [handleFileChange]
  );

  const handleLoadSample = useCallback(() => {
    setPastedText(SAMPLE_TEXT);
    onTextChange(SAMPLE_TEXT);
  }, [onTextChange]);

  const handleClearInternal = useCallback(() => {
    setPastedText("");
    onClear();
  }, [onClear]);

  return (
    <div className="bg-[#FAF6EC] border border-[#C7BC9F] rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-[#353027] uppercase tracking-wider font-mono">
          Document Input
        </h2>
        <button
          type="button"
          onClick={handleLoadSample}
          className="text-xs font-bold text-[#1E5E4B] hover:text-[#285235] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Load Sample
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload / Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
            isDragging
              ? "border-[#1E5E4B] bg-[#DEE8DD]/60"
              : hasFile
              ? "border-[#1E5E4B]/50 bg-[#DEE8DD]/40"
              : "border-[#C7BC9F] hover:border-[#1E5E4B]/60 bg-[#F1EBDC]"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".docx,.pdf,.txt,.rtf,.bib"
            onChange={(e) => {
              if (e.target.files?.length) handleFileChange(e.target.files[0]);
            }}
          />

          {hasFile ? (
            <>
              <FileText className="w-6 h-6 text-[#1E5E4B] mb-2" />
              <div className="text-xs font-bold text-[#221D16]">File ready</div>
              <div className="text-[11px] text-[#696050] mt-0.5">Click to replace</div>
            </>
          ) : (
            <>
              <UploadCloud className="w-6 h-6 text-[#696050] mb-2" />
              <div className="text-xs font-bold text-[#221D16]">
                Drop file or click to upload
              </div>
              <div className="text-[11px] text-[#696050] mt-0.5">
                PDF, DOCX, BIB, TXT — max 50 MB
              </div>
            </>
          )}

          {(hasFile || hasText) && (
            <button
              type="button"
              className="mt-3 text-xs font-bold text-[#961E14] hover:text-[#7a1810] flex items-center gap-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleClearInternal();
              }}
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* Paste textarea */}
        <textarea
          className="w-full h-[140px] border border-[#C7BC9F] focus:border-[#1E5E4B] rounded-xl p-3 font-mono text-xs text-[#221D16] resize-none outline-none bg-[#F1EBDC] placeholder:text-[#C7BC9F] transition-colors"
          value={pastedText}
          placeholder="Or paste manuscript text / bibliography directly here…"
          onChange={(e) => {
            setPastedText(e.target.value);
            onTextChange(e.target.value);
          }}
        />
      </div>
    </div>
  );
}
