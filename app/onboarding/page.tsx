"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";

// ─── step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  {
    id: "sentry",
    label: "Sentry",
    icon: "⬡",
    iconColor: "#e03c31",
    bgColor: "rgba(224,60,49,0.1)",
    borderColor: "rgba(224,60,49,0.3)",
    title: "Connect Sentry",
    desc: "BugCost reads your fatal error events and incident history.",
    fieldLabel: "Sentry Auth Token",
    fieldPlaceholder: "sntrys_xxxxxxxxxxxxxxxxxxxx",
    fieldHint: "Settings → Account → API Tokens → Create New Token",
    mockValid: (v: string) => v.length >= 8,
  },
  {
    id: "github",
    label: "GitHub",
    icon: "⬡",
    iconColor: "#4dabf7",
    bgColor: "rgba(77,171,247,0.1)",
    borderColor: "rgba(77,171,247,0.3)",
    title: "Connect GitHub",
    desc: "BugCost reads your deployment history and commit metadata.",
    fieldLabel: "GitHub Personal Access Token",
    fieldPlaceholder: "ghp_xxxxxxxxxxxxxxxxxxxx",
    fieldHint: "Settings → Developer Settings → Personal Access Tokens → Generate new",
    mockValid: (v: string) => v.length >= 8,
  },
  {
    id: "stripe",
    label: "Stripe",
    icon: "⬡",
    iconColor: "#bf5af2",
    bgColor: "rgba(191,90,242,0.1)",
    borderColor: "rgba(191,90,242,0.3)",
    title: "Connect Stripe",
    desc: "BugCost reads failed charges to calculate revenue impact per bug.",
    fieldLabel: "Stripe Secret Key",
    fieldPlaceholder: "sk_live_xxxxxxxxxxxxxxxxxxxx",
    fieldHint: "Dashboard → Developers → API Keys → Secret key",
    mockValid: (v: string) => v.length >= 8,
  },
];

// ─── syncing screen ───────────────────────────────────────────────────────────

const SYNC_STEPS = [
  { text: "Connecting to Coral query engine...",         delay: 0 },
  { text: "Running sentry.issues → fatal errors...",    delay: 0.9 },
  { text: "Joining github.commits → deploy history...", delay: 1.8 },
  { text: "Joining stripe.charges → failed payments...",delay: 2.7 },
  { text: "Calculating revenue impact per bug...",       delay: 3.6 },
  { text: "Building your dashboard...",                  delay: 4.4 },
];

