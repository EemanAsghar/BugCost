import { runInvestigation, CORAL_SQL } from "@/lib/coral";
import { runRealQuery, type UserCredentials } from "@/lib/realQuery";

// GET /api/investigate — always returns demo data (used by /demo page)
export async function GET() {
  try {
    const { results, mode, elapsed_ms, error } = await runInvestigation();
    return Response.json({
      results,
      mode: "demo",
      elapsed_ms,
      coral_sql: CORAL_SQL,
      query_source: "coral_demo_mode",
      ...(error ? { coral_error: error } : {}),
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/investigate — uses real credentials if provided, falls back to demo
export async function POST(req: Request) {
  const t0 = Date.now();

  try {
    const body = await req.json() as Partial<UserCredentials>;
    const hasAllCreds =
      body.sentry_token && body.sentry_org &&
      body.github_token && body.github_owner && body.github_repo &&
      body.stripe_key;

    if (hasAllCreds) {
      const { results, sources } = await runRealQuery(body as UserCredentials);

      if (results.length > 0) {
        return Response.json({
          results,
          mode: "live",
          elapsed_ms: Date.now() - t0,
          coral_sql: CORAL_SQL,
          query_source: "coral_live",
          sources,
        });
      }

      // Real query returned 0 results (no matching incidents) — still live mode
      return Response.json({
        results: [],
        mode: "live",
        elapsed_ms: Date.now() - t0,
        coral_sql: CORAL_SQL,
        query_source: "coral_live",
        sources,
        message: "No fatal incidents found with matching commits and failed charges in the last 30 days.",
      });
    }
  } catch (err) {
    // Credentials invalid or API error — fall back to demo
    const { results } = await runInvestigation();
    return Response.json({
      results,
      mode: "demo",
      elapsed_ms: Date.now() - t0,
      coral_sql: CORAL_SQL,
      query_source: "coral_demo_mode",
      error: String(err),
    });
  }

  // No credentials provided — return demo data
  const { results, elapsed_ms } = await runInvestigation();
  return Response.json({
    results,
    mode: "demo",
    elapsed_ms,
    coral_sql: CORAL_SQL,
    query_source: "coral_demo_mode",
  });
}
