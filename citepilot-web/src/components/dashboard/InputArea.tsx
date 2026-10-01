"use client";

import { useRef, useState, useCallback } from "react";
import { UploadCloud, FileText, Trash2 } from "lucide-react";

const ALLOWED_EXTENSIONS = [".docx", ".pdf", ".txt", ".rtf", ".bib"];

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

  const handleClearInternal = useCallback(() => {
    setPastedText("");
    onClear();
  }, [onClear]);

  return (
    <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 mb-6 shadow-none">
      <div className="mb-4">
        <h2 className="text-xs font-bold text-[#14181f] uppercase tracking-wider font-mono">
          Add your document
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload / Drop Zone */}
        <div
          className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
            isDragging
              ? "border-[#2c3e8c] bg-[#e7e9f5]"
              : hasFile
              ? "border-[#2c3e8c]/60 bg-[#e7e9f5]/40"
              : "border-[#d9cfb8] hover:border-[#2c3e8c]/60 bg-[#faf6ec]"
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
              <FileText className="w-6 h-6 text-[#2c3e8c] mb-2" />
              <div className="text-xs font-bold text-[#221d16]">File ready</div>
              <div className="text-[11px] text-[#948a76] mt-0.5">Click to replace</div>
            </>
          ) : (
            <>
              <UploadCloud className="w-6 h-6 text-[#5c5344] mb-2" />
              <div className="text-xs font-bold text-[#221d16]">
                Drop file or click to upload
              </div>
              <div className="text-[11px] text-[#948a76] mt-0.5">
                PDF, DOCX, BIB, or TXT
              </div>
            </>
          )}

          {(hasFile || hasText) && (
            <button
              type="button"
              className="mt-3 text-xs font-bold text-[#a32b21] hover:text-[#991b1b] flex items-center gap-1 cursor-pointer"
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
          className="w-full h-[140px] border border-[#d9cfb8] focus:border-[#2c3e8c] rounded-lg p-3 font-mono text-xs text-[#221d16] resize-none outline-none bg-[#ffffff] placeholder:text-[#d9cfb8] transition-colors"
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
