import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, MailPlus, LogOut } from "lucide-react";
import { addAdminEmail, listAdminEmails } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — Keja Yangu" },
      { name: "description", content: "Keja Yangu admin panel." },
      { property: "og:title", content: "Admin panel — Keja Yangu" },
      { property: "og:description", content: "Keja Yangu admin panel." },
    ],
  }),
  component: AdminPage,
});

type AdminSession = { email: string; token: string };

function readSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem("keja_admin");
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

function AdminPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [emails, setEmails] = useState<{ email: string; created_at: string }[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newKey, setNewKey] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = readSession();
    if (!s) {
      toast.error("Sign in to the admin panel first.");
      navigate({ to: "/settings" });
      return;
    }
    setSession(s);
  }, [navigate]);

  useEffect(() => {
    if (!session) return;
    listAdminEmails({ data: session })
      .then(setEmails)
      .catch((e) => {
        toast.error((e as Error).message);
        sessionStorage.removeItem("keja_admin");
        navigate({ to: "/settings" });
      });
  }, [session, navigate]);

  async function addEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    try {
      await addAdminEmail({ data: { ...session, newEmail, resendApiKey: newKey } });
      toast.success(`${newEmail} can now receive admin codes.`);
      setNewEmail("");
      setNewKey("");
      setEmails(await listAdminEmails({ data: session }));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-4xl font-semibold">
          <ShieldCheck className="size-8 text-primary" /> Admin panel
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            sessionStorage.removeItem("keja_admin");
            navigate({ to: "/" });
          }}
        >
          <LogOut className="size-4" /> Leave admin
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Signed in as {session.email}</p>

      <section className="mt-8 rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="text-xl font-semibold">Approved admin emails</h2>
        <p className="text-sm text-muted-foreground">Only these emails can receive admin verification codes.</p>
        <ul className="mt-4 space-y-2">
          {emails.map((r) => (
            <li key={r.email} className="rounded-xl border px-4 py-2 text-sm font-medium">{r.email}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <MailPlus className="size-5 text-primary" /> Add an admin email
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter the new email and the Resend API key whose account owns that address — codes for it will be sent using that key.
        </p>
        <form onSubmit={addEmail} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-email">New admin email</Label>
            <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-key">Resend API key for that email</Label>
            <Input id="new-key" type="password" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="re_..." required />
          </div>
          <Button type="submit" disabled={busy}>{busy ? "Adding…" : "Add email"}</Button>
        </form>
      </section>
    </div>
  );
}
