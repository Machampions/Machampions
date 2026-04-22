"use client";

import { useAppStore } from "@/stores/appStore";

export function FormatToggle() {
  const teamSize = useAppStore((s) => s.teamSize);
  const setTeamSize = useAppStore((s) => s.setTeamSize);
  const isDoubles = teamSize === 4;
  const accent = isDoubles ? "var(--color-primary)" : "var(--color-text)";

  return (
    <button
      type="button"
      onClick={() => setTeamSize(isDoubles ? 3 : 4)}
      title={
        isDoubles
          ? "Doubles — click for Singles"
          : "Singles — click for Doubles"
      }
      className="inline-flex items-center gap-2 rounded-[7px] border border-border bg-surface-2 px-[10px] py-[5px] transition-colors hover:border-border-hi"
      style={{ color: "var(--color-text)" }}
    >
      <span className="inline-flex items-center gap-[2px]">
        <Pokeball color={accent} />
        {isDoubles && <Pokeball color={accent} />}
      </span>
      <span
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.5px]"
        style={{ color: accent }}
      >
        {isDoubles ? "doubles" : "singles"}
      </span>
    </button>
  );
}

function Pokeball({ color }: { color: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle
        cx="10"
        cy="10"
        r="8.5"
        fill={color}
        fillOpacity="0.12"
        stroke={color}
        strokeWidth="1.4"
      />
      <path d="M1.5 10H18.5" stroke={color} strokeWidth="1.4" />
      <circle
        cx="10"
        cy="10"
        r="2.2"
        fill="var(--color-surface)"
        stroke={color}
        strokeWidth="1.4"
      />
    </svg>
  );
}
