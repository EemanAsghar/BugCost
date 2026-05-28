"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  GitCommit,
  DollarSign,
  Users,
  Zap,
  Database,
  ChevronRight,
  Activity,
  Shield,
  Clock,
} from "lucide-react";
import type { BugRow } from "@/lib/coralQuery";
import { InvestigationPanel } from "@/app/components/InvestigationPanel";

const CORAL_QUERY = `SELECT s.title AS bug, s.times_seen AS occurrences,
       g.author AS introduced_by, g.title AS commit,
       g.committed_at, s.first_seen,
       COUNT(p.id) AS failed_payments,
       SUM(p.amount) / 100.0 AS revenue_lost_usd
FROM sentry.issues s
JOIN github.commits g
  ON g.committed_at <= s.first_seen
 AND g.committed_at >= s.first_seen - INTERVAL '2 hours'
JOIN stripe.charges p
  ON p.created_at >= s.first_seen AND p.status = 'failed'
WHERE s.level = 'fatal'
GROUP BY s.title, s.times_seen, g.author, g.title, g.committed_at, s.first_seen
ORDER BY revenue_lost_usd DESC;`;

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

function SeverityBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct > 66 ? "#ff4757" : pct > 33 ? "#ffa502" : "#2ed573";
  return (
    <div className="h-1 w-14 rounded-full overflow-hidden mt-1.5" style={{ background: "var(--border)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "var(--red)",
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl p-4 flex gap-3 items-start"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: color + "18" }}
      >
        <Icon size={15} style={{ color }} />
      </div>
      <div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-lg font-semibold leading-tight">{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [bugs, setBugs] = useState<BugRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"querying" | "correlating" | "scoring" | "done">("querying");
  const [showQuery, setShowQuery] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedBug, setSelectedBug] = useState<BugRow | null>(null);

  useEffect(() => {
    const run = async () => {
      setPhase("querying");
      await new Promise((r) => setTimeout(r, 900));
      setPhase("correlating");
      await new Promise((r) => setTimeout(r, 800));
      setPhase("scoring");
      const res = await fetch("/api/investigate");
      const data = await res.json();
      await new Promise((r) => setTimeout(r, 500));
      setBugs(data.results);
      setPhase("done");
      setLoading(false);
    };
    run();
  }, []);

  const totalRevenue = bugs.reduce((s, b) => s + b.revenue_lost_usd, 0);
  const totalUsers = bugs.reduce((s, b) => s + b.affected_users, 0);
  const maxRevenue = bugs[0]?.revenue_lost_usd ?? 1;
  const panelOpen = selectedBug !== null;

  // compact columns when panel open
  const colsCompact = "1.5fr 0.8fr 0.8fr 0.8fr 28px";
  const colsFull = "2fr 0.9fr 1.2fr 0.8fr 0.8fr 0.8fr 28px";
  const cols = panelOpen ? colsCompact : colsFull;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header
        className="border-b px-6 py-3 flex items-center justify-between flex-shrink-0 z-40"
        style={{
          background: "rgba(8,8,15,0.95)",
          backdropFilter: "blur(12px)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--red-glow)", border: "1px solid #ff475740" }}
          >
            <Shield size={14} style={{ color: "var(--red)" }} />
          </div>
          <span className="font-semibold text-sm tracking-tight">BugCost</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Demo
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowQuery(!showQuery)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              color: showQuery ? "var(--blue)" : "var(--text-muted)",
              border: `1px solid ${showQuery ? "#4dabf740" : "var(--border)"}`,
              background: showQuery ? "#4dabf710" : "transparent",
            }}
          >
            <Database size={12} />
            Coral SQL
          </button>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <div
              className="w-1.5 h-1.5 rounded-full pulse-dot"
              style={{ background: phase === "done" ? "var(--green)" : "var(--orange)" }}
            />
            {phase === "done" ? "Live" : "Investigating..."}
          </div>
        </div>
      </header>

      {/* Body: left content + right panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: scrollable dashboard */}
        <div className="flex-1 min-w-0 overflow-y-auto px-6 py-5">

          {/* Coral query panel */}
          <AnimatePresence>
            {showQuery && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Database size={12} style={{ color: "var(--blue)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--blue)" }}>
                      Coral SQL — 3-source JOIN
                    </span>
                    <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
                      sentry.issues × github.commits × stripe.charges
                    </span>
                  </div>
                  <pre
                    className="text-xs leading-relaxed overflow-x-auto"
                    style={{ color: "#a8b5cc", fontFamily: "ui-monospace, monospace" }}
                  >
                    {CORAL_QUERY}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Investigation status */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 rounded-xl p-4 flex items-center gap-3"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <motion.div
                  className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                  style={{ borderColor: "var(--blue)", borderTopColor: "transparent" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <div>
                  <p className="text-sm font-medium">
                    {phase === "querying" && "Running Coral SQL query across 3 sources..."}
                    {phase === "correlating" && "Correlating deployments, errors, and payment failures..."}
                    {phase === "scoring" && "Calculating revenue impact per incident..."}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {phase === "querying" && "Joining sentry.issues × github.commits × stripe.charges"}
                    {phase === "correlating" && "Matching commits within 2hr window before each incident"}
                    {phase === "scoring" && "Aggregating failed Stripe charges per incident"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Alert banner */}
          <AnimatePresence>
            {!loading && bugs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-4 rounded-xl p-3.5 flex items-center gap-3"
                style={{ background: "var(--red-glow)", border: "1px solid #ff475740" }}
              >
                <AlertTriangle size={15} style={{ color: "var(--red)" }} className="flex-shrink-0" />
                <p className="text-sm">
                  <span style={{ color: "var(--red)" }} className="font-semibold">Revenue alert: </span>
                  {fmt(totalRevenue)} lost across {bugs.length} fatal incidents.{" "}
                  Top cause: <span className="font-medium">{bugs[0]?.introduced_by}</span> — {fmt(bugs[0]?.revenue_lost_usd)} impact.
                  {!panelOpen && (
                    <span style={{ color: "var(--text-muted)" }}>
                      {" "}Click any row to investigate.
                    </span>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats — hide some when panel open to save space */}
          {!loading && (
            <div className={`grid gap-3 mb-5 ${panelOpen ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
              <StatCard icon={DollarSign} label="Total Revenue Lost" value={fmt(totalRevenue)} sub="last 7 days" color="var(--red)" delay={0.1} />
              <StatCard icon={AlertTriangle} label="Fatal Incidents" value={String(bugs.length)} sub="production bugs" color="var(--orange)" delay={0.15} />
              {!panelOpen && (
                <>
                  <StatCard icon={Users} label="Users Affected" value={totalUsers.toLocaleString()} sub="estimated" color="var(--blue)" delay={0.2} />
                  <StatCard icon={Activity} label="Failed Payments" value={bugs.reduce((s, b) => s + b.failed_payments, 0).toLocaleString()} sub="Stripe charges" color="var(--purple)" delay={0.25} />
                </>
              )}
            </div>
          )}

          {/* Incidents table */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              {/* Table header */}
              <div
                className="grid text-xs font-medium px-4 py-2.5"
                style={{
                  gridTemplateColumns: cols,
                  background: "var(--surface)",
                  color: "var(--text-muted)",
                  borderBottom: "1px solid var(--border)",
                  transition: "grid-template-columns 0.3s",
                }}
              >
                <span>Bug</span>
                <span>Introduced by</span>
                {!panelOpen && <span>Commit</span>}
                <span>Revenue lost</span>
                {!panelOpen && <span>Payments failed</span>}
                <span>First seen</span>
                <span />
              </div>

              <div style={{ background: "var(--surface-2)" }}>
                {bugs.map((bug, i) => {
                  const isSelected = selectedBug?.id === bug.id;
                  const isHovered = hoveredId === bug.id;
                  return (
                    <motion.div
                      key={bug.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      onClick={() =>
                        setSelectedBug(isSelected ? null : bug)
                      }
                      onMouseEnter={() => setHoveredId(bug.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className="grid px-4 py-3.5 cursor-pointer items-center relative"
                      style={{
                        gridTemplateColumns: cols,
                        borderBottom: i < bugs.length - 1 ? "1px solid var(--border)" : undefined,
                        background: isSelected
                          ? "#ff475710"
                          : isHovered
                          ? "var(--surface)"
                          : "transparent",
                        borderLeft: isSelected
                          ? "2px solid var(--red)"
                          : "2px solid transparent",
                        transition: "background 0.2s, border-color 0.2s",
                      }}
                    >
                      {/* scanning glow on selected row */}
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          animate={{ opacity: [0, 0.08, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          style={{ background: "var(--red)" }}
                        />
                      )}

                      {/* Bug */}
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: isSelected ? "var(--red)" : "#ff475760" }}
                          />
                          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                            {bug.id}
                          </span>
                          {isSelected && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{
                                background: "#ff475720",
                                color: "var(--red)",
                                border: "1px solid #ff475740",
                                fontSize: "9px",
                              }}
                            >
                              Investigating
                            </motion.span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate leading-snug">
                          {bug.bug.length > (panelOpen ? 42 : 60)
                            ? bug.bug.slice(0, panelOpen ? 42 : 60) + "…"
                            : bug.bug}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                          {bug.culprit}
                        </p>
                        <SeverityBar value={bug.revenue_lost_usd} max={maxRevenue} />
                      </div>

                      {/* Author */}
                      <div>
                        <p className="text-sm" style={{ color: "var(--blue)" }}>
                          {bug.introduced_by}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {bug.pr}
                        </p>
                      </div>

                      {/* Commit — hidden when panel open */}
                      {!panelOpen && (
                        <div className="pr-2">
                          <div className="flex items-center gap-1.5">
                            <GitCommit size={11} style={{ color: "var(--text-muted)" }} className="flex-shrink-0" />
                            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                              {bug.commit.length > 38 ? bug.commit.slice(0, 38) + "…" : bug.commit}
                            </p>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                            {timeAgo(bug.committed_at)}
                          </p>
                        </div>
                      )}

                      {/* Revenue */}
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--red)" }}>
                          {fmt(bug.revenue_lost_usd)}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {bug.occurrences.toLocaleString()} errors
                        </p>
                      </div>

                      {/* Payments — hidden when panel open */}
                      {!panelOpen && (
                        <div>
                          <p className="text-sm">{bug.failed_payments}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>charges</p>
                        </div>
                      )}

                      {/* Time */}
                      <div>
                        <div className="flex items-center gap-1">
                          <Clock size={11} style={{ color: "var(--text-muted)" }} />
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {timeAgo(bug.first_seen)}
                          </p>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                          {new Date(bug.first_seen).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Chevron */}
                      <motion.div
                        animate={{ rotate: isSelected ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight
                          size={14}
                          style={{ color: isSelected ? "var(--red)" : isHovered ? "var(--text)" : "var(--text-dim)" }}
                        />
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Footer */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-4 flex items-center gap-4 text-xs pb-4"
              style={{ color: "var(--text-muted)" }}
            >
              <div className="flex items-center gap-1.5">
                <Zap size={11} />
                Powered by{" "}
                <span className="font-medium" style={{ color: "var(--text)" }}>Coral</span>{" "}
                cross-source SQL JOIN
              </div>
              <span style={{ color: "var(--border-bright)" }}>·</span>
              <span>3 sources · 0 ETL · 0 glue code</span>
              <span style={{ color: "var(--border-bright)" }}>·</span>
              <span>100% local</span>
            </motion.div>
          )}
        </div>

        {/* RIGHT: Investigation Panel */}
        <AnimatePresence>
          {selectedBug && (
            <motion.div
              key="panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 480, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="flex-shrink-0 overflow-hidden h-full"
              style={{ borderLeft: "1px solid var(--border)" }}
            >
              <div style={{ width: 480, height: "100%" }}>
                <InvestigationPanel
                  bug={selectedBug}
                  onClose={() => setSelectedBug(null)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
