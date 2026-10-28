import React, { useState, useEffect } from 'react';
import { WagmiProvider, useWriteContract, useWaitForTransactionReceipt, useAccount, useConnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '../lib/wagmi';
import { parseUnits } from 'viem';
import { Loader2, ArrowLeft, CheckCircle2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { invalidateSubscriptionCache } from '../utils/subscriptionCache';

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
      return <PaywallFallbackView />;
    }
    return this.props.children;
  }
}

// Fallback view if Web3 / crypto library fails to load
const redirectAfterAccess = (navigate) => {
  const userId = localStorage.getItem('userId') || localStorage.getItem('userEmail') || '';
  const onboardingDone =
    localStorage.getItem(`onboarding_completed_${userId}`) === 'true' ||
    localStorage.getItem('onboarding_completed') === 'true';
  if (!onboardingDone) {
    navigate('/onboarding');
  } else {
    navigate('/dashboard');
  }
};

function PaywallFallbackView() {
  const navigate = useNavigate();
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const isYearly = billingCycle === 'yearly';

  const handleStartFree = async () => {
    setIsStartingTrial(true);
    try {
      const response = await api.post('/api/subscriptions/start-trial', {
        referredBy: localStorage.getItem('referred_by'),
      });
      if (response.data.success) {
        invalidateSubscriptionCache();
        redirectAfterAccess(navigate);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to start trial');
    } finally {
      setIsStartingTrial(false);
    }
  };

  return (
    <div className="paywall-container min-h-screen bg-[#060b11] text-white flex flex-col items-center pt-16 pb-24 px-4 relative overflow-x-hidden">
      <button
        onClick={() => navigate('/dashboard')}
        className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors z-20"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>
      <div className="text-center relative z-10 max-w-2xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
          <Zap className="w-3 h-3" />
          <span>Membership Access</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
          Select Your Trading Plan
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          10-Year Backtesting · Real-Time AI Psychology Coach · Instant Activation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full justify-center items-stretch relative z-10">
        <div className="bg-[#0b131f] border border-white/10 p-8 rounded-2xl flex flex-col backdrop-blur-xl">
          <h2 className="text-lg font-bold text-white mb-2">Beginner Trial</h2>
          <p className="text-gray-400 text-xs mb-6">Test the trading journal completely free</p>
          <div className="mb-4">
            <span className="text-4xl font-extrabold text-white">$0</span>
            <span className="text-gray-400 text-xs font-mono ml-1">/24 hours</span>
            <p className="text-gray-500 text-xs font-mono mt-1">No credit card required</p>
          </div>
          <button
            onClick={handleStartFree}
            disabled={isStartingTrial}
            className="w-full mt-auto py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase border border-white/20 text-white hover:bg-white/5 transition-all"
          >
            {isStartingTrial ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Start For Free'}
          </button>
        </div>

        <div className="bg-[#0f1d2e] border-2 border-emerald-500 p-8 rounded-2xl flex flex-col backdrop-blur-xl">
          <h2 className="text-lg font-bold text-white mb-2">Pro Trader</h2>
          <p className="text-gray-400 text-xs mb-6">Full institutional backtesting & AI psychology suite</p>
          <div className="mb-4">
            <span className="text-4xl font-extrabold text-white">{isYearly ? '$114' : '$14'}</span>
            <span className="text-gray-400 text-xs font-mono ml-1">{isYearly ? '/year' : '/month'}</span>
          </div>
          <button
            onClick={() => alert('Please connect using a Web3-enabled browser (e.g. MetaMask) or contact support.')}
            className="w-full mt-auto py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
          >
            Subscribe With USDT
          </button>
        </div>
      </div>
    </div>
  );
}

// BSC USDT Contract Address
const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
// Merchant Wallet from .env
const MERCHANT_WALLET = import.meta.env.VITE_BEP20_ADDRESS;

const ERC20_ABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const queryClient = new QueryClient();

export default function PaywallPage() {
  useEffect(() => {
    document.body.classList.add('terminal');
    return () => {
      document.body.classList.remove('terminal');
    };
  }, []);

  return (
    <PaywallErrorBoundary>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <Paywall />
        </QueryClientProvider>
      </WagmiProvider>
    </PaywallErrorBoundary>
  );
}

// -------------------------------------------------------------
// ODOMETER DIGIT ROLLER COMPONENT (60fps GPU transforms only)
// -------------------------------------------------------------
function OdometerPrice({ value, height = 40 }) {
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

function Paywall() {
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedPlanType, setSelectedPlanType] = useState('monthly');
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('terminal');
    return () => {
      document.body.classList.remove('terminal');
    };
  }, []);

  const { data: hash, writeContract } = useWriteContract();

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: Boolean(hash),
    },
  });

  const subType = localStorage.getItem('subscriptionType') || 'free';

  const handleStartFree = async () => {
    setIsStartingTrial(true);
    try {
      const response = await api.post('/api/subscriptions/start-trial', {
        referredBy: localStorage.getItem('referred_by'),
      });
      if (response.data.success) {
        invalidateSubscriptionCache();
        redirectAfterAccess(navigate);
      }
    } catch (error) {
      console.error('Start trial error:', error);
      alert(error.response?.data?.error || 'Failed to start trial');
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleCryptoPayment = async (plan, price) => {
    setSelectedPlanType(plan);
    if (!isConnected) {
      const hasInjected = typeof window !== 'undefined' && window.ethereum;
      const wcConnector = connectors.find((c) => c.id === 'walletConnect');
      const injectedConnector =
        connectors.find((c) => c.id === 'injected' || c.id === 'metaMask') || connectors[0];

      const connectorToUse = hasInjected ? injectedConnector : wcConnector || injectedConnector;

      if (connectorToUse) {
        connect({ connector: connectorToUse });
      } else {
        alert('Wallet connection failed. Please try again.');
      }
      return;
    }

    try {
      const amount = parseUnits(price.toString(), 18);
      writeContract({
        address: USDT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [MERCHANT_WALLET, amount],
      });
    } catch (error) {
      console.error(error);
      alert('Transaction initialization failed.');
    }
  };

  useEffect(() => {
    if (isConfirmed && hash) {
      api
        .post('/api/subscriptions/verify-crypto', {
          referredBy: localStorage.getItem('referred_by'),
          txHash: hash,
          plan: selectedPlanType,
        })
        .then((response) => {
          if (response.data.success) {
            invalidateSubscriptionCache();
            redirectAfterAccess(navigate);
          }
        })
        .catch((err) => {
          console.error(err);
          alert('Payment confirmed on chain, but verification failed. Contact support.');
        });
    }
  }, [isConfirmed, hash, selectedPlanType]);

  const isYearly = billingCycle === 'yearly';

  return (
    <div className="paywall-container min-h-screen bg-[#060b11] text-white flex flex-col items-center pt-16 pb-24 px-4 relative overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, transparent 70%)',
          filter: 'blur(90px)',
          zIndex: 0,
        }}
      />

      <button
        onClick={() => navigate('/dashboard')}
        className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors z-20"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Header */}
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

      {/* Monthly / Yearly Switch Toggle */}
      <div className="relative z-10 inline-flex items-center bg-slate-900/80 p-1.5 rounded-full border border-white/10 mb-12 shadow-2xl">
        <div
          className="absolute top-1.5 bottom-1.5 w-40 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30 transition-transform duration-300 ease-out"
          style={{
            transform: isYearly ? 'translateX(160px)' : 'translateX(0px)',
          }}
        />

        <button
          type="button"
          onClick={() => setBillingCycle('monthly')}
          className={`relative z-10 w-40 py-2.5 px-3 text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 transition-colors duration-200 ${
            !isYearly ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>MONTHLY</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold transition-all ${
              !isYearly ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            25% OFF
          </span>
        </button>

        <button
          type="button"
          onClick={() => setBillingCycle('yearly')}
          className={`relative z-10 w-40 py-2.5 px-3 text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 transition-colors duration-200 ${
            isYearly ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>YEARLY</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold transition-all ${
              isYearly ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            50% OFF
          </span>
        </button>
      </div>

      {/* 2 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full justify-center items-stretch relative z-10">
        
        {/* Card 1: Beginner (Free Trial) */}
        <div className="bg-[#0b131f] border border-white/10 p-8 rounded-2xl flex flex-col backdrop-blur-xl relative hover:border-white/20 transition-all">
          <h2 className="text-lg font-bold text-white mb-2">Beginner Trial</h2>
          <p className="text-gray-400 text-xs mb-6">Test the trading journal completely free</p>

          <div className="mb-4">
            <div className="flex items-baseline gap-1" aria-label="Price: $0">
              <span className="text-2xl font-bold text-white">$</span>
              <OdometerPrice value="0" height={42} />
              <span className="text-gray-400 text-xs font-mono">/24 hours</span>
            </div>
            <p className="text-gray-500 text-xs font-mono mt-1">No credit card required</p>
          </div>

          <div className="h-8 mb-4"></div>

          <ul className="text-sm space-y-3.5 mb-8 text-gray-300 flex-1">
            <li className="flex items-start text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>Full access to Trading Journal</span>
            </li>
            <li className="flex items-start text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>Basic Session Analytics & Insights</span>
            </li>
            <li className="flex items-start text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>24 Hours Unlimited Free Access</span>
            </li>
            <li className="flex items-start text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>Prop Firm Drawdown Calculator</span>
            </li>
          </ul>

          <button
            onClick={handleStartFree}
            disabled={isStartingTrial}
            className="w-full mt-auto py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase border border-white/20 text-white bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {isStartingTrial ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Start For Free'}
          </button>
        </div>

        {/* Card 2: Pro Trader (Most Popular, 50% Odometer Roll) */}
        <div className="bg-[#0f1d2e] border-2 border-emerald-500 p-8 rounded-2xl flex flex-col backdrop-blur-xl relative shadow-[0_0_40px_rgba(16,185,129,0.22)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-teal-400 text-[#060b11] text-[10px] font-extrabold font-mono tracking-widest uppercase py-1 px-3.5 rounded-full shadow-lg">
            MOST POPULAR
          </div>

          <h2 className="text-lg font-bold text-white mb-2">Pro Trader</h2>
          <p className="text-gray-400 text-xs mb-6">Full institutional backtesting & AI psychology suite</p>

          <div className="mb-2">
            <div
              className="flex items-baseline gap-1"
              aria-label={`Price: $${isYearly ? '114' : '14'} ${isYearly ? 'per year' : 'per month'}`}
            >
              <span className="text-2xl font-bold text-white">$</span>
              <OdometerPrice value={isYearly ? 114 : 14} height={42} />
              <span className="text-gray-400 text-xs font-mono">
                {isYearly ? '/year' : '/month'}
              </span>
            </div>
            <p className="text-gray-500 text-xs font-mono line-through mt-1">
              {isYearly ? '$228/year' : '$19/month'}
            </p>
          </div>

          {/* Discount Pop Badge (25% on Monthly, 50% on Yearly) */}
          <div className="h-8 mb-4 flex items-center">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold font-mono tracking-wide transition-all duration-300"
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.35)',
              }}
            >
              <span>{isYearly ? '⚡ SAVE 50% ON YEARLY ($114)' : '⚡ SAVE 25% ON MONTHLY ($14)'}</span>
            </div>
          </div>

          <ul className="text-sm space-y-3.5 mb-8 text-gray-300 flex-1">
            <li className="flex items-start text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span><strong>10 Years</strong> of historical tick replay data</span>
            </li>
            <li className="flex items-start text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span><strong>AI Psychology Coach</strong> (Pre-Trade Guard)</span>
            </li>
            <li className="flex items-start text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>FTMO & Prop firm daily drawdown shield</span>
            </li>
            <li className="flex items-start text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>Automated R-Multiple & session analytics</span>
            </li>
            <li className="flex items-start text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0 mt-0.5" />
              <span>Private Discord Alpha community</span>
            </li>
          </ul>

          <button
            onClick={() => handleCryptoPayment(isYearly ? 'yearly' : 'monthly', isYearly ? 114 : 14)}
            className="w-full mt-auto py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-500/25"
          >
            {isYearly ? 'Upgrade Pro Yearly ($114)' : 'Upgrade Pro Monthly ($14)'}
          </button>
        </div>

      </div>

      {/* Renew option for existing yearly subscribers */}
      {subType === 'yearly' && (
        <div className="mt-8 max-w-md w-full text-center">
          <button
            onClick={() => handleCryptoPayment('yearly', 114)}
            className="text-xs text-emerald-400 underline hover:text-emerald-300 transition-colors"
          >
            Already an active Yearly subscriber? Click here to renew your membership ($114).
          </button>
        </div>
      )}
    </div>
  );
}
