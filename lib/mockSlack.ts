export interface SlackMessage {
  user: string;
  avatar: string;
  time: string;
  text: string;
  isBot?: boolean;
}

export const SLACK_MESSAGES: Record<string, SlackMessage[]> = {
  "SENTRY-001": [
    { user: "sarah-chen", avatar: "SC", time: "14:48", text: "🚨 payments are failing on checkout — getting reports from 3 enterprise customers" },
    { user: "mike-torres", avatar: "MT", time: "14:51", text: "stripe dashboard confirming it. 50+ failed charges in the last 5 min, revenue drop is steep" },
    { user: "sarah-chen", avatar: "SC", time: "14:53", text: "pretty sure it's my pricing engine refactor from PR #142. rolling back now" },
    { user: "deploy-bot", avatar: "🤖", time: "14:54", text: "🔄 Rollback initiated: storefront v2.4.1 → v2.4.0", isBot: true },
    { user: "alex-kim", avatar: "AK", time: "14:55", text: "rollback working, error rate coming down" },
    { user: "cto", avatar: "CTO", time: "15:02", text: "revenue impact estimate? getting pinged by 2 enterprise accounts" },
    { user: "mike-torres", avatar: "MT", time: "15:04", text: "~280 failed charges so far, $8,400 estimated. writing post-mortem now" },
  ],
  "SENTRY-002": [
    { user: "mike-torres", avatar: "MT", time: "09:15", text: "🚨 stripe integration is broken — charges failing with 'amount cannot be zero'" },
    { user: "alex-kim", avatar: "AK", time: "09:18", text: "checking the stripe API version upgrade I pushed this morning..." },
    { user: "alex-kim", avatar: "AK", time: "09:22", text: "found it — stripe-node v12 changed how the amount field is handled. reverting" },
    { user: "deploy-bot", avatar: "🤖", time: "09:25", text: "🔄 Rollback: payments-service v1.3.2 → v1.3.1", isBot: true },
    { user: "mike-torres", avatar: "MT", time: "09:31", text: "rollback complete, payments resuming. 106 failed charges, ~$3,200 impact" },
  ],
  "SENTRY-003": [
    { user: "priya-nair", avatar: "PN", time: "16:33", text: "users getting kicked mid-checkout. sessions expiring way too fast?" },
    { user: "alex-kim", avatar: "AK", time: "16:36", text: "Redis cluster migration went out at 15:45 — TTL config is probably wrong" },
    { user: "priya-nair", avatar: "PN", time: "16:40", text: "confirmed. sessions expiring in 30s instead of 30min. config patch incoming" },
    { user: "deploy-bot", avatar: "🤖", time: "16:45", text: "🔧 Config patch: session.ttl 30s → 1800s deployed", isBot: true },
  ],
  "SENTRY-004": [
    { user: "james-wu", avatar: "JW", time: "11:23", text: "🚨 auth is down — users can't log in, 401s everywhere" },
    { user: "priya-nair", avatar: "PN", time: "11:26", text: "jsonwebtoken 8.5 → 9.0 changed verify signature. that's the chore commit I pushed" },
    { user: "james-wu", avatar: "JW", time: "11:28", text: "rolling it back now" },
    { user: "deploy-bot", avatar: "🤖", time: "11:32", text: "✅ auth-service reverted to jsonwebtoken 8.5", isBot: true },
  ],
  "SENTRY-005": [
    { user: "sarah-chen", avatar: "SC", time: "08:08", text: "negative order totals appearing at checkout. coupon math is broken" },
    { user: "james-wu", avatar: "JW", time: "08:12", text: "percentage coupons >100% are creating negative totals. disabling the feature flag" },
    { user: "deploy-bot", avatar: "🤖", time: "08:15", text: "🚩 Feature flag 'percentage_coupons' disabled in production", isBot: true },
  ],
  "SENTRY-006": [
    { user: "mike-torres", avatar: "MT", time: "20:48", text: "checkout is hanging — inventory check timing out on every request" },
    { user: "james-wu", avatar: "JW", time: "20:52", text: "added a 5s timeout but default was already 5000ms. the new code is re-setting it wrong" },
    { user: "deploy-bot", avatar: "🤖", time: "20:58", text: "🔧 inventory.timeout_ms corrected → 3000ms", isBot: true },
  ],
  "SENTRY-007": [
    { user: "alex-kim", avatar: "AK", time: "13:14", text: "stripe webhooks failing verification. was the signing secret rotated?" },
    { user: "mike-torres", avatar: "MT", time: "13:17", text: "yes I rotated it but forgot to update the env var. fixing now" },
    { user: "deploy-bot", avatar: "🤖", time: "13:22", text: "✅ STRIPE_WEBHOOK_SECRET updated in production env", isBot: true },
  ],
  "SENTRY-008": [
    { user: "alex-kim", avatar: "AK", time: "10:34", text: "Redis cache corrupting data — looks like a key collision in the cluster" },
    { user: "priya-nair", avatar: "PN", time: "10:38", text: "concurrent requests hitting the same key. the namespace prefixing I added has a race condition" },
    { user: "alex-kim", avatar: "AK", time: "10:45", text: "hotfix deployed with proper key isolation" },
    { user: "deploy-bot", avatar: "🤖", time: "10:47", text: "✅ Cache key isolation patch live", isBot: true },
  ],
};
