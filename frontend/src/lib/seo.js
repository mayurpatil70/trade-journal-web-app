import { useEffect } from 'react';
import { SITE } from '../data/seoPages';

const setMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  const prev = el.getAttribute('content');
  el.setAttribute('content', content);
  return () => prev != null && el.setAttribute('content', prev);
};

export function useSeo({ path, title, description, jsonLd, alternates }) {
  useEffect(() => {
    document.head.querySelectorAll('[data-prerender]').forEach((el) => el.remove());
    const url = `${SITE}${path}`;
    const prevTitle = document.title;
    document.title = title;
    const restores = [
      setMeta('name', 'description', description),
      setMeta('property', 'og:title', title),
      setMeta('property', 'og:description', description),
      setMeta('property', 'og:url', url),
      setMeta('name', 'twitter:title', title),
      setMeta('name', 'twitter:description', description),
    ];
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.href;
    canonical.href = url;
    canonical.disabled = false;

    const added = [];
    Object.entries(alternates || {}).forEach(([lang, p]) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = `${SITE}${p}`;
      document.head.appendChild(link);
      added.push(link);
    });
    if (jsonLd) {
      const ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.text = JSON.stringify(jsonLd);
      document.head.appendChild(ld);
      added.push(ld);
    }
    return () => {
      document.title = prevTitle;
      canonical.href = prevCanonical;
      restores.forEach((r) => r());
      added.forEach((el) => el.remove());
    };
  }, [path, title, description, jsonLd, alternates]);
}
