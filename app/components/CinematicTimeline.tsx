"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { BugRow, TimelinePoint } from "@/lib/coralQuery";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CHECKPOINTS = [
  { label: "Deploy",    sub: "Identified",  minPhase: 3,  color: "#4dabf7" },
  { label: "Errors",    sub: "Spike",        minPhase: 5,  color: "#ff3b5c" },
  { label: "Revenue",   sub: "Impacted",     minPhase: 7,  color: "#ff9f0a" },
  { label: "Root Cause",sub: "Confirmed",    minPhase: 10, color: "#30d158" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(8,8,20,0.92)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: "8px 12px",
        backdropFilter: "blur(8px)",
      }}
    >
      <p style={{ color: "var(--text-muted)", fontSize: 10, marginBottom: 6, fontFamily: "ui-monospace, monospace" }}>
        {label}
      </p>
      {payload.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => (
          <p key={p.name} style={{ color: p.color, fontSize: 12, marginBottom: 2 }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        )
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DeployLabel({ viewBox }: any) {
  if (!viewBox) return null;
  const { x } = viewBox;
  return (
    <g>
      <motion.text
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        x={x + 6}
        y={18}
        fill="#4dabf7"
        fontSize={9}
        fontFamily="ui-monospace, monospace"
        fontWeight="600"
        letterSpacing="0.06em"
      >
        DEPLOY
      </motion.text>
    </g>
  );
}

export function CinematicTimeline({
  bug,
  timeline,
  phase,
  isDone,
}: {
  bug: BugRow;
  timeline: TimelinePoint[];
  phase: number;
  isDone: boolean;
}) {
  const chartData = timeline.map((p) => ({
    time: fmtTime(p.time),
    errors: p.errors,
    payments: p.failures,
    isIncident: !!p.label,
  }));

  const deployIdx = timeline.findIndex((p) => p.label);
  const deployTime = deployIdx >= 0 ? chartData[deployIdx]?.time : null;

  const checkpointFill = Math.min(((phase - 1) / 9) * 100, 100);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "20px 24px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Incident Timeline
        </span>
        <span
          style={{
            fontSize: 10,
            padding: "2px 7px",
            borderRadius: 4,
            background: "rgba(255,59,92,0.1)",
            color: "var(--red)",
            border: "1px solid rgba(255,59,92,0.25)",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {bug.id}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
          {bug.project} ·{" "}
          {new Date(bug.first_seen).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>

        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "var(--green)",
                fontWeight: 500,
              }}
            >
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--green)",
                  display: "inline-block",
                }}
              />
              Root cause confirmed
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chart area */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 8, bottom: 0, left: -24 }}
            >
              <defs>
                <linearGradient id="ctErrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff3b5c" stopOpacity={0.45} />
                  <stop offset="70%" stopColor="#ff3b5c" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#ff3b5c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ctErrLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ff3b5c" stopOpacity={0.5} />
                  <stop offset={`${deployIdx > 0 ? (deployIdx / chartData.length) * 100 : 50}%`} stopColor="#ff3b5c" stopOpacity={1} />
                  <stop offset="100%" stopColor="#ff3b5c" stopOpacity={0.6} />
                </linearGradient>
                <filter id="redGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <CartesianGrid
                strokeDasharray="1 6"
                stroke="rgba(255,255,255,0.035)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{
                  fill: "var(--text-muted)",
                  fontSize: 9,
                  fontFamily: "ui-monospace, monospace",
                }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
                interval={4}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip content={<ChartTooltip />} />

              {/* Deploy marker */}
              {phase >= 2 && deployTime && (
                <ReferenceLine
                  x={deployTime}
                  stroke="#4dabf7"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  label={<DeployLabel />}
                />
              )}

              {/* Error area */}
              <Area
                type="monotone"
                dataKey="errors"
                name="Errors"
                stroke="url(#ctErrLine)"
                strokeWidth={2}
                fill="url(#ctErrGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#ff3b5c", strokeWidth: 0 }}
                animationBegin={200}
                animationDuration={1400}
              />

              {/* Payment failure bars */}
              <Bar
                dataKey="payments"
                name="Failed Payments"
                fill="#ff9f0a"
                fillOpacity={0.65}
                radius={[2, 2, 0, 0]}
                animationBegin={1000}
                animationDuration={1000}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          /* Loading skeleton */
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: "100%",
                height: 2,
                background: "linear-gradient(90deg, transparent, var(--blue-bright), transparent)",
                borderRadius: 1,
              }}
            />
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Loading timeline...
            </p>
          </div>
        )}
      </div>

      {/* Checkpoint row */}
      <div style={{ flexShrink: 0, marginTop: 20, paddingBottom: 4 }}>
        <div style={{ position: "relative", height: 60 }}>
          {/* Track */}
          <div
            style={{
              position: "absolute",
              top: 6,
              left: "12.5%",
              right: "12.5%",
              height: 1,
              background: "var(--border)",
            }}
          />
          {/* Fill line */}
          <motion.div
            animate={{ width: `${checkpointFill * 0.75}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: 6,
              left: "12.5%",
              height: 1,
              background:
                "linear-gradient(90deg, #4dabf7 0%, #ff3b5c 33%, #ff9f0a 66%, #30d158 100%)",
              opacity: 0.7,
            }}
          />
          {/* Checkpoint nodes */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            {CHECKPOINTS.map((cp) => {
              const active = phase >= cp.minPhase;
              return (
                <motion.div
                  key={cp.label}
                  animate={{ opacity: active ? 1 : 0.3 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    width: "25%",
                  }}
                >
                  <motion.div
                    animate={
                      active
                        ? {
                            boxShadow: [
                              `0 0 0px ${cp.color}00`,
                              `0 0 14px ${cp.color}90`,
                              `0 0 0px ${cp.color}00`,
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 2, repeat: active ? Infinity : 0 }}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: active ? cp.color : "var(--border)",
                      border: `2px solid ${active ? cp.color : "var(--border-bright)"}`,
                      transition: "all 0.4s",
                    }}
                  />
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: active ? cp.color : "var(--text-dim)",
                        transition: "color 0.4s",
                        lineHeight: 1.2,
                      }}
                    >
                      {cp.label}
                    </div>
                    <div
                      style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}
                    >
                      {cp.sub}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats bar — reveals when done */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              flexShrink: 0,
              display: "flex",
              gap: 0,
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid rgba(255,59,92,0.18)",
              background:
                "linear-gradient(135deg, rgba(255,59,92,0.06) 0%, rgba(255,159,10,0.04) 100%)",
              marginTop: 12,
            }}
          >
            {[
              {
                label: "Revenue lost",
                value: fmt(bug.revenue_lost_usd),
                color: "var(--red)",
              },
              {
                label: "Error occurrences",
                value: bug.occurrences.toLocaleString(),
                color: "var(--text)",
              },
              {
                label: "Failed charges",
                value: bug.failed_payments.toString(),
                color: "var(--orange)",
              },
              {
                label: "Introduced by",
                value: bug.introduced_by,
                color: "var(--blue-bright)",
              },
            ].map((s, i, arr) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRight:
                    i < arr.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : undefined,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 4,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{ fontSize: 13, fontWeight: 700, color: s.color }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
