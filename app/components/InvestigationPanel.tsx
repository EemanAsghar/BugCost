"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  GitCommit,
  AlertTriangle,
  DollarSign,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  CheckCircle2,
  Loader2,
  Circle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BugRow, TimelinePoint } from "@/lib/coralQuery";
import { SLACK_MESSAGES, type SlackMessage } from "@/lib/mockSlack";

// ─── types ──────────────────────────────────────────────────────────────────

type StepType = "scan" | "found" | "warn" | "analyze" | "conclude";

interface Step {
  delay: number;
  type: StepType;
  source: number; // 0=Sentry, 1=GitHub, 2=Stripe, 3=Slack, -1=none
  text: string;
}

const SOURCES = [
  { label: "Sentry", color: "#e03c31", icon: "⬡" },
  { label: "GitHub", color: "#4dabf7", icon: "⬡" },
  { label: "Stripe", color: "#a855f7", icon: "⬡" },
  { label: "Slack", color: "#2ed573", icon: "⬡" },
];

const CONFIDENCE_MILESTONES = [5, 20, 28, 52, 60, 78, 84, 89, 92];

// ─── step builder ────────────────────────────────────────────────────────────

function buildSteps(bug: BugRow, slackCount: number, finalConf: number): Step[] {
  return [
    {
      delay: 0.5,
      type: "scan",
      source: 0,
      text: `Querying sentry.issues WHERE level = 'fatal'...`,
    },
    {
      delay: 1.3,
      type: "found",
      source: 0,
      text: `Fatal confirmed — ${bug.occurrences.toLocaleString()} occurrences in ${bug.project}`,
    },
    {
      delay: 2.2,
      type: "scan",
      source: 1,
      text: `Scanning github.commits within 2-hour deployment window...`,
    },
    {
      delay: 3.1,
      type: "found",
      source: 1,
      text: `Commit matched: ${bug.pr} by ${bug.introduced_by} — ${Math.round((new Date(bug.first_seen).getTime() - new Date(bug.committed_at).getTime()) / 60000)}min before incident`,
    },
    {
      delay: 4.0,
      type: "scan",
      source: 2,
      text: `Joining stripe.charges ON created_at >= first_seen AND status = 'failed'...`,
    },
    {
      delay: 5.0,
      type: "found",
      source: 2,
      text: `${bug.failed_payments} failed charges — $${Math.round(bug.revenue_lost_usd).toLocaleString()} revenue impact confirmed`,
    },
    {
      delay: 5.9,
      type: "scan",
      source: 3,
      text: `Scanning slack.messages in #incidents for incident activity...`,
    },
    {
      delay: 6.8,
      type: "found",
      source: 3,
      text: `${slackCount} messages found — incident escalated, rollback confirmed`,
    },
    {
      delay: 7.7,
      type: "analyze",
      source: -1,
      text: `Correlating deployment → error spike → payment failures across all 4 sources...`,
    },
    {
      delay: 8.8,
      type: "conclude",
      source: -1,
      text: `Root cause: ${bug.commit.slice(0, 55)}${bug.commit.length > 55 ? "…" : ""} — ${finalConf}% confidence`,
    },
  ];
}

// ─── helpers ─────────────────────────────────────────────────────────────────

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

function confidenceColor(score: number): string {
  if (score < 30) return "#5a5a78";
  if (score < 55) return "#4dabf7";
  if (score < 78) return "#ffa502";
  return "#ff4757";
}

function confidenceLabel(score: number, done: boolean): string {
  if (!done || score < 10) return "Initializing...";
  if (score < 30) return "Weak signal";
  if (score < 55) return "Possible cause";
  if (score < 78) return "Probable cause";
  if (score < 88) return "High confidence";
  return "Root cause confirmed";
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SourceNode({
  source,
  active,
  done,
  delay,
}: {
  source: (typeof SOURCES)[0];
  active: boolean;
  done: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ opacity: active || done ? 1 : 0.3 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-1"
    >
      <motion.div
        className="w-9 h-9 rounded-lg flex items-center justify-center relative"
        style={{
          background: done || active ? source.color + "18" : "var(--surface)",
          border: `1px solid ${done || active ? source.color + "60" : "var(--border)"}`,
        }}
        animate={
          active
            ? {
                boxShadow: [
                  `0 0 0px ${source.color}00`,
                  `0 0 12px ${source.color}60`,
                  `0 0 0px ${source.color}00`,
                ],
              }
            : {}
        }
        transition={{ duration: 1, repeat: active ? Infinity : 0 }}
      >
        {done ? (
          <CheckCircle2 size={14} style={{ color: source.color }} />
        ) : active ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 size={14} style={{ color: source.color }} />
          </motion.div>
        ) : (
          <Circle size={14} style={{ color: "var(--text-dim)" }} />
        )}
      </motion.div>
      <span
        className="text-xs font-medium"
        style={{
          color: done || active ? source.color : "var(--text-dim)",
          transition: "color 0.3s",
        }}
      >
        {source.label}
      </span>
    </motion.div>
  );
}

