"use client";

import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { TypePill } from "@/components/ui/TypePill";
import { multiplierColor, multiplierLabel } from "@/lib/theme";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useAppStore } from "@/stores/appStore";
import type { PokemonMove } from "@/lib/types";

function MoveCombobox({
  slotLabel,
  selectedName,
  moves,
  onSelect,
}: {
  slotLabel: string;
  selectedName: string | null;
  moves: PokemonMove[];
  onSelect: (moveName: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const selectedMove =
    moves.find((move) => move.name.toLowerCase() === selectedName?.toLowerCase()) ??
    null;
  const filteredMoves = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return moves;
    return moves.filter((move) => move.name.toLowerCase().includes(needle));
  }, [moves, query]);

  return (
    <Combobox
      value={selectedMove}
      onChange={(move: PokemonMove | null) => {
        onSelect(move?.name ?? null);
        setQuery("");
      }}
      nullable
    >
      <div className="relative">
        <div className="flex items-center gap-1 rounded border border-border bg-bg px-1.5 py-1 text-[10px]">
          <span className="font-mono text-muted">{slotLabel}</span>
          <ComboboxInput
            aria-label={`${slotLabel} move search`}
            className="min-w-0 flex-1 bg-transparent text-[10px] outline-none"
            placeholder="Search move..."
            displayValue={(move: PokemonMove | null) => move?.name ?? ""}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => setQuery("")}
          />
        </div>
        <ComboboxOptions className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded border border-border bg-surface shadow-lg text-[10px]">
          <ComboboxOption
            value={null}
            className="cursor-pointer px-2 py-1 text-muted data-[focus]:bg-surface-2"
          >
            Clear selection
          </ComboboxOption>
          {filteredMoves.map((move) => (
            <ComboboxOption
              key={move.name}
              value={move}
              className="cursor-pointer px-2 py-1 data-[focus]:bg-surface-2"
            >
              {move.name} ({move.type}, {move.damageClass})
            </ComboboxOption>
          ))}
          {filteredMoves.length === 0 && (
            <li className="px-2 py-1 text-muted">No moves found.</li>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

export function CoverageMatrix() {
  const { matrix, mine, opps } = useAnalysis();
  const myMovesets = useAppStore((s) => s.myMovesets);
  const setMyMovesetMove = useAppStore((s) => s.setMyMovesetMove);
  const clearMyMoveset = useAppStore((s) => s.clearMyMoveset);
  if (mine.length === 0 || opps.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        Draft both teams to see the coverage matrix.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Coverage matrix</h3>
        <span className="font-mono text-[10px] text-muted">
          selected moves offense / incoming defense
        </span>
      </div>
      <section className="mb-3 rounded border border-border bg-surface-2/40 p-2">
        <h4 className="text-[11px] uppercase tracking-wide text-muted mb-2">
          My selected moves (4 per Pokémon)
        </h4>
        <div className="grid gap-2">
          {mine.map((m) => {
            const slotIndex = m.slotIndex ?? -1;
            const selected =
              slotIndex >= 0
                ? myMovesets[slotIndex] ?? [null, null, null, null]
                : [null, null, null, null];
            const selectedMoves = selected
              .map((moveName) =>
                moveName
                  ? m.pokemon.moves.find(
                      (move) => move.name.toLowerCase() === moveName.toLowerCase(),
                    )
                  : undefined,
              )
              .filter((move): move is (typeof m.pokemon.moves)[number] => !!move);
            const offensiveTypes = Array.from(
              new Set(
                selectedMoves
                  .filter((move) => move.damageClass !== "status")
                  .map((move) => move.type),
              ),
            );
            return (
              <div
                key={`${m.pokemon.slug}-${slotIndex}`}
                className="rounded border border-border bg-surface px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <Image
                    src={m.pokemon.spriteUrl}
                    alt={m.pokemon.name}
                    width={24}
                    height={24}
                    className="h-6 w-6 [image-rendering:pixelated]"
                    unoptimized
                  />
                  <span className="text-xs font-medium">{m.pokemon.name}</span>
                  <button
                    type="button"
                    onClick={() => clearMyMoveset(slotIndex)}
                    className="ml-auto text-[10px] text-muted hover:text-danger"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-1">
                  {Array.from({ length: 4 }, (_, moveIdx) => (
                    <div
                      key={moveIdx}
                      className="min-w-0"
                    >
                      <MoveCombobox
                        slotLabel={`M${moveIdx + 1}`}
                        selectedName={selected[moveIdx]}
                        moves={m.pokemon.moves}
                        onSelect={(moveName) =>
                          setMyMovesetMove(slotIndex, moveIdx, moveName)
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex flex-wrap gap-1 min-h-4">
                  {offensiveTypes.map((t, idx) => (
                    <TypePill key={`${t}-${idx}`} type={t} size="xs" />
                  ))}
                  {selectedMoves.length > 0 && offensiveTypes.length === 0 && (
                    <span className="text-[10px] text-muted">
                      Only status moves selected; no offensive coverage applied.
                    </span>
                  )}
                  {selectedMoves.length === 0 && (
                    <span className="text-[10px] text-muted">
                      No moves selected - using usage/STAB fallback.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1">
          <thead>
            <tr>
              <th />
              {opps.map((o) => (
                <th key={o.pokemon.slug} className="p-0">
                  <div className="flex flex-col items-center gap-0.5 w-14">
                    <Image
                      src={o.pokemon.spriteUrl}
                      alt={o.pokemon.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 [image-rendering:pixelated]"
                      unoptimized
                    />
                    <span className="text-[10px] truncate max-w-full text-danger">
                      {o.pokemon.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, ri) => (
              <tr key={mine[ri].pokemon.slug}>
                <th className="p-0">
                  <div className="flex flex-col items-center gap-0.5 w-14">
                    <Image
                      src={mine[ri].pokemon.spriteUrl}
                      alt={mine[ri].pokemon.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 [image-rendering:pixelated]"
                      unoptimized
                    />
                    <span className="text-[10px] truncate max-w-full text-primary">
                      {mine[ri].pokemon.name}
                    </span>
                  </div>
                </th>
                {row.map((cell, ci) => (
                  <td
                    key={`${ri}-${ci}`}
                    className="p-0 text-center align-middle"
                  >
                    <div
                      className="flex flex-col items-center justify-center h-14 w-14 rounded font-mono text-[11px] text-white"
                      style={{ background: multiplierColor(cell.offense) }}
                      title={`Offense ${multiplierLabel(cell.offense)} / Defense ${multiplierLabel(cell.defense)}`}
                    >
                      <span>{multiplierLabel(cell.offense)}</span>
                      <span className="text-[9px] opacity-70">
                        {multiplierLabel(cell.defense)}↓
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
