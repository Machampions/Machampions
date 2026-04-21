export type TypeName =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

export const ALL_TYPES: TypeName[] = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

export type MoveDamageClass = "physical" | "special" | "status";

export interface PokemonMove {
  name: string;
  type: TypeName;
  damageClass: MoveDamageClass;
}

export interface Pokemon {
  id: number;
  name: string;
  slug: string;
  types: TypeName[];
  spriteUrl: string;
  moves: PokemonMove[];
}

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface PokemonData extends Pokemon {
  baseStats: BaseStats;
  abilities: string[];
  height: number;
  weight: number;
}

export interface UsageMove {
  name: string;
  pct: number;
  type?: TypeName;
  isDamaging?: boolean;
}

export interface UsageEntry {
  name: string;
  pct: number;
}

export interface UsageData {
  slug: string;
  format: string;
  usagePct: number;
  topMoves: UsageMove[];
  topAbilities: UsageEntry[];
  topItems: UsageEntry[];
  teammates: UsageEntry[];
  counters: UsageEntry[];
  teraTypes: { type: TypeName; pct: number }[];
  fetchedAt: number;
  partial: boolean;
}

export interface TopListEntry {
  slug: string;
  displayName: string;
  usagePct: number;
  rank: number;
}

export interface TopList {
  format: string;
  entries: TopListEntry[];
  fetchedAt: number;
}

export interface SavedTeam {
  id: string;
  name: string;
  members: string[];
  battleSelection?: number[];
  createdAt: number;
}

export type Theme = "dark" | "light";

export type ApiStatus = "ok" | "degraded" | "down" | "unknown";

export interface ApiStatusMap {
  pokeapi: ApiStatus;
  pikalytics: ApiStatus;
}

export interface PokemonListItem {
  id: number;
  name: string;
  slug: string;
}
