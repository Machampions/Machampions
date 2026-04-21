"use client";

import Image from "next/image";
import type { Pokemon } from "@/lib/types";
import { ALL_TYPES } from "@/lib/types";
import {
  attackingTypes,
  bestOffense,
  type MonContext,
} from "@/lib/analysis";
import { effectiveness } from "@/lib/typeChart";
import { TypePill } from "@/components/ui/TypePill";
import { multiplierLabel, multiplierBgVar, multiplierTextVar } from "@/lib/theme";
import { useUsage } from "@/hooks/useUsage";
import { useAppStore } from "@/stores/appStore";

export function StrengthsTab({ pokemon }: { pokemon: Pokemon }) {
  const format = useAppStore((s) => s.format);
  const usage = useUsage(format, pokemon.slug);
  const ctx: MonContext = { pokemon, usage };
  const atkTypes = attackingTypes(ctx);

  const hitsHard = ALL_TYPES.filter((t) => {
    return atkTypes.some((atk) => effectiveness(atk, [t]) >= 2);
  });

  const oppPool = useAppStore((s) => s.oppPool);
  const opps = oppPool.filter((p): p is Pokemon => !!p);
  const matchups = opps
    .map((o) => ({ opp: o, mult: bestOffense(ctx, o) }))
    .sort((a, b) => b.mult - a.mult)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-3 p-3">
      <section>
        <h4 className="text-xs uppercase tracking-wide text-muted mb-1">
          Hits hard vs
        </h4>
        <div className="flex flex-wrap gap-1">
          {hitsHard.map((t) => (
            <TypePill key={t} type={t} size="xs" />
          ))}
          {hitsHard.length === 0 && (
            <span className="text-xs text-muted">None — neutral coverage only.</span>
          )}
        </div>
      </section>
      <section>
        <h4 className="text-xs uppercase tracking-wide text-muted mb-1">
          Attacking types considered
        </h4>
        <div className="flex gap-1">
          {atkTypes.map((t) => (
            <TypePill key={t} type={t} size="xs" />
          ))}
        </div>
        <p className="mt-1 text-[11px] text-muted">
          {usage && usage.topMoves.some((m) => m.type)
            ? "From Pikalytics top moves."
            : "Using STAB — Pikalytics move types not hydrated."}
        </p>
      </section>
      {opps.length > 0 && (
        <section>
          <h4 className="text-xs uppercase tracking-wide text-muted mb-1">
            Top offensive matchups
          </h4>
          <ul className="flex flex-col gap-1">
            {matchups.map((m) => (
              <li
                key={m.opp.slug}
                className="flex items-center gap-2 rounded border border-border bg-surface-2 px-2 py-1"
              >
                <Image
                  src={m.opp.spriteUrl}
                  alt={m.opp.name}
                  width={24}
                  height={24}
                  className="h-6 w-6 [image-rendering:pixelated]"
                  unoptimized
                />
                <span className="flex-1 truncate text-xs">{m.opp.name}</span>
                <span
                  className="px-1.5 rounded font-mono text-[11px]"
                  style={{
                    background: multiplierBgVar(m.mult),
                    color: multiplierTextVar(m.mult),
                  }}
                >
                  {multiplierLabel(m.mult)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
