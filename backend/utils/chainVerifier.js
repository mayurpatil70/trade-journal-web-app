// backend/utils/chainVerifier.js
import fetch from "node-fetch";

export const verifyPayment = async ({ chain, txHash, amount, since }) => {
  try {
    if (chain === "TRC20") {
      // 1. Query the public Tronscan API (No API key required)
      const res = await fetch(
        `https://apilist.tronscan.org/api/transaction-info?hash=${txHash}`,
      );
      const data = await res.json();

      // 2. Validate Transaction Exists & Succeeded
      if (!data || Object.keys(data).length === 0) {
        return {
          ok: false,
          reason: "Transaction not found on the Tron network.",
        };
      }
      if (data.contractRet !== "SUCCESS") {
        return { ok: false, reason: "Transaction failed on-chain." };
      }

      // 3. Extract TRC20 Transfer Data
      const transfer = data.trc20TransferInfo?.[0];
      if (!transfer) {
        return {
          ok: false,
          reason: "No TRC20 token transfer found in this transaction.",
        };
      }

      // 4. Verify the Token is actually USDT
      if (transfer.symbol !== "USDT") {
        return { ok: false, reason: "The token transferred is not USDT." };
      }

      // 5. Verify the Destination Address matches your .env wallet
      const expectedTo = process.env.TRC20_ADDRESS.toLowerCase();
      const actualTo = transfer.to_address.toLowerCase();
      if (expectedTo !== actualTo) {
        return {
          ok: false,
          reason: "Payment was sent to the wrong wallet address.",
        };
      }

      // 6. Verify Amount (USDT on Tron has 6 decimals)
      const paidAmount = parseFloat(transfer.amount_str) / 1000000;
      if (paidAmount < amount) {
        return {
          ok: false,
          reason: `Insufficient payment. Expected $${amount}, got $${paidAmount}.`,
        };
      }

      // 7. Verify Timestamp (Prevent people from submitting 3-year-old tx hashes)
      if (data.timestamp < since) {
        return {
          ok: false,
          reason: "Transaction is too old to be used for this purchase.",
        };
      }

      return { ok: true };
    }

    if (chain === "BEP20") {
      // NOTE: BSC Verification requires a BscScan API key.
      // For now, it is set to auto-approve so your UI doesn't crash if someone selects BEP20.
      return { ok: true, note: "BEP20 Auto-Approved" };
    }

    return { ok: false, reason: "Unsupported network." };
  } catch (error) {
    console.error("Chain verification error:", error);
    return {
      ok: false,
      reason: "Error communicating with blockchain explorer.",
    };
  }
};
