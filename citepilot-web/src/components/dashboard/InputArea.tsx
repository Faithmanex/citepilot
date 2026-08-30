"use client";

import { useRef, useState, useCallback } from "react";
import { UploadCloud, FileText, Trash2, Sparkles } from "lucide-react";

const ALLOWED_EXTENSIONS = [".docx", ".pdf", ".txt", ".rtf", ".bib"];

const SAMPLE_TEXT = `Abstract
Deep learning has driven major advances across artificial intelligence research (LeCun et al., 2015). Dimensionality reduction methods such as t-SNE remain widely used for visualising high-dimensional data (van der Maaten & Hinton, 2008).

References
LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521(7553), 436-444. https://doi.org/10.1038/nature14539
Van der Maaten, L., & Hinton, G. (2008). Visualizing data using t-SNE. Journal of Machine Learning Research, 9, 2579-2605.`;

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
    <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 mb-6 shadow-none">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-[#1f243c] uppercase tracking-wider font-mono">
          Document Input
        </h2>
        <button
          type="button"
          data-testid="load-sample-btn"
          onClick={handleLoadSample}
          className="text-xs font-bold text-[#027e6f] hover:text-[#02665a] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Load Sample
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload / Drop Zone */}
        <div
          className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
            isDragging
              ? "border-[#027e6f] bg-[#e6f4f2]"
              : hasFile
              ? "border-[#027e6f]/60 bg-[#e6f4f2]/40"
              : "border-[#d9d9d9] hover:border-[#027e6f]/60 bg-[#f5f5f5]"
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
              <FileText className="w-6 h-6 text-[#027e6f] mb-2" />
              <div className="text-xs font-bold text-[#0e101a]">File ready</div>
              <div className="text-[11px] text-[#707070] mt-0.5">Click to replace</div>
            </>
          ) : (
            <>
              <UploadCloud className="w-6 h-6 text-[#545454] mb-2" />
              <div className="text-xs font-bold text-[#0e101a]">
                Drop file or click to upload
              </div>
              <div className="text-[11px] text-[#707070] mt-0.5">
                PDF, DOCX, BIB, TXT — max 50 MB
              </div>
            </>
          )}

          {(hasFile || hasText) && (
            <button
              type="button"
              className="mt-3 text-xs font-bold text-[#b91c1c] hover:text-[#991b1b] flex items-center gap-1 cursor-pointer"
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
          className="w-full h-[140px] border border-[#d9d9d9] focus:border-[#027e6f] rounded-lg p-3 font-mono text-xs text-[#0e101a] resize-none outline-none bg-[#ffffff] placeholder:text-[#b7b7b7] transition-colors"
          value={pastedText}
          placeholder="Or paste manuscript text or reference list directly here…"
          onChange={(e) => {
            setPastedText(e.target.value);
            onTextChange(e.target.value);
          }}
        />
      </div>
    </div>
  );
}
