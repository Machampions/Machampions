// Pokémon Showdown text-format parser & serializer.
// We capture species, item, ability, and moves. EVs/IVs/nature/tera/level are ignored.

export interface ShowdownMember {
  species: string;
  slug: string;
  item?: string;
  ability?: string;
  moves: string[];
}

// Species name → PokeAPI slug. PokeAPI uses lowercase + dashes; strip apostrophes/periods/colons.
export function speciesToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[’'`.:]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Move name → PokeAPI kebab slug. "Fake Out" → "fake-out", "U-turn" → "u-turn".
export function moveToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[’'`.:,]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

// "fake-out" → "Fake Out"
export function slugToPretty(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");
}

const IGNORE_PREFIXES = [
  "tera type:",
  "evs:",
  "ivs:",
  "level:",
  "happiness:",
  "shiny:",
  "gigantamax:",
  "dynamax level:",
  "hidden power:",
];

function isIgnorableMeta(line: string): boolean {
  const l = line.toLowerCase();
  if (IGNORE_PREFIXES.some((p) => l.startsWith(p))) return true;
  if (/\bnature\b/i.test(line) && !line.includes(":")) return true; // "Adamant Nature"
  return false;
}

function parseSpeciesLine(line: string): { species: string; item?: string } {
  let rest = line.trim();
  let item: string | undefined;
  const at = rest.indexOf(" @ ");
  if (at >= 0) {
    item = rest.slice(at + 3).trim();
    rest = rest.slice(0, at).trim();
  }
  // Strip trailing gender marker: "(M)" / "(F)"
  rest = rest.replace(/\s*\((?:M|F)\)\s*$/i, "").trim();
  // Nickname pattern: "Nickname (Species)"
  const nick = rest.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  const species = (nick ? nick[2] : rest).trim();
  return { species, item: item || undefined };
}

export function parseShowdown(text: string): ShowdownMember[] {
  const blocks = text
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const members: ShowdownMember[] = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    const { species, item } = parseSpeciesLine(lines[0]);
    if (!species) continue;

    let ability: string | undefined;
    const moves: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("-") || line.startsWith("~")) {
        const move = line.replace(/^[-~]\s*/, "").trim();
        if (move) moves.push(move);
        continue;
      }
      if (/^ability\s*:/i.test(line)) {
        ability = line.split(":").slice(1).join(":").trim() || undefined;
        continue;
      }
      // Anything else: silently ignore (EVs/IVs/nature/tera/level/etc).
      if (isIgnorableMeta(line)) continue;
    }

    members.push({
      species,
      slug: speciesToSlug(species),
      item,
      ability,
      moves,
    });
  }
  return members;
}

export interface ShowdownExportMember {
  species: string;
  item?: string | null;
  ability?: string | null;
  moves?: (string | null)[];
}

export function formatShowdown(members: ShowdownExportMember[]): string {
  const blocks = members.map((m) => {
    const lines: string[] = [];
    const head = m.item ? `${m.species} @ ${m.item}` : m.species;
    lines.push(head);
    if (m.ability) lines.push(`Ability: ${m.ability}`);
    (m.moves ?? [])
      .filter((mv): mv is string => !!mv && mv.trim().length > 0)
      .forEach((mv) => lines.push(`- ${mv}`));
    return lines.join("\n");
  });
  return blocks.join("\n\n");
}
