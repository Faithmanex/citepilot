"use client";

import { useRef, useState, useCallback } from "react";
import { UploadCloud, FileText, Trash2, AlertCircle } from "lucide-react";
import {
  MAX_TEXT_CHARS,
  MAX_UPLOAD_MB,
  SUPPORTED_FORMAT_LABEL,
  countDocumentWords,
  fileExtension,
  validateSelectedFile,
  validateText,
} from "@/lib/inputLimits";

interface InputAreaProps {
  /** Current manuscript text, owned by the dashboard. */
  text: string;
  fileName: string | null;
  onFileSelect: (file: File) => void;
  onTextChange: (text: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export default function InputArea({
  text,
  fileName,
  onFileSelect,
  onTextChange,
  onClear,
  disabled = false,
}: InputAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFile = Boolean(fileName);
  const hasText = Boolean(text.trim());
  const words = countDocumentWords(text);
  const nearLimit = text.length > MAX_TEXT_CHARS * 0.8;

  const handleFileChange = useCallback(
    (file: File) => {
      const validation = validateSelectedFile(file);
      if (!validation.ok) {
        setError(validation.error || "That file cannot be used.");
        return;
      }
      setError(null);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFileChange(file);
    },
    [disabled, handleFileChange]
  );

  const handleTextChange = useCallback(
    (value: string) => {
      const validation = validateText(value);
      setError(validation.ok ? null : validation.error || null);
      onTextChange(value);
    },
    [onTextChange]
  );

  return (
    <div className="bg-[#ffffff] border border-[#d9cfb8] rounded-lg p-5 mb-6 shadow-none">
      <div className="mb-3">
        <h2 className="text-xs font-bold text-[#14181f] uppercase tracking-wider font-mono">
          Add your document
        </h2>
        <p id="input-help" className="text-[11px] text-[#5c5344] mt-1">
          {SUPPORTED_FORMAT_LABEL}, up to {MAX_UPLOAD_MB} MB or{" "}
          {MAX_TEXT_CHARS.toLocaleString()} characters of pasted text. The most
          recent input is the one that gets analysed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload / drop zone — the visible target is a real button. */}
        <div
          className={`border border-dashed rounded-lg p-4 text-center transition-all flex flex-col items-center justify-center min-h-[150px] ${
            isDragging
              ? "border-[#2c3e8c] bg-[#e7e9f5]"
              : hasFile
                ? "border-[#2c3e8c] bg-[#e7e9f5]/40"
                : "border-[#8f836c] bg-[#faf6ec]"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            id="manuscript-file"
            type="file"
            className="sr-only"
            accept={".docx,.pdf,.txt,.rtf,.bib"}
            tabIndex={-1}
            aria-hidden="true"
            disabled={disabled}
            onChange={(e) => {
              if (e.target.files?.length) handleFileChange(e.target.files[0]);
              // Allow re-selecting the same file after a validation error.
              e.target.value = "";
            }}
          />

          {hasFile ? (
            <>
              <FileText className="w-6 h-6 text-[#2c3e8c] mb-2" aria-hidden="true" />
              <p className="text-xs font-bold text-[#221d16] break-all px-2">
                Selected file: {fileName}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                aria-describedby="input-help"
                className="mt-2 text-xs font-bold text-[#2c3e8c] underline min-h-11 px-3 rounded-lg hover:bg-[#e7e9f5] transition-colors cursor-pointer disabled:opacity-50"
              >
                Choose a different file
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              aria-describedby="input-help upload-formats"
              className="flex flex-col items-center justify-center gap-1 w-full min-h-[110px] rounded-lg cursor-pointer disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c3e8c]"
            >
              <UploadCloud className="w-6 h-6 text-[#5c5344] mb-1" aria-hidden="true" />
              <span className="text-xs font-bold text-[#221d16]">
                Choose a file to upload
              </span>
              <span id="upload-formats" className="text-[11px] text-[#5c5344] mt-0.5">
                or drag and drop it here
              </span>
            </button>
          )}

          {(hasFile || hasText) && (
            <button
              type="button"
              className="mt-3 text-xs font-bold text-[#a32b21] hover:text-[#7d1f18] flex items-center gap-1 min-h-11 px-2 cursor-pointer"
              onClick={onClear}
            >
              <Trash2 className="w-3 h-3" aria-hidden="true" />
              Clear document
            </button>
          )}
        </div>

        {/* Paste textarea — permanently labelled and described. */}
        <div className="flex flex-col">
          <label
            htmlFor="manuscript-text"
            className="text-[11px] font-bold text-[#5c5344] mb-1"
          >
            Paste manuscript text or a reference list
          </label>
          <textarea
            id="manuscript-text"
            aria-describedby="input-help text-counter"
            className="w-full flex-1 min-h-[110px] border border-[#8f836c] focus:border-[#2c3e8c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c3e8c] rounded-lg p-3 font-mono text-xs text-[#221d16] resize-none bg-[#ffffff] placeholder:text-[#6b6152] transition-colors"
            value={text}
            disabled={disabled}
            placeholder="Paste manuscript text or reference list here…"
            onChange={(e) => handleTextChange(e.target.value)}
          />
          <p
            id="text-counter"
            className={`text-[11px] mt-1 font-mono ${
              nearLimit ? "text-[#a32b21]" : "text-[#5c5344]"
            }`}
          >
            {text.length.toLocaleString()} / {MAX_TEXT_CHARS.toLocaleString()} characters
            {words > 0 ? ` · ~${words.toLocaleString()} words` : ""}
          </p>
        </div>
      </div>

      <div aria-live="assertive" className="min-h-0">
        {error && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 text-xs font-semibold text-[#a32b21] bg-[#f3dcd6] border border-[#ddb3aa] rounded-lg p-2.5"
          >
            <AlertCircle className="w-4 h-4 flex-none mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>

      {/* Explicitly state which source will be analysed. */}
      <p className="mt-3 text-[11px] text-[#5c5344]">
        <span className="font-bold">Will be analysed:</span>{" "}
        {hasText
          ? "the pasted text"
          : hasFile
            ? `the selected file (${fileName})`
            : "nothing yet"}
        {hasText && hasFile && fileName
          ? " — the file selection will be ignored because pasted text takes precedence."
          : ""}
      </p>
      {hasFile && fileName && !hasText && fileExtension(fileName) === ".bib" && (
        <p className="mt-1 text-[11px] text-[#5c5344]">
          BibTeX entries are read as a reference list. Switch the audit scope to
          “References only” for a reference-list audit.
        </p>
      )}
    </div>
  );
}
