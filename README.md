# ContentEngine

AI-powered content calendar topic ideas for SEO agencies. Analyze client data (Google Search Console, SEMrush exports, past calendars) and generate strategic, data-backed content recommendations.

## Tech stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Anthropic Claude** (claude-sonnet-4-20250514)
- **NextAuth.js** (Google OAuth for GSC)
- **Google Search Console API**
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
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console (OAuth 2.0, Search Console API enabled)
   - `NEXTAUTH_SECRET` — e.g. `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `http://localhost:3000` locally; your Vercel URL in production

3. Run locally:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

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
4. Enable the **Search Console API** for your Google Cloud project.

## Usage

1. **Client configuration** — Client name (required), website URL, and service pillars (tags).
2. **Google Search Console** — Connect with Google, pick a property, set Period A / B, then **Pull Data**.
3. **Data upload** — Optionally upload SEMrush client/gap exports, past calendars, or other CSVs/Excel/PDF.
4. **Additional context** — Optional notes (campaigns, topics to avoid, goals).
5. **Generate** — Requires client name, at least one pillar, and at least one data source (GSC or file). Results show a data summary, topic cards (expand for details), filters, and CSV export.
