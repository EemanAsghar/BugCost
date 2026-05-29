"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, GitBranch, Zap, Database, GitCommit, DollarSign, AlertTriangle } from "lucide-react";

const SQL = `SELECT s.title AS bug,
       g.author AS introduced_by,
       SUM(p.amount) / 100.0 AS revenue_lost
FROM sentry.issues s
JOIN github.commits g
  ON g.committed_at <= s.first_seen
 AND g.committed_at >= s.first_seen
                      - INTERVAL '2 hours'
JOIN stripe.charges p
  ON p.created_at >= s.first_seen
 AND p.status = 'failed'
WHERE s.level = 'fatal'
ORDER BY revenue_lost DESC;`;

const SQL_RESULT = [
  { bug: "TypeError: price undefined",  by: "@sarah-chen", lost: "$8,400" },
  { bug: "PaymentIntentCreationError",  by: "@mike-torres",  lost: "$3,200" },
  { bug: "SessionExpiredError",          by: "@alex-kim",    lost: "$1,800" },
];

const FEATURES = [
  {
    icon: Database,
    color: "#0a84ff",
    title: "One SQL query",
    desc: "Cross-source JOIN across Sentry, GitHub, and Stripe. No glue code. No ETL. No warehouse.",
  },
  {
    icon: DollarSign,
    color: "#ff3b5c",
    title: "Revenue per bug",
    desc: "The exact dollar amount each bug cost your business — a number that doesn't exist anywhere today.",
  },
  {
    icon: GitCommit,
    color: "#30d158",
    title: "Root cause in seconds",
    desc: "AI correlates the introducing commit, error spike, and payment failures. Tells you who to talk to.",
  },
  {
    icon: Zap,
    color: "#ff9f0a",
    title: "Autonomous investigation",
    desc: "No manual correlation. The AI investigates autonomously and surfaces evidence in real time.",
  },
  {
    icon: Shield,
    color: "#bf5af2",
    title: "100% local",
    desc: "Your credentials and data never leave your machine. Powered by Coral's local query engine.",
  },
  {
    icon: AlertTriangle,
    color: "#4dabf7",
    title: "Prioritise what matters",
    desc: "Stop triaging by error count. Sort by revenue impact. Fix the bug that actually hurts.",
  },
];

const STEPS = [
  { n: "01", title: "Connect your stack", desc: "Paste your Sentry, GitHub, and Stripe API keys. One-time setup." },
  { n: "02", title: "AI investigates", desc: "BugCost runs a cross-source SQL JOIN via Coral and surfaces every fatal bug ranked by revenue lost." },
  { n: "03", title: "Fix & recover", desc: "See exactly which commit caused the drop, who wrote it, and how much it cost. Fix faster." },
];

