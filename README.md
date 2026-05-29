<div align="center">

<br />

```
██████╗ ██╗   ██╗ ██████╗  ██████╗ ██████╗ ███████╗████████╗
██╔══██╗██║   ██║██╔════╝ ██╔════╝██╔═══██╗██╔════╝╚══██╔══╝
██████╔╝██║   ██║██║  ███╗██║     ██║   ██║███████╗   ██║   
██╔══██╗██║   ██║██║   ██║██║     ██║   ██║╚════██║   ██║   
██████╔╝╚██████╔╝╚██████╔╝╚██████╗╚██████╔╝███████║   ██║   
╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝   ╚═╝   
```

### Every bug has a price. Now you can see it.

<br />

[![Demo](https://img.shields.io/badge/🌐%20Live%20Demo-bugcost.vercel.app-ff9f0a?style=for-the-badge)](https://bugcost.vercel.app/demo)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Coral SQL](https://img.shields.io/badge/Coral-SQL-ff9f0a?style=flat-square)](https://github.com/withcoral)
[![Claude AI](https://img.shields.io/badge/Claude-Haiku-bf5af2?style=flat-square)](https://anthropic.com)
[![License](https://img.shields.io/badge/License-MIT-30d158?style=flat-square)](LICENSE)

<br />

</div>

---

<br />

## 😤 The Problem

Your checkout just broke. You have three tabs open and zero answers.

<div align="center">

| | What you see | What you don't know |
|:---:|---|---|
| 🔴 **Sentry** | "TypeError in checkout" | How bad is this? |
| 💳 **Stripe** | "Revenue dropped 40%" | Which bug caused it? |
| 🐙 **GitHub** | "PR #142 merged today" | Did this cause it? |

</div>

<br />

An engineer manually correlates timestamps across all three. 45 minutes later — *maybe* — you have a number.

**BugCost gives you that number in 9 seconds.**

<br />

---

<br />

## ✅ The Answer

<div align="center">

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/68f71a2e-a79c-4a51-a208-7bdc7703c4ac" />


</div>

<br />

---

<br />

## 🎬 How It Works

<div align="center">

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/503fc802-ae08-4391-9ce9-2ed4e76542dc" />

</div>

BugCost joins your three data sources with a **single SQL query** using [Coral](https://github.com/withcoral) — no ETL, no data pipeline, no ingestion. The result goes straight to Claude, which confirms root cause and assigns a confidence score. The whole thing runs in under 10 seconds.

<br />

---

<br />

## ⚡ The Query That Makes It Possible

This is the entire product — one SQL statement joining three live APIs:

```sql
SELECT
  s.title           AS bug,
  g.author__login   AS introduced_by,
  COUNT(p.id)       AS failed_payments,
  SUM(p.amount)/100 AS revenue_lost_usd

FROM   sentry.issues  s
JOIN   github.commits g  ON  g.committed  BETWEEN  s.first_seen - 2h  AND  s.first_seen
JOIN   stripe.charges p  ON  p.created   >=  s.first_seen  AND  p.status = 'failed'

WHERE  s.level = 'fatal'
ORDER  BY revenue_lost_usd DESC;
```

> Without Coral, this query cannot exist. Sentry, GitHub, and Stripe have different APIs, different schemas, and no shared keys. Coral federates them into a single SQL namespace.

<br />

---

<br />

## 🖥️ The Dashboard

<div align="center">
<img width="1440" height="765" alt="image" src="https://github.com/user-attachments/assets/989c9be9-cf5e-4a26-aaec-26a063f7ce25" />

</div>

**Three-panel workspace:**

- 🔴 **Bug list** — ranked by revenue lost, updated live
- 📈 **Timeline** — deploy events overlaid with error spikes and payment failures  
- 🤖 **AI feed** — Claude's reasoning, step by step, in real time

<br />

---

<br />

## ✨ Features

- 🪸 **Coral-powered cross-source join** — Sentry × GitHub × Stripe in one SQL query
- 🤖 **AI root cause analysis** — Claude gets clean rows, not raw JSON, so results are exact
- 💰 **Revenue-per-bug ranking** — every incident has a precise dollar amount attached
- ⚡ **9-second investigation** — from symptom to cause to dollar impact
- 🔐 **Per-user credential isolation** — your API keys stay in your browser, never on our server
- 🎭 **Live + demo modes** — try it instantly, connect real data when ready
- 🎨 **Cinematic timeline** — animated incident playback with deploy markers and impact zones

<br />

---

<br />

## 🛠️ Stack

<div align="center">

| | Technology | Role |
|:---:|---|---|
| 🪸 | **Coral CLI** | Cross-source SQL federation — the engine everything runs on |
| 🤖 | **Claude Haiku** | Root cause analysis on structured query output |
| ⚡ | **Next.js 16** | App Router, API Routes, server-side rendering |
| 🔐 | **Clerk** | Auth — GitHub OAuth, Google, email/password |
| 📊 | **Recharts** | Incident timeline charts |
| 🎨 | **Framer Motion** | Investigation flow animations |
| 🚀 | **Vercel** | Deployment |

</div>

<br />

---

<br />

## 🚀 Getting Started

**1. Install Coral**

```bash
brew install withcoral/tap/coral
```

**2. Clone and install**

```bash
git clone https://github.com/EemanAsghar/BugCost.git
cd BugCost && npm install
cp .env.local.example .env.local
```

**3. Add your keys to `.env.local`**

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
ANTHROPIC_API_KEY=sk-ant-...    # optional
```

**4. Run**

```bash
npm run dev -- --port 3001
```

> Try it immediately at [`/demo`](http://localhost:3001/demo) — no login, no API keys needed.

<br />

**Connect your real production data:**

```bash
SENTRY_TOKEN=sntrys_...   SENTRY_ORG=your-org   coral source add sentry
GITHUB_TOKEN=ghp_...                             coral source add github
STRIPE_API_KEY=sk_live_...                       coral source add stripe
```

Sign up at `/auth` → enter credentials in onboarding → your live bugs appear ranked by revenue.

<br />

---

<br />

<div align="center">

Built with ❤️ using **[Coral](https://github.com/withcoral)** · **[Claude](https://anthropic.com)** · **[Next.js](https://nextjs.org)**

MIT © 2026 [Eeman Asghar](https://github.com/EemanAsghar)

<br />

*Pirates of the Coral Bean Hackathon · May 2026*

</div>
