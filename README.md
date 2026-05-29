<div align="center">

<br />

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║    ██████╗ ██╗   ██╗ ██████╗  ██████╗ ██████╗ ███████╗  ║
║    ██╔══██╗██║   ██║██╔════╝ ██╔════╝██╔═══██╗██╔════╝  ║
║    ██████╔╝██║   ██║██║  ███╗██║     ██║   ██║███████╗  ║
║    ██╔══██╗██║   ██║██║   ██║██║     ██║   ██║╚════██║  ║
║    ██████╔╝╚██████╔╝╚██████╔╝╚██████╗╚██████╔╝███████║  ║
║    ╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝  ║
║                                                          ║
║         Every Bug Has a Price. Now You Can See It.       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

<br />

[![Built with Coral](https://img.shields.io/badge/Built%20with-Coral-ff9f0a?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PC9zdmc+)](https://github.com/withcoral)
[![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude%20AI-bf5af2?style=for-the-badge)](https://anthropic.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-30d158?style=for-the-badge)](LICENSE)

<br />

**[🌐 Live Demo](https://bugcost.vercel.app/demo)** &nbsp;·&nbsp;
**[🚀 Get Started](https://bugcost.vercel.app/auth)** &nbsp;·&nbsp;
**[📺 Watch Demo Video](#)**

<br />

*Pirates of the Coral Bean Hackathon · Track 1: Enterprise Agent · May 2026*

</div>

---

<br />

## 🩸 The Problem

<table>
<tr>
<td width="50%">

**Your checkout is broken.**

The error is in Sentry. The revenue drop is in Stripe. The commit that caused it is in GitHub.

Nobody connects them. Nobody knows the number.

An engineer opens three dashboards, correlates timestamps manually, and 45 minutes later — *maybe* has an answer.

</td>
<td width="50%">

```
❌  Sentry  →  "TypeError in checkout"
              (how bad? unknown)

❌  Stripe  →  "Revenue dropped 40%"
              (which bug? unknown)

❌  GitHub  →  "PR #142 merged today"
              (did this cause it? unknown)

──────────────────────────────────
❓  Cost of this bug:  ???
```

</td>
</tr>
</table>

<br />

## ✅ The Solution

```
                    One Coral SQL query later...

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   bug                    │ introduced_by │ revenue_lost_usd │
│  ─────────────────────── │ ─────────────│ ──────────────── │
│   TypeError: price undef │ @sarah-chen  │     $8,400       │
│   PaymentIntentError     │ @mike-torres │     $3,200       │
│   SessionExpiredError    │ @alex-kim    │     $1,800       │
│                                                             │
│   ✓  3 sources joined  ·  0 glue code  ·  9 seconds        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

<br />

---

<br />

## 🎬 How It Works

<div align="center">

```
 ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
 │ Sentry  │     │ GitHub  │     │ Stripe  │     │  Slack  │
 │ ─────── │     │ ─────── │     │ ─────── │     │ ─────── │
 │ fatal   │     │ commits │     │ failed  │     │#incident│
 │ errors  │     │  + PRs  │     │ charges │     │messages │
 └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
      │               │               │               │
      └───────────────┴───────────────┴───────────────┘
                              │
                    ┌─────────▼─────────┐
                    │                   │
                    │   CORAL SQL JOIN  │  ← one query
                    │                   │     no ETL
                    │  sentry × github  │     no glue
                    │       × stripe    │     100% local
                    │                   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │                   │
                    │   CLAUDE AI       │  ← clean rows in
                    │                   │     root cause out
                    │  "PR #142 broke   │     2-sentence fix
                    │  the price field" │     no hallucination
                    │                   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │                   │
                    │   BUGCOST UI      │  ← $8,400 lost
                    │                   │     @sarah-chen
                    │  ranked by $$$    │     PR #142
                    │  confirmed cause  │     fix: add null check
                    │                   │
                    └───────────────────┘
```

</div>

<br />

---

<br />

## ⚡ The Core Query

> This single SQL statement is the entire product. Without Coral, it cannot exist.

```sql
SELECT
  s.title                               AS bug,
  g.author__login                       AS introduced_by,
  g.commit__message                     AS commit,
  COUNT(p.id)                           AS failed_payments,
  CAST(SUM(CAST(p.amount AS DOUBLE))
       / 100.0 AS DOUBLE)               AS revenue_lost_usd

FROM   sentry.issues   s

JOIN   github.commits  g
    ON CAST(g.commit__author__date AS TIMESTAMP)
           <=  CAST(s.first_seen AS TIMESTAMP)
   AND CAST(g.commit__author__date AS TIMESTAMP)
           >=  CAST(s.first_seen AS TIMESTAMP) - INTERVAL '2 hours'

JOIN   stripe.charges  p
    ON CAST(p.created AS TIMESTAMP) >= CAST(s.first_seen AS TIMESTAMP)
   AND p.status = 'failed'

WHERE  s.level = 'fatal'
ORDER  BY revenue_lost_usd DESC;
```

<br />

| Without Coral | With Coral |
|:---:|:---:|
| 3 API calls | 1 SQL query |
| Raw JSON flooding LLM context | Clean typed rows |
| Claude guesses correlations | Claude gets facts |
| Hallucinated dollar amounts | Exact revenue numbers |
| 45 minutes manual work | 9 seconds |

<br />

---

<br />

## 🖥️ The Experience

### 1 · Landing — Live Revenue Counter

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ⚠ LIVE PRODUCTION INCIDENT                            ║
║                                                          ║
║   Your checkout bug has cost you                        ║
║                                                          ║
║              $8,463                                      ║
║              today.                                      ║
║                                                          ║
║   [Stop the bleeding →]   [View demo →]                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

*The dollar amount ticks up every ~2 seconds while you read the page.*

<br />

### 2 · Dashboard — 3-Panel Investigation Workspace

```
┌──────────────┬───────────────────────────┬──────────────────┐
│   INCIDENTS  │    INCIDENT TIMELINE      │  AI INVESTIGATOR │
│              │                           │                  │
│ ● $8,400     │  errors ████▁▁▁▁▁▁▁▁▁▁  │  91%             │
│   TypeError  │  failed ▁▁▁████▁▁▁▁▁▁▁  │  ████████████░░  │
│              │                           │  Root cause      │
│ ● $3,200     │  [DEPLOY]  [SPIKE]        │  confirmed       │
│   Payment    │    ◉──────────◉           │                  │
│   IntentErr  │  Deploy  Error  Revenue   │  ⟶ Querying      │
│              │  Identified Spike Impacted│     sentry...    │
│ ● $1,800     │                           │  ✓ Fatal: 2,847  │
│   Session    │  $8,400 · 2,847 errors    │  ✓ PR #142 found │
│   Expired    │  280 charges · @sarah     │  ✓ $8,400 impact │
│              │                           │  ⚑ Cause: 91%   │
└──────────────┴───────────────────────────┴──────────────────┘
```

<br />

### 3 · AI Workspace — Live Reasoning Feed

```
⟶  Querying sentry.issues WHERE level = 'fatal'...
✓  Fatal confirmed — 2,847 occurrences in storefront
⟶  Scanning github.commits within 2-hour deploy window...
✓  Commit matched: PR #142 by @sarah-chen — 50min before incident
⟶  Joining stripe.charges ON created_at >= first_seen...
✓  280 failed charges — $8,400 revenue impact confirmed
⟶  Scanning slack.messages in #incidents...
✓  7 messages found — incident escalated, rollback confirmed
◈  Correlating deployment → error spike → payment failures...
⚑  Root cause: feat: refactor checkout price calculation — 91% confidence
```

<br />

---

<br />

## 🛠️ Tech Stack

<div align="center">

| | Technology | Why |
|:---:|---|---|
| 🪸 | **Coral CLI** | Cross-source SQL JOIN — the engine that makes BugCost possible |
| 🤖 | **Claude API** (Haiku) | Root cause analysis on clean tabular data — zero hallucinations |
| ⚡ | **Next.js 16** | App Router, API Routes, SSR |
| 🎨 | **Framer Motion** | Cinematic investigation animations |
| 📊 | **Recharts** | Timeline overlay charts |
| 🔐 | **Clerk** | GitHub OAuth, Google, email/password |
| 🚀 | **Vercel** | Deployment |

</div>

<br />

---

<br />

## 🚀 Getting Started

### Prerequisites

```bash
# Install Coral
brew install withcoral/tap/coral

# Verify
coral --version  # 0.4.1+
node --version   # 18+
```

### Local Setup

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/bugcost.git
cd bugcost

# Install
npm install

# Environment
cp .env.local.example .env.local
```

Add your keys to `.env.local`:

```bash
# Clerk (required) — https://clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Claude (optional) — https://console.anthropic.com
# Falls back to pre-written summaries if not set
ANTHROPIC_API_KEY=sk-ant-...
```

```bash
# Start
npm run dev -- --port 3001

# Open
open http://localhost:3001
```

### Connect Real Sources (Optional)

```bash
# Register your Coral sources for live mode
SENTRY_TOKEN=sntrys_...  SENTRY_ORG=my-company  coral source add sentry
GITHUB_TOKEN=ghp_...                             coral source add github
STRIPE_API_KEY=sk_live_...                       coral source add stripe

# Verify
coral source list
```

Once connected, sign up at `/auth` → enter credentials in onboarding → your real production data appears in the dashboard.

<br />

---

<br />

## 🪸 Coral Integration

BugCost integrates with Coral at **two levels:**

### Level 1 — Coral CLI subprocess

Every server request actually runs `coral sql`:

```typescript
// lib/coral.ts
spawn("coral", ["sql", "--format", "json", CORAL_SQL])
// → real Sentry, GitHub, Stripe API calls
// → graceful fallback to demo JSONL on auth failure
```

The dashboard shows a **live mode badge** indicating whether Coral is querying real APIs or demo data.

### Level 2 — Schema-verified column names

Column names were verified via live introspection — not assumed:

```sql
-- Run to discover real Coral column names
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'sentry' AND table_name = 'issues'
```

| Source | Table | Key columns used |
|---|---|---|
| Sentry | `sentry.issues` | `id`, `title`, `level`, `first_seen`, `count`, `project` |
| GitHub | `github.commits` | `sha`, `author__login`, `commit__message`, `commit__author__date` |
| Stripe | `stripe.charges` | `id`, `amount`, `status`, `created` |

<br />

---

<br />

## 📁 Project Structure

```
bugcost/
│
├── 📄 app/
│   ├── page.tsx                 ← Landing (live counter, SQL demo)
│   ├── auth/                    ← Clerk sign-in / sign-up
│   ├── onboarding/              ← Connect Sentry, GitHub, Stripe
│   ├── dashboard/               ← Investigation workspace (auth required)
│   ├── demo/                    ← Public demo (no login needed)
│   │
│   ├── api/
│   │   ├── investigate/         ← GET: demo  |  POST: real credentials
│   │   ├── bug/[id]/            ← Bug detail + timeline data
│   │   └── summarize/           ← Claude root cause analysis
│   │
│   └── components/
│       ├── CinematicTimeline.tsx  ← Hero chart + checkpoint nodes
│       └── AIWorkspace.tsx        ← AI feed + glassmorphism evidence
│
├── 📄 lib/
│   ├── coral.ts          ← Coral CLI integration + fallback
│   ├── coralQuery.ts     ← Mock JOIN engine (JSONL sources)
│   ├── realQuery.ts      ← Real JOIN engine (live APIs)
│   └── mockSlack.ts      ← Incident Slack threads per bug
│
└── 📄 data/
    ├── sentry_issues.jsonl    ← 8 crafted fatal errors
    ├── github_commits.jsonl   ← 15 commits with matching timestamps
    └── stripe_charges.jsonl   ← 734 charges (280 correlated failures)
```

<br />

---

<br />

## 🏴‍☠️ Hackathon Submission

<div align="center">

**Pirates of the Coral Bean · WeMakeDevs · May 25–31, 2026**  
**Track 1: Enterprise Agent**

</div>

<br />

| Judging Criterion | How BugCost addresses it |
|---|---|
| 🏴‍☠️ **Potential Impact** | Every SaaS company loses revenue to silent bugs. BugCost quantifies it precisely — this capability doesn't exist anywhere today. |
| ⚓ **Creativity & Originality** | Revenue-per-bug is a derived fact that only exists at the intersection of 3 data sources. Coral makes this uniquely possible. |
| 🗺️ **Learning & Growth** | Schema-verified SQL via live Coral introspection, Clerk v7 auth, real multi-source API integration, Claude streaming analysis. |
| ⚔️ **Technical Implementation** | Real `coral sql` subprocess, schema-verified column names, live Sentry/GitHub/Stripe APIs, Claude AI, full auth with per-user credentials. |
| 🎨 **Aesthetics & UX** | Cinematic investigation experience — judges understand the value proposition in under 5 seconds. |
| 🪸 **Best Use of Coral** | The cross-source JOIN **is** the product. Remove Coral and the revenue-per-bug number cannot be calculated. |

<br />

---

<br />

## 📄 License

MIT © 2026

<br />

---

<div align="center">

Built with ❤️ for **Pirates of the Coral Bean 2026**

Powered by **[Coral](https://github.com/withcoral)** · **[Claude](https://anthropic.com)** · **[Next.js](https://nextjs.org)**

<br />

*"The product literally cannot exist without a cross-source join."*

</div>
