"use client";

import { useEffect, useRef } from "react";
import { X, FileText } from "lucide-react";
import InputArea from "./InputArea";

interface ReplaceDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  onTextChange: (text: string) => void;
  onClear: () => void;
  hasFile: boolean;
  hasText: boolean;
  documentName?: string;
}

export default function ReplaceDocumentModal({
  isOpen,
  onClose,
  onFileSelect,
  onTextChange,
  onClear,
  hasFile,
  hasText,
  documentName,
}: ReplaceDocumentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="replace-document-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white border border-[#ebebeb] rounded-lg shadow-none max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ebebeb]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#e6f4f2] text-[#027e6f]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="replace-document-title"
                className="text-base font-extrabold text-[#0e101a] font-display"
              >
                Replace Manuscript or Edit Input
              </h2>
              {documentName && (
                <p className="text-xs text-[#707070] font-mono truncate max-w-md">
                  Current: {documentName}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#707070] hover:text-[#0e101a] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <InputArea
            onFileSelect={(file) => {
              onFileSelect(file);
              onClose();
            }}
            onTextChange={onTextChange}
            onClear={onClear}
            hasFile={hasFile}
            hasText={hasText}
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#ebebeb] bg-[#fafafa] rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#545454] hover:text-[#0e101a] hover:bg-[#ebebeb] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-[#027e6f] hover:bg-[#02665a] rounded-lg transition-all cursor-pointer shadow-none"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
