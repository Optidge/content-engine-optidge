# Google OAuth — local setup (fix “stuck after Allow”)

If Google’s consent screen finishes but the app never shows you as signed in, work through this list in order.

## 1. Use the exact URL (most common failure)

- Open the app at **http://localhost:3000** (not `127.0.0.1`, not another port).
- In `.env.local`, set:
  ```env
  NEXTAUTH_URL=http://localhost:3000
  ```
- If `npm run dev` prints **`Port 3000 is in use, trying 3001`**, OAuth **will fail** until you fix the mismatch. Either:
  - Stop the other process on 3000 (`lsof -i :3000` then quit that app), restart dev, and use **http://localhost:3000**, **or**
  - Change **both** `NEXTAUTH_URL` in `.env.local` **and** the Google Cloud redirect URI to `http://localhost:3001/api/auth/callback/google`, then open **http://localhost:3001** in the browser.

Restart after any `.env.local` change:

```bash
# Ctrl+C, then:
npm run dev
```

## 2. Google Cloud — OAuth client (Web application)

[Google Cloud Console](https://console.cloud.google.com/) → your project → **APIs & Services** → **Credentials** → your **OAuth 2.0 Client ID** (type must be **Web application**, not Desktop).

**Authorized JavaScript origins** — add:

```
http://localhost:3000
```

**Authorized redirect URIs** — add exactly (no trailing slash):

```
http://localhost:3000/api/auth/callback/google
```

If you also deploy to Vercel, add the production URL separately, e.g.:

```
https://your-app.vercel.app/api/auth/callback/google
```

Save and wait 1–2 minutes for Google to apply changes.

## 3. OAuth consent screen — Testing mode

**APIs & Services** → **OAuth consent screen**:

- Publishing status **Testing** is fine for local dev.
- Under **Test users**, click **Add users** and add the **same Gmail** you use to sign in.
- Without this, Google may block sign-in after you click Allow.

## 4. Enable APIs

**APIs & Services** → **Library** → enable:

- Google Search Console API
- Google Sheets API
- Google Drive API

## 4b. Add scopes on the OAuth consent screen

**APIs & Services** → **OAuth consent screen** → **Data access** (or **Scopes** → **Add or remove scopes**). Add:

| API | Scope |
|-----|--------|
| Google Search Console API | `.../auth/webmasters.readonly` |
| Google Sheets API | `.../auth/spreadsheets.readonly` |
| Google Drive API | `.../auth/drive.readonly` |

If these scopes are not registered on the consent screen, Google may sign you in but **Sheets/Drive API calls return 403**. After adding scopes, disconnect and reconnect in the app.

## 5. See the real error

After a failed sign-in, check:

- Browser URL: `http://localhost:3000/auth/error?error=...`
- Terminal where `npm run dev` is running (NextAuth `debug` logs in development)

Common `error` codes:

| Code | Fix |
|------|-----|
| `OAuthCallback` | Redirect URI missing or wrong in Google Cloud (step 2) |
| `Callback` | Browser URL doesn’t match `NEXTAUTH_URL` (step 1) |
| `AccessDenied` | Add yourself as a test user (step 3) |
| `Configuration` | Missing or wrong env vars; restart dev server |

## 6. Reconnect after scope changes

This app requests GSC + Sheets + Drive. If you connected Google before Sheets was added:

1. In the app, click **Disconnect** (or sign out).
2. Connect again and accept all permissions.

## Quick test

1. Visit http://localhost:3000/api/auth/signin  
2. Click **Google**  
3. After Allow, you should land on `/` and see “Connected as your@email.com” under GSC or Content Calendar.
