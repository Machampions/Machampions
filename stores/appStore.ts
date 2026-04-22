"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ApiStatusMap,
  Pokemon,
  PokemonData,
  SavedTeam,
  Theme,
  TopList,
  UsageData,
} from "@/lib/types";

const POOL_SIZE = 6;
const MAX_BATTLE_SIZE = 4;
const MOVESET_SIZE = 4;

type DrawerTab = "strengths" | "weaknesses" | "coverage";
type TeamSize = 3 | 4;

interface PersistedSlice {
  savedTeams: SavedTeam[];
  theme: Theme;
  format: string;
  teamSize: TeamSize;
}

interface AppState extends PersistedSlice {
  myPool: (Pokemon | null)[];
  oppPool: (Pokemon | null)[];
  myBattle: number[];
  oppBattle: number[];
  hoveredLineup: { my: number[]; opp: number[] } | null;
  myMovesets: (string | null)[][];
  myItems: (string | null)[];
  myAbilities: (string | null)[];

  pokemonCache: Map<string, PokemonData>;
  usageCache: Map<string, UsageData>;
  topListCache: Map<string, TopList>;

  selectedSide: "my" | "opp" | null;
  selectedSlot: number | null;

  drawerTab: DrawerTab;
  apiStatus: ApiStatusMap;

  setTheme: (t: Theme) => void;
  setFormat: (f: string) => void;
  setTeamSize: (n: TeamSize) => void;

  setSlot: (side: "my" | "opp", idx: number, mon: Pokemon | null) => void;
  addToPool: (
    side: "my" | "opp",
    mon: Pokemon,
  ) => { ok: true; index: number } | { ok: false; reason: "duplicate" | "full" };
  clearSide: (side: "my" | "opp") => void;
  resetAll: () => void;
  setMyMovesetMove: (
    teamIdx: number,
    moveIdx: number,
    moveName: string | null,
  ) => void;
  clearMyMoveset: (teamIdx: number) => void;
  setMyItem: (teamIdx: number, item: string | null) => void;
  setMyAbility: (teamIdx: number, ability: string | null) => void;
  importMyTeam: (
    members: {
      pokemon: Pokemon;
      item?: string | null;
      ability?: string | null;
      moves?: (string | null)[];
    }[],
  ) => void;

  toggleBattle: (side: "my" | "opp", idx: number) => void;
  setBattle: (side: "my" | "opp", battle: number[]) => void;
  setHoveredLineup: (lineup: { my: number[]; opp: number[] } | null) => void;

  openDrawer: (side: "my" | "opp", idx: number) => void;
  closeDrawer: () => void;
  setDrawerTab: (t: DrawerTab) => void;

  cachePokemon: (data: PokemonData) => void;
  cacheUsage: (data: UsageData) => void;
  cacheTopList: (list: TopList) => void;

  setApiStatus: (patch: Partial<ApiStatusMap>) => void;

  saveTeam: (name: string) => void;
  loadTeam: (id: string, into: "my" | "opp") => void;
  deleteTeam: (id: string) => void;
}

const emptyPool = (): (Pokemon | null)[] =>
  Array.from({ length: POOL_SIZE }, () => null);

const emptyMovesets = (): (string | null)[][] =>
  Array.from({ length: POOL_SIZE }, () =>
    Array.from({ length: MOVESET_SIZE }, () => null),
  );