function StepLine({
  step,
  isLast,
  isRunning,
}: {
  step: Step;
  isLast: boolean;
  isRunning: boolean;
}) {
  const colors: Record<StepType, string> = {
    scan: "var(--text-muted)",
    found: "var(--green)",
    warn: "var(--orange)",
    analyze: "var(--blue)",
    conclude: "var(--red)",
  };

  const prefixes: Record<StepType, string> = {
    scan: "⟶",
    found: "✓",
    warn: "!",
    analyze: "◈",
    conclude: "⚑",
  };

  const color = isRunning ? "var(--orange)" : colors[step.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-2 py-0.5"
    >
      <span
        className="text-xs font-mono flex-shrink-0 w-4 mt-0.5"
        style={{ color }}
      >
        {isRunning ? (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            ⟶
          </motion.span>
        ) : (
          prefixes[step.type]
        )}
      </span>
      <span
        className={`text-xs font-mono leading-relaxed ${step.type === "conclude" ? "font-semibold" : ""}`}
        style={{ color: isRunning ? "var(--text)" : color }}
      >
        {step.text}
        {isRunning && isLast && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            ▊
          </motion.span>
        )}
      </span>
    </motion.div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MiniTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-md px-2 py-1.5 text-xs"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border-bright)",
      }}
    >
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

