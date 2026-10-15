#!/usr/bin/env node
// Daily Keyword, SEO/GEO/AEO & Marketing Tracker for Forex Notes
// Run daily to track target keywords, verify production indexing readiness,
// and get daily marketing growth actions to sell SaaS subscriptions.

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

console.log('='.repeat(75));
console.log('📈 FOREX NOTES — DAILY KEYWORD, SEO/GEO/AEO & MARKETING ENGINE');
console.log('='.repeat(75));

const TARGET_KEYWORDS = [
  // India Focus
  {
    region: 'India 🇮🇳',
    keyword: 'forex trading journal india',
    targetUrl: 'https://forexnotes.in/india/forex-trading-journal',
    intent: 'High Transactional',
    pitch: 'All-in-one journal + 10yr bar replay for $14/mo (~₹1,180) with USDT BEP-20 payments',
    competitorBeaten: 'TradeZella ($29-49/mo, credit cards decline)',
  },
  {
    region: 'India 🇮🇳',
    keyword: 'trading journal for indian traders',
    targetUrl: 'https://forexnotes.in/india/trading-journal',
    intent: 'Commercial',
    pitch: 'IST session breakdowns, R-multiple stats, and trade emotion logging',
    competitorBeaten: 'TraderSync ($30-80/mo, complex US-centric UI)',
  },
  {
    region: 'India 🇮🇳',
    keyword: 'prop firm drawdown calculator inr',
    targetUrl: 'https://forexnotes.in/india/prop-firm-calculator',
    intent: 'High Viral Utility',
    pitch: 'Free daily and max loss drawdown calculator with real-time INR conversion',
    competitorBeaten: 'Manual spreadsheets that traders miscalculate',
  },
  {
    region: 'India 🇮🇳',
    keyword: 'forex backtesting software india',
    targetUrl: 'https://forexnotes.in/india/forex-backtesting-software',
    intent: 'High Intent',
    pitch: '10 years of candle data with TradingView drawing tools and instant trade logging',
    competitorBeaten: 'FX Replay ($35/mo replay only, no journal)',
  },
  {
    region: 'India 🇮🇳',
    keyword: 'xauusd gold trading journal ist',
    targetUrl: 'https://forexnotes.in/journal/xauusd',
    intent: 'High Intent',
    pitch: 'Track Gold entries, stop losses, and London/NY opens in Indian Standard Time',
    competitorBeaten: 'General journals that don\'t isolate Gold session volatility',
  },

  // Dubai & UAE Focus
  {
    region: 'Dubai 🇦🇪',
    keyword: 'trading journal dubai',
    targetUrl: 'https://forexnotes.in/dubai/trading-journal',
    intent: 'Commercial / High Capital',
    pitch: 'Multi-account tracking for high-capital funded traders in GST time zone',
    competitorBeaten: 'TradeZella / TraderSync lack multi-account funded consolidation',
  },
  {
    region: 'Dubai 🇦🇪',
    keyword: 'forex trading journal uae',
    targetUrl: 'https://forexnotes.in/dubai/forex-trading-journal',
    intent: 'Transactional',
    pitch: 'AED margin and risk calculations with zero tax capital tracking',
    competitorBeaten: 'US-based tools with no AED dirham support',
  },
  {
    region: 'Dubai 🇦🇪',
    keyword: 'islamic trading journal swap free',
    targetUrl: 'https://forexnotes.in/uae/islamic-trading-journal',
    intent: 'Niche Domination',
    pitch: 'Pure R-multiple expectancy with zero overnight swap or interest contamination',
    competitorBeaten: 'Journals that mandate interest and financing inputs',
  },
  {
    region: 'Dubai 🇦🇪',
    keyword: 'prop firm trader tools uae',
    targetUrl: 'https://forexnotes.in/uae/prop-firm-trader-tools',
    intent: 'High Utility',
    pitch: 'Free AED margin & leverage calculator pegged at official 3.6725 dirhams/USD',
    competitorBeaten: 'Static broker tables with no interactive leverage preview',
  },

  // Competitor Conquesting
  {
    region: 'Global 🌍',
    keyword: 'tradezella alternative',
    targetUrl: 'https://forexnotes.in/vs/tradezella',
    intent: 'High Buying Intent',
    pitch: '$14/mo vs $29-49/mo, bar replay included in base tier, crypto USDT checkout',
    competitorBeaten: 'TradeZella locks replay behind higher tier',
  },
  {
    region: 'Global 🌍',
    keyword: 'tradersync alternative',
    targetUrl: 'https://forexnotes.in/vs/tradersync',
    intent: 'High Buying Intent',
    pitch: 'Modern clean UI, AI psychology coach (Coach isLIVE), $14/mo vs $80/mo',
    competitorBeaten: 'TraderSync charges extra for simulators & lacks AI coach',
  },
  {
    region: 'Global 🌍',
    keyword: 'fx replay alternative',
    targetUrl: 'https://forexnotes.in/vs/fx-replay',
    intent: 'High Buying Intent',
    pitch: 'Replay + Journal + Coach under one roof for less than half the price ($14 vs $35)',
    competitorBeaten: 'FX Replay has no real trading journal',
  },
  {
    region: 'Global 🌍',
    keyword: 'edgewonk alternative',
    targetUrl: 'https://forexnotes.in/vs/edgewonk',
    intent: 'High Buying Intent',
    pitch: 'Cloud-native, candle replay simulator, monthly billing vs $169 upfront annual',
    competitorBeaten: 'Edgewonk lacks bar replay market simulation',
  },
];

