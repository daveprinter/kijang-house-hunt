export type HouseType = "single" | "bedsitter" | "one_bed" | "two_bed";

export const HOUSE_TYPES: { id: HouseType; label: string; blurb: string; emoji: string }[] = [
  { id: "single", label: "Single room", blurb: "One room, shared washrooms", emoji: "🚪" },
  { id: "bedsitter", label: "Bedsitter", blurb: "Room with own kitchenette & bathroom", emoji: "🛏️" },
  { id: "one_bed", label: "One bedroom", blurb: "Separate bedroom & sitting room", emoji: "🏠" },
  { id: "two_bed", label: "Two bedroom", blurb: "Great for sharing with a friend", emoji: "🏡" },
];

export const BUDGETS: Record<HouseType, number[]> = {
  single: [3000, 3500, 4000],
  bedsitter: [4500, 5500, 6500],
  one_bed: [8000, 10000, 12000],
  two_bed: [14000, 17000, 20000],
};

export const FEATURES = [
  { id: "balcony", label: "Balcony" },
  { id: "tiles", label: "Tiled floor" },
  { id: "water", label: "Running water" },
  { id: "spacious", label: "Spacious" },
  { id: "wardrobe", label: "Kitchen & wardrobes" },
  { id: "wifi", label: "Wi‑Fi" },
  { id: "security", label: "Gate & security" },
  { id: "tokens", label: "Token electricity" },
  { id: "parking", label: "Parking" },
  { id: "shower", label: "Hot shower" },
] as const;
export type FeatureId = (typeof FEATURES)[number]["id"];

export type Region = {
  county: string;
  center: [number, number];
  constituencies: { name: string; wards: { name: string; center: [number, number] }[] }[];
};

export const REGIONS: Region[] = [
  {
    county: "Kitui",
    center: [-1.375, 38.01],
    constituencies: [
      {
        name: "Kitui West",
        wards: [
          { name: "Kwa Vonza / Yatta", center: [-1.375, 38.005] },
          { name: "Mutonguni", center: [-1.28, 37.93] },
          { name: "Kauwi", center: [-1.24, 37.98] },
          { name: "Matinyani", center: [-1.31, 37.99] },
        ],
      },
      {
        name: "Kitui Central",
        wards: [
          { name: "Township", center: [-1.367, 38.012] },
          { name: "Kyangwithya West", center: [-1.35, 38.0] },
          { name: "Miambani", center: [-1.42, 38.05] },
        ],
      },
      { name: "Kitui Rural", wards: [{ name: "Kisasi", center: [-1.45, 38.1] }, { name: "Kwa Mutonga", center: [-1.55, 38.05] }] },
      { name: "Mwingi Central", wards: [{ name: "Central", center: [-0.935, 38.06] }] },
    ],
  },
  {
    county: "Machakos",
    center: [-1.517, 37.263],
    constituencies: [
      { name: "Machakos Town", wards: [{ name: "Machakos Central", center: [-1.517, 37.263] }, { name: "Mumbuni North", center: [-1.5, 37.28] }] },
      { name: "Mavoko", wards: [{ name: "Athi River", center: [-1.456, 36.978] }, { name: "Syokimau", center: [-1.36, 36.94] }] },
      { name: "Kathiani", wards: [{ name: "Kathiani Central", center: [-1.42, 37.33] }] },
    ],
  },
  {
    county: "Nairobi",
    center: [-1.286, 36.817],
    constituencies: [
      { name: "Kasarani", wards: [{ name: "Kahawa / KU", center: [-1.18, 36.93] }, { name: "Roysambu", center: [-1.22, 36.88] }] },
      { name: "Westlands", wards: [{ name: "Parklands", center: [-1.26, 36.81] }] },
      { name: "Embakasi East", wards: [{ name: "Utawala", center: [-1.29, 36.96] }] },
    ],
  },
  {
    county: "Makueni",
    center: [-1.8, 37.62],
    constituencies: [{ name: "Makueni", wards: [{ name: "Wote", center: [-1.78, 37.63] }] }],
  },
];

