# Deploying ContentEngine for Your Marketing Agency

This guide covers how to deploy the app under your **agency** (not your personal accounts), approximate **costs**, **security** best practices, and which **keys/credentials** to create under the agency so liability and billing are not on you personally.

---

## 1. Deploying to the agency (ownership & hosting)

**Goal:** The app and all related accounts should be owned by the agency, not your personal identity.

### Option A: Agency GitHub + Agency Vercel (recommended)

1. **Create or use the agency’s GitHub organization** (e.g. `your-agency`).
2. **Create a new repository** under that org (e.g. `content-engine`), or **transfer** the existing repo to the org (GitHub repo → Settings → scroll to “Danger Zone” → Transfer ownership).
3. **Create or use the agency’s Vercel account** (or Vercel Team). Log in as the agency, not your personal Vercel.
4. **Import the repo** in Vercel (New Project → Import from GitHub → select the agency repo).
5. **Configure the production URL** (e.g. `contentengine.youragency.com` or a Vercel subdomain). All env vars and deployments are then under the agency’s Vercel project.

Result: Code lives in the agency’s GitHub; deployments and env vars live in the agency’s Vercel. You can be a member/collaborator without owning the billing or credentials.

### Option B: Keep repo under your GitHub, deploy under agency Vercel

- Leave the repo on your GitHub (or a personal org).
- In the **agency’s** Vercel account, create a new project and “Import” by connecting to GitHub and selecting this repo (agency Vercel will need access to the repo, e.g. you grant the agency’s Vercel access to your GitHub).
- Set all environment variables in the **agency’s** Vercel project.

Result: Agency owns the running app and all secrets; you still own the repo. For full separation, Option A is cleaner.

---

## 2. Costs (rough guide)

| Item | Typical cost |
|------|----------------------|
| **Vercel** | **Free (Hobby)** for small teams: 100 GB‑hours serverless, 6,000 build minutes/mo. **Pro** (~$20/user/mo) if you need more or team features. |
| **Anthropic (Claude API)** | **Pay‑per‑use** (tokens). A few hundred to low thousands of requests per month is usually in the **tens of dollars**; scale up with usage. Billing on the account that owns the API key. |
| **Google Cloud (OAuth + Search Console API)** | **Free** for normal OAuth and Search Console API usage (no charge for the APIs themselves). |
| **NextAuth / app** | No direct cost. |

**Summary:** With light–moderate use, expect **Vercel free tier + roughly $20–100+/mo Anthropic** depending on how often you generate. Put the Anthropic key and billing under the **agency’s** Anthropic account so the agency pays, not you.

---

## 3. Security (keeping it agency-only and safe)

- **Secrets never in code**  
  All keys and secrets live only in **Vercel → Settings → Environment Variables**. Never commit `.env` or real keys to the repo.

- **Use the agency’s credentials**  
  Create and use:
  - Agency’s **Google Cloud** project and OAuth client (see below).
  - Agency’s **Anthropic** API key.
  - A **new** `NEXTAUTH_SECRET` generated only for this deployment.

- **HTTPS only**  
  Vercel serves the app over HTTPS. NextAuth uses secure cookies by default in production.

- **Restrict who can use the app (optional but recommended)**  
  Right now anyone with the link can open the app; only “Connect Google Search Console” requires a Google account. To restrict usage to your team only, you can:
  - **Allowlist by email:** In NextAuth, add a check (e.g. in the `signIn` callback) so only addresses from your domain (e.g. `@youragency.com`) can sign in. Reject others.
  - **VPN / private link:** Host on an internal URL and allow access only over VPN, or use Vercel’s password protection (Pro feature) for the deployment.

- **Vercel access**  
  Only give Vercel project (and env var) access to agency team members who need to manage the app.

- **Rotate if exposed**  
  If any key might have been leaked, rotate it immediately (new key in Anthropic/Google, new `NEXTAUTH_SECRET` in Vercel, then redeploy).

---

## 4. Keys to change so it’s under the agency (not your liability)

Create **new** credentials under the **agency’s** accounts and use them only in the **agency’s** Vercel project. Do not reuse your personal keys for production.

| Key / credential | Where it’s created | Why change it |
|------------------|-------------------|----------------|
| **Google OAuth (GSC)** | **Google Cloud Console** (agency’s project or new project under agency Google account) | So OAuth consent, API usage, and any audit trail are under the agency, not you. |
| **Anthropic API key** | **Anthropic console** (agency’s account) | Billing and usage limits are on the agency; you’re not liable for their usage. |
| **NEXTAUTH_SECRET** | You generate once (e.g. `openssl rand -base64 32`) and store in Vercel | Unique per deployment; don’t reuse from your personal app. |
| **NEXTAUTH_URL** | Set in Vercel to the agency’s production URL | Must match the domain the app is served from (e.g. `https://contentengine.youragency.com`). |

### Step-by-step: agency Google OAuth (for GSC)

1. Use a **Google account that represents the agency** (e.g. `tech@youragency.com` or an admin account).
2. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a **new project** (e.g. “ContentEngine Production”) or use the agency’s existing project.
3. **APIs & Services → Enable APIs** → enable **Google Search Console API**.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Authorized redirect URIs: `https://<agency-vercel-domain>/api/auth/callback/google` (e.g. `https://contentengine.youragency.com/api/auth/callback/google`).
5. Copy the **Client ID** and **Client secret** into the **agency’s** Vercel project → Settings → Environment Variables → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

### Step-by-step: agency Anthropic key

1. The agency signs up or logs in at [Anthropic](https://www.anthropic.com/) (e.g. with `billing@youragency.com`).
2. Create an **API key** in the Anthropic console.
3. Add it in the **agency’s** Vercel project as `ANTHROPIC_API_KEY`.

### Step-by-step: NEXTAUTH for the agency

1. Generate a new secret:  
   `openssl rand -base64 32`
2. In the **agency’s** Vercel project, set:
   - `NEXTAUTH_SECRET` = that value
   - `NEXTAUTH_URL` = `https://<agency-vercel-domain>` (no trailing slash)

---

## 5. Checklist before going live

- [ ] Repo is under the **agency’s** GitHub org (or at least the production deploy uses the agency’s Vercel).
- [ ] **Vercel** project is under the agency’s account/team; only agency members have access.
- [ ] **Google OAuth** client is created in the agency’s Google Cloud project; redirect URI matches the production URL.
- [ ] **Anthropic** API key is from the agency’s account and set in Vercel (not your personal key).
- [ ] **NEXTAUTH_SECRET** is new and only in Vercel; **NEXTAUTH_URL** is the production URL.
- [ ] (Optional) Restrict sign-in to agency email domain so only your team can use the app.
- [ ] Document for the agency where each credential lives (Google Cloud project, Anthropic account, Vercel env vars) so they can rotate or change billing without you.

Once this is done, the app runs under the agency’s infrastructure and accounts, and you’re not on the hook for their usage or credentials.
