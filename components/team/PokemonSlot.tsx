"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import Image from "next/image";
import { TypePill } from "@/components/ui/TypePill";
import type { Pokemon } from "@/lib/types";

export function PokemonSlot({
  pokemon,
  inBattle,
  onClick,
  onRemove,
  onToggleBattle,
  dim,
}: {
  pokemon: Pokemon | null;
  inBattle?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  onToggleBattle?: () => void;
  dim?: boolean;
}) {
  if (!pokemon) {
    return (
      <div className="group relative flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-surface-2/40 p-2 aspect-square text-muted">
        <span className="text-[11px]">Empty</span>
      </div>
    );
  }
  return (
    <div
      className={clsx(
        "group relative flex flex-col items-center rounded-lg border bg-surface-2 p-2 aspect-square transition-colors",
        inBattle
          ? "border-primary shadow-[0_0_0_1px_var(--color-primary)]"
          : "border-border",
        dim && "opacity-60",
        "hover:border-primary",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 w-full flex-col items-center justify-center"
        aria-label={`View ${pokemon.name}`}
      >
        <Image
          src={pokemon.spriteUrl}
          alt={pokemon.name}
          width={72}
          height={72}
          className="h-16 w-16 [image-rendering:pixelated] drop-shadow"
          unoptimized
        />
      </button>
      <div className="mt-auto flex flex-col items-center gap-1 w-full">
        <span className="truncate max-w-full text-[11px] font-medium">
          {pokemon.name}
        </span>
        <div className="flex gap-1">
          {pokemon.types.map((t) => (
            <TypePill key={t} type={t} size="xs" />
          ))}
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${pokemon.name}`}
          className="absolute top-1 right-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-bg/80 text-muted hover:text-danger border border-border"
        >
          <X size={12} />
        </button>
      )}
      {onToggleBattle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBattle();
          }}
          aria-label={inBattle ? "Remove from battle" : "Add to battle"}
          className={clsx(
            "absolute top-1 left-1 h-5 min-w-5 px-1 inline-flex items-center justify-center rounded text-[10px] font-mono border",
            inBattle
              ? "bg-primary text-bg border-primary"
              : "bg-bg/70 text-muted border-border hover:text-text",
          )}
        >
          {inBattle ? "★" : "+"}
        </button>
      )}
    </div>
  );
}
