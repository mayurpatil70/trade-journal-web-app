import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { parseUnits } from 'viem';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios'; // using their axios instance

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

export default function Paywall() {
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState('monthly'); // track which plan is being purchased
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const navigate = useNavigate();
  
  const { data: hash, writeContract } = useWriteContract();
  
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const subType = localStorage.getItem('subscriptionType') || 'free';

  const handleStartFree = async () => {
    setIsStartingTrial(true);
    try {
      const response = await api.post('/api/subscriptions/start-trial', { referredBy: localStorage.getItem('referred_by') });
      if (response.data.success) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to start trial');
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleCryptoPayment = async (plan, price) => {
    setSelectedPlanType(plan);
    if (!isConnected) {
      const hasInjected = typeof window !== 'undefined' && window.ethereum;
      const wcConnector = connectors.find(c => c.id === 'walletConnect');
      const injectedConnector = connectors.find(c => c.id === 'injected' || c.id === 'metaMask') || connectors[0];
      
      const connectorToUse = hasInjected ? injectedConnector : (wcConnector || injectedConnector);
      
      if (connectorToUse) {
        connect({ connector: connectorToUse });
      } else {
        alert("Wallet connection failed. Please try again.");
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
      api.post('/api/subscriptions/verify-crypto', { 
        referredBy: localStorage.getItem('referred_by'),
        txHash: hash,
        plan: selectedPlanType
      }).then(response => {
        if(response.data.success) {
          window.location.href = '/dashboard';
        }
      }).catch(err => {
         console.error(err);
         alert("Payment confirmed on chain, but verification failed. Contact support.");
      });
    }
  }, [isConfirmed, hash, selectedPlanType]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center pt-20 relative">
      <button 
        onClick={() => navigate('/dashboard')}
        className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <h1 className="text-4xl font-bold mb-4">Let's setup your subscription!</h1>
      <p className="text-gray-400 mb-12">Please select the plan you want for your subscription.</p>

      {/* Pricing Cards */}
      <div className="flex flex-col md:flex-row gap-6 max-w-6xl w-full px-4 justify-center items-stretch">
        
        {/* Beginner (Free) Card - ONLY FOR FREE USERS */}
        {(subType === 'free' || subType === 'null' || !subType) && (
          <div className="bg-black/20 border border-white/5 p-8 rounded-2xl w-full md:w-80 flex flex-col">
            <h2 className="text-lg font-medium text-white mb-8">Beginner</h2>
            
            <div className="flex-1 flex flex-col justify-center items-center py-10">
               <h3 className="text-4xl font-bold mb-4">Free</h3>
               <p className="text-gray-500 text-sm text-center">Start improving your trading skills</p>
            </div>

            <ul className="text-sm space-y-4 mb-8 text-gray-300">
              <li className="flex items-center">✓ <span className="ml-3">Full access to Trading Journal</span></li>
              <li className="flex items-center">✓ <span className="ml-3">Analytics & Insights</span></li>
              <li className="flex items-center">✓ <span className="ml-3">24 Hours Free Access</span></li>
            </ul>

            <button 
              onClick={handleStartFree}
              disabled={isStartingTrial}
              className="w-full mt-auto py-3 rounded-full font-medium border border-white/20 text-white hover:bg-white/5 transition-all disabled:opacity-50"
            >
              {isStartingTrial ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : 'Start For Free'}
            </button>
          </div>
        )}

        {/* Monthly Card - Show for FREE users */}
        {(subType === 'free' || subType === 'null' || !subType) && (
          <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-2xl w-full md:w-80 flex flex-col relative overflow-hidden">
            <h2 className="text-lg font-medium text-white mb-4">Pro Monthly</h2>
            <div className="flex items-end gap-1 mb-2">
               <h3 className="text-4xl font-bold text-white">$14</h3>
               <span className="text-gray-400 text-sm mb-1">/monthly</span>
            </div>
            <p className="text-gray-500 text-xs line-through mb-4">$19/monthly</p>
            <div className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-center py-2 rounded-md mb-6 font-medium text-sm">Save 25% a month!</div>
            <p className="text-xs text-gray-400 mb-6">Everything you need to achieve profitability</p>

            <ul className="text-sm space-y-4 mb-8 text-gray-300 flex-1">
              <li className="flex items-center">✓ <span className="ml-3">Backtesting Sessions</span></li>
              <li className="flex items-center">✓ <span className="ml-3">Premium Indicators</span></li>
              <li className="flex items-center">✓ <span className="ml-3">Unlimited Data Retention</span></li>
              <li className="flex items-center">✓ <span className="ml-3">Advanced Charts</span></li>
            </ul>

            <button 
              onClick={() => handleCryptoPayment('monthly', 14)}
              className="w-full mt-auto py-3 rounded-full font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Upgrade Monthly
            </button>
          </div>
        )}

        {/* Yearly Card - Show for FREE and MONTHLY users */}
        {(subType !== 'yearly') && (
          <div className="bg-[#0A0A0A] border border-blue-500/30 p-8 rounded-2xl w-full md:w-80 flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(37,99,235,0.15)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
            <h2 className="text-lg font-medium text-white mb-4">Pro Yearly</h2>
            <div className="flex items-end gap-1 mb-2">
               <h3 className="text-4xl font-bold text-white">$117</h3>
               <span className="text-gray-400 text-sm mb-1">/yearly</span>
            </div>
            <p className="text-gray-500 text-xs line-through mb-4">$168/yearly</p>
            <div className="bg-blue-600 text-white text-center py-2 rounded-md mb-6 font-medium text-sm">Save 30% a year!</div>
            <p className="text-xs text-gray-400 mb-6">Everything you need to achieve profitability</p>

            <ul className="text-sm space-y-4 mb-8 text-gray-300 flex-1">
              <li className="flex items-center">✓ <span className="ml-3">Backtesting Sessions</span></li>
              <li className="flex items-center">✓ <span className="ml-3">Premium Indicators</span></li>
              <li className="flex items-center">✓ <span className="ml-3">Unlimited Data Retention</span></li>
              <li className="flex items-center">✓ <span className="ml-3">Advanced Charts</span></li>
              <li className="flex items-center font-semibold text-blue-400">✓ <span className="ml-3">Priority Support</span></li>
            </ul>

            <button 
              onClick={() => handleCryptoPayment('yearly', 117)}
              className="w-full mt-auto py-3 rounded-full font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-500/25"
            >
              Upgrade Yearly
            </button>
          </div>
        )}

        {/* Renew Yearly Card - ONLY FOR YEARLY USERS */}
        {(subType === 'yearly') && (
          <div className="bg-[#0A0A0A] border border-blue-500/30 p-8 rounded-2xl w-full md:w-80 flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(37,99,235,0.15)] mx-auto">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
            <h2 className="text-lg font-medium text-white mb-4">Extend Pro Yearly</h2>
            <div className="flex items-end gap-1 mb-2">
               <h3 className="text-4xl font-bold text-white">$117</h3>
               <span className="text-gray-400 text-sm mb-1">/yearly</span>
            </div>
            <p className="text-gray-500 text-xs mb-4">Add another 365 days to your active plan</p>
            
            <ul className="text-sm space-y-4 mb-8 text-gray-300 flex-1 mt-6">
              <li className="flex items-center">✓ <span className="ml-3">Keep all Pro features</span></li>
              <li className="flex items-center">✓ <span className="ml-3">Uninterrupted access</span></li>
              <li className="flex items-center">✓ <span className="ml-3">Lock in current pricing</span></li>
            </ul>

            <button 
              onClick={() => handleCryptoPayment('yearly', 117)}
              className="w-full mt-auto py-3 rounded-full font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-500/25"
            >
              Renew Subscription
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
            <li className="flex items-center">∞ <span className="ml-3">Backtesting Sessions</span></li>
            <li className="flex items-center">∞ <span className="ml-3">Indicators</span></li>
            <li className="flex items-center">∞ <span className="ml-3">Data Retention</span></li>
            <li className="flex items-center">∞ <span className="ml-3">Charts</span></li>
          </ul>

          <button 
            onClick={() => handleCryptoPayment(isYearly ? 'yearly' : 'monthly', isYearly ? 117 : 14)}
            disabled={isConfirming}
            className="w-full py-3 rounded-full font-bold shadow-[0_0_15px_rgba(234,179,8,0.5)] bg-yellow-500 text-black hover:bg-yellow-400 transition-all disabled:opacity-50 mt-auto"
          >
            {isConfirming ? (
               <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Confirming...</span>
            ) : !isConnected ? 'Connect Wallet' : 'Pay with Crypto (BEP20)'}
          </button>
          
          {(writeError || connectError) && (
            <p className="text-red-500 mt-3 text-xs text-center">
              {writeError?.shortMessage || writeError?.message || connectError?.shortMessage || connectError?.message}
            </p>
          )}
        </div>

      </div>
      
      <button 
        onClick={() => {
          localStorage.removeItem("userId");
          localStorage.removeItem("token");
          localStorage.removeItem("userEmail");
          window.location.href = "/login";
        }}
        className="mt-12 flex items-center gap-2 text-gray-400 hover:text-white transition-colors border border-gray-800 px-4 py-2 rounded-full"
      >
         <ArrowRight className="w-4 h-4 rotate-180" /> Logout
      </button>
    </div>
  );
}
