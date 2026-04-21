"use client";

import Image from "next/image";
import type { Pokemon } from "@/lib/types";
import { bestOffense, type MonContext } from "@/lib/analysis";
import { worstIncoming } from "@/lib/typeChart";
import { attackingTypes } from "@/lib/analysis";
import { multiplierBgVar, multiplierLabel, multiplierTextVar } from "@/lib/theme";
import { useUsage } from "@/hooks/useUsage";
import { useAppStore } from "@/stores/appStore";

export function CoverageTab({ pokemon }: { pokemon: Pokemon }) {
  const format = useAppStore((s) => s.format);
  const oppPool = useAppStore((s) => s.oppPool);
  const usageCache = useAppStore((s) => s.usageCache);
  const usage = useUsage(format, pokemon.slug);
  const ctx: MonContext = { pokemon, usage };

  const opps = oppPool.filter((p): p is Pokemon => !!p);
  const rows = opps.map((o) => {
    const oCtx: MonContext = {
      pokemon: o,
      usage: usageCache.get(`${format}:${o.slug}`) ?? null,
    };
    return {
      opp: o,
      offense: bestOffense(ctx, o),
      defense: worstIncoming(pokemon.types, attackingTypes(oCtx)),
    };
  });

  const covered = rows.filter((r) => r.offense >= 2).length;
  const total = rows.length;

  return (
    <div className="flex flex-col gap-3 p-3">
      <section>
        <h4 className="text-xs uppercase tracking-wide text-muted mb-1">
          1-vs-opp coverage
        </h4>
        {total === 0 && (
          <p className="text-xs text-muted">
            Add opponent Pokémon to see pairings.
          </p>
        )}
        {total > 0 && (
          <p className="text-[11px] text-muted">
            Hits <span className="text-primary font-mono">{covered}</span> of{" "}
            {total} opponents super-effectively.
          </p>
        )}
      </section>
      {total > 0 && (
        <div className="grid grid-cols-[1fr_auto_auto] gap-y-1 gap-x-2">
          <div className="text-[10px] uppercase tracking-wide text-muted">
            Opponent
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted text-right">
            Off
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted text-right">
            Incoming
          </div>
          {rows.map((r) => (
            <div key={r.opp.slug} className="contents">
              <div className="flex items-center gap-2 min-w-0">
                <Image
                  src={r.opp.spriteUrl}
                  alt={r.opp.name}
                  width={20}
                  height={20}
                  className="h-5 w-5 [image-rendering:pixelated]"
                  unoptimized
                />
                <span className="truncate text-xs">{r.opp.name}</span>
              </div>
              <span
                className="justify-self-end px-1.5 rounded font-mono text-[10px]"
                style={{
                  background: multiplierBgVar(r.offense),
                  color: multiplierTextVar(r.offense),
                }}
              >
                {multiplierLabel(r.offense)}
              </span>
              <span
                className="justify-self-end px-1.5 rounded font-mono text-[10px]"
                style={{
                  background: multiplierBgVar(r.defense),
                  color: multiplierTextVar(r.defense),
                }}
              >
                {multiplierLabel(r.defense)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
