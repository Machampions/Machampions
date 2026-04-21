"use client";

import Image from "next/image";
import type { Pokemon } from "@/lib/types";
import { ALL_TYPES } from "@/lib/types";
import { attackingTypes, type MonContext } from "@/lib/analysis";
import { effectiveness } from "@/lib/typeChart";
import { TypePill } from "@/components/ui/TypePill";
import { multiplierBgVar, multiplierLabel, multiplierTextVar } from "@/lib/theme";
import { useAppStore } from "@/stores/appStore";

export function WeaknessesTab({ pokemon }: { pokemon: Pokemon }) {
  const format = useAppStore((s) => s.format);

  const weaknesses = ALL_TYPES.filter(
    (t) => effectiveness(t, pokemon.types) >= 2,
  );
  const resists = ALL_TYPES.filter(
    (t) => effectiveness(t, pokemon.types) < 1,
  );
  const immunities = ALL_TYPES.filter(
    (t) => effectiveness(t, pokemon.types) === 0,
  );

  const oppPool = useAppStore((s) => s.oppPool);
  const usageCache = useAppStore((s) => s.usageCache);
  const opps = oppPool.filter((p): p is Pokemon => !!p);
  const threats = opps
    .map<{ opp: Pokemon; mult: number }>((o) => {
      const ctx: MonContext = {
        pokemon: o,
        usage: usageCache.get(`${format}:${o.slug}`) ?? null,
      };
      const atk = attackingTypes(ctx);
      const worst = atk.reduce(
        (a, t) => Math.max(a, effectiveness(t, pokemon.types)),
        0,
      );
      return { opp: o, mult: worst };
    })
    .sort((a, b) => b.mult - a.mult)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-3 p-3">
      <section>
        <h4 className="text-xs uppercase tracking-wide text-muted mb-1">
          Weak to
        </h4>
        <div className="flex flex-wrap gap-1">
          {weaknesses.length === 0 ? (
            <span className="text-xs text-muted">No type weaknesses.</span>
          ) : (
            weaknesses.map((t) => (
              <div key={t} className="flex items-center gap-1">
                <TypePill type={t} size="xs" />
                <span className="font-mono text-[10px] text-danger">
                  {multiplierLabel(effectiveness(t, pokemon.types))}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
      <section>
        <h4 className="text-xs uppercase tracking-wide text-muted mb-1">
          Resists
        </h4>
        <div className="flex flex-wrap gap-1">
          {resists.map((t) => (
            <TypePill key={t} type={t} size="xs" />
          ))}
        </div>
      </section>
      {immunities.length > 0 && (
        <section>
          <h4 className="text-xs uppercase tracking-wide text-muted mb-1">
            Immune to
          </h4>
          <div className="flex flex-wrap gap-1">
            {immunities.map((t) => (
              <TypePill key={t} type={t} size="xs" />
            ))}
          </div>
        </section>
      )}
      {opps.length > 0 && (
        <section>
          <h4 className="text-xs uppercase tracking-wide text-muted mb-1">
            Biggest threats on opponent
          </h4>
          <ul className="flex flex-col gap-1">
            {threats.map((t) => (
              <li
                key={t.opp.slug}
                className="flex items-center gap-2 rounded border border-border bg-surface-2 px-2 py-1"
              >
                <Image
                  src={t.opp.spriteUrl}
                  alt={t.opp.name}
                  width={24}
                  height={24}
                  className="h-6 w-6 [image-rendering:pixelated]"
                  unoptimized
                />
                <span className="flex-1 truncate text-xs">{t.opp.name}</span>
                <span
                  className="px-1.5 rounded font-mono text-[11px]"
                  style={{
                    background: multiplierBgVar(t.mult),
                    color: multiplierTextVar(t.mult),
                  }}
                >
                  {multiplierLabel(t.mult)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
