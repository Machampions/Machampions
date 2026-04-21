"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import Image from "next/image";
import { usePokemonList } from "@/hooks/usePokemonList";
import { ensurePokemonDetail } from "@/hooks/usePokemonDetail";
import { spriteUrl, toLightPokemon } from "@/lib/pokeapi";
import type { Pokemon, PokemonListItem } from "@/lib/types";
import type { Suggestion } from "@/hooks/useOpponentSuggestions";
import { useAppStore } from "@/stores/appStore";

function matches(item: PokemonListItem, q: string): boolean {
  if (!q) return false;
  const needle = q.toLowerCase();
  return item.slug.startsWith(needle) || item.name.toLowerCase().includes(needle);
}

interface SuggestionRow {
  slug: string;
  displayName: string;
  usagePct: number;
  reason: Suggestion["reason"];
  boostedBy?: string;
  spriteId?: number;
}

export function PokemonSearch({
  onPick,
  placeholder = "Add a Pokémon…",
  suggestions,
}: {
  onPick: (mon: Pokemon) => void;
  placeholder?: string;
  suggestions?: Suggestion[];
}) {
  const { list, loading } = usePokemonList();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const apiStatus = useAppStore((s) => s.apiStatus.pokeapi);
  const pokemonCache = useAppStore((s) => s.pokemonCache);

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

  const listBySlug = useMemo(() => {
    const m = new Map<string, PokemonListItem>();
    for (const it of list) m.set(it.slug, it);
    return m;
  }, [list]);

  const suggestionRows = useMemo<SuggestionRow[]>(() => {
    if (!suggestions) return [];
    return suggestions.map((s) => {
      const item = listBySlug.get(s.slug);
      const cached = pokemonCache.get(s.slug);
      return {
        slug: s.slug,
        displayName: s.displayName,
        usagePct: s.usagePct,
        reason: s.reason,
        boostedBy: s.boostedBy,
        spriteId: item?.id ?? cached?.id,
      };
    });
  }, [suggestions, listBySlug, pokemonCache]);

  // Warm sprite cache for any suggestion not yet in PokeAPI list (rare)
  useEffect(() => {
    if (!suggestions) return;
    for (const s of suggestions) {
      if (!listBySlug.has(s.slug) && !pokemonCache.get(s.slug)) {
        ensurePokemonDetail(s.slug).catch(() => {});
      }
    }
  }, [suggestions, listBySlug, pokemonCache]);

  const showSuggestions =
    open && !q.trim() && suggestionRows.length > 0;
  const showFiltered = open && q.trim().length > 0 && filtered.length > 0;
  const navLength = showSuggestions
    ? suggestionRows.length
    : showFiltered
      ? filtered.length
      : 0;

  useEffect(() => {
    setActive(0);
  }, [q, showSuggestions]);

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

  async function commitItem(item: PokemonListItem) {
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

  async function commitSlug(slug: string, fallbackName: string) {
    const item = listBySlug.get(slug);
    if (item) return commitItem(item);
    setBusy(true);
    try {
      const data = await ensurePokemonDetail(slug);
      onPick(toLightPokemon(data));
      setQ("");
      setOpen(false);
    } catch {
      onPick({
        id: 0,
        name: fallbackName,
        slug,
        types: [],
        spriteUrl: "",
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
            if (!open || navLength === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => (i + 1) % navLength);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => (i - 1 + navLength) % navLength);
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (showFiltered) commitItem(filtered[active]);
              else if (showSuggestions) {
                const s = suggestionRows[active];
                commitSlug(s.slug, s.displayName);
              }
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
      {showFiltered && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-surface shadow-lg">
          {filtered.map((item, i) => (
            <li key={item.slug}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commitItem(item)}
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
      {showSuggestions && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-lg">
          <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wide text-muted">
            Suggestions
          </div>
          <ul className="max-h-72 overflow-auto">
            {suggestionRows.map((s, i) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commitSlug(s.slug, s.displayName)}
                  onMouseEnter={() => setActive(i)}
                  title={
                    s.reason === "teammate" && s.boostedBy
                      ? `Paired with ${s.boostedBy} in ${s.usagePct}% of teams`
                      : `${s.usagePct}% of teams run this`
                  }
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                    i === active ? "bg-surface-2" : ""
                  }`}
                >
                  {s.spriteId ? (
                    <Image
                      src={spriteUrl(s.spriteId)}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 [image-rendering:pixelated]"
                      unoptimized
                    />
                  ) : (
                    <span className="h-8 w-8 inline-flex items-center justify-center rounded bg-surface-2 text-[12px] font-bold uppercase text-muted">
                      {s.displayName[0]}
                    </span>
                  )}
                  <span className="flex-1 truncate">{s.displayName}</span>
                  <span className="font-mono text-[10px] text-muted">
                    {s.usagePct.toFixed(1)}% usage
                    {s.reason === "teammate" && (
                      <span className="ml-1 text-primary">★</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
