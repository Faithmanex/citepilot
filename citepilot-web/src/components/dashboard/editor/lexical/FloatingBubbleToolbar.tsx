"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import { Bold, Italic, Code, Strikethrough, Sparkles } from "lucide-react";

interface FloatingBubbleToolbarProps {
  onInspectSelection?: (selectedText: string) => void;
}

export function FloatingBubbleToolbar({ onInspectSelection }: FloatingBubbleToolbarProps) {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection) && !selection.isCollapsed()) {
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) {
        setIsVisible(false);
        return;
      }

      const text = selection.getTextContent();
      setSelectedText(text);

      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsCode(selection.hasFormat("code"));

      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Position bubble above the selection range
      const top = rect.top + window.scrollY - 44;
      const left = Math.max(16, rect.left + window.scrollX + rect.width / 2);

      setPosition({ top, left });
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          updateToolbar();
        });
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    const handleScrollOrResize = () => {
      if (isVisible) {
        editor.getEditorState().read(() => {
          updateToolbar();
        });
      }
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [editor, isVisible, updateToolbar]);

  if (typeof document === "undefined" || !isVisible) {
    return null;
  }

  return createPortal(
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Floating Formatting Toolbar"
      data-testid="lexical-floating-toolbar"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
      className="fixed z-50 flex items-center gap-1 px-1.5 py-1 bg-[#0e101a] text-white rounded-lg shadow-xl border border-neutral-700/80 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <button
        type="button"
        title="Bold (Ctrl+B)"
        onClick={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        className={[
          "p-1.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer",
          isBold ? "bg-neutral-800 text-[#027e6f]" : "text-neutral-300",
        ].join(" ")}
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Italic (Ctrl+I)"
        onClick={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        className={[
          "p-1.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer",
          isItalic ? "bg-neutral-800 text-[#027e6f]" : "text-neutral-300",
        ].join(" ")}
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Inline Code"
        onClick={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
        }}
        className={[
          "p-1.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer",
          isCode ? "bg-neutral-800 text-[#027e6f]" : "text-neutral-300",
        ].join(" ")}
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="Strikethrough"
        onClick={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
        className="p-1.5 rounded text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      {onInspectSelection && selectedText && (
        <>
          <div className="w-px h-4 bg-neutral-700 mx-0.5" />
          <button
            type="button"
            title="Inspect Claims & Citations"
            onClick={(e) => {
              e.preventDefault();
              onInspectSelection(selectedText);
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-[#027e6f]/30 text-[#4bd5c3] hover:bg-[#027e6f]/50 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Audit Selection</span>
          </button>
        </>
      )}
    </div>,
    document.body
  );
}
