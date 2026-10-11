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

  if (loading) return <div className="p-10 text-muted-foreground">Loading...</div>;
  if (!profile) return <div className="p-10 text-muted-foreground">Please log in.</div>;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 text-foreground">
      <h1 className="text-3xl font-serif font-medium mb-8">Affiliate Partner Hub</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Referral Link Card */}
        <div className="ledger-card p-6">
          <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
          <p className="text-sm text-muted-foreground mb-2">Earn 10% on every Monthly ($1.40) and Yearly ($11.40) sale.</p>
          <div className="bg-muted p-3 rounded-lg text-primary font-mono text-sm overflow-x-auto">
            https://forexnotes.in/?ref={profile.referral_code}
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`https://forexnotes.in/?ref=${profile.referral_code}`);
              alert('Copied!');
            }}
            className="mt-4 bg-secondary text-secondary-foreground border border-border px-4 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            Copy Link
          </button>
        </div>

        {/* Wallet & Withdrawal Card */}
        <div className="ledger-card p-6">
          <h2 className="text-xl font-semibold mb-4">Available Earnings</h2>
          <h3 className="text-5xl font-serif font-medium text-primary mb-6">${Number(profile.wallet_balance || 0).toFixed(2)}</h3>
          
          <input 
            type="text" 
            placeholder="Your BEP20 USDT Address" 
            className="w-full bg-muted border border-border rounded-lg p-3 mb-4 text-foreground focus:outline-none focus:border-primary"
            value={withdrawAddress}
            onChange={(e) => setWithdrawAddress(e.target.value)}
          />
          
          <button 
            onClick={handleWithdraw}
            disabled={(profile.wallet_balance || 0) < 25}
            className={`w-full py-3 rounded-lg font-bold transition-colors ${(profile.wallet_balance || 0) >= 25 ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-muted cursor-not-allowed text-muted-foreground'}`}
          >
            Withdraw to Wallet (Min $25)
          </button>
          <p className="text-xs text-muted-foreground mt-4 text-center">Withdrawals take 3-5 business days to be manually verified and paid.</p>
        </div>
      </div>
    </div>
  );
}
