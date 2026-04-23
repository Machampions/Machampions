"use client";

import Image from "next/image";
import { useState } from "react";
import { Save } from "lucide-react";
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
          <div className="hidden text-base font-semibold tracking-tight xl:block">
            Machampions
          </div>
          <div className="hidden h-[18px] w-px bg-border xl:block" />
          <FormatToggle />
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setSaveOpen(true)}
            aria-label="Save team"
            title="Save team"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:border-primary hover:text-text xl:h-auto xl:w-auto xl:rounded-[7px] xl:border-none xl:bg-primary xl:px-[14px] xl:py-[7px] xl:text-xs xl:font-semibold xl:text-white"
          >
            <Save size={16} className="xl:hidden" />
            <span className="hidden xl:inline">Save team</span>
          </button>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 items-start gap-3.5 p-3.5 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <aside className="order-2 min-w-0 xl:order-1 xl:self-start xl:sticky xl:top-3.5">
          <TeamPanel
            side="my"
            title="My Pool"
            accent="primary"
            onAdd={() => setAddingTo("my")}
            onImport={() => setImportOpen(true)}
          />
        </aside>

        <section className="order-1 flex min-w-0 flex-col gap-3.5 xl:order-2">
          <DegradedBanner />
          <CoverageMatrix />
          <RecommendationPanel />
        </section>

        <aside className="order-3 min-w-0 xl:self-start xl:sticky xl:top-3.5">
          <TeamPanel
            side="opp"
            title="Opponent Pool"
            accent="danger"
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
