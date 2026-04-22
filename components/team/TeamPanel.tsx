"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { MovesetPopover } from "./MovesetPopover";
import { TypePill } from "@/components/ui/TypePill";
import { POOL_SLOTS, useAppStore } from "@/stores/appStore";
import type { Pokemon } from "@/lib/types";

interface Props {
  side: "my" | "opp";
  title: string;
  accent?: "primary" | "danger";
  highlightedIndices?: number[] | null;
  onAdd: () => void;
  onImport?: () => void;
}

export function TeamPanel({
  side,
  title,
  accent = "primary",
  highlightedIndices,
  onAdd,
  onImport,
}: Props) {
  const pool = useAppStore((s) => (side === "my" ? s.myPool : s.oppPool));
  const battle = useAppStore((s) =>
    side === "my" ? s.myBattle : s.oppBattle,
  );
  const setSlot = useAppStore((s) => s.setSlot);
  const clearSide = useAppStore((s) => s.clearSide);
  const toggleBattle = useAppStore((s) => s.toggleBattle);
  const openDrawer = useAppStore((s) => s.openDrawer);
  const myMovesets = useAppStore((s) => s.myMovesets);
  const setMyMovesetMove = useAppStore((s) => s.setMyMovesetMove);
  const clearMyMoveset = useAppStore((s) => s.clearMyMoveset);
  const hoveredLineupIndices = useAppStore((s) =>
    side === "my" ? s.hoveredLineup?.my ?? null : s.hoveredLineup?.opp ?? null,
  );
  const activeHighlightedIndices = highlightedIndices ?? hoveredLineupIndices;

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

  const accentText = accent === "danger" ? "text-danger" : "text-primary";

  return (
    <section className="flex flex-col rounded-[10px] border border-border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
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
        </div>
        <button
          type="button"
          onClick={() => clearSide(side)}
          disabled={filled === 0}
          className="rounded border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[1px] text-muted transition-colors hover:border-border-hi hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear All
        </button>
      </header>

      <div className="flex flex-col gap-2 p-[10px]">
        {pool.map((mon, i) => {
          if (!mon) return null;
          const isBattle = battle.includes(i);
          const isHighlighted = !!activeHighlightedIndices?.includes(i);
          const dim =
            !!activeHighlightedIndices &&
            activeHighlightedIndices.length > 0 &&
            !isHighlighted;
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
                  selected={myMovesets[i] ?? [null, null, null, null]}
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
                    width: 280,
                    zIndex: 60,
                  }}
                />
              )}
            </div>
          );
        })}

        {canAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="mt-[2px] flex w-full items-center justify-center gap-[6px] rounded-[10px] border border-dashed border-border-hi bg-transparent p-[10px] text-[12px] text-muted hover:text-text hover:border-primary transition-colors"
          >
            <span className="text-[14px] leading-none">+</span> Add creature
          </button>
        )}
        {onImport && (
          <button
            type="button"
            onClick={onImport}
            className="flex w-full items-center justify-center gap-[6px] rounded-[10px] border border-border bg-transparent p-[10px] text-[12px] text-muted hover:text-text hover:border-border-hi transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M8 1v10M4 7l4 4 4-4M2 14h12" />
            </svg>
            Import team
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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggleBattle();
        }
      }}
      className={clsx(
        "group relative flex min-w-0 cursor-pointer items-center gap-[10px] rounded-[10px] p-[10px] transition-all",
      )}
      style={{
        background: selected ? accentSoft : "var(--color-surface-2)",
        borderStyle: "solid",
        borderWidth: 1.5,
        borderColor: selected
          ? accentColor
          : hovered
            ? "var(--color-border-hi)"
            : "var(--color-border)",
        opacity: dim ? 0.45 : 1,
      }}
    >
      {/* Sprite */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        aria-label={`Details for ${mon.name}`}
        className="flex h-14 w-14 shrink-0 items-center justify-center"
      >
        {mon.spriteUrl ? (
          <Image
            src={mon.spriteUrl}
            alt={mon.name}
            width={56}
            height={56}
            unoptimized
            className="h-14 w-14 [image-rendering:pixelated]"
          />
        ) : (
          <span className="text-sm font-semibold uppercase text-muted">
            {mon.name.slice(0, 2)}
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="truncate text-[13px] font-semibold leading-tight">
          {mon.name}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {mon.types.map((t) => (
            <TypePill key={t} type={t} size="xs" />
          ))}
        </div>
      </div>

      {hovered ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${mon.name}`}
          className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border bg-transparent hover:border-danger hover:bg-danger hover:text-white"
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
            className="inline-flex shrink-0 items-center justify-center font-mono text-[11px] font-bold leading-none text-white"
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
