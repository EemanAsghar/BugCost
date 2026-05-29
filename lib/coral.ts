import { spawn } from "child_process";
import { runCoralQuery, getTimelineForBug, type BugRow } from "./coralQuery";

// ─── The actual Coral SQL cross-source JOIN ───────────────────────────────────
// This query runs via `coral sql` against real Sentry, GitHub, and Stripe.
// When credentials are not configured it falls back to the local JSONL demo data.

// Column names verified against live Coral schema introspection:
//   sentry.issues  → id, title, level, first_seen, count, project
//   github.commits → sha, author__login, commit__message, commit__author__date, pull_number
//   stripe.charges → id, amount, status, created
export const CORAL_SQL = `
SELECT
  s.id,
  s.title                               AS bug,
  s.project,
  s.count                               AS occurrences,
  s.first_seen,
  g.author__login                       AS introduced_by,
  g.commit__message                     AS commit,
  g.sha                                 AS commit_id,
  g.pull_number                         AS pr,
  g.commit__author__date                AS committed_at,
  COUNT(p.id)                           AS failed_payments,
  CAST(SUM(CAST(p.amount AS DOUBLE)) / 100.0 AS DOUBLE) AS revenue_lost_usd
FROM   sentry.issues   s
JOIN   github.commits  g
    ON CAST(g.commit__author__date AS TIMESTAMP)
           <= CAST(s.first_seen AS TIMESTAMP)
   AND CAST(g.commit__author__date AS TIMESTAMP)
           >= CAST(s.first_seen AS TIMESTAMP) - INTERVAL '2 hours'
JOIN   stripe.charges  p
    ON CAST(p.created AS TIMESTAMP) >= CAST(s.first_seen AS TIMESTAMP)
   AND p.status = 'failed'
WHERE  s.level = 'fatal'
GROUP  BY s.id, s.title, s.project, s.count, s.first_seen,
          g.author__login, g.commit__message, g.sha,
          g.pull_number, g.commit__author__date
ORDER  BY revenue_lost_usd DESC
`.trim();

export type CoralMode = "live" | "demo";

export interface CoralResult {
  results: BugRow[];
  mode: CoralMode;
  elapsed_ms: number;
  error?: string;
}

// ─── run Coral CLI ────────────────────────────────────────────────────────────

function spawnCoral(sql: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("coral", ["sql", "--format", "json", sql], {
      timeout: 20000,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => reject(err));
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `coral exited with code ${code}`));
    });
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: Record<string, any>, index: number): BugRow {
  const revenue = Number(row.revenue_lost_usd ?? 0);
  // Coral sentry.issues uses `count`; our mock uses `occurrences`/`times_seen`
  const occurrences = Number(row.occurrences ?? row.count ?? row.times_seen ?? 0);
  // Coral github.commits uses pull_number (int); format as "PR #N"
  const pr = row.pr
    ? String(row.pr).startsWith("PR") ? row.pr : `PR #${row.pr}`
    : "";
  return {
    id:              row.id ?? `SENTRY-${String(index + 1).padStart(3, "0")}`,
    bug:             row.bug ?? row.title ?? "",
    culprit:         row.culprit ?? row.project ?? "production",
    project:         row.project ?? "production",
    occurrences,
    introduced_by:   row.introduced_by ?? row.author__login ?? row.author ?? "unknown",
    commit:          row.commit ?? row.commit__message ?? "",
    commit_id:       row.commit_id ?? row.sha ?? "",
    pr,
    committed_at:    row.committed_at ?? row.commit__author__date ?? row.first_seen ?? "",
    first_seen:      row.first_seen ?? "",
    failed_payments: Number(row.failed_payments ?? 0),
    revenue_lost_usd: revenue,
    affected_users:  Math.floor(occurrences * 0.03),
    tags:            {},
  };
}

// ─── public API ───────────────────────────────────────────────────────────────

export async function runInvestigation(): Promise<CoralResult> {
  const t0 = Date.now();

  try {
    const raw = await spawnCoral(CORAL_SQL);
    const rows = JSON.parse(raw) as Record<string, unknown>[];

    const results = rows
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r, i) => mapRow(r as Record<string, any>, i))
      .sort((a, b) => b.revenue_lost_usd - a.revenue_lost_usd);

    return { results, mode: "live", elapsed_ms: Date.now() - t0 };
  } catch (err) {
    // Coral failed (auth error, not installed, network issue) — use demo data
    const results = runCoralQuery();
    return {
      results,
      mode: "demo",
      elapsed_ms: Date.now() - t0,
      error: err instanceof Error ? err.message.split("\n")[0] : String(err),
    };
  }
}

export { getTimelineForBug };
