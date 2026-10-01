// backend/utils/tradeStats.js
// Compact journal summary that gets passed to the model as context.

const MIN_GROUP = 3;

const norm = (v) => String(v ?? "").trim().toLowerCase();
const outcome = (t) => {
  const r = norm(t.result);
  if (r === "win" || r === "loss" || r === "be") return r;
  return null;
};
const r2 = (n) => Math.round(n * 100) / 100;

function groupStats(trades, field) {
  const groups = new Map();
  for (const t of trades) {
    const key = String(t[field] ?? "").trim();
    const o = outcome(t);
    if (!key || !o) continue;
    const g = groups.get(key) ?? { name: key, trades: 0, wins: 0, losses: 0, totalR: 0 };
    g.trades += 1;
    if (o === "win") g.wins += 1;
    if (o === "loss") g.losses += 1;
    g.totalR += Number(t.r_multiple) || 0;
    groups.set(key, g);
  }
  return [...groups.values()]
    .filter((g) => g.trades >= MIN_GROUP)
    .map((g) => ({
      name: g.name,
      trades: g.trades,
      winRate: g.wins + g.losses ? Math.round((g.wins / (g.wins + g.losses)) * 100) : null,
      totalR: r2(g.totalR),
    }))
    .sort((a, b) => b.totalR - a.totalR);
}

function currentStreak(trades) {
  let kind = null;
  let count = 0;
  for (const t of trades) {
    const o = outcome(t);
    if (o === "be" || !o) continue;
    if (!kind) kind = o;
    if (o !== kind) break;
    count += 1;
  }
  return kind ? { kind, count } : null;
}

/** `trades` must be newest-first. */
export function computeStats(trades) {
  const list = Array.isArray(trades) ? trades : [];
  const decided = list.filter((t) => outcome(t));
  const wins = decided.filter((t) => outcome(t) === "win").length;
  const losses = decided.filter((t) => outcome(t) === "loss").length;
  const totalR = decided.reduce((sum, t) => sum + (Number(t.r_multiple) || 0), 0);

  const broke = decided.filter((t) => norm(t.rule_break) === "yes");
  const followed = decided.filter((t) => norm(t.rule_break) !== "yes");
  const avgR = (arr) => (arr.length ? r2(arr.reduce((s, t) => s + (Number(t.r_multiple) || 0), 0) / arr.length) : null);

  const lossEmotions = new Map();
  for (const t of decided) {
    const e = String(t.emotion_before ?? "").trim();
    if (outcome(t) === "loss" && e) lossEmotions.set(e, (lossEmotions.get(e) ?? 0) + 1);
  }
  const topLossEmotion = [...lossEmotions.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    total: list.length,
    wins,
    losses,
    breakeven: decided.length - wins - losses,
    winRate: wins + losses ? Math.round((wins / (wins + losses)) * 100) : null,
    totalR: r2(totalR),
    avgR: avgR(decided),
    streak: currentStreak(list),
    ruleBreaks: { count: broke.length, avgR: avgR(broke), followedAvgR: avgR(followed) },
    topLossEmotion: topLossEmotion ? { emotion: topLossEmotion[0], count: topLossEmotion[1] } : null,
    bySession: groupStats(decided, "session"),
    byAsset: groupStats(decided, "asset"),
    bySetup: groupStats(decided, "setup"),
    recent: list.slice(0, 5),
  };
}

export function topAssets(trades, n = 2) {
  const counts = new Map();
  for (const t of trades ?? []) {
    const a = String(t.asset ?? "").trim();
    if (a) counts.set(a, (counts.get(a) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([a]) => a);
}

const fmtGroups = (groups) =>
  groups.map((g) => `${g.name} (${g.trades} trades, ${g.winRate ?? "n/a"}% win, ${g.totalR}R)`).join("; ");

export function formatJournal(stats) {
  if (!stats || stats.total === 0) return "";

  const lines = [
    `Last ${stats.total} trades: ${stats.wins}W/${stats.losses}L/${stats.breakeven}BE, win rate ${stats.winRate ?? "n/a"}%, net ${stats.totalR}R, avg ${stats.avgR ?? "n/a"}R per trade.`,
  ];
  if (stats.streak) lines.push(`Current streak: ${stats.streak.count} ${stats.streak.kind}${stats.streak.count > 1 ? "s" : ""}.`);

  const rb = stats.ruleBreaks;
  if (rb.count) {
    lines.push(`Rule breaks: ${rb.count} trades, avg ${rb.avgR}R vs ${rb.followedAvgR ?? "n/a"}R when following rules.`);
  }
  if (stats.topLossEmotion) {
    lines.push(`Most common emotion before losses: ${stats.topLossEmotion.emotion} (${stats.topLossEmotion.count}x).`);
  }
  for (const [label, groups] of [["Sessions", stats.bySession], ["Assets", stats.byAsset], ["Setups", stats.bySetup]]) {
    if (groups.length) lines.push(`${label} (best to worst by R): ${fmtGroups(groups)}.`);
  }
  if (stats.recent.length) {
    lines.push(
      "Most recent trades: " +
        stats.recent
          .map((t) => `${t.date ?? "?"} ${t.asset ?? "?"} ${t.direction ?? ""} ${t.setup ?? ""} -> ${t.result ?? "?"} ${t.r_multiple ?? ""}R${norm(t.rule_break) === "yes" ? " [rule break]" : ""}`.replace(/\s+/g, " "))
          .join(" | "),
    );
  }
  return lines.join("\n");
}
