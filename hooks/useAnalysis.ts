"use client";

import { useMemo } from "react";
import type { MonContext } from "@/lib/analysis";
import {
  buildCoverageMatrix,
  compositeTeamScore,
  defensiveScore,
  gapAnalysis,
  offensiveCoverageScore,
  threatReport,
} from "@/lib/analysis";
import { useAppStore } from "@/stores/appStore";

function toContexts(
  pool: ReturnType<typeof useAppStore.getState>["myPool"],
  battle: number[],
  myMovesets: ReturnType<typeof useAppStore.getState>["myMovesets"] | null,
  usageCache: Map<string, import("@/lib/types").UsageData>,
  format: string,
): MonContext[] {
  const indices = battle.length > 0 ? battle : pool
    .map((_, i) => i)
    .filter((i) => pool[i]);
  return indices
    .map((i) => pool[i])
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p, idx) => {
      const slotIndex = indices[idx];
      const chosenMoves = (myMovesets?.[slotIndex] ?? [])
        .map((moveName) =>
          p.moves.find((move) => move.name.toLowerCase() === moveName?.toLowerCase()),
        )
        .filter((move): move is import("@/lib/types").PokemonMove => !!move);
      return {
        pokemon: p,
        usage: usageCache.get(`${format}:${p.slug}`) ?? null,
        selectedMoves: chosenMoves,
        slotIndex,
      };
    });
}

export function useAnalysis() {
  const myPool = useAppStore((s) => s.myPool);
  const oppPool = useAppStore((s) => s.oppPool);
  const myBattle = useAppStore((s) => s.myBattle);
  const oppBattle = useAppStore((s) => s.oppBattle);
  const myMovesets = useAppStore((s) => s.myMovesets);
  const usageCache = useAppStore((s) => s.usageCache);
  const format = useAppStore((s) => s.format);

  return useMemo(() => {
    const mine = toContexts(myPool, myBattle, myMovesets, usageCache, format);
    const opps = toContexts(oppPool, oppBattle, null, usageCache, format);
    return {
      mine,
      opps,
      matrix: buildCoverageMatrix(mine, opps),
      threats: threatReport(mine, opps),
      gaps: gapAnalysis(mine),
      offense: offensiveCoverageScore(mine, opps),
      defense: defensiveScore(mine, opps),
      teamScore: compositeTeamScore(mine, opps),
    };
  }, [myPool, oppPool, myBattle, oppBattle, myMovesets, usageCache, format]);
}
