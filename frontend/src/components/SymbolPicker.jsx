import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { marketApi } from '../api/market';

const TABS = [
  { id: 'crypto', label: 'Crypto' },
  { id: 'forex', label: 'Forex' },
  { id: 'indices', label: 'Indices' },
  { id: 'futures', label: 'Futures & Commodities' },
];

const PAGE = 40;

const blockReason = (entry, target) => {
  if (target === 'binance' && !entry.executable?.binance) return entry.reason || 'Not tradable on Binance spot.';
  if (target === 'mt5' && !entry.executable?.mt5) return 'Crypto pairs run on the Binance bot; MT5 bot covers forex, indices and futures.';
  return null;
};

export default function SymbolPicker({ value, onChange, target = 'chart', label, variant = 'field', className = '' }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('crypto');
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await marketApi.symbols({ class: tab, q, page, limit: PAGE });
        if (cancelled) return;
        setItems((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
        setHasMore(res.hasMore);
        if (tab === 'crypto' && !res.cryptoAvailable && page === 1) setError('Crypto list unavailable right now. Type a symbol and retry.');
      } catch {
        if (!cancelled) setError('Could not load symbols.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, q ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, tab, q, page]);

  const choose = (entry) => {
    if (blockReason(entry, target)) return;
    onChange(entry.symbol, entry);
    setOpen(false);
  };

  const trigger =
    variant === 'compact' ? (
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 px-2 py-1.5 hover:bg-[#1B1C20] rounded text-[#D1D4DC] font-bold text-sm">
        {value || 'Symbol'} <ChevronDown className="w-3 h-3" />
      </button>
    ) : (
      <button type="button" onClick={() => setOpen((o) => !o)} className="mt-1 flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-left text-sm text-white outline-none focus:border-cyan-500/50">
        <span>{value || 'Select symbol'}</span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>
    );

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && <span className="block text-xs text-gray-400">{label}</span>}
      {trigger}
      {open && (
        <div className="absolute left-0 top-full z-[200] mt-1 w-[min(420px,92vw)] rounded-xl border border-white/10 bg-[#101216] p-2 shadow-2xl">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] px-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search symbol or name" className="w-full bg-transparent py-2 text-sm text-white outline-none" />
          </div>
          <div className="mt-2 flex gap-1 overflow-x-auto text-xs">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => { setTab(t.id); setPage(1); setItems([]); }} className={`whitespace-nowrap rounded-md px-2.5 py-1.5 font-semibold ${tab === t.id ? 'bg-cyan-500/15 text-cyan-300' : 'text-gray-400 hover:bg-white/5'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-2 max-h-72 overflow-y-auto">
            {items.map((e) => {
              const reason = blockReason(e, target);
              return (
                <button key={e.symbol} type="button" onClick={() => choose(e)} disabled={Boolean(reason)} title={reason || ''} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40">
                  <span className="font-semibold text-white">{e.symbol}</span>
                  <span className="truncate pl-3 text-xs text-gray-500">{e.name}</span>
                </button>
              );
            })}
            {loading && <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-cyan-400" /></div>}
            {!loading && items.length === 0 && !error && <p className="p-3 text-center text-xs text-gray-500">No symbols found.</p>}
            {error && <p className="p-3 text-center text-xs text-amber-400">{error}</p>}
            {hasMore && !loading && (
              <button type="button" onClick={() => setPage((p) => p + 1)} className="w-full py-2 text-xs font-semibold text-cyan-400 hover:underline">Load more</button>
            )}
          </div>
          {target === 'binance' && tab !== 'crypto' && (
            <p className="mt-2 border-t border-white/5 px-2 pt-2 text-[11px] text-amber-300">Binance bots trade crypto spot pairs only. Forex, indices and futures are available in the MT5 AI bot and the Backtest tool.</p>
          )}
          {target === 'mt5' && tab === 'crypto' && (
            <p className="mt-2 border-t border-white/5 px-2 pt-2 text-[11px] text-amber-300">Crypto pairs run on the Binance bot. The MT5 bot covers forex, indices and futures.</p>
          )}
        </div>
      )}
    </div>
  );
}