console.log('\n[1/3] TARGET KEYWORD MATRIX & CONVERSION TARGETS');
console.log('-'.repeat(75));

TARGET_KEYWORDS.forEach((k, idx) => {
  console.log(`\n${idx + 1}. [${k.region}] "${k.keyword}"`);
  console.log(`   🔗 Target URL:  ${k.targetUrl}`);
  console.log(`   🎯 Intent:      ${k.intent}`);
  console.log(`   💡 Value Prop:  ${k.pitch}`);
  console.log(`   ⚔️ Outranks:    ${k.competitorBeaten}`);
});

console.log('\n' + '-'.repeat(75));
console.log('[2/3] PRERENDERED ASSETS & SITEMAP INTEGRITY CHECK');
console.log('-'.repeat(75));

const sitemaps = ['sitemap.xml', 'sitemap-india.xml', 'sitemap-uae.xml', 'sitemap-pages.xml'];
sitemaps.forEach((sm) => {
  const p = join(distDir, sm);
  if (existsSync(p)) {
    console.log(`  ✅ dist/${sm} verified`);
  } else {
    console.log(`  ⚠️ dist/${sm} not built yet (run "npm run build")`);
  }
});

console.log('\n' + '-'.repeat(75));
console.log('[3/3] TODAY\'S MARKETING GROWTH ACTIONS (DAILY SALES ROUTINE)');
console.log('-'.repeat(75));

console.log(`
👉 ACTION 1: FREE TOOL LEAD GENERATION (India & Dubai)
   Share the free calculators in prop firm trader groups (Discord, Telegram, Reddit):
   - "Built a free prop firm drawdown calculator with live INR conversion for FTMO & FundedNext traders in India: https://forexnotes.in/india/prop-firm-calculator"
   - "For UAE traders: Free AED margin & leverage calculator with exact 3.6725 dirham peg: https://forexnotes.in/uae/prop-firm-trader-tools"

👉 ACTION 2: COMPETITOR SEARCH INTERCEPTION
   Monitor Twitter/X and Reddit (r/Forex, r/Daytrading, r/PropFirmTraders) for users complaining:
   - "TradeZella is too expensive" ➔ Reply with: "Check out https://forexnotes.in/vs/tradezella — gives you 10-year bar replay + journal + AI coach for $14/mo, and you can pay with USDT if cards decline."
   - "Looking for an FX Replay alternative" ➔ Reply with: https://forexnotes.in/vs/fx-replay

👉 ACTION 3: GOOGLE SEARCH CONSOLE DAILY ROUTINE
   1. Open Google Search Console -> Performance -> Search Results -> Queries.
   2. Filter by Countries: India or United Arab Emirates.
   3. Identify queries with high impressions but low CTR:
      - Update title tag or meta description with numbers (e.g. "$14/mo", "INR", "Free Tool") to double CTR.
   4. Submit new URLs via "URL Inspection" -> "Request Indexing".
`);

console.log('='.repeat(75));
console.log('🚀 READY TO SCALE FOREX NOTES TO #1 IN INDIA & DUBAI!');
console.log('='.repeat(75));
