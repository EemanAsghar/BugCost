"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GitCommit,
  DollarSign,
  Users,
  AlertTriangle,
  Clock,
  Zap,
  TrendingDown,
  Shield,
  CheckCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { BugRow, TimelinePoint } from "@/lib/coralQuery";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CONFIDENCE_LABELS = [
  "Investigating...",
  "Weak signal",
  "Possible",
  "Likely",
  "Probable",
  "High confidence",
  "Confirmed",
];

function ConfidenceScore({ score }: { score: number }) {
  const label = CONFIDENCE_LABELS[Math.min(Math.floor(score / 15), 6)];
  const color =
    score > 75 ? "var(--red)" : score > 50 ? "var(--orange)" : "var(--blue)";
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
        Confidence Score
      </p>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}%
        </span>
        <span className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--border)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border-bright)",
      }}
    >
      <p style={{ color: "var(--text-muted)" }}>{label}</p>
      {payload.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        )
      )}
    </div>
  );
}

export default function BugDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [bug, setBug] = useState<BugRow | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetch(`/api/bug/${p.id}`)
        .then((r) => r.json())
        .then((data) => {
          setBug(data.bug);
          setTimeline(data.timeline);
          setLoading(false);
        });
    });
  }, [params]);

  if (loading || !bug) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <motion.div
          className="w-6 h-6 rounded-full border-2"
          style={{ borderColor: "var(--blue)", borderTopColor: "transparent" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const confidence = Math.min(
    95,
    Math.round(40 + (bug.revenue_lost_usd / 10000) * 40 + bug.failed_payments * 0.1)
  );

  const deployIdx = timeline.findIndex((p) => p.label);
  const chartData = timeline.map((p) => ({
    time: formatTime(p.time),
    Errors: p.errors,
    "Failed Payments": p.failures,
    label: p.label,
  }));

  const evidenceItems = [
    {
      icon: GitCommit,
      color: "var(--blue)",
      title: "Introducing commit identified",
      detail: `${bug.commit} by ${bug.introduced_by}`,
      sub: `${bug.pr} · committed ${new Date(bug.committed_at).toLocaleString()}`,
    },
    {
      icon: AlertTriangle,
      color: "var(--red)",
      title: "Fatal error spike detected",
      detail: `${bug.occurrences.toLocaleString()} occurrences in ${bug.project}`,
      sub: `First seen ${new Date(bug.first_seen).toLocaleString()} · ${bug.culprit}`,
    },
    {
      icon: TrendingDown,
      color: "var(--orange)",
      title: "Revenue impact confirmed",
      detail: `${bug.failed_payments} Stripe charges failed (${fmt(bug.revenue_lost_usd)})`,
      sub: `Charges failed within 3hr window after incident start`,
    },
    {
      icon: Users,
      color: "var(--purple)",
      title: "User impact estimated",
      detail: `~${bug.affected_users.toLocaleString()} users affected`,
      sub: `Based on error rate and session data`,
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)" }}
    >
      {/* Header */}
      <header
        className="border-b px-6 py-3 flex items-center gap-4 sticky top-0 z-40"
        style={{
          background: "rgba(8,8,15,0.85)",
          backdropFilter: "blur(12px)",
          borderColor: "var(--border)",
        }}
      >
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          style={{
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
        >
          <ArrowLeft size={12} />
          Dashboard
        </button>
        <div
          className="w-px h-4"
          style={{ background: "var(--border)" }}
        />
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "var(--red-glow)" }}
          >
            <Shield size={12} style={{ color: "var(--red)" }} />
          </div>
          <span className="font-semibold text-sm">BugCost</span>
        </div>
        <span
          className="text-xs font-mono ml-auto"
          style={{ color: "var(--text-muted)" }}
        >
          {id}
        </span>
      </header>

      <main className="px-6 py-6 max-w-6xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--red)" }}
            />
            <span
              className="text-xs font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              FATAL · {bug.project}
            </span>
          </div>
          <h1 className="text-xl font-semibold leading-tight mb-1">
            {bug.bug}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {bug.culprit}
          </p>
        </motion.div>

        {/* Top metrics */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {[
            {
              icon: DollarSign,
              color: "var(--red)",
              label: "Revenue Lost",
              value: fmt(bug.revenue_lost_usd),
            },
            {
              icon: AlertTriangle,
              color: "var(--orange)",
              label: "Occurrences",
              value: bug.occurrences.toLocaleString(),
            },
            {
              icon: TrendingDown,
              color: "var(--purple)",
              label: "Failed Payments",
              value: bug.failed_payments.toString(),
            },
            {
              icon: Users,
              color: "var(--blue)",
              label: "Users Affected",
              value: `~${bug.affected_users.toLocaleString()}`,
            },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-xl p-4"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <m.icon size={12} style={{ color: m.color }} />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {m.label}
                </span>
              </div>
              <p
                className="text-xl font-bold"
                style={{ color: m.color }}
              >
                {m.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          {/* Timeline chart */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 rounded-xl p-4"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap size={13} style={{ color: "var(--orange)" }} />
              <span className="text-sm font-medium">Timeline Correlation</span>
              <div className="ml-auto flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--red)" }} />
                  Errors
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--orange)" }} />
                  Failed payments
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4757" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffa502" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ffa502" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {deployIdx >= 0 && (
                  <ReferenceLine
                    x={chartData[deployIdx]?.time}
                    stroke="#ff4757"
                    strokeDasharray="3 3"
                    label={{
                      value: "Deploy",
                      fill: "#ff4757",
                      fontSize: 10,
                      position: "top",
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="Errors"
                  stroke="#ff4757"
                  strokeWidth={1.5}
                  fill="url(#errGrad)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="Failed Payments"
                  stroke="#ffa502"
                  strokeWidth={1.5}
                  fill="url(#payGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Confidence score */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col gap-3"
          >
            <ConfidenceScore score={confidence} />

            {/* Commit info */}
            <div
              className="rounded-xl p-4 flex-1"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-xs mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Introducing Commit
              </p>
              <div className="flex items-start gap-2">
                <GitCommit
                  size={13}
                  style={{ color: "var(--blue)" }}
                  className="mt-0.5 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">
                    {bug.introduced_by}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {bug.commit.length > 50
                      ? bug.commit.slice(0, 50) + "…"
                      : bug.commit}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock
                      size={10}
                      style={{ color: "var(--text-muted)" }}
                    />
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(bug.committed_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className="inline-block mt-2 text-xs px-2 py-0.5 rounded"
                    style={{
                      background: "#4dabf720",
                      color: "var(--blue)",
                      border: "1px solid #4dabf740",
                    }}
                  >
                    {bug.pr}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Evidence panel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <Shield size={13} style={{ color: "var(--text-muted)" }} />
            <span className="text-sm font-medium">Investigation Evidence</span>
            <span
              className="ml-auto text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Coral cross-source JOIN · 3 sources
            </span>
          </div>
          <div style={{ background: "var(--surface-2)" }}>
            {evidenceItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-start gap-3 px-4 py-3.5"
                style={{
                  borderBottom:
                    i < evidenceItems.length - 1
                      ? "1px solid var(--border)"
                      : undefined,
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: item.color + "18" }}
                >
                  <item.icon size={13} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.detail}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {item.sub}
                  </p>
                </div>
                <CheckCircle
                  size={14}
                  style={{ color: "var(--green)" }}
                  className="flex-shrink-0 mt-1"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Coral attribution */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-4 text-xs flex items-center gap-2"
          style={{ color: "var(--text-muted)" }}
        >
          <Zap size={11} />
          Investigation powered by{" "}
          <span className="font-medium" style={{ color: "var(--text)" }}>
            Coral
          </span>{" "}
          — sentry.issues × github.commits × stripe.charges · 0 ETL · 100%
          local
        </motion.div>
      </main>
    </div>
  );
}
