"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";

// ─── fake GitHub OAuth popup ──────────────────────────────────────────────────
function GitHubOAuthModal({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"login" | "authorizing" | "done">("login");
  const [ghUser, setGhUser] = useState("");
  const [ghPass, setGhPass] = useState("");

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep("authorizing");
    await new Promise((r) => setTimeout(r, 1800));
    setStep("done");
    await new Promise((r) => setTimeout(r, 900));
    onDone();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && step === "login" && onDone()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        style={{
          width: "100%", maxWidth: 340,
          borderRadius: 14,
          background: "#0d1117",
          border: "1px solid #30363d",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
          overflow: "hidden",
        }}
      >
        {/* GitHub header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #21262d", textAlign: "center" }}>
          {/* GitHub-style octocat icon */}
          <div style={{ fontSize: 28, marginBottom: 12 }}>🐙</div>
          <p style={{ fontSize: 13, color: "#e6edf3", fontWeight: 600 }}>
            {step === "done" ? "Authorization successful" : "Sign in to GitHub"}
          </p>
          {step === "login" && (
            <p style={{ fontSize: 11, color: "#8b949e", marginTop: 4 }}>
              to authorize <strong style={{ color: "#e6edf3" }}>BugCost</strong>
            </p>
          )}
        </div>

        <div style={{ padding: "20px 24px" }}>
          <AnimatePresence mode="wait">
            {step === "login" && (
              <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3", display: "block", marginBottom: 6 }}>
                    Username or email address
                  </label>
                  <input
                    autoFocus
                    value={ghUser}
                    onChange={(e) => setGhUser(e.target.value)}
                    required
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 6,
                      background: "#0d1117", border: "1px solid #30363d",
                      color: "#e6edf3", fontSize: 13, outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#58a6ff")}
                    onBlur={e => (e.target.style.borderColor = "#30363d")}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3", display: "block", marginBottom: 6 }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={ghPass}
                    onChange={(e) => setGhPass(e.target.value)}
                    required
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 6,
                      background: "#0d1117", border: "1px solid #30363d",
                      color: "#e6edf3", fontSize: 13, outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#58a6ff")}
                    onBlur={e => (e.target.style.borderColor = "#30363d")}
                  />
                </div>
                <button type="submit"
                  style={{
                    padding: "9px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                    background: "#238636", border: "1px solid #2ea043", color: "#fff",
                    cursor: "pointer", width: "100%",
                  }}>
                  Sign in
                </button>
                <p style={{ fontSize: 11, color: "#8b949e", textAlign: "center" }}>
                  <span style={{ color: "#58a6ff", cursor: "pointer" }}>Forgot password?</span>
                </p>
              </motion.form>
            )}

            {step === "authorizing" && (
              <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: "center", padding: "12px 0" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #30363d", borderTopColor: "#238636", margin: "0 auto 14px" }}
                />
                <p style={{ fontSize: 13, color: "#e6edf3", marginBottom: 4 }}>Authorizing BugCost…</p>
                <p style={{ fontSize: 11, color: "#8b949e" }}>Checking permissions</p>

                {/* permission list */}
                <div style={{ marginTop: 18, textAlign: "left", display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Read access to commits and metadata",
                    "Read access to repository contents",
                    "Read access to pull requests",
                  ].map((perm, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.3 }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6, background: "#161b22", border: "1px solid #21262d" }}>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.3 }}>
                        <CheckCircle2 size={13} color="#2ea043" />
                      </motion.div>
                      <span style={{ fontSize: 11, color: "#8b949e" }}>{perm}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "12px 0" }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                  <CheckCircle2 size={40} color="#2ea043" style={{ margin: "0 auto 12px" }} />
                </motion.div>
                <p style={{ fontSize: 13, color: "#e6edf3", fontWeight: 600 }}>Authorization granted</p>
                <p style={{ fontSize: 11, color: "#8b949e", marginTop: 4 }}>Redirecting to BugCost…</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── main auth page ───────────────────────────────────────────────────────────
export default function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    router.push("/onboarding");
  };

  const handleGitHubDone = () => {
    setShowGitHub(false);
    router.push("/onboarding");
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative", overflow: "hidden",
    }}>
      {/* background glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)",
        width: 500, height: 300,
        background: "radial-gradient(ellipse at center, rgba(255,59,92,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* GitHub OAuth modal */}
      <AnimatePresence>
        {showGitHub && <GitHubOAuthModal onDone={handleGitHubDone} />}
      </AnimatePresence>

      {/* logo */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        onClick={() => router.push("/")}
        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40, cursor: "pointer" }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,59,92,0.15)", border: "1px solid rgba(255,59,92,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={15} color="var(--red)" />
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>BugCost</span>
      </motion.div>

      {/* card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{
          width: "100%", maxWidth: 400, borderRadius: 16,
          background: "var(--surface)", border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}>
        {/* tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {(["signup", "signin"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              style={{
                flex: 1, padding: "14px 0", fontSize: 13, fontWeight: 600,
                cursor: "pointer", background: "transparent", border: "none",
                color: mode === m ? "var(--text)" : "var(--text-muted)",
                borderBottom: mode === m ? "2px solid var(--red)" : "2px solid transparent",
                transition: "all 0.2s", marginBottom: -1,
              }}>
              {m === "signup" ? "Create account" : "Sign in"}
            </button>
          ))}
        </div>

        <div style={{ padding: "28px 28px 32px" }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>
            {mode === "signup" ? "Get started for free" : "Welcome back"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
            {mode === "signup" ? "Connect your stack and see revenue impact in minutes." : "Continue to your BugCost dashboard."}
          </p>

          {/* GitHub SSO */}
          <button
            onClick={() => setShowGitHub(true)}
            disabled={loading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, padding: "11px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              background: "var(--surface-2)", border: "1px solid var(--border-bright)",
              color: "var(--text)", marginBottom: 20, transition: "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--blue-bright)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-bright)")}
          >
            {/* octocat inline */}
            <span style={{ fontSize: 15 }}>🐙</span>
            Continue with GitHub
          </button>

          {/* divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* email form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", fontWeight: 500 }}>Full name</label>
                <input type="text" placeholder="Sarah Chen" value={name} onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "var(--blue-bright)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", fontWeight: 500 }}>Work email</label>
              <input type="email" placeholder="sarah@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                onFocus={e => (e.target.style.borderColor = "var(--blue-bright)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block", fontWeight: 500 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required
                  style={{ width: "100%", padding: "10px 40px 10px 14px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "var(--blue-bright)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                marginTop: 8, width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, padding: "12px 16px", borderRadius: 9, fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer", background: "var(--red)", border: "none",
                color: "#fff", opacity: loading ? 0.7 : 1,
              }}>
              {loading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                    style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                  {mode === "signup" ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                <>{mode === "signup" ? "Create account" : "Sign in"} <ArrowRight size={15} /></>
              )}
            </button>
          </form>
        </div>
      </motion.div>

      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 20, textAlign: "center" }}>
        By continuing you agree to our{" "}
        <span style={{ color: "var(--text)", textDecoration: "underline", cursor: "pointer" }}>Terms</span>
        {" "}and{" "}
        <span style={{ color: "var(--text)", textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>
      </p>
    </div>
  );
}
