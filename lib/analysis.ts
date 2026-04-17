import type { Pokemon, TypeName, UsageData } from "./types";
import { ALL_TYPES } from "./types";
import {
  effectiveness,
  bestEffectivenessFromTypes,
  worstIncoming,
} from "./typeChart";

export interface MonContext {
  pokemon: Pokemon;
  usage?: UsageData | null;
}

export function attackingTypes(ctx: MonContext): TypeName[] {
  const fromUsage = ctx.usage?.topMoves
    .map((m) => m.type)
    .filter((t): t is TypeName => !!t);
  if (fromUsage && fromUsage.length > 0) {
    return Array.from(new Set(fromUsage));
  }
  return ctx.pokemon.types;
}

export function bestOffense(attacker: MonContext, defender: Pokemon): number {
  return bestEffectivenessFromTypes(attackingTypes(attacker), defender.types);
}

export function worstDefense(
  defender: MonContext,
  threat: MonContext,
): number {
  return worstIncoming(defender.pokemon.types, attackingTypes(threat));
}

export interface CoverageMatrixCell {
  myMon: Pokemon;
  oppMon: Pokemon;
  offense: number;
  defense: number;
}

export function buildCoverageMatrix(
  mine: MonContext[],
  opps: MonContext[],
): CoverageMatrixCell[][] {
  return mine.map((m) =>
    opps.map((o) => ({
      myMon: m.pokemon,
      oppMon: o.pokemon,
      offense: bestOffense(m, o.pokemon),
      defense: worstIncoming(m.pokemon.types, attackingTypes(o)),
    })),
  );
}

export interface Threat {
  pokemon: Pokemon;
  pressure: number;
  breakdown: { target: Pokemon; multiplier: number }[];
}

export function threatReport(
  mine: MonContext[],
  opps: MonContext[],
): Threat[] {
  return opps
    .map((o) => {
      const breakdown = mine.map((m) => ({
        target: m.pokemon,
        multiplier: bestEffectivenessFromTypes(
          attackingTypes(o),
          m.pokemon.types,
        ),
      }));
      const pressure = breakdown.reduce((a, b) => a + b.multiplier, 0);
      return { pokemon: o.pokemon, pressure, breakdown };
    })
    .sort((a, b) => b.pressure - a.pressure);
}

export interface Gap {
  type: TypeName;
  bestResistFactor: number;
}

export function gapAnalysis(mine: MonContext[]): Gap[] {
  if (mine.length === 0) return [];
  const gaps: Gap[] = [];
  for (const t of ALL_TYPES) {
    let best = Infinity;
    for (const m of mine) {
      const inc = effectiveness(t, m.pokemon.types);
      if (inc < best) best = inc;
    }
    if (best >= 2) gaps.push({ type: t, bestResistFactor: best });
  }
  return gaps.sort((a, b) => b.bestResistFactor - a.bestResistFactor);
}

export interface CoverageScore {
  coveredCount: number;
  total: number;
  pct: number;
  uncovered: Pokemon[];
}

export function offensiveCoverageScore(
  mine: MonContext[],
  opps: MonContext[],
): CoverageScore {
  const uncovered: Pokemon[] = [];
  for (const o of opps) {
    const anyHitsHard = mine.some((m) => bestOffense(m, o.pokemon) >= 2);
    if (!anyHitsHard) uncovered.push(o.pokemon);
  }
  const total = opps.length;
  const covered = total - uncovered.length;
  return {
    coveredCount: covered,
    total,
    pct: total === 0 ? 0 : (covered / total) * 100,
    uncovered,
  };
}

export function defensiveScore(
  mine: MonContext[],
  opps: MonContext[],
): number {
  if (mine.length === 0 || opps.length === 0) return 0;
  let total = 0;
  for (const m of mine) {
    let worst = 0;
    for (const o of opps) {
      const mult = worstIncoming(m.pokemon.types, attackingTypes(o));
      if (mult > worst) worst = mult;
    }
    total += 1 / Math.max(0.25, worst);
  }
  return (total / mine.length) * 50;
}

