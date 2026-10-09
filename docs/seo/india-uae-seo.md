# India and UAE SEO and acquisition plan (issue #16)

Targets: `google.co.in` and `google.ae`, English-speaking traders. Pages marked **live** ship on the `dev` branch; their content lives in `frontend/src/data/seoPages.js`.

## Module 1: Keyword clusters

### India

| Target query | Intent | Local pain point | Competition | Target URL |
|---|---|---|---|---|
| trading journal india | BOFU | US-priced journals feel expensive | Med | `/india/trading-journal` |
| forex trading journal app india | BOFU | Wants XAUUSD and FX in one place | Low | `/india/trading-journal` |
| prop firm drawdown calculator | MOFU | Fear of breaching FTMO / FundedNext daily limit | Low | `/india/prop-firm-calculator` |
| ftmo daily drawdown calculator in rupees | MOFU | Thinks in INR, account in USD | Low | `/india/prop-firm-calculator` |
| fundingpips drawdown rules | MOFU | Rule confusion | Low | `/india/prop-firm-calculator` |
| tradezella alternative cheap | BOFU | $29 to $49/month too high | Low | `/vs/tradezella` |
| pay trading software with usdt | BOFU | International card declines | Low | `/india/trading-journal` |
| gold trading journal | BOFU | XAUUSD is the most traded instrument | Low | `/journal/xauusd` |
| forex backtesting software india | BOFU | Replay tools priced in USD | Low | `/india/forex-backtesting-software` |
| crypto trading journal india | BOFU | Logging USDT trades | Low | `/india/trading-journal` (next: `/india/crypto-trading-journal`) |

### Dubai / UAE

| Target query | Intent | Local pain point | Competition | Target URL |
|---|---|---|---|---|
| trading journal dubai | BOFU | Professional tooling for larger accounts | Low | `/dubai/trading-journal` |
| prop firm tools uae | MOFU | Several high-capital accounts | Low | `/uae/prop-firm-trader-tools` |
| margin calculator aed | MOFU | Thinks in AED | Low | `/uae/prop-firm-trader-tools` |
| islamic trading journal / swap free trading journal | BOFU | Wants analytics without interest fields | Low | `/uae/islamic-trading-journal` |
| multi account trade tracker | BOFU | Many funded accounts | Med | `/dubai/trading-journal` |
| forex backtesting software dubai | BOFU | Wants institutional-feel tools | Low | next: `/uae/backtesting-software` |

## Module 2: Geo landing pages (**live**)

| URL | H1 | Hook | Widget |
|---|---|---|---|
| `/india/trading-journal` | The Trading Journal Built for Indian Prop Firm Traders | Pay by card or USDT (BEP-20) | none |
| `/india/prop-firm-calculator` | Prop Firm Drawdown Calculator for Indian Traders | Results in USD and INR | Drawdown calculator with USD/INR rate |
| `/india/forex-backtesting-software` | Forex and Gold Backtesting Software with Bar Replay | One plan instead of replay tool + journal | none |
| `/dubai/trading-journal` | A Professional Trading Journal for Dubai Traders | Multi-account, swap-free friendly analytics | none |
| `/uae/prop-firm-trader-tools` | Prop Firm Risk Tools for High-Capital UAE Traders | AED margin at the 3.6725 peg | Leverage / margin calculator (USD + AED) |
| `/uae/islamic-trading-journal` | A Trading Journal for Islamic Swap-Free Accounts | No swap or interest fields needed | none |

Each page has H2/H3 sections specific to the region, an FAQ, related links and the compliance disclaimer. Note: `forexnotes.in/dubai/...` and `/uae/...` both exist because the issue asked for both; keep new UAE pages under `/uae/`.

## Module 3: Technical geo-targeting (**live**)

hreflang groups (in `HREFLANG_GROUPS`), output both in the prerendered HTML and in the sitemaps:

```html
<link rel="alternate" hreflang="en-IN" href="https://forexnotes.in/india/trading-journal" />
<link rel="alternate" hreflang="en-AE" href="https://forexnotes.in/dubai/trading-journal" />
<link rel="alternate" hreflang="x-default" href="https://forexnotes.in/" />
```

