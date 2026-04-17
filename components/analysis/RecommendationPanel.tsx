"use client";

import { Sparkles } from "lucide-react";
import { useRecommendations } from "@/hooks/useRecommendations";
import { RecommendationCard } from "./RecommendationCard";
import { useAppStore } from "@/stores/appStore";

export function RecommendationPanel() {
  const { picks } = useRecommendations();
  const myPool = useAppStore((s) => s.myPool);
  const oppPool = useAppStore((s) => s.oppPool);
  const myCount = myPool.filter((p) => p).length;
  const oppCount = oppPool.filter((p) => p).length;

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <h3 className="mb-2 text-sm font-semibold flex items-center gap-1">
        <Sparkles size={14} className="text-primary" /> Best lineups
      </h3>
      {myCount < 3 && (
        <p className="text-xs text-muted">
          Add at least 3 Pokémon to My Pool to evaluate lineups.
        </p>
      )}
      {myCount >= 3 && oppCount < 3 && (
        <p className="text-xs text-muted">
          Add at least 3 Pokémon to the Opponent Pool to predict their counter.
        </p>
      )}
      {myCount >= 3 && oppCount >= 3 && picks.length === 0 && (
        <p className="text-xs text-muted">No lineups could be evaluated.</p>
      )}
      <div className="flex flex-col gap-2">
        {picks.map((p) => (
          <RecommendationCard key={p.myIndices.join("-")} rec={p} />
        ))}
      </div>
    </div>
  );
}
