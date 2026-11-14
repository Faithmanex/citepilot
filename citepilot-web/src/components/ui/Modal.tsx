"use client";

import React, { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Accessible dialog name. Rendered visually unless `hideTitle`. */
  title: React.ReactNode;
  /** Optional description announced with the dialog. */
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Element id that receives focus first. Falls back to the first control. */
  initialFocusId?: string;
  /** Allows Escape to dismiss. Defaults to true. */
  closeOnEscape?: boolean;
  /** Allows a backdrop click to dismiss. Defaults to true. */
  dismissOnBackdrop?: boolean;
  hideCloseButton?: boolean;
  className?: string;
  bodyClassName?: string;
}

/**
 * Shared accessible overlay.
 *
 * - moves focus into the dialog on open
 * - keeps Tab/Shift+Tab inside it
 * - closes on Escape (unless disabled) and restores focus to the trigger
 * - makes the app shell inert and prevents background scrolling while open
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  initialFocusId,
  closeOnEscape = true,
  dismissOnBackdrop = true,
  hideCloseButton = false,
  className = "",
  bodyClassName = "",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  // Keep the latest close handler without re-running the focus/scroll effect
  // on every parent render (inline handlers change identity each time).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const focusFirst = useCallback(() => {
    if (initialFocusId) {
      const target = document.getElementById(initialFocusId);
      if (target) {
        target.focus();
        return;
      }
    }
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(FOCUSABLE)
    );
    // Prefer the first real control over the close affordance.
    const preferred =
      focusable.find((el) => !el.hasAttribute("data-modal-close")) ||
      focusable[0];
    if (preferred) preferred.focus();
    else {
      dialog.tabIndex = -1;
      dialog.focus();
    }
  }, [initialFocusId]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const shell = document.getElementById("app-shell");
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    // Prevent background scrolling without a layout jump from the scrollbar.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Modal overlays make the rest of the document inert for assistive tech
    // and for pointer/keyboard users alike.
    if (shell) {
      shell.setAttribute("inert", "");
      shell.setAttribute("aria-hidden", "true");
    }

    const raf = requestAnimationFrame(focusFirst);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      if (shell) {
        shell.removeAttribute("inert");
        shell.removeAttribute("aria-hidden");
      }
      previouslyFocused?.focus?.();
    };
  }, [open, closeOnEscape, focusFirst]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#221d16]/60 backdrop-blur-sm animate-fade-in motion-reduce:animate-none"
      onMouseDown={(event) => {
        if (dismissOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`relative bg-[#ffffff] border border-[#d9cfb8] rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-none ${className}`.trim()}
      >
        <div className={bodyClassName || "p-6 sm:p-8"}>
          <h2
            id={titleId}
            className="text-lg font-extrabold text-[#221d16] font-display pr-8"
          >
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="text-sm text-[#5c5344] mt-1">
              {description}
            </p>
          )}
          {!hideCloseButton && (
            <button
              type="button"
              onClick={onClose}
              data-modal-close=""
              className="absolute top-4 right-4 text-[#6b6152] hover:text-[#221d16] transition-colors p-1.5 rounded-lg hover:bg-[#faf6ec]"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
          <div className={description ? "mt-4" : "mt-4"}>{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
