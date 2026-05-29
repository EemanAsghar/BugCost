"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCommit,
  DollarSign,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2,
  Circle,
  Cpu,
} from "lucide-react";
import type { BugRow } from "@/lib/coralQuery";
import { SLACK_MESSAGES, type SlackMessage } from "@/lib/mockSlack";

// ─── types ──────────────────────────────────────────────────────────────────

type StepType = "scan" | "found" | "analyze" | "conclude";

interface Step {
  delay: number;
  type: StepType;
  source: number;
  text: string;
}

const SOURCES = [
  { label: "Sentry",  color: "#e03c31" },
  { label: "GitHub",  color: "#4dabf7" },
  { label: "Stripe",  color: "#bf5af2" },
  { label: "Slack",   color: "#30d158" },
];

const CONFIDENCE_AT = [5, 20, 28, 52, 60, 78, 84, 89, 92];

// ─── step builder ────────────────────────────────────────────────────────────

function buildSteps(bug: BugRow, slackCount: number, finalConf: number): Step[] {
  const minsApart = Math.round(
    (new Date(bug.first_seen).getTime() - new Date(bug.committed_at).getTime()) / 60000
  );
  return [
    { delay: 0.4,  type: "scan",    source: 0, text: `Querying sentry.issues WHERE level = 'fatal'...` },
    { delay: 1.2,  type: "found",   source: 0, text: `Fatal confirmed — ${bug.occurrences.toLocaleString()} occurrences in ${bug.project}` },
    { delay: 2.2,  type: "scan",    source: 1, text: `Scanning github.commits within 2-hour deploy window...` },
    { delay: 3.0,  type: "found",   source: 1, text: `Commit matched: ${bug.pr} by ${bug.introduced_by} — ${minsApart}min before incident` },
    { delay: 4.0,  type: "scan",    source: 2, text: `Joining stripe.charges ON created_at >= first_seen AND status = 'failed'...` },
    { delay: 5.0,  type: "found",   source: 2, text: `${bug.failed_payments} failed charges — $${Math.round(bug.revenue_lost_usd).toLocaleString()} revenue impact` },
    { delay: 5.9,  type: "scan",    source: 3, text: `Scanning slack.messages in #incidents...` },
    { delay: 6.8,  type: "found",   source: 3, text: `${slackCount} messages — incident escalated, rollback confirmed` },
    { delay: 7.7,  type: "analyze", source: -1, text: `Correlating deployment → error spike → payment failures...` },
    { delay: 8.8,  type: "conclude", source: -1, text: `Root cause: ${bug.introduced_by} · ${bug.pr} · ${finalConf}% confidence` },
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

function confColor(s: number) {
  if (s < 30) return "#52527a";
  if (s < 55) return "#0a84ff";
  if (s < 78) return "#ff9f0a";
  return "#ff3b5c";
}

function confLabel(s: number, done: boolean) {
  if (!done || s < 10) return "Initializing investigation...";
  if (s < 30) return "Weak signal";
  if (s < 55) return "Possible cause";
  if (s < 78) return "Probable cause";
  if (s < 88) return "High confidence";
  return "Root cause confirmed";
}

const STEP_COLORS: Record<StepType, string> = {
  scan:     "#52527a",
  found:    "#30d158",
  analyze:  "#0a84ff",
  conclude: "#ff3b5c",
};
const STEP_PREFIX: Record<StepType, string> = {
  scan:     "⟶",
  found:    "✓",
  analyze:  "◈",
  conclude: "⚑",
};

// ─── sub components ───────────────────────────────────────────────────────────

function SourceNode({
  src,
  active,
  done,
}: {
  src: (typeof SOURCES)[0];
  active: boolean;
  done: boolean;
}) {
  return (
    <motion.div
      animate={{ opacity: active || done ? 1 : 0.3 }}
      transition={{ duration: 0.35 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
    >
      <motion.div
        animate={
          active
            ? { boxShadow: [`0 0 0 ${src.color}00`, `0 0 16px ${src.color}80`, `0 0 0 ${src.color}00`] }
            : {}
        }
        transition={{ duration: 1.2, repeat: active ? Infinity : 0 }}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: done || active ? src.color + "18" : "var(--surface-3)",
          border: `1px solid ${done || active ? src.color + "60" : "var(--border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.35s",
        }}
      >
        {done ? (
          <CheckCircle2 size={12} color={src.color} />
        ) : active ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Cpu size={12} color={src.color} />
          </motion.div>
        ) : (
          <Circle size={12} color="var(--text-dim)" />
        )}
      </motion.div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: done || active ? src.color : "var(--text-dim)",
          transition: "color 0.35s",
        }}
      >
        {src.label}
      </span>
    </motion.div>
  );
}

function EvidenceBlock({
  title,
  color,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  color: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  const [open, setOpen] = useState(true);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--glass)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--glass-border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
        marginBottom: 8,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "transparent",
          cursor: "pointer",
          borderBottom: open ? "1px solid var(--glass-border)" : undefined,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: color + "18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color, flex: 1, textAlign: "left" }}>
          {title}
        </span>
        {open ? (
          <ChevronUp size={12} color="var(--text-muted)" />
        ) : (
          <ChevronDown size={12} color="var(--text-muted)" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "12px 14px" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SlackThread({ messages }: { messages: SlackMessage[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? messages : messages.slice(0, 3);
  return (
    <div>
      {shown.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08 }}
          style={{
            display: "flex",
            gap: 8,
            padding: "6px 0",
            borderBottom: i < shown.length - 1 ? "1px solid var(--glass-border)" : undefined,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: m.isBot ? "var(--border)" : "#0a84ff18",
              color: m.isBot ? "var(--text-muted)" : "var(--blue-bright)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {m.avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: m.isBot ? "var(--text-muted)" : "var(--text)" }}>
                {m.user}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{m.time}</span>
            </div>
            <p
              style={{
                fontSize: 11,
                color: m.isBot ? "var(--text-muted)" : "var(--text)",
                lineHeight: 1.5,
                marginTop: 2,
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
          style={{
            fontSize: 11,
            color: "var(--blue-bright)",
            cursor: "pointer",
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            padding: 0,
          }}
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expanded ? "Show less" : `+${messages.length - 3} more messages`}
        </button>
      )}
    </div>
  );
}

// ─── main export ──────────────────────────────────────────────────────────────

export function AIWorkspace({
  bug,
  onPhaseChange,
}: {
  bug: BugRow;
  onPhaseChange?: (phase: number, done: boolean) => void;
}) {
  const slackMsgs = SLACK_MESSAGES[bug.id] ?? [];
  const finalConf = Math.min(
    95,
    Math.round(40 + (bug.revenue_lost_usd / 10000) * 40 + bug.failed_payments * 0.1)
  );
  const steps = buildSteps(bug, slackMsgs.length, finalConf);

  const [visible, setVisible] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [claudeSummary, setClaudeSummary] = useState<{ summary: string; fix: string; model: string } | null>(null);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(0);
    setConfidence(0);
    setIsDone(false);
    setShowEvidence(false);
    setClaudeSummary(null);
    setClaudeLoading(false);
    onPhaseChange?.(0, false);

    const timers: ReturnType<typeof setTimeout>[] = [];

    steps.forEach((step, i) => {
      const t = setTimeout(() => {
        setVisible(i + 1);
        const conf = CONFIDENCE_AT[i] ?? finalConf;
        setConfidence(conf);
        onPhaseChange?.(i + 1, false);
        if (i === steps.length - 1) {
          setTimeout(() => {
            setConfidence(finalConf);
            setIsDone(true);
            onPhaseChange?.(10, true);
            setTimeout(() => {
              setShowEvidence(true);
              // call Claude for AI summary
              setClaudeLoading(true);
              fetch("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bug),
              })
                .then((r) => r.json())
                .then((d) => setClaudeSummary(d))
                .catch(() => null)
                .finally(() => setClaudeLoading(false));
            }, 500);
          }, 700);
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
  }, [visible]);

  const cColor = confColor(confidence);
  const activeSource = visible > 0 ? (steps[visible - 1]?.source ?? -1) : -1;
  const doneSet = new Set(steps.slice(0, visible).map((s) => s.source));

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "transparent",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px 12px",
          flexShrink: 0,
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <motion.div
            animate={{ opacity: isDone ? 1 : [1, 0.3, 1] }}
            transition={{ duration: isDone ? 0 : 1.5, repeat: isDone ? 0 : Infinity }}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: isDone ? "var(--green)" : "var(--orange)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
            }}
          >
            AI Investigator
          </span>
          {isDone && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginLeft: "auto",
                fontSize: 10,
                color: "var(--green)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <CheckCircle2 size={11} />
              Complete
            </motion.span>
          )}
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--text-dim)",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {bug.id} · {bug.project}
        </p>
      </div>

      {/* Confidence */}
      <div
        style={{
          padding: "16px 20px",
          flexShrink: 0,
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 10 }}>
          <motion.span
            style={{
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1,
              color: cColor,
              transition: "color 0.6s",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {confidence}
          </motion.span>
          <span style={{ fontSize: 22, color: cColor, marginBottom: 6, transition: "color 0.6s" }}>
            %
          </span>
          <div style={{ marginBottom: 8, flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              {confLabel(confidence, isDone)}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {isDone
                ? `${fmt(bug.revenue_lost_usd)} confirmed impact`
                : "Analyzing cross-source signals..."}
            </p>
          </div>
        </div>
        {/* bar */}
        <div
          style={{
            height: 3,
            borderRadius: 2,
            background: "var(--border)",
            overflow: "hidden",
          }}
        >
          <motion.div
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              height: "100%",
              borderRadius: 2,
              background: `linear-gradient(90deg, ${cColor}88, ${cColor})`,
              boxShadow: isDone ? `0 0 10px ${cColor}60` : undefined,
            }}
          />
        </div>
      </div>

      {/* Source nodes */}
      <div
        style={{
          padding: "12px 20px",
          flexShrink: 0,
          borderBottom: "1px solid var(--glass-border)",
          background: "rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {SOURCES.map((src, i) => (
            <SourceNode
              key={src.label}
              src={src}
              active={activeSource === i}
              done={doneSet.has(i) && activeSource !== i}
            />
          ))}
        </div>
        {/* progress bar */}
        <div
          style={{
            height: 1,
            background: "var(--border)",
            marginTop: 10,
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <motion.div
            animate={{ width: `${Math.min((visible / steps.length) * 100, 100)}%` }}
            transition={{ duration: 0.4 }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #e03c31, #4dabf7, #bf5af2, #30d158)",
              opacity: 0.8,
            }}
          />
        </div>
      </div>

      {/* AI Feed */}
      <div
        style={{
          padding: "12px 20px 8px",
          flexShrink: 0,
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Zap size={11} color="var(--orange)" />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
            }}
          >
            Reasoning Feed
          </span>
        </div>

        <div
          ref={feedRef}
          style={{
            maxHeight: 180,
            overflowY: "auto",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {steps.slice(0, visible).map((step, i) => {
            const isRunning = i === visible - 1 && !isDone;
            const color = isRunning ? "var(--text)" : STEP_COLORS[step.type];
            const prefix = STEP_PREFIX[step.type];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                style={{ display: "flex", gap: 8, padding: "2px 0" }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color,
                    width: 14,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {isRunning ? (
                    <motion.span
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 0.7, repeat: Infinity }}
                    >
                      ⟶
                    </motion.span>
                  ) : (
                    prefix
                  )}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color,
                    lineHeight: 1.6,
                    fontWeight: step.type === "conclude" ? 600 : 400,
                  }}
                >
                  {step.text}
                  {isRunning && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      ▊
                    </motion.span>
                  )}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Evidence — glassmorphism cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        <AnimatePresence>
          {showEvidence ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* Claude AI Summary card */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 8,
                  background: "linear-gradient(135deg, rgba(191,90,242,0.08) 0%, rgba(10,132,255,0.05) 100%)",
                  border: "1px solid rgba(191,90,242,0.25)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: "rgba(191,90,242,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✦</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--purple)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Claude Analysis
                  </span>
                  {claudeLoading && (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--purple)", borderTopColor: "transparent", marginLeft: 4 }} />
                  )}
                  {claudeSummary && (
                    <span style={{ fontSize: 9, color: "var(--text-dim)", marginLeft: "auto" }}>
                      {claudeSummary.model === "claude-haiku-4-5" ? "claude-haiku-4-5" : "cached"}
                    </span>
                  )}
                </div>
                {claudeLoading && !claudeSummary && (
                  <motion.p animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }}>
                    Generating analysis...▊
                  </motion.p>
                )}
                {claudeSummary && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.65, marginBottom: 8 }}>
                      {claudeSummary.summary}
                    </p>
                    {claudeSummary.fix && (
                      <div style={{ padding: "8px 10px", borderRadius: 7, background: "rgba(48,209,88,0.07)", border: "1px solid rgba(48,209,88,0.2)" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Fix</p>
                        <p style={{ fontSize: 11, color: "var(--green)", fontFamily: "ui-monospace, monospace", lineHeight: 1.5 }}>{claudeSummary.fix}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>

              {/* Verdict */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 8,
                  background:
                    "linear-gradient(135deg, rgba(255,59,92,0.1) 0%, rgba(255,159,10,0.06) 100%)",
                  border: "1px solid rgba(255,59,92,0.25)",
                  boxShadow: "0 0 24px rgba(255,59,92,0.1)",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--red)",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  ⚑ Root Cause — {finalConf}% confidence
                </p>
                <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>
                  <span style={{ color: "var(--blue-bright)" }}>{bug.introduced_by}</span> deployed{" "}
                  <span style={{ color: "var(--text)" }}>{bug.pr}</span> at{" "}
                  {new Date(bug.committed_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  , causing a{" "}
                  <span style={{ color: "var(--red)", fontWeight: 600 }}>
                    {fmt(bug.revenue_lost_usd)}
                  </span>{" "}
                  revenue impact.
                </p>
              </motion.div>

              {/* GitHub */}
              <EvidenceBlock
                title="GitHub — Introducing Commit"
                color="var(--blue-bright)"
                icon={<GitCommit size={12} color="var(--blue-bright)" />}
                delay={0.1}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "#0a84ff18",
                        color: "var(--blue-bright)",
                        border: "1px solid #0a84ff30",
                        fontFamily: "ui-monospace, monospace",
                      }}
                    >
                      {bug.pr}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                      {bug.introduced_by}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {bug.commit}
                  </p>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-muted)" }}>
                    <span>
                      <span style={{ color: "#30d158" }}>+45</span> /{" "}
                      <span style={{ color: "var(--red)" }}>-12</span>
                    </span>
                    <span>{bug.project} · main</span>
                    <span>{new Date(bug.committed_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              </EvidenceBlock>

              {/* Slack */}
              <EvidenceBlock
                title={`Slack #incidents · ${slackMsgs.length} messages`}
                color="var(--green)"
                icon={<MessageSquare size={12} color="var(--green)" />}
                delay={0.2}
              >
                <SlackThread messages={slackMsgs} />
              </EvidenceBlock>

              {/* Stripe */}
              <EvidenceBlock
                title="Stripe — Revenue Impact"
                color="var(--purple)"
                icon={<DollarSign size={12} color="var(--purple)" />}
                delay={0.3}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {[
                    { label: "Charges failed", value: bug.failed_payments.toString(), color: "var(--red)" },
                    { label: "Revenue lost", value: fmt(bug.revenue_lost_usd), color: "var(--red)" },
                    { label: "Users ~affected", value: `~${bug.affected_users.toLocaleString()}`, color: "var(--orange)" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      style={{
                        borderRadius: 8,
                        padding: "10px 8px",
                        textAlign: "center",
                        background: "rgba(0,0,0,0.25)",
                        border: "1px solid var(--glass-border)",
                      }}
                    >
                      <p style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</p>
                      <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{m.label}</p>
                    </div>
                  ))}
                </div>
              </EvidenceBlock>

              <div style={{ height: 16 }} />
            </motion.div>
          ) : (
            <motion.div
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, opacity: 0.5 }}
            >
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}
              >
                Evidence surfaces as investigation progresses
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
