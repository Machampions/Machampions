"use client";

import Image from "next/image";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { FormatToggle } from "@/components/ui/FormatToggle";
import { TeamPanel } from "@/components/team/TeamPanel";
import { AddMonModal } from "@/components/team/AddMonModal";
import { ImportModal } from "@/components/team/ImportModal";
import { SaveTeamModal } from "@/components/team/SaveTeamModal";
import { useApiStatus } from "@/hooks/useApiStatus";
import { CoverageMatrix } from "@/components/analysis/CoverageMatrix";
import { RecommendationPanel } from "@/components/analysis/RecommendationPanel";
import { PokemonDrawer } from "@/components/detail/PokemonDrawer";
import { DegradedBanner } from "@/components/ui/DegradedBanner";

type AddingSide = "my" | "opp" | null;

export default function Home() {
  useApiStatus();

  const [hoverLineup, setHoverLineup] = useState<{
    mine: number[];
    opp: number[];
  } | null>(null);
  const [addingTo, setAddingTo] = useState<AddingSide>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="grid h-[60px] grid-cols-[1fr_auto] items-center border-b border-border bg-surface px-6">
        <div className="flex min-w-0 items-center gap-[14px]">
          <Image
            src="/logo.png"
            alt="Machampion"
            width={36}
            height={36}
            priority
            className="h-9 w-9 shrink-0 [image-rendering:pixelated]"
          />
          <div className="text-base font-semibold tracking-tight">
            Machampion
          </div>
          <div className="h-[18px] w-px bg-border" />
          <FormatToggle />
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setSaveOpen(true)}
            className="rounded-[7px] border-none bg-primary px-[14px] py-[7px] text-xs font-semibold text-white"
          >
            Save team
          </button>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 items-start gap-3.5 p-3.5 xl:grid-cols-[240px_minmax(0,1fr)_240px]">
        <aside className="order-2 min-w-0 xl:order-1">
          <TeamPanel
            side="my"
            title="My Pool"
            accent="primary"
            highlightedIndices={hoverLineup?.mine ?? null}
            onAdd={() => setAddingTo("my")}
            onImport={() => setImportOpen(true)}
          />
        </aside>

        <section className="order-1 flex min-w-0 flex-col gap-3.5 xl:order-2">
          <DegradedBanner />
          <CoverageMatrix />
          <RecommendationPanel onHover={setHoverLineup} />
        </section>

        <aside className="order-3 min-w-0">
          <TeamPanel
            side="opp"
            title="Opponent Pool"
            accent="danger"
            highlightedIndices={hoverLineup?.opp ?? null}
            onAdd={() => setAddingTo("opp")}
          />
        </aside>
      </main>

      <PokemonDrawer />

      {addingTo && (
        <AddMonModal side={addingTo} onClose={() => setAddingTo(null)} />
      )}
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
      {saveOpen && <SaveTeamModal onClose={() => setSaveOpen(false)} />}
    </div>
  );
}
