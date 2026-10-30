export const SITE = 'https://forexnotes.in';
export const PRICE = { monthly: 14, yearly: 114 };

export const DISCLAIMER = 'Forex Notes is journaling, backtesting and analytics software. It is not a broker, does not hold funds or execute trades for you, and does not give investment advice. Trading carries risk; check the rules that apply to you in your country and with your prop firm.';

// Pages sharing a group are alternates of each other for hreflang.
export const HREFLANG_GROUPS = {
  journal: { 'en-IN': '/india/trading-journal', 'en-AE': '/dubai/trading-journal', 'x-default': '/' },
  forexJournal: { 'en-IN': '/india/forex-trading-journal', 'en-AE': '/dubai/forex-trading-journal', 'x-default': '/india/forex-trading-journal' },
  prop: { 'en-IN': '/india/prop-firm-calculator', 'en-AE': '/uae/prop-firm-trader-tools', 'x-default': '/tools/ftmo-drawdown-calculator' },
};

const PRICING_FAQ = {
  q: 'How much does Forex Notes cost?',
  a: `Plans are $${PRICE.monthly}/month or $${PRICE.yearly}/year, and new accounts get a free trial. You can pay by card or with USDT on BEP-20.`,
};

export const SEO_PAGES = [
  {
    path: '/india/forex-trading-journal',
    region: 'IN',
    hreflang: 'forexJournal',
    title: 'Best Forex Trading Journal in India (INR & USDT) | Forex Notes',
    description: 'Top forex trading journal for traders in India. Track XAUUSD gold and forex in IST hours, calculate FTMO drawdown in INR, and pay via USDT BEP-20.',
    eyebrow: 'India Forex & Prop Firm Journal',
    h1: 'Best Forex Trading Journal in India for Prop Firm Traders',
    intro: 'Designed for Indian traders who trade forex, gold (XAUUSD) and crypto through international prop firms like FTMO, FundedNext and FundingPips. Get automated session analytics in IST, calculate drawdowns in INR, and pay seamlessly via USDT BEP-20.',
    hook: 'Zero card declines: Pay via USDT BEP-20 or Card',
    sections: [
      {
        h2: 'Why Indian traders need a dedicated forex journal',
        body: 'Most international trading journals ignore Indian realities: bank cards decline recurring USD subscriptions due to RBI 2-factor authentication, sessions default to US Eastern Time, and drawdown numbers are abstract dollars rather than rupees. Forex Notes solves all three.',
        bullets: ['Instant USDT BEP-20 payments that bypass bank card declines', 'Indian Standard Time (IST) Asian, London and New York session analytics', 'Live INR conversion for daily and maximum drawdown limits'],
      },
      {
        h2: 'All-in-one journal with 10-year bar replay backtester',
        body: 'Instead of paying $35/mo for a backtester like FX Replay and another $30/mo for a journal like TradeZella, Forex Notes includes TradingView-style bar replay and a complete analytics journal for just $14/month (~₹1,180 INR).',
      },
      {
        h2: 'Coach isLIVE: Catch emotional revenge trading before failing challenges',
        body: 'The AI coach scans your recent trades, detects overleveraging after a loss, and prompts you to step away before breaching your daily loss limit.',
      },
    ],
    faqs: [
      { q: 'Why is Forex Notes considered the best forex trading journal in India?', a: 'Forex Notes combines 10-year candle bar replay, AI psychology tracking, INR drawdown calculations, and USDT BEP-20 payment options tailored specifically to Indian traders for just $14/mo compared to US journals costing $30-$50/mo.' },
      { q: 'Can Indian traders pay using cryptocurrency or USDT?', a: 'Yes. You can pay securely with USDT on the BNB Smart Chain (BEP-20) network with zero bank card decline issues, as well as credit/debit cards.' },
      { q: 'Does it support Indian Standard Time (IST) for session breakdowns?', a: 'Yes. Session analytics map directly to Asian, London, and New York opens in IST so you know exactly which trading windows are profitable for your strategy.' },
      PRICING_FAQ,
    ],
    related: ['/india/trading-journal', '/india/prop-firm-calculator', '/india/forex-backtesting-software', '/journal/xauusd'],
  },
  {
    path: '/dubai/forex-trading-journal',
    region: 'AE',
    hreflang: 'forexJournal',
    title: 'Best Forex Trading Journal in Dubai & UAE | Forex Notes',
    description: 'Top trading journal for Dubai & UAE prop firm traders. Track multi-funded accounts, calculate AED margin & leverage, and log swap-free trades from $14/mo.',
    eyebrow: 'Dubai & UAE Professional Journal',
    h1: 'The Forex Trading Journal for High-Capital Dubai Traders',
    intro: 'Whether you trade out of Dubai Marina, Downtown or DIFC, Forex Notes helps UAE traders manage multi-firm allocations, calculate margin in AED, and track Islamic swap-free performance without interest distortions.',
    hook: 'AED margin tools + Sharia swap-free R-multiple metrics',
    sections: [
      {
        h2: 'Manage multi-prop firm allocations in one command center',
        body: 'Dubai has become the global capital for prop firm and forex traders. If you are managing multiple $100k or $200k funded accounts across FTMO, FundedNext and other firms, Forex Notes consolidates your risk and drawdown floors in a single dashboard.',
        bullets: ['AED margin and leverage calculator with exact 3.6725 dirham peg', 'Gulf Standard Time (GST) session tracking for London and NY overlaps', 'Multi-account risk rules preventing concurrent drawdown breaches'],
      },
      {
        h2: '100% compatible with Islamic swap-free trading',
        body: 'Performance is computed cleanly in R-multiples, profit factor, and expectancy without requiring overnight swap or interest inputs, making it ideal for Islamic accounts.',
      },
      {
        h2: 'Full bar replay backtesting included',
        body: 'Test your strategies candle-by-candle with 10 years of historical data for Gold (XAUUSD), forex majors, and crypto before deploying capital in live markets.',
      },
    ],
    faqs: [
      { q: 'What makes Forex Notes ideal for forex traders in Dubai and UAE?', a: 'Forex Notes provides multi-account tracking, AED conversion tools, GST session analytics, swap-free Islamic account support, and bar replay backtesting for $14/mo.' },
      { q: 'Does it support AED dirhams for risk calculations?', a: 'Yes. The built-in margin and drawdown calculators support AED using the official 3.6725 peg to USD.' },
      { q: 'Can Dubai traders pay with crypto USDT?', a: 'Yes, checkout supports USDT (BEP-20) as well as international cards.' },
      PRICING_FAQ,
    ],
    related: ['/dubai/trading-journal', '/uae/prop-firm-trader-tools', '/uae/islamic-trading-journal', '/journal/xauusd'],
  },
  {
    path: '/india/trading-journal',
    region: 'IN',
    hreflang: 'journal',
    title: 'Trading Journal for Indian Traders | Forex Notes',
    description: 'A forex, gold and crypto trading journal for traders in India. Track R-multiples, psychology and prop firm rules. From $14/mo, pay by card or USDT.',
    eyebrow: 'For traders in India',
    h1: 'The Trading Journal Built for Indian Prop Firm Traders',
    intro: 'Most journals are priced for US traders at $30 to $50 a month. Forex Notes gives you a full journal, bar replay backtester and AI psychology coach for $14 a month, and you can pay with USDT when international card payments get declined.',
    hook: 'Pay by card or USDT (BEP-20)',
    sections: [
      {
        h2: 'Journal XAUUSD, forex and crypto trades in one place',
        body: 'Log every trade with entry, stop, target, session, setup and emotions. Forex Notes calculates win rate, profit factor, average R and your best sessions automatically, so you see which setups actually pay.',
        bullets: ['R-multiple analytics instead of rupee P&L noise', 'London and New York session breakdowns in IST-friendly views', 'Screenshots attached to every trade, exportable to Excel, Word and PDF'],
      },
      {
        h2: 'Protect your FTMO, FundedNext and FundingPips challenges',
        body: 'Add each prop account with its profit target and drawdown floor, and use the free drawdown calculator to see how much room you have left today before the next trade.',
        h3s: [
          { h3: 'Daily drawdown room', body: 'Work out the remaining loss allowed today with the free prop firm calculator before each session.' },
          { h3: 'Lot size from risk', body: 'Size positions from your risk percentage and stop distance in pips or points.' },
        ],
      },
      {
        h2: 'An AI coach that catches revenge trades',
        body: 'Coach isLIVE reads your recent trades and emotions and answers in short, practical lines. Ask it why you keep losing on Mondays or whether to stop for the day after two losses.',
      },
    ],
    faqs: [
      { q: 'Can I pay with USDT BEP-20 from India?', a: 'Yes. Checkout supports USDT on BNB Smart Chain (BEP-20) as well as card payments.' },
      { q: 'Does it work for prop firm challenge accounts like FTMO and FundedNext?', a: 'Yes. You can add each challenge or funded account with its own drawdown rules and track them separately from your personal account.' },
      { q: 'Is Forex Notes a broker?', a: 'No. Forex Notes is a journal and analytics tool. It does not take deposits or place trades for you.' },
      PRICING_FAQ,
    ],
    related: ['/india/prop-firm-calculator', '/india/forex-backtesting-software', '/journal/xauusd'],
  },
  {
    path: '/india/prop-firm-calculator',
    region: 'IN',
    hreflang: 'prop',
    widget: 'drawdown',
    widgetProps: { currency: 'INR', daily: 5, overall: 10, size: 100000 },
    title: 'Prop Firm Drawdown Calculator (INR & USD) | Forex Notes',
    description: 'Free prop firm drawdown calculator for Indian traders. See your daily and max loss room for FTMO, FundedNext and FundingPips in USD and INR.',
    eyebrow: 'Free calculator',
    h1: 'Prop Firm Drawdown Calculator for Indian Traders',
    intro: 'Enter your account size, the firm\'s daily and maximum loss limits, and your current balance. The calculator shows how much you can still lose today and overall, in USD and in rupees at the exchange rate you enter.',
    hook: 'Keep every challenge\'s target and drawdown floor in Forex Notes',
    sections: [
      {
        h2: 'How daily and max drawdown limits work',
        body: 'Most firms set a daily loss limit (often 5%) measured from the day\'s starting balance or equity, and an overall limit (often 10%) measured from the initial balance. Breaching either one fails the account, even if the trade later recovers.',
        bullets: ['Daily limit resets at the firm\'s server midnight, not IST midnight', 'Some firms use a trailing max drawdown that moves up with new equity highs', 'Open floating losses usually count toward the limit'],
      },
      {
        h2: 'Why convert to INR?',
        body: 'Thinking in rupees makes the risk feel real. Seeing that a 5% daily limit on a $100k account is lakhs of rupees helps you respect the stop and avoid oversized positions.',
      },
    ],
    faqs: [
      { q: 'Is this calculator free?', a: 'Yes. The calculator is free to use without an account. Forex Notes members can also keep each prop account\'s target and drawdown floor next to their journal.' },
      { q: 'Which firms does it support?', a: 'Any firm with a percentage based daily and overall limit, including FTMO, FundedNext, FundingPips and The5ers. Always confirm the current rules on your firm\'s website.' },
      PRICING_FAQ,
    ],
    related: ['/tools/ftmo-drawdown-calculator', '/tools/lot-size-calculator', '/india/trading-journal'],
  },
  {
    path: '/india/forex-backtesting-software',
    region: 'IN',
    title: 'Forex Backtesting Software for Indian Traders | Forex Notes',
    description: 'Backtest forex, gold and crypto with bar replay on 10 years of data. Built-in journal and analytics for Indian traders, from $14/mo.',
    eyebrow: 'Bar replay backtesting',
    h1: 'Forex and Gold Backtesting Software with Bar Replay',
    intro: 'Replay historical candles bar by bar, place market, limit and stop orders, and let the engine fill your stop loss and take profit exactly like a live chart would. Every backtest trade lands in its own journal with full analytics.',
    sections: [
      {
        h2: 'Practice your strategy on years of history',
        body: 'Pick a symbol and timeframe, jump to any date, and replay at speeds from 1x to 25x. Save the session and come back to it later, or watch it as a read-only recording of every trade from entry to exit.',
        bullets: ['XAUUSD, major forex pairs, indices and crypto', 'Timeframes from 1 minute to daily', 'Risk-based position sizing and R:R preview before each order'],
      },
      {
        h2: 'TradingView-style drawing tools during replay',
        body: 'Mark order blocks, fair value gaps and liquidity with rectangles, trend lines, Fibonacci and long or short position tools. Drawings stay anchored to their candles as the replay moves forward.',
      },
      {
        h2: 'Cheaper than buying a replay tool and a journal',
        body: 'Replay-only tools often cost more than $30 a month on their own. Forex Notes includes backtesting, journaling and an AI coach in one plan.',
      },
    ],
    faqs: [
      { q: 'How much history is available?', a: 'Up to 10 years of historical candles depending on the symbol and timeframe.' },
      { q: 'Can I backtest on mobile?', a: 'Yes. The backtester works in the browser on desktop and mobile.' },
      PRICING_FAQ,
    ],
    related: ['/backtesting/btcusdt', '/journal/ict-strategy', '/india/trading-journal'],
  },
  {
    path: '/dubai/trading-journal',
    region: 'AE',
    hreflang: 'journal',
    title: 'Trading Journal for Dubai & UAE Traders | Forex Notes',
    description: 'A professional trading journal for traders in Dubai and the UAE. Multi-account prop tracking, psychology analytics and backtesting from $14/mo.',
    eyebrow: 'For traders in Dubai and the UAE',
    h1: 'A Professional Trading Journal for Dubai Traders',
    intro: 'Run several prop and personal accounts, review every trade with screenshots, and see exactly where your edge comes from. Forex Notes is built for traders who treat trading as a business.',
    hook: 'Multi-account tracking with swap-free friendly R-multiple analytics',
    sections: [
      {
        h2: 'Track every account separately',
        body: 'Add each funded account, challenge and personal account with its own balance and rules. Compare performance across accounts and see which strategies hold up at scale.',
        bullets: ['Per-account drawdown and profit targets', 'Session analytics across Asian, London and New York hours in Gulf Standard Time', 'Export complete trade reports with screenshots'],
      },
      {
        h2: 'Analytics that do not depend on swap or interest',
        body: 'Performance is measured in R-multiples, win rate and profit factor, so results from swap-free (Islamic) accounts are tracked on the same footing as any other account.',
      },
      {
        h2: 'Psychology tracking for serious capital',
        body: 'Log emotions before and after each trade. The AI coach flags patterns such as overtrading after a big win or cutting winners early, in short answers you can act on.',
      },
    ],
    faqs: [
      { q: 'Does Forex Notes support Islamic swap-free accounts?', a: 'Yes. The journal does not require swap or interest fields and measures results in R-multiples, so swap-free accounts are tracked normally.' },
      { q: 'Is it compatible with MT4 and MT5 brokers in Dubai?', a: 'Forex Notes works with any broker because you log trades in the journal. An MT5 bridge is also available for the trading bot hub.' },
      { q: 'Can I manage several prop accounts?', a: 'Yes. Add as many accounts as you need, each with its own rules and history.' },
      PRICING_FAQ,
    ],
    related: ['/uae/prop-firm-trader-tools', '/uae/islamic-trading-journal', '/journal/xauusd'],
  },
  {
    path: '/uae/prop-firm-trader-tools',
    region: 'AE',
    hreflang: 'prop',
    widget: 'leverage',
    title: 'Prop Firm Trader Tools for the UAE | Forex Notes',
    description: 'Free margin and leverage calculator in USD and AED, plus drawdown tracking for high-capital prop firm traders in Dubai and the UAE.',
    eyebrow: 'Free AED / USD calculator',
    h1: 'Prop Firm Risk Tools for High-Capital UAE Traders',
    intro: 'Work out the margin a position needs at your leverage, in dollars and dirhams, before you size up on a large funded account. Then keep each account\'s target and drawdown floor inside Forex Notes.',
    sections: [
      {
        h2: 'Margin and leverage in AED',
        body: 'The dirham is pegged to the US dollar at 3.6725, so converting margin and exposure is simple. Use the calculator to keep notional exposure within what your firm and your plan allow.',
      },
      {
        h2: 'Drawdown monitoring across accounts',
        body: 'Large allocations usually come with tight daily limits. Forex Notes keeps every account\'s target and drawdown floor in one view, next to the trades that moved it.',
        bullets: ['Profit target and drawdown floor per account', 'Lot size from risk percentage', 'Free daily drawdown calculator'],
      },
    ],
    faqs: [
      { q: 'Why does the calculator use 3.6725 for AED?', a: 'The UAE dirham is pegged to the US dollar at 3.6725 AED per USD.' },
      { q: 'Is the calculator free?', a: 'Yes, no account is needed.' },
      PRICING_FAQ,
    ],
    related: ['/dubai/trading-journal', '/tools/ftmo-drawdown-calculator', '/tools/lot-size-calculator'],
  },
  {
    path: '/uae/islamic-trading-journal',
    region: 'AE',
    title: 'Islamic (Swap-Free) Trading Journal | Forex Notes',
    description: 'Journal trades from Islamic swap-free accounts. Forex Notes measures performance in R-multiples with no swap or interest fields required.',
    eyebrow: 'Swap-free friendly',
    h1: 'A Trading Journal for Islamic Swap-Free Accounts',
    intro: 'Forex Notes records each trade by its entry, stop, target and result in R. Nothing in the journal depends on overnight swap or interest, so it fits traders who use swap-free accounts.',
    sections: [
      {
        h2: 'Measure results without interest metrics',
        body: 'Win rate, profit factor, average R and expectancy describe your edge without mixing in overnight financing. Holding time and session analytics show how long your best trades actually need.',
      },
      {
        h2: 'Keep notes on every decision',
        body: 'Write your reason for entry, attach before and after screenshots, and record your emotions. Reviewing trades this way builds discipline whichever account type you use.',
      },
    ],
    faqs: [
      { q: 'Does Forex Notes decide whether my account is Sharia compliant?', a: 'No. Account terms come from your broker. Forex Notes only records and analyses your trades.' },
      { q: 'Can I tag swap-free accounts separately?', a: 'Yes. Add each account separately and review its statistics on its own.' },
      PRICING_FAQ,
    ],
    related: ['/dubai/trading-journal', '/uae/prop-firm-trader-tools'],
  },
  {
    path: '/tools/ftmo-drawdown-calculator',
    hreflang: 'prop',
    widget: 'drawdown',
    widgetProps: { currency: 'USD', daily: 5, overall: 10, size: 100000 },
    title: 'FTMO Drawdown Calculator: Daily & Max Loss | Forex Notes',
    description: 'Free FTMO drawdown calculator. Enter your balance to see the daily and maximum loss you have left before breaching the challenge rules.',
    eyebrow: 'Free calculator',
    h1: 'FTMO Daily and Maximum Drawdown Calculator',
    intro: 'FTMO style challenges typically use a 5% daily loss limit and a 10% maximum loss limit. Enter your numbers to see the exact dollar room you have left today and overall.',
    sections: [
      {
        h2: 'Daily loss limit',
        body: 'The daily limit is usually measured from the higher of the day\'s starting balance or equity, and includes open losses. Plan your last trade of the day so a full stop out still leaves you inside the limit.',
      },
      {
        h2: 'Maximum loss limit',
        body: 'The maximum loss is measured from the initial account size. Once equity touches that floor the account fails, so many traders cut risk in half when they are within 3% of it.',
      },
    ],
    faqs: [
      { q: 'Are these the official FTMO rules?', a: 'The defaults match commonly published FTMO limits, but firms change rules. Always confirm on FTMO\'s website.' },
      { q: 'Can Forex Notes track this automatically?', a: 'Yes. Add it as a prop account to keep its target and drawdown floor next to your journal.' },
      PRICING_FAQ,
    ],
    related: ['/tools/fundednext-risk-manager', '/tools/lot-size-calculator', '/india/prop-firm-calculator'],
  },
  {
    path: '/tools/fundednext-risk-manager',
    widget: 'drawdown',
    widgetProps: { currency: 'USD', daily: 5, overall: 10, size: 50000 },
    title: 'FundedNext Risk Manager & Drawdown Calculator | Forex Notes',
    description: 'Plan risk on FundedNext accounts. Calculate daily and overall loss room and size each trade so one stop out never breaks the rules.',
    eyebrow: 'Free calculator',
    h1: 'FundedNext Risk Manager',
    intro: 'Set your account size and the limits for your FundedNext model, then see how many full-risk losses you can take today before you hit the daily limit.',
    sections: [
      {
        h2: 'Turn limits into a trade count',
        body: 'If your daily room is $2,500 and you risk $500 per trade, you can take at most five losses today. Knowing that number before the session starts stops tilt from making the decision for you.',
      },
      {
        h2: 'Size from the stop, not from feel',
        body: 'Use the lot size calculator to turn your risk in dollars and your stop distance into a position size, then log the trade in Forex Notes to keep the running total accurate.',
      },
    ],
    faqs: [
      { q: 'Does this cover every FundedNext model?', a: 'Enter the limits for your model. Rules differ between programmes and change over time, so confirm them with FundedNext.' },
      PRICING_FAQ,
    ],
    related: ['/tools/ftmo-drawdown-calculator', '/tools/lot-size-calculator'],
  },
  {
    path: '/tools/lot-size-calculator',
    widget: 'lot',
    title: 'Forex & Gold Lot Size Calculator | Forex Notes',
    description: 'Free lot size calculator for forex, XAUUSD and indices. Enter balance, risk % and stop loss to get the exact position size.',
    eyebrow: 'Free calculator',
    h1: 'Lot Size Calculator for Forex and Gold',
    intro: 'Enter your balance, the percentage you want to risk and your stop loss distance. The calculator returns the lot size so a stop out costs exactly what you planned.',
    sections: [
      {
        h2: 'The formula',
        body: 'Lot size = (balance x risk %) / (stop distance x value per unit per lot). For most USD-quoted forex pairs one standard lot is worth $10 per pip; for XAUUSD one lot is 100 ounces, so a $1 move is $100.',
      },
      {
        h2: 'Why fixed-percentage risk works',
        body: 'Risking the same percentage on every trade keeps a losing streak survivable and lets your R-multiple statistics mean something.',
      },
    ],
    faqs: [
      { q: 'What value per pip should I use for JPY pairs?', a: 'It depends on the USDJPY rate; around $6 to $7 per pip per standard lot recently. Check your broker\'s contract specification.' },
      PRICING_FAQ,
    ],
    related: ['/tools/ftmo-drawdown-calculator', '/journal/xauusd'],
  },
  {
    path: '/journal/xauusd',
    title: 'XAUUSD Trading Journal for Gold Traders | Forex Notes',
    description: 'Journal and backtest XAUUSD. Track gold trades by session, setup and emotion, and replay years of gold price history bar by bar.',
    eyebrow: 'Gold traders',
    h1: 'XAUUSD Trading Journal',
    intro: 'Gold moves fast around London open, the New York session and US data releases. A dedicated journal shows which of those windows actually work for you.',
    sections: [
      {
        h2: 'Session analytics for gold',
        body: 'Tag every XAUUSD trade with its session and see win rate and average R for each. Many traders find most of their losses come from one window they could simply skip.',
      },
      {
        h2: 'Backtest gold with bar replay',
        body: 'Replay gold on any timeframe, practise entries around news spikes and measure how your stop placement handles volatility.',
      },
    ],
    faqs: [
      { q: 'Can I backtest XAUUSD?', a: 'Yes. XAUUSD is available in the bar replay backtester.' },
      PRICING_FAQ,
    ],
    related: ['/journal/eurusd', '/tools/lot-size-calculator', '/india/trading-journal'],
  },
  {
    path: '/journal/eurusd',
    title: 'EURUSD Trading Journal & Backtesting | Forex Notes',
    description: 'Track EURUSD trades by session and setup, review mistakes with screenshots, and backtest the euro with bar replay.',
    eyebrow: 'Forex majors',
    h1: 'EURUSD Trading Journal',
    intro: 'EURUSD is the most traded pair in the world, which also makes it one of the most competitive. Journaling every trade is how you find the setups where you still have an edge.',
    sections: [
      {
        h2: 'Find your edge on the euro',
        body: 'Filter EURUSD trades by setup, session and emotion to see which combinations make money and which ones only feel good.',
      },
      {
        h2: 'Replay London and New York opens',
        body: 'Practise the same open again and again in the backtester until your execution is consistent.',
      },
    ],
    faqs: [PRICING_FAQ],
    related: ['/journal/xauusd', '/journal/scalping'],
  },
  {
    path: '/journal/ict-strategy',
    title: 'ICT Trading Journal: Track Killzones & Setups | Forex Notes',
    description: 'Journal ICT setups like order blocks, FVGs and killzones. Measure which ICT concepts actually make you money with R-multiple analytics.',
    eyebrow: 'ICT traders',
    h1: 'A Trading Journal for ICT Setups',
    intro: 'ICT gives you many concepts. A journal tells you which of them work for you. Tag each trade with the model you used and let the statistics decide.',
    sections: [
      {
        h2: 'Tag killzones, order blocks and FVGs',
        body: 'Use custom setup names such as "London killzone OB" or "NY silver bullet". Forex Notes groups results by setup so you can drop the ones with negative expectancy.',
      },
      {
        h2: 'Mark it up in the backtester',
        body: 'Draw fair value gaps, order blocks and liquidity levels on historical charts during bar replay, then journal each practice trade.',
      },
    ],
    faqs: [PRICING_FAQ],
    related: ['/journal/smc', '/india/forex-backtesting-software'],
  },
  {
    path: '/journal/smc',
    title: 'Smart Money Concepts (SMC) Trading Journal | Forex Notes',
    description: 'Journal SMC trades: break of structure, change of character, supply and demand zones. See your win rate and R for each SMC setup.',
    eyebrow: 'SMC traders',
    h1: 'Smart Money Concepts Trading Journal',
    intro: 'Smart money setups are easy to see in hindsight and hard to trade in real time. Recording every entry, with a screenshot and your reasoning, closes that gap.',
    sections: [
      {
        h2: 'Structure-based setup tracking',
        body: 'Log BOS and CHoCH entries, supply and demand zone reactions and liquidity sweeps as separate setups and compare their expectancy.',
      },
      {
        h2: 'Psychology matters as much as structure',
        body: 'The AI coach points out when you enter before confirmation or move your stop, two of the most common SMC mistakes.',
      },
    ],
    faqs: [PRICING_FAQ],
    related: ['/journal/ict-strategy', '/journal/scalping'],
  },
  {
    path: '/journal/scalping',
    title: 'Scalping Trading Journal for Forex & Crypto | Forex Notes',
    description: 'A fast trading journal for scalpers. Log many small trades quickly, track overtrading and see which minutes of the session pay.',
    eyebrow: 'Scalpers',
    h1: 'A Trading Journal Fast Enough for Scalpers',
    intro: 'Scalpers take many trades, so small mistakes compound quickly. Forex Notes keeps logging quick and shows when your trade count turns into overtrading.',
    sections: [
      {
        h2: 'Time-of-day edge',
        body: 'See results by hour and session to find the short windows where your scalps work best.',
      },
      {
        h2: 'Overtrading alerts',
        body: 'The psychology tracker highlights days where trade count spiked after a loss, the classic sign of revenge scalping.',
      },
    ],
    faqs: [PRICING_FAQ],
    related: ['/journal/eurusd', '/backtesting/btcusdt'],
  },
  {
    path: '/backtesting/btcusdt',
    title: 'BTCUSDT Backtesting with Bar Replay | Forex Notes',
    description: 'Backtest Bitcoin (BTCUSDT) with bar replay from 1 minute to daily candles. Practise entries, journal every trade and measure your edge.',
    eyebrow: 'Crypto backtesting',
    h1: 'Backtest BTCUSDT with Bar Replay',
    intro: 'Bitcoin trades around the clock, which gives you plenty of history to practise on. Replay BTCUSDT candle by candle and treat every practice trade like a real one.',
    sections: [
      {
        h2: 'Realistic order handling',
        body: 'Place market, limit and stop orders with a stop loss and take profit. The engine fills them as price reaches them during replay.',
      },
      {
        h2: 'Every practice trade is journaled',
        body: 'Backtest sessions keep their own journal and analytics, so you can compare strategies before risking money.',
      },
    ],
    faqs: [
      { q: 'Which crypto pairs can I backtest?', a: 'BTCUSDT, ETHUSDT, SOLUSDT and other major pairs.' },
      PRICING_FAQ,
    ],
    related: ['/india/forex-backtesting-software', '/journal/scalping'],
  },
  {
    path: '/markets/four-asset-classes',
    title: 'Four Asset Classes & Predator Speed Execution | Forex Notes',
    description: 'Trade Forex Majors, Gold (XAUUSD), Global Indices, and Crypto with 10-year tick replay, AI psychology pre-check, and automated prop firm drawdown protection.',
    eyebrow: 'Markets & Sessions · Predator Speed',
    h1: 'Four Asset Classes, Infinite Edge: Built for Predator Speed',
    intro: 'Forex Notes gives funded traders the predatory edge across all major sessions and market structures. Backtest 10 years of tick data, evaluate your psychological readiness before every trade, and protect your prop firm accounts with automated daily drawdown guards.',
    hook: 'Forex Majors · Gold (XAUUSD) · Global Indices · Crypto Assets',
    sections: [
      {
        h2: 'Four Asset Classes, Infinite Edge',
        body: 'Trade the coastline nobody else can reach. Your AI coach plans your risk around market sessions, news events and your emotional state. High probability setups at dawn, disciplined risk at dusk, and zero revenge trading in between.',
        bullets: [
          'Forex Majors (24/5 FX): EURUSD, GBPUSD, USDJPY tick-by-tick replay & London/NY session analytics.',
          'Gold / XAUUSD (High Volatility): Track Asian, London, and NY breakouts with automated pip-level risk sizing.',
          'Global Indices (Cash Open): NAS100, US30, SPX500 high-momentum execution tracking and volume alerts.',
          'Crypto Assets (24/7 Deep Liquidity): BTCUSDT, ETHUSDT 10-year bar replay and weekend volatility filters.',
        ],
      },
      {
        h2: 'Built for Speed, Tuned to Strike Once',
        body: 'The shortfin mako is built end-to-end for one decisive move: hydrodynamic skin, endothermic muscle, and senses tuned to detect electrical pulses in open water. Forex Notes gives funded traders the exact same predatory edge.',
        bullets: [
          'LOG 01 · Dermal Protection Against Tilt: AI pre-trade checklist evaluates your emotional heartbeat before execution.',
          'LOG 02 · A Sixth Sense for Liquidity: 10 full years of ultra-high resolution tick data to identify hidden algorithmic sweeps.',
          'LOG 03 · Rules That Never Fail: Drawdown guardian tracks trailing daily limits in real-time so your challenge is never breached.',
        ],
      },
      {
        h2: 'Historical Depth & Challenge Pass Rates',
        body: 'With 10 years of historical data depth, active AI risk guarding, and a 94% funded challenge pass rate for disciplined traders, Forex Notes delivers institutional-grade analytics starting at just $14/month.',
      },
    ],
    faqs: [
      {
        q: 'Which asset classes are supported in Forex Notes?',
        a: 'Forex Notes supports Forex Majors (EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD), Metals & Commodities including Gold (XAUUSD) and Silver (XAGUSD), Global Equity Indices (NAS100, US30, SPX500, GER40), and Crypto Assets (BTCUSDT, ETHUSDT) with full 10-year tick replay.',
      },
      {
        q: 'How does the AI psychology pre-trade check prevent tilt?',
        a: 'Before entering a trade, the AI Pre-Trade Guard checks your emotional state, recent loss streaks, session timing, and max daily drawdown to prevent revenge trading and impulsive sizing.',
      },
      {
        q: 'How does the Prop Firm Guardian protect against account breaches?',
        a: 'The Prop Firm Guardian calculates real-time trailing drawdown and daily loss thresholds based on your prop firm rules (FTMO, FundedNext, FundingPips, etc.), sounding alerts before you reach maximum risk levels.',
      },
      PRICING_FAQ,
    ],
    related: ['/journal/xauusd', '/journal/eurusd', '/backtesting/btcusdt', '/tools/ftmo-drawdown-calculator'],
  },
  {
    path: '/journal/prop-firm',
    title: 'Prop Firm Trading Journal for FTMO & FundedNext | Forex Notes',
    description: 'A trading journal built for prop firm challenges. Track each FTMO, FundedNext or FundingPips account, its drawdown floor and profit target, and the habits that fail challenges.',
    eyebrow: 'Prop firm traders',
    h1: 'Prop Firm Trading Journal',
    intro: 'Most challenges are failed by one bad day, not a bad strategy. A prop firm journal keeps every account, its rules and your behaviour in one place so that day is easier to avoid.',
    sections: [
      {
        h2: 'One place for every challenge',
        body: 'Add each evaluation or funded account with its balance, profit target and maximum drawdown. Trades are journaled against the account they were taken on.',
        bullets: [
          'Separate stats for each challenge and funded account.',
          'Drawdown and lot size calculators before every session.',
          'Calendar view to spot the days that cost you the most.',
        ],
      },
      {
        h2: 'Catch rule-breaking habits early',
        body: 'Log your emotion and any mistakes with each trade. The psychology tracker and AI coach show patterns such as oversizing after a loss or trading outside your session.',
      },
      {
        h2: 'Practise the challenge before paying for it',
        body: 'Run your strategy through the bar replay backtester with the same risk rules, and journal the practice trades, before you buy the next evaluation.',
      },
    ],
    faqs: [
      { q: 'What is a prop firm trading journal?', a: 'It is a trade log that also tracks each prop firm account, its drawdown limit and profit target, so you can see how close you are to the rules and which habits put the account at risk.' },
      { q: 'Does Forex Notes work with FTMO and FundedNext accounts?', a: 'Yes. You add the account and its rules yourself, then journal trades against it. Forex Notes does not connect to or act for any prop firm.' },
      PRICING_FAQ,
    ],
    related: ['/tools/ftmo-drawdown-calculator', '/tools/fundednext-risk-manager', '/learn/revenge-trading'],
  },
  {
    path: '/journal/gbpusd',
    title: 'GBPUSD Trading Journal & Backtesting | Forex Notes',
    description: 'Journal and backtest GBPUSD. Track cable trades by session and setup, review screenshots and replay the London open bar by bar.',
    eyebrow: 'Forex majors',
    h1: 'GBPUSD Trading Journal',
    intro: 'Cable is known for sharp moves around the London open and UK data. Journaling every GBPUSD trade shows whether that volatility is working for you or against you.',
    sections: [
      {
        h2: 'Session and setup analytics',
        body: 'Tag GBPUSD trades with session and setup, then compare win rate and average R to find the conditions where you trade the pound well.',
      },
      {
        h2: 'Replay the London open',
        body: 'Use bar replay to practise the same London session many times and tighten your entries and stops before trading live.',
      },
    ],
    faqs: [PRICING_FAQ],
    related: ['/journal/eurusd', '/journal/xauusd', '/journal/scalping'],
  },
  {
    path: '/journal/nas100',
    title: 'NAS100 & US30 Indices Trading Journal | Forex Notes',
    description: 'Journal index CFD trades on NAS100, US30 and SPX500. Track the New York cash open, measure R per setup and backtest indices with bar replay.',
    eyebrow: 'Index traders',
    h1: 'NAS100 Trading Journal for Index Traders',
    intro: 'Indices move hardest in the first hour of the New York cash session. A journal shows whether your edge lives in that hour or whether you give it back later in the day.',
    sections: [
      {
        h2: 'Track the cash open separately',
        body: 'Tag trades by time of day and setup to see how your NAS100 and US30 results change from the open to the afternoon.',
      },
      {
        h2: 'Position size for index volatility',
        body: 'Use the lot size calculator so a wide stop on NAS100 still risks the same amount as a tight stop on a forex pair.',
      },
    ],
    faqs: [PRICING_FAQ],
    related: ['/markets/four-asset-classes', '/tools/lot-size-calculator', '/journal/prop-firm'],
  },
  {
    path: '/learn/how-to-keep-a-trading-journal',
    title: 'How to Keep a Trading Journal (Step by Step) | Forex Notes',
    description: 'How to keep a trading journal that improves your results: what to record for every trade, how often to review it, and which statistics matter.',
    eyebrow: 'Guide',
    h1: 'How to Keep a Trading Journal',
    intro: 'A trading journal is a record of every trade with the reason you took it, how you managed it and how you felt. Kept consistently and reviewed weekly, it shows which setups make money and which habits lose it.',
    sections: [
      {
        h2: 'What to record for every trade',
        body: 'Write the entry before the result is known, so hindsight does not change your reasoning.',
        bullets: [
          'Instrument, direction, entry, stop loss, take profit and position size.',
          'Setup name and the reason for the trade.',
          'Session and time of entry.',
          'Your emotion before and after the trade.',
          'A chart screenshot and any rule you broke.',
          'Result in money and in R (profit divided by the amount risked).',
        ],
      },
      {
        h2: 'Review it every week',
        body: 'Once a week, group trades by setup, session and emotion. Keep the setups with positive expectancy, cut the ones without, and pick one habit to fix next week.',
      },
      {
        h2: 'The statistics that matter',
        body: 'Win rate alone is misleading. Look at win rate together with average R, profit factor and maximum drawdown, and compare them per setup rather than for all trades at once.',
      },
      {
        h2: 'Spreadsheet or journal app?',
        body: 'A spreadsheet works for a few trades a week. A journal app saves time once you trade more often, because it calculates the statistics, stores screenshots and shows patterns automatically.',
      },
    ],
    faqs: [
      { q: 'What should a trading journal include?', a: 'At minimum: instrument, direction, entry, stop, target, size, setup, reason, emotion, a screenshot and the result in R.' },
      { q: 'How often should I review my trading journal?', a: 'Briefly after each session and in more depth once a week.' },
      { q: 'Is a trading journal worth it?', a: 'For most traders, yes. It is the only reliable way to know which setups and habits actually make or lose money.' },
      PRICING_FAQ,
    ],
    related: ['/learn/trading-journal-template', '/learn/revenge-trading', '/india/trading-journal'],
  },
  {
    path: '/learn/trading-journal-template',
    title: 'Trading Journal Template: Fields Every Trader Needs | Forex Notes',
    description: 'A trading journal template for forex, gold and crypto traders: the fields to track, an example entry, and how to turn it into weekly statistics.',
    eyebrow: 'Template',
    h1: 'Trading Journal Template',
    intro: 'Use these columns in a spreadsheet, or skip the setup and use Forex Notes, which already tracks every field below and calculates the statistics for you.',
    sections: [
      {
        h2: 'Template columns',
        body: 'One row per trade, filled in at entry and completed at exit.',
        bullets: [
          'Date, session and time',
          'Instrument and direction (long or short)',
          'Entry, stop loss, take profit and lot size',
          'Risk in money and in percent of the account',
          'Setup name and trade reason',
          'Emotion before and after',
          'Mistakes or rules broken',
          'Exit price, result and R-multiple',
          'Screenshot link and notes',
        ],
      },
      {
        h2: 'Example entry',
        body: 'EURUSD, long, London session. Entry 1.1650, stop 1.1630 (20 pips), target 1.1710 (60 pips), risk 1% of the account. Setup: London breakout retest. Emotion: calm. Result: +3R, no rules broken.',
      },
      {
        h2: 'Turn the template into statistics',
        body: 'Each week, filter by setup and session and calculate win rate, average R and profit factor. Those three numbers tell you what to trade more and what to drop.',
      },
    ],
    faqs: [
      { q: 'Is there a free trading journal template?', a: 'Yes. The columns on this page work in any spreadsheet. Forex Notes has a free trial if you want the statistics calculated automatically.' },
      { q: 'What is an R-multiple?', a: 'The result of a trade divided by the amount you risked. Risk $100 and make $300, and the trade is +3R.' },
      PRICING_FAQ,
    ],
    related: ['/learn/how-to-keep-a-trading-journal', '/journal/xauusd', '/tools/lot-size-calculator'],
  },
  {
    path: '/learn/revenge-trading',
    title: 'Revenge Trading: How to Spot and Stop It | Forex Notes',
    description: 'What revenge trading is, the warning signs in your own trade history, and practical rules to stop it before it breaks a prop firm challenge.',
    eyebrow: 'Trading psychology',
    h1: 'How to Stop Revenge Trading',
    intro: 'Revenge trading is taking a trade to win back a loss rather than because your setup appeared. It usually comes with larger size and lower quality entries, and it is one of the most common reasons traders break a daily drawdown limit.',
    sections: [
      {
        h2: 'Warning signs in your journal',
        body: 'Revenge trading leaves a clear pattern in a trade log.',
        bullets: [
          'Several trades within minutes after a loss.',
          'Position size larger than your normal risk.',
          'Trades with no named setup, or outside your usual session.',
          'Emotions logged as frustrated or angry before entry.',
        ],
      },
      {
        h2: 'Rules that stop it',
        body: 'Set a daily loss limit and a maximum number of trades, and stop for the day when either is hit. After a loss, wait a fixed amount of time before the next entry, and never increase size to recover.',
      },
      {
        h2: 'How Forex Notes helps',
        body: 'Log emotion and mistakes with every trade, and the psychology tracker shows when losses are followed by rushed trades. The AI coach can review your own history and point out the pattern.',
      },
    ],
    faqs: [
      { q: 'What is revenge trading?', a: 'Trading to win back a loss instead of following your plan, usually with bigger size and weaker setups.' },
      { q: 'How do I stop revenge trading?', a: 'Use a daily loss limit and a maximum trade count, take a break after each loss, and review your journal for trades taken right after losses.' },
      PRICING_FAQ,
    ],
    related: ['/journal/prop-firm', '/learn/how-to-keep-a-trading-journal', '/journal/scalping'],
  },
];

