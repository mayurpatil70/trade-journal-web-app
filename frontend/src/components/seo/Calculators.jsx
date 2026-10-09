import { useState } from 'react';

const AED_PER_USD = 3.6725;

const fmt = (n, cur = 'USD') => {
  if (!Number.isFinite(n)) return '-';
  const locale = cur === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: cur, maximumFractionDigits: cur === 'INR' ? 0 : 2 }).format(n);
};

const Field = ({ label, value, onChange, step = 'any', suffix }) => (
  <label className="block">
    <span className="text-xs text-gray-400">{label}</span>
    <div className="mt-1 flex items-center rounded-xl bg-black/40 border border-white/10 focus-within:border-emerald-500">
      <input type="number" inputMode="decimal" step={step} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent px-3 py-2.5 text-white outline-none" />
      {suffix && <span className="pr-3 text-xs text-gray-500">{suffix}</span>}
    </div>
  </label>
);

const Result = ({ label, value, tone = 'text-white', sub }) => (
  <div className="rounded-xl bg-black/30 border border-white/5 p-4">
    <div className="text-xs text-gray-400">{label}</div>
    <div className={`mt-1 text-xl font-bold ${tone}`}>{value}</div>
    {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
  </div>
);

const n = (v) => parseFloat(v);

export function DrawdownCalculator({ currency = 'USD', daily = 5, overall = 10, size = 100000 }) {
  const [s, setS] = useState({ size, daily, overall, dayStart: size, equity: size, risk: 1, inr: 88 });
  const set = (k) => (v) => setS((x) => ({ ...x, [k]: v }));
  const dailyFloor = n(s.dayStart) * (1 - n(s.daily) / 100);
  const overallFloor = n(s.size) * (1 - n(s.overall) / 100);
  const dailyRoom = n(s.equity) - dailyFloor;
  const overallRoom = n(s.equity) - overallFloor;
  const room = Math.min(dailyRoom, overallRoom);
  const perTrade = (n(s.size) * n(s.risk)) / 100;
  const trades = perTrade > 0 ? Math.max(0, Math.floor(room / perTrade)) : 0;
  const showInr = currency === 'INR';
  const inr = (v) => (showInr ? fmt(v * n(s.inr), 'INR') : undefined);
  const tone = (v) => (v <= 0 ? 'text-red-400' : v < perTrade * 2 ? 'text-amber-400' : 'text-emerald-400');

  return (
    <div className="glossy rounded-2xl p-5 md:p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Field label="Account size (USD)" value={s.size} onChange={set('size')} />
        <Field label="Daily loss limit" value={s.daily} onChange={set('daily')} suffix="%" />
        <Field label="Max loss limit" value={s.overall} onChange={set('overall')} suffix="%" />
        <Field label="Balance at start of day" value={s.dayStart} onChange={set('dayStart')} />
        <Field label="Current equity" value={s.equity} onChange={set('equity')} />
        <Field label="Risk per trade" value={s.risk} onChange={set('risk')} suffix="%" />
        {showInr && <Field label="USD/INR rate" value={s.inr} onChange={set('inr')} />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
        <Result label="Daily loss room left" value={fmt(dailyRoom)} tone={tone(dailyRoom)} sub={inr(dailyRoom) || `Floor ${fmt(dailyFloor)}`} />
        <Result label="Max loss room left" value={fmt(overallRoom)} tone={tone(overallRoom)} sub={inr(overallRoom) || `Floor ${fmt(overallFloor)}`} />
        <Result label="Full-risk losses you can take" value={room <= 0 ? 'Limit hit' : trades} tone={tone(room)} sub={`at ${fmt(perTrade)} per trade`} />
      </div>
    </div>
  );
}

export function LeverageCalculator() {
  const [s, setS] = useState({ lots: 1, contract: 100000, price: 1.08, leverage: 100 });
  const set = (k) => (v) => setS((x) => ({ ...x, [k]: v }));
  const notional = n(s.lots) * n(s.contract) * n(s.price);
  const margin = notional / n(s.leverage);
  return (
    <div className="glossy rounded-2xl p-5 md:p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Lots" value={s.lots} onChange={set('lots')} />
        <Field label="Contract size" value={s.contract} onChange={set('contract')} />
        <Field label="Price (USD quote)" value={s.price} onChange={set('price')} />
        <Field label="Leverage" value={s.leverage} onChange={set('leverage')} suffix=":1" />
      </div>
      <p className="mt-2 text-xs text-gray-500">Forex lot = 100,000 units, XAUUSD lot = 100 oz. Converted at the AED peg of {AED_PER_USD}.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        <Result label="Position value" value={fmt(notional)} sub={fmt(notional * AED_PER_USD, 'AED')} />
        <Result label="Margin required" value={fmt(margin)} tone="text-emerald-400" sub={fmt(margin * AED_PER_USD, 'AED')} />
      </div>
    </div>
  );
}

const INSTRUMENTS = {
  fx: { label: 'Forex (USD quote, e.g. EURUSD)', unit: 'pips', perLot: 10 },
  gold: { label: 'Gold (XAUUSD)', unit: '$ move', perLot: 100 },
  index: { label: 'Index CFD ($1 per point per lot)', unit: 'points', perLot: 1 },
};

export function LotSizeCalculator() {
  const [s, setS] = useState({ balance: 10000, risk: 1, stop: 20, kind: 'fx' });
  const set = (k) => (v) => setS((x) => ({ ...x, [k]: v }));
  const inst = INSTRUMENTS[s.kind];
  const riskUsd = (n(s.balance) * n(s.risk)) / 100;
  const lots = riskUsd / (n(s.stop) * inst.perLot);
  return (
    <div className="glossy rounded-2xl p-5 md:p-6">
      <label className="block mb-3">
        <span className="text-xs text-gray-400">Instrument</span>
        <select value={s.kind} onChange={(e) => set('kind')(e.target.value)} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-white outline-none">
          {Object.entries(INSTRUMENTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Balance (USD)" value={s.balance} onChange={set('balance')} />
        <Field label="Risk" value={s.risk} onChange={set('risk')} suffix="%" />
        <Field label="Stop loss" value={s.stop} onChange={set('stop')} suffix={inst.unit} />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Result label="Amount at risk" value={fmt(riskUsd)} tone="text-red-400" />
        <Result label="Position size" value={Number.isFinite(lots) ? `${lots.toFixed(2)} lots` : '-'} tone="text-emerald-400" />
      </div>
    </div>
  );
}

export const WIDGETS = { drawdown: DrawdownCalculator, leverage: LeverageCalculator, lot: LotSizeCalculator };
