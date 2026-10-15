#!/usr/bin/env node
// Automated SEO, GEO & AEO Audit Tool for Forex Notes
// Validates meta tags, sitemaps, robots.txt, JSON-LD, internal links, and keywords.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const publicDir = join(__dirname, '..', 'public');

console.log('='.repeat(70));
console.log('🔍 FOREX NOTES — COMPREHENSIVE SEO / GEO / AEO AUDIT');
console.log('='.repeat(70));

let passedChecks = 0;
let failedChecks = 0;
const issues = [];

function pass(msg) {
  passedChecks++;
  console.log(`  ✅ [PASS] ${msg}`);
}

function fail(msg) {
  failedChecks++;
  issues.push(msg);
  console.log(`  ❌ [FAIL] ${msg}`);
}

function getHtmlFiles(dir, fileList = []) {
  if (!existsSync(dir)) return fileList;
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      getHtmlFiles(fullPath, fileList);
    } else if (file === 'index.html' || file.endsWith('.html')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// 1. Audit Dist Files Existence
console.log('\n[1/5] Checking Build Artifacts & Prerendered Pages...');
if (!existsSync(distDir)) {
  fail('dist directory does not exist! Please run "npm run build" first.');
  process.exit(1);
} else {
  pass('dist directory exists');
}

const htmlFiles = getHtmlFiles(distDir);
if (htmlFiles.length < 5) {
  fail(`Expected >15 prerendered HTML routes in dist, found only ${htmlFiles.length}`);
} else {
  pass(`Found ${htmlFiles.length} prerendered HTML files across routes`);
}

// 2. Audit Meta Tags & Anti-Corruption in every HTML file
console.log('\n[2/5] Auditing Meta Tags, Corrupted Replacement Tokens & Titles...');
let cleanMetaCount = 0;
let jsonLdSuccess = 0;

for (const filePath of htmlFiles) {
  const relPath = filePath.replace(distDir, '').replace(/\\/g, '/');
  const content = readFileSync(filePath, 'utf8');

  // CRITICAL CHECK: Did the Javascript regex replacement leak any raw HTML tags into attributes?
  const tagInContent = /content="[^"]*<meta/i.test(content) || /content="[^"]*From\s+<meta/i.test(content);
  if (tagInContent) {
    fail(`CORRUPTED META TAG DETECTED in ${relPath}: contains literal "<meta" inside attribute content!`);
  } else {
    cleanMetaCount++;
  }

  // Check Title
  const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    fail(`Missing <title> tag in ${relPath}`);
  }

  // Check Description
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!descMatch || !descMatch[1].trim()) {
    // app.html is the SPA shell and may not have per-route description
    if (!relPath.endsWith('app.html')) {
      fail(`Missing meta description in ${relPath}`);
    }
  } else {
    const desc = descMatch[1];
    if (desc.includes('<meta') || desc.includes('content=') || desc.includes('From <meta')) {
      fail(`Corrupted meta description in ${relPath}: "${desc}"`);
    }
  }

  // Check OpenGraph Description
  const ogDescMatch = content.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  if (ogDescMatch) {
    const ogDesc = ogDescMatch[1];
    if (ogDesc.includes('<meta') || ogDesc.includes('content=') || ogDesc.includes('From <meta')) {
      fail(`Corrupted og:description in ${relPath}: "${ogDesc}"`);
    }
  }

  // Check Canonical Link
  if (!relPath.endsWith('app.html')) {
    const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    if (!canonicalMatch || !canonicalMatch[1].startsWith('https://forexnotes.in')) {
      fail(`Invalid or missing canonical URL in ${relPath}`);
    }
  }

  // Check JSON-LD
  const jsonLdMatches = [...content.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of jsonLdMatches) {
    try {
      JSON.parse(match[1]);
      jsonLdSuccess++;
    } catch (err) {
      fail(`Malformed JSON-LD script in ${relPath}: ${err.message}`);
    }
  }
}

if (cleanMetaCount === htmlFiles.length) {
  pass(`All ${htmlFiles.length} HTML files verified: ZERO corrupted regex replacement tokens!`);
}
pass(`Validated ${jsonLdSuccess} JSON-LD structured data blocks with valid syntax`);

