// Writes per-route HTML with real meta tags, JSON-LD and readable content for crawlers,
// plus sitemaps. dist/app.html stays a clean SPA shell for every other route.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_PAGES, LANDING_FAQS, HREFLANG_GROUPS, SITE, DISCLAIMER, pageJsonLd, faqLd, softwareLd } from '../src/data/seoPages.js';
import { COMPETITORS, SECTIONS, faqs as vsFaqs } from '../src/data/competitorComparisons.js';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const template = readFileSync(join(dist, 'index.html'), 'utf8');
const today = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ld = (data) => `<script type="application/ld+json" data-prerender>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

const FOOTER = [
  ['/tools/ftmo-drawdown-calculator', 'FTMO drawdown calculator'], ['/tools/lot-size-calculator', 'Lot size calculator'],
  ['/india/trading-journal', 'India trading journal'], ['/dubai/trading-journal', 'Dubai trading journal'],
  ['/uae/islamic-trading-journal', 'Islamic trading journal'], ['/vs/tradezella', 'vs TradeZella'], ['/vs/fx-replay', 'vs FX Replay'],
];
const footer = `<nav><ul>${FOOTER.map(([h, t]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('')}</ul></nav>`;
const faqHtml = (list) => `<section><h2>Frequently asked questions</h2>${list.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}</section>`;

function render({ path, title, description, jsonLd = [], alternates, body, robots }) {
  const url = `${SITE}${path === '/' ? '/' : path}`;
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  if (robots) html = html.replace(/(<meta name="robots" content=")[^"]*(")/, `$1${robots}$2`);
  const extra = [
    ...Object.entries(alternates || {}).map(([lang, p]) => `<link rel="alternate" hreflang="${lang}" href="${SITE}${p}" data-prerender />`),
    ...jsonLd.map(ld),
  ].join('\n  ');
  html = html.replace('</head>', `  ${extra}\n</head>`);
  return html.replace('<div id="root"></div>', `<div id="root"><main style="max-width:860px;margin:0 auto;padding:32px 20px;line-height:1.6">${body}${footer}</main></div>`);
}

const write = (path, html) => {
  const file = path === '/' ? join(dist, 'index.html') : join(dist, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
};

writeFileSync(join(dist, 'app.html'), template);

write('/privacy', render({
  path: '/privacy',
  title: 'Privacy Policy | Forex Notes',
  description: 'How Forex Notes collects, uses and protects your data.',
  body: '<h1>Privacy Policy</h1><p>How Forex Notes collects, uses and protects your data.</p>',
}));

const landingBody = `<h1>Backtest 10 years of markets. Journal every trade. Master your mind.</h1>
<p>Forex Notes is a bar replay backtesting platform with 10 years of historical data, a digital trading journal with an AI psychology coach, and prop firm challenge tools for forex, gold, indices and crypto traders.</p>
<ul><li>Bar replay backtesting with TradingView-style drawing tools</li><li>Trading journal with R-multiple, win rate and session analytics</li><li>Coach isLIVE AI psychology coach</li><li>Prop firm drawdown and lot size calculators</li><li>10% affiliate rewards</li></ul>
<p><a href="/login">Start your free trial</a></p>${faqHtml(LANDING_FAQS)}`;
write('/', render({
  path: '/',
  title: 'Forex Notes | Backtesting, Trading Journal & AI Coach',
  description: 'Backtest forex, gold and crypto with bar replay on 10 years of data, journal every trade and fix your psychology with an AI coach. From $14/mo.',
  jsonLd: [faqLd(LANDING_FAQS)],
  alternates: HREFLANG_GROUPS.journal,
  body: landingBody,
}));

SEO_PAGES.forEach((p) => {
  const sections = p.sections.map((s) => `<section><h2>${esc(s.h2)}</h2><p>${esc(s.body)}</p>${s.bullets ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}${(s.h3s || []).map((h) => `<h3>${esc(h.h3)}</h3><p>${esc(h.body)}</p>`).join('')}</section>`).join('');
  const related = (p.related || []).map((r) => `<li><a href="${r}">${esc(SEO_PAGES.find((x) => x.path === r)?.h1 || r)}</a></li>`).join('');
  write(p.path, render({
    path: p.path,
    title: p.title,
    description: p.description,
    jsonLd: pageJsonLd(p),
    alternates: HREFLANG_GROUPS[p.hreflang],
    body: `<p>${esc(p.eyebrow)}</p><h1>${esc(p.h1)}</h1><p>${esc(p.intro)}</p>${sections}${faqHtml(p.faqs)}<ul>${related}</ul><p><small>${esc(DISCLAIMER)}</small></p>`,
  }));
});

Object.entries(COMPETITORS).forEach(([slug, c]) => {
  const path = `/vs/${slug}`;
  const list = vsFaqs(c.name);
  write(path, render({
    path,
    title: c.title,
    description: c.description,
    jsonLd: [softwareLd(), faqLd(list)],
    body: `<h1>${esc(c.h1)}</h1><p>${esc(c.hook)}</p>${SECTIONS.map((s) => `<h2>${esc(s.h2)}</h2><p>${esc(s.body)}</p>`).join('')}${faqHtml(list)}`,
  }));
});

const urlXml = (path, { priority = '0.7', freq = 'monthly', group } = {}) => {
  const alts = group ? Object.entries(HREFLANG_GROUPS[group]).map(([lang, p]) => `\n    <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE}${p}" />`).join('') : '';
  return `  <url>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>${alts}\n  </url>`;
};
const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
const byRegion = (r) => SEO_PAGES.filter((p) => p.region === r).map((p) => urlXml(p.path, { priority: '0.8', group: p.hreflang }));

writeFileSync(join(dist, 'sitemap-pages.xml'), urlset([
  urlXml('/', { priority: '1.0', freq: 'weekly', group: 'journal' }),
  urlXml('/privacy', { priority: '0.3', freq: 'yearly' }),
  ...Object.keys(COMPETITORS).map((s) => urlXml(`/vs/${s}`, { priority: '0.8' })),
  ...SEO_PAGES.filter((p) => !p.region).map((p) => urlXml(p.path, { priority: '0.7', group: p.hreflang })),
]));
writeFileSync(join(dist, 'sitemap-india.xml'), urlset(byRegion('IN')));
writeFileSync(join(dist, 'sitemap-uae.xml'), urlset(byRegion('AE')));
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['sitemap-pages.xml', 'sitemap-india.xml', 'sitemap-uae.xml'].map((f) => `  <sitemap><loc>${SITE}/${f}</loc><lastmod>${today}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`);

console.log(`prerendered ${SEO_PAGES.length + Object.keys(COMPETITORS).length + 2} pages and 4 sitemaps`);