function SlackPreview({ messages }: { messages: SlackMessage[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? messages : messages.slice(0, 3);

  return (
    <div>
      {shown.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-start gap-2 py-1.5"
          style={{
            borderBottom:
              i < shown.length - 1 ? "1px solid var(--border)" : undefined,
          }}
        >
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: m.isBot ? "var(--border)" : "#4dabf720",
              color: m.isBot ? "var(--text-muted)" : "var(--blue)",
              fontSize: "9px",
            }}
          >
            {m.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium"
                style={{ color: m.isBot ? "var(--text-muted)" : "var(--text)" }}
              >
                {m.user}
              </span>
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                {m.time}
              </span>
            </div>
            <p
              className="text-xs leading-relaxed mt-0.5"
              style={{
                color: m.isBot ? "var(--text-muted)" : "var(--text)",
                fontStyle: m.isBot ? "italic" : undefined,
              }}
            >
              {m.text}
            </p>
          </div>
        </motion.div>
      ))}
      {messages.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-xs cursor-pointer"
          style={{ color: "var(--blue)" }}
        >
          {expanded ? (
            <>
              <ChevronUp size={11} /> Show less
            </>
          ) : (
            <>
              <ChevronDown size={11} /> +{messages.length - 3} more messages
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function InvestigationPanel({
  bug,
  onClose,
}: {
  bug: BugRow;
  onClose: () => void;
}) {
  const slackMsgs = SLACK_MESSAGES[bug.id] ?? [];
  const finalConf = Math.min(
    95,
    Math.round(40 + (bug.revenue_lost_usd / 10000) * 40 + bug.failed_payments * 0.1)
  );
  const steps = buildSteps(bug, slackMsgs.length, finalConf);

  const [visibleCount, setVisibleCount] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [showEvidence, setShowEvidence] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // reset on bug change
  useEffect(() => {
    setVisibleCount(0);
    setConfidence(0);
    setIsDone(false);
    setShowEvidence(false);
    setTimeline([]);

    // fetch timeline
    fetch(`/api/bug/${bug.id}`)
      .then((r) => r.json())
      .then((d) => setTimeline(d.timeline ?? []));

    // run investigation steps
    const timers: ReturnType<typeof setTimeout>[] = [];

    steps.forEach((step, i) => {
      const t = setTimeout(() => {
        setVisibleCount(i + 1);
        setConfidence(CONFIDENCE_MILESTONES[i] ?? finalConf);
        if (i === steps.length - 1) {
          setTimeout(() => {
            setConfidence(finalConf);
            setIsDone(true);
            setTimeout(() => setShowEvidence(true), 400);
          }, 600);
        }
      }, step.delay * 1000);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [bug.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // auto-scroll feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [visibleCount]);

  const cColor = confidenceColor(confidence);
  const activeSource = visibleCount > 0 ? steps[visibleCount - 1]?.source : -1;
  const doneSourceSet = new Set(
    steps.slice(0, visibleCount).map((s) => s.source)
  );

  const chartData = timeline.map((p) => ({
    time: formatTime(p.time),
    Errors: p.errors,
    Payments: p.failures,
  }));

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "var(--surface)", width: 480 }}
    >
      {/* sticky header */}
      <div
        className="flex items-center gap-2 px-4 py-3 flex-shrink-0 sticky top-0 z-10"
        style={{
          background: "rgba(15,15,26,0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--red-glow)" }}
        >
          <AlertTriangle size={11} style={{ color: "var(--red)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              {bug.id}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: "var(--red-glow)",
                color: "var(--red)",
                border: "1px solid #ff475730",
              }}
            >
              fatal
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {bug.project}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/bug/${bug.id}`}
            className="text-xs flex items-center gap-1 px-2 py-1 rounded"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            target="_blank"
          >
            <ExternalLink size={10} />
            Full view
          </a>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* confidence block */}
        <div
          className="px-4 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-end gap-3 mb-2">
            <motion.span
              className="text-5xl font-bold tabular-nums leading-none"
              style={{ color: cColor, transition: "color 0.6s" }}
            >
              {confidence}
            </motion.span>
            <span className="text-lg mb-1" style={{ color: "var(--text-muted)" }}>
              %
            </span>
            <div className="mb-1.5 flex-1">
              <p className="text-sm font-medium">
                {confidenceLabel(confidence, isDone)}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {isDone
                  ? `${fmt(bug.revenue_lost_usd)} revenue impact · ${bug.failed_payments} failed charges`
                  : "AI investigation in progress..."}
              </p>
            </div>
          </div>
          {/* confidence bar */}
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
          >
            <motion.div
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${cColor}99, ${cColor})`,
                boxShadow: isDone ? `0 0 8px ${cColor}80` : undefined,
              }}
            />
          </div>
        </div>

        {/* source nodes */}
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <div className="flex items-center justify-between">
            {SOURCES.map((src, i) => (
              <SourceNode
                key={src.label}
                source={src}
                active={activeSource === i}
                done={doneSourceSet.has(i) && activeSource !== i}
                delay={i * 0.15}
              />
            ))}
          </div>
          {/* connecting line */}
          <div className="relative mt-2 mx-4 h-px" style={{ background: "var(--border)" }}>
            <motion.div
              className="absolute top-0 left-0 h-full"
              style={{ background: `linear-gradient(90deg, var(--green), var(--blue))`, opacity: 0.6 }}
              animate={{ width: `${Math.min((visibleCount / steps.length) * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-center text-xs mt-2" style={{ color: "var(--text-dim)" }}>
            Coral cross-source JOIN · 0 ETL
          </p>
        </div>

        {/* investigation feed */}
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={11} style={{ color: "var(--orange)" }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              AI Investigation Feed
            </span>
            {!isDone && (
              <motion.div
                className="ml-auto w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--orange)" }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            {isDone && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-auto flex items-center gap-1 text-xs"
                style={{ color: "var(--green)" }}
              >
                <CheckCircle2 size={11} />
                Complete
              </motion.div>
            )}
          </div>

          <div
            ref={feedRef}
            className="space-y-0.5 max-h-52 overflow-y-auto pr-1"
            style={{ fontFamily: "ui-monospace, monospace" }}
          >
            {steps.slice(0, visibleCount).map((step, i) => (
              <StepLine
                key={i}
                step={step}
                isLast={i === visibleCount - 1}
                isRunning={i === visibleCount - 1 && !isDone}
              />
            ))}
          </div>
        </div>

        {/* evidence: revealed after investigation */}
        <AnimatePresence>
          {showEvidence && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* conclusion banner */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 mt-4 mb-3 rounded-lg p-3"
                style={{
                  background: "var(--red-glow)",
                  border: "1px solid #ff475740",
                }}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle size={13} style={{ color: "var(--red)" }} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--red)" }}>
                      Root cause identified — {finalConf}% confidence
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text)" }}>
                      <span style={{ color: "var(--blue)" }}>{bug.introduced_by}</span> deployed{" "}
                      <span style={{ color: "var(--text)" }}>{bug.pr}</span> at{" "}
                      {new Date(bug.committed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                      — causing <span style={{ color: "var(--red)" }}>{fmt(bug.revenue_lost_usd)}</span> in lost revenue.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* GitHub evidence */}
              <EvidenceSection
                icon={<GitCommit size={12} style={{ color: "var(--blue)" }} />}
                label="GitHub"
                color="var(--blue)"
                delay={0}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded font-mono"
                      style={{
                        background: "#4dabf720",
                        color: "var(--blue)",
                        border: "1px solid #4dabf730",
                      }}
                    >
                      {bug.pr}
                    </span>
                    <span className="text-sm font-medium">{bug.introduced_by}</span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {bug.commit}
                  </p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1">
                      <span style={{ color: "#2ed573" }}>+45</span> /{" "}
                      <span style={{ color: "var(--red)" }}>-12</span>
                    </span>
                    <span>{bug.project} · main</span>
                    <span>{new Date(bug.committed_at).toLocaleString()}</span>
                  </div>
                </div>
              </EvidenceSection>

              {/* Slack evidence */}
              <EvidenceSection
                icon={<MessageSquare size={12} style={{ color: "var(--green)" }} />}
                label={`Slack #incidents · ${slackMsgs.length} messages`}
                color="var(--green)"
                delay={0.1}
              >
                <SlackPreview messages={slackMsgs} />
              </EvidenceSection>

              {/* Stripe evidence */}
              <EvidenceSection
                icon={<DollarSign size={12} style={{ color: "var(--purple)" }} />}
                label="Stripe — Revenue Impact"
                color="var(--purple)"
                delay={0.2}
              >
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Failed charges", value: bug.failed_payments.toString(), color: "var(--red)" },
                    { label: "Revenue lost", value: fmt(bug.revenue_lost_usd), color: "var(--red)" },
                    { label: "Users affected", value: `~${bug.affected_users.toLocaleString()}`, color: "var(--orange)" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-lg p-2.5 text-center"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                    >
                      <p className="text-base font-bold" style={{ color: m.color }}>
                        {m.value}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {m.label}
                      </p>
                    </div>
                  ))}
                </div>
              </EvidenceSection>

              {/* Timeline */}
              {chartData.length > 0 && (
                <EvidenceSection
                  icon={<Zap size={12} style={{ color: "var(--orange)" }} />}
                  label="Timeline Correlation"
                  color="var(--orange)"
                  delay={0.3}
                >
                  <div className="flex gap-3 mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--red)" }} />
                      Error spike
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--orange)" }} />
                      Payment failures
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={100}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                      <defs>
                        <linearGradient id="pErrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff4757" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="pPayGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ffa502" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ffa502" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        tick={{ fill: "var(--text-muted)", fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        interval={5}
                      />
                      <YAxis hide />
                      <Tooltip content={<MiniTooltip />} />
                      <Area type="monotone" dataKey="Errors" stroke="#ff4757" strokeWidth={1.5} fill="url(#pErrGrad)" dot={false} />
                      <Area type="monotone" dataKey="Payments" stroke="#ffa502" strokeWidth={1.5} fill="url(#pPayGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </EvidenceSection>
              )}

              <div className="h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* scanning placeholder when not done */}
        {!showEvidence && (
          <div className="px-4 py-6 flex flex-col items-center justify-center gap-2">
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs text-center"
              style={{ color: "var(--text-dim)" }}
            >
              Evidence will surface as investigation progresses...
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function EvidenceSection({
  icon,
  label,
  color,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="mx-4 mb-3 rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 cursor-pointer text-left"
        style={{
          background: "var(--surface)",
          borderBottom: open ? "1px solid var(--border)" : undefined,
        }}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: color + "18" }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium flex-1" style={{ color }}>
          {label}
        </span>
        {open ? (
          <ChevronUp size={12} style={{ color: "var(--text-muted)" }} />
        ) : (
          <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-3 py-3"
              style={{ background: "var(--surface-2)" }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
