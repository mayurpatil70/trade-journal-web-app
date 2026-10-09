# Forex Notes SEO strategy (issue #14)

Goal: top-3 Google rankings for high-intent trading journal, backtesting and prop-firm queries within 3 to 6 months.
Site: `https://forexnotes.in` (React + Vite SPA on Vercel, public routes prerendered at build time).

What is already shipped is marked **live**. Everything else is the plan.

## Module 1: Keyword matrix

Difficulty is an estimate from SERP make-up (big SaaS and media sites = High). Verify volumes in Search Console / Ahrefs once data comes in.

### 1. Transactional (BOFU)

| Keyword | Intent | Difficulty | Target page |
|---|---|---|---|
| best forex trading journal | compare and buy | High | `/` |
| trading journal app | buy | High | `/` |
| forex backtesting software | buy | Med | `/india/forex-backtesting-software`, `/` |
| bar replay backtesting | buy | Med | `/backtesting/btcusdt`, `/` |
| crypto backtesting platform | buy | Med | `/backtesting/btcusdt` |
| prop firm trade tracker | buy | Low | `/tools/ftmo-drawdown-calculator` |
| trading journal with AI | buy | Low | `/` |
| gold trading journal | buy | Low | `/journal/xauusd` |

### 2. Competitor interception (**live**: `/vs/*`)

| Keyword | Difficulty | Target page |
|---|---|---|
| tradezella alternative / tradezella alternatives | Med | `/vs/tradezella` |
| tradezella vs free journal | Low | `/vs/tradezella` |
| fx replay alternative / fx replay free alternative | Low | `/vs/fx-replay` |
| fx replay vs tradingview replay | Low | `/vs/fx-replay` |
| tradesviz alternative | Low | `/vs/tradesviz` |
| traders casa review / alternatives | Low | `/vs/traders-casa` |
| edgewonk alternative | Low | next: `/vs/edgewonk` |

### 3. Problem-aware (MOFU / TOFU)

| Keyword | Intent | Difficulty | Target page |
|---|---|---|---|
| how to calculate max daily drawdown | learn + tool | Low | `/tools/ftmo-drawdown-calculator` |
| lot size calculator gold | tool | Med | `/tools/lot-size-calculator` |
| how to track trading psychology | learn | Low | next: `/learn/trading-psychology` |
| why am I revenge trading | learn | Low | next: `/learn/revenge-trading` |
| trading journal template excel vs app | compare | Low | next: `/learn/trading-journal-template` |
| how to pass ftmo challenge | learn | High | next: `/learn/pass-prop-firm-challenge` |

### 4. Long tail / niche

| Keyword | Difficulty | Target page |
|---|---|---|
| ict trading journal / killzone journal | Low | `/journal/ict-strategy` |
| smc trading journal | Low | `/journal/smc` |
| scalping trading journal | Low | `/journal/scalping` |
| xauusd trading journal | Low | `/journal/xauusd` |
| eurusd backtest bar replay | Low | `/journal/eurusd` |
| fundednext drawdown calculator | Low | `/tools/fundednext-risk-manager` |

## Module 2: Competitor pages (**live**)

`/vs/fx-replay`, `/vs/tradezella`, `/vs/traders-casa`, `/vs/tradesviz` each have a title under 60 characters, a description under 155, one H1, a feature matrix, three H2 deep dives, a savings callout, FAQ and `SoftwareApplication` + `FAQPage` JSON-LD.

Trademark safety rules used on those pages and for any new one:
- Use competitor names only to identify them (nominative use). No logos, no implied partnership.
- Every factual claim (price, missing feature) must be checkable on their public site; keep the "based on public information" note and a date.
- No disparaging language. Compare features, not people.

## Module 3: Programmatic pages (**live**, data in `frontend/src/data/seoPages.js`)

| Family | URL pattern | Live examples |
|---|---|---|
| Asset | `/journal/{symbol}`, `/backtesting/{symbol}` | xauusd, eurusd, btcusdt |
| Strategy | `/journal/{strategy}` | ict-strategy, smc, scalping |
| Prop tools | `/tools/{firm}-{tool}` | ftmo-drawdown-calculator, fundednext-risk-manager, lot-size-calculator |
| Geo | `/{india,dubai,uae}/...` | see issue #16 doc |

