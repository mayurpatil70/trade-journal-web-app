import { useEffect, useState } from 'react';
import api from '../api/axios'; 

export default function AffiliateDashboard() {
  const [profile, setProfile] = useState(null);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/affiliate/profile');
      setProfile(response.data.profile);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (profile.wallet_balance < 25) return alert('Minimum $25 required');
    if (!withdrawAddress) return alert('Enter a BEP20 address');

    try {
      await api.post('/api/affiliate/withdraw', { withdrawAddress });
      alert('Withdrawal requested successfully! Please allow 3-5 business days for manual processing.');
      fetchProfile(); // Refresh UI
      setWithdrawAddress('');
    } catch (error) {
       console.error(error);
       alert('Error requesting withdrawal. Try again.');
    }
  };

  if (loading) return <div className="text-white p-10">Loading...</div>;
  if (!profile) return <div className="text-white p-10">Please log in.</div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-10">
      <h1 className="text-3xl font-bold mb-8">Affiliate Partner Hub</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Referral Link Card */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h2 className="text-xl mb-4">Your Referral Link</h2>
          <p className="text-sm text-gray-400 mb-2">Earn 10% on every Monthly ($1.40) and Yearly ($11.70) sale.</p>
          <div className="bg-black p-3 rounded text-emerald-400 font-mono overflow-x-auto">
            https://forexnotes.in/?ref={profile.referral_code}
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`https://forexnotes.in/?ref=${profile.referral_code}`);
              alert('Copied!');
            }}
            className="mt-4 bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Copy Link
          </button>
        </div>

        {/* Wallet & Withdrawal Card */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h2 className="text-xl mb-4">Available Earnings</h2>
          <h3 className="text-5xl font-bold text-green-400 mb-6">${Number(profile.wallet_balance || 0).toFixed(2)}</h3>
          
          <input 
            type="text" 
            placeholder="Your BEP20 USDT Address" 
            className="w-full bg-black border border-gray-700 rounded p-3 mb-4 text-white focus:outline-none focus:border-emerald-500"
            value={withdrawAddress}
            onChange={(e) => setWithdrawAddress(e.target.value)}
          />
          
          <button 
            onClick={handleWithdraw}
            disabled={(profile.wallet_balance || 0) < 25}
            className={`w-full py-3 rounded-lg font-bold transition-colors ${(profile.wallet_balance || 0) >= 25 ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-600 cursor-not-allowed text-gray-400'}`}
          >
            Withdraw to Wallet (Min $25)
          </button>
          <p className="text-xs text-gray-500 mt-4 text-center">Withdrawals take 3-5 business days to be manually verified and paid.</p>
        </div>
      </div>
    </div>
  );
}
