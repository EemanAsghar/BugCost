"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, CheckCircle2, Zap, GitCommit, DollarSign, AlertTriangle, Database, Brain } from "lucide-react";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

// ─── live counter ─────────────────────────────────────────────────────────────
function useLiveCounter(start: number) {
  const [value, setValue] = useState(start);
  useEffect(() => {
    const tick = () => {
      setValue((v) => v + Math.floor(Math.random() * 48 + 12));
      setTimeout(tick, Math.random() * 2200 + 1000);
    };
    const t = setTimeout(tick, 1800);
    return () => clearTimeout(t);
  }, []);
  return value;
}

// ─── typewriter ───────────────────────────────────────────────────────────────
function Typewriter({ lines, startDelay = 0 }: { lines: string[]; startDelay?: number }) {
  const [started, setStarted] = useState(false);
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [cur, setCur] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  useEffect(() => {
    if (!started || cur >= lines.length) return;
    if (charIdx < lines[cur].length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), 24);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setDisplayed((d) => [...d, lines[cur]]);
      setCur((c) => c + 1);
      setCharIdx(0);
    }, 420);
    return () => clearTimeout(t);
  }, [started, cur, charIdx, lines]);

  const currentLine = cur < lines.length ? lines[cur].slice(0, charIdx) : "";
  const colorFor = (line: string) =>
    line.startsWith("✓") ? "var(--green)" : line.startsWith("⟶") ? "var(--text-muted)" : "#8899bb";

  return (
    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, lineHeight: 1.9 }}>
      {displayed.map((line, i) => (
        <div key={i} style={{ color: colorFor(line) }}>{line}</div>
      ))}
      {cur < lines.length && started && (
        <div style={{ color: colorFor(lines[cur]) }}>
          {currentLine}
          <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>▊</motion.span>
        </div>
      )}
    </div>
  );
}

// ─── data ─────────────────────────────────────────────────────────────────────
const AI_LINES = [
  "⟶ Querying sentry.issues WHERE level = 'fatal'...",
  "✓ Fatal: 2,847 occurrences in storefront",
  "⟶ Joining github.commits within 2-hour window...",
  "✓ Commit matched: PR #142 by @sarah-chen",
  "⟶ Joining stripe.charges ON status = 'failed'...",
  "✓ 280 failed charges — $8,400 impact confirmed",
  "⟶ Sending results to Claude for root cause analysis...",
  "✓ Root cause identified with 91% confidence",
];

const CORAL_SQL = `SELECT s.title, g.author__login AS introduced_by,
       COUNT(p.id)           AS failed_payments,
       SUM(p.amount) / 100.0 AS revenue_lost_usd
FROM   sentry.issues   s
JOIN   github.commits  g
    ON g.commit__author__date <= s.first_seen
   AND g.commit__author__date >= s.first_seen
                            - INTERVAL '2 hours'
JOIN   stripe.charges  p
    ON p.created >= s.first_seen
   AND p.status  = 'failed'
WHERE  s.level = 'fatal'
ORDER  BY revenue_lost_usd DESC;`;

const SQL_RESULT = [
  { bug: "TypeError: price undefined",  by: "@sarah-chen",  lost: "$8,400", pr: "PR #142" },
  { bug: "PaymentIntentCreationError",  by: "@mike-torres",  lost: "$3,200", pr: "PR #167" },
  { bug: "SessionExpiredError",          by: "@alex-kim",    lost: "$1,800", pr: "PR #189" },
];

