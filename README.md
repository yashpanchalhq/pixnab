# Screenshot API

Capture full-page screenshots of any URL via a simple REST API.

**Stack:** Next.js 16 App Router · TypeScript · Supabase · puppeteer-core · @sparticuz/chromium · Vercel

---

## Setup

```bash
npm install
cp .env.example .env.local   # fill SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# Run supabase/schema.sql in your Supabase SQL editor

npm run dev
```

**Local dev:** requires Chrome installed at one of these paths (or set `CHROME_PATH`):
- `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- `/usr/bin/google-chrome` / `/usr/bin/chromium`

---

## Endpoints

### `POST /api/keys` — Create API key
```json
{ "user_email": "you@example.com", "plan": "free" }
```
Returns `{ key, id, plan, credit_limit }` — **save the key, shown once**.

Plans: `free` → 100 credits · `pro` → 1000 credits

---

### `POST /api/screenshot` — Capture screenshot
```
Authorization: Bearer ss_...
Content-Type: application/json

{ "url": "https://example.com" }
```
Returns raw **PNG bytes** (`Content-Type: image/png`). Costs 1 credit.

---

### `GET /api/usage` — Check credit usage
```
Authorization: Bearer ss_...
```
```json
{ "credits_used": 3, "credit_limit": 100, "credits_remaining": 97, "plan": "free" }
```

---

## Deploy

```bash
vercel deploy
# Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in Vercel dashboard
```

The screenshot route uses `maxDuration = 30` for Vercel's serverless runtime.
