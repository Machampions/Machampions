"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useAppStore } from "@/stores/appStore";
import type { LineupRecommendation } from "@/lib/analysis";

interface Props {
  onHover?: (hover: { mine: number[]; opp: number[] } | null) => void;
}

export function RecommendationPanel({ onHover }: Props) {
  const { picks } = useRecommendations();
  const myPool = useAppStore((s) => s.myPool);
  const oppPool = useAppStore((s) => s.oppPool);
  const myBattle = useAppStore((s) => s.myBattle);
  const oppBattle = useAppStore((s) => s.oppBattle);
  const setBattle = useAppStore((s) => s.setBattle);

  const myCount = myPool.filter((p) => p).length;
  const oppCount = oppPool.filter((p) => p).length;

  const sameSet = (a: number[], b: number[]) =>
    a.length === b.length && a.every((x) => b.includes(x));

  return (
    <section className="rounded-[10px] border border-border bg-surface overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[1.5px] text-text">
          Recommended Lineups
        </h3>
        <span className="font-mono text-[10px] text-muted">
          top {picks.length} · click to apply
        </span>
      </header>

      <div className="flex flex-col gap-2 p-[10px]">
        {myCount < 3 && (
          <p className="text-xs text-muted px-2 py-3">
            Add at least 3 Pokémon to My Pool to evaluate lineups.
          </p>
        )}
        {myCount >= 3 && oppCount < 3 && (
          <p className="text-xs text-muted px-2 py-3">
            Add at least 3 Pokémon to the Opponent Pool to predict their counter.
          </p>
        )}
        {myCount >= 3 && oppCount >= 3 && picks.length === 0 && (
          <p className="text-xs text-muted px-2 py-3">
            No lineups could be evaluated.
          </p>
        )}
        {picks.map((rec, i) => {
          const isApplied =
            sameSet(rec.myIndices, myBattle) &&
            sameSet(rec.predictedOppIndices, oppBattle);
          return (
            <LineupRow
              key={rec.myIndices.join("-")}
              index={i}
              rec={rec}
              applied={isApplied}
              onEnter={() =>
                onHover?.({ mine: rec.myIndices, opp: rec.predictedOppIndices })
              }
              onLeave={() => onHover?.(null)}
              onClick={() => {
                if (isApplied) {
                  setBattle("my", []);
                  setBattle("opp", []);
                } else {
                  setBattle("my", rec.myIndices);
                  setBattle("opp", rec.predictedOppIndices);
                }
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

function LineupRow({
  index,
  rec,
  applied,
  onEnter,
  onLeave,
  onClick,
}: {
  index: number;
  rec: LineupRecommendation;
  applied: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const highlighted = applied || hovered;
  return (
    <div
      onMouseEnter={() => {
        setHovered(true);
        onEnter();
      }}
      onMouseLeave={() => {
        setHovered(false);
        onLeave();
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={clsx(
        "group rounded-[10px] border p-3 cursor-pointer transition-all flex flex-col gap-[10px]",
      )}
      style={{
        background: highlighted
          ? "var(--color-primary-soft)"
          : "var(--color-surface-2)",
        borderColor: highlighted
          ? "var(--color-primary)"
          : "var(--color-border)",
        borderWidth: 1.5,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className={clsx(
            "font-mono text-[10px] font-semibold",
            highlighted ? "text-primary" : "text-muted",
          )}
        >
          #0{index + 1}
        </div>
        <div className="flex-1" />
        <div className="font-mono text-[10px] text-muted">
          OFF <span className="text-danger">{rec.offensePct.toFixed(0)}%</span>
        </div>
        <div className="font-mono font-bold text-[18px] leading-none text-primary">
          {rec.score.toFixed(0)}
        </div>
        <div className="font-mono text-[9px] text-dim">/100</div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex gap-1 justify-start">
          {rec.myLineup.map((p) => (
            <TokenSmall key={p.slug} mon={p} tone="primary" />
          ))}
        </div>
        <div className="font-mono text-[9px] text-dim tracking-[1px]">vs</div>
        <div className="flex gap-1 justify-end">
          {rec.predictedOpp.map((p) => (
            <TokenSmall key={p.slug} mon={p} tone="danger" />
          ))}
        </div>
      </div>

      <div
        className="h-[3px] rounded-sm overflow-hidden"
        style={{ background: "var(--color-bg)" }}
      >
        <div
          className="h-full"
          style={{
            width: `${Math.max(0, Math.min(100, rec.score))}%`,
            background: "var(--color-primary)",
          }}
        />
      </div>

      {rec.reason && (
        <p className="text-[11px] text-muted truncate">{rec.reason}</p>
      )}
    </div>
  );
}

function TokenSmall({
  mon,
}: {
  mon: { name: string; slug: string; spriteUrl: string };
  tone?: "primary" | "danger";
}) {
  return (
    <Image
      src={mon.spriteUrl}
      alt={mon.name}
      title={mon.name}
      width={40}
      height={40}
      unoptimized
      className="h-10 w-10 shrink-0 [image-rendering:pixelated]"
    />
  );
}
