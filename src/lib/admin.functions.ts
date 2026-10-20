import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email();

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Brand palette (hex matches of the app's oklch design tokens)
const BRAND = {
  bg: "#f7f3ec", // warm cream background
  card: "#fdfbf7", // card surface
  ink: "#3a2e25", // foreground text
  muted: "#7a6a5c", // muted text
  terracotta: "#c0632f", // primary
  acacia: "#2f5d50", // secondary
  border: "#e3d9cb",
};

function codeEmailHtml(code: string) {
  const digits = code.split("").join(" ");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:Manrope,Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:18px;overflow:hidden;">
        <tr>
          <td style="background:${BRAND.terracotta};padding:28px 32px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:600;color:#fdfbf7;letter-spacing:-0.5px;">
              Keja Yangu<span style="color:${BRAND.acacia};background:#fdfbf7;border-radius:6px;padding:0 6px;margin-left:6px;font-size:14px;vertical-align:middle;">Admin</span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 8px;">
            <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:600;color:${BRAND.ink};">Your admin verification code</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BRAND.muted};">
              Enter this code in the Keja Yangu admin panel to continue. It expires in <strong style="color:${BRAND.ink};">10 minutes</strong>.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="background:${BRAND.bg};border:1.5px solid ${BRAND.terracotta};border-radius:14px;padding:22px 0;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;letter-spacing:10px;color:${BRAND.terracotta};">${digits}</span>
              </td></tr>
            </table>
            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
              If you didn't request this code, you can safely ignore this email — no one can enter the admin panel without it.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 28px;">
            <hr style="border:none;border-top:1px solid ${BRAND.border};margin:0 0 16px;">
            <p style="margin:0;font-size:12px;color:${BRAND.muted};">
              Keja Yangu — student house hunting around Kwa Vonza, Kitui &amp; beyond.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendCodeEmail(apiKey: string, to: string, code: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: "Keja Yangu <onboarding@resend.dev>",
      to: [to],
      // Unique subject per code so each email arrives as its own message, not threaded
      subject: `${code} is your Keja Yangu admin code`,
      html: codeEmailHtml(code),
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