Adding a page = adding one object to `SEO_PAGES`. The route, prerendered HTML, sitemap entry and JSON-LD are generated automatically.

Duplicate-content guard rails:
- Each page needs its own intro, at least two unique H2 sections and at least one unique FAQ. Do not ship a page that only swaps the symbol name.
- Add pages in batches of 5 to 10 and watch the Search Console "Crawled, not indexed" count before adding more.
- Pages with a working calculator or a real data element rank better than text-only pages; prefer those.

## Module 4: Structured data and metadata (**live**)

- Home: `Organization`, `SoftwareApplication` (monthly $14, yearly $114 offers) and `FAQPage`.
- Every SEO page: `SoftwareApplication` (with `areaServed` on geo pages), `FAQPage`, `BreadcrumbList`.
- Do not add `AggregateRating` until there are real, verifiable reviews on the site. Self-serving fake ratings risk a manual action.

Metadata formula:

| Page | Title (≤ 60) | Description (≤ 155) |
|---|---|---|
| Home | Forex Notes \| Backtesting, Trading Journal & AI Coach | Backtest forex, gold and crypto with bar replay on 10 years of data, journal every trade and fix your psychology with an AI coach. From $14/mo. |
| Backtest feature | {Asset} Backtesting with Bar Replay \| Forex Notes | Backtest {asset} with bar replay … journal every trade and measure your edge. |
| Journal feature | {Asset/Strategy} Trading Journal \| Forex Notes | Track {asset} trades by session, setup and emotion … |

Open Graph image: `/og-image.png` (1200x630), generated from the 3D logo.

## Module 5: Technical SEO for the Vite SPA

Live:
- `scripts/prerender-seo.mjs` runs after `vite build` and writes `dist/<route>/index.html` for every public page with the right title, description, canonical, hreflang, JSON-LD and readable content inside `#root`. Crawlers get real HTML; React replaces it on load.
- `dist/app.html` is the clean SPA shell; `vercel.json` rewrites unknown routes to it.
- App routes get `noindex, nofollow` at runtime; `robots.txt` blocks `/login` and `/verify`.
- Sitemap index `sitemap.xml` → `sitemap-pages.xml`, `sitemap-india.xml`, `sitemap-uae.xml`, all with `lastmod` and hreflang alternates.
- Hero 3D scene moved from three.js (916 kB) to a 3 kB canvas, and the 1 MB logo PNG replaced by a 25 kB WebP in the UI.

Next:
1. After deploy, confirm Vercel serves `/india/trading-journal` from its prerendered file (view-source should show the H1). If not, set `"cleanUrls": true` or `"trailingSlash": false` in `vercel.json`.
2. Self-host Inter (removes the render-blocking Google Fonts request; helps LCP).
3. Core Web Vitals for chart pages: keep chart canvases sized by CSS before data loads (CLS), keep heavy chart code route-split (already lazy), and avoid long tasks on replay ticks (INP).
4. Submit the sitemap index in Search Console and Bing Webmaster Tools.

## Module 6: Backlinks and distribution

| Channel | Action | Rules |
|---|---|---|
| Reddit (r/Forex, r/Daytrading, r/PropFirmTraders) | Answer drawdown and journaling questions with worked numbers; link the free calculator only when it answers the question | Never post bare promo links; follow each sub's self-promo rule |
| TradingView | Publish ideas and scripts (risk calculator indicator) with a profile link | Educational posts only |
| BabyPips forum | Long-form journal threads, signature link | No link drops in first posts |
| YouTube / Telegram trading educators | Free yearly plan for an honest review; affiliate code at 10% | Disclose sponsorship |
| Prop firm review sites | Submit Forex Notes as a recommended tool; offer a discount code for their readers | Ask for a "tools" page listing, not paid links |
| SaaS directories | Product Hunt, AlternativeTo (list as alternative to TradeZella, Edgewonk, FX Replay), G2, Capterra | Keep descriptions consistent |
| Digital PR | Publish anonymised data studies ("What 10,000 journaled trades say about Monday losses") | Only real aggregated data |

Avoid: paid link packages, PBNs, comment spam, link exchanges at scale.

## Measuring progress

- Weekly: Search Console impressions and average position for the tables above.
- Monthly: indexed pages vs submitted, top landing pages, trial sign-ups by landing page (`?ref` and UTM tags).
- Quarterly: prune or merge programmatic pages with no impressions after 90 days.
