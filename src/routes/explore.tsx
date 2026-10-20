import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ApartmentCard } from "@/components/ApartmentCard";
import { APARTMENTS, REGIONS, distanceKm, osmEmbed } from "@/lib/data";

const search = z.object({
  county: z.string().optional(),
  constituency: z.string().optional(),
  ward: z.string().optional(),
});

export const Route = createFileRoute("/explore")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Explore areas — Kijang" },
      { name: "description", content: "Browse counties, constituencies and wards to find apartments with vacancies." },
      { property: "og:title", content: "Explore areas — Kijang" },
      { property: "og:description", content: "Browse counties, constituencies and wards to find apartments with vacancies." },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { county, constituency, ward } = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });
  const region = REGIONS.find((r) => r.county === county);
  const cons = region?.constituencies.find((c) => c.name === constituency);
  const wardObj = cons?.wards.find((w) => w.name === ward);
  const center: [number, number] = wardObj?.center ?? region?.center ?? [-1.375, 38.005];

  const list = APARTMENTS.filter((a) => !county || a.county === county)
    .map((a) => ({ a, d: distanceKm(center, [a.lat, a.lng]) }))
    .filter((x) => !wardObj || x.d < 8)
    .sort((x, y) => x.d - y.d);

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} data-selected={active} className="choice-card px-4 py-2.5 text-sm font-medium">
      {children}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-semibold">Explore areas</h1>
      <p className="mt-1 text-muted-foreground">Choose a county, then narrow down to a constituency and ward.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {REGIONS.map((r) => (
          <Chip key={r.county} active={r.county === county} onClick={() => navigate({ search: { county: r.county } })}>{r.county}</Chip>
        ))}
      </div>
      {region && (
        <div className="mt-3 flex flex-wrap gap-2">
          {region.constituencies.map((c) => (
            <Chip key={c.name} active={c.name === constituency} onClick={() => navigate({ search: { county, constituency: c.name } })}>{c.name}</Chip>
          ))}
        </div>
      )}
      {cons && (
        <div className="mt-3 flex flex-wrap gap-2">
          {cons.wards.map((w) => (
            <Chip key={w.name} active={w.name === ward} onClick={() => navigate({ search: { county, constituency, ward: w.name } })}>{w.name}</Chip>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="overflow-hidden rounded-3xl border shadow-card">
          <iframe title="Area map" src={osmEmbed(center[0], center[1], wardObj ? 0.02 : 0.08)} className="h-[420px] w-full lg:h-full lg:min-h-[520px]" />
        </div>
        <div className="grid content-start gap-4">
          {list.length === 0 && <p className="text-muted-foreground">No listed apartments here yet — check back soon.</p>}
          {list.map(({ a, d }) => <ApartmentCard key={a.id} a={a} distance={d} />)}
        </div>
      </div>
    </div>
  );
}