const FEATURES = [
  { icon: Database,      color: "#0a84ff",  title: "Cross-source SQL JOIN", desc: "Coral JOINs Sentry, GitHub, and Stripe before the AI sees any data. No hallucinations. Exact revenue numbers." },
  { icon: Brain,         color: "#bf5af2",  title: "Claude AI summaries",   desc: "Claude analyzes each incident and generates a 2-sentence technical root cause + an actionable fix recommendation." },
  { icon: DollarSign,    color: "#ff3b5c",  title: "Revenue per bug",       desc: "The exact dollar amount each bug cost your business — a number that doesn't exist in any single dashboard today." },
  { icon: GitCommit,     color: "#30d158",  title: "Commit-level blame",    desc: "Identifies the exact PR and author responsible. Cross-references the deployment window with the error spike." },
  { icon: Zap,           color: "#ff9f0a",  title: "9-second investigation",desc: "What takes an engineer 45 minutes of manual correlation takes BugCost 9 seconds. Automatically." },
  { icon: AlertTriangle, color: "#4dabf7",  title: "Prioritise by impact",  desc: "Sort by revenue lost, not error count. Fix the $8,400 bug before the $40 bug. Every time." },
];

const STEPS = [
  {
    n: "01",
    title: "Connect in 3 minutes",
    desc: "Paste your Sentry auth token, GitHub personal access token, and Stripe secret key. Coral registers each source locally — no data leaves your machine.",
    detail: "SENTRY_TOKEN · GITHUB_TOKEN · STRIPE_API_KEY",
    color: "#0a84ff",
  },
  {
    n: "02",
    title: "Coral runs the JOIN",
    desc: "One SQL query cross-joins fatal errors, deployment commits, and failed charges. Coral handles auth, pagination, and rate limits — your agent just reads the result.",
    detail: "sentry.issues × github.commits × stripe.charges",
    color: "#ff9f0a",
  },
  {
    n: "03",
    title: "Claude investigates",
    desc: "The clean tabular result goes to Claude. With no raw JSON to hallucinate over, Claude generates a precise root cause and actionable fix in under 2 seconds.",
    detail: "91% confidence · 2-sentence summary · fix recommendation",
    color: "#bf5af2",
  },
  {
    n: "04",
    title: "You fix faster",
    desc: "Open BugCost, see which bug cost the most revenue, click it, read the AI verdict, and act. No tabs. No guesswork. No 45-minute investigation sessions.",
    detail: "$8,400 bug identified · fix shipped · revenue recovered",
    color: "#30d158",
  },
];


const TECH_STACK = [
  { name: "Coral",    role: "Cross-source SQL JOIN engine",         color: "#ff9f0a", desc: "Queries Sentry, GitHub and Stripe simultaneously. Handles auth, rate limits, pagination. 100% local." },
  { name: "Claude",   role: "AI root cause analysis",               color: "#bf5af2", desc: "Receives clean tabular data from Coral. Generates precise technical summaries and fix recommendations." },
  { name: "Sentry",   role: "Fatal error events + timestamps",      color: "#e03c31", desc: "Provides incident ID, error title, first_seen timestamp, and occurrence count." },
  { name: "GitHub",   role: "Deployment commits + authors",         color: "#4dabf7", desc: "Identifies commits made within 2 hours before each incident. Maps to PR and author." },
  { name: "Stripe",   role: "Failed charges + revenue impact",      color: "#635bff", desc: "Counts failed payments after each incident start. Calculates exact dollar revenue lost." },
];

