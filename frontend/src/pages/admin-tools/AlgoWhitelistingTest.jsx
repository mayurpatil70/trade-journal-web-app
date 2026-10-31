// frontend/src/pages/admin-tools/AlgoWhitelistingTest.jsx
// Architecture B: Automated Whitelisting Microservice (Zero Manual Work)
// Gated by $169 Paywall with Admin Email Bypass (noballondesk@gmail.com)

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../components/theme-provider';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import api from '../../api/axios';
import AlgoPaywallModal from '../../components/paywall/AlgoPaywallModal';
import {
  Bot,
  Play,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function AlgoWhitelistingTest() {
  const { theme } = useTheme();
  const isAdmin = useIsAdmin() === true;
  const surface = theme === 'dark' ? 'bg-[#0d121d]' : 'bg-white';
  const cardBg = theme === 'dark' ? 'bg-[#131b2b]' : 'bg-neutral-50';

  const [loadingAccess, setLoadingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [algoData, setAlgoData] = useState(null);

  const [username, setUsername] = useState('crypto_trader_test');
  const [action, setAction] = useState('invite');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([
    'System ready. Headless worker daemon listening on /api/algo/admin/test-whitelist',
    'TradingView Script Target: "Forexnotes trading view algo 🔥" (Protected/Invite-Only)',
  ]);
  const [status, setStatus] = useState('idle');

  // Access check & Admin bypass
  const checkAccess = async () => {
    setLoadingAccess(true);
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
      if (isAdmin) setHasAccess(true);
    } finally {
      setLoadingAccess(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, [isAdmin]);

  const handleRunTest = async () => {
    if (!username.trim()) return;
    setIsProcessing(true);
    setStatus('idle');
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Dispatching Architecture B automated worker for @${username}...`,
    ]);

    try {
      const res = await api.post('/api/algo/admin/test-whitelist', {
        username,
        action,
      });

      if (res.data?.success) {
        setStatus('success');
        setLogs((prev) => [...prev, ...(res.data.logs || []), '✔ Execution completed with status 200 OK.']);
      } else {
        setStatus('error');
        setLogs((prev) => [...prev, `✖ Worker error: ${res.data?.error || 'Unknown error'}`]);
      }
    } catch (err) {
      setStatus('error');
      setLogs((prev) => [
        ...prev,
        `✖ Worker failed: ${err.response?.data?.error || err.message}`,
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. Loading State
  if (loadingAccess) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${surface}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-xs text-gray-400 font-medium">Verifying VIP Algo Authorization...</p>
      </div>
    );
  }

  // 2. Paywall Gate
  if (!hasAccess && !isAdmin) {
    return (
      <div className={`min-h-screen ${surface} pt-12 pb-20 px-4 flex flex-col items-center justify-center`}>
        <AlgoPaywallModal
          isAdmin={isAdmin}
          currentUsername={algoData?.tradingviewUsername || ''}
          onUnlocked={() => {
            setHasAccess(true);
            checkAccess();
          }}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${surface} p-6 sm:p-10 font-sans text-neutral-900 dark:text-white`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/[0.08] dark:border-white/[0.08] pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-wider mb-2">
              <Bot className="w-3.5 h-3.5" />
              Architecture B Experimental Lab
            </div>
            <h1 className="text-2xl font-black">Automated Whitelisting Microservice</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Zero Manual Work: Automated headless worker simulates instant TradingView Invite-Only script provisioning upon BSC USDT verification.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
              {isAdmin ? 'Admin Clearance (Bypassed)' : 'VIP Subscriber'}
            </span>
          </div>
        </div>

        {/* Control Box */}
        <div className={`p-6 rounded-3xl ${cardBg} border border-black/[0.06] dark:border-white/[0.08] shadow-xl space-y-5`}>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            Worker Dispatch Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">
                Target TradingView Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. trader_john"
                className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">
                Worker Action
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10 text-sm outline-none focus:border-blue-500 text-neutral-900 dark:text-white"
              >
                <option value="invite">Grant Invite-Only Access (Provision)</option>
                <option value="revoke">Revoke Access (Subscription Ended)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
            <span className="text-xs text-gray-400">
              Microservice: Playwright / Headless Session Engine
            </span>
            <button
              onClick={handleRunTest}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Executing Worker...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Run Whitelist Test
                </>
              )}
            </button>
          </div>
        </div>

        {/* Terminal Logs Window (macOS Terminal Style) */}
        <div className="rounded-3xl bg-[#090d14] border border-white/10 shadow-2xl overflow-hidden font-mono text-xs">
          <div className="px-4 py-3 bg-[#0f1522] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-gray-400 text-[11px]">worker.playwright.log — Architecture B</span>
            </div>
            <button
              onClick={() => setLogs(['Terminal cleared. Worker ready.'])}
              className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Clear
            </button>
          </div>

          <div className="p-4 space-y-1.5 text-gray-300 max-h-72 overflow-y-auto">
            {logs.map((line, idx) => (
              <div
                key={idx}
                className={`leading-relaxed ${
                  line.includes('✔')
                    ? 'text-emerald-400 font-bold'
                    : line.includes('✖')
                    ? 'text-red-400 font-bold'
                    : line.includes('Target')
                    ? 'text-blue-400'
                    : 'text-gray-300'
                }`}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