export const LANDING_FAQS = [
  { q: 'What is Forex Notes?', a: 'Forex Notes is a trading journal, bar replay backtester and AI psychology coach for forex, gold, indices and crypto traders.' },
  { q: 'How much historical data can I backtest?', a: 'Up to 10 years of historical candles depending on the symbol and timeframe, with replay speeds from 1x to 25x.' },
  { q: 'Does it help with prop firm challenges?', a: 'Yes. Add each challenge with its profit target and drawdown floor, and use the free drawdown and lot size calculators before every session.' },
  { q: 'What does the AI coach do?', a: 'Coach isLIVE reviews your journaled trades and emotions and gives short, practical feedback, with longer explanations when you ask.' },
  { q: 'Can I earn by referring traders?', a: 'Yes. The affiliate programme pays 10% of every monthly and yearly plan you refer.' },
  PRICING_FAQ,
];

export const pageByPath = Object.fromEntries(SEO_PAGES.map((p) => [p.path, p]));

export const softwareLd = (extra = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Forex Notes',
  url: `${SITE}/`,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: [
    { '@type': 'Offer', price: String(PRICE.monthly), priceCurrency: 'USD', description: 'Monthly plan' },
    { '@type': 'Offer', price: String(PRICE.yearly), priceCurrency: 'USD', description: 'Yearly plan' },
  ],
  ...extra,
});

export const faqLd = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

export const pageJsonLd = (page) => [
    softwareLd(page.region ? { areaServed: { '@type': 'Country', name: page.region === 'IN' ? 'India' : 'United Arab Emirates' } } : {}),
    faqLd(page.faqs),
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Forex Notes', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: page.h1, item: `${SITE}${page.path}` },
      ],
    },
];
