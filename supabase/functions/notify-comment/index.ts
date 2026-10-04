// @ts-nocheck
// Emails you when a new comment arrives.  Deploy: Supabase Dashboard -> Edge Functions
// -> notify-comment (replace the old code with this file) -> Deploy.
//
// Secrets (Edge Functions -> notify-comment -> Secrets):
//   GMAIL_USER, GMAIL_APP_PASSWORD, NOTIFY_EMAIL
//   (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are added by Supabase automatically.)
//
// SECURITY: the old version emailed whatever text the browser sent, so anybody could
// use it to spam your inbox. This one ignores the browser's text completely: it only
// looks for a REAL pending comment in the database that has not been emailed yet, and
// sends the copy stored there. One comment = one email, never more.
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
    const { email, body: text, postUrl } = await req.json();
    if (typeof email !== "string" || typeof text !== "string") return json({ ok: false }, 400);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Only comments created in the last 5 minutes that were not emailed yet.
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: found } = await db
      .from("comments")
      .select("id, name, email, body, post_title, post_slug")
      .eq("notified", false)
      .eq("approved", false)
      .eq("email", email.trim().toLowerCase())
      .eq("body", text.trim())
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1);

    const c = found?.[0];
    if (!c) return json({ ok: false }, 404);

    // Claim it first, so two parallel calls can never send two emails.
    const { data: claimed } = await db
      .from("comments")
      .update({ notified: true })
      .eq("id", c.id)
      .eq("notified", false)
      .select("id");
    if (!claimed?.length) return json({ ok: false }, 409);

    const user = Deno.env.get("GMAIL_USER")!;
    const to = Deno.env.get("NOTIFY_EMAIL") || user;
    const origin = typeof postUrl === "string" ? new URL(postUrl).origin : "";
    const link = origin ? `${origin}/blog/${encodeURIComponent(c.post_slug)}` : "";

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
      replyTo: c.email,
      subject: `New comment on "${String(c.post_title || "your post").slice(0, 80)}"`,
      content: `${c.name} (${c.email}) wrote:\n\n${c.body}\n\n${link}\n\nApprove it in /admin/comments`,
      html: `<p><b>${esc(c.name)}</b> (${esc(c.email)}) wrote:</p>
             <blockquote>${esc(c.body).replace(/\n/g, "<br>")}</blockquote>
             ${link ? `<p><a href="${esc(link)}">${esc(link)}</a></p>` : ""}
             <p>Approve it in <b>/admin/comments</b>.</p>`,
    });
    await client.close();

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false }, 500);
  }
});