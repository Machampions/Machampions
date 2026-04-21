"use client";

import clsx from "clsx";
import { Eraser, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { PokemonSearch } from "./PokemonSearch";
import { MovesetPopover } from "./MovesetPopover";
import { TypePill } from "@/components/ui/TypePill";
import { POOL_SLOTS, BATTLE_SLOTS, useAppStore } from "@/stores/appStore";
import type { Pokemon } from "@/lib/types";
import type { Suggestion } from "@/hooks/useOpponentSuggestions";

interface Props {
  side: "my" | "opp";
  title: string;
  accent?: "primary" | "danger";
  suggestions?: Suggestion[];
  highlightedIndices?: number[] | null;
}

export function TeamPanel({
  side,
  title,
  accent = "primary",
  suggestions,
  highlightedIndices,
}: Props) {
  const pool = useAppStore((s) => (side === "my" ? s.myPool : s.oppPool));
  const battle = useAppStore((s) =>
    side === "my" ? s.myBattle : s.oppBattle,
  );
  const setSlot = useAppStore((s) => s.setSlot);
  const clearSide = useAppStore((s) => s.clearSide);
  const toggleBattle = useAppStore((s) => s.toggleBattle);
  const setBattle = useAppStore((s) => s.setBattle);
  const openDrawer = useAppStore((s) => s.openDrawer);
  const myMovesets = useAppStore((s) => s.myMovesets);
  const setMyMovesetMove = useAppStore((s) => s.setMyMovesetMove);
  const clearMyMoveset = useAppStore((s) => s.clearMyMoveset);

  const filled = pool.filter((p) => p).length;
  const canAdd = filled < POOL_SLOTS;

  const [movesetSlot, setMovesetSlot] = useState<number | null>(null);
  const movesetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openMoveset(slot: number) {
    if (movesetTimer.current) clearTimeout(movesetTimer.current);
    setMovesetSlot(slot);
  }
  function closeMoveset() {
    if (movesetTimer.current) clearTimeout(movesetTimer.current);
    movesetTimer.current = setTimeout(() => setMovesetSlot(null), 150);
  }

  function addPokemon(mon: Pokemon) {
    const idx = pool.findIndex((p) => p === null);
    if (idx === -1) return;
    setSlot(side, idx, mon);
  }

  const accentText = accent === "danger" ? "text-danger" : "text-primary";

  return (
    <section className="rounded-[10px] border border-border bg-surface flex flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <h3
          className={clsx(
            "font-mono text-[10px] font-semibold uppercase tracking-[1.5px]",
            accentText,
          )}
        >
          {title}
        </h3>
        <span className="font-mono text-[10px] text-muted">
          <span className={accentText}>{filled}</span>/{POOL_SLOTS}
        </span>
      </header>

      <div className="flex flex-col gap-2 p-[10px]">
        {canAdd && (
          <div className="relative z-30 rounded-[10px] border border-border bg-surface-2 p-2">
            <PokemonSearch
              onPick={addPokemon}
              placeholder={`Add to ${title}…`}
              suggestions={suggestions}
            />
          </div>
        )}

        {pool.map((mon, i) => {
          if (!mon) return null;
          const isBattle = battle.includes(i);
          const isHighlighted = !!highlightedIndices?.includes(i);
          const dim =
            !!highlightedIndices && highlightedIndices.length > 0 && !isHighlighted;
          const showMoveset = side === "my" && movesetSlot === i;

          return (
            <div
              key={`${mon.slug}-${i}`}
              style={{ position: "relative" }}
              onMouseEnter={side === "my" ? () => openMoveset(i) : undefined}
              onMouseLeave={side === "my" ? closeMoveset : undefined}
            >
              <PoolCard
                mon={mon}
                isBattle={isBattle}
                isHighlighted={isHighlighted}
                dim={dim}
                pickNumber={isBattle ? battle.indexOf(i) + 1 : null}
                accent={accent}
                onOpen={() => openDrawer(side, i)}
                onToggleBattle={() => toggleBattle(side, i)}
                onRemove={() => setSlot(side, i, null)}
              />
              {showMoveset && (
                <MovesetPopover
                  pokemon={mon}
                  slotIndex={i}
                  selected={
                    myMovesets[i] ?? [null, null, null, null]
                  }
                  onSelect={(moveIdx, moveName) =>
                    setMyMovesetMove(i, moveIdx, moveName)
                  }
                  onClear={() => clearMyMoveset(i)}
                  onMouseEnter={() => openMoveset(i)}
                  onMouseLeave={closeMoveset}
                  style={{
                    position: "absolute",
                    left: "calc(100% + 10px)",
                    top: 0,
                    width: 320,
                    zIndex: 60,
                  }}
                />
              )}
            </div>
          );
        })}

        {filled > 0 && (
          <div className="mt-1 flex items-center justify-between gap-2 px-1 pt-1 font-mono text-[10px] text-muted">
            <span>
              BATTLE{" "}
              <span className={accentText}>{battle.length}</span>/{BATTLE_SLOTS}
              {battle.length === 0 && (
                <span className="ml-2 text-dim">
                  (no picks — analysing all {filled})
                </span>
              )}
            </span>
            {battle.length > 0 && (
              <button
                type="button"
                onClick={() => setBattle(side, [])}
                className="hover:text-danger"
              >
                Clear battle
              </button>
            )}
          </div>
        )}

        {filled > 0 && (
          <button
            type="button"
            onClick={() => clearSide(side)}
            className="flex items-center justify-center gap-1 text-[11px] font-mono text-muted hover:text-danger"
          >
            <Eraser size={11} /> Clear pool
          </button>
        )}
      </div>
    </section>
  );
}

function PoolCard({
  mon,
  isBattle,
  isHighlighted,
  dim,
  pickNumber,
  accent,
  onOpen,
  onToggleBattle,
  onRemove,
}: {
  mon: Pokemon;
  isBattle: boolean;
  isHighlighted: boolean;
  dim: boolean;
  pickNumber: number | null;
  accent: "primary" | "danger";
  onOpen: () => void;
  onToggleBattle: () => void;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const accentColor =
    accent === "danger" ? "var(--color-danger)" : "var(--color-primary)";
  const accentSoft =
    accent === "danger"
      ? "var(--color-danger-soft)"
      : "var(--color-primary-soft)";

  const selected = isBattle || isHighlighted;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onToggleBattle}
      className={clsx(
        "group relative flex items-center gap-[10px] rounded-[10px] border p-[10px] cursor-pointer transition-all",
        "min-w-0",
      )}
      style={{
        background: selected ? accentSoft : "var(--color-surface-2)",
        borderColor: selected
          ? accentColor
          : hovered
            ? "var(--color-border-hi)"
            : "var(--color-border)",
        borderWidth: 1.5,
        opacity: dim ? 0.45 : 1,
      }}
    >
      {/* Sprite token */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        aria-label={`Details for ${mon.name}`}
        className="shrink-0"
      >
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: "var(--color-surface-2)",
            border: `1px solid ${selected ? accentColor : "var(--color-border-hi)"}`,
            boxShadow: selected ? `0 0 0 3px ${accentSoft}` : "none",
          }}
        >
          {mon.spriteUrl ? (
            <Image
              src={mon.spriteUrl}
              alt={mon.name}
              width={36}
              height={36}
              unoptimized
              className="h-9 w-9 [image-rendering:pixelated]"
            />
          ) : (
            <span className="text-xs font-semibold uppercase text-muted">
              {mon.name.slice(0, 2)}
            </span>
          )}
        </div>
      </button>

      {/* Name + types */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold leading-tight truncate">
          {mon.name}
        </div>
        <div className="mt-1 flex gap-1 flex-wrap">
          {mon.types.map((t) => (
            <TypePill key={t} type={t} size="xs" />
          ))}
        </div>
      </div>

      {/* Trailing affordance: X on hover, else pick number if battle */}
      {hovered ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${mon.name}`}
          className="shrink-0 h-[22px] w-[22px] inline-flex items-center justify-center rounded-full border hover:bg-danger hover:text-white hover:border-danger"
          style={{
            borderColor: "var(--color-border-hi)",
            color: "var(--color-muted)",
          }}
        >
          <X size={10} strokeWidth={2.2} />
        </button>
      ) : (
        pickNumber !== null && (
          <span
            className="shrink-0 inline-flex items-center justify-center font-mono font-bold text-[11px] text-white"
            style={{
              height: 20,
              width: 20,
              borderRadius: "50%",
              background: accentColor,
            }}
          >
            {pickNumber}
          </span>
        )
      )}
    </div>
  );
}
