# The Journal — Personal Articles

React + Vite site with a public Articleand a single-admin dashboard, backed by Supabase
(auth, database, and image storage).

## What's included

- Landing page + Articlelisting + individual Articlepost pages (no signup needed for readers)
- Privacy Policy and Terms & Conditions pages
- `/admin/login` — only your one admin email can sign in
- `/admin` — dashboard listing your posts (edit / delete)
- `/admin/new` and `/admin/edit/:id` — post editor where you can:
  - drag & drop images anywhere into the post (or click to browse)
  - reorder paragraphs and images by dragging them
  - choose image width (small / medium / large)
  - set a cover image, excerpt, slug, and publish/draft status
- Google AdSense placeholder slots (swap in your real ad code once approved)

## 1. Create a Supabase project

1. Go to https://supabase.com, create a free project.
2. In your project, go to **SQL Editor** → New query.
3. Open `supabase/schema.sql` in this folder, **replace `you@example.com` with your
   real admin email** (2 places), paste the whole file into the SQL editor, and run it.
4. Go to **Storage** → New bucket → name it exactly `blog-images` → set it **Public** → Create.
   (The policies from the SQL file already allow public read / admin-only write on this bucket.)

## 2. Create your admin account

1. In Supabase, go to **Authentication → Users → Add user**.
2. Enter your admin email (same one you put in `schema.sql`) and a password.
3. Set "Auto Confirm User" to yes so you don't need email confirmation.

## 3. Configure the app

1. In Supabase, go to **Project Settings → API**. Copy the **Project URL** and **anon public key**.
2. Copy `.env.example` to a new file named `.env` in this folder.
3. Fill in:
   ```
   VITE_SUPABASE_URL=your project URL
   VITE_SUPABASE_ANON_KEY=your anon key
   VITE_ADMIN_EMAIL=your admin email (same one used above)
   ```

## 4. Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`. Go to `/admin/login` to sign in and write your first post.

## 5. Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages):

```bash
npm run build
```

Upload the generated `dist` folder, and add the same three environment variables
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`) in your host's
dashboard before building on their platform.

## 6. Add Google AdSense

Once your AdSense account is approved for this domain:

1. Open `index.html`, find the commented-out `<script>` tag near the bottom of `<head>`,
   uncomment it, and put in your real `client=ca-pub-XXXXXXXXXXXXXXXX` id.
2. The Articlelist and each post already have `<AdSlot />` placeholders
   (`src/components/AdSlot.jsx`) — replace the placeholder `<div>` inside with your real
   `<ins class="adsbygoogle">` ad unit code from AdSense.

## Notes

- Only the single email you set as `VITE_ADMIN_EMAIL` (and matched in `schema.sql`) can
  sign in to `/admin` and can write/edit/delete posts — this is enforced both in the
  app and at the database level (Row Level Security), so it can't be bypassed by editing
  frontend code.
- Visitors never need to sign up or log in to read the Articles.

---

## Comments + related posts (new)

### 1. Create the table
Supabase → SQL Editor → New query → paste `supabase/migration-comments.sql` → Run.

### 2. Connect your Gmail (no third-party service)

Every new comment is emailed to **muhammaddaoudqadir@gmail.com** by a Supabase
Edge Function that talks straight to Gmail's SMTP server. Nothing outside your
own Supabase + Gmail accounts is involved.

1. **Gmail App Password** — Gmail refuses plain passwords, so make one:
   turn on 2-Step Verification at <https://myaccount.google.com/security>,
   then open <https://myaccount.google.com/apppasswords>, create one named
   "Articles" and copy the 16 letters.
2. **Deploy the function** — Supabase Dashboard → Edge Functions →
   *Deploy a new function* → name it exactly `notify-comment` → paste
   `supabase/functions/notify-comment/index.ts` → Deploy.
   (CLI users: `supabase functions deploy notify-comment`.)
3. **Add the secrets** — Edge Functions → `notify-comment` → Secrets:

```
GMAIL_USER          = muhammaddaoudqadir@gmail.com
GMAIL_APP_PASSWORD  = the 16-letter app password
NOTIFY_EMAIL        = muhammaddaoudqadir@gmail.com
```

Nothing goes in `.env`, and the password never reaches the browser.
If the function is not deployed yet, comments are still saved — only the email
is skipped, and you will still see them waiting in the admin panel.

### 3. Approving comments
A new comment is saved as **waiting** and is invisible to readers.
Go to **/admin → Comments** (the button shows how many are waiting), press
**Approve**, and it appears in the right-hand column of that Articlepost.

### 4. Related posts
Every post now shows up to 3 more posts from the same category underneath it
(same subcategory first). Nothing to configure.