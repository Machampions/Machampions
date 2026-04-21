"use client";

import clsx from "clsx";
import { Eraser } from "lucide-react";
import { PokemonSearch } from "./PokemonSearch";
import { PokemonSlot } from "./PokemonSlot";
import { POOL_SLOTS, useAppStore } from "@/stores/appStore";
import type { Pokemon } from "@/lib/types";
import type { Suggestion } from "@/hooks/useOpponentSuggestions";

interface Props {
  side: "my" | "opp";
  title: string;
  accent?: "primary" | "danger";
  suggestions?: Suggestion[];
}

export function TeamPanel({ side, title, accent = "primary", suggestions }: Props) {
  const pool = useAppStore((s) => (side === "my" ? s.myPool : s.oppPool));
  const battle = useAppStore((s) =>
    side === "my" ? s.myBattle : s.oppBattle,
  );
  const setSlot = useAppStore((s) => s.setSlot);
  const clearSide = useAppStore((s) => s.clearSide);
  const toggleBattle = useAppStore((s) => s.toggleBattle);
  const setBattle = useAppStore((s) => s.setBattle);
  const openDrawer = useAppStore((s) => s.openDrawer);

  function addPokemon(mon: Pokemon) {
    const idx = pool.findIndex((p) => p === null);
    if (idx === -1) return;
    setSlot(side, idx, mon);
  }

  const accentCls =
    accent === "danger" ? "text-danger" : "text-primary";

  return (
    <section className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className={clsx("text-sm font-semibold tracking-tight", accentCls)}>
          {title}
          <span className="ml-2 text-xs font-mono text-muted">
            {pool.filter((p) => p).length}/{POOL_SLOTS}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => clearSide(side)}
          className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-danger"
          aria-label={`Clear ${title}`}
        >
          <Eraser size={12} /> Clear
        </button>
      </div>
      <PokemonSearch
        onPick={addPokemon}
        placeholder={`Add to ${title}…`}
        suggestions={suggestions}
      />
      <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {pool.map((mon, i) => (
          <PokemonSlot
            key={i}
            pokemon={mon}
            inBattle={battle.includes(i)}
            onClick={mon ? () => openDrawer(side, i) : undefined}
            onRemove={mon ? () => setSlot(side, i, null) : undefined}
            onToggleBattle={mon ? () => toggleBattle(side, i) : undefined}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-muted">
        <span>
          Battle: <span className="text-primary">{battle.length}/3</span>
          {battle.length === 0 && pool.some((p) => p) && (
            <span className="ml-2 text-muted">
              (no picks — analysing all {pool.filter((p) => p).length})
            </span>
          )}
        </span>
        {battle.length > 0 && (
          <button
            type="button"
            onClick={() => setBattle(side, [])}
            className="text-muted hover:text-danger"
          >
            Clear battle
          </button>
        )}
      </div>
    </section>
  );
}
