export const CATEGORIES = [
  "Beauty",
  "Fitness",
  "Anime",
  "Fashion",
  "Pets",
  "Tech",
] as const;

export type Category = (typeof CATEGORIES)[number];