export function compositeTeamScore(
  mine: MonContext[],
  opps: MonContext[],
): number {
  if (mine.length === 0 || opps.length === 0) return 0;
  const cov = offensiveCoverageScore(mine, opps).pct;
  const def = Math.min(100, defensiveScore(mine, opps));
  const gapPenalty = gapAnalysis(mine).length * 6;
  return Math.max(0, Math.min(100, cov * 0.55 + def * 0.45 - gapPenalty));
}

export function combos<T>(items: T[], k: number): T[][] {
  const out: T[][] = [];
  if (k < 0 || k > items.length) return out;
  const pick: T[] = [];
  const walk = (start: number) => {
    if (pick.length === k) {
      out.push(pick.slice());
      return;
    }
    const need = k - pick.length;
    const last = items.length - need;
    for (let i = start; i <= last; i++) {
      pick.push(items[i]);
      walk(i + 1);
      pick.pop();
    }
  };
  walk(0);
  return out;
}

export interface LineupRecommendation {
  myIndices: number[];
  myLineup: Pokemon[];
  predictedOppIndices: number[];
  predictedOpp: Pokemon[];
  score: number;
  offensePct: number;
  reason: string;
}

function lineupReason(mine: MonContext[], opps: MonContext[]): string {
  const hitsHard = opps
    .filter((o) => mine.some((m) => bestOffense(m, o.pokemon) >= 2))
    .map((o) => o.pokemon.name);
  const walls = opps
    .filter((o) =>
      mine.some(
        (m) => worstIncoming(m.pokemon.types, attackingTypes(o)) <= 0.5,
      ),
    )
    .map((o) => o.pokemon.name);
  const parts: string[] = [];
  if (hitsHard.length > 0) {
    const suffix = hitsHard.length > 2 ? " +more" : "";
    parts.push(`hits ${hitsHard.slice(0, 2).join(" & ")}${suffix} hard`);
  }
  const uniqueWalls = walls.filter((w) => !hitsHard.includes(w));
  if (uniqueWalls.length > 0) {
    parts.push(`walls ${uniqueWalls.slice(0, 2).join(" & ")}`);
  }
  if (parts.length === 0) {
    return "Balanced matchup against their best response.";
  }
  return parts.join("; ") + ".";
}

export function recommendLineups(
  myPool: (Pokemon | null)[],
  oppPool: (Pokemon | null)[],
  usageCache: Map<string, UsageData>,
  format: string,
  limit = 3,
): LineupRecommendation[] {
  const myFilled = myPool
    .map((p, i) => (p ? i : -1))
    .filter((i) => i >= 0);
  const oppFilled = oppPool
    .map((p, i) => (p ? i : -1))
    .filter((i) => i >= 0);

  if (myFilled.length < 3 || oppFilled.length < 3) return [];

  const ctx = (p: Pokemon): MonContext => ({
    pokemon: p,
    usage: usageCache.get(`${format}:${p.slug}`) ?? null,
  });

  const myCombos = combos(myFilled, 3);
  const oppCombos = combos(oppFilled, 3);

  const results: LineupRecommendation[] = myCombos.map((myIdx) => {
    const mine = myIdx.map((i) => ctx(myPool[i]!));

    let bestOpp: number[] = oppCombos[0];
    let bestOppScore = -Infinity;
    for (const oppIdx of oppCombos) {
      const opps = oppIdx.map((i) => ctx(oppPool[i]!));
      const s = compositeTeamScore(opps, mine);
      if (s > bestOppScore) {
        bestOppScore = s;
        bestOpp = oppIdx;
      }
    }

    const predOpp = bestOpp.map((i) => ctx(oppPool[i]!));
    const score = compositeTeamScore(mine, predOpp);
    const offensePct = offensiveCoverageScore(mine, predOpp).pct;

    return {
      myIndices: myIdx,
      myLineup: mine.map((m) => m.pokemon),
      predictedOppIndices: bestOpp,
      predictedOpp: predOpp.map((p) => p.pokemon),
      score,
      offensePct,
      reason: lineupReason(mine, predOpp),
    };
  });

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
