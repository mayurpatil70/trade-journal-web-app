import { useMemo } from 'react';
import BrandLogo from "../components/BrandLogo";
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { pageByPath, pageJsonLd, HREFLANG_GROUPS, DISCLAIMER, PRICE } from '../data/seoPages';
import { useSeo } from '../lib/seo';
import { WIDGETS } from '../components/seo/Calculators';
import SiteFooter from '../components/seo/SiteFooter';

export default function SeoLandingPage() {
  const { pathname } = useLocation();
  const page = pageByPath[pathname.replace(/\/$/, '')];
  const jsonLd = useMemo(() => page && pageJsonLd(page), [page]);
  useSeo({ path: page?.path ?? pathname, title: page?.title ?? '', description: page?.description ?? '', jsonLd, alternates: page && HREFLANG_GROUPS[page.hreflang] });
  if (!page) return <Navigate to="/" replace />;
  const Widget = page.widget && WIDGETS[page.widget];

  return (
    <div className="min-h-screen bg-black text-gray-300 trading-bg">
      <header className="sticky top-0 z-30 glossy-bar">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" aria-label="Forex Notes home"><BrandLogo width="80" height="71" className="h-11 w-auto" /></Link>
          <Link to="/login" className="btn-glossy-green px-4 py-2 rounded-xl text-sm font-bold">Start free trial</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-16">
        <section className="py-12 md:py-16">
          <p className="text-emerald-400 text-sm font-semibold mb-3">{page.eyebrow}</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight max-w-3xl">{page.h1}</h1>
          <p className="mt-5 text-gray-400 max-w-2xl text-base md:text-lg leading-relaxed">{page.intro}</p>
          {page.hook && (
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-1.5">
              <Check className="w-3.5 h-3.5" /> {page.hook}
            </p>
          )}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/login" className="btn-glossy-green inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold">
              Try Forex Notes free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#faq" className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5">Questions</a>
          </div>
        </section>

        {Widget && (
          <section aria-label="Calculator" className="mb-14">
            <Widget {...page.widgetProps} />
          </section>
        )}

        <div className="space-y-12">
          {page.sections.map((s) => (
            <section key={s.h2}>
              <h2 className="text-2xl font-bold text-white">{s.h2}</h2>
              <p className="mt-3 text-gray-400 leading-relaxed max-w-3xl">{s.body}</p>
              {s.bullets && (
                <ul className="mt-4 space-y-2">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-gray-300"><Check className="w-4 h-4 mt-1 shrink-0 text-emerald-400" />{b}</li>
                  ))}
                </ul>
              )}
              {s.h3s && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {s.h3s.map((h) => (
                    <div key={h.h3} className="glossy rounded-2xl p-5">
                      <h3 className="font-semibold text-white">{h.h3}</h3>
                      <p className="mt-1.5 text-sm text-gray-400">{h.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <section className="mt-16 glossy rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Backtest, journal and coach in one plan</h2>
          <p className="mt-2 text-gray-400">${PRICE.monthly}/month or ${PRICE.yearly}/year. Pay by card or USDT (BEP-20). Free trial for new accounts.</p>
          <Link to="/login" className="btn-glossy-green inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl font-bold">
            Start your free trial <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        <section id="faq" className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-4">Frequently asked questions</h2>
          <div className="divide-y divide-white/5 border-y border-white/5">
            {page.faqs.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-white">
                  {f.q}
                  <ChevronDown className="w-4 h-4 shrink-0 text-gray-500 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-gray-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {page.related?.length > 0 && (
          <nav aria-label="Related pages" className="mt-12">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">Related</h2>
            <div className="flex flex-wrap gap-2">
              {page.related.map((p) => pageByPath[p] && (
                <Link key={p} to={p} className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-gray-300 hover:text-white hover:border-emerald-500/40">
                  {pageByPath[p].h1}
                </Link>
              ))}
            </div>
          </nav>
        )}

        <p className="mt-12 text-xs text-gray-600 leading-relaxed">{DISCLAIMER}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
