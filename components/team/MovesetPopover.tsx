"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { TypePill } from "@/components/ui/TypePill";
import type { Pokemon, PokemonMove } from "@/lib/types";

interface Props {
  pokemon: Pokemon;
  slotIndex: number;
  selected: (string | null)[];
  onSelect: (moveIdx: number, moveName: string | null) => void;
  onClear: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  style?: React.CSSProperties;
}

export function MovesetPopover({
  pokemon,
  selected,
  onSelect,
  onClear,
  onMouseEnter,
  onMouseLeave,
  style,
}: Props) {
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  // Reset the open slot whenever the pokemon changes (different pool card hovered).
  useEffect(() => {
    setEditingSlot(null);
  }, [pokemon.slug]);

  const selectedMoves = selected
    .map((moveName) =>
      moveName
        ? pokemon.moves.find(
            (move) => move.name.toLowerCase() === moveName.toLowerCase(),
          )
        : undefined,
    )
    .filter((move): move is PokemonMove => !!move);

  const offensiveTypes = Array.from(
    new Set(
      selectedMoves
        .filter((move) => move.damageClass !== "status")
        .map((move) => move.type),
    ),
  );

  const usedNames = new Set(
    selected.filter((n): n is string => !!n).map((n) => n.toLowerCase()),
  );

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="rounded-[10px] border border-border-hi bg-surface p-3 shadow-xl"
      style={{
        animation: "mc-fade-in 0.12s ease-out",
        ...style,
      }}
    >
      <div className="mb-[10px] flex items-center gap-[10px] border-b border-border pb-[10px]">
        {pokemon.spriteUrl ? (
          <Image
            src={pokemon.spriteUrl}
            alt={pokemon.name}
            width={32}
            height={32}
            className="h-8 w-8 [image-rendering:pixelated]"
            unoptimized
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-surface-2" />
        )}
        <div className="flex-1 min-w-0">
          <div className="truncate text-[13px] font-semibold">
            {pokemon.name}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[1px] text-muted mt-0.5">
            moveset · click to swap
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] text-muted hover:text-danger"
        >
          Clear
        </button>
      </div>

      <div className="flex flex-col gap-[5px]">
        {Array.from({ length: 4 }, (_, i) => {
          const slotName = selected[i] ?? null;
          const slotMove = slotName
            ? pokemon.moves.find(
                (m) => m.name.toLowerCase() === slotName.toLowerCase(),
              ) ?? null
            : null;
          const isEditing = editingSlot === i;
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => setEditingSlot(isEditing ? null : i)}
                className="w-full"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  background: isEditing
                    ? "var(--color-primary-soft)"
                    : "var(--color-surface-2)",
                  border: `1px solid ${
                    isEditing ? "var(--color-primary)" : "var(--color-border)"
                  }`,
                  borderRadius: 6,
                  minWidth: 0,
                  cursor: "pointer",
                  color: "var(--color-text)",
                  transition: "all 0.12s",
                }}
              >
                <span
                  className="font-mono text-[9px] text-dim"
                  style={{ width: 14, flexShrink: 0 }}
                >
                  M{i + 1}
                </span>
                <span
                  className="flex-1 truncate text-left text-[12px] font-medium"
                  style={{ color: slotMove ? undefined : "var(--color-muted)" }}
                >
                  {slotMove?.name ?? "— empty —"}
                </span>
                {slotMove && <TypePill type={slotMove.type} size="xs" />}
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="var(--color-muted)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    flexShrink: 0,
                    transform: isEditing ? "rotate(180deg)" : "none",
                    transition: "transform 0.12s",
                  }}
                >
                  <path d="M2 4l3 3 3-3" />
                </svg>
              </button>
              {isEditing && (
                <MoveSearchPanel
                  moves={pokemon.moves}
                  currentName={slotName}
                  usedNames={usedNames}
                  onPick={(moveName) => {
                    onSelect(i, moveName);
                    setEditingSlot(null);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex min-h-4 flex-wrap gap-1">
        {offensiveTypes.map((t, idx) => (
          <TypePill key={`${t}-${idx}`} type={t} size="xs" />
        ))}
        {selectedMoves.length > 0 && offensiveTypes.length === 0 && (
          <span className="text-[10px] text-muted">
            Only status moves — no offensive coverage applied.
          </span>
        )}
        {selectedMoves.length === 0 && (
          <span className="text-[10px] text-muted">
            No moves selected — using usage/STAB fallback.
          </span>
        )}
      </div>
    </div>
  );
}

function MoveSearchPanel({
  moves,
  currentName,
  usedNames,
  onPick,
}: {
  moves: PokemonMove[];
  currentName: string | null;
  usedNames: Set<string>;
  onPick: (name: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return moves
      .filter((m) => {
        if (currentName && m.name.toLowerCase() === currentName.toLowerCase())
          return false;
        if (
          usedNames.has(m.name.toLowerCase()) &&
          m.name.toLowerCase() !== currentName?.toLowerCase()
        )
          return false;
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) || m.type.toLowerCase().includes(q)
        );
      })
      .slice(0, 40);
  }, [moves, query, currentName, usedNames]);

  return (
    <div
      className="mt-1 flex flex-col gap-1 rounded-md border border-border bg-bg p-[6px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-[6px] rounded border border-border bg-surface px-[6px] py-[4px]">
        <svg
          width="11"
          height="11"
          viewBox="0 0 12 12"
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="5" cy="5" r="3.2" />
          <path d="M7.4 7.4L10 10" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search moves…"
          className="min-w-0 flex-1 bg-transparent p-0 text-[11px] text-text outline-none placeholder:text-muted"
        />
        {currentName && (
          <button
            type="button"
            onClick={() => onPick(null)}
            className="text-[10px] text-muted hover:text-danger"
            title="Clear this slot"
          >
            clear
          </button>
        )}
      </div>
      <div
        className="flex max-h-[180px] flex-col gap-[2px] overflow-y-auto"
        role="listbox"
      >
        {filtered.length === 0 && (
          <div className="px-[6px] py-2 text-center text-[11px] text-muted">
            No moves match &ldquo;{query}&rdquo;
          </div>
        )}
        {filtered.map((m) => (
          <button
            key={m.name}
            type="button"
            onClick={() => onPick(m.name)}
            className="flex items-center gap-2 rounded border border-transparent px-[6px] py-[5px] text-left transition-colors hover:border-border hover:bg-surface-2"
          >
            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-text">
              {m.name}
            </span>
            <TypePill type={m.type} size="xs" />
            <span className="font-mono text-[9px] uppercase text-muted">
              {m.damageClass.slice(0, 3)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