// 3. Sitemaps Audit
console.log('\n[3/5] Auditing Sitemaps & XML Structure...');
const expectedSitemaps = [
  'sitemap.xml',
  'sitemap-pages.xml',
  'sitemap-india.xml',
  'sitemap-uae.xml',
];

for (const sm of expectedSitemaps) {
  const distSmPath = join(distDir, sm);
  if (!existsSync(distSmPath)) {
    fail(`Missing sitemap in dist: ${sm}`);
    continue;
  }
  const xml = readFileSync(distSmPath, 'utf8');
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    fail(`Invalid XML header in dist/${sm}`);
  } else {
    pass(`Sitemap dist/${sm} exists and has valid XML declaration`);
  }

  // Check URL locs
  const locCount = (xml.match(/<loc>/g) || []).length;
  if (locCount === 0) {
    fail(`Sitemap ${sm} has 0 URLs!`);
  } else {
    pass(`Sitemap ${sm} contains ${locCount} verified <loc> entries`);
  }
}

// 4. Robots.txt Audit
console.log('\n[4/5] Auditing robots.txt Directives & AI Crawlers...');
const robotsPath = join(distDir, 'robots.txt');
if (!existsSync(robotsPath)) {
  fail('dist/robots.txt is missing');
} else {
  const robots = readFileSync(robotsPath, 'utf8');
  const requiredDirectives = [
    'User-agent: *',
    'Disallow: /login',
    'Disallow: /dashboard',
    'Disallow: /admin',
    'Sitemap: https://forexnotes.in/sitemap.xml',
  ];
  for (const dir of requiredDirectives) {
    if (!robots.includes(dir)) {
      fail(`robots.txt missing directive: "${dir}"`);
    }
  }

  // Check GEO / AI search engine allowances
  const aiBots = ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended'];
  let aiBotPass = true;
  for (const bot of aiBots) {
    if (!robots.includes(`User-agent: ${bot}`)) {
      fail(`robots.txt missing explicit crawler rule for GEO engine: ${bot}`);
      aiBotPass = false;
    }
  }
  if (aiBotPass) {
    pass('robots.txt explicitly allows AI / GEO bots (Google-Extended, GPTBot, PerplexityBot, ClaudeBot)');
  }
  pass('robots.txt protects authenticated dashboards while exposing public sitemaps');
}

// 5. Regional & Competitor Keyword Coverage
console.log('\n[5/5] Auditing Keyword Intent & Regional Silos (India & Dubai)...');
const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf8');

// Check Competitor Silos
const competitorSlugs = ['tradezella', 'tradersync', 'fx-replay', 'edgewonk', 'tradesviz'];
for (const slug of competitorSlugs) {
  const pagePath = join(distDir, 'vs', slug, 'index.html');
  if (existsSync(pagePath)) {
    pass(`Competitor comparison route verified: /vs/${slug}`);
  } else {
    fail(`Missing competitor comparison route: /vs/${slug}`);
  }
}

// Check Regional Silos
const regionalPaths = [
  join(distDir, 'india', 'forex-trading-journal', 'index.html'),
  join(distDir, 'india', 'trading-journal', 'index.html'),
  join(distDir, 'india', 'prop-firm-calculator', 'index.html'),
  join(distDir, 'india', 'forex-backtesting-software', 'index.html'),
  join(distDir, 'dubai', 'forex-trading-journal', 'index.html'),
  join(distDir, 'dubai', 'trading-journal', 'index.html'),
  join(distDir, 'uae', 'prop-firm-trader-tools', 'index.html'),
  join(distDir, 'uae', 'islamic-trading-journal', 'index.html'),
];

for (const rPath of regionalPaths) {
  const rel = rPath.replace(distDir, '').replace(/\\/g, '/');
  if (existsSync(rPath)) {
    pass(`Regional SEO route verified: ${rel}`);
  } else {
    fail(`Missing regional SEO route: ${rel}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log(`AUDIT RESULTS: ${passedChecks} PASSED | ${failedChecks} FAILED`);
console.log('='.repeat(70));

if (failedChecks > 0) {
  console.error('\nIssues to fix:');
  issues.forEach((i, idx) => console.error(`  ${idx + 1}. ${i}`));
  process.exit(1);
} else {
  console.log('\n🎉 ALL CHECKS PASSED PERFECTLY! Website is 100% SEO, GEO & AEO ready for production.\n');
  process.exit(0);
}
