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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '../../lib/wagmi';
import { parseUnits } from 'viem';
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Zap,
  QrCode,
  Wallet,
  X,
  ExternalLink,
  AlertCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { invalidateSubscriptionCache } from '../../utils/subscriptionCache';

// -------------------------------------------------------------
// BSC USDT CONTRACT & MERCHANT CONFIG
// -------------------------------------------------------------
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

const sharedQueryClient = new QueryClient();

// -------------------------------------------------------------
// ODOMETER DIGIT ROLLER COMPONENT (60fps GPU transforms)
// -------------------------------------------------------------
export function OdometerPrice({ value, height = 40 }) {
  const digits = String(value).split('');

  return (
    <div
      style={{
        display: 'inline-flex',
        height: `${height}px`,
        overflow: 'hidden',
        lineHeight: `${height}px`,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 800,
        verticalAlign: 'baseline',
      }}
      aria-hidden="true"
    >
      {digits.map((char, i) => {
        const isNum = !isNaN(parseInt(char, 10));
        if (!isNum) {
          return (
            <span key={i} style={{ height: `${height}px`, lineHeight: `${height}px` }}>
              {char}
            </span>
          );
        }
        const num = parseInt(char, 10);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              transform: `translate3d(0, ${-num * height}px, 0)`,
              transition: `transform 0.48s cubic-bezier(0.16, 1, 0.3, 1) ${i * 45}ms`,
              willChange: 'transform',
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <span
                key={n}
                style={{
                  height: `${height}px`,
                  lineHeight: `${height}px`,
                  width: '0.62em',
                  textAlign: 'center',
                }}
              >
                {n}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------
// WALLET SELECTION MODAL (WALLETCONNECT / METAMASK / INJECTED)
// -------------------------------------------------------------
export function WalletConnectModal({ isOpen, onClose, onSelect, isConnecting }) {
  if (!isOpen) return null;

  const isMetaMaskDetected =
    typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#0b131f] border border-white/15 rounded-2xl p-6 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Connect Wallet
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Choose how you would like to connect and pay
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet Options List */}
        <div className="mt-5 space-y-3">
          {/* Option 1: WalletConnect (QR Scanner) */}
          <button
            type="button"
            onClick={() => onSelect('walletConnect')}
            disabled={isConnecting}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-[#0f1d2e] hover:bg-[#13273d] border border-emerald-500/35 hover:border-emerald-500/70 transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                <QrCode className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">WalletConnect</span>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                    QR Scanner
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-snug">
                  Scan QR with Trust Wallet, Binance Web3, MetaMask Mobile, Rainbow & 300+ wallets
                </p>
              </div>
            </div>
            <div className="text-gray-500 group-hover:text-emerald-400 text-lg transition-colors pl-2">
              →
            </div>
          </button>

          {/* Option 2: MetaMask */}
          <button
            type="button"
            onClick={() => onSelect('metaMask')}
            disabled={isConnecting}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-[#0f1d2e] hover:bg-[#13273d] border border-white/10 hover:border-amber-500/50 transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M21.5 6L13.5 12L16 3.5L21.5 6Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2.5 6L10.5 12L8 3.5L2.5 6Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 15.5L21.5 19L16 20.5L13.5 17L19 15.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 15.5L2.5 19L8 20.5L10.5 17L5 15.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 12L10.5 17L8 20.5L2.5 19L5 15.5L8 12Z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 12L13.5 17L16 20.5L21.5 19L19 15.5L16 12Z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10.5 12L12 15L13.5 12L16 3.5H8L10.5 12Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">MetaMask</span>
                  {isMetaMaskDetected && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Extension Ready
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-snug">
                  Connect to your MetaMask browser extension
                </p>
              </div>
            </div>
            <div className="text-gray-500 group-hover:text-amber-400 text-lg transition-colors pl-2">
              →
            </div>
          </button>

          {/* Option 3: Browser Wallet / Injected */}
          <button
            type="button"
            onClick={() => onSelect('injected')}
            disabled={isConnecting}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-[#0f1d2e] hover:bg-[#13273d] border border-white/10 hover:border-purple-500/50 transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                <Wallet className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Other Browser Wallet</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-snug">
                  Coinbase, Rabby, OKX, Brave, Phantom or other web3 extension
                </p>
              </div>
            </div>
            <div className="text-gray-500 group-hover:text-purple-400 text-lg transition-colors pl-2">
              →
            </div>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            BNB Smart Chain (BEP-20)
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Instant Verification
          </span>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// CORE PRICING CONTENT COMPONENT
// -------------------------------------------------------------
function PaywallPricingContent({ isEmbedded = false, showTopBar = true }) {
  const navigate = useNavigate();
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedPlanType, setSelectedPlanType] = useState('monthly');

  // Wallet Connection & Payment State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [paymentState, setPaymentState] = useState('idle'); // 'idle' | 'signing' | 'confirming' | 'verifying' | 'success' | 'error'
  const [paymentError, setPaymentError] = useState('');

  // Wagmi hooks
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { data: hash, writeContract, isPending: isWritePending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: Boolean(hash),
    },
  });

  const verifiedHashesRef = useRef(new Set());
  const subType = localStorage.getItem('subscriptionType') || 'free';
  const isYearly = billingCycle === 'yearly';
  const isWrongChain = isConnected && chainId !== bsc.id;

  const handleBack = () => {
    const isLoggedIn = Boolean(localStorage.getItem('token') || localStorage.getItem('userId'));
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleStartFree = async () => {
    if (!localStorage.getItem('token') && !localStorage.getItem('userId')) {
      navigate('/login');
      return;
    }
    setIsStartingTrial(true);
    try {
      const response = await api.post('/api/subscriptions/start-trial', {
        referredBy: localStorage.getItem('referred_by'),
      });
      if (response.data.success) {
        invalidateSubscriptionCache();
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Start trial error:', error);
      alert(error.response?.data?.error || 'Failed to start trial');
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleUpgradeClick = (plan, price) => {
    setSelectedPlanType(plan);
    setPaymentError('');

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

    executePayment(price);
  };

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
            const price = selectedPlanType === 'yearly' ? 114 : 14;
            setTimeout(() => {
              executePayment(price);
            }, 600);
          },
          onError: (err) => {
            console.error('[Payment] Wallet connection error:', err);
            setPaymentError(err?.message || 'Failed to connect wallet. Please try again.');
          },
        }
      );
    }
  };

  const executePayment = (priceInUsdt) => {
    setPaymentState('signing');
    setPaymentError('');

    try {
      const tokenUnits = parseUnits(String(priceInUsdt), 18);

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
            console.error('[Payment] writeContract error:', err);
            setPaymentState('idle');
            if (err?.message?.includes('User rejected') || err?.message?.includes('denied')) {
              setPaymentError('Transaction cancelled by user in wallet.');
            } else if (err?.message?.includes('insufficient funds')) {
              setPaymentError('Insufficient BNB for gas fees or insufficient USDT balance.');
            } else {
              setPaymentError(err?.shortMessage || err?.message || 'Transaction could not be submitted.');
            }
          },
        }
      );
    } catch (error) {
      console.error('[Payment] executePayment error:', error);
      setPaymentState('idle');
      setPaymentError(error?.shortMessage || error?.message || 'Transaction initialization failed.');
    }
  };

  useEffect(() => {
    if (hash && paymentState === 'signing') {
      setPaymentState('confirming');
    }
  }, [hash, paymentState]);

  useEffect(() => {
    if (isConfirmed && hash && !verifiedHashesRef.current.has(hash)) {
      verifiedHashesRef.current.add(hash);
      setPaymentState('verifying');

      api
        .post('/api/subscriptions/verify-crypto', {
          referredBy: localStorage.getItem('referred_by'),
          txHash: hash,
          plan: selectedPlanType,
        })
        .then((response) => {
          if (response.data.success) {
            setPaymentState('success');
            invalidateSubscriptionCache();
            setTimeout(() => {
              navigate('/dashboard');
            }, 1800);
          } else {
            setPaymentState('error');
            setPaymentError(response.data.error || 'Payment verification failed.');
          }
        })
        .catch((err) => {
          console.error('[Payment] Backend verification failed:', err);
          setPaymentState('error');
          setPaymentError(
            err.response?.data?.error ||
              'Payment confirmed on-chain, but server verification failed. Please click Retry below.'
          );
        });
    }
  }, [isConfirmed, hash, selectedPlanType, navigate]);

  const handleRetryVerification = async () => {
    if (!hash) return;
    setPaymentState('verifying');
    setPaymentError('');
    try {
      const response = await api.post('/api/subscriptions/verify-crypto', {
        referredBy: localStorage.getItem('referred_by'),
        txHash: hash,
        plan: selectedPlanType,
      });
      if (response.data.success) {
        setPaymentState('success');
        invalidateSubscriptionCache();
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setPaymentState('error');
        setPaymentError(response.data.error || 'Retry failed.');
      }
    } catch (err) {
      setPaymentState('error');
      setPaymentError(err.response?.data?.error || 'Verification retry failed.');
    }
  };

  return (
    <div className={`w-full flex flex-col items-center relative ${isEmbedded ? '' : 'text-white'}`}>
      {/* Top Bar Navigation (Rendered in full page mode) */}
      {!isEmbedded && showTopBar && (
        <div className="w-full max-w-5xl flex items-center justify-between mb-8 relative z-20">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>
              {localStorage.getItem('token') || localStorage.getItem('userId')
                ? 'Back to Dashboard'
                : 'Back to Home'}
            </span>
          </button>

          {isConnected && address && (
            <div className="flex items-center gap-2 bg-[#0b131f] border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-mono shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span className="text-gray-300 font-semibold">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <span className="text-gray-500 font-mono text-[10px] uppercase">
                {chainId === bsc.id ? 'BSC' : 'Wrong Net'}
              </span>
              <button
                type="button"
                onClick={() => disconnect()}
                title="Disconnect Wallet"
                className="ml-1 text-gray-400 hover:text-red-400 transition-colors p-1 rounded cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Connected Wallet Pill in Embedded Mode */}
      {isEmbedded && isConnected && address && (
        <div className="w-full max-w-4xl flex items-center justify-end mb-4">
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-[#0b131f] border border-black/[0.08] dark:border-white/10 px-3 py-1 rounded-full text-xs font-mono shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-neutral-700 dark:text-gray-300 font-semibold">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <span className="text-neutral-400 dark:text-gray-500 text-[10px] uppercase">
              {chainId === bsc.id ? 'BSC' : 'Wrong Net'}
            </span>
            <button
              type="button"
              onClick={() => disconnect()}
              title="Disconnect Wallet"
              className="ml-1 text-neutral-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Wrong Network Warning Banner */}
      {isWrongChain && (
        <div className="w-full max-w-2xl mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-500 dark:text-amber-300 text-xs font-medium relative z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Your wallet is connected to a different network. Switch to BNB Smart Chain to pay with USDT.</span>
          </div>
          <button
            type="button"
            onClick={() => switchChain && switchChain({ chainId: bsc.id })}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs tracking-wider uppercase transition-colors shrink-0 cursor-pointer"
          >
            Switch to BSC
          </button>
        </div>
      )}

      {/* Payment In-Flight or Result Card */}
      {paymentState !== 'idle' && (
        <div className="w-full max-w-xl mb-6 p-5 rounded-3xl bg-[#0f1d2e] text-white border border-emerald-500/40 relative z-20 shadow-2xl text-center animate-in fade-in">
          {paymentState === 'signing' && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              <p className="font-bold text-sm text-white">Please confirm the transfer in your wallet...</p>
              <p className="text-xs text-gray-400">Approve the USDT transfer prompt in MetaMask or your mobile wallet.</p>
            </div>
          )}

          {paymentState === 'confirming' && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              <p className="font-bold text-sm text-white">Transaction broadcasting on BSC blockchain...</p>
              <p className="text-xs text-gray-400">Waiting for on-chain block confirmation (typically ~3 seconds).</p>
              {hash && (
                <a
                  href={`https://bscscan.com/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 font-mono mt-1"
                >
                  View on BscScan <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {paymentState === 'verifying' && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              <p className="font-bold text-sm text-white">Blockchain confirmed! Verifying payment on server...</p>
              <p className="text-xs text-gray-400">Activating your Pro Trader account privileges.</p>
            </div>
          )}

          {paymentState === 'success' && (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-bounce" />
              <p className="font-bold text-base text-white">Payment Verified & Pro Trader Unlocked!</p>
              <p className="text-xs text-emerald-300">Redirecting to your trading workspace...</p>
            </div>
          )}

          {paymentState === 'error' && (
            <div className="flex flex-col items-center gap-2.5">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <p className="font-bold text-sm text-red-300">{paymentError || 'Payment verification encountered an issue.'}</p>
              {hash && (
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={handleRetryVerification}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Retry Verification
                  </button>
                  <a
                    href={`https://bscscan.com/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-300 hover:text-white underline inline-flex items-center gap-1 font-mono"
                  >
                    View TX on BscScan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment Inline Error (if idle) */}
      {paymentState === 'idle' && paymentError && (
        <div className="w-full max-w-xl mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs text-red-500 dark:text-red-300 relative z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{paymentError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPaymentError('')}
            className="text-gray-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header (Standalone Mode only) */}
      {!isEmbedded && (
        <div className="text-center relative z-10 max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <Zap className="w-3 h-3" />
            <span>Membership Access</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            Select Your Trading Plan
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            10-Year Backtesting · Real-Time AI Psychology Coach · Card or USDT (BEP-20)
          </p>
        </div>
      )}

      {/* Monthly / Yearly Switch Toggle */}
      <div className="relative z-10 inline-flex items-center bg-neutral-200/80 dark:bg-slate-900/80 p-1.5 rounded-full border border-black/[0.08] dark:border-white/10 mb-8 shadow-md">
        <div
          className="absolute top-1.5 bottom-1.5 w-40 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/30 transition-transform duration-300 ease-out"
          style={{
            transform: isYearly ? 'translateX(160px)' : 'translateX(0px)',
          }}
        />

        <button
          type="button"
          onClick={() => setBillingCycle('monthly')}
          className={`relative z-10 w-40 py-2.5 px-3 text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer ${
            !isYearly ? 'text-white' : 'text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>MONTHLY</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold transition-all ${
              !isYearly ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}
          >
            25% OFF
          </span>
        </button>

        <button
          type="button"
          onClick={() => setBillingCycle('yearly')}
          className={`relative z-10 w-40 py-2.5 px-3 text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer ${
            isYearly ? 'text-white' : 'text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>YEARLY</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold transition-all ${
              isYearly ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}
          >
            50% OFF
          </span>
        </button>
      </div>

      {/* 2 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full justify-center items-stretch relative z-10">
        
        {/* Card 1: Beginner Trial */}
        <div className="bg-neutral-50/70 dark:bg-[#0b131f] border border-black/[0.08] dark:border-white/10 p-7 sm:p-8 rounded-3xl flex flex-col backdrop-blur-xl relative hover:border-black/[0.15] dark:hover:border-white/20 transition-all shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1.5">Beginner Trial</h2>
          <p className="text-neutral-500 dark:text-gray-400 text-xs mb-6">Test the trading journal completely free</p>

          <div className="mb-4">
            <div className="flex items-baseline gap-1" aria-label="Price: $0">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">$</span>
              <OdometerPrice value="0" height={42} />
              <span className="text-neutral-500 dark:text-gray-400 text-xs font-mono">/24 hours</span>
            </div>
            <p className="text-neutral-400 dark:text-gray-500 text-xs font-mono mt-1">No credit card required</p>
          </div>

          <div className="h-8 mb-4"></div>

          <ul className="text-xs space-y-3.5 mb-8 text-neutral-700 dark:text-gray-300 flex-1">
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>Full access to Trading Journal</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>Basic Session Analytics & Insights</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>24 Hours Unlimited Free Access</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>Prop Firm Drawdown Calculator</span>
            </li>
          </ul>

          <button
            onClick={handleStartFree}
            disabled={isStartingTrial}
            className="w-full mt-auto py-3.5 rounded-2xl font-bold text-xs tracking-wider uppercase border border-black/[0.1] dark:border-white/20 text-neutral-800 dark:text-white bg-black/[0.03] dark:bg-white/5 hover:bg-black/[0.06] dark:hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isStartingTrial ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Start For Free'}
          </button>
        </div>

        {/* Card 2: Pro Trader */}
        <div className="bg-emerald-500/[0.03] dark:bg-[#0f1d2e] border-2 border-emerald-500 p-7 sm:p-8 rounded-3xl flex flex-col backdrop-blur-xl relative shadow-[0_0_35px_rgba(16,185,129,0.18)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-extrabold font-mono tracking-widest uppercase py-1 px-3.5 rounded-full shadow-md">
            MOST POPULAR
          </div>

          <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1.5">Pro Trader</h2>
          <p className="text-neutral-500 dark:text-gray-400 text-xs mb-6">Full institutional backtesting & AI psychology suite</p>

          <div className="mb-2">
            <div
              className="flex items-baseline gap-1"
              aria-label={`Price: $${isYearly ? '114' : '14'} ${isYearly ? 'per year' : 'per month'}`}
            >
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">$</span>
              <OdometerPrice value={isYearly ? 114 : 14} height={42} />
              <span className="text-neutral-500 dark:text-gray-400 text-xs font-mono">
                {isYearly ? '/year' : '/month'}
              </span>
            </div>
            <p className="text-neutral-400 dark:text-gray-500 text-xs font-mono line-through mt-1">
              {isYearly ? '$228/year' : '$19/month'}
            </p>
          </div>

          {/* Discount Pop Badge */}
          <div className="h-8 mb-4 flex items-center">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold font-mono tracking-wide transition-all duration-300 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
            >
              <span>{isYearly ? 'SAVE 50% ON YEARLY ($114)' : 'SAVE 25% ON MONTHLY ($14)'}</span>
            </div>
          </div>

          <ul className="text-xs space-y-3.5 mb-8 text-neutral-700 dark:text-gray-300 flex-1">
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span><strong>10 Years</strong> of historical tick replay data</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span><strong>AI Psychology Coach</strong> (Pre-Trade Guard)</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>FTMO & Prop firm daily drawdown shield</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>Automated R-Multiple & session analytics</span>
            </li>
            <li className="flex items-start font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>Private Discord Alpha community</span>
            </li>
          </ul>

          {/* Action button */}
          <div className="space-y-2 mt-auto">
            <button
              onClick={() => handleUpgradeClick(isYearly ? 'yearly' : 'monthly', isYearly ? 114 : 14)}
              disabled={paymentState !== 'idle' && paymentState !== 'error'}
              className="w-full py-3.5 rounded-2xl font-bold text-xs tracking-wider uppercase bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-500/25 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              {paymentState === 'signing' || isWritePending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirm in Wallet...</span>
                </>
              ) : paymentState === 'confirming' || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming on BSC...</span>
                </>
              ) : paymentState === 'verifying' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Payment...</span>
                </>
              ) : paymentState === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Account Activated!</span>
                </>
              ) : isConnected ? (
                <span>
                  {isYearly ? 'Pay $114 USDT on BSC' : 'Pay $14 USDT on BSC'}
                </span>
              ) : (
                <span>
                  {isYearly ? 'Upgrade Pro Yearly ($114)' : 'Upgrade Pro Monthly ($14)'}
                </span>
              )}
            </button>

            {/* Subtext info under button */}
            <p className="text-[11px] text-center text-neutral-500 dark:text-gray-400 font-mono">
              {isConnected && address
                ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)} (BEP-20 USDT)`
                : 'Supports WalletConnect (QR Scanner), MetaMask & Web3 Wallets'}
            </p>
          </div>
        </div>

      </div>

      {/* Renew option for existing yearly subscribers */}
      {subType === 'yearly' && (
        <div className="mt-8 max-w-md w-full text-center">
          <button
            onClick={() => handleUpgradeClick('yearly', 114)}
            className="text-xs text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-500 transition-colors cursor-pointer"
          >
            Already an active Yearly subscriber? Click here to renew your membership ($114).
          </button>
        </div>
      )}

      {/* Modal for selecting wallet connection method */}
      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelect={handleSelectConnector}
        isConnecting={isConnecting}
      />
    </div>
  );
}

// -------------------------------------------------------------
// ERROR BOUNDARY
// -------------------------------------------------------------
class PaywallErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('[Paywall] Handled Web3 provider error:', err?.message);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-neutral-500 dark:text-gray-400 text-sm">
          Payment module temporarily loading. Please refresh or contact support.
        </div>
      );
    }
    return this.props.children;
  }
}

// -------------------------------------------------------------
// EXPORTED COMPONENT (Self-contained Web3 Provider + QueryClient)
// -------------------------------------------------------------
export default function PaywallPricingGrid(props) {
  return (
    <PaywallErrorBoundary>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={sharedQueryClient}>
          <PaywallPricingContent {...props} />
        </QueryClientProvider>
      </WagmiProvider>
    </PaywallErrorBoundary>
  );
}

