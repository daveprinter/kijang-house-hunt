import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { type Apartment, formatKES, HOUSE_LABEL, totalVacant, type HouseType } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export function ApartmentCard({ a, distance }: { a: Apartment; distance?: number }) {
  const prices = Object.values(a.units).map((u) => u!.price);
  const vacant = totalVacant(a);
  return (
    <Link
      to="/apartments/$id"
      params={{ id: a.id }}
      className="choice-card block overflow-hidden"
    >
      <div className="bg-warm h-2" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-semibold">{a.name}</h3>
          <Badge variant={vacant > 0 ? "default" : "secondary"}>{vacant > 0 ? `${vacant} vacant` : "Full"}</Badge>
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5" /> {a.area}, {a.county}
          {distance !== undefined && <span>· {distance.toFixed(1)} km</span>}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(Object.keys(a.units) as HouseType[]).map((t) => (
            <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{HOUSE_LABEL[t]}</span>
          ))}
        </div>
        <p className="mt-3 text-sm font-semibold text-primary">From {formatKES(Math.min(...prices))}/mo</p>
      </div>
    </Link>
  );
}
