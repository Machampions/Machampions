"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Modal, ModalHeader } from "@/components/ui/Modal";
import { ensurePokemonDetail } from "@/hooks/usePokemonDetail";
import { usePoolSuggestions } from "@/hooks/useOpponentSuggestions";
import {
  fetchPokemonList,
  spriteUrl,
  toLightPokemon,
} from "@/lib/pokeapi";
import { useAppStore, POOL_SLOTS } from "@/stores/appStore";
import type { Pokemon, PokemonListItem } from "@/lib/types";

let LIST_CACHE: PokemonListItem[] | null = null;
let LIST_PROMISE: Promise<PokemonListItem[]> | null = null;

function loadList(): Promise<PokemonListItem[]> {
  if (LIST_CACHE) return Promise.resolve(LIST_CACHE);
  if (!LIST_PROMISE) {
    LIST_PROMISE = fetchPokemonList()
      .then((data) => {
        LIST_CACHE = data;
        return data;
      })
      .catch((e) => {
        LIST_PROMISE = null;
        throw e;
      });
  }
  return LIST_PROMISE;
}

interface Props {
  side: "my" | "opp";
  onClose: () => void;
}

type Row = {
  slug: string;
  displayName: string;
  spriteId?: number;
  usagePct?: number;
  recommended?: boolean;
};

function matches(item: PokemonListItem, q: string): boolean {
  if (!q) return false;
  const needle = q.toLowerCase();
  return (
    item.slug.toLowerCase().includes(needle) ||
    item.name.toLowerCase().includes(needle)
  );
}

export function AddMonModal({ side, onClose }: Props) {
  const suggestions = usePoolSuggestions(side);
  const pool = useAppStore((s) => (side === "my" ? s.myPool : s.oppPool));
  const addToPool = useAppStore((s) => s.addToPool);
  const setApiStatus = useAppStore((s) => s.setApiStatus);
  const pokemonCache = useAppStore((s) => s.pokemonCache);

  const [list, setList] = useState<PokemonListItem[]>(LIST_CACHE ?? []);
  const [loading, setLoading] = useState(!LIST_CACHE);
  const [error, setError] = useState<Error | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = side === "my" ? "my pool" : "opponent pool";
  const accentClass = side === "my" ? "text-primary" : "text-danger";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (LIST_CACHE) return;
    let cancelled = false;
    loadList()
      .then((data) => {
        if (cancelled) return;
        setList(data);
        setLoading(false);
        setApiStatus({ pokeapi: "ok" });
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e);
        setLoading(false);
        setApiStatus({ pokeapi: "down" });
      });
    return () => {
      cancelled = true;
    };
  }, [setApiStatus]);

  const listBySlug = useMemo(() => {
    const m = new Map<string, PokemonListItem>();
    for (const it of list) m.set(it.slug, it);
    return m;
  }, [list]);

  const rows: Row[] = useMemo(() => {
    const needle = q.trim();
    if (needle) {
      const hits: Row[] = [];
      for (const item of list) {
        if (matches(item, needle)) {
          hits.push({
            slug: item.slug,
            displayName: item.name,
            spriteId: item.id,
          });
          if (hits.length >= 30) break;
        }
      }
      return hits;
    }
    if (side !== "opp" || !suggestions) return [];
    return suggestions.map((s) => {
      const item = listBySlug.get(s.slug);
      const cached = pokemonCache.get(s.slug);
      return {
        slug: s.slug,
        displayName: s.displayName,
        spriteId: item?.id ?? cached?.id,
        usagePct: s.usagePct,
        recommended: true,
      };
    });
  }, [q, list, listBySlug, pokemonCache, suggestions, side]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  async function commit(row: Row) {
    if (busy) return;
    const idx = pool.findIndex((p) => p === null);
    if (idx === -1 || idx >= POOL_SLOTS) {
      onClose();
      return;
    }
    const flashNotice = (msg: string) => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      setNotice(msg);
      noticeTimer.current = setTimeout(() => setNotice(null), 1400);
    };
    setBusy(true);
    try {
      const data = await ensurePokemonDetail(row.slug);
      const mon = toLightPokemon(data);
      const result = addToPool(side, mon);
      if (!result.ok) {
        if (result.reason === "duplicate") flashNotice("Already in pool");
        return;
      }
      onClose();
    } catch {
      const fallback: Pokemon = {
        id: row.spriteId ?? 0,
        name: row.displayName,
        slug: row.slug,
        types: [],
        spriteUrl: row.spriteId ? spriteUrl(row.spriteId) : "",
        moves: [],
      };
      const result = addToPool(side, fallback);
      if (!result.ok) {
        if (result.reason === "duplicate") flashNotice("Already in pool");
        return;
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} width={480} labelledBy="add-mon-title">
      <ModalHeader
        title="Add creature"
        titleId="add-mon-title"
        subtitle={
          <>
            → <span className={accentClass}>{title}</span>
          </>
        }
        onClose={onClose}
      />
      <div className="flex flex-col gap-[10px] p-[14px]">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-[8px] focus-within:border-primary">
          <Search size={14} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (rows.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => (i + 1) % rows.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => (i - 1 + rows.length) % rows.length);
              } else if (e.key === "Enter") {
                e.preventDefault();
                commit(rows[active]);
              }
            }}
            placeholder={
              loading ? "Loading Pokédex…" : "Search 1,000+ creatures…"
            }
            disabled={loading || busy}
            className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted disabled:opacity-60"
          />
          <span className="font-mono text-[10px] text-dim">{rows.length}</span>
        </div>

        {error && (
          <p className="text-[11px] text-danger">
            PokeAPI unreachable — check your connection.
          </p>
        )}
        {notice && (
          <p className="text-[11px] text-danger font-medium">{notice}</p>
        )}

        <div className="flex max-h-[320px] flex-col gap-[6px] overflow-auto">
          {!loading && rows.length === 0 && q.trim() && (
            <div className="px-2 py-6 text-center text-[12px] text-muted">
              No matches for &ldquo;{q}&rdquo;
            </div>
          )}
          {!loading && rows.length === 0 && !q.trim() && (
            <div className="px-2 py-6 text-center text-[12px] text-muted">
              Start typing to search the Pokédex.
            </div>
          )}
          {rows.map((row, i) => {
            const isActive = i === active;
            return (
              <button
                key={row.slug}
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(row)}
                className="flex min-w-0 items-center gap-[10px] rounded-lg border border-border bg-surface-2 p-[10px] text-left text-text transition-colors hover:border-border-hi"
                style={{
                  background: isActive
                    ? "var(--color-primary-soft)"
                    : "var(--color-surface-2)",
                  borderColor: isActive
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                }}
              >
                {row.spriteId ? (
                  <Image
                    src={spriteUrl(row.spriteId)}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    className="h-8 w-8 shrink-0 [image-rendering:pixelated]"
                  />
                ) : (
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface text-[12px] font-bold uppercase text-muted">
                    {row.displayName[0]}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">
                    {row.displayName}
                  </div>
                  {row.recommended && row.usagePct !== undefined && (
                    <div className="font-mono text-[10px] text-muted">
                      usage {row.usagePct.toFixed(1)}%
                      <span className="ml-1 text-primary">★</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
