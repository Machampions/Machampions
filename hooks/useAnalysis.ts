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

function buildContexts(
  pool: ReturnType<typeof useAppStore.getState>["myPool"],
  indices: number[],
  myMovesets: ReturnType<typeof useAppStore.getState>["myMovesets"] | null,
  usageCache: Map<string, import("@/lib/types").UsageData>,
  format: string,
): MonContext[] {
  return indices
    .map((i) => ({ i, p: pool[i] }))
    .filter((entry): entry is { i: number; p: NonNullable<typeof entry.p> } => !!entry.p)
    .map(({ i, p }) => {
      const chosenMoves = (myMovesets?.[i] ?? [])
        .map((moveName) =>
          p.moves.find((move) => move.name.toLowerCase() === moveName?.toLowerCase()),
        )
        .filter((move): move is import("@/lib/types").PokemonMove => !!move);
      return {
        pokemon: p,
        usage: usageCache.get(`${format}:${p.slug}`) ?? null,
        selectedMoves: chosenMoves,
        slotIndex: i,
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
    const myFilled = myPool.map((_, i) => i).filter((i) => myPool[i]);
    const oppFilled = oppPool.map((_, i) => i).filter((i) => oppPool[i]);

    const mine = buildContexts(myPool, myFilled, myMovesets, usageCache, format);
    const opps = buildContexts(oppPool, oppFilled, null, usageCache, format);

    const mineActive = myBattle.length > 0
      ? buildContexts(myPool, myBattle, myMovesets, usageCache, format)
      : mine;
    const oppsActive = oppBattle.length > 0
      ? buildContexts(oppPool, oppBattle, null, usageCache, format)
      : opps;

    return {
      mine,
      opps,
      mineActive,
      oppsActive,
      matrix: buildCoverageMatrix(mine, opps),
      threats: threatReport(mineActive, oppsActive),
      gaps: gapAnalysis(mineActive),
      offense: offensiveCoverageScore(mineActive, oppsActive),
      defense: defensiveScore(mineActive, oppsActive),
      teamScore: compositeTeamScore(mineActive, oppsActive),
    };
  }, [myPool, oppPool, myBattle, oppBattle, myMovesets, usageCache, format]);
}
