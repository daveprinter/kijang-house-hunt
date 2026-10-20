import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ShieldCheck } from "lucide-react";
import { requestAdminCode, verifyAdminCode } from "@/lib/admin.functions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { loadUserData, saveUserData } from "@/lib/userStore";
import { BUDGETS, FEATURES, HOUSE_TYPES, type FeatureId, type HouseType } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Keja Yangu" },
      { name: "description", content: "Update your phone, profile photo, location and house preferences." },
      { property: "og:title", content: "Settings — Keja Yangu" },
      { property: "og:description", content: "Update your phone, profile photo, location and house preferences." },
    ],
  }),
  component: SettingsPage,
});

type Prefs = { type?: HouseType | undefined; budget?: number | undefined; features: FeatureId[] };

function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adminStep, setAdminStep] = useState<"closed" | "code" | "email" | "otp">("closed");
  const [panelCode, setPanelCode] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>({ features: [] });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setName(data.full_name ?? "");
      setPhone(data.phone ?? "");
      setLocation(data.location_label ?? "");
      setAvatar(data.avatar_url);
      const p = (data.preferences ?? {}) as Prefs;
      setPrefs({ ...p, features: p.features ?? [] });
    });
  }, [user]);

  async function save() {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: name, phone, location_label: location, preferences: prefs, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    // Pre-fill the next hunt with these preferences
    const hunt = loadUserData<Prefs & { step: number; confirmed: boolean }>(user.id, "hunt", { step: 0, features: [], confirmed: false });
    saveUserData(user.id, "hunt", { ...hunt, type: prefs.type ?? hunt.type, budget: prefs.budget ?? hunt.budget, features: prefs.features.length ? prefs.features : hunt.features });
    toast.success("Settings saved");
  }

  async function upload(file: File) {
    if (!user) return;
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (!data) return;
    setAvatar(data.signedUrl);
    await supabase.from("profiles").update({ avatar_url: data.signedUrl }).eq("id", user.id);
    toast.success("Profile photo updated");
  }

  function useGps() {
    navigator.geolocation?.getCurrentPosition(async (p) => {
      const label = `${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`;
      setLocation(label);
      await supabase.from("profiles").update({ latitude: p.coords.latitude, longitude: p.coords.longitude, location_label: label }).eq("id", user!.id);
      toast.success("Location updated");
    }, () => toast.error("Location permission denied"));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-semibold">Settings</h1>

      <section className="mt-8 rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-5">
          <button onClick={() => fileRef.current?.click()} className="group relative">
            <Avatar className="size-20">
              {avatar && <AvatarImage src={avatar} />}
              <AvatarFallback className="bg-accent text-2xl">{(name || user?.email || "?")[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Camera className="size-4" /></span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <div>
            <p className="font-semibold">{name || "Your name"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone number</Label><Input value={phone} placeholder="07xx xxx xxx" onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Location</Label>
            <div className="flex gap-2">
              <Input value={location} placeholder="e.g. Kwa Vonza, near SEKU" onChange={(e) => setLocation(e.target.value)} />
              <Button variant="outline" onClick={useGps}>Use GPS</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="text-xl font-semibold">House preferences</h2>
        <p className="text-sm text-muted-foreground">Used to pre-fill your next hunt.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {HOUSE_TYPES.map((h) => (
            <button key={h.id} data-selected={prefs.type === h.id} onClick={() => setPrefs({ ...prefs, type: h.id, budget: undefined })} className="choice-card px-4 py-2 text-sm">{h.label}</button>
          ))}
        </div>
        {prefs.type && (
          <div className="mt-3 flex flex-wrap gap-2">
            {BUDGETS[prefs.type].map((b) => (
              <button key={b} data-selected={prefs.budget === b} onClick={() => setPrefs({ ...prefs, budget: b })} className="choice-card px-4 py-2 text-sm">KES {b.toLocaleString()}</button>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {FEATURES.map((f) => {
            const on = prefs.features.includes(f.id);
            return (
              <button key={f.id} data-selected={on} onClick={() => setPrefs({ ...prefs, features: on ? prefs.features.filter((x) => x !== f.id) : [...prefs.features, f.id] })} className="choice-card px-3 py-1.5 text-sm">{f.label}</button>
            );
          })}
        </div>
      </section>

      <Button size="lg" className="mt-6" onClick={save}>Save settings</Button>
    </div>
  );
}
