import { runInvestigation, CORAL_SQL } from "@/lib/coral";

export async function GET() {
  try {
    const { results, mode, elapsed_ms, error } = await runInvestigation();
    return Response.json({
      results,
      mode,           // "live" = real Coral query, "demo" = JSONL fallback
      elapsed_ms,
      coral_sql: CORAL_SQL,
      query_source: mode === "live" ? "coral_live" : "coral_demo_mode",
      ...(error ? { coral_error: error } : {}),
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
