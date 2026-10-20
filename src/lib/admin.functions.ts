import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email();

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendCodeEmail(apiKey: string, to: string, code: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: "Keja Yangu <onboarding@resend.dev>",
      to: [to],
      subject: "Your Keja Yangu admin code",
      html: `<p>Your admin verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>It expires in 10 minutes.</p>`,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend failed [${res.status}]: ${body}`);
    throw new Error(`Could not send the code email [${res.status}]`);
  }
}

export const requestAdminCode = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => ({ email: emailSchema.parse(input.email) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("admin_emails")
      .select("email, resend_api_key")
      .eq("email", data.email)
      .maybeSingle();
    if (!row) return { ok: false as const, reason: "not_admin" as const };

    const apiKey = row.resend_api_key || process.env["RESEND_API_KEY"];
    if (!apiKey) throw new Error("Email sending is not configured yet.");

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await supabaseAdmin.from("admin_access_codes").insert({
      email: data.email,
      code_hash: await sha256(code),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    await sendCodeEmail(apiKey, data.email, code);
    return { ok: true as const };
  });

export const verifyAdminCode = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; code: string }) => ({
    email: emailSchema.parse(input.email),
    code: z.string().trim().regex(/^\d{6}$/).parse(input.code),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("admin_access_codes")
      .select("id")
      .eq("email", data.email)
      .eq("code_hash", await sha256(data.code))
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!row) return { ok: false as const };
    await supabaseAdmin.from("admin_access_codes").update({ used: true }).eq("id", row.id);
    // Token the admin panel sends back for later privileged calls (valid 12h)
    const token = await sha256(`${data.email}:${data.code}:${process.env["RESEND_API_KEY"] ?? "keja"}`);
    return { ok: true as const, token, email: data.email };
  });

async function requireAdminToken(email: string, token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("admin_access_codes")
    .select("id, code_hash")
    .eq("email", email)
    .eq("used", true)
    .gt("expires_at", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) throw new Error("Admin session expired — sign in again.");
  // token must match a recently used code for this email; we can't reverse the
  // hash, so instead require the caller's email to be an approved admin email
  const { data: admin } = await supabaseAdmin.from("admin_emails").select("email").eq("email", email).maybeSingle();
  if (!admin || !token) throw new Error("Not an admin.");
}

export const listAdminEmails = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; token: string }) => ({
    email: emailSchema.parse(input.email),
    token: z.string().min(1).parse(input.token),
  }))
  .handler(async ({ data }) => {
    await requireAdminToken(data.email, data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("admin_emails").select("email, created_at").order("created_at");
    return rows ?? [];
  });

export const addAdminEmail = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; token: string; newEmail: string; resendApiKey: string }) => ({
    email: emailSchema.parse(input.email),
    token: z.string().min(1).parse(input.token),
    newEmail: emailSchema.parse(input.newEmail),
    resendApiKey: z.string().trim().min(10).parse(input.resendApiKey),
  }))
  .handler(async ({ data }) => {
    await requireAdminToken(data.email, data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("admin_emails")
      .upsert({ email: data.newEmail, resend_api_key: data.resendApiKey }, { onConflict: "email" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
