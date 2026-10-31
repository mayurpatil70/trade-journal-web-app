// frontend/src/pages/TradingViewAlgo.jsx
import React, { useState, useEffect } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { useTheme } from '../components/theme-provider';
import { useIsAdmin } from '../hooks/useIsAdmin';
import api from '../api/axios';
import AlgoPaywallModal from '../components/paywall/AlgoPaywallModal';
import {
  Cpu,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Copy,
  Activity,
  Zap,
  Target,
  RefreshCw,
} from 'lucide-react';

const QUICK_ASSETS = [
  { label: 'Gold (XAUUSD)', symbol: 'OANDA:XAUUSD' },
  { label: 'Bitcoin (BTCUSD)', symbol: 'BINANCE:BTCUSDT' },
  { label: 'EUR/USD', symbol: 'FX:EURUSD' },
  { label: 'Nasdaq 100', symbol: 'CAPITALCOM:US100' },
  { label: 'US 30 (Dow)', symbol: 'CAPITALCOM:US30' },
];

export default function TradingViewAlgo() {
  const { theme } = useTheme();
  const isAdmin = useIsAdmin() === true;
  const surface = theme === 'dark' ? 'bg-[#131722]' : 'bg-white';
  const cardSurface = theme === 'dark' ? 'bg-[#0b131f]' : 'bg-neutral-50';

  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [algoData, setAlgoData] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(QUICK_ASSETS[0]);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [copied, setCopied] = useState(false);

  // Admin Quick Whitelist Management State
  const [subscribers, setSubscribers] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Fetch access status
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/algo/status');
      if (res.data?.success) {
        setAlgoData(res.data);
        if (res.data.hasAlgoAccess || res.data.isAdmin || isAdmin) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      }
    } catch (err) {
      console.warn('[TradingViewAlgo] status fetch error:', err?.message);
      // If admin, bypass anyway
      if (isAdmin) setHasAccess(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [isAdmin]);

  // If Admin, load subscribers list for quick whitelist control
  useEffect(() => {
    if (isAdmin) {
      setLoadingSubs(true);
      api
        .get('/api/algo/admin/subscribers')
        .then((res) => {
          if (res.data?.subscribers) setSubscribers(res.data.subscribers);
        })
        .catch((e) => console.warn('Subscribers fetch error:', e?.message))
        .finally(() => setLoadingSubs(false));
    }
  }, [isAdmin]);

  const handleUpdateSubscriberStatus = async (id, newStatus) => {
    try {
      await api.patch(`/api/algo/admin/access/${id}`, { accessStatus: newStatus });
      setSubscribers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, access_status: newStatus } : s))
      );
    } catch (err) {
      alert('Failed to update subscriber status');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── 1. LOADING STATE ──
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-dvh ${surface}`}>
        <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-3" />
        <p className="text-xs text-gray-400 font-medium tracking-wide">
          Verifying VIP Algo Authorization...
        </p>
      </div>
    );
  }

  // ── 2. PAYWALL GATE (Non-Subscribed Users) ──
  if (!hasAccess && !isAdmin) {
    return (
      <div className={`min-h-dvh ${surface} pt-12 pb-20 px-4 flex flex-col items-center justify-center`}>
        <AlgoPaywallModal
          isAdmin={isAdmin}
          currentUsername={algoData?.tradingviewUsername || ''}
          onUnlocked={(data) => {
            setHasAccess(true);
            fetchStatus();
          }}
        />
      </div>
    );
  }

  // ── 3. VIP TERMINAL INTERFACE (Subscribed & Admin Users) ──
  const tvUser = algoData?.tradingviewUsername || (isAdmin ? 'admin_bypass' : 'VIP Member');

  return (
    <div className={`flex flex-col h-dvh ${surface} pt-14 md:pt-0 overflow-hidden font-sans`}>
      {/* ── macOS Cupertino Top Bar ── */}
      <div className="hidden md:flex h-14 shrink-0 items-center justify-between px-6 border-b border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#131722]/90 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              Forexnotes Trading View Algo
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isAdmin ? 'ADMIN OVERRIDE' : 'VIP ACTIVE'}
              </span>
            </h1>
          </div>
        </div>

        {/* Central Asset Switcher */}
        <div className="flex items-center gap-1.5 bg-black/[0.03] dark:bg-white/[0.05] p-1 rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
          {QUICK_ASSETS.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => setSelectedAsset(asset)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedAsset.symbol === asset.symbol
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {asset.label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How to Add Script</span>
          </button>

          <a
            href="https://in.tradingview.com/chart/Z4pAWzRc/?symbol=XAUUSD"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-all shadow-xs cursor-pointer"
          >
            <span>Open in TradingView</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Mobile Top Sub-Header */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#131722]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-neutral-900 dark:text-white">Forexnotes Trading View Algo</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
            VIP
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuideModal(true)}
            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium"
          >
            Guide
          </button>
          <a
            href="https://in.tradingview.com/chart/Z4pAWzRc/?symbol=XAUUSD"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 text-xs font-bold text-neutral-900 dark:text-white border border-white/10"
          >
            Launch ↗
          </a>
        </div>
      </div>

      {/* ── Main TradingView Chart Container ── */}
      <div className={`flex-1 ${surface} relative overflow-hidden`}>
        <div className="absolute top-0 left-0 right-0 h-[calc(100%+42px)]">
          <AdvancedRealTimeChart
            theme={theme}
            symbol={selectedAsset.symbol}
            interval="60"
            timezone="Etc/UTC"
            style="1"
            locale="en"
            enable_publishing={false}
            allow_symbol_change={true}
            container_id={`tv_algo_chart_${selectedAsset.symbol}_${theme}`}
            width="100%"
            height="100%"
            hide_side_toolbar={false}
            withdateranges={true}
            hide_volume={false}
          />
        </div>
      </div>

      {/* ── Bottom VIP Status & Quick Indicator Rules Drawer ── */}
      <div className="shrink-0 border-t border-black/[0.06] dark:border-white/[0.08] bg-white/95 dark:bg-[#0e1522]/95 backdrop-blur-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
        <div className="flex items-center gap-3">
          <span className="text-gray-400 flex items-center gap-1.5 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Invite Linked: <strong className="text-white">@{tvUser}</strong>
          </span>

          <span className="hidden sm:inline-block text-gray-600 dark:text-gray-600">•</span>

          <span className="hidden sm:flex items-center gap-1 text-gray-400 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Status: <span className="text-emerald-400 font-semibold">{isAdmin ? 'Permanent Admin' : 'Active 30 Days'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCheatSheet(!showCheatSheet)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 font-medium transition-colors cursor-pointer text-[11px]"
          >
            <span>Indicator Settings & Rules</span>
            {showCheatSheet ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Collapsible Strategy Cheat Sheet */}
      {showCheatSheet && (
        <div className="p-4 bg-[#0a0f17] border-t border-white/10 text-white animate-in slide-in-from-bottom duration-200 z-30 max-h-60 overflow-y-auto">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <h5 className="font-bold text-blue-400 flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Hull Moving Average (HMA 20)
              </h5>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                <strong>Green Line:</strong> Bullish momentum. Look for long entries on EMA 5/13 cross.<br />
                <strong>Red Line:</strong> Bearish momentum. Long trades are blocked to protect capital.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <h5 className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                <Target className="w-3.5 h-3.5" />
                Auto ATR TP & Stop Loss
              </h5>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                Dashed lines automatically projected from signal candle: <strong>Entry (Blue)</strong>, <strong>SL (Red)</strong>, <strong>TP1 & TP2 (Green)</strong>. Move SL to breakeven at TP1.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <h5 className="font-bold text-purple-400 flex items-center gap-1.5 mb-1.5">
                <Zap className="w-3.5 h-3.5" />
                Scalp Mode (1M / 3M / 5M)
              </h5>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                Automatically relaxes strict higher-timeframe filters when switching to lower timeframes to provide fast high-probability scalping opportunities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN ONLY: Subscriber Management Drawer ── */}
      {isAdmin && subscribers.length > 0 && (
        <div className="p-3 bg-amber-500/10 border-t border-amber-500/20 text-xs text-amber-200 z-30">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Admin Subscriber Whitelist ({subscribers.length} total)
            </span>
            <div className="flex items-center gap-2 overflow-x-auto">
              {subscribers.slice(0, 4).map((sub) => (
                <div key={sub.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-amber-500/30 text-[11px]">
                  <span className="text-white font-mono">@{sub.tradingview_username}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                    sub.access_status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {sub.access_status}
                  </span>
                  {sub.access_status === 'pending_invite' && (
                    <button
                      onClick={() => handleUpdateSubscriberStatus(sub.id, 'active')}
                      className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold cursor-pointer"
                    >
                      Invite Done
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Guide Modal: How to add script in TradingView ── */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="relative w-full max-w-lg bg-[#0b131f] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                How to Add Indicator to Your TradingView
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <strong className="text-white">Open any Chart on TradingView:</strong>
                  <p className="text-xs text-gray-400 mt-0.5">Visit <a href="https://in.tradingview.com/chart/Z4pAWzRc/?symbol=XAUUSD" target="_blank" rel="noreferrer" className="text-blue-400 underline">TradingView.com</a> or open the TradingView Desktop / Mobile app.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <strong className="text-white">Click "Indicators" in Top Toolbar:</strong>
                  <p className="text-xs text-gray-400 mt-0.5">Click the Indicators (fx) button at the top of your chart.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <strong className="text-white">Select "Invite-Only Scripts":</strong>
                  <p className="text-xs text-gray-400 mt-0.5">On the left sidebar, click the padlock category named <strong>Invite-Only Scripts</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">4</span>
                <div>
                  <strong className="text-white">Click "Forexnotes Trading View Algo 🔥":</strong>
                  <p className="text-xs text-emerald-300 mt-0.5">Click to add. It will immediately attach to your chart with full signals, levels, and alerts!</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
