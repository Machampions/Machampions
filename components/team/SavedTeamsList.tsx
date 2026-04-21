"use client";

import { useState } from "react";
import { Save, Trash2, Upload, Download, RotateCcw } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { ensurePokemonDetail } from "@/hooks/usePokemonDetail";
import { toLightPokemon } from "@/lib/pokeapi";
import {
  formatShowdown,
  moveToSlug,
  parseShowdown,
  slugToPretty,
} from "@/lib/showdown";

const SHOWDOWN_PLACEHOLDER = `Incineroar @ Sitrus Berry
Ability: Intimidate
- Fake Out
- Knock Off
- Flare Blitz
- Parting Shot

Whimsicott @ Focus Sash
Ability: Prankster
- Tailwind
- Moonblast
- Encore
- Protect`;

export function SavedTeamsList() {
  const savedTeams = useAppStore((s) => s.savedTeams);
  const saveTeam = useAppStore((s) => s.saveTeam);
  const deleteTeam = useAppStore((s) => s.deleteTeam);
  const loadTeam = useAppStore((s) => s.loadTeam);
  const myPool = useAppStore((s) => s.myPool);
  const myItems = useAppStore((s) => s.myItems);
  const myAbilities = useAppStore((s) => s.myAbilities);
  const myMovesets = useAppStore((s) => s.myMovesets);
  const resetAll = useAppStore((s) => s.resetAll);
  const importMyTeam = useAppStore((s) => s.importMyTeam);

  const [name, setName] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);

  const canSave = myPool.some((p) => p);

  function handleSave() {
    if (!canSave) return;
    saveTeam(name);
    setName("");
  }

  function handleExport(): string {
    const members = myPool
      .map((p, i) =>
        p
          ? {
              species: p.name,
              item: myItems[i] ?? undefined,
              ability: myAbilities[i] ?? undefined,
              moves: (myMovesets[i] ?? []).map((m) =>
                m ? slugToPretty(m) : null,
              ),
            }
          : null,
      )
      .filter((m): m is NonNullable<typeof m> => !!m);
    return formatShowdown(members);
  }

  async function handleImport() {
    setImportError(null);
    const parsed = parseShowdown(importText);
    if (parsed.length === 0) {
      setImportError("Couldn't parse any Pokémon — paste a Showdown export.");
      return;
    }
    setImporting(true);
    const results = await Promise.allSettled(
      parsed.slice(0, 6).map((m) => ensurePokemonDetail(m.slug)),
    );
    const members: Parameters<typeof importMyTeam>[0] = [];
    const failed: string[] = [];
    results.forEach((r, i) => {
      const src = parsed[i];
      if (r.status === "fulfilled") {
        members.push({
          pokemon: toLightPokemon(r.value),
          item: src.item ?? null,
          ability: src.ability ?? null,
          moves: src.moves.map(moveToSlug),
        });
      } else {
        failed.push(src.species);
      }
    });
    setImporting(false);
    if (members.length === 0) {
      setImportError(`Not found: ${failed.join(", ")}`);
      return;
    }
    importMyTeam(members);
    if (failed.length) {
      setImportError(`Imported ${members.length}. Not found: ${failed.join(", ")}`);
    } else {
      setImportText("");
      setShowImport(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border bg-surface-2 p-2">
        <div className="flex gap-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Team name"
            className="flex-1 min-w-0 bg-transparent text-sm outline-none px-1 placeholder:text-muted"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs text-bg font-medium disabled:opacity-40"
          >
            <Save size={12} /> Save
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowImport((v) => !v)}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-[11px] text-muted hover:text-text"
        >
          <Upload size={12} /> Import
        </button>
        <button
          type="button"
          onClick={() => {
            const text = handleExport();
            if (text) navigator.clipboard.writeText(text).catch(() => {});
          }}
          disabled={!canSave}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-[11px] text-muted hover:text-text disabled:opacity-40"
        >
          <Download size={12} /> Copy
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex items-center justify-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-[11px] text-muted hover:text-danger"
          aria-label="Reset all teams"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {showImport && (
        <div className="rounded-md border border-border bg-surface-2 p-2 flex flex-col gap-2">
          <div className="text-[11px] text-muted">
            Paste a Pokémon Showdown export (species, item, ability, moves).
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            placeholder={SHOWDOWN_PLACEHOLDER}
            spellCheck={false}
            className="w-full bg-bg border border-border rounded px-2 py-1 text-xs font-mono outline-none focus:border-primary whitespace-pre"
          />
          {importError && (
            <p className="text-[11px] text-danger">{importError}</p>
          )}
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="self-end rounded bg-primary px-2 py-1 text-xs text-bg font-medium disabled:opacity-40"
          >
            {importing ? "Loading…" : "Load"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div className="text-[11px] uppercase tracking-wide text-muted px-1">
          Saved teams
        </div>
        {savedTeams.length === 0 && (
          <div className="text-xs text-muted px-1 py-2">
            No teams saved yet.
          </div>
        )}
        <ul className="flex flex-col gap-1">
          {savedTeams.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-2 rounded border border-border bg-surface-2 px-2 py-1"
            >
              <button
                type="button"
                onClick={async () => {
                  await Promise.all(
                    t.members.map((slug) =>
                      ensurePokemonDetail(slug).catch(() => null),
                    ),
                  );
                  loadTeam(t.id, "my");
                }}
                className="flex-1 text-left text-xs"
              >
                <div className="font-medium truncate">{t.name}</div>
                <div className="font-mono text-[10px] text-muted truncate">
                  {t.members.join(", ")}
                </div>
              </button>
              <button
                type="button"
                onClick={() => deleteTeam(t.id)}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger"
                aria-label={`Delete ${t.name}`}
              >
                <Trash2 size={12} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
