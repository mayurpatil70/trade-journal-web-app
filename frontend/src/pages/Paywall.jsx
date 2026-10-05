import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { parseUnits } from 'viem';
import { Loader2, ArrowRight } from 'lucide-react';
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
  const [isYearly, setIsYearly] = useState(false);
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  
  const { data: hash, writeContract, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleCryptoPayment = async (plan, price) => {
    if (!isConnected) {
      connect({ connector: injected() });
      return;
    }
    
    try {
      // 18 decimals for BSC USDT
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
      // Verify payment with backend
      api.post('/api/subscriptions/verify-crypto', {
        txHash: hash,
        plan: isYearly ? 'yearly' : 'monthly'
      }).then(response => {
        if(response.data.success) {
          window.location.href = '/dashboard';
        }
      }).catch(err => {
         console.error(err);
         alert("Payment confirmed on chain, but verification failed. Contact support.");
      });
    }
  }, [isConfirmed, hash, isYearly]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center pt-20">
      <h1 className="text-4xl font-bold mb-4">Let's setup your subscription!</h1>
      <p className="text-gray-400 mb-8">Please select the plan you want for your subscription.</p>
      
      {/* Toggle */}
      <div className="flex space-x-2 bg-black/40 p-1 rounded-full border border-white/10 mb-10">
        <button 
          className={`px-6 py-2 rounded-full transition-colors ${!isYearly ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setIsYearly(false)}
        >Monthly</button>
        <button 
          className={`px-6 py-2 rounded-full transition-colors ${isYearly ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setIsYearly(true)}
        >Yearly</button>
      </div>

      {/* Pricing Cards */}
      <div className="flex flex-col md:flex-row gap-6 max-w-5xl w-full px-4 justify-center">
        
        {/* Beginner (Free) Card */}
        <div className="bg-black/20 border border-white/5 p-8 rounded-2xl w-full md:w-80 flex flex-col">
          <h2 className="text-lg font-medium text-white mb-8">Beginner</h2>
          
          <div className="flex-1 flex flex-col justify-center items-center py-10">
             <h3 className="text-4xl font-bold mb-4">Free</h3>
             <p className="text-gray-500 text-sm">Start improving your trading skills</p>
          </div>

          <ul className="text-sm space-y-4 mb-8 text-gray-300">
            <li className="flex items-center">✓ <span className="ml-3">2 Backtesting Sessions</span></li>
            <li className="flex items-center">✓ <span className="ml-3">1 Indicator</span></li>
            <li className="flex items-center">✓ <span className="ml-3">1 week Data Retention</span></li>
          </ul>

          <button 
            className="w-full py-3 rounded-full font-medium border border-white/20 text-white hover:bg-white/5 transition-all"
          >
            Start For Free
          </button>
        </div>

        {/* Pro Card (The focus) */}
        <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-2xl w-full md:w-80 flex flex-col relative overflow-hidden">
          {/* Subtle glow effect in the background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>

          <h2 className="text-lg font-medium text-white mb-4">Pro</h2>
          
          {isYearly ? (
            <>
              <div className="flex items-end gap-1 mb-2">
                 <h3 className="text-4xl font-bold text-white">$117</h3>
                 <span className="text-gray-400 text-sm mb-1">/yearly</span>
              </div>
              <p className="text-gray-500 text-xs line-through mb-4">$168/yearly</p>
              <div className="bg-blue-600 text-white text-center py-2 rounded-md mb-6 font-medium text-sm">Save 30% a year!</div>
            </>
          ) : (
            <>
              <div className="flex items-end gap-1 mb-2">
                 <h3 className="text-4xl font-bold text-white">$14</h3>
                 <span className="text-gray-400 text-sm mb-1">/monthly</span>
              </div>
              <p className="text-gray-500 text-xs line-through mb-4">$19/monthly</p>
              <div className="bg-blue-600 text-white text-center py-2 rounded-md mb-6 font-medium text-sm">Save 25% a month!</div>
            </>
          )}

          <p className="text-xs text-gray-400 mb-6">Everything you need to achieve profitability</p>

          <ul className="text-sm space-y-4 mb-8 text-gray-300 flex-1">
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
          
          {writeError && <p className="text-red-500 mt-3 text-xs text-center">{writeError.shortMessage || writeError.message}</p>}
        </div>

      </div>
      
      <button className="mt-12 flex items-center gap-2 text-gray-400 hover:text-white transition-colors border border-gray-800 px-4 py-2 rounded-full">
         <ArrowRight className="w-4 h-4 rotate-180" /> Logout
      </button>
    </div>
  );
}