const emptySlotStrings = (): (string | null)[] =>
  Array.from({ length: POOL_SIZE }, () => null);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      myPool: emptyPool(),
      oppPool: emptyPool(),
      myBattle: [],
      oppBattle: [],
      hoveredLineup: null,
      myMovesets: emptyMovesets(),
      myItems: emptySlotStrings(),
      myAbilities: emptySlotStrings(),

      pokemonCache: new Map(),
      usageCache: new Map(),
      topListCache: new Map(),

      savedTeams: [],
      selectedSide: null,
      selectedSlot: null,

      drawerTab: "strengths",
      theme: "light",
      format: "championspreview",
      teamSize: 3,
      apiStatus: { pokeapi: "unknown", pikalytics: "unknown" },

      setTheme: (t) => {
        set({ theme: t });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", t);
        }
      },
      setFormat: (f) => set({ format: f }),
      setTeamSize: (n) => {
        set({
          teamSize: n,
          myBattle: get().myBattle.slice(0, n),
          oppBattle: get().oppBattle.slice(0, n),
        });
      },

      setSlot: (side, idx, mon) => {
        const key = side === "my" ? "myPool" : "oppPool";
        const battleKey = side === "my" ? "myBattle" : "oppBattle";
        const pool = [...get()[key]];
        pool[idx] = mon;
        const patch: Partial<AppState> = {};
        if (side === "my" && mon === null) {
          patch.myMovesets = get().myMovesets.map((set, i) =>
            i === idx ? Array.from({ length: MOVESET_SIZE }, () => null) : set,
          );
          patch.myItems = get().myItems.map((it, i) => (i === idx ? null : it));
          patch.myAbilities = get().myAbilities.map((ab, i) =>
            i === idx ? null : ab,
          );
        }
        const battle = get()[battleKey].filter((i) => pool[i] !== null);
        set({
          ...patch,
          [key]: pool,
          [battleKey]: battle,
        } as unknown as Partial<AppState>);
      },
      addToPool: (side, mon) => {
        const key = side === "my" ? "myPool" : "oppPool";
        const pool = get()[key];
        const monName = mon.name.trim().toLowerCase();
        const duplicate = pool.some((p) => {
          if (!p) return false;
          if (p.id > 0 && mon.id > 0) return p.id === mon.id;
          if (p.slug && mon.slug) return p.slug.toLowerCase() === mon.slug.toLowerCase();
          return p.name.trim().toLowerCase() === monName;
        });
        if (duplicate) return { ok: false, reason: "duplicate" } as const;
        const idx = pool.findIndex((p) => p === null);
        if (idx === -1 || idx >= POOL_SIZE) return { ok: false, reason: "full" } as const;
        const next = [...pool];
        next[idx] = mon;
        set({ [key]: next } as unknown as Partial<AppState>);
        return { ok: true, index: idx } as const;
      },

      clearSide: (side) => {
        const key = side === "my" ? "myPool" : "oppPool";
        const battleKey = side === "my" ? "myBattle" : "oppBattle";
        const patch: Partial<AppState> =
          side === "my"
            ? {
                myMovesets: emptyMovesets(),
                myItems: emptySlotStrings(),
                myAbilities: emptySlotStrings(),
              }
            : {};
        set({
          ...patch,
          [key]: emptyPool(),
          [battleKey]: [],
        } as unknown as Partial<AppState>);
      },

      resetAll: () =>
        set({
          myPool: emptyPool(),
          oppPool: emptyPool(),
          myBattle: [],
          oppBattle: [],
          hoveredLineup: null,
          myMovesets: emptyMovesets(),
          myItems: emptySlotStrings(),
          myAbilities: emptySlotStrings(),
          selectedSide: null,
          selectedSlot: null,
        }),

      setMyMovesetMove: (teamIdx, moveIdx, moveName) => {
        if (teamIdx < 0 || teamIdx >= POOL_SIZE) return;
        if (moveIdx < 0 || moveIdx >= MOVESET_SIZE) return;
        const myPool = get().myPool;
        if (!myPool[teamIdx]) return;
        const next = get().myMovesets.map((set, i) => {
          if (i !== teamIdx) return set;
          const updated = [...set];
          updated[moveIdx] = moveName;
          return updated;
        });
        set({ myMovesets: next });
      },

      clearMyMoveset: (teamIdx) => {
        if (teamIdx < 0 || teamIdx >= POOL_SIZE) return;
        const next = get().myMovesets.map((set, i) =>
          i === teamIdx ? Array.from({ length: MOVESET_SIZE }, () => null) : set,
        );
        set({ myMovesets: next });
      },

      setMyItem: (teamIdx, item) => {
        if (teamIdx < 0 || teamIdx >= POOL_SIZE) return;
        if (!get().myPool[teamIdx]) return;
        const next = get().myItems.map((it, i) => (i === teamIdx ? item : it));
        set({ myItems: next });
      },

      setMyAbility: (teamIdx, ability) => {
        if (teamIdx < 0 || teamIdx >= POOL_SIZE) return;
        if (!get().myPool[teamIdx]) return;
        const next = get().myAbilities.map((ab, i) =>
          i === teamIdx ? ability : ab,
        );
        set({ myAbilities: next });
      },

      importMyTeam: (members) => {
        const pool = emptyPool();
        const items = emptySlotStrings();
        const abilities = emptySlotStrings();
        const movesets = emptyMovesets();
        members.slice(0, POOL_SIZE).forEach((m, i) => {
          pool[i] = m.pokemon;
          items[i] = m.item ?? null;
          abilities[i] = m.ability ?? null;
          if (m.moves) {
            const mv = Array.from({ length: MOVESET_SIZE }, () => null) as (
              | string
              | null
            )[];
            m.moves.slice(0, MOVESET_SIZE).forEach((name, j) => {
              mv[j] = name ?? null;
            });
            movesets[i] = mv;
          }
        });
        set({
          myPool: pool,
          myItems: items,
          myAbilities: abilities,
          myMovesets: movesets,
          myBattle: [],
        });
      },

      toggleBattle: (side, idx) => {
        const battleKey = side === "my" ? "myBattle" : "oppBattle";
        const poolKey = side === "my" ? "myPool" : "oppPool";
        const pool = get()[poolKey];
        if (pool[idx] == null) return;
        const cap = get().teamSize;
        const current = get()[battleKey];
        let next: number[];
        if (current.includes(idx)) {
          next = current.filter((i) => i !== idx);
        } else if (current.length < cap) {
          next = [...current, idx];
        } else {
          next = [...current.slice(1), idx];
        }
        set({ [battleKey]: next } as unknown as Partial<AppState>);
      },

      setBattle: (side, battle) => {
        const battleKey = side === "my" ? "myBattle" : "oppBattle";
        const cap = get().teamSize;
        set({ [battleKey]: battle.slice(0, cap) } as unknown as Partial<AppState>);
      },
      setHoveredLineup: (lineup) => set({ hoveredLineup: lineup }),

      openDrawer: (side, idx) => set({ selectedSide: side, selectedSlot: idx }),
      closeDrawer: () => set({ selectedSide: null, selectedSlot: null }),
      setDrawerTab: (t) => set({ drawerTab: t }),

      cachePokemon: (data) => {
        const map = new Map(get().pokemonCache);
        map.set(data.slug, data);
        set({ pokemonCache: map });
      },
      cacheUsage: (data) => {
        const map = new Map(get().usageCache);
        map.set(`${data.format}:${data.slug}`, data);
        set({ usageCache: map });
      },
      cacheTopList: (list) => {
        const map = new Map(get().topListCache);
        map.set(list.format, list);
        set({ topListCache: map });
      },

      setApiStatus: (patch) =>
        set({ apiStatus: { ...get().apiStatus, ...patch } }),

      saveTeam: (name) => {
        const pool = get().myPool;
        const members: string[] = [];
        const items: (string | null)[] = [];
        const abilities: (string | null)[] = [];
        const movesets: (string | null)[][] = [];
        const myItems = get().myItems;
        const myAbilities = get().myAbilities;
        const myMovesets = get().myMovesets;
        pool.forEach((m, i) => {
          if (!m) return;
          members.push(m.slug);
          items.push(myItems[i] ?? null);
          abilities.push(myAbilities[i] ?? null);
          movesets.push([...myMovesets[i]]);
        });
        if (members.length === 0) return;
        const team: SavedTeam = {
          id: crypto.randomUUID(),
          name: name.trim() || `Team ${get().savedTeams.length + 1}`,
          members,
          items,
          abilities,
          movesets,
          battleSelection: [...get().myBattle],
          createdAt: Date.now(),
        };
        set({ savedTeams: [team, ...get().savedTeams] });
      },

      loadTeam: (id, into) => {
        const team = get().savedTeams.find((t) => t.id === id);
        if (!team) return;
        const pool = emptyPool();
        const cache = get().pokemonCache;
        team.members.slice(0, POOL_SIZE).forEach((slug, i) => {
          const p = cache.get(slug);
          if (p)
            pool[i] = {
              id: p.id,
              name: p.name,
              slug: p.slug,
              types: p.types,
              spriteUrl: p.spriteUrl,
              moves: p.moves,
            };
        });
        const poolKey = into === "my" ? "myPool" : "oppPool";
        const battleKey = into === "my" ? "myBattle" : "oppBattle";
        const validBattle = (team.battleSelection ?? []).filter(
          (i) => pool[i] !== null,
        );
        const patch: Partial<AppState> = {};
        if (into === "my") {
          const items = emptySlotStrings();
          const abilities = emptySlotStrings();
          const movesets = emptyMovesets();
          team.members.slice(0, POOL_SIZE).forEach((_slug, i) => {
            items[i] = team.items?.[i] ?? null;
            abilities[i] = team.abilities?.[i] ?? null;
            const saved = team.movesets?.[i];
            if (saved) {
              const mv = Array.from({ length: MOVESET_SIZE }, () => null) as (
                | string
                | null
              )[];
              saved.slice(0, MOVESET_SIZE).forEach((name, j) => {
                mv[j] = name ?? null;
              });
              movesets[i] = mv;
            }
          });
          patch.myItems = items;
          patch.myAbilities = abilities;
          patch.myMovesets = movesets;
        }
        set({
          ...patch,
          [poolKey]: pool,
          [battleKey]: validBattle,
        } as unknown as Partial<AppState>);
      },

      deleteTeam: (id) =>
        set({ savedTeams: get().savedTeams.filter((t) => t.id !== id) }),
    }),
    {
      name: "champions-drafter",
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedSlice => ({
        savedTeams: state.savedTeams,
        theme: state.theme,
        format: state.format,
        teamSize: state.teamSize,
      }),
    },
  ),
);

export const POOL_SLOTS = POOL_SIZE;
export const MAX_BATTLE_SLOTS = MAX_BATTLE_SIZE;
