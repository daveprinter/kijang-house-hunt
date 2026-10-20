import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Phone, MapPin, Check } from "lucide-react";
import { APARTMENTS, FEATURES, HOUSE_LABEL, formatKES, osmEmbed, type HouseType } from "@/lib/data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/apartments/$id")({
  loader: ({ params }) => {
    const a = APARTMENTS.find((x) => x.id === params.id);
    if (!a) throw notFound();
    return { a };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.a.name} — Kijang` },
          { name: "description", content: `${loaderData.a.name} in ${loaderData.a.area}: vacancies, prices and caretaker contact.` },
          { property: "og:title", content: `${loaderData.a.name} — Kijang` },
          { property: "og:description", content: loaderData.a.description },
        ]
      : [{ title: "Apartment not found — Kijang" }, { name: "robots", content: "noindex" }],
  }),
  component: Detail,
});

function Detail() {
  const { a } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/explore" className="text-sm text-muted-foreground">← Back to explore</Link>
      <h1 className="mt-3 text-5xl font-semibold">{a.name}</h1>
      <p className="mt-2 flex items-center gap-1 text-muted-foreground"><MapPin className="size-4" /> {a.area}, {a.ward}, {a.county} · near {a.near}</p>
      <p className="mt-4 max-w-2xl text-lg">{a.description}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="text-xl font-semibold">Vacancies</h2>
            <div className="mt-4 divide-y">
              {(Object.entries(a.units) as [HouseType, { price: number; vacant: number; total: number }][]).map(([t, u]) => (
                <div key={t} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{HOUSE_LABEL[t]}</p>
                    <p className="text-sm text-muted-foreground">{formatKES(u.price)} / month</p>
                  </div>
                  <span className={u.vacant > 0 ? "rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success" : "rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"}>
                    {u.vacant} of {u.total} vacant
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="text-xl font-semibold">Amenities</h2>
            <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {FEATURES.filter((f) => a.amenities.includes(f.id)).map((f) => (
                <li key={f.id} className="flex items-center gap-2"><Check className="size-4 text-success" /> {f.label}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-secondary p-6 text-secondary-foreground">
            <p className="text-sm opacity-80">{a.caretaker.role}</p>
            <p className="font-display text-2xl">{a.caretaker.name}</p>
            <Button asChild className="mt-4" size="lg">
              <a href={`tel:${a.caretaker.phone.replace(/\s/g, "")}`}><Phone className="size-4" /> {a.caretaker.phone}</a>
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border shadow-card">
          <iframe title={`${a.name} map`} src={osmEmbed(a.lat, a.lng, 0.006)} className="h-full min-h-[420px] w-full" />
        </div>
      </div>
    </div>
  );
}
