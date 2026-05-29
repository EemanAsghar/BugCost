<div align="center">
  <br />
  <br />

  <h1>BugCost</h1>

  <p>
    <strong>Revenue impact analysis for production bugs — automated.</strong><br />
    Connect Sentry, GitHub, and Stripe. Get an exact dollar amount for every fatal error in under 10 seconds.
  </p>

  <br />

  <p>
    <a href="https://bugcost.vercel.app/demo">
      <img src="https://img.shields.io/badge/Live%20Demo-→-000000?style=for-the-badge&labelColor=000" alt="Live Demo" />
    </a>
    &nbsp;
    <a href="https://bugcost.vercel.app/auth">
      <img src="https://img.shields.io/badge/Get%20Started-→-ff9f0a?style=for-the-badge&labelColor=ff9f0a&color=000" alt="Get Started" />
    </a>
  </p>

  <br />

  <p>
    <img src="https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Next.js%2016-000?style=flat-square&logo=nextdotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/Coral%20SQL-ff9f0a?style=flat-square" />
    <img src="https://img.shields.io/badge/Claude%20Haiku-bf5af2?style=flat-square" />
    <img src="https://img.shields.io/badge/Clerk%20Auth-6c47ff?style=flat-square" />
    <img src="https://img.shields.io/badge/Vercel-000?style=flat-square&logo=vercel&logoColor=white" />
    <img src="https://img.shields.io/badge/license-MIT-30d158?style=flat-square" />
  </p>

  <br />
  <br />

</div>

---

<br />

## The problem every engineering team has

Your checkout is broken. You can see it in Sentry. Revenue is dropping in Stripe. Something changed in GitHub.

Three dashboards. Three timelines. An engineer manually correlating timestamps for 45 minutes to produce a number nobody is confident in.

**BugCost solves this with a single SQL query.**

<br />

## What it does

