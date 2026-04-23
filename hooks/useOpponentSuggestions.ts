"use client";

import { useEffect, useMemo } from "react";
import { ensureUsage } from "./useUsage";
import { useTopList } from "./useTopList";
import { getChampionsEntry, resolvePokemonSlug } from "@/src/data/pokemon-registry";
import { useAppStore } from "@/stores/appStore";

export interface Suggestion {
  slug: string;
  displayName: string;
  usagePct: number;
  rank: number;
  reason: "top" | "teammate";
  boostedBy?: string;
}

const TEAMMATE_BOOST_BASE = 20;
const MAX_SUGGESTIONS = 8;

export function usePoolSuggestions(side: "my" | "opp"): Suggestion[] {
  const format = useAppStore((s) => s.format);
  const oppPool = useAppStore((s) => s.oppPool);
  const myPool = useAppStore((s) => s.myPool);
  const usageCache = useAppStore((s) => s.usageCache);
  const { data: topList } = useTopList(format);

  const primaryPool = side === "my" ? myPool : oppPool;

  useEffect(() => {
    primaryPool.forEach((p) => {
      if (p) ensureUsage(format, p.slug);
    });
  }, [primaryPool, format]);

  return useMemo(() => {
    if (!topList) return [];
    const usedSlugs = new Set<string>();
    primaryPool.forEach((p) => p && usedSlugs.add(resolvePokemonSlug(p.slug)));

    const teammateBoost = new Map<string, { pct: number; from: string }>();
    primaryPool.forEach((p) => {
      if (!p) return;
      const usage = usageCache.get(`${format}:${p.slug}`);
      if (!usage) return;
      for (const tm of usage.teammates) {
        const teammateSlug = resolvePokemonSlug(tm.name);
        const existing = teammateBoost.get(teammateSlug);
        if (!existing || tm.pct > existing.pct) {
          teammateBoost.set(teammateSlug, { pct: tm.pct, from: p.name });
        }
      }
    });

    const scored = topList.entries
      .map((e) => {
        const canonicalSlug = resolvePokemonSlug(e.slug);
        const legalEntry = getChampionsEntry(e.slug) ?? getChampionsEntry(e.displayName);
        return {
          ...e,
          slug: canonicalSlug,
          displayName: legalEntry?.name ?? e.displayName,
        };
      })
      .filter((e) => !usedSlugs.has(e.slug))
      .map((e) => {
        const boost = teammateBoost.get(e.slug);
        const score = e.usagePct + (boost ? TEAMMATE_BOOST_BASE + boost.pct : 0);
        return {
          entry: e,
          score,
          boost,
        };
      })
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, MAX_SUGGESTIONS).map<Suggestion>((s) => ({
      slug: s.entry.slug,
      displayName: s.entry.displayName,
      usagePct: s.entry.usagePct,
      rank: s.entry.rank,
      reason: s.boost ? "teammate" : "top",
      boostedBy: s.boost?.from,
    }));
  }, [topList, oppPool, myPool, primaryPool, usageCache, format]);
}

export function useOpponentSuggestions(): Suggestion[] {
  return usePoolSuggestions("opp");
}
