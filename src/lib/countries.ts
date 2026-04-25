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

export const OTHER_COUNTRY = "Other" as const;

export type Country = (typeof COUNTRIES)[number] | typeof OTHER_COUNTRY;

/**
 * Format a country for display, falling back to the user's custom value
 * when they picked "Other".
 */
export function formatCountry(
  country: string | null | undefined,
  customCountry?: string | null,
): string {
  if (!country) return "";
  if (country === OTHER_COUNTRY) return customCountry?.trim() || "Other";
  return country;
}
