import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Crosshair, Loader2, MapPin, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { loadUserData, saveUserData } from "@/lib/userStore";
import {
  APARTMENTS, BUDGETS, FEATURES, HOUSE_TYPES, REGIONS, distanceKm, formatKES, osmEmbed,
  type FeatureId, type HouseType,
} from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ApartmentCard } from "@/components/ApartmentCard";

export const Route = createFileRoute("/_authenticated/hunt")({
  head: () => ({
    meta: [
      { title: "Start house hunting — Kijang" },
      { name: "description", content: "Choose house type, budget and features to find vacant houses near you." },
      { property: "og:title", content: "Start house hunting — Kijang" },
      { property: "og:description", content: "Choose house type, budget and features to find vacant houses near you." },
    ],
  }),
  component: Hunt,
});

type Loc = { lat: number; lng: number; label: string };
type HuntState = {
  step: number;
  type?: HouseType | undefined;
  budget?: number | undefined;
  features: FeatureId[];
  location?: Loc | undefined;
  confirmed: boolean;
};
const initial: HuntState = { step: 0, features: [], confirmed: false };
const STEPS = ["House type", "Budget", "Features", "Location", "Results"];

async function reverseGeocode(lat: number, lng: number) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`);
    const j = await r.json();
    return (j.display_name as string)?.split(",").slice(0, 3).join(",") ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

function Hunt() {
  const { user } = useAuth();
  const [s, setS] = useState<HuntState>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    setS(loadUserData(user.id, "hunt", initial));
    setLoaded(true);
  }, [user]);
  useEffect(() => {
    if (loaded) saveUserData(user?.id, "hunt", s);
  }, [s, loaded, user]);

  const set = (p: Partial<HuntState>) => setS((prev) => ({ ...prev, ...p }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Step {s.step + 1} of 5 · {STEPS[s.step]}</p>
          <h1 className="mt-1 text-4xl font-semibold">House hunt</h1>
        </div>
        <div className="flex gap-2">
          {s.step > 0 && <Button variant="outline" size="sm" onClick={() => set({ step: s.step - 1 })}><ArrowLeft className="size-4" /> Back</Button>}
          <Button variant="ghost" size="sm" onClick={() => setS(initial)}><RotateCcw className="size-4" /> Reset</Button>
        </div>
      </div>
      <Progress className="mt-4" value={((s.step + 1) / 5) * 100} />

      <div className="mt-8 animate-in fade-in slide-in-from-bottom-2" key={s.step}>
        {s.step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {HOUSE_TYPES.map((h) => (
              <button key={h.id} data-selected={s.type === h.id} onClick={() => set({ type: h.id, budget: undefined, step: 1 })} className="choice-card p-6 text-left">
                <span className="text-4xl">{h.emoji}</span>
                <p className="mt-3 font-display text-2xl">{h.label}</p>
                <p className="text-sm text-muted-foreground">{h.blurb}</p>
              </button>
            ))}
          </div>
        )}

        {s.step === 1 && s.type && <BudgetStep type={s.type} value={s.budget} onPick={(b) => set({ budget: b, step: 2 })} />}

        {s.step === 2 && (
          <div>
            <p className="mb-4 text-muted-foreground">Tick everything your house should have.</p>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {FEATURES.map((f) => {
                const on = s.features.includes(f.id);
                return (
                  <button key={f.id} data-selected={on} onClick={() => set({ features: on ? s.features.filter((x) => x !== f.id) : [...s.features, f.id] })} className="choice-card flex items-center gap-3 p-4 text-left">
                    <span className={on ? "grid size-6 place-items-center rounded-md bg-primary text-primary-foreground" : "size-6 rounded-md border-2"}>{on && <Check className="size-4" />}</span>
                    <span className="font-medium">{f.label}</span>
                  </button>
                );
              })}
            </div>
            <Button size="lg" className="mt-6" onClick={() => set({ step: 3, confirmed: false })}>Continue</Button>
          </div>
        )}

        {s.step === 3 && (
          <LocationStep
            location={s.location}
            onLocation={(l) => set({ location: l })}
            onConfirm={async (l) => {
              set({ location: l, confirmed: true, step: 4 });
              if (user) {
                await supabase.from("profiles").update({ latitude: l.lat, longitude: l.lng, location_label: l.label }).eq("id", user.id);
              }
            }}
          />
        )}

        {s.step === 4 && s.location && <Results s={s} />}
      </div>
    </div>
  );
}

function BudgetStep({ type, value, onPick }: { type: HouseType; value?: number | undefined; onPick: (n: number) => void }) {
  const [custom, setCustom] = useState("");
  const opts = BUDGETS[type];
  return (
    <div>
      <p className="mb-4 text-muted-foreground">Maximum monthly rent for a {HOUSE_TYPES.find((h) => h.id === type)?.label.toLowerCase()}.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {opts.map((b, i) => (
          <button key={b} data-selected={value === b} onClick={() => onPick(b)} className="choice-card p-6 text-left">
            <p className="font-display text-3xl">{formatKES(b)}</p>
            <p className="text-sm text-muted-foreground">{i === opts.length - 1 ? "and above" : "per month"}</p>
          </button>
        ))}
      </div>
      <form className="mt-6 flex max-w-md gap-2" onSubmit={(e) => { e.preventDefault(); const n = Number(custom); if (n > 0) onPick(n); }}>
        <Input type="number" min={500} placeholder="Don't see yours? Type budget (KES)" value={custom} onChange={(e) => setCustom(e.target.value)} />
        <Button type="submit">Use</Button>
      </form>
    </div>
  );
}

function LocationStep({ location, onLocation, onConfirm }: { location?: Loc | undefined; onLocation: (l: Loc) => void; onConfirm: (l: Loc) => void }) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addr, setAddr] = useState("");

  function detect() {
    if (!navigator.geolocation) { toast.error("Location isn't supported on this device."); setEditing(true); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const label = await reverseGeocode(p.coords.latitude, p.coords.longitude);
        onLocation({ lat: p.coords.latitude, lng: p.coords.longitude, label });
        setBusy(false);
      },
      () => { setBusy(false); setEditing(true); toast.message("Location permission denied — type your area instead."); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  useEffect(() => { if (!location) detect(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function update(e: React.FormEvent) {
    e.preventDefault();
    if (!addr.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ke&q=${encodeURIComponent(addr)}`);
      const j = await r.json();
      if (!j[0]) { toast.error("Couldn't find that place. Try a nearby town or landmark."); return; }
      onLocation({ lat: Number(j[0].lat), lng: Number(j[0].lon), label: j[0].display_name.split(",").slice(0, 3).join(",") });
      setEditing(false);
    } finally { setBusy(false); }
  }

  const map = location ?? { lat: -1.375, lng: 38.005, label: "Kwa Vonza" };
  return (
    <div className="relative overflow-hidden rounded-3xl border shadow-card">
      <iframe title="Your location" src={osmEmbed(map.lat, map.lng, 0.01)} className="h-[560px] w-full" />
      <div className="absolute inset-x-4 bottom-4 mx-auto max-w-md rounded-2xl border bg-card p-5 shadow-float">
        {busy ? (
          <p className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Finding your location…</p>
        ) : location && !editing ? (
          <>
            <p className="text-sm text-muted-foreground">Is this your real location?</p>
            <p className="mt-1 flex items-start gap-2 font-semibold"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> {location.label}</p>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" onClick={() => onConfirm(location)}>Yes, search here</Button>
              <Button variant="outline" onClick={() => setEditing(true)}>No, change</Button>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={update} className="flex gap-2">
              <Input autoFocus placeholder="Type area, e.g. Kwa Vonza, SEKU" value={addr} onChange={(e) => setAddr(e.target.value)} />
              <Button type="submit">Update</Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={detect}><Crosshair className="size-4" /> Use my GPS</Button>
              {REGIONS.flatMap((r) => r.constituencies[0]!.wards.slice(0, 1).map((w) => ({ ...w, county: r.county }))).map((w) => (
                <Button key={w.name} size="sm" variant="outline" onClick={() => { onLocation({ lat: w.center[0], lng: w.center[1], label: `${w.name}, ${w.county}` }); setEditing(false); }}>{w.county}</Button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type Osm = { id: number; name: string; lat: number; lng: number };

function Results({ s }: { s: HuntState }) {
  const loc = s.location!;
  const [nearby, setNearby] = useState<Osm[] | null>(null);

  const ranked = useMemo(() => {
    return APARTMENTS.map((a) => {
      const unit = s.type ? a.units[s.type] : undefined;
      const d = distanceKm([loc.lat, loc.lng], [a.lat, a.lng]);
      const featureHits = s.features.filter((f) => a.amenities.includes(f)).length;
      const fits = !!unit && unit.vacant > 0 && (!s.budget || unit.price <= s.budget);
      return { a, d, fits, featureHits };
    })
      .filter((x) => x.d < 25)
      .sort((x, y) => Number(y.fits) - Number(x.fits) || y.featureHits - x.featureHits || x.d - y.d);
  }, [s, loc]);

  useEffect(() => {
    const q = `[out:json][timeout:15];(nwr["building"~"apartments|residential|dormitory"]["name"](around:3000,${loc.lat},${loc.lng});nwr["tourism"~"guest_house|hostel"]["name"](around:3000,${loc.lat},${loc.lng}););out center 20;`;
    fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: q })
      .then((r) => r.json())
      .then((j) => {
        const known = new Set(APARTMENTS.map((a) => a.name.toLowerCase()));
        setNearby(
          (j.elements ?? [])
            .map((e: any) => ({ id: e.id, name: e.tags?.name, lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon }))
            .filter((e: Osm) => e.name && !known.has(e.name.toLowerCase())),
        );
      })
      .catch(() => setNearby([]));
  }, [loc.lat, loc.lng]);

  const fits = ranked.filter((r) => r.fits);
  const others = ranked.filter((r) => !r.fits);

  return (
    <div className="space-y-10">
      <div className="rounded-2xl bg-secondary p-5 text-secondary-foreground">
        <p className="text-sm opacity-80">Searching near</p>
        <p className="font-display text-2xl">{loc.label}</p>
        <p className="mt-1 text-sm opacity-80">
          {HOUSE_TYPES.find((h) => h.id === s.type)?.label} · up to {s.budget ? formatKES(s.budget) : "any budget"}
          {s.features.length > 0 && ` · ${s.features.length} features`}
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold">Matches with vacancies ({fits.length})</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fits.map(({ a, d }) => <ApartmentCard key={a.id} a={a} distance={d} />)}
        </div>
        {fits.length === 0 && <p className="mt-2 text-muted-foreground">No exact matches — try a higher budget or fewer features. Here are other options nearby.</p>}
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold">Other houses nearby</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map(({ a, d }) => <ApartmentCard key={a.id} a={a} distance={d} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-semibold">Other places on the map</h2>
        <p className="text-sm text-muted-foreground">Found on the public map but not yet registered on Kijang — visit or ask around for vacancies.</p>
        {nearby === null ? (
          <p className="mt-3 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Searching the area…</p>
        ) : nearby.length === 0 ? (
          <p className="mt-3 text-muted-foreground">Nothing else found within 3 km.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {nearby.map((n) => (
              <li key={n.id} className="rounded-xl border bg-card p-4">
                <p className="font-semibold">{n.name}</p>
                <a className="text-sm text-primary" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${n.lat}&mlon=${n.lng}#map=18/${n.lat}/${n.lng}`}>
                  {distanceKm([loc.lat, loc.lng], [n.lat, n.lng]).toFixed(1)} km away · View on map
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
