// How the two people of a 궁합 know each other (kept apart from lib/pairToken.ts so the form can import it).
export const RELATIONS = {
  lover: "연인·배우자",
  some: "썸·호감",
  friend: "친구",
  work: "동료·동업",
} as const;
export type Relation = keyof typeof RELATIONS;
export const relationOf = (v: unknown): Relation => (typeof v === "string" && v in RELATIONS ? (v as Relation) : "lover");