function NavBar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "0 32px",
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: 32,
        background: scrolled ? "rgba(5,5,13,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : undefined,
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "all 0.3s",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,59,92,0.15)", border: "1px solid rgba(255,59,92,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={14} color="var(--red)" />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>BugCost</span>
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {["Features", "How it works", "Pricing"].map(l => (
          <span key={l} style={{ fontSize: 13, color: "var(--text-muted)", cursor: "pointer", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >{l}</span>
        ))}
      </div>

      {/* Auth buttons */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => router.push("/auth")}
          style={{ fontSize: 13, color: "var(--text-muted)", padding: "6px 14px", borderRadius: 8, cursor: "pointer", background: "transparent", border: "none", transition: "color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
        >Log in</button>
        <button onClick={() => router.push("/auth")}
          style={{ fontSize: 13, fontWeight: 600, color: "#fff", padding: "6px 16px", borderRadius: 8, cursor: "pointer", background: "var(--red)", border: "none", transition: "opacity 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >Get started</button>
      </div>
    </nav>
  );
}

export default function Landing() {
  const router = useRouter();
  const [sqlVisible, setSqlVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setSqlVisible(true), 600);
  }, []);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>
      <NavBar />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 140, paddingBottom: 100, textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* background glow */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse at center, rgba(255,59,92,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {/* eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "rgba(255,59,92,0.08)", border: "1px solid rgba(255,59,92,0.2)", marginBottom: 28 }}>
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "var(--red)", fontWeight: 600, letterSpacing: "0.04em" }}>Powered by Coral · Pirates of the Coral Bean</span>
          </div>

          {/* headline */}
          <h1 style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.04em", marginBottom: 24 }}>
            Every Bug Has{" "}
            <span style={{ background: "linear-gradient(135deg, #ff3b5c 0%, #ff9f0a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              a Price.
            </span>
            <br />
            Now You Can See It.
          </h1>

          <p style={{ fontSize: 18, color: "var(--text-muted)", maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.7 }}>
            BugCost connects Sentry, GitHub, and Stripe to rank your bugs by revenue impact —
            and tells you exactly which commit caused the loss.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 64 }}>
            <button onClick={() => router.push("/auth")}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "#fff", padding: "13px 28px", borderRadius: 10, cursor: "pointer", background: "var(--red)", border: "none", boxShadow: "0 0 32px rgba(255,59,92,0.35)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 0 48px rgba(255,59,92,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 0 32px rgba(255,59,92,0.35)"; }}
            >
              Start free trial <ArrowRight size={15} />
            </button>
            <button onClick={() => router.push("/dashboard")}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "var(--text-muted)", padding: "13px 28px", borderRadius: 10, cursor: "pointer", background: "transparent", border: "1px solid var(--border)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-bright)"; e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              View live demo
            </button>
          </div>

          {/* SQL + result visual */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: sqlVisible ? 1 : 0, y: sqlVisible ? 0 : 24 }}
            transition={{ duration: 0.7 }}
            style={{ maxWidth: 820, margin: "0 auto", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)", boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset" }}
          >
            {/* window chrome */}
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, background: "var(--surface-2)" }}>
              {["#ff5f56", "#ffbd2e", "#27c93f"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
              <span style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>coral-query.sql</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              {/* SQL */}
              <div style={{ padding: "20px 24px", borderRight: "1px solid var(--border)" }}>
                <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Coral SQL</p>
                <pre style={{ fontSize: 11, color: "#8899bb", fontFamily: "ui-monospace, monospace", lineHeight: 1.8, margin: 0, textAlign: "left" }}>{SQL}</pre>
              </div>
              {/* Result */}
              <div style={{ padding: "20px 24px" }}>
                <p style={{ fontSize: 10, color: "var(--green)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>→ Result</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SQL_RESULT.map((r, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: sqlVisible ? 1 : 0, x: sqlVisible ? 0 : 8 }} transition={{ delay: 1 + i * 0.2 }}
                      style={{ padding: "10px 12px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--text)", fontWeight: 500 }}>{r.bug}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--red)" }}>{r.lost}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "var(--blue-bright)" }}>{r.by}</span>
                    </motion.div>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 12, textAlign: "center" }}>3 sources joined · 0 glue code · 100% local</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section style={{ padding: "80px 48px", borderTop: "1px solid var(--border)", maxWidth: 900, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", textAlign: "center", marginBottom: 12 }}>How it works</p>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: "center", letterSpacing: "-0.03em", marginBottom: 56 }}>Up and running in 3 minutes</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
          {STEPS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ padding: "32px 28px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)", position: "relative" }}
            >
              <span style={{ fontSize: 11, fontFamily: "ui-monospace, monospace", color: "var(--red)", fontWeight: 700, marginBottom: 16, display: "block" }}>{s.n}</span>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.02em" }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 48px", maxWidth: 960, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", textAlign: "center", marginBottom: 12 }}>Features</p>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: "center", letterSpacing: "-0.03em", marginBottom: 56 }}>Built for engineering teams that care about revenue</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {FEATURES.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              style={{ padding: "24px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", transition: "border-color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = f.color + "50")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: f.color + "14", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <f.icon size={16} color={f.color} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 48px", textAlign: "center", borderTop: "1px solid var(--border)" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>Stop guessing. Start knowing.</h2>
          <p style={{ fontSize: 16, color: "var(--text-muted)", marginBottom: 36 }}>Connect your stack in 3 minutes and see which bugs are costing you money.</p>
          <button onClick={() => router.push("/auth")}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: "#fff", padding: "15px 32px", borderRadius: 12, cursor: "pointer", background: "var(--red)", border: "none", boxShadow: "0 0 40px rgba(255,59,92,0.3)" }}
          >
            Start free trial <ArrowRight size={16} />
          </button>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={14} color="var(--red)" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>BugCost</span>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Built for Pirates of the Coral Bean · Powered by Coral</span>
        <div style={{ display: "flex", gap: 16 }}>
          <GitBranch size={16} color="var(--text-muted)" style={{ cursor: "pointer" }} />
        </div>
      </footer>
    </div>
  );
}
