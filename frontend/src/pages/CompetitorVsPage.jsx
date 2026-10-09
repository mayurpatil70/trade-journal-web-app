import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Check, X } from "lucide-react";
import { COMPETITORS, FOREX_NOTES, SECTIONS, comparisonRows, faqs } from "../data/competitorComparisons";

const SITE = "https://forexnotes.in";

const setMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

function useSeo(slug, c) {
  useEffect(() => {
    if (!c) return undefined;
    document.head.querySelectorAll('[data-prerender]').forEach((el) => el.remove());
    const url = `${SITE}/vs/${slug}`;
    const prevTitle = document.title;
    document.title = c.title;
    setMeta("name", "description", c.description);
    setMeta("property", "og:title", c.title);
    setMeta("property", "og:description", c.description);
    setMeta("property", "og:url", url);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.href;
    canonical.href = url;
    canonical.disabled = false;

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: FOREX_NOTES.name,
        url: SITE,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web, iOS, Android",
        offers: [
          { "@type": "Offer", price: String(FOREX_NOTES.monthly), priceCurrency: "USD", description: "Monthly plan" },
          { "@type": "Offer", price: String(FOREX_NOTES.yearly), priceCurrency: "USD", description: "Yearly plan" },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs(c.name).map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ]);
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      canonical.href = prevCanonical;
      ld.remove();
    };
  }, [slug, c]);
}

const Cell = ({ v }) => (
  <div className="flex items-start gap-2">
    {v.ok ? <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" /> : <X className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />}
    <span>{v.text}</span>
  </div>
);

export default function CompetitorVsPage() {
  const { competitorSlug } = useParams();
  const c = COMPETITORS[competitorSlug];
  useSeo(competitorSlug, c);
  if (!c) return <Navigate to="/" replace />;

  const yearlySaving = c.monthlyApprox ? c.monthlyApprox * 12 - FOREX_NOTES.yearly : null;

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-gray-300">
      <header className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
        <Link to="/"><img src="/logo-256.webp" alt="Forex Notes" className="h-12 w-auto" /></Link>
        <Link to="/login" className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold">Start free trial</Link>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-20">
        <section className="py-12 md:py-20 text-center">
          <p className="text-emerald-400 text-sm font-semibold mb-3">Forex Notes vs {c.name}</p>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{c.h1}</h1>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">{c.hook}</p>
          <Link to="/login" className="inline-block mt-8 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold">
            Try Forex Notes free for 24 hours
          </Link>
        </section>

        <section aria-labelledby="matrix">
          <h2 id="matrix" className="text-xl font-semibold text-white mb-4">Feature comparison</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-white/5 text-left text-gray-400">
                <tr>
                  <th className="p-4 font-medium">Feature</th>
                  <th className="p-4 font-semibold text-emerald-400">Forex Notes</th>
                  <th className="p-4 font-medium">{c.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonRows(competitorSlug).map((r) => (
                  <tr key={r.key}>
                    <th scope="row" className="p-4 text-left font-medium text-gray-400">{r.label}</th>
                    <td className="p-4 text-white"><Cell v={r.ours} /></td>
                    <td className="p-4"><Cell v={r.theirs} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-gray-600">
            Based on publicly available information at the time of writing. {c.name} is a trademark of its owner; Forex Notes is not affiliated with it.
          </p>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {SECTIONS.map((s) => (
            <div key={s.h2} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-lg font-semibold text-white">{s.h2}</h2>
              <p className="mt-2 text-sm text-gray-400">{s.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">
            {yearlySaving > 0 ? `Save about $${yearlySaving} a year` : "Every feature, one simple price"}
          </h2>
          <p className="mt-2 text-gray-400">
            Forex Notes is ${FOREX_NOTES.monthly}/month or ${FOREX_NOTES.yearly}/year
            {c.monthlyApprox ? `, compared with roughly $${c.monthlyApprox}/month for ${c.name}.` : ", with journaling, backtesting and the AI coach included."}
          </p>
          <Link to="/login" className="inline-block mt-6 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold">
            Start your free trial
          </Link>
        </section>

        <section className="mt-16">
          <h2 className="text-xl font-semibold text-white mb-4">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs(c.name).map((f) => (
              <details key={f.q} className="rounded-xl border border-white/10 p-4">
                <summary className="cursor-pointer font-medium text-white">{f.q}</summary>
                <p className="mt-2 text-sm text-gray-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <nav className="mt-16 text-sm text-gray-500">
          Other comparisons:{" "}
          {Object.entries(COMPETITORS)
            .filter(([slug]) => slug !== competitorSlug)
            .map(([slug, o], i) => (
              <span key={slug}>
                {i > 0 && " · "}
                <Link to={`/vs/${slug}`} className="hover:text-white">Forex Notes vs {o.name}</Link>
              </span>
            ))}
        </nav>
      </main>
    </div>
  );
}