BugCost joins your Sentry errors, GitHub commits, and Stripe payment failures across a single federated SQL query using [Coral](https://github.com/withcoral). Claude Haiku analyzes the correlated results to confirm root cause and assign confidence. The whole pipeline completes in under 10 seconds.

```
Input:   3 separate APIs, messy timestamps, no shared keys
Output:  ranked bugs × exact revenue loss × responsible commit × root cause
```

```
bug                       engineer         failed_payments   revenue_lost
────────────────────────  ───────────────  ───────────────   ────────────
TypeError: price undef    @sarah-chen               280          $8,400
PaymentIntentError        @mike-torres               94          $3,200
SessionExpiredError       @alex-kim                  51          $1,800
```

<br />

---

<br />

## The core query

This is the heart of BugCost. Everything else — the UI, the AI analysis, the auth — exists to show you this result.

```sql
SELECT
  s.title                                          AS bug,
  g.author__login                                  AS introduced_by,
  g.commit__message                                AS commit,
  COUNT(p.id)                                      AS failed_payments,
  CAST(SUM(CAST(p.amount AS DOUBLE)) / 100.0
       AS DOUBLE)                                  AS revenue_lost_usd

FROM   sentry.issues  s

JOIN   github.commits g
    ON CAST(g.commit__author__date AS TIMESTAMP)
           BETWEEN CAST(s.first_seen AS TIMESTAMP) - INTERVAL '2 hours'
               AND CAST(s.first_seen AS TIMESTAMP)

JOIN   stripe.charges p
    ON CAST(p.created AS TIMESTAMP) >= CAST(s.first_seen AS TIMESTAMP)
   AND p.status = 'failed'

WHERE  s.level = 'fatal'
ORDER  BY revenue_lost_usd DESC;
```

Without Coral, this query cannot be written. Sentry, GitHub, and Stripe speak different APIs, return different formats, and share no common schema. Coral federates them into a single SQL namespace — no ETL, no ingestion pipeline, no intermediate database.

<br />

---

<br />

## Features

**Automated revenue attribution**
Every fatal Sentry error is joined to the GitHub commit that introduced it and the Stripe charges that failed afterward — automatically, with exact dollar amounts.

**AI root cause analysis**
Claude Haiku receives clean, typed, correlated rows — not raw JSON — and returns a 2-sentence root cause with a confidence percentage. No hallucinations, no prompt engineering required.

**Live and demo modes**
Connect your own Sentry, GitHub, and Stripe credentials in onboarding and the dashboard switches from demo data to your real production environment. The live mode badge makes the distinction clear.

**Per-user credential isolation**
Credentials are stored locally in the browser and passed at query time. Nothing sensitive touches the server.

**Cinematic investigation timeline**
Each incident has a visual timeline overlaying deploy events, error spikes, and revenue impact. Built with Recharts and Framer Motion.

<br />

---

<br />

## How it's built

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Sentry API          GitHub API          Stripe API           │
│       │                   │                   │                │
│       └───────────────────┼───────────────────┘                │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │  Coral CLI  │  ← one SQL JOIN              │
│                    │  subprocess │    no ETL, no ingestion      │
│                    └──────┬──────┘                              │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │ Claude Haiku│  ← structured rows in        │
│                    │  (Anthropic)│    root cause + confidence   │
│                    └──────┬──────┘                              │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │  Next.js 16 │  ← ranked bug dashboard      │
│                    │  dashboard  │    investigation timeline    │
│                    └─────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Request lifecycle:**

1. User opens the dashboard or triggers an investigation
2. Next.js API route spawns `coral sql --format json` as a subprocess
3. Coral federates the JOIN across live Sentry, GitHub, and Stripe
4. Typed result rows — not raw API responses — are passed to Claude
5. Claude returns root cause + confidence in a single completion
6. Dashboard renders bugs ranked by revenue impact

<br />

---

<br />

## Stack

| | |
|---|---|
| **Query federation** | [Coral CLI](https://github.com/withcoral) — cross-source SQL, handles auth and schema normalization |
| **AI analysis** | Claude Haiku — root cause analysis on structured data |
| **Framework** | Next.js 16 (App Router, API Routes, SSR) |
| **Auth** | Clerk — GitHub OAuth, Google, email/password |
| **Charts** | Recharts + Framer Motion |
| **Deployment** | Vercel |

<br />

---

<br />

## Getting started

**Requirements**

```bash
brew install withcoral/tap/coral
coral --version   # 0.4.1+
node --version    # 18+
```

**Setup**

```bash
git clone https://github.com/EemanAsghar/BugCost.git
cd BugCost
npm install
cp .env.local.example .env.local
```

Open `.env.local` and add:

```bash
# Clerk — https://clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Anthropic — https://console.anthropic.com
# Optional. Falls back to pre-written analysis if absent.
ANTHROPIC_API_KEY=sk-ant-...
```

```bash
npm run dev -- --port 3001
# → http://localhost:3001
```

The `/demo` route works without any credentials or sign-in.

<br />

**Connect your production data**

```bash
# Register sources with Coral
SENTRY_TOKEN=sntrys_...  SENTRY_ORG=your-org   coral source add sentry
GITHUB_TOKEN=ghp_...                            coral source add github
STRIPE_API_KEY=sk_live_...                      coral source add stripe

coral source list   # verify
```

Sign up at `/auth`, enter your credentials in the onboarding flow, and the dashboard will query your real production data.

<br />

---

<br />

## Coral integration

BugCost integrates Coral at two levels.

**CLI subprocess** — every investigation runs a real query:

```typescript
// lib/coral.ts
const proc = spawn("coral", ["sql", "--format", "json", query]);
```

If Coral credentials are absent, the app falls back to local JSONL fixtures and displays a `DEMO MODE` badge.

**Schema-verified columns** — column names were discovered via live introspection, not assumed or guessed:

```sql
SELECT column_name
FROM   information_schema.columns
WHERE  table_schema = 'sentry'
AND    table_name   = 'issues';
```

| Source | Table | Columns |
|---|---|---|
| Sentry | `sentry.issues` | `id`, `title`, `level`, `first_seen`, `count`, `project` |
| GitHub | `github.commits` | `sha`, `author__login`, `commit__message`, `commit__author__date` |
| Stripe | `stripe.charges` | `id`, `amount`, `status`, `created` |

<br />

---

<br />

## Project structure

```
bugcost/
├── app/
│   ├── page.tsx              # Landing — live revenue counter, SQL explainer
│   ├── auth/                 # Clerk sign-in / sign-up
│   ├── onboarding/           # Connect Sentry, GitHub, Stripe credentials
│   ├── dashboard/            # Investigation workspace (requires auth)
│   ├── demo/                 # Public demo, no login needed
│   └── api/
│       ├── investigate/      # GET: demo  |  POST: real credentials
│       ├── bug/[id]/         # Bug detail + timeline data
│       └── summarize/        # Claude root cause endpoint
│
├── lib/
│   ├── coral.ts              # Coral subprocess + demo fallback
│   ├── coralQuery.ts         # JOIN engine over JSONL fixtures
│   ├── realQuery.ts          # JOIN engine over live APIs
│   └── mockSlack.ts          # Incident Slack threads per bug
│
└── data/
    ├── sentry_issues.jsonl   # 8 crafted fatal errors
    ├── github_commits.jsonl  # 15 commits with matched timestamps
    └── stripe_charges.jsonl  # 734 charges, 280 correlated failures
```

<br />

---

<br />

## Why not just call the APIs directly?

You could. Here's what that looks like:

| | Without Coral | With Coral |
|---|---|---|
| Data access | 3 separate API clients | 1 SQL query |
| Schema normalization | hand-written per source | handled by Coral |
| Correlation logic | manual timestamp math | `JOIN ... ON` |
| LLM input | raw JSON blobs | clean typed rows |
| Result confidence | estimated | exact |
| Time to answer | ~45 minutes manual | ~9 seconds automated |

The cross-source JOIN is not a convenience. It's the only way to produce an exact, verifiable revenue-per-bug figure.

<br />

---

<br />

## Contributing

Pull requests are welcome. For significant changes, open an issue first.

```bash
git checkout -b feature/your-feature
npm run dev -- --port 3001
# make changes, test at /demo
git commit -m "feat: describe your change"
git push origin feature/your-feature
```

<br />

---

<br />

<div align="center">

MIT License © 2026 [Eeman Asghar](https://github.com/EemanAsghar)

<br />

Built with [Coral](https://github.com/withcoral) · [Claude](https://anthropic.com) · [Next.js](https://nextjs.org)

</div>
