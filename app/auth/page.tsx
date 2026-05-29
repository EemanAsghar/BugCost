"use client";

import { useState } from "react";
import { SignIn, SignUp } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

export default function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");

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
      {/* background glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 300,
          background:
            "radial-gradient(ellipse at center, rgba(255,59,92,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* logo */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => router.push("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 32,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "rgba(255,59,92,0.15)",
            border: "1px solid rgba(255,59,92,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Shield size={15} color="var(--red)" />
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>
          BugCost
        </span>
      </motion.div>

      {/* mode toggle */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          display: "flex",
          marginBottom: 20,
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        {(["signup", "signin"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "9px 24px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              color: mode === m ? "#fff" : "var(--text-muted)",
              background: mode === m ? "var(--red)" : "transparent",
              transition: "all 0.2s",
            }}
          >
            {m === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </motion.div>

      {/* Clerk components */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {mode === "signup" ? (
          <SignUp
            routing="hash"
            forceRedirectUrl="/onboarding"
            signInUrl="/auth"
          />
        ) : (
          <SignIn
            routing="hash"
            forceRedirectUrl="/dashboard"
            signUpUrl="/auth"
          />
        )}
      </motion.div>
    </div>
  );
}
