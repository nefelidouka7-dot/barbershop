import type { Barber } from "@/types/database";

/** Public-facing staff labels — keep booking IDs, soften personal details. */
const GENERIC_STAFF = [
  {
    name: "Alex",
    bio: "Cuts, fades, and clean finishes.",
  },
  {
    name: "Chris",
    bio: "Beards, trims, and classic shaves.",
  },
  {
    name: "Sam",
    bio: "Classic and modern cuts.",
  },
  {
    name: "Jordan",
    bio: "Fades, styling, and clean lines.",
  },
] as const;

export function withGenericStaff(barbers: Barber[]): Barber[] {
  return barbers.map((barber, index) => {
    const generic = GENERIC_STAFF[index % GENERIC_STAFF.length];
    return {
      ...barber,
      name: generic.name,
      bio: generic.bio,
    };
  });
}
