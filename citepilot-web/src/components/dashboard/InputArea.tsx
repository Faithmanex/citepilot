"use client";

import { useRef, useState, useCallback } from "react";

const ALLOWED_EXTENSIONS = [".docx", ".pdf", ".txt", ".rtf"];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

interface InputAreaProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onFileSelect: (file: File) => void;
  onTextChange: (text: string) => void;
  onClear: () => void;
  hasFile: boolean;
  hasText: boolean;
}

export default function InputArea({
  collapsed,
  onToggleCollapse,
  onFileSelect,
  onTextChange,
  onClear,
  hasFile,
  hasText,
}: InputAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = useCallback((file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const validExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (!validExt) {
      alert(
        `Invalid file type: ${file.name}. Only .docx, .pdf, .txt, .rtf are allowed.`
      );
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(
        `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed is 50MB.`
      );
      return false;
    }
    return true;
  }, []);

  const handleFileChange = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        onFileSelect(file);
      }
    },
    [validateFile, onFileSelect]
  );

  if (collapsed) return null;

  return (
    <div
      className="bg-card border-2 border-line rounded-md p-4 sm:p-5 mb-5 transition-all duration-300 ease"
      id="input-section"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-5">
        <div
          className={`border-2 ${
            dragOver ? "border-brand" : "border-dashed border-line"
          } rounded-md p-7.5 text-center cursor-pointer transition-colors duration-150 ease bg-dash-paper`}
          id="drop-box"
          tabIndex={0}
          role="button"
          aria-label="Upload document file (.docx, .pdf, .txt)"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            dragCounter.current++;
            setDragOver(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            e.preventDefault();
            dragCounter.current--;
            if (dragCounter.current <= 0) {
              dragCounter.current = 0;
              setDragOver(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            dragCounter.current = 0;
            setDragOver(false);
            if (e.dataTransfer.files.length) {
              handleFileChange(e.dataTransfer.files[0]);
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            accept=".docx,.pdf,.txt,.rtf"
            onChange={(e) => {
              if (e.target.files?.length) handleFileChange(e.target.files[0]);
            }}
          />
          <i
            className="fas fa-file-upload text-[28px] text-dash-ink-faint mb-2.5"
            aria-hidden="true"
          />
          <div className="font-bold mb-1" id="drop-box-title">
            Upload Document
          </div>
          <div className="text-xs text-dash-ink-faint" id="drop-box-subtitle">
            Drag & drop .docx, .pdf, or .txt file here
          </div>
          {(hasFile || hasText) && (
            <button
              type="button"
              className="link-btn mt-2.5 px-3 py-1 text-xs min-h-[32px]"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              aria-label="Remove selected file"
            >
              <i className="fas fa-times" aria-hidden="true" /> Remove file
            </button>
          )}
        </div>

        <div>
          <label
            htmlFor="paste-text"
            className="text-xs font-bold text-dash-ink-faint mb-1.5 block font-mono"
          >
            OR PASTE TEXT DIRECTLY
          </label>
          <textarea
            className="w-full h-[140px] border-2 border-line rounded-md p-3 font-mono text-[12.5px] text-dash-ink resize-none outline-none bg-dash-paper"
            id="paste-text"
            placeholder="Paste your research manuscript or reference list text here..."
            aria-label="Paste Document Text"
            onChange={(e) => onTextChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
