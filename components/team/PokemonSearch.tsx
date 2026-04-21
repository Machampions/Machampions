"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import Image from "next/image";
import { usePokemonList } from "@/hooks/usePokemonList";
import { ensurePokemonDetail } from "@/hooks/usePokemonDetail";
import { spriteUrl, toLightPokemon } from "@/lib/pokeapi";
import type { Pokemon, PokemonListItem } from "@/lib/types";
import { useAppStore } from "@/stores/appStore";

function matches(item: PokemonListItem, q: string): boolean {
  if (!q) return false;
  const needle = q.toLowerCase();
  return item.slug.startsWith(needle) || item.name.toLowerCase().includes(needle);
}

export function PokemonSearch({
  onPick,
  placeholder = "Add a Pokémon…",
}: {
  onPick: (mon: Pokemon) => void;
  placeholder?: string;
}) {
  const { list, loading } = usePokemonList();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const apiStatus = useAppStore((s) => s.apiStatus.pokeapi);

  const filtered = useMemo(() => {
    if (!q.trim()) return [];
    const res: PokemonListItem[] = [];
    for (const item of list) {
      if (matches(item, q.trim())) {
        res.push(item);
        if (res.length >= 8) break;
      }
    }
    return res;
  }, [q, list]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function commit(item: PokemonListItem) {
    setBusy(true);
    try {
      const data = await ensurePokemonDetail(item.slug);
      onPick(toLightPokemon(data));
      setQ("");
      setOpen(false);
    } catch {
      // Best-effort lightweight fallback — add with empty types so user can retry
      onPick({
        id: item.id,
        name: item.name,
        slug: item.slug,
        types: [],
        spriteUrl: spriteUrl(item.id),
        moves: [],
      });
      setQ("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-2 focus-within:border-primary">
        <Search size={14} className="text-muted shrink-0" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (!open || filtered.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => (i + 1) % filtered.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => (i - 1 + filtered.length) % filtered.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              commit(filtered[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={loading ? "Loading Pokédex…" : placeholder}
          disabled={loading || busy}
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted disabled:opacity-60"
        />
        <kbd className="hidden sm:inline text-[10px] font-mono text-muted px-1 py-0.5 rounded bg-bg border border-border">
          /
        </kbd>
      </div>
      {apiStatus === "down" && (
        <p className="mt-1 text-[11px] text-danger">
          PokeAPI unreachable — check your connection.
        </p>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-surface shadow-lg">
          {filtered.map((item, i) => (
            <li key={item.slug}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(item)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                  i === active ? "bg-surface-2" : ""
                }`}
              >
                <Image
                  src={spriteUrl(item.id)}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 [image-rendering:pixelated]"
                  unoptimized
                />
                <span className="flex-1 truncate">{item.name}</span>
                <span className="font-mono text-[10px] text-muted">
                  #{item.id.toString().padStart(4, "0")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