// ─── navbar ───────────────────────────────────────────────────────────────────
function NavBar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      height: 54, display: "flex", alignItems: "center", padding: "0 32px", gap: 32,
      background: scrolled ? "rgba(3,3,8,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : undefined,
      borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
      transition: "all 0.3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, cursor: "pointer" }}>
        <img src="/BugCost-logo.png" alt="BugCost" style={{ height: 72, width: 72, objectFit: "contain" }} />
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        {["How it works", "Technology", "Features"].map((l) => (
          <span key={l} style={{ fontSize: 13, color: "var(--text-muted)", cursor: "pointer", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >{l}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Show when="signed-out">
          <SignInButton mode="redirect">
            <button style={{ fontSize: 12, color: "var(--text-muted)", padding: "6px 14px", borderRadius: 7, cursor: "pointer", background: "transparent", border: "none" }}>
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="redirect">
            <button style={{ fontSize: 12, fontWeight: 700, color: "#fff", padding: "7px 16px", borderRadius: 7, cursor: "pointer", background: "var(--red)", border: "none" }}>
              Get started →
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <button onClick={() => router.push("/demo")}
            style={{ fontSize: 12, color: "var(--text-muted)", padding: "6px 14px", borderRadius: 7, cursor: "pointer", background: "transparent", border: "1px solid var(--border)" }}>
            Dashboard →
          </button>
          <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
        </Show>
      </div>
    </nav>
  );
}

// ─── section header ───────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--red)", marginBottom: 14, textAlign: "center" }}>
      {label}
    </p>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  const router = useRouter();
  const revenue = useLiveCounter(8400);
  const [sqlVisible, setSqlVisible] = useState(false);
  const go = () => router.push("/auth");

  useEffect(() => {
    const t = setTimeout(() => setSqlVisible(true), 700);
    return () => clearTimeout(t);
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", overflowX: "hidden" }}>
      <NavBar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(255,59,92,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,59,92,0.5), transparent)" }} />

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 99, background: "rgba(255,59,92,0.08)", border: "1px solid rgba(255,59,92,0.25)", marginBottom: 32 }}>
          <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Live production incident · Coral + Claude
          </span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ fontSize: "clamp(44px, 7vw, 82px)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.045em", textAlign: "center", marginBottom: 28 }}>
          Your checkout bug<br />has cost you{" "}
          <motion.span key={revenue} initial={{ opacity: 0.7 }} animate={{ opacity: 1 }} style={{ color: "var(--red)" }}>
            {fmt(revenue)}
          </motion.span>
          <br />
          <span style={{ color: "var(--text-muted)" }}>today.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ fontSize: 18, color: "var(--text-muted)", lineHeight: 1.75, maxWidth: 520, textAlign: "center", marginBottom: 44 }}>
          BugCost uses <strong style={{ color: "var(--text)" }}>Coral</strong> to JOIN Sentry, GitHub, and Stripe in one SQL query —
          then <strong style={{ color: "var(--text)" }}>Claude</strong> to identify the root cause and the fix.
          In 9 seconds.
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ display: "flex", gap: 10, marginBottom: 64 }}>
          <button onClick={go}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 800, color: "#fff", padding: "14px 28px", borderRadius: 10, cursor: "pointer", background: "var(--red)", border: "none", boxShadow: "0 0 36px rgba(255,59,92,0.4)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 0 48px rgba(255,59,92,0.55)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 0 36px rgba(255,59,92,0.4)"; }}>
            Stop the bleeding <ArrowRight size={15} />
          </button>
          <button onClick={() => router.push("/demo")}
            style={{ fontSize: 13, color: "var(--text-muted)", padding: "14px 20px", borderRadius: 10, cursor: "pointer", background: "transparent", border: "1px solid var(--border)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--border-bright)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
            View live demo →
          </button>
        </motion.div>

        {/* Hero demo panels */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: sqlVisible ? 1 : 0, y: sqlVisible ? 0 : 24 }} transition={{ duration: 0.7 }}
          style={{ width: "100%", maxWidth: 960, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

          {/* LEFT — live incident */}
          <div style={{ borderRadius: 14, overflow: "hidden", background: "var(--surface)", border: "1px solid rgba(255,59,92,0.2)", boxShadow: "0 0 40px rgba(255,59,92,0.07)" }}>
            <div style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6, background: "var(--surface-2)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)" }} />
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--orange)", display: "inline-block" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
              <span style={{ flex: 1, textAlign: "center", fontSize: 10, color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>bugcost — active investigation</span>
              <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                style={{ fontSize: 9, color: "var(--red)", fontWeight: 700 }}>● LIVE</motion.span>
            </div>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(255,59,92,0.15)", color: "var(--red)", fontWeight: 700, textTransform: "uppercase" }}>FATAL</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>SENTRY-001</span>
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>TypeError: Cannot read properties of undefined (reading &apos;price&apos;)</p>
                <p style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>checkout/payment.ts · 2,847 occurrences</p>
              </div>
              <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Revenue lost</p>
                <motion.div key={revenue} initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}
                  style={{ fontSize: 30, fontWeight: 900, color: "var(--red)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
                  {fmt(revenue)}
                </motion.div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>280 failed Stripe charges and counting</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Coral + Claude investigation</p>
                <Typewriter lines={AI_LINES} startDelay={1200} />
              </div>
            </div>
          </div>

          {/* RIGHT — SQL + result */}
          <div style={{ borderRadius: 14, overflow: "hidden", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            <div style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6, background: "var(--surface-2)" }}>
              {["#3a3a3a","#3a3a3a","#3a3a3a"].map((c,i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}
              <span style={{ flex: 1, textAlign: "center", fontSize: 10, color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>coral-query.sql</span>
            </div>
            <div style={{ padding: "16px 18px 10px" }}>
              <p style={{ fontSize: 9, color: "var(--blue-bright)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 700 }}>Coral SQL — 3 sources, 1 query</p>
              <pre style={{ fontSize: 11, color: "#6677aa", fontFamily: "ui-monospace, monospace", lineHeight: 1.75, margin: 0, overflowX: "auto" }}>{CORAL_SQL}</pre>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", padding: "10px 18px 16px" }}>
              <AnimatePresence>
                {sqlVisible ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                    <p style={{ fontSize: 9, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 700 }}>→ Result (3 rows · 0.4s)</p>
                    {SQL_RESULT.map((r, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.15 }}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: 7, background: i === 0 ? "rgba(255,59,92,0.07)" : "var(--surface-2)", border: `1px solid ${i === 0 ? "rgba(255,59,92,0.2)" : "var(--border)"}`, marginBottom: 5 }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 500 }}>{r.bug}</p>
                          <p style={{ fontSize: 10, color: "var(--blue-bright)" }}>{r.by} · {r.pr}</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--red)" }}>{r.lost}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.p animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>Running query...</motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 20 }}>No credit card. Connect in 3 minutes. 100% local — your data never leaves your machine.</p>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "20px 48px", display: "flex", justifyContent: "center", gap: 64, background: "var(--surface)" }}>
        {[
          { value: "$20,336", label: "avg monthly revenue lost to bugs" },
          { value: "9 sec",   label: "average investigation time" },
          { value: "3",       label: "data sources joined per query" },
          { value: "0",       label: "lines of glue code needed" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── THE PROBLEM ────────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 48px 80px", maxWidth: 820, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <SectionLabel label="The problem" />
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 28, lineHeight: 1.1 }}>
            Sentry tells you it crashed.<br />
            Stripe tells you revenue dropped.<br />
            GitHub has the commit.<br />
            <span style={{ color: "var(--text-muted)" }}>Nobody connects them.</span>
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.8, maxWidth: 580, marginBottom: 36 }}>
            Today, figuring out which bug costs the most money means opening 3 dashboards,
            manually correlating timestamps, and guessing. Most engineers never bother — the
            expensive bugs stay invisible for weeks while revenue bleeds silently.
          </p>
          {/* Before/after */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: "20px 22px", borderRadius: 12, background: "rgba(255,59,92,0.05)", border: "1px solid rgba(255,59,92,0.15)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Before BugCost</p>
              {["Open Sentry. Scroll through errors.", "Open Stripe. Look for revenue drops.", "Open GitHub. Search for recent commits.", "Manually match timestamps. Guess.", "Wait for the next oncall to confirm.", "45 minutes later — maybe an answer."].map((t) => (
                <div key={t} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 }}>
                  <span style={{ color: "var(--red)", flexShrink: 0, marginTop: 1 }}>✕</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "20px 22px", borderRadius: 12, background: "rgba(48,209,88,0.05)", border: "1px solid rgba(48,209,88,0.15)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>With BugCost</p>
              {["Open BugCost.", "See $8,400 bug at the top.", "Click it.", "Read Claude's root cause summary.", "Fix the commit.", "9 seconds total."].map((t) => (
                <div key={t} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 }}>
                  <CheckCircle2 size={13} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 48px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <SectionLabel label="How it works" />
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 900, letterSpacing: "-0.04em", textAlign: "center", marginBottom: 56 }}>
            Up and running in 3 minutes
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {STEPS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ padding: "24px 26px", borderRadius: 14, background: "var(--surface-2)", border: `1px solid ${s.color}22`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}00, ${s.color}80, ${s.color}00)` }} />
                <span style={{ fontSize: 11, fontFamily: "ui-monospace, monospace", color: s.color, fontWeight: 700, marginBottom: 14, display: "block" }}>{s.n}</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, letterSpacing: "-0.02em" }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 14 }}>{s.desc}</p>
                <div style={{ padding: "7px 10px", borderRadius: 7, background: s.color + "10", border: `1px solid ${s.color}30` }}>
                  <code style={{ fontSize: 10, color: s.color, fontFamily: "ui-monospace, monospace" }}>{s.detail}</code>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECHNOLOGY ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 48px", maxWidth: 960, margin: "0 auto" }}>
        <SectionLabel label="Technology" />
        <h2 style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 900, letterSpacing: "-0.04em", textAlign: "center", marginBottom: 12 }}>
          Coral + Claude.<br />The only combination that works.
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-muted)", textAlign: "center", maxWidth: 520, margin: "0 auto 52px", lineHeight: 1.7 }}>
          Coral resolves the JOIN before Claude sees any data.
          Clean rows in — precise analysis out. No hallucinations. No approximations.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TECH_STACK.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 22px", borderRadius: 12, background: "var(--surface)", border: `1px solid ${t.color}20`, transition: "border-color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = t.color + "50")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = t.color + "20")}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: t.color + "15", border: `1px solid ${t.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: t.color }}>{t.name[0]}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</span>
                  <span style={{ fontSize: 11, color: t.color }}>{t.role}</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 48px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <SectionLabel label="Features" />
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 900, letterSpacing: "-0.04em", textAlign: "center", marginBottom: 48 }}>
            Everything you need.<br />Nothing you don&apos;t.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                style={{ padding: "22px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)", transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = f.color + "55")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: f.color + "14", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <f.icon size={16} color={f.color} />
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 48px", textAlign: "center", borderTop: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(255,59,92,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>The bug is running right now. Every minute costs more.</p>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 36, lineHeight: 1.1 }}>
            Find it before your<br /><span style={{ color: "var(--red)" }}>customers do.</span>
          </h2>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 32 }}>
            <button onClick={go}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800, color: "#fff", padding: "16px 36px", borderRadius: 12, cursor: "pointer", background: "var(--red)", border: "none", boxShadow: "0 0 48px rgba(255,59,92,0.35)" }}>
              Start free trial <ArrowRight size={16} />
            </button>
            <button onClick={() => router.push("/demo")}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-muted)", padding: "16px 24px", borderRadius: 12, cursor: "pointer", background: "transparent", border: "1px solid var(--border)" }}>
              View demo →
            </button>
          </div>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
            {["No credit card required", "Connect in 3 minutes", "100% local — data never leaves your machine", "Coral + Claude powered"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={12} color="var(--green)" />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={14} color="var(--red)" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>BugCost</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>Every bug has a price. Now you can see it.</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy", "Terms", "GitHub"].map((l) => (
            <span key={l} style={{ fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}>{l}</span>
          ))}
        </div>
        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>Built for Pirates of the Coral Bean · Powered by Coral + Claude</span>
      </footer>
    </div>
  );
}
