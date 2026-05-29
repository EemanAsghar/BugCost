<div align="center">

# BugCost

**Which git commit is costing you money right now?**

BugCost answers that question in under 10 seconds by joining Sentry errors, GitHub commits, and Stripe payment failures across a single Coral SQL query — then running Claude over the results to confirm root cause and quantify revenue impact.

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Powered by Coral](https://img.shields.io/badge/Coral-SQL-ff9f0a?style=flat-square)](https://github.com/withcoral)
[![Claude AI](https://img.shields.io/badge/Claude-Haiku-bf5af2?style=flat-square)](https://anthropic.com)

[Live Demo](https://bugcost.vercel.app/demo) · [Sign In](https://bugcost.vercel.app/auth)

*Pirates of the Coral Bean Hackathon · Track 1: Enterprise Agent · May 2026*

</div>

---

## The Problem

Production incidents produce three separate signals in three separate tools:

- **Sentry** tells you an error is happening
- **GitHub** tells you what changed
- **Stripe** tells you revenue is dropping

No tool connects them. Engineers manually correlate timestamps across three dashboards, estimate impact in their heads, and file an incident report 45 minutes later with a number they're not confident in.

BugCost makes this a single query.

---

## How It Works

```sql
SELECT
  s.title                                     AS bug,
  g.author__login                             AS introduced_by,
  g.commit__message                           AS commit,
  COUNT(p.id)                                 AS failed_payments,
  CAST(SUM(CAST(p.amount AS DOUBLE)) / 100.0
       AS DOUBLE)                             AS revenue_lost_usd

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

This query is the entire product. It cannot be written without Coral.

The result — clean, typed, correlated rows — goes directly to Claude Haiku, which confirms root cause and assigns a confidence score. No raw JSON. No hallucinated numbers. No prompt engineering gymnastics.

---

## Result

```
bug                       introduced_by   failed_payments   revenue_lost_usd
────────────────────────  ─────────────   ───────────────   ────────────────
TypeError: price undef    @sarah-chen              280             $8,400
PaymentIntentError        @mike-torres              94             $3,200
SessionExpiredError       @alex-kim                 51             $1,800
```

Three sources. One query. Nine seconds.

---

## Architecture

```
Sentry        GitHub        Stripe
  │              │              │
  └──────────────┴──────────────┘
                 │
         coral sql (JOIN)
                 │
        Claude Haiku (root cause)
                 │
         BugCost dashboard
```

**Data flow:**

1. Next.js API route spawns `coral sql --format json` as a subprocess
2. Coral federates the query across live Sentry, GitHub, and Stripe APIs
3. The response — typed rows, not raw JSON — is passed directly to Claude
4. Claude returns a root cause summary and confidence score
5. The dashboard renders ranked bugs by revenue impact with full investigation timeline

Coral handles auth, pagination, and schema normalization for all three sources. The application contains zero ETL code.

---

## Stack

| Layer | Technology |
|---|---|
| Query federation | Coral CLI |
| AI analysis | Claude Haiku (Anthropic) |
| Frontend | Next.js 16 App Router |
| Auth | Clerk (GitHub OAuth, Google, email) |
| Charts | Recharts |
| Animations | Framer Motion |
| Deployment | Vercel |

---

## Getting Started

**Prerequisites**

```bash
brew install withcoral/tap/coral
coral --version  # 0.4.1+
node --version   # 18+
```

**Install**

```bash
git clone https://github.com/EemanAsghar/BugCost.git
cd BugCost
npm install
cp .env.local.example .env.local
```

**Configure** `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
ANTHROPIC_API_KEY=sk-ant-...          # optional — falls back to pre-written analysis
```

**Run**

```bash
npm run dev -- --port 3001
```

Open [http://localhost:3001](http://localhost:3001). The `/demo` route works without credentials.

**Connect live data sources** (optional)

```bash
SENTRY_TOKEN=sntrys_...  SENTRY_ORG=your-org  coral source add sentry
GITHUB_TOKEN=ghp_...                           coral source add github
STRIPE_API_KEY=sk_live_...                     coral source add stripe
```

Sign up at `/auth`, enter your credentials in onboarding, and the dashboard switches from demo data to your real production environment.

---

## Coral Integration

BugCost uses Coral at two levels.

**CLI subprocess** — every investigation request runs a real `coral sql` command:

```typescript
// lib/coral.ts
const proc = spawn("coral", ["sql", "--format", "json", query]);
```

If Coral credentials are absent, the app falls back to local JSONL fixtures and shows a `DEMO MODE` badge.

**Schema-verified column names** — column names were discovered via live introspection, not assumed:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'sentry' AND table_name = 'issues';
```

| Source | Table | Columns used |
|---|---|---|
| Sentry | `sentry.issues` | `id`, `title`, `level`, `first_seen`, `count`, `project` |
| GitHub | `github.commits` | `sha`, `author__login`, `commit__message`, `commit__author__date` |
| Stripe | `stripe.charges` | `id`, `amount`, `status`, `created` |

---

## Project Structure

```
bugcost/
├── app/
│   ├── page.tsx              # Landing — live revenue counter
│   ├── auth/                 # Clerk authentication
│   ├── onboarding/           # Connect Sentry, GitHub, Stripe credentials
│   ├── dashboard/            # Investigation workspace (authenticated)
│   ├── demo/                 # Public demo, no login required
│   └── api/
│       ├── investigate/      # GET: demo data  |  POST: real credentials
│       ├── bug/[id]/         # Bug detail and timeline
│       └── summarize/        # Claude root cause analysis
│
├── lib/
│   ├── coral.ts              # Coral CLI subprocess + demo fallback
│   ├── coralQuery.ts         # JOIN engine over local JSONL fixtures
│   ├── realQuery.ts          # JOIN engine over live APIs
│   └── mockSlack.ts          # Incident Slack threads per bug
│
└── data/
    ├── sentry_issues.jsonl   # 8 fatal errors
    ├── github_commits.jsonl  # 15 commits with matching timestamps
    └── stripe_charges.jsonl  # 734 charges, 280 correlated failures
```

---

## Hackathon Submission

**Pirates of the Coral Bean · WeMakeDevs · May 25–31, 2026 · Track 1: Enterprise Agent**

| Criterion | BugCost |
|---|---|
| **Impact** | Every SaaS company has this problem. Revenue-per-bug is a number that today requires a 45-minute manual investigation. BugCost makes it a 9-second query. |
| **Originality** | Revenue impact only exists at the intersection of three separate APIs. This fact cannot be computed without cross-source federation — which is exactly what Coral provides. |
| **Technical depth** | Real `coral sql` subprocess, schema verified via live introspection, Claude analysis on structured query output, full per-user credential management. |
| **Use of Coral** | Remove Coral and the product collapses to three separate API calls with no join. The cross-source SQL is not a feature — it is the product. |

---

## License

MIT © 2026 Eeman Asghar
