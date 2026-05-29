"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight } from "lucide-react";

// ─── live bleeding counter ────────────────────────────────────────────────────

function useLiveCounter(start: number) {
  const [value, setValue] = useState(start);
  useEffect(() => {
    const tick = () => {
      setValue((v) => v + Math.floor(Math.random() * 48 + 12));
      setTimeout(tick, Math.random() * 2000 + 1200);
    };
    const t = setTimeout(tick, 1800);
    return () => clearTimeout(t);
  }, []);
  return value;
}

// ─── typewriter ───────────────────────────────────────────────────────────────

function Typewriter({ lines }: { lines: string[] }) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    if (current >= lines.length) return;
    if (charIdx < lines[current].length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), 28);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setDisplayed((d) => [...d, lines[current]]);
        setCurrent((c) => c + 1);
        setCharIdx(0);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [current, charIdx, lines]);

  const currentLine =
    current < lines.length ? lines[current].slice(0, charIdx) : "";

  return (
    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, lineHeight: 1.8 }}>
      {displayed.map((line, i) => (
        <div key={i} style={{ color: line.startsWith("✓") ? "var(--green)" : line.startsWith("⟶") ? "var(--text-muted)" : "#8899bb" }}>
          {line}
        </div>
      ))}
      {current < lines.length && (
        <div style={{ color: "#8899bb" }}>
          {currentLine}
          <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>▊</motion.span>
        </div>
      )}
    </div>
  );
}

const AI_LINES = [
  "⟶ Querying sentry.issues WHERE level = 'fatal'...",
  "✓ Fatal error: 2,847 occurrences in storefront",
  "⟶ Joining github.commits within 2-hour window...",
  "✓ Commit matched: PR #142 by @sarah-chen",
  "⟶ Joining stripe.charges ON status = 'failed'...",
  "✓ 280 failed charges — root cause confirmed",
];

const SQL = `SELECT s.title, g.author,
  COUNT(p.id)          AS failed_payments,
  SUM(p.amount)/100.0  AS revenue_lost_usd
FROM   sentry.issues s
JOIN   github.commits g
    ON g.committed_at BETWEEN
       s.first_seen - INTERVAL '2 hours'
       AND s.first_seen
JOIN   stripe.charges p
    ON p.created_at >= s.first_seen
   AND p.status = 'failed'
WHERE  s.level = 'fatal'
GROUP  BY s.title, g.author
ORDER  BY revenue_lost_usd DESC;`;

// ─── main landing ─────────────────────────────────────────────────────────────

