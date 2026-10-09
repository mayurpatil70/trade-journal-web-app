export const FOREX_NOTES = {
  name: "Forex Notes",
  monthly: 14,
  yearly: 114,
};

const ROWS = [
  ["pricing", "Pricing & billing"],
  ["backtesting", "Bar replay & backtesting"],
  ["journal", "Trade journal & win-rate / profit factor analytics"],
  ["psychology", "Psychology tracking (emotions, mistakes, AI coach)"],
  ["propFirm", "Prop-firm risk tools (drawdown, lot size)"],
  ["markets", "Markets"],
  ["payments", "Payment options"],
  ["ux", "Interface"],
];

const OURS = {
  pricing: { text: "$14/mo or $114/yr", ok: true },
  backtesting: { text: "Built-in bar replay with saved sessions", ok: true },
  journal: { text: "Automated stats, equity curve, calendar", ok: true },
  psychology: { text: "Emotion logging, mistakes, AI coach", ok: true },
  propFirm: { text: "Drawdown and lot size calculators", ok: true },
  markets: { text: "Forex, crypto, indices, gold", ok: true },
  payments: { text: "Card + USDT (BEP-20)", ok: true },
  ux: { text: "Fast dark UI, mobile friendly", ok: true },
};

export const COMPETITORS = {
  "fx-replay": {
    name: "FX Replay",
    monthlyApprox: 35,
    weakness: "pricing",
    title: "FX Replay Alternative With a Built-in Journal | Forex Notes",
    description: "Looking for an FX Replay alternative? Forex Notes combines bar replay backtesting, a trade journal and psychology tracking from $14/mo.",
    h1: "The FX Replay alternative that also journals your trades",
    hook: "Why pay for replay alone? Backtest, journal and review your psychology in one place.",
    them: {
      pricing: { text: "Recurring subscription, replay-focused", ok: false },
      backtesting: { text: "Market replay", ok: true },
      journal: { text: "Limited, separate tool needed", ok: false },
      psychology: { text: "Not a focus", ok: false },
      propFirm: { text: "Prop-firm simulation", ok: true },
      markets: { text: "Forex, indices, crypto", ok: true },
      payments: { text: "Card", ok: false },
      ux: { text: "Replay-first interface", ok: true },
    },
  },
  tradezella: {
    name: "TradeZella",
    monthlyApprox: 29,
    weakness: "pricing",
    title: "TradeZella Alternative for Forex & Crypto | Forex Notes",
    description: "A TradeZella alternative with journaling, backtesting and an AI psychology coach. Plans from $14/mo with USDT payments supported.",
    h1: "A lighter, cheaper TradeZella alternative",
    hook: "Journal, backtest and fix your trading psychology without a premium price tag.",
    them: {
      pricing: { text: "Higher monthly plans", ok: false },
      backtesting: { text: "Replay on higher tiers", ok: true },
      journal: { text: "Full-featured journal", ok: true },
      psychology: { text: "Tags and notes", ok: true },
      propFirm: { text: "Limited", ok: false },
      markets: { text: "Stocks, futures, forex, crypto", ok: true },
      payments: { text: "Card", ok: false },
      ux: { text: "Feature-rich", ok: true },
    },
  },
  "traders-casa": {
    name: "Traders Casa",
    monthlyApprox: null,
    weakness: "features",
    title: "Traders Casa Alternative: Journal + Backtesting | Forex Notes",
    description: "Comparing Traders Casa? Forex Notes gives you backtesting, journaling, prop-firm tools and an AI coach from $14/mo, with crypto payments.",
    h1: "Everything unlocked: a Traders Casa alternative",
    hook: "Analytics, backtesting and prop-firm tools in every plan, not behind upgrades.",
    them: {
      pricing: { text: "Tiered plans", ok: false },
      backtesting: { text: "Sessions limited by tier", ok: false },
      journal: { text: "Journal analytics", ok: true },
      psychology: { text: "Basic", ok: false },
      propFirm: { text: "Prop-firm focus", ok: true },
      markets: { text: "Forex, indices", ok: true },
      payments: { text: "Card", ok: false },
      ux: { text: "Standard", ok: true },
    },
  },
  tradesviz: {
    name: "TradesViz",
    monthlyApprox: null,
    weakness: "ux",
    title: "TradesViz Alternative With a Clean UI | Forex Notes",
    description: "Want a simpler TradesViz alternative? Forex Notes is a clean, fast trading journal and backtester for forex and crypto from $14/mo.",
    h1: "A clean, simple TradesViz alternative",
    hook: "All the stats that matter, none of the spreadsheet clutter.",
    them: {
      pricing: { text: "Free and paid tiers", ok: true },
      backtesting: { text: "Simulator available", ok: true },
      journal: { text: "Very deep analytics", ok: true },
      psychology: { text: "Tags", ok: false },
      propFirm: { text: "Limited", ok: false },
      markets: { text: "Stocks, options, forex, crypto", ok: true },
      payments: { text: "Card", ok: false },
      ux: { text: "Dense, steep learning curve", ok: false },
    },
  },
};

export const comparisonRows = (slug) =>
  ROWS.map(([key, label]) => ({ key, label, ours: OURS[key], theirs: COMPETITORS[slug].them[key] }));

export const SECTIONS = [
  {
    h2: "Journal and backtester under one roof",
    body: "Replay historical candles, place trades with SL and TP, then review them alongside your live journal. No exports between two subscriptions.",
  },
  {
    h2: "Built for prop-firm evaluations",
    body: "Size positions with the lot size calculator, keep daily drawdown in view, and spot rule-breaking habits before they cost you a challenge.",
  },
  {
    h2: "Psychology tracking that actually changes behaviour",
    body: "Log emotions before and after each trade, track recurring mistakes, and ask the AI coach about your own data.",
  },
];

export const faqs = (name) => [
  {
    q: `Is Forex Notes an alternative to ${name}?`,
    a: `Yes. Forex Notes covers trade journaling, bar replay backtesting, psychology tracking and prop-firm risk tools in one app, so it can replace ${name} for most forex and crypto traders.`,
  },
  {
    q: `How does Forex Notes pricing compare to ${name}?`,
    a: `Forex Notes costs $${FOREX_NOTES.monthly}/month or $${FOREX_NOTES.yearly}/year with every feature included. Check ${name}'s website for their current pricing.`,
  },
  {
    q: "Can I backtest and journal my trades in the same platform?",
    a: "Yes. Backtest sessions and your live trade journal live in the same account, with analytics for both.",
  },
  {
    q: "Does Forex Notes support crypto and prop-firm challenge rules?",
    a: "Yes. You can journal and backtest crypto pairs, and use the drawdown and lot size calculators to stay within prop-firm rules. You can also pay with USDT (BEP-20).",
  },
];
