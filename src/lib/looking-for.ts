export const BRAND_LOOKING_FOR = [
  "UGC Creators",
  "Long-term partnerships",
  "Paid collaborations",
  "Affiliate deals",
] as const;

export const CREATOR_LOOKING_FOR = [
  "Paid deals",
  "Free products",
  "Long-term collaborations",
] as const;

export type Role = "creator" | "brand";

export function lookingForOptions(role: Role | null | undefined): readonly string[] {
  if (role === "brand") return BRAND_LOOKING_FOR;
  if (role === "creator") return CREATOR_LOOKING_FOR;
  return [];
}
