"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Modal, ModalHeader } from "@/components/ui/Modal";
import { ensurePokemonDetail } from "@/hooks/usePokemonDetail";
import { usePoolSuggestions } from "@/hooks/useOpponentSuggestions";
import { toLightPokemon } from "@/lib/pokeapi";
import {
  CHAMPIONS_LEGAL_LIST,
  getChampionsEntry,
  normalizePokemonLookupToken,
} from "@/src/data/pokemon-registry";
import { useAppStore, POOL_SLOTS } from "@/stores/appStore";
import type { Pokemon } from "@/lib/types";

interface Props {
  side: "my" | "opp";
  onClose: () => void;
}

type Row = {
  slug: string;
  displayName: string;
  spriteUrl?: string;
  usagePct?: number;
  recommended?: boolean;
};

const SEARCH_ALIASES_BY_SLUG: Record<string, string[]> = {
  "samurott-hisui": ["hisuian-samurott", "hisui-samurott", "hisui"],
  "basculegion-male": ["basculegion", "hisui", "hisuian-basculegion"],
};

function fuzzyScore(text: string, query: string): number {
  if (!text || !query) return 0;
  if (text === query) return 120;
  if (text.startsWith(query)) return 100;
  if (text.includes(query)) return 80;

  const textTokens = new Set(text.split("-").filter(Boolean));
  const queryTokens = query.split("-").filter(Boolean);
  if (queryTokens.length > 1 && queryTokens.every((token) => textTokens.has(token))) {
    return 70;
  }

  let qi = 0;
  for (let i = 0; i < text.length && qi < query.length; i++) {
    if (text[i] === query[qi]) qi += 1;
  }
  return qi === query.length ? 60 : 0;
}

export function AddMonModal({ side, onClose }: Props) {
  const suggestions = usePoolSuggestions(side);
  const pool = useAppStore((s) => (side === "my" ? s.myPool : s.oppPool));
  const addToPool = useAppStore((s) => s.addToPool);

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

  const rows: Row[] = useMemo((): Row[] => {
    const needle = q.trim();
    if (needle) {
      const normalizedNeedle = normalizePokemonLookupToken(needle);
      const ranked: Array<Row & { score: number; legal: boolean }> = [];

      for (const entry of CHAMPIONS_LEGAL_LIST) {
        const aliasScores = (SEARCH_ALIASES_BY_SLUG[entry.slug] ?? []).map((alias) =>
          fuzzyScore(normalizePokemonLookupToken(alias), normalizedNeedle),
        );
        const score = Math.max(
          fuzzyScore(normalizePokemonLookupToken(entry.name), normalizedNeedle),
          fuzzyScore(normalizePokemonLookupToken(entry.slug), normalizedNeedle),
          ...aliasScores,
        );
        if (score <= 0) continue;
        ranked.push({
          slug: entry.slug,
          displayName: entry.name,
          spriteUrl: entry.spriteUrl,
          score,
          legal: true,
        });
      }

      ranked.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return a.displayName.localeCompare(b.displayName);
      });

      return ranked.slice(0, 30).map(({ score, legal, ...row }) => row);
    }
    if (side !== "opp" || !suggestions) return [];
    return suggestions.map((s) => {
      const legalEntry = getChampionsEntry(s.slug) ?? getChampionsEntry(s.displayName);
      if (!legalEntry) return null;
      return {
        slug: legalEntry.slug,
        displayName: legalEntry.name,
        spriteUrl: legalEntry.spriteUrl,
        usagePct: s.usagePct,
        recommended: true,
      };
    }).filter((row): row is Row => !!row);
  }, [q, suggestions, side]);

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
        id: 0,
        name: row.displayName,
        slug: row.slug,
        types: [],
        spriteUrl: row.spriteUrl ?? "",
        isLegal: true,
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
            placeholder="Search Champions-legal creatures…"
            disabled={busy}
            className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted disabled:opacity-60"
          />
          <span className="font-mono text-[10px] text-dim">{rows.length}</span>
        </div>

        {notice && (
          <p className="text-[11px] text-danger font-medium">{notice}</p>
        )}

        <div className="flex max-h-[320px] flex-col gap-[6px] overflow-auto">
          {rows.length === 0 && q.trim() && (
            <div className="px-2 py-6 text-center text-[12px] text-muted">
              No matches for &ldquo;{q}&rdquo;
            </div>
          )}
          {rows.length === 0 && !q.trim() && (
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
                {row.spriteUrl ? (
                  <Image
                    src={row.spriteUrl}
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
