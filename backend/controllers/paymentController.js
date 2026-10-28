import { supabase } from '../config/supabase.js';
import { ethers } from 'ethers';
import { sendRevenueAlert } from '../utils/discordWebhook.js';

const BSC_RPC_URL = 'https://bsc-dataseed.binance.org/';
const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export const verifyCryptoPayment = async (req, res) => {
  const { txHash, plan, referredBy } = req.body || {};
  // SECURITY: Only trust verified session/token userId, never user-submitted req.body.userId
  const userId = req.userId || req.user?.id;
  
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // Validate plan
  const normalizedPlan = (plan === 'yearly') ? 'yearly' : 'monthly';

  // Validate txHash format (66-character hex string starting with 0x)
  if (!txHash || typeof txHash !== 'string' || !/^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
    return res.status(400).json({ error: 'Invalid transaction hash format' });
  }

  const normalizedHash = txHash.toLowerCase();

  try {
    // 1. REPLAY PROTECTION: Verify that txHash has not already been used
    const { data: existingTx } = await supabase
      .from("journal_subscriptions")
      .select("id, status")
      .eq("tx_hash", normalizedHash)
      .maybeSingle();

    if (existingTx) {
      return res.status(409).json({ error: 'This transaction hash has already been used and verified.' });
    }

    // 2. Fetch on-chain transaction & receipt
    const tx = await provider.getTransaction(normalizedHash);
    const receipt = await provider.getTransactionReceipt(normalizedHash);
    
    if (!tx || !receipt || receipt.status !== 1) {
      return res.status(400).json({ error: 'Invalid or failed transaction' });
    }

    // 3. FRESHNESS CHECK: Ensure transaction was mined within the last 48 hours
    if (receipt.blockNumber) {
      try {
        const block = await provider.getBlock(receipt.blockNumber);
        if (block && block.timestamp) {
          const txAgeSeconds = Math.floor(Date.now() / 1000) - Number(block.timestamp);
          if (txAgeSeconds > 48 * 3600) {
            return res.status(400).json({ error: 'Transaction is too old. Payments must be verified within 48 hours.' });
          }
          if (txAgeSeconds < -300) {
            return res.status(400).json({ error: 'Invalid transaction timestamp.' });
          }
        }
      } catch (blockErr) {
        console.warn('[Payment] Could not inspect block timestamp:', blockErr?.message);
      }
    }

    const expectedTokenAddress = '0x55d398326f99059fF775485246999027B3197955'.toLowerCase(); // BSC USDT
    const yourMerchantWallet = (process.env.BEP20_ADDRESS || "").toLowerCase();
    if (!yourMerchantWallet) {
      return res.status(503).json({ error: "Merchant wallet address is not configured." });
    }
    
    if (tx.to && tx.to.toLowerCase() !== expectedTokenAddress) {
       return res.status(400).json({ error: 'Transaction was not sent to the BSC USDT contract' });
    }

    const iface = new ethers.Interface(ERC20_ABI);
    let validTransferFound = false;

    for (const log of (receipt.logs || [])) {
      // SECURITY: Strictly ensure the log is emitted by the legitimate USDT contract
      if (!log.address || log.address.toLowerCase() !== expectedTokenAddress) {
        continue;
      }

      try {
        const parsedLog = iface.parseLog(log);
        if (
          parsedLog &&
          parsedLog.name === 'Transfer' && 
          parsedLog.args.to &&
          parsedLog.args.to.toLowerCase() === yourMerchantWallet
        ) {
           const amountTransferred = ethers.formatUnits(parsedLog.args.value, 18);
           const expectedAmount = normalizedPlan === 'yearly' ? '114.0' : '14.0';
           
           if (parseFloat(amountTransferred) >= parseFloat(expectedAmount) * 0.99) { // 1% tolerance
             validTransferFound = true;
             break;
           }
        }
      } catch (e) {
        // Not a matching Transfer event
      }
    }

    if (!validTransferFound) {
      return res.status(400).json({ error: 'Invalid amount or recipient' });
    }

    const daysToAdd = normalizedPlan === 'yearly' ? 365 : 30;
    const pricePaid = normalizedPlan === 'yearly' ? 114 : 14;
    const affiliateCommission = pricePaid * 0.10;

    // 4. RECORD TRANSACTION TO PREVENT REPLAY ATTACKS
    const { error: insertErr } = await supabase
      .from("journal_subscriptions")
      .insert({
        user_id: userId,
        status: "paid",
        amount_usdt: pricePaid,
        chain: "BEP20",
        tx_hash: normalizedHash,
        paid_at: new Date().toISOString(),
      });

    if (insertErr) {
      if (insertErr.code === '23505' || insertErr.message?.includes('duplicate') || insertErr.message?.includes('unique')) {
        return res.status(409).json({ error: 'This transaction hash has already been used.' });
      }
      console.error("[Payment] journal_subscriptions insert error:", insertErr);
    }

    // 5. Calculate subscription end date (extending if active)
    let baseDate = new Date();
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('subscription_ends_at, referral_code, referred_by')
      .eq('id', userId)
      .maybeSingle();

    if (currentProfile?.subscription_ends_at) {
      const currentEnd = new Date(currentProfile.subscription_ends_at);
      if (currentEnd > baseDate) {
        baseDate = currentEnd;
      }
    }
    const newSubEndDate = new Date(baseDate);
    newSubEndDate.setDate(newSubEndDate.getDate() + daysToAdd);

    // Fetch user email just in case we need to insert
    const { data: userRow } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
    const email = userRow?.email || `user-${userId}@forexnotes.in`;

    // 6. Upsert User Subscription in Supabase
    const { data: user, error: userErr } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        current_plan: normalizedPlan,
        subscription_ends_at: newSubEndDate.toISOString(),
        account_status: 'active',
        ...(referredBy ? { referred_by: referredBy } : {})
      }, { onConflict: 'id' })
      .select('referred_by, referral_code')
      .maybeSingle();

    if (userErr && userErr.code !== 'PGRST116') {
      console.error("Profile update error:", userErr);
    }

    // 7. Process Affiliate Commission (with self-referral prevention)
    const referrer = user?.referred_by || currentProfile?.referred_by || referredBy;
    if (referrer && referrer !== user?.referral_code && referrer !== currentProfile?.referral_code) {
      const { data: affiliate } = await supabase
        .from('profiles')
        .select('id, wallet_balance')
        .eq('referral_code', referrer)
        .maybeSingle();

      if (affiliate && affiliate.id !== userId) {
        await supabase
          .from('profiles')
          .update({ wallet_balance: parseFloat(affiliate.wallet_balance || 0) + affiliateCommission })
          .eq('id', affiliate.id);
      }
    }

    // 8. Send Discord Revenue Webhook Alert
    try {
      await sendRevenueAlert({
        type: `Journal Pro (${normalizedPlan === 'yearly' ? 'Yearly' : 'Monthly'})`,
        userId,
        amount: pricePaid,
        chain: "BEP20",
        txHash: normalizedHash,
      });
    } catch (alertErr) {
      console.warn('[Payment] Discord revenue alert notification failed:', alertErr?.message);
    }

    res.status(200).json({ success: true, message: 'Payment verified and Pro Trader activated!' });

  } catch (error) {
    if (error?.code === 'INVALID_ARGUMENT' || error?.message?.includes('invalid argument')) {
      return res.status(400).json({ error: 'Invalid or failed transaction' });
    }
    console.error('[Payment] Verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
};
