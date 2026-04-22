"use client";

import { useEffect, useRef } from "react";

interface Props {
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
  labelledBy?: string;
}

export function Modal({ onClose, width = 480, children, labelledBy }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prevActive?.focus?.();
    };
  }, []);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{
        background: "color-mix(in srgb, var(--color-bg) 20%, rgba(0,0,0,0.45))",
        backdropFilter: "blur(3px)",
        animation: "mc-fade-in 0.12s",
      }}
    >
      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className="rounded-[12px] border border-border-hi bg-surface outline-none"
        style={{
          width,
          maxWidth: "100%",
          boxShadow: "0 16px 48px rgba(0,0,0,0.16)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  subtitle,
  onClose,
  titleId,
}: {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  titleId?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-[18px] py-[14px]">
      <div className="min-w-0 flex-1">
        <div id={titleId} className="text-sm font-semibold truncate">
          {title}
        </div>
        {subtitle && (
          <div className="font-mono text-[10px] text-muted tracking-[0.5px] mt-0.5 truncate">
            {subtitle}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="shrink-0 bg-transparent text-[18px] leading-none text-muted hover:text-text p-1"
      >
        ×
      </button>
    </div>
  );
}
