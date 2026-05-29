import type { BugRow } from "./coralQuery";

export interface UserCredentials {
  sentry_token: string;
  sentry_org: string;
  github_token: string;
  github_owner: string;
  github_repo: string;
  stripe_key: string;
}

// ─── Sentry ───────────────────────────────────────────────────────────────────

async function fetchSentryIssues(token: string, org: string) {
  const url = `https://sentry.io/api/0/organizations/${org}/issues/?query=is%3Aunresolved+level%3Afatal&limit=25`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Sentry ${res.status}: ${res.statusText}`);
  const issues = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return issues.map((i: any) => ({
    id: i.id,
    title: i.title,
    level: i.level,
    first_seen: i.firstSeen,
    times_seen: Number(i.count ?? i.timesSeen ?? 0),
    culprit: i.culprit ?? "",
    project: i.project?.slug ?? org,
    tags: {},
  }));
}

// ─── GitHub ───────────────────────────────────────────────────────────────────

async function fetchGitHubCommits(token: string, owner: string, repo: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${res.statusText}`);
  const commits = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return commits.map((c: any) => ({
    id: c.sha,
    title: (c.commit.message ?? "").split("\n")[0].slice(0, 120),
    author: c.commit.author?.name ?? c.author?.login ?? "unknown",
    committed_at: c.commit.author?.date ?? new Date().toISOString(),
    repo,
    pr: `${owner}/${repo}@${c.sha.slice(0, 7)}`,
    branch: "main",
    additions: 0,
    deletions: 0,
  }));
}

// ─── Stripe ───────────────────────────────────────────────────────────────────

async function fetchStripeCharges(secretKey: string) {
  const url = "https://api.stripe.com/v1/charges?limit=100";
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${encoded}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${res.statusText}`);
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.data ?? []).map((c: any) => ({
    id: c.id,
    amount: c.amount,
    currency: c.currency,
    status: c.status,
    created_at: new Date(c.created * 1000).toISOString(),
    customer_id: c.customer ?? "",
    failure_code: c.failure_code ?? null,
    metadata_incident: null,
  }));
}

// ─── JOIN (same logic as coralQuery.ts — this IS what Coral does) ─────────────

export async function runRealQuery(creds: UserCredentials): Promise<{ results: BugRow[]; sources: string[] }> {
  const sources: string[] = [];

  const [sentryIssues, commits, charges] = await Promise.all([
    fetchSentryIssues(creds.sentry_token, creds.sentry_org).then(d => { sources.push("sentry"); return d; }),
    fetchGitHubCommits(creds.github_token, creds.github_owner, creds.github_repo).then(d => { sources.push("github"); return d; }),
    fetchStripeCharges(creds.stripe_key).then(d => { sources.push("stripe"); return d; }),
  ]);

  const results: BugRow[] = [];

  for (const issue of sentryIssues) {
    if (issue.level !== "fatal") continue;

    const firstSeen = new Date(issue.first_seen);
    const twoHoursBefore = new Date(firstSeen.getTime() - 2 * 60 * 60 * 1000);

    const matchingCommit = commits.find((c: { committed_at: string }) => {
      const committedAt = new Date(c.committed_at);
      return committedAt <= firstSeen && committedAt >= twoHoursBefore;
    });

    if (!matchingCommit) continue;

    const failedCharges = charges.filter((c: { created_at: string; status: string; amount: number }) => {
      const createdAt = new Date(c.created_at);
      const threeHoursAfter = new Date(firstSeen.getTime() + 3 * 60 * 60 * 1000);
      return c.status === "failed" && createdAt >= firstSeen && createdAt <= threeHoursAfter;
    });

    const revenueLost = failedCharges.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0) / 100;

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

  return {
    results: results.sort((a, b) => b.revenue_lost_usd - a.revenue_lost_usd),
    sources,
  };
}
