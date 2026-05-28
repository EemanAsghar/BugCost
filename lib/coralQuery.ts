import fs from "fs";
import path from "path";

export interface SentryIssue {
  id: string;
  title: string;
  level: string;
  first_seen: string;
  times_seen: number;
  culprit: string;
  tags: Record<string, string>;
  project: string;
}

export interface GitHubCommit {
  id: string;
  title: string;
  author: string;
  committed_at: string;
  repo: string;
  pr: string;
  branch: string;
  additions: number;
  deletions: number;
}

export interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  customer_id: string;
  failure_code: string | null;
  metadata_incident: string | null;
}

export interface BugRow {
  id: string;
  bug: string;
  culprit: string;
  project: string;
  occurrences: number;
  introduced_by: string;
  commit: string;
  commit_id: string;
  pr: string;
  committed_at: string;
  first_seen: string;
  failed_payments: number;
  revenue_lost_usd: number;
  affected_users: number;
  tags: Record<string, string>;
}

export interface TimelinePoint {
  time: string;
  errors: number;
  failures: number;
  label?: string;
}

function readJsonl<T>(filename: string): T[] {
  const filePath = path.join(process.cwd(), "data", filename);
  const lines = fs.readFileSync(filePath, "utf-8").trim().split("\n");
  return lines.map((l) => JSON.parse(l));
}

// Simulates the core Coral cross-source SQL JOIN:
//
// SELECT s.title AS bug, s.times_seen AS occurrences, g.author AS introduced_by,
//        g.title AS commit, g.committed_at, s.first_seen,
//        COUNT(p.id) AS failed_payments, SUM(p.amount) / 100.0 AS revenue_lost_usd
// FROM sentry.issues s
// JOIN github.commits g
//   ON g.committed_at <= s.first_seen
//   AND g.committed_at >= s.first_seen - INTERVAL '2 hours'
// JOIN stripe.charges p
//   ON p.created_at >= s.first_seen AND p.status = 'failed'
// WHERE s.level = 'fatal'
// GROUP BY s.title, s.times_seen, g.author, g.title, g.committed_at, s.first_seen
// ORDER BY revenue_lost_usd DESC;

export function runCoralQuery(): BugRow[] {
  const sentryIssues = readJsonl<SentryIssue>("sentry_issues.jsonl");
  const commits = readJsonl<GitHubCommit>("github_commits.jsonl");
  const charges = readJsonl<StripeCharge>("stripe_charges.jsonl");

  const results: BugRow[] = [];

  for (const issue of sentryIssues) {
    if (issue.level !== "fatal") continue;

    const firstSeen = new Date(issue.first_seen);
    const twoHoursBefore = new Date(firstSeen.getTime() - 2 * 60 * 60 * 1000);

    // JOIN github.commits ON committed_at within 2hr window before first_seen
    const matchingCommit = commits.find((c) => {
      const committedAt = new Date(c.committed_at);
      return committedAt <= firstSeen && committedAt >= twoHoursBefore;
    });

    if (!matchingCommit) continue;

    // JOIN stripe.charges ON created_at >= first_seen AND status = 'failed'
    const failedCharges = charges.filter((c) => {
      const createdAt = new Date(c.created_at);
      const threeHoursAfter = new Date(firstSeen.getTime() + 3 * 60 * 60 * 1000);
      return (
        c.status === "failed" &&
        createdAt >= firstSeen &&
        createdAt <= threeHoursAfter
      );
    });

    const revenueLost =
      failedCharges.reduce((sum, c) => sum + c.amount, 0) / 100;

    results.push({
      id: issue.id,
      bug: issue.title,
      culprit: issue.culprit,
      project: issue.project,
      occurrences: issue.times_seen,
      introduced_by: matchingCommit.author,
      commit: matchingCommit.title,
      commit_id: matchingCommit.id,
      pr: matchingCommit.pr,
      committed_at: matchingCommit.committed_at,
      first_seen: issue.first_seen,
      failed_payments: failedCharges.length,
      revenue_lost_usd: Math.round(revenueLost * 100) / 100,
      affected_users: Math.floor(issue.times_seen * 0.03),
      tags: issue.tags,
    });
  }

  return results.sort((a, b) => b.revenue_lost_usd - a.revenue_lost_usd);
}

export function getTimelineForBug(bugId: string): TimelinePoint[] {
  const sentryIssues = readJsonl<SentryIssue>("sentry_issues.jsonl");
  const charges = readJsonl<StripeCharge>("stripe_charges.jsonl");

  const issue = sentryIssues.find((i) => i.id === bugId);
  if (!issue) return [];

  const firstSeen = new Date(issue.first_seen);
  const points: TimelinePoint[] = [];

  // Generate 24 30-min buckets: 6hrs before to 6hrs after first_seen
  for (let i = -12; i <= 12; i++) {
    const bucketStart = new Date(firstSeen.getTime() + i * 30 * 60 * 1000);
    const bucketEnd = new Date(bucketStart.getTime() + 30 * 60 * 1000);

    const failures = charges.filter((c) => {
      const t = new Date(c.created_at);
      return c.status === "failed" && t >= bucketStart && t < bucketEnd;
    }).length;

    // Error count: simulated spike after first_seen
    const minutesAfter = i * 30;
    let errors = 0;
    if (minutesAfter < 0) {
      errors = Math.floor(Math.random() * 3);
    } else if (minutesAfter === 0) {
      errors = Math.floor(issue.times_seen * 0.08);
    } else if (minutesAfter <= 60) {
      errors = Math.floor(issue.times_seen * 0.12 * Math.exp(-minutesAfter / 45));
    } else {
      errors = Math.floor(Math.random() * 5);
    }

    points.push({
      time: bucketStart.toISOString(),
      errors,
      failures,
      label: i === 0 ? "⚠ Bug introduced" : undefined,
    });
  }

  return points;
}