The prop group pairs `/india/prop-firm-calculator`, `/uae/prop-firm-trader-tools` and `/tools/ftmo-drawdown-calculator` (x-default).

Sitemaps: `sitemap.xml` (index) → `sitemap-india.xml`, `sitemap-uae.xml`, `sitemap-pages.xml`, regenerated on every build with `lastmod` and `xhtml:link` alternates. `robots.txt` lists all three.

Social previews: every page shares `og-image.png` (1200x630) with page-specific `og:title`/`og:description`. WhatsApp and Telegram read the same Open Graph tags, so no separate script is needed. Region-specific images can be added later by giving a page an `ogImage` field and reading it in `scripts/prerender-seo.mjs`.

Localized pricing without hurting crawling:
- Serve the same HTML to everyone. Do not switch content by IP; Googlebot crawls mostly from the US and would never see the India or UAE version.
- Show USD prices everywhere (that is what checkout charges). Put local context in text ("about ₹X at today's rate") only if it is computed client-side and clearly approximate, never in JSON-LD.
- JSON-LD offers stay in USD, matching what the user actually pays.

## Module 4: Structured data (**live**)

Each geo page outputs `SoftwareApplication` with `areaServed` (India or United Arab Emirates) and USD offers, a `FAQPage` built from the page FAQs, and a `BreadcrumbList`. Example (India journal, trimmed):

```json
{
  "@type": "SoftwareApplication",
  "name": "Forex Notes",
  "applicationCategory": "FinanceApplication",
  "areaServed": { "@type": "Country", "name": "India" },
  "offers": [
    { "@type": "Offer", "price": "14", "priceCurrency": "USD", "description": "Monthly plan" },
    { "@type": "Offer", "price": "114", "priceCurrency": "USD", "description": "Yearly plan" }
  ]
}
```

FAQs answered on the pages include "Can I pay with USDT BEP-20 from India?", "Does it work for FTMO and FundedNext challenge accounts?", "Does Forex Notes support Islamic swap-free accounts?" and "Is it compatible with MT4/MT5 brokers in Dubai?".

## Module 5: Backlinks and outreach

India
- Hindi/English ICT and SMC YouTubers: free yearly plan for an honest walkthrough; 10% affiliate code for their audience; ask for the link in the description.
- Telegram trading communities: share the free drawdown calculator, not the paid product. Get admin permission first.
- Guest posts on Indian fintech and trading blogs about prop-firm risk maths, linking `/india/prop-firm-calculator`.
- College trading clubs and finance societies: free plans for club leads in exchange for a resource-page link.

UAE
- Startup and fintech directories (MENA startup listings, Dubai SME and in5 style directories, AlternativeTo, Product Hunt).
- Dubai prop trading Discords and meetups: sponsor a session on journaling and risk, link the UAE tools page.
- Expat investor portals: contributed article on tracking several funded accounts.

Both: quarterly anonymised data report from journal aggregates (for example "best session for gold traders in IST vs GST") as a PR hook.

## Module 6: Compliance and brand safety

Position Forex Notes everywhere as journaling, backtesting and analytics software. The disclaimer on every SEO page reads:

> Forex Notes is journaling, backtesting and analytics software. It is not a broker, does not hold funds or execute trades for you, and does not give investment advice.

India
- Do not tell readers which brokers or prop firms to use, and do not encourage overseas leveraged forex trading. RBI's FEMA rules restrict resident Indians to permitted INR-based pairs on recognised exchanges, and RBI publishes an alert list of unauthorised platforms.
- Frame USDT as a payment option for the software, not as a way around banking rules. Avoid wording like "bypass card declines".
- No profit promises or "guaranteed pass" claims. Testimonials must be real and verifiable.

UAE
- Present the product as personal analytics, risk calculation and performance tracking. Avoid language that reads as a financial promotion or investment advice (SCA, and DFSA in the DIFC, regulate those).
- Islamic pages describe how the journal works; they must not claim an account or product is Sharia compliant.

General
- Remove or verify the landing page testimonials and the "3,200+ funded traders" and "94%" stats before scaling traffic (also flagged in the earlier SEO audit).
- Keep competitor comparisons factual and dated.
