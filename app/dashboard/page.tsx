"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Shield, Zap } from "lucide-react";
import type { BugRow, TimelinePoint } from "@/lib/coralQuery";
import { CinematicTimeline } from "@/app/components/CinematicTimeline";
import { AIWorkspace } from "@/app/components/AIWorkspace";

// ─── count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1600, active = false) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!active || target === 0) return;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); // easeOutExpo
      setValue(Math.floor(eased * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, active]);

  return value;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return "just now";
}

// ─── incident card ────────────────────────────────────────────────────────────

function IncidentCard({
  bug,
  isSelected,
  maxRevenue,
  rank,
  onClick,
}: {
  bug: BugRow;
  isSelected: boolean;
  maxRevenue: number;
  rank: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const pct = Math.min((bug.revenue_lost_usd / maxRevenue) * 100, 100);
  const barColor = pct > 66 ? "var(--red)" : pct > 33 ? "var(--orange)" : "var(--green)";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.06 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "13px 14px 11px",
        borderRadius: 10,
        cursor: "pointer",
        background: isSelected
          ? "rgba(255,59,92,0.07)"
          : hovered
          ? "rgba(255,255,255,0.025)"
          : "transparent",
        border: `1px solid ${isSelected ? "rgba(255,59,92,0.3)" : "transparent"}`,
        borderLeft: `2px solid ${isSelected ? "var(--red)" : "transparent"}`,
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
        marginBottom: 2,
      }}
    >
      {/* scanning shimmer on selected */}
      {isSelected && (
        <motion.div
          animate={{ opacity: [0, 0.08, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--red)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* top row: dot + title + revenue */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 5 }}>
        <motion.span
          animate={
            isSelected
              ? { opacity: [1, 0.3, 1] }
              : {}
          }
          transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0 }}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: isSelected ? "var(--red)" : "rgba(255,59,92,0.4)",
            flexShrink: 0,
            marginTop: 4,
          }}
        />
        <p
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: 500,
            color: isSelected ? "var(--text)" : hovered ? "var(--text)" : "#c0c0d8",
            lineHeight: 1.45,
            transition: "color 0.2s",
          }}
        >
          {bug.bug.length > 46 ? bug.bug.slice(0, 46) + "…" : bug.bug}
        </p>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--red)",
            flexShrink: 0,
            marginLeft: 6,
          }}
        >
          {fmt(bug.revenue_lost_usd)}
        </span>
      </div>

      {/* meta row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          paddingLeft: 13,
          marginBottom: 7,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "#0a84ff",
            fontWeight: 500,
          }}
        >
          {bug.introduced_by}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-dim)" }}>·</span>
        <span
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {bug.pr}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-dim)" }}>·</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
          {bug.occurrences.toLocaleString()} errors
        </span>
        <span style={{ fontSize: 10, color: "var(--text-dim)", marginLeft: "auto" }}>
          {timeAgo(bug.first_seen)}
        </span>
      </div>

      {/* severity bar */}
      <div style={{ paddingLeft: 13 }}>
        <div
          style={{
            height: 2,
            borderRadius: 1,
            background: "var(--border)",
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, delay: 0.1 + rank * 0.06 }}
            style={{ height: "100%", borderRadius: 1, background: barColor }}
          />
        </div>
      </div>

      {/* investigating badge */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: 7,
              paddingLeft: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "var(--orange)",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: "var(--orange)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Investigating
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── hero banner ──────────────────────────────────────────────────────────────

function HeroBanner({
  totalRevenue,
  bugsCount,
  totalPayments,
  dataReady,
}: {
  totalRevenue: number;
  bugsCount: number;
  totalPayments: number;
  dataReady: boolean;
}) {
  const displayed = useCountUp(totalRevenue, 1800, dataReady);

  return (
    <div
      className="border-glow"
      style={{
        flexShrink: 0,
        padding: "18px 28px",
        background:
          "linear-gradient(135deg, rgba(255,59,92,0.1) 0%, rgba(255,159,10,0.04) 50%, rgba(10,132,255,0.05) 100%)",
        borderBottom: "1px solid rgba(255,59,92,0.18)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* background noise / grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(255,59,92,0.06) 0%, transparent 60%), radial-gradient(circle at 80% 50%, rgba(10,132,255,0.04) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* Left: alert + amount */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,59,92,0.15)",
              border: "1px solid rgba(255,59,92,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 16 }}>⚠</span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <motion.span
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "var(--red)",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {dataReady
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(displayed)
                  : "$—"}
              </motion.span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,59,92,0.7)",
                  marginBottom: 2,
                }}
              >
                Revenue Impact
              </span>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
              AI investigation active · Coral cross-source JOIN
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 36,
            background: "rgba(255,255,255,0.07)",
          }}
        />

        {/* Stats chips */}
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "Fatal incidents", value: dataReady ? bugsCount.toString() : "—", color: "var(--red)" },
            { label: "Failed charges", value: dataReady ? totalPayments.toLocaleString() : "—", color: "var(--orange)" },
            { label: "Data sources", value: "4", color: "var(--blue-bright)" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p style={{ fontSize: 16, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Right: live indicator */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--green)",
            }}
          />
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
            Live
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Coral SQL tooltip ────────────────────────────────────────────────────────

