import type { TypeName } from "./types";

export const TYPE_BG_CLASS: Record<TypeName, string> = {
  normal: "bg-type-normal/85 text-black",
  fire: "bg-type-fire text-black",
  water: "bg-type-water text-black",
  electric: "bg-type-electric text-black",
  grass: "bg-type-grass text-black",
  ice: "bg-type-ice text-black",
  fighting: "bg-type-fighting text-white",
  poison: "bg-type-poison text-white",
  ground: "bg-type-ground text-black",
  flying: "bg-type-flying text-black",
  psychic: "bg-type-psychic text-white",
  bug: "bg-type-bug text-black",
  rock: "bg-type-rock text-black",
  ghost: "bg-type-ghost text-white",
  dragon: "bg-type-dragon text-white",
  dark: "bg-type-dark text-white",
  steel: "bg-type-steel text-black",
  fairy: "bg-type-fairy text-black",
};

export const TYPE_HEX: Record<TypeName, string> = {
  normal: "#a8a77a",
  fire: "#ee8130",
  water: "#6390f0",
  electric: "#f7d02c",
  grass: "#7ac74c",
  ice: "#96d9d6",
  fighting: "#c22e28",
  poison: "#a33ea1",
  ground: "#e2bf65",
  flying: "#a98ff3",
  psychic: "#f95587",
  bug: "#a6b91a",
  rock: "#b6a136",
  ghost: "#735797",
  dragon: "#6f35fc",
  dark: "#705746",
  steel: "#b7b7ce",
  fairy: "#d685ad",
};

type MultKey = "zero" | "half" | "one" | "two" | "four";

function multKey(mult: number): MultKey {
  if (mult === 0) return "zero";
  if (mult < 1) return "half";
  if (mult === 1) return "one";
  if (mult === 2) return "two";
  return "four";
}

export function multiplierBgVar(mult: number): string {
  return `var(--color-m-${multKey(mult)})`;
}

export function multiplierTextVar(mult: number): string {
  return `var(--color-m-${multKey(mult)}-text)`;
}

export function multiplierLabel(mult: number): string {
  if (mult === 0) return "0×";
  if (mult === 0.25) return "¼×";
  if (mult === 0.5) return "½×";
  if (mult === 1) return "1×";
  if (mult === 2) return "2×";
  if (mult === 4) return "4×";
  return `${mult}×`;
}
