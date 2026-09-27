// How the two people of a 궁합 know each other (kept apart from lib/pairToken.ts so the form can import it).
export const RELATIONS = {
  lover: "연인·배우자",
  some: "썸·호감",
  friend: "친구",
  work: "동료·동업",
  family: "부모·자녀",
  ex: "헤어진 사이",
} as const;
export type Relation = keyof typeof RELATIONS;
// What the 궁합 form offers; 헤어진 사이 belongs to 재회운.
export const CHOOSABLE: Relation[] = ["lover", "some", "friend", "work", "family"];
export const relationOf = (v: unknown): Relation => (typeof v === "string" && v in RELATIONS ? (v as Relation) : "lover");
