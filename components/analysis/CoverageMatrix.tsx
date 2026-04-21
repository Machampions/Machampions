"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { multiplierBgVar, multiplierTextVar, multiplierLabel } from "@/lib/theme";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useAppStore } from "@/stores/appStore";

const CELL = 54;

export function CoverageMatrix() {
  const { matrix, mine, opps } = useAnalysis();
  const myPool = useAppStore((s) => s.myPool);
  const oppPool = useAppStore((s) => s.oppPool);
  const myBattle = useAppStore((s) => s.myBattle);
  const oppBattle = useAppStore((s) => s.oppBattle);
  const toggleBattle = useAppStore((s) => s.toggleBattle);

  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);

  if (mine.length === 0 || opps.length === 0) {
    return (
      <section className="rounded-[10px] border border-border bg-surface p-4 text-sm text-muted">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[1.5px] text-text mb-2">
          Coverage Matrix
        </h3>
        <p>Draft both teams to see the coverage matrix.</p>
      </section>
    );
  }

  // Resolve pool indices for each analyzed mon so we can drive battle-toggle on click
  const myIndices = mine.map((m) => m.slotIndex ?? myPool.findIndex((p) => p?.slug === m.pokemon.slug));
  const oppIndices = opps.map((o) => o.slotIndex ?? oppPool.findIndex((p) => p?.slug === o.pokemon.slug));

  return (
    <section className="rounded-[10px] border border-border bg-surface">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[1.5px] text-text">
          Coverage Matrix
        </h3>
        <span className="font-mono text-[10px] text-muted">
          offense <span className="text-text">▲</span> &nbsp;·&nbsp; defense{" "}
          <span className="text-text">▼</span>
        </span>
      </header>

      {/* Matrix table */}
      <div className="flex justify-center p-5 overflow-x-auto">
        <table style={{ borderCollapse: "separate", borderSpacing: 4 }}>
          <thead>
            <tr>
              <th />
              {opps.map((o, ci) => {
                const poolIdx = oppIndices[ci];
                const isOppPicked = poolIdx >= 0 && oppBattle.includes(poolIdx);
                const hasOppPicks = oppBattle.length > 0;
                return (
                  <th
                    key={o.pokemon.slug}
                    style={{ padding: 0, paddingBottom: 8 }}
                  >
                    <button
                      type="button"
                      onClick={() => poolIdx >= 0 && toggleBattle("opp", poolIdx)}
                      className="flex flex-col items-center gap-1.5 rounded-lg transition-all"
                      style={{
                        width: CELL,
                        background: isOppPicked
                          ? "var(--color-danger-soft)"
                          : "transparent",
                        border: `1px solid ${isOppPicked ? "var(--color-danger)" : "transparent"}`,
                        padding: "4px 2px",
                        opacity: isOppPicked || !hasOppPicks ? 1 : 0.4,
                      }}
                      title={o.pokemon.name}
                    >
                      <span
                        className="inline-flex items-center justify-center overflow-hidden rounded-full"
                        style={{
                          height: 32,
                          width: 32,
                          background: "var(--color-surface-2)",
                          border: `1px solid ${isOppPicked ? "var(--color-danger)" : "var(--color-border-hi)"}`,
                          boxShadow: isOppPicked
                            ? `0 0 0 3px var(--color-danger-soft)`
                            : "none",
                        }}
                      >
                        <Image
                          src={o.pokemon.spriteUrl}
                          alt=""
                          width={28}
                          height={28}
                          className="[image-rendering:pixelated]"
                          unoptimized
                        />
                      </span>
                      <span
                        className={clsx(
                          "text-[10px] truncate",
                          isOppPicked ? "text-danger font-semibold" : "text-muted font-medium",
                        )}
                        style={{ maxWidth: CELL + 4, width: "100%", textAlign: "center" }}
                      >
                        {o.pokemon.name}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, ri) => {
              const poolIdx = myIndices[ri];
              const isMyPicked = poolIdx >= 0 && myBattle.includes(poolIdx);
              const hasMyPicks = myBattle.length > 0;
              return (
                <tr key={mine[ri].pokemon.slug}>
                  <th style={{ padding: 0, paddingRight: 10 }}>
                    <button
                      type="button"
                      onClick={() => poolIdx >= 0 && toggleBattle("my", poolIdx)}
                      className="flex items-center gap-2.5 rounded-lg transition-all text-left"
                      style={{
                        width: 150,
                        background: isMyPicked
                          ? "var(--color-primary-soft)"
                          : "transparent",
                        border: `1px solid ${isMyPicked ? "var(--color-primary)" : "transparent"}`,
                        padding: "4px 6px",
                        opacity: isMyPicked || !hasMyPicks ? 1 : 0.35,
                      }}
                    >
                      <span
                        className="inline-flex items-center justify-center overflow-hidden rounded-full shrink-0"
                        style={{
                          height: 30,
                          width: 30,
                          background: "var(--color-surface-2)",
                          border: `1px solid ${isMyPicked ? "var(--color-primary)" : "var(--color-border-hi)"}`,
                          boxShadow: isMyPicked
                            ? `0 0 0 3px var(--color-primary-soft)`
                            : "none",
                        }}
                      >
                        <Image
                          src={mine[ri].pokemon.spriteUrl}
                          alt=""
                          width={26}
                          height={26}
                          className="[image-rendering:pixelated]"
                          unoptimized
                        />
                      </span>
                      <span
                        className={clsx(
                          "text-xs font-semibold truncate flex-1 min-w-0",
                          isMyPicked ? "text-primary" : "text-text",
                        )}
                      >
                        {mine[ri].pokemon.name}
                      </span>
                    </button>
                  </th>
                  {row.map((cell, ci) => {
                    const oppPoolIdx = oppIndices[ci];
                    const isOppPicked = oppPoolIdx >= 0 && oppBattle.includes(oppPoolIdx);
                    const rowH = isMyPicked;
                    const colH = isOppPicked;
                    const bothH = rowH && colH;
                    const anyPicks = hasMyPicks || oppBattle.length > 0;
                    const dim = anyPicks && !(rowH || colH);
                    const hov = hoverCell?.[0] === ri && hoverCell?.[1] === ci;
                    return (
                      <td key={ci} style={{ padding: 0 }}>
                        <div
                          onMouseEnter={() => setHoverCell([ri, ci])}
                          onMouseLeave={() => setHoverCell(null)}
                          title={`Offense ${multiplierLabel(cell.offense)} / Defense ${multiplierLabel(cell.defense)}`}
                          style={{
                            width: CELL,
                            height: CELL,
                            borderRadius: 7,
                            background: multiplierBgVar(cell.offense),
                            borderStyle: "solid",
                            borderWidth: bothH ? 2 : rowH || colH ? 1.5 : 1,
                            borderColor: bothH
                              ? "var(--color-primary)"
                              : rowH
                                ? "var(--color-primary)"
                                : colH
                                  ? "var(--color-danger)"
                                  : hov
                                    ? "var(--color-border-hi)"
                                    : "var(--color-border)",
                            boxShadow: bothH
                              ? `0 0 0 2px var(--color-primary-soft), 0 2px 6px rgba(0,0,0,0.12)`
                              : rowH
                                ? `0 0 0 1px var(--color-primary-soft)`
                                : colH
                                  ? `0 0 0 1px var(--color-danger-soft)`
                                  : "none",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: dim ? 0.25 : 1,
                            transform: bothH ? "scale(1.04)" : "scale(1)",
                            transition: "all 0.12s",
                            position: "relative",
                            zIndex: bothH ? 2 : rowH || colH ? 1 : 0,
                          }}
                        >
                          <span
                            className="font-mono font-bold"
                            style={{
                              fontSize: 14,
                              color: multiplierTextVar(cell.offense),
                              lineHeight: 1,
                            }}
                          >
                            {multiplierLabel(cell.offense)}
                          </span>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: 10,
                              color: "var(--color-muted)",
                              marginTop: 4,
                              lineHeight: 1,
                            }}
                          >
                            {multiplierLabel(cell.defense)}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend + hover status */}
      <div className="flex items-center gap-4 flex-wrap px-5 py-3 border-t border-border bg-surface-2/60">
        <span className="font-mono text-[10px] text-muted tracking-[1px]">
          LEGEND
        </span>
        {[0, 0.5, 1, 2, 4].map((v) => (
          <div key={v} className="flex items-center gap-1.5">
            <span
              className="inline-block"
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: multiplierBgVar(v),
                border: "1px solid var(--color-border)",
              }}
            />
            <span
              className="font-mono text-[10px]"
              style={{ color: multiplierTextVar(v) }}
            >
              {multiplierLabel(v)}
            </span>
          </div>
        ))}
        <span className="flex-1" />
        <span
          className="font-mono text-[10px] text-muted truncate"
          style={{ maxWidth: "50%" }}
        >
          {hoverCell ? (
            <>
              <span className="text-primary">
                {mine[hoverCell[0]]?.pokemon.name}
              </span>
              <span className="mx-2">vs</span>
              <span className="text-danger">
                {opps[hoverCell[1]]?.pokemon.name}
              </span>
              <span className="mx-2">·</span>
              <span>
                off {multiplierLabel(matrix[hoverCell[0]][hoverCell[1]].offense)}{" "}
                / def{" "}
                {multiplierLabel(matrix[hoverCell[0]][hoverCell[1]].defense)}
              </span>
            </>
          ) : (
            "hover a cell for details"
          )}
        </span>
      </div>
    </section>
  );
}