export type Apartment = {
  id: string;
  name: string;
  area: string;
  ward: string;
  county: string;
  lat: number;
  lng: number;
  near: string;
  caretaker: { name: string; phone: string; role: "Caretaker" | "Landlord" };
  amenities: FeatureId[];
  units: Partial<Record<HouseType, { price: number; vacant: number; total: number }>>;
  description: string;
};

const KV = { area: "Kwa Vonza", ward: "Kwa Vonza / Yatta", county: "Kitui", near: "SEKU & KU Kwa Vonza" };

export const APARTMENTS: Apartment[] = [
  {
    id: "amani", name: "Amani Apartments", ...KV, lat: -1.3735, lng: 38.0035,
    caretaker: { name: "Mr. Mutua", phone: "0712 345 601", role: "Caretaker" },
    amenities: ["balcony", "tiles", "water", "wardrobe", "security", "tokens"],
    units: { bedsitter: { price: 5500, vacant: 3, total: 20 }, single: { price: 3500, vacant: 2, total: 12 } },
    description: "Quiet, tiled bedsitters a short walk from the SEKU gate.",
  },
  {
    id: "delta", name: "Delta Apartments", ...KV, lat: -1.3762, lng: 38.0071,
    caretaker: { name: "Mama Kaluki", phone: "0712 345 602", role: "Caretaker" },
    amenities: ["tiles", "water", "spacious", "wifi", "security", "shower"],
    units: { bedsitter: { price: 6500, vacant: 1, total: 16 }, one_bed: { price: 10000, vacant: 2, total: 8 } },
    description: "Spacious units with Wi‑Fi included and hot showers.",
  },
  {
    id: "mbeli", name: "Mbeli Apartments", ...KV, lat: -1.3718, lng: 38.0102,
    caretaker: { name: "Mr. Kioko", phone: "0712 345 603", role: "Landlord" },
    amenities: ["water", "security", "tokens"],
    units: { single: { price: 3000, vacant: 5, total: 18 }, bedsitter: { price: 4500, vacant: 4, total: 14 } },
    description: "Budget-friendly rooms popular with first years.",
  },
  {
    id: "majibu-1", name: "Majibu I", ...KV, lat: -1.3781, lng: 38.0019,
    caretaker: { name: "Mr. Musyoka", phone: "0712 345 604", role: "Caretaker" },
    amenities: ["balcony", "tiles", "water", "wardrobe", "tokens"],
    units: { bedsitter: { price: 5500, vacant: 2, total: 24 }, one_bed: { price: 8000, vacant: 1, total: 6 } },
    description: "First block of the Majibu family — balconies on every floor.",
  },
  {
    id: "majibu-2", name: "Majibu II", ...KV, lat: -1.3789, lng: 38.0031,
    caretaker: { name: "Mr. Musyoka", phone: "0712 345 604", role: "Caretaker" },
    amenities: ["balcony", "tiles", "water", "wardrobe", "spacious", "security"],
    units: { bedsitter: { price: 6500, vacant: 0, total: 20 }, one_bed: { price: 10000, vacant: 3, total: 10 } },
    description: "Newer block with larger bedsitters and one bedrooms.",
  },
  {
    id: "majibu-3", name: "Majibu III", ...KV, lat: -1.3797, lng: 38.0044,
    caretaker: { name: "Ms. Ndinda", phone: "0712 345 605", role: "Caretaker" },
    amenities: ["tiles", "water", "spacious", "parking", "security", "shower"],
    units: { one_bed: { price: 12000, vacant: 2, total: 8 }, two_bed: { price: 17000, vacant: 1, total: 4 } },
    description: "Family-sized units with parking — good for sharing.",
  },
  {
    id: "mizizi", name: "Mizizi Plaza", ...KV, lat: -1.3748, lng: 38.0089,
    caretaker: { name: "Mr. Wambua", phone: "0712 345 606", role: "Landlord" },
    amenities: ["tiles", "water", "wifi", "security", "tokens", "wardrobe"],
    units: { single: { price: 4000, vacant: 3, total: 10 }, bedsitter: { price: 5500, vacant: 2, total: 12 }, one_bed: { price: 9000, vacant: 1, total: 4 } },
    description: "Above shops on the main road — everything at your door.",
  },
  {
    id: "kleenex", name: "Kleenex Apartments", ...KV, lat: -1.3726, lng: 38.0058,
    caretaker: { name: "Mama Mwende", phone: "0712 345 607", role: "Caretaker" },
    amenities: ["balcony", "tiles", "water", "security", "shower"],
    units: { bedsitter: { price: 5000, vacant: 4, total: 18 }, single: { price: 3500, vacant: 1, total: 8 } },
    description: "Clean, well-kept compound with reliable water.",
  },
  {
    id: "beach-house", name: "Beach House", ...KV, lat: -1.3771, lng: 38.0112,
    caretaker: { name: "Mr. Nzioka", phone: "0712 345 608", role: "Landlord" },
    amenities: ["balcony", "tiles", "water", "spacious", "wifi", "parking", "wardrobe"],
    units: { one_bed: { price: 11000, vacant: 2, total: 6 }, two_bed: { price: 20000, vacant: 1, total: 3 }, bedsitter: { price: 6500, vacant: 1, total: 6 } },
    description: "Airy rooftop balconies and the best views in Kwa Vonza.",
  },
  {
    id: "kitui-heights", name: "Kitui Heights", area: "Kitui Town", ward: "Township", county: "Kitui", near: "Kitui Town CBD",
    lat: -1.3672, lng: 38.0125,
    caretaker: { name: "Mr. Kilonzo", phone: "0712 345 609", role: "Caretaker" },
    amenities: ["balcony", "tiles", "water", "security", "tokens"],
    units: { bedsitter: { price: 6000, vacant: 2, total: 20 }, one_bed: { price: 10000, vacant: 1, total: 8 } },
    description: "Town-centre block close to matatu stage.",
  },
  {
    id: "mumbuni-court", name: "Mumbuni Court", area: "Machakos Town", ward: "Mumbuni North", county: "Machakos", near: "Machakos University",
    lat: -1.5032, lng: 37.2795,
    caretaker: { name: "Ms. Mueni", phone: "0712 345 610", role: "Caretaker" },
    amenities: ["tiles", "water", "wifi", "security", "wardrobe"],
    units: { bedsitter: { price: 7000, vacant: 3, total: 15 }, one_bed: { price: 12000, vacant: 1, total: 6 } },
    description: "Student favourite near Machakos University.",
  },
  {
    id: "kahawa-suites", name: "Kahawa Suites", area: "Kahawa Wendani", ward: "Kahawa / KU", county: "Nairobi", near: "Kenyatta University main campus",
    lat: -1.1815, lng: 36.9265,
    caretaker: { name: "Mr. Otieno", phone: "0712 345 611", role: "Caretaker" },
    amenities: ["balcony", "tiles", "water", "wifi", "security", "shower", "wardrobe"],
    units: { single: { price: 5000, vacant: 2, total: 10 }, bedsitter: { price: 8500, vacant: 4, total: 30 }, one_bed: { price: 14000, vacant: 2, total: 10 } },
    description: "Modern block a few minutes from KU main gate.",
  },
];

export function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatKES(n: number) {
  return "KES " + n.toLocaleString("en-KE");
}

export function totalVacant(a: Apartment) {
  return Object.values(a.units).reduce((s, u) => s + (u?.vacant ?? 0), 0);
}

export function osmEmbed(lat: number, lng: number, d = 0.012) {
  const bbox = [lng - d, lat - d, lng + d, lat + d].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export const HOUSE_LABEL: Record<HouseType, string> = {
  single: "Single rooms",
  bedsitter: "Bedsitters",
  one_bed: "One bedrooms",
  two_bed: "Two bedrooms",
};
