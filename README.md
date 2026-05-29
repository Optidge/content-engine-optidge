# ContentEngine

AI-powered content calendar topic ideas for SEO agencies. Analyze client data (Google Search Console, SEMrush exports, past calendars) and generate strategic, data-backed content recommendations.

## Tech stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Anthropic Claude** (claude-sonnet-4-20250514)
- **NextAuth.js** (Google OAuth for GSC + Google Sheets)
- **Supabase** (client profiles, generation history, topic feedback memory)
- **Google Search Console API**, **Google Sheets API**, **Google Drive API**
- **Papaparse** (CSV), **SheetJS** (Excel)
- **Vercel** (deployment)

## Setup

1. Clone and install:

   ```bash
   npm install
   ```

2. Copy env example and fill in:

   ```bash
   cp .env.local.example .env.local
   ```

   - `ANTHROPIC_API_KEY` — from Anthropic console
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console (OAuth 2.0; APIs below must be enabled)
   - `NEXTAUTH_SECRET` — e.g. `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `http://localhost:3000` locally; your Vercel URL in production
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase Project Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase Project Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Project Settings → API (server-side only)

3. Run locally:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

   **Google sign-in stuck after “Allow”?** See **[docs/OAUTH-LOCAL-SETUP.md](docs/OAUTH-LOCAL-SETUP.md)**.

## Deploy for your agency (ownership, cost, security)

See **[docs/AGENCY-DEPLOYMENT.md](docs/AGENCY-DEPLOYMENT.md)** for:

- Deploying under the agency’s GitHub and Vercel (not personal)
- Rough costs (Vercel, Anthropic, Google)
- Security (secrets, HTTPS, optional email allowlist)
- **Which keys to create under the agency** so billing and liability are not on you (Google OAuth, Anthropic API key, NEXTAUTH_SECRET/URL)

## Deploy to Vercel (quick)

1. Push to GitHub and import the repo in Vercel.
2. In Vercel → Settings → Environment Variables, add all variables from `.env.local.example`.
3. In Google Cloud Console, add the OAuth callback URL:  
   `https://<your-vercel-domain>/api/auth/callback/google`
4. In Google Cloud Console → **APIs & Services → Library**, enable:
   - **Google Search Console API** (for GSC)
   - **Google Sheets API** (for content calendars)
   - **Google Drive API** (to list/search spreadsheets)

   After enabling Sheets/Drive, users who connected Google before this update must **disconnect and reconnect** (or use **Reconnect Google Account** in the app) so OAuth includes the new permissions.

## Usage

1. **Client configuration** — Client name (required), website URL, and service pillars (tags).
2. **Google Search Console** — Connect with Google, pick a property, set Period A / B, then **Pull Data**.
3. **Content calendar** — Search and select a Google Sheet, choose tabs, then **Pull Data** (or use the file upload fallback).
4. **Data upload** — Optionally upload SEMrush client/gap exports or other supporting CSVs/Excel/PDF.
5. **Additional context** — Optional notes (campaigns, topics to avoid, goals).
6. **Generate** — Requires client name, at least one pillar, and at least one data source (GSC, loaded Google Sheet, or uploaded file). Results show a data summary, topic cards (expand for details), filters, and CSV export.

## Supabase setup (Beta memory features)

1. Create a Supabase project.
2. In Supabase SQL Editor, run:

```sql
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  url TEXT,
  pillars TEXT[] DEFAULT '{}',
  gsc_property TEXT,
  google_sheet_id TEXT,
  google_sheet_name TEXT,
  google_sheet_tabs TEXT[] DEFAULT '{}',
  brand_voice TEXT,
  additional_notes TEXT,
  created_by TEXT
);

CREATE TABLE generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  generated_by TEXT,
  topic_count INTEGER,
  data_sources_used TEXT[],
  ai_summary JSONB,
  topics JSONB,
  status TEXT DEFAULT 'completed'
);

CREATE TABLE topic_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  topic_title TEXT NOT NULL,
  pillar TEXT,
  content_type TEXT,
  target_keywords TEXT[],
  rationale TEXT,
  feedback TEXT CHECK (feedback IN ('liked', 'disliked')) NOT NULL,
  feedback_by TEXT,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON clients FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE topic_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON topic_feedback FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON generations FOR ALL USING (true) WITH CHECK (true);
```

3. Add Supabase keys to `.env.local` and Vercel Environment Variables.
4. Install dependencies:

```bash
npm install @supabase/supabase-js
```
