import { ALL_TYPES } from "./types";
import type { Pokemon, PokemonData, PokemonListItem, PokemonMove, TypeName } from "./types";

const BASE = "https://pokeapi.co/api/v2";
const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function spriteUrl(id: number): string {
  return `${SPRITE_BASE}/${id}.png`;
}

const LIST_LIMIT = 1025;

interface ListRaw {
  results: { name: string; url: string }[];
}

function extractId(url: string): number {
  const m = url.match(/\/pokemon\/(\d+)\/?$/);
  return m ? parseInt(m[1], 10) : 0;
}

function prettyName(slug: string): string {
  return slug
    .split("-")
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(" ");
}

export async function fetchPokemonList(
  signal?: AbortSignal,
): Promise<PokemonListItem[]> {
  const res = await fetch(`${BASE}/pokemon?limit=${LIST_LIMIT}`, {
    signal,
    cache: "force-cache",
  });
  if (!res.ok) throw new Error(`PokeAPI list failed: ${res.status}`);
  const raw = (await res.json()) as ListRaw;
  return raw.results
    .map((r) => {
      const id = extractId(r.url);
      return { id, name: prettyName(r.name), slug: r.name };
    })
    .filter((i) => i.id > 0 && i.id <= LIST_LIMIT);
}

interface DetailRaw {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { slot: number; type: { name: string } }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  stats: { base_stat: number; stat: { name: string } }[];
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: { front_default: string | null };
    };
  };
  moves: { move: { name: string; url: string } }[];
}

interface MoveDetailRaw {
  type: { name: string };
  damage_class: { name: string };
}

const moveCache = new Map<string, Promise<PokemonMove | null>>();

async function fetchMoveDetail(
  url: string,
  signal?: AbortSignal,
): Promise<PokemonMove | null> {
  let inflight = moveCache.get(url);
  if (!inflight) {
    inflight = fetch(url, { signal, cache: "force-cache" })
      .then(async (res) => {
        if (!res.ok) return null;
        const raw = (await res.json()) as MoveDetailRaw;
        const type = raw.type?.name;
        const damageClass = raw.damage_class?.name;
        const validType = (ALL_TYPES as string[]).includes(type)
          ? (type as TypeName)
          : null;
        if (!validType) return null;
        if (!["physical", "special", "status"].includes(damageClass)) {
          return null;
        }
        const parsedDamageClass = damageClass as PokemonMove["damageClass"];
        return {
          name: "",
          type: validType,
          damageClass: parsedDamageClass,
        };
      })
      .catch(() => null);
    moveCache.set(url, inflight);
  }
  return inflight;
}

export async function fetchPokemonDetail(
  slug: string,
  signal?: AbortSignal,
): Promise<PokemonData> {
  const res = await fetch(`${BASE}/pokemon/${slug.toLowerCase()}`, {
    signal,
    cache: "force-cache",
  });
  if (!res.ok) throw new Error(`PokeAPI detail failed: ${res.status}`);
  const raw = (await res.json()) as DetailRaw;
  const types = raw.types
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name as TypeName);
  const stats = Object.fromEntries(
    raw.stats.map((s) => [s.stat.name, s.base_stat]),
  );
  const uniqueMoveRows = Array.from(
    new Map(raw.moves.map((m) => [m.move.name, m.move])).values(),
  );
  const moveDetails = await Promise.all(
    uniqueMoveRows.map(async (row) => {
      const detail = await fetchMoveDetail(row.url, signal);
      if (!detail) return null;
      return {
        ...detail,
        name: row.name,
      } as PokemonMove;
    }),
  );
  const moves = moveDetails
    .filter((m): m is PokemonMove => !!m)
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    id: raw.id,
    name: prettyName(raw.name),
    slug: raw.name,
    types,
    spriteUrl: spriteUrl(raw.id),
    baseStats: {
      hp: stats["hp"] ?? 0,
      atk: stats["attack"] ?? 0,
      def: stats["defense"] ?? 0,
      spa: stats["special-attack"] ?? 0,
      spd: stats["special-defense"] ?? 0,
      spe: stats["speed"] ?? 0,
    },
    abilities: raw.abilities.map((a) => a.ability.name),
    height: raw.height,
    weight: raw.weight,
    moves,
  };
}

export function toLightPokemon(data: PokemonData): Pokemon {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    types: data.types,
    spriteUrl: data.spriteUrl,
    moves: data.moves,
  };
}
