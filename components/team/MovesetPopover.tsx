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
import type { Pokemon, PokemonMove } from "@/lib/types";

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
    moves.find(
      (move) => move.name.toLowerCase() === selectedName?.toLowerCase(),
    ) ?? null;
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
        <ComboboxOptions className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded border border-border bg-surface shadow-lg text-[10px]">
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

interface Props {
  pokemon: Pokemon;
  slotIndex: number;
  selected: (string | null)[];
  onSelect: (moveIdx: number, moveName: string | null) => void;
  onClear: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  style?: React.CSSProperties;
}

export function MovesetPopover({
  pokemon,
  slotIndex,
  selected,
  onSelect,
  onClear,
  onMouseEnter,
  onMouseLeave,
  style,
}: Props) {
  const selectedMoves = selected
    .map((moveName) =>
      moveName
        ? pokemon.moves.find(
            (move) => move.name.toLowerCase() === moveName.toLowerCase(),
          )
        : undefined,
    )
    .filter((move): move is PokemonMove => !!move);
  const offensiveTypes = Array.from(
    new Set(
      selectedMoves
        .filter((move) => move.damageClass !== "status")
        .map((move) => move.type),
    ),
  );

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="rounded-[10px] border border-border-hi bg-surface p-3 shadow-xl"
      style={style}
    >
      <div className="flex items-center gap-2 mb-2">
        <Image
          src={pokemon.spriteUrl}
          alt={pokemon.name}
          width={24}
          height={24}
          className="h-6 w-6 [image-rendering:pixelated]"
          unoptimized
        />
        <span className="text-xs font-semibold">{pokemon.name}</span>
        <span className="font-mono text-[9px] text-dim uppercase tracking-[1px]">
          Moves
        </span>
        <button
          type="button"
          onClick={onClear}
          disabled={slotIndex < 0}
          className="ml-auto text-[10px] text-muted hover:text-danger disabled:opacity-50"
        >
          Clear
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {Array.from({ length: 4 }, (_, moveIdx) => (
          <MoveCombobox
            key={moveIdx}
            slotLabel={`M${moveIdx + 1}`}
            selectedName={selected[moveIdx]}
            moves={pokemon.moves}
            onSelect={(moveName) => onSelect(moveIdx, moveName)}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1 min-h-4">
        {offensiveTypes.map((t, idx) => (
          <TypePill key={`${t}-${idx}`} type={t} size="xs" />
        ))}
        {selectedMoves.length > 0 && offensiveTypes.length === 0 && (
          <span className="text-[10px] text-muted">
            Only status moves — no offensive coverage applied.
          </span>
        )}
        {selectedMoves.length === 0 && (
          <span className="text-[10px] text-muted">
            No moves selected — using usage/STAB fallback.
          </span>
        )}
      </div>
    </div>
  );
}
