"use client";

import { useRef, useState } from "react";
import { Modal, ModalHeader } from "@/components/ui/Modal";
import { ensurePokemonDetail } from "@/hooks/usePokemonDetail";
import { toLightPokemon } from "@/lib/pokeapi";
import { moveToSlug, parseShowdown } from "@/lib/showdown";
import { useAppStore, POOL_SLOTS } from "@/stores/appStore";

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

interface Props {
  onClose: () => void;
}

export function ImportModal({ onClose }: Props) {
  const importMyTeam = useAppStore((s) => s.importMyTeam);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    setImportError(null);
    const parsed = parseShowdown(importText);
    if (parsed.length === 0) {
      setImportError("Couldn't parse any Pokémon — paste a Showdown export.");
      return;
    }
    setImporting(true);
    const results = await Promise.allSettled(
      parsed.slice(0, POOL_SLOTS).map((m) => ensurePokemonDetail(m.slug)),
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
      setImportError(
        `Imported ${members.length}. Not found: ${failed.join(", ")}`,
      );
    } else {
      setImportText("");
      onClose();
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => setImportText(text));
    e.target.value = "";
  }

  return (
    <Modal onClose={onClose} width={480} labelledBy="import-title">
      <ModalHeader
        title="Import team"
        titleId="import-title"
        subtitle="Showdown export · paste or drop a file"
        onClose={onClose}
      />
      <div className="flex flex-col gap-[10px] p-[14px]">
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={SHOWDOWN_PLACEHOLDER}
          spellCheck={false}
          className="w-full min-h-[160px] rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs text-text outline-none resize-vertical focus:border-primary"
        />
        {importError && (
          <p className="text-[11px] text-danger">{importError}</p>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="flex-1 rounded-lg bg-primary px-3 py-[10px] text-xs font-semibold text-white disabled:opacity-60"
          >
            {importing ? "Loading…" : "Parse & add"}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-border bg-transparent px-[14px] py-[10px] text-xs text-muted hover:text-text"
          >
            Upload file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.team,.json,text/plain"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      </div>
    </Modal>
  );
}
