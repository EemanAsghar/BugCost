import Anthropic from "@anthropic-ai/sdk";

const FALLBACK_SUMMARIES: Record<string, { summary: string; fix: string }> = {
  "SENTRY-001": {
    summary:
      "A pricing engine refactor in PR #142 introduced a null reference error when accessing the `price` property on cart items that haven't loaded yet, causing every checkout attempt to crash with a fatal TypeError. The refactor removed a null guard that previously protected against undefined cart state during the price calculation phase.",
    fix: "Add optional chaining before accessing nested price properties: `item?.price ?? 0`. Roll back PR #142 immediately and re-introduce with proper null safety.",
  },
  "SENTRY-002": {
    summary:
      "An upgrade of the stripe-node SDK from v10 to v12 changed how the `amount` field is passed to the charge creation API — v12 expects an integer in the smallest currency unit, but the codebase was passing a float, causing Stripe to reject every charge with a validation error. The breaking change was not caught in staging because the test suite mocked the Stripe client.",
    fix: "Convert amount to integer before passing to Stripe: `Math.round(amount * 100)`. Pin stripe-node to v10 until the charge utility is updated.",
  },
  "SENTRY-003": {
    summary:
      "A Redis cluster migration changed the default TTL configuration from 30 minutes to 30 seconds for cart session tokens, causing users to be silently logged out mid-checkout and losing their cart state. The misconfiguration was introduced in the migration script which set `session.ttl` in seconds instead of milliseconds.",
    fix: "Set `session.ttl = 1800000` (milliseconds) in the Redis config. Add a session health check to the deployment pipeline to catch TTL misconfigurations before they reach production.",
  },
  "SENTRY-004": {
    summary:
      "Upgrading `jsonwebtoken` from v8.5 to v9.0 introduced a breaking change in the `verify()` method signature — v9 requires an explicit algorithm option that was previously optional, causing all JWT verification to fail and throwing a fatal error on every authenticated request. The upgrade was bundled in a routine dependency chore commit without integration testing.",
    fix: "Pass `{ algorithms: ['HS256'] }` as the third argument to `jwt.verify()`. Pin jsonwebtoken to 8.5.x until all call sites are updated to the v9 API.",
  },
};

function getFallback(id: string): { summary: string; fix: string } {
  return (
    FALLBACK_SUMMARIES[id] ?? {
      summary:
        "A recent deployment introduced a regression that caused fatal errors in production, leading to failed user sessions and dropped Stripe charges. The root cause has been traced to a commit made within 2 hours of the incident start time.",
      fix: "Roll back the identified commit and add integration tests that cover the affected code path before re-deploying.",
    }
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  const { bug, introduced_by, commit, pr, revenue_lost_usd, occurrences, failed_payments, culprit, id } = body;

  // No API key → use pre-written fallback (still high quality)
  if (!process.env.ANTHROPIC_API_KEY) {
    await new Promise((r) => setTimeout(r, 800)); // realistic latency
    return Response.json({ ...getFallback(id), model: "fallback" });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system:
        "You are BugCost's AI investigator. You analyze production incidents and generate precise, technical summaries for engineering teams. Be specific, name the exact technical cause, and give an actionable fix. Never be vague.",
      messages: [
        {
          role: "user",
          content: `A fatal production bug has been identified via Coral cross-source SQL JOIN.

Bug: ${bug}
File: ${culprit}
Occurrences: ${occurrences?.toLocaleString()}
Introduced by: ${introduced_by} via ${pr}
Commit: ${commit}
Revenue lost: $${Math.round(revenue_lost_usd).toLocaleString()}
Failed Stripe charges: ${failed_payments}

Write exactly 2 sentences:
1. What technically caused this bug (be specific about the code, not vague)
2. The recommended immediate fix

Then on a new line write: FIX: [one-line actionable fix command or code snippet]`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const lines = text.trim().split("\n").filter(Boolean);
    const fixLine = lines.find((l) => l.startsWith("FIX:"));
    const summaryLines = lines.filter((l) => !l.startsWith("FIX:"));

    return Response.json({
      summary: summaryLines.join(" ").trim(),
      fix: fixLine ? fixLine.replace("FIX:", "").trim() : "",
      model: "claude-haiku-4-5",
    });
  } catch {
    return Response.json({ ...getFallback(id), model: "fallback" });
  }
}
