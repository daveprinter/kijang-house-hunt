import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers, Wallet, Sparkles, MapPin } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { ApartmentCard } from "@/components/ApartmentCard";
import { APARTMENTS, REGIONS } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kijang — Find student houses near SEKU & KU Kwa Vonza" },
      { name: "description", content: "Hunt for bedsitters, single rooms and one-bedrooms around Kwa Vonza, Kitui, Machakos and Nairobi." },
      { property: "og:title", content: "Kijang — Student house hunting" },
      { property: "og:description", content: "Pick your house type, budget and features — Kijang finds vacant houses near you." },
    ],
  }),
  component: Index,
});

const steps = [
  { icon: Layers, title: "Pick a house type", text: "Single room, bedsitter, one or two bedroom." },
  { icon: Wallet, title: "Set your budget", text: "Tap a budget card or type your own." },
  { icon: Sparkles, title: "Choose features", text: "Balcony, tiles, running water, wardrobes…" },
  { icon: MapPin, title: "We find nearby houses", text: "Using your location, with vacancies & caretaker contacts." },
];

function Index() {
  return (
    <div>
      <section className="relative min-h-[82vh] overflow-hidden">
        <img src={hero} alt="Student apartments in Kwa Vonza at sunset" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="bg-hero-overlay absolute inset-0" />
        <div className="relative mx-auto flex min-h-[82vh] max-w-6xl flex-col justify-end px-4 pb-16 text-primary-foreground">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">SEKU · KU Kwa Vonza · Kitui</p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] md:text-7xl">Your next room, a few taps away.</h1>
          <p className="mt-5 max-w-xl text-lg opacity-90">
            Kijang helps students and anyone around Kwa Vonza find vacant bedsitters, single rooms and apartments — with real prices and caretaker contacts.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-14 rounded-full px-8 text-base">
              <Link to="/hunt">Start house hunting</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-14 rounded-full px-8 text-base">
              <Link to="/explore">Explore areas</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-4xl font-semibold">How Kijang works</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between">
                <s.icon className="size-7 text-primary" />
                <span className="font-display text-3xl text-muted-foreground/40">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-16 text-secondary-foreground">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-semibold">Areas we cover</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {REGIONS.map((r) => (
              <Link key={r.county} to="/explore" search={{ county: r.county }} className="rounded-2xl bg-secondary-foreground/10 p-5 transition hover:bg-secondary-foreground/20">
                <p className="font-display text-2xl">{r.county}</p>
                <p className="mt-1 text-sm opacity-80">{r.constituencies.length} constituencies</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex items-end justify-between">
          <h2 className="text-4xl font-semibold">Houses around Kwa Vonza</h2>
          <Link to="/explore" className="text-sm font-semibold text-primary">See all →</Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {APARTMENTS.filter((a) => a.area === "Kwa Vonza").slice(0, 6).map((a) => (
            <ApartmentCard key={a.id} a={a} />
          ))}
        </div>
      </section>
    </div>
  );
}
