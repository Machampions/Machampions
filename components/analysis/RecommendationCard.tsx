"use client";

import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import type { LineupRecommendation } from "@/lib/analysis";
import type { Pokemon } from "@/lib/types";
import { ScoreBar } from "./ScoreBar";
import { useAppStore } from "@/stores/appStore";

export function RecommendationCard({ rec }: { rec: LineupRecommendation }) {
  const setBattle = useAppStore((s) => s.setBattle);
  const myBattle = useAppStore((s) => s.myBattle);

  const isActive =
    myBattle.length === rec.myIndices.length &&
    rec.myIndices.every((i) => myBattle.includes(i));

  return (
    <div className="rounded-lg border border-border bg-surface p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <LineupRow mons={rec.myLineup} tone="primary" />
        <ArrowRight size={14} className="text-muted shrink-0" />
        <LineupRow mons={rec.predictedOpp} tone="danger" />
        <button
          type="button"
          onClick={() => setBattle("my", rec.myIndices)}
          disabled={isActive}
          className={`ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
            isActive
              ? "bg-surface-2 text-muted cursor-default"
              : "bg-primary text-bg hover:opacity-90"
          }`}
        >
          {isActive ? (
            <>
              <Check size={12} /> Active
            </>
          ) : (
            "Use this lineup"
          )}
        </button>
      </div>
      <p className="text-[11px] text-muted">{rec.reason}</p>
      <div className="flex flex-col gap-0.5">
        <ScoreBar label="Score" value={rec.score} color="primary" />
        <ScoreBar label="Off" value={rec.offensePct} color="danger" />
      </div>
    </div>
  );
}

function LineupRow({
  mons,
  tone,
}: {
  mons: Pokemon[];
  tone: "primary" | "danger";
}) {
  const border =
    tone === "primary" ? "border-primary/40" : "border-danger/40";
  return (
    <div className="flex items-center gap-1">
      {mons.map((p) => (
        <div
          key={p.slug}
          title={p.name}
          className={`rounded border ${border} bg-surface-2 p-0.5`}
        >
          <Image
            src={p.spriteUrl}
            alt={p.name}
            width={40}
            height={40}
            className="h-10 w-10 [image-rendering:pixelated]"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}
