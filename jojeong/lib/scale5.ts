// One five-step look for every five-grade judgment (the year's verdict, the ten years, the areas of a year):
// deep red, light red, grey, light gold, black, best to hardest. The names stay each judgment's own (they are in
// the written reports); the colour says where on the scale it sits.
export const SCALE5_CHIP = ["bg-seal text-hanji", "bg-seal/20 text-seal", "bg-ink/10 text-ink", "bg-[#d4af5f]/35 text-ink", "bg-ink text-hanji"] as const;
export const SCALE5_BAR = ["bg-seal", "bg-seal/45", "bg-ink/25", "bg-[#d4af5f]", "bg-ink"] as const;
export const SCALE5_WIDTH = [96, 76, 56, 34, 16] as const;
