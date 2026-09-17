import type { Barber, Service, WorkingHours } from "@/types/database";

export const DEMO_BARBERS: Barber[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    user_id: null,
    name: "Alex",
    photo_url:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80",
    bio: "Cuts, fades, and clean finishes.",
    active: true,
    created_at: "",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    user_id: null,
    name: "Chris",
    photo_url:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
    bio: "Beards, trims, and classic shaves.",
    active: true,
    created_at: "",
  },
];

export const DEMO_SERVICES: Service[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "Haircut",
    duration_minutes: 30,
    price: 20,
    active: true,
    created_at: "",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    name: "Haircut + Beard",
    duration_minutes: 45,
    price: 30,
    active: true,
    created_at: "",
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    name: "Beard Trim",
    duration_minutes: 20,
    price: 12,
    active: true,
    created_at: "",
  },
  {
    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    name: "Hot Towel Shave",
    duration_minutes: 40,
    price: 25,
    active: true,
    created_at: "",
  },
];

/** barber_id → service ids */
export const DEMO_BARBER_SERVICES: Record<string, string[]> = {
  "11111111-1111-1111-1111-111111111111": [
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "cccccccc-cccc-cccc-cccc-cccccccccccc",
  ],
  "22222222-2222-2222-2222-222222222222": [
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "dddddddd-dddd-dddd-dddd-dddddddddddd",
  ],
};

export function demoServicesForBarber(barberId: string): Service[] {
  const ids = DEMO_BARBER_SERVICES[barberId];
  if (!ids?.length) return DEMO_SERVICES;
  return DEMO_SERVICES.filter((s) => ids.includes(s.id));
}

export function demoWorkingHours(barberId: string): WorkingHours[] {
  return [1, 2, 3, 4, 5, 6].map((d) => ({
    id: `${barberId}-${d}`,
    barber_id: barberId,
    day_of_week: d,
    start_time: "09:00",
    end_time: "17:00",
  }));
}

export function withTimeout<T>(
  promise: PromiseLike<T>,
  ms = 2500
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    Promise.resolve(promise).then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}
