// frontend/src/components/paywall/AlgoPaywallModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  WagmiProvider,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';
import { bsc } from 'wagmi/chains';
import { wagmiConfig } from '../../lib/wagmi';
import { parseUnits } from 'viem';
import {
  Loader2,
  CheckCircle2,
  Zap,
  QrCode,
  Wallet,
  X,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Cpu,
  ArrowRight,
  TrendingUp,
  Target,
  Layers,
  Lock,
} from 'lucide-react';
import api from '../../api/axios';

const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
const MERCHANT_WALLET =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BEP20_ADDRESS) ||
  '0xeEE0DCbddd4cf94913dd2E69cA1009290F5B076E';

const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const ALGO_PRICE = 169; // $169 USDT / month

export default function AlgoPaywallModal({ onUnlocked, isAdmin = false, currentUsername = '' }) {
  const [tvUsername, setTvUsername] = useState(currentUsername || '');
  const [usernameError, setUsernameError] = useState('');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [paymentState, setPaymentState] = useState('idle'); // 'idle' | 'signing' | 'confirming' | 'verifying' | 'success' | 'error'
  const [paymentError, setPaymentError] = useState('');

  // Wagmi hooks
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: Boolean(hash) },
  });

  const verifiedHashesRef = useRef(new Set());
  const isWrongChain = isConnected && chainId !== bsc.id;

  // Handle Admin direct bypass
  const handleAdminBypass = () => {
    if (onUnlocked) onUnlocked({ bypass: true, username: 'noballondesk_admin' });
  };

  const validateUsername = () => {
    const clean = tvUsername.trim().replace(/^@/, '');
    if (!clean || clean.length < 2) {
      setUsernameError('Please enter your TradingView username so we can invite you.');
      return null;
    }
    if (/\s/.test(clean)) {
      setUsernameError('TradingView usernames cannot contain spaces.');
      return null;
    }
    setUsernameError('');
    return clean;
  };

  const handlePayClick = () => {
    const valid = validateUsername();
    if (!valid) return;

    if (!isConnected) {
      setIsWalletModalOpen(true);
      return;
    }

    if (isWrongChain) {
      if (switchChain) {
        switchChain({ chainId: bsc.id });
      } else {
        setPaymentError('Please switch your wallet network to BNB Smart Chain (BSC).');
      }
      return;
    }

    executePayment();
  };

  const executePayment = () => {
    setPaymentState('signing');
    setPaymentError('');

    try {
      const tokenUnits = parseUnits(String(ALGO_PRICE), 18);

      writeContract(
        {
          address: USDT_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [MERCHANT_WALLET, tokenUnits],
          chainId: bsc.id,
        },
        {
          onError: (err) => {
            console.error('[AlgoPayment] writeContract error:', err);
            setPaymentState('idle');
            if (err?.message?.includes('User rejected') || err?.message?.includes('denied')) {
              setPaymentError('Transaction cancelled in wallet.');
            } else if (err?.message?.includes('insufficient funds')) {
              setPaymentError('Insufficient BNB for gas fees or insufficient USDT balance.');
            } else {
              setPaymentError(err?.shortMessage || err?.message || 'Transaction could not be submitted.');
            }
          },
        }
      );
    } catch (error) {
      console.error('[AlgoPayment] execute error:', error);
      setPaymentState('idle');
      setPaymentError(error?.shortMessage || error?.message || 'Payment initialization failed.');
    }
  };

  // Watch for transaction submission
  useEffect(() => {
    if (hash && paymentState === 'signing') {
      setPaymentState('confirming');
    }
  }, [hash, paymentState]);

  // Watch for transaction confirmation on BSC
  useEffect(() => {
    if (isConfirmed && hash && !verifiedHashesRef.current.has(hash)) {
      verifiedHashesRef.current.add(hash);
      setPaymentState('verifying');

      const cleanUsername = tvUsername.trim().replace(/^@/, '');

      api
        .post('/api/algo/verify-crypto', {
          txHash: hash,
          tradingviewUsername: cleanUsername,
        })
        .then((response) => {
          if (response.data.success) {
            setPaymentState('success');
            setTimeout(() => {
              if (onUnlocked) onUnlocked({ username: cleanUsername });
            }, 1800);
          } else {
            setPaymentState('error');
            setPaymentError(response.data.error || 'Server verification failed.');
          }
        })
        .catch((err) => {
          console.error('[AlgoPayment] Verification failed:', err);
          setPaymentState('error');
          setPaymentError(
            err.response?.data?.error ||
              'Payment confirmed on BNB chain, but server verification timed out. Please retry.'
          );
        });
    }
  }, [isConfirmed, hash, tvUsername, onUnlocked]);

  const handleSelectConnector = (type) => {
    setIsWalletModalOpen(false);
    setPaymentError('');

    let targetConnector = null;
    if (type === 'walletConnect') {
      targetConnector = connectors.find((c) => c.id === 'walletConnect' || c.name === 'WalletConnect');
    } else if (type === 'metaMask') {
      targetConnector = connectors.find((c) => c.id === 'metaMask' || c.name === 'MetaMask' || c.id === 'io.metamask');
    }
    if (!targetConnector) {
      targetConnector = connectors.find((c) => c.id === 'injected') || connectors[0];
    }

    if (targetConnector) {
      connect(
        { connector: targetConnector, chainId: bsc.id },
        {
          onSuccess: () => {
            setTimeout(() => {
              executePayment();
            }, 500);
          },
          onError: (err) => {
            setPaymentError(err?.message || 'Failed to connect wallet.');
          },
        }
      );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Admin Quick Override Banner */}
      {isAdmin && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-300">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Admin Account Verified (noballondesk@gmail.com)</p>
              <p className="text-xs text-amber-300/80">You have full admin clearance. Paywall is bypassed for your account.</p>
            </div>
          </div>
          <button
            onClick={handleAdminBypass}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
          >
            Enter VIP Terminal as Admin →
          </button>
        </div>
      )}

      {/* Main Glassmorphic Card */}
      <div className="relative rounded-3xl bg-[#0e1522]/95 dark:bg-[#0b131f]/95 border border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden p-6 sm:p-10 text-white">
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-emerald-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Institutional Algo Suite
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Forexnotes Trading View Algo <span className="text-blue-400">🔥</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-300">
            Get instant private Invite-Only access to our closed-source algorithmic indicator directly on your personal TradingView account.
          </p>
        </div>

        {/* Feature Grid (macOS Bento Style) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">Hull MA Color Flips</h4>
            <p className="text-xs text-gray-400 mt-1">Zero-lag trend smoothing with instant bull/bear color transitions.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-3">
              <Target className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">Auto ATR TP1 & TP2</h4>
            <p className="text-xs text-gray-400 mt-1">Dynamic stop-loss and take-profit targets tailored to asset volatility.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">Order Blocks & Scalp Mode</h4>
            <p className="text-xs text-gray-400 mt-1">Institutional supply/demand zones + auto-relaxed filters on 1m/3m/5m.</p>
          </div>
        </div>

        {/* Pricing & Activation Box */}
        <div className="relative z-10 mt-8 p-6 sm:p-8 rounded-2xl bg-[#080d16] border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="text-center md:text-left">
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-3xl sm:text-5xl font-black text-white font-mono">${ALGO_PRICE}</span>
              <span className="text-sm text-gray-400 font-medium">USDT / month</span>
            </div>
            <div className="mt-2 flex items-center justify-center md:justify-start gap-2 text-xs text-blue-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              BNB Smart Chain (BEP-20) Instant Verification
            </div>
          </div>

          {/* Form & Action */}
          <div className="w-full md:w-auto md:min-w-[340px] flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Your TradingView Username <span className="text-blue-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. trader_mike"
                  value={tvUsername}
                  onChange={(e) => {
                    setTvUsername(e.target.value);
                    if (usernameError) setUsernameError('');
                  }}
                  disabled={paymentState !== 'idle' && paymentState !== 'error'}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all"
                />
              </div>
              {usernameError && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {usernameError}
                </p>
              )}
            </div>

            {/* Error Display */}
            {paymentError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Submit / Pay Button */}
            <button
              onClick={handlePayClick}
              disabled={paymentState === 'signing' || paymentState === 'confirming' || paymentState === 'verifying'}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {paymentState === 'idle' && (
                <>
                  <Wallet className="w-4 h-4" />
                  {isConnected ? `Pay $${ALGO_PRICE} USDT & Activate Algo` : 'Connect Wallet & Subscribe'}
                </>
              )}
              {paymentState === 'signing' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Confirm in Wallet...
                </>
              )}
              {paymentState === 'confirming' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
                  Mining on BSC Chain...
                </>
              )}
              {paymentState === 'verifying' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                  Activating TradingView Access...
                </>
              )}
              {paymentState === 'success' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Access Granted! Redirecting...
                </>
              )}
              {paymentState === 'error' && (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Retry Payment
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center">
              Requires 169 USDT on BEP-20 + minor BNB for network gas.
            </p>
          </div>
        </div>

        {/* Security & Guarantee Footer */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Closed-Source Invite-Only Script on TradingView</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>Direct Smart Contract Settlement to Merchant Wallet</span>
          </div>
        </div>
      </div>

      {/* Wallet Connect Modal */}
      {isWalletModalOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsWalletModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0b131f] border border-white/15 rounded-2xl p-6 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-400" />
                  Connect Wallet
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Pay $169 USDT on BNB Smart Chain</p>
              </div>
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => handleSelectConnector('walletConnect')}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-[#0f1d2e] hover:bg-[#13273d] border border-blue-500/35 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white">WalletConnect</span>
                    <p className="text-xs text-gray-400">Trust Wallet, Binance Web3, Rainbow & 300+</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => handleSelectConnector('metaMask')}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-[#0f1d2e] hover:bg-[#13273d] border border-white/10 hover:border-amber-500/50 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white">MetaMask</span>
                    <p className="text-xs text-gray-400">Browser extension</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => handleSelectConnector('injected')}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-[#0f1d2e] hover:bg-[#13273d] border border-white/10 hover:border-blue-500/50 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white">Other Browser Wallet</span>
                    <p className="text-xs text-gray-400">Coinbase, OKX, Rabby, Brave</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