const CORAL_SQL = `SELECT s.title, g.author AS introduced_by,
       COUNT(p.id) AS failed_payments,
       SUM(p.amount)/100.0 AS revenue_lost_usd
FROM sentry.issues s
JOIN github.commits g
  ON g.committed_at <= s.first_seen
 AND g.committed_at >= s.first_seen - INTERVAL '2 hours'
JOIN stripe.charges p
  ON p.created_at >= s.first_seen
 AND p.status = 'failed'
WHERE s.level = 'fatal'
GROUP BY s.title, g.author
ORDER BY revenue_lost_usd DESC;`;

// ─── main dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [bugs, setBugs] = useState<BugRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBug, setSelectedBug] = useState<BugRow | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [timelinePhase, setTimelinePhase] = useState(0);
  const [timelineDone, setTimelineDone] = useState(false);
  const [showSQL, setShowSQL] = useState(false);
  const [coralMode, setCoralMode] = useState<"live" | "demo">("demo");
  const [coralSql, setCoralSql] = useState(CORAL_SQL);
  const [elapsed, setElapsed] = useState<number | null>(null);

  // fetch bugs on mount
  useEffect(() => {
    const run = async () => {
      await new Promise((r) => setTimeout(r, 400));
      const res = await fetch("/api/investigate");
      const data = await res.json();
      setBugs(data.results);
      setCoralMode(data.mode ?? "demo");
      if (data.coral_sql) setCoralSql(data.coral_sql);
      if (data.elapsed_ms) setElapsed(data.elapsed_ms);
      setLoading(false);
    };
    run();
  }, []);

  // auto-select top incident 600ms after data loads
  useEffect(() => {
    if (bugs.length > 0 && !selectedBug) {
      setTimeout(() => setSelectedBug(bugs[0]), 600);
    }
  }, [bugs]); // eslint-disable-line react-hooks/exhaustive-deps

  // fetch timeline when incident selected
  useEffect(() => {
    if (!selectedBug) return;
    setTimeline([]);
    setTimelinePhase(0);
    setTimelineDone(false);
    fetch(`/api/bug/${selectedBug.id}`)
      .then((r) => r.json())
      .then((d) => setTimeline(d.timeline ?? []));
  }, [selectedBug?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalRevenue = bugs.reduce((s, b) => s + b.revenue_lost_usd, 0);
  const totalPayments = bugs.reduce((s, b) => s + b.failed_payments, 0);
  const maxRevenue = bugs[0]?.revenue_lost_usd ?? 1;

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <header
        style={{
          flexShrink: 0,
          height: 46,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 12,
          background: "rgba(5,5,13,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          zIndex: 40,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: "rgba(255,59,92,0.12)",
            border: "1px solid rgba(255,59,92,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Shield size={13} color="var(--red)" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
          BugCost
        </span>
        {/* Coral mode badge */}
        <motion.span
          key={coralMode}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 99,
            fontWeight: 600,
            background: coralMode === "live"
              ? "rgba(48,209,88,0.12)"
              : "rgba(255,159,10,0.1)",
            color: coralMode === "live" ? "var(--green)" : "var(--orange)",
            border: `1px solid ${coralMode === "live" ? "rgba(48,209,88,0.3)" : "rgba(255,159,10,0.25)"}`,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <motion.span
            animate={{ opacity: coralMode === "live" ? [1, 0.3, 1] : 1 }}
            transition={{ duration: 1.5, repeat: coralMode === "live" ? Infinity : 0 }}
            style={{ width: 5, height: 5, borderRadius: "50%", background: coralMode === "live" ? "var(--green)" : "var(--orange)", display: "inline-block" }}
          />
          {coralMode === "live" ? "Coral Live" : "Coral Demo"}
          {elapsed && <span style={{ opacity: 0.7 }}> · {elapsed}ms</span>}
        </motion.span>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setShowSQL(!showSQL)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            padding: "5px 10px",
            borderRadius: 6,
            cursor: "pointer",
            color: showSQL ? "var(--blue-bright)" : "var(--text-muted)",
            border: `1px solid ${showSQL ? "rgba(10,132,255,0.35)" : "var(--border)"}`,
            background: showSQL ? "rgba(10,132,255,0.08)" : "transparent",
            transition: "all 0.2s",
          }}
        >
          <Database size={11} />
          Coral SQL
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          <Zap size={11} color="var(--text-muted)" />
          Powered by{" "}
          <span style={{ color: "var(--text)", fontWeight: 500 }}>Coral</span>
        </div>
      </header>

      {/* ─── Hero Banner ───────────────────────────────────────────────────── */}
      <HeroBanner
        totalRevenue={totalRevenue}
        bugsCount={bugs.length}
        totalPayments={totalPayments}
        dataReady={!loading}
      />

      {/* ─── SQL drawer ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSQL && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ flexShrink: 0, overflow: "hidden" }}
          >
            <div
              style={{
                padding: "14px 24px",
                background: "rgba(10,132,255,0.04)",
                borderBottom: "1px solid rgba(10,132,255,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <Database size={11} color="var(--blue-bright)" />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--blue-bright)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Coral SQL — 3-source JOIN
                </span>
                <span
                  style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}
                >
                  sentry.issues × github.commits × stripe.charges
                  {elapsed && ` · executed in ${elapsed}ms`}
                </span>
              </div>
              <pre
                style={{
                  fontSize: 11,
                  color: "#8899bb",
                  fontFamily: "ui-monospace, monospace",
                  lineHeight: 1.7,
                  overflowX: "auto",
                  margin: 0,
                }}
              >
                {coralSql}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Three-panel body ───────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* LEFT — incident feed */}
        <div
          style={{
            width: 272,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          {/* sidebar header */}
          <div
            style={{
              padding: "12px 16px 10px",
              flexShrink: 0,
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
              }}
            >
              Incidents
            </span>
            {!loading && (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 99,
                  background: "rgba(255,59,92,0.12)",
                  color: "var(--red)",
                  border: "1px solid rgba(255,59,92,0.25)",
                  fontWeight: 600,
                }}
              >
                {bugs.length}
              </span>
            )}
          </div>

          {/* cards list */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "8px 10px",
            }}
          >
            {loading ? (
              /* skeleton */
              [...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  style={{
                    height: 70,
                    borderRadius: 8,
                    background: "var(--surface)",
                    marginBottom: 4,
                  }}
                />
              ))
            ) : (
              bugs.map((bug, i) => (
                <IncidentCard
                  key={bug.id}
                  bug={bug}
                  isSelected={selectedBug?.id === bug.id}
                  maxRevenue={maxRevenue}
                  rank={i}
                  onClick={() =>
                    setSelectedBug(selectedBug?.id === bug.id ? null : bug)
                  }
                />
              ))
            )}
          </div>

          {/* Coral attribution */}
          <div
            style={{
              padding: "10px 14px",
              flexShrink: 0,
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Zap size={10} color="var(--text-dim)" />
            <span style={{ fontSize: 10, color: "var(--text-dim)" }}>
              Coral · 3 sources · 0 ETL
            </span>
          </div>
        </div>

        {/* CENTER — cinematic timeline */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--border)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <AnimatePresence mode="wait">
            {selectedBug ? (
              <motion.div
                key={selectedBug.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ height: "100%", overflow: "hidden" }}
              >
                <CinematicTimeline
                  bug={selectedBug}
                  timeline={timeline}
                  phase={timelinePhase}
                  isDone={timelineDone}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: 40,
                }}
              >
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  style={{
                    width: "60%",
                    height: 1,
                    background:
                      "linear-gradient(90deg, transparent, var(--border-bright), transparent)",
                  }}
                />
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  Select an incident to begin investigation
                </p>
                <p style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center" }}>
                  AI will autonomously correlate Sentry, GitHub, Stripe, and Slack
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — AI workspace */}
        <div
          style={{
            width: 380,
            flexShrink: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AnimatePresence mode="wait">
            {selectedBug ? (
              <motion.div
                key={selectedBug.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.3 }}
                style={{ height: "100%", overflow: "hidden" }}
              >
                <AIWorkspace
                  bug={selectedBug}
                  onPhaseChange={(phase, done) => {
                    setTimelinePhase(phase);
                    setTimelineDone(done);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty-ai"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: 28,
                }}
              >
                <motion.div
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    textAlign: "center",
                    lineHeight: 1.7,
                  }}
                >
                  AI Investigator ready.
                  <br />
                  Select an incident to begin.
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
