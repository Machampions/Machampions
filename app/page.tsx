"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { APIStatusDot } from "@/components/ui/APIStatusDot";
import { TeamPanel } from "@/components/team/TeamPanel";
import { SavedTeamsList } from "@/components/team/SavedTeamsList";
import { useApiStatus } from "@/hooks/useApiStatus";
import { usePoolSuggestions } from "@/hooks/useOpponentSuggestions";
import { CoverageMatrix } from "@/components/analysis/CoverageMatrix";
import { RecommendationPanel } from "@/components/analysis/RecommendationPanel";
import { AnalysisSummary } from "@/components/analysis/AnalysisSummary";
import { PokemonDrawer } from "@/components/detail/PokemonDrawer";
import { DegradedBanner } from "@/components/ui/DegradedBanner";
import { useAppStore } from "@/stores/appStore";

export default function Home() {
  useApiStatus();
  const mySuggestions = usePoolSuggestions("my");
  const oppSuggestions = usePoolSuggestions("opp");
  const format = useAppStore((s) => s.format);

  const [hoverLineup, setHoverLineup] = useState<{
    mine: number[];
    opp: number[];
  } | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar — tactical cockpit header */}
      <header className="grid grid-cols-[1fr_auto] items-center px-6 border-b border-border bg-surface h-[60px]">
        <div className="flex items-center gap-[14px] min-w-0">
          <div
            className="h-7 w-7 rounded-[7px] flex items-center justify-center shrink-0"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary), var(--color-danger))",
            }}
            aria-hidden
          >
            <span
              className="block h-[11px] w-[11px] rotate-45"
              style={{ background: "var(--color-surface)", borderRadius: 2 }}
            />
          </div>
          <div className="font-semibold text-base tracking-tight">
            Champions Drafter
          </div>
          <div className="h-[18px] w-px bg-border" />
          <FormatBadge format={format} />
        </div>

        <div className="flex items-center gap-4">
          <APIStatusDot />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)_240px] gap-3.5 p-3.5 items-start">
        {/* Col 1 — My Pool + Saved teams */}
        <aside className="flex flex-col gap-3.5 order-2 xl:order-1 min-w-0">
          <TeamPanel
            side="my"
            title="My Pool"
            accent="primary"
            suggestions={mySuggestions}
            highlightedIndices={hoverLineup?.mine ?? null}
          />
          <SavedTeamsList />
        </aside>

        {/* Col 2 — Matrix + Recommendations stacked */}
        <section className="flex flex-col gap-3.5 order-1 xl:order-2 min-w-0">
          <DegradedBanner />
          <CoverageMatrix />
          <RecommendationPanel onHover={setHoverLineup} />
        </section>

        {/* Col 3 — Opponent Pool + Analysis summary */}
        <aside className="flex flex-col gap-3.5 order-3">
          <TeamPanel
            side="opp"
            title="Opponent Pool"
            accent="danger"
            suggestions={oppSuggestions}
            highlightedIndices={hoverLineup?.opp ?? null}
          />
          <AnalysisSummary />
        </aside>
      </main>

      <PokemonDrawer />
    </div>
  );
}

function FormatBadge({ format }: { format: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 px-[10px] py-[5px] rounded-[7px] border border-border bg-surface-2"
      style={{ color: "var(--color-text)" }}
    >
      <Pokeball />
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.5px] text-text">
        {format}
      </span>
    </span>
  );
}

function Pokeball() {
  return (
    <svg width={14} height={14} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle
        cx="10"
        cy="10"
        r="8.5"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M1.5 10H18.5" stroke="currentColor" strokeWidth="1.4" />
      <circle
        cx="10"
        cy="10"
        r="2.2"
        fill="var(--color-surface)"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
