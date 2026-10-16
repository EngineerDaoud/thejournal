// @ts-nocheck
// Emails you when a reader sends an article for approval.
// Deploy: Supabase Dashboard -> Edge Functions -> Create a new function named
// "notify-submission" -> paste this file -> Deploy.
//
// It uses the SAME secrets as notify-comment (GMAIL_USER, GMAIL_APP_PASSWORD, NOTIFY_EMAIL),
// so nothing new to set up. Like notify-comment it ignores any text from the browser: it only
// emails a REAL pending article from the database that has not been emailed yet.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (s: string) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false }, 405);

  try {
    const { email, title, siteUrl } = await req.json();
    if (typeof email !== "string" || typeof title !== "string") return json({ ok: false }, 400);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Only articles sent in the last 5 minutes that were not emailed yet.
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: found } = await db
      .from("submissions")
      .select("id, title, author_name, email, country, category, excerpt, content")
      .eq("notified", false)
      .eq("status", "pending")
      .eq("email", email.trim().toLowerCase())
      .eq("title", title.trim())
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1);

    const s = found?.[0];
    if (!s) return json({ ok: false }, 404);

    // Claim it first, so two parallel calls can never send two emails.
    const { data: claimed } = await db
      .from("submissions")
      .update({ notified: true })
      .eq("id", s.id)
      .eq("notified", false)
      .select("id");
    if (!claimed?.length) return json({ ok: false }, 409);

    const words = (Array.isArray(s.content) ? s.content : [])
      .map((b: any) => (typeof b?.content === "string" ? b.content : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const preview = words.slice(0, 400) + (words.length > 400 ? "..." : "");

    let origin = "";
    try {
      origin = new URL(String(siteUrl)).origin;
    } catch (_) { /* no link */ }
    const link = origin ? `${origin}/admin/submissions` : "";

    const user = Deno.env.get("GMAIL_USER")!;
    const to = Deno.env.get("NOTIFY_EMAIL") || user;
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: { username: user, password: Deno.env.get("GMAIL_APP_PASSWORD")! },
      },
    });

    await client.send({
      from: user,
      to,
      replyTo: s.email,
      subject: `Article waiting for approval: "${String(s.title).slice(0, 80)}"`,
      content: `${s.author_name} (${s.email}, ${s.country || "country not given"}) sent an article for approval.\n\nTitle: ${s.title}\nCategory: ${s.category}\n\n${preview}\n\n${link ? "Review it here: " + link : "Review it in /admin/submissions"}`,
      html: `<p><b>${esc(s.author_name)}</b> sent an article for approval.</p>
             <p><b>Email:</b> ${esc(s.email)}<br><b>Country:</b> ${esc(s.country || "not given")}</p>
             <p><b>Title:</b> ${esc(s.title)}<br><b>Category:</b> ${esc(s.category)}</p>
             <blockquote>${esc(preview).replace(/\n/g, "<br>")}</blockquote>
             <p>${link ? `<a href="${esc(link)}">Review it in /admin/submissions</a>` : "Review it in <b>/admin/submissions</b>"}</p>
             <p>It is NOT on the site until you approve it.</p>`,
    });
    await client.close();

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false }, 500);
  }
});