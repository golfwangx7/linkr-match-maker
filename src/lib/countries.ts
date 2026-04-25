export const COUNTRIES = [
  "Germany",
  "Austria",
  "Switzerland",
  "United Kingdom",
  "France",
  "Netherlands",
  "Spain",
  "Italy",
  "United States",
  "Canada",
  "United Arab Emirates",
] as const;

export type Country = (typeof COUNTRIES)[number];
