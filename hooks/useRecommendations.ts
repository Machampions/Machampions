"use client";

import { useEffect, useMemo } from "react";
import { recommendLineups, type LineupRecommendation } from "@/lib/analysis";
import { useAppStore } from "@/stores/appStore";
import { ensureUsage } from "./useUsage";

export function useRecommendations(): { picks: LineupRecommendation[] } {
  const format = useAppStore((s) => s.format);
  const teamSize = useAppStore((s) => s.teamSize);
  const myPool = useAppStore((s) => s.myPool);
  const oppPool = useAppStore((s) => s.oppPool);
  const usageCache = useAppStore((s) => s.usageCache);

  useEffect(() => {
    myPool.forEach((p) => {
      if (p) ensureUsage(format, p.slug);
    });
    oppPool.forEach((p) => {
      if (p) ensureUsage(format, p.slug);
    });
  }, [myPool, oppPool, format]);

  return useMemo(
    () => ({
      picks: recommendLineups(
        myPool,
        oppPool,
        usageCache,
        format,
        teamSize,
        teamSize === 4 ? 4 : 3,
      ),
    }),
    [myPool, oppPool, usageCache, format, teamSize],
  );
}
