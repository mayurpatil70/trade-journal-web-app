import { supabase } from '../config/supabase.js';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/'); // BSC RPC

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export const verifyCryptoPayment = async (req, res) => {
  const { txHash, plan, referredBy } = req.body;
  const userId = req.user?.id || req.body?.userId || req.userId;
  
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!tx || !receipt || receipt.status !== 1) {
      return res.status(400).json({ error: 'Invalid or failed transaction' });
    }

    const expectedTokenAddress = '0x55d398326f99059fF775485246999027B3197955'.toLowerCase();
    const yourMerchantWallet = process.env.BEP20_ADDRESS.toLowerCase();
    
    if (tx.to.toLowerCase() !== expectedTokenAddress) {
       return res.status(400).json({ error: 'Transaction was not sent to the USDT contract' });
    }

    const iface = new ethers.Interface(ERC20_ABI);
    let validTransferFound = false;

    for (const log of receipt.logs) {
      try {
        const parsedLog = iface.parseLog(log);
        if (
          parsedLog.name === 'Transfer' && 
          parsedLog.args.to.toLowerCase() === yourMerchantWallet
        ) {
           const amountTransferred = ethers.formatUnits(parsedLog.args.value, 18);
           const expectedAmount = plan === 'yearly' ? '114.0' : '14.0';
           
           if (parseFloat(amountTransferred) >= parseFloat(expectedAmount) * 0.99) { // 1% tolerance for float issues
             validTransferFound = true;
             break;
           }
        }
      } catch (e) {}
    }

    if (!validTransferFound) {
      return res.status(400).json({ error: 'Invalid amount or recipient' });
    }

    const daysToAdd = plan === 'yearly' ? 365 : 30;
    const pricePaid = plan === 'yearly' ? 114 : 14;
    const affiliateCommission = pricePaid * 0.10;

    const newSubEndDate = new Date();
    newSubEndDate.setDate(newSubEndDate.getDate() + daysToAdd);

    // Fetch user email just in case we need to insert
    const { data: userRow } = await supabase.from('users').select('email').eq('id', userId).single();
    const email = userRow?.email || `user-${userId}@forexnotes.in`;

    // Upsert User Subscription in Supabase
    const { data: user, error: userErr } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        current_plan: plan,
        subscription_ends_at: newSubEndDate,
        account_status: 'active',
        ...(referredBy ? { referred_by: referredBy } : {})
      }, { onConflict: 'id' })
      .select('referred_by')
      .single();

    if (userErr && userErr.code !== 'PGRST116') {
        console.error("Profile update error:", userErr);
    }

    // Process Affiliate Commission
    const referrer = user?.referred_by || referredBy;
    if (referrer) {
      const { data: affiliate } = await supabase
        .from('profiles')
        .select('id, wallet_balance')
        .eq('referral_code', referrer)
        .single();

      if (affiliate) {
        await supabase
          .from('profiles')
          .update({ wallet_balance: parseFloat(affiliate.wallet_balance || 0) + affiliateCommission })
          .eq('id', affiliate.id);
      }
    }

    res.status(200).json({ success: true, message: 'Payment verified and account activated!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
};