function SyncScreen({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(0);

  useState(() => {
    SYNC_STEPS.forEach((s, i) => {
      setTimeout(() => setVisible(i + 1), s.delay * 1000 + 400);
    });
    setTimeout(onDone, 5800);
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
        maxWidth: 440,
        width: "100%",
      }}
    >
      {/* spinner ring */}
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "var(--red)",
            borderRightColor: "rgba(255,59,92,0.3)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 8,
            borderRadius: "50%",
            background: "rgba(255,59,92,0.1)",
            border: "1px solid rgba(255,59,92,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Shield size={20} color="var(--red)" />
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>
          Analyzing your stack
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Running Coral SQL JOINs across your connected sources…
        </p>
      </div>

      {/* progress steps */}
      <div
        style={{
          width: "100%",
          borderRadius: 12,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          padding: "16px 18px",
          fontFamily: "ui-monospace, monospace",
        }}
      >
        {SYNC_STEPS.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: i < visible ? 1 : 0 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "5px 0",
              borderBottom:
                i < SYNC_STEPS.length - 1 ? "1px solid var(--border)" : undefined,
            }}
          >
            {i < visible - 1 ? (
              <CheckCircle2 size={12} color="var(--green)" />
            ) : i === visible - 1 ? (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.7, repeat: Infinity }}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "var(--orange)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--border)", flexShrink: 0 }} />
            )}
            <span
              style={{
                fontSize: 11,
                color: i <= visible - 1 ? "var(--text)" : "var(--text-dim)",
                transition: "color 0.3s",
              }}
            >
              {s.text}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── main onboarding ──────────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const currentStep = STEPS[step];
  const allConnected = STEPS.every((s) => connected[s.id]);

  const handleConnect = async () => {
    const val = values[currentStep.id] ?? "";
    if (!currentStep.mockValid(val)) {
      setError("Please enter a valid API key to continue.");
      return;
    }
    setError("");
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1400));
    setConnected((prev) => ({ ...prev, [currentStep.id]: true }));
    setConnecting(false);
    if (step < STEPS.length - 1) {
      setTimeout(() => setStep((s) => s + 1), 600);
    }
  };

  const handleFinish = () => {
    setSyncing(true);
  };

  if (syncing) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <SyncScreen onDone={() => router.push("/dashboard")} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* bg glow */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 400, height: 250, background: "radial-gradient(ellipse, rgba(10,132,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* logo */}
      <div
        onClick={() => router.push("/")}
        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36, cursor: "pointer" }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,59,92,0.15)", border: "1px solid rgba(255,59,92,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={13} color="var(--red)" />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>BugCost</span>
      </div>

      {/* progress dots */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {STEPS.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <motion.div
              animate={{
                background: connected[s.id]
                  ? "var(--green)"
                  : i === step
                  ? "var(--blue-bright)"
                  : "var(--border)",
                scale: i === step ? 1.2 : 1,
              }}
              style={{ width: 8, height: 8, borderRadius: "50%" }}
            />
            {i < STEPS.length - 1 && (
              <div style={{ width: 32, height: 1, background: connected[s.id] ? "var(--green)" : "var(--border)", transition: "background 0.4s" }} />
            )}
          </div>
        ))}
      </div>

      {/* step card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          style={{
            width: "100%",
            maxWidth: 460,
            borderRadius: 16,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
            overflow: "hidden",
          }}
        >
          {/* step header */}
          <div
            style={{
              padding: "22px 24px 18px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: currentStep.bgColor,
                  border: `1px solid ${currentStep.borderColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  color: currentStep.iconColor,
                }}
              >
                {currentStep.icon}
              </div>
              <div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                  Step {step + 1} of {STEPS.length}
                </p>
                <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {currentStep.title}
                </h2>
              </div>
              {connected[currentStep.id] && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ marginLeft: "auto" }}>
                  <CheckCircle2 size={20} color="var(--green)" />
                </motion.div>
              )}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {currentStep.desc}
            </p>
          </div>

          {/* step body */}
          <div style={{ padding: "24px" }}>
            {connected[currentStep.id] ? (
              /* connected state */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: "20px",
                  borderRadius: 12,
                  background: "rgba(48,209,88,0.07)",
                  border: "1px solid rgba(48,209,88,0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <CheckCircle2 size={20} color="var(--green)" />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>
                    {currentStep.label} connected successfully
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    BugCost has read access to your {currentStep.label} data.
                  </p>
                </div>
              </motion.div>
            ) : (
              /* input state */
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>
                  {currentStep.fieldLabel}
                </label>
                <input
                  type="password"
                  placeholder={currentStep.fieldPlaceholder}
                  value={values[currentStep.id] ?? ""}
                  onChange={(e) => {
                    setValues((prev) => ({ ...prev, [currentStep.id]: e.target.value }));
                    setError("");
                  }}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 9,
                    background: "var(--surface-2)",
                    border: `1px solid ${error ? "var(--red)" : "var(--border)"}`,
                    color: "var(--text)",
                    fontSize: 13,
                    fontFamily: "ui-monospace, monospace",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                    marginBottom: 6,
                  }}
                  onFocus={e => !error && (e.target.style.borderColor = "var(--blue-bright)")}
                  onBlur={e => !error && (e.target.style.borderColor = "var(--border)")}
                />
                {error ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <AlertCircle size={11} color="var(--red)" />
                    <p style={{ fontSize: 11, color: "var(--red)" }}>{error}</p>
                  </div>
                ) : (
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {currentStep.fieldHint}
                  </p>
                )}
              </div>
            )}

            {/* action button */}
            {!connected[currentStep.id] && (
              <button
                onClick={handleConnect}
                disabled={connecting}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 16px",
                  borderRadius: 9,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: connecting ? "not-allowed" : "pointer",
                  background: currentStep.iconColor,
                  border: "none",
                  color: "#fff",
                  opacity: connecting ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {connecting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                    />
                    Connecting to {currentStep.label}...
                  </>
                ) : (
                  <>Connect {currentStep.label} <ArrowRight size={14} /></>
                )}
              </button>
            )}

            {/* navigation */}
            {connected[currentStep.id] && (
              <div style={{ display: "flex", gap: 8 }}>
                {step < STEPS.length - 1 ? (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 16px",
                      borderRadius: 9,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: "var(--blue-bright)",
                      border: "none",
                      color: "#fff",
                    }}
                  >
                    Next: {STEPS[step + 1].label} <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleFinish}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 16px",
                      borderRadius: 9,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: "var(--green)",
                      border: "none",
                      color: "#fff",
                      boxShadow: "0 0 24px rgba(48,209,88,0.3)",
                    }}
                  >
                    Launch BugCost <ArrowRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Connected sources summary */}
      <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
        {STEPS.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <motion.div
              animate={{ background: connected[s.id] ? "var(--green)" : "var(--border)" }}
              style={{ width: 6, height: 6, borderRadius: "50%" }}
            />
            <span style={{ fontSize: 11, color: connected[s.id] ? "var(--green)" : "var(--text-muted)" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 16, textAlign: "center", maxWidth: 340 }}>
        Your API keys are stored locally and never leave your machine. Powered by Coral.
      </p>
    </div>
  );
}