export default function Landing() {
  const router = useRouter();
  const revenue = useLiveCounter(8400);
  const [startTyping, setStartTyping] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStartTyping(true), 800);
    const t2 = setTimeout(() => setShowResult(true), 7200);
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener("scroll", fn); };
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        height: 52, display: "flex", alignItems: "center",
        padding: "0 28px", gap: 0,
        background: scrolled ? "rgba(3,3,8,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : undefined,
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "all 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(255,59,92,0.15)", border: "1px solid rgba(255,59,92,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={12} color="var(--red)" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>BugCost</span>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => router.push("/auth")}
          style={{ fontSize: 12, color: "var(--text-muted)", padding: "6px 12px", borderRadius: 7, cursor: "pointer", background: "transparent", border: "none", marginRight: 6 }}>
          Sign in
        </button>
        <button onClick={() => router.push("/auth")}
          style={{ fontSize: 12, fontWeight: 700, color: "#fff", padding: "7px 16px", borderRadius: 7, cursor: "pointer", background: "var(--red)", border: "none" }}>
          Get started →
        </button>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 24px 60px", position: "relative", overflow: "hidden" }}>

        {/* background ambient */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 60%, rgba(255,59,92,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent 0%, rgba(255,59,92,0.4) 50%, transparent 100%)" }} />

        {/* incident badge */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 99, background: "rgba(255,59,92,0.08)", border: "1px solid rgba(255,59,92,0.25)", marginBottom: 36 }}>
          <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Live production incident
          </span>
        </motion.div>

        {/* Main message */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ textAlign: "center", maxWidth: 760, marginBottom: 56 }}>
          <h1 style={{ fontSize: "clamp(42px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.045em", marginBottom: 24 }}>
            Your checkout bug has cost you
            <br />
            <motion.span
              key={revenue}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              style={{ color: "var(--red)", display: "inline-block" }}
            >
              {fmt(revenue)}
            </motion.span>
            <br />
            <span style={{ color: "var(--text-muted)" }}>today.</span>
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
            BugCost finds the exact commit that caused it, calculates the revenue lost,
            and tells you who to call — in 9 seconds.
          </p>
        </motion.div>

        {/* The two-panel demo */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ width: "100%", maxWidth: 940, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 40 }}>

          {/* LEFT — live incident feed */}
          <div style={{
            borderRadius: 14, overflow: "hidden",
            background: "var(--surface)", border: "1px solid rgba(255,59,92,0.25)",
            boxShadow: "0 0 40px rgba(255,59,92,0.08)",
          }}>
            {/* chrome */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6, background: "var(--surface-2)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)" }} />
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--orange)", display: "inline-block" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
              <span style={{ flex: 1, textAlign: "center", fontSize: 10, color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>
                bugcost — active investigation
              </span>
              <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                style={{ fontSize: 9, color: "var(--red)", fontWeight: 700, textTransform: "uppercase" }}>● LIVE</motion.span>
            </div>
            <div style={{ padding: "20px" }}>
              {/* incident header */}
              <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(255,59,92,0.15)", color: "var(--red)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>FATAL</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>SENTRY-001</span>
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                  TypeError: Cannot read properties of undefined (reading &apos;price&apos;)
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>checkout/payment.ts · 2,847 occurrences</p>
              </div>

              {/* live counter */}
              <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Revenue lost</p>
                <motion.div key={revenue} initial={{ scale: 1.04 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}
                  style={{ fontSize: 32, fontWeight: 900, color: "var(--red)", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
                  {fmt(revenue)}
                </motion.div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>and counting — 280 failed Stripe charges</p>
              </div>

              {/* AI feed */}
              <div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>AI Investigation</p>
                {startTyping && <Typewriter lines={AI_LINES} />}
              </div>
            </div>
          </div>

          {/* RIGHT — SQL + result */}
          <div style={{ borderRadius: 14, overflow: "hidden", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            {/* chrome */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6, background: "var(--surface-2)" }}>
              {["#3a3a3a", "#3a3a3a", "#3a3a3a"].map((c, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}
              <span style={{ flex: 1, textAlign: "center", fontSize: 10, color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>coral-query.sql</span>
            </div>

            <div style={{ padding: "18px 20px 12px" }}>
              <p style={{ fontSize: 9, color: "var(--blue-bright)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontWeight: 700 }}>
                Coral SQL — 3 sources, 1 query
              </p>
              <pre style={{ fontSize: 11, color: "#6677aa", fontFamily: "ui-monospace, monospace", lineHeight: 1.75, margin: 0, overflowX: "auto" }}>{SQL}</pre>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", padding: "12px 20px" }}>
              <AnimatePresence>
                {showResult ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p style={{ fontSize: 9, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontWeight: 700 }}>
                      → Result (3 rows, 0.4s)
                    </p>
                    {[
                      { bug: "TypeError: price undefined", by: "@sarah-chen", lost: "$8,400" },
                      { bug: "PaymentIntentCreationError", by: "@mike-torres",  lost: "$3,200" },
                      { bug: "SessionExpiredError",         by: "@alex-kim",    lost: "$1,800" },
                    ].map((r, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: 7, background: i === 0 ? "rgba(255,59,92,0.07)" : "var(--surface-2)", border: `1px solid ${i === 0 ? "rgba(255,59,92,0.2)" : "var(--border)"}`, marginBottom: 5 }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text)" }}>{r.bug}</p>
                          <p style={{ fontSize: 10, color: "var(--blue-bright)" }}>{r.by}</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--red)" }}>{r.lost}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>
                    Running query...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => router.push("/auth")}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 800, color: "#fff", padding: "14px 28px", borderRadius: 10, cursor: "pointer", background: "var(--red)", border: "none", boxShadow: "0 0 32px rgba(255,59,92,0.4)" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; }}>
            Stop the bleeding <ArrowRight size={15} />
          </button>
          <button onClick={() => router.push("/dashboard")}
            style={{ fontSize: 13, color: "var(--text-muted)", padding: "14px 20px", borderRadius: 10, cursor: "pointer", background: "transparent", border: "1px solid var(--border)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--border-bright)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
            View live demo
          </button>
        </motion.div>

        <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 16 }}>
          No credit card. No setup. Connect in 3 minutes.
        </p>
      </section>

      {/* ── Problem section ──────────────────────────────────────── */}
      <section style={{ padding: "80px 32px", borderTop: "1px solid var(--border)", maxWidth: 800, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 24, lineHeight: 1.1 }}>
            Sentry tells you it crashed.<br />
            Stripe tells you revenue dropped.<br />
            GitHub has the commit.<br />
            <span style={{ color: "var(--text-muted)" }}>Nobody connects them.</span>
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.8, maxWidth: 560 }}>
            Today, figuring out which bug costs the most money means opening 3 dashboards,
            manually matching timestamps, and guessing. Most teams never do it.
            The expensive bugs stay invisible for weeks.
          </p>
        </motion.div>
      </section>

      {/* ── The fix ──────────────────────────────────────────────── */}
      <section style={{ padding: "60px 32px 80px", maxWidth: 800, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--red)", marginBottom: 16 }}>The fix</p>
          <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 32, lineHeight: 1.1 }}>
            One query.<br />Three sources.<br />9 seconds.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { src: "Sentry", color: "#e03c31", desc: "Fatal errors, first_seen timestamp, occurrences" },
              { src: "GitHub", color: "#4dabf7", desc: "Commits within 2hr window, author, PR metadata" },
              { src: "Stripe", color: "#bf5af2", desc: "Failed charges after incident, total amount" },
            ].map((s) => (
              <div key={s.src} style={{ padding: "20px", borderRadius: 12, background: "var(--surface)", border: `1px solid ${s.color}30` }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: s.color + "15", border: `1px solid ${s.color}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 13, color: s.color, fontWeight: 700 }}>⬡</div>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{s.src}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "14px 20px", borderRadius: 10, background: "rgba(48,209,88,0.06)", border: "1px solid rgba(48,209,88,0.2)" }}>
            <p style={{ fontSize: 12, color: "var(--green)", fontFamily: "ui-monospace, monospace" }}>
              → Coral JOINs all 3 before the AI sees any data. No hallucinations. No approximations. Exact numbers.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section style={{ padding: "80px 32px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            The bug is running right now. Every minute costs more.
          </p>
          <h2 style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 32, lineHeight: 1.1 }}>
            Find it before your<br />
            <span style={{ color: "var(--red)" }}>customers do.</span>
          </h2>
          <button onClick={() => router.push("/auth")}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800, color: "#fff", padding: "16px 36px", borderRadius: 12, cursor: "pointer", background: "var(--red)", border: "none", boxShadow: "0 0 48px rgba(255,59,92,0.35)" }}>
            Start investigating <ArrowRight size={16} />
          </button>
          <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 14 }}>Built for Pirates of the Coral Bean · Powered by Coral</p>
        </motion.div>
      </section>
    </div>
  );
}
