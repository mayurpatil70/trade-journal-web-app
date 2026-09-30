// backend/utils/chainVerifier.js
import fetch from "node-fetch";

export const verifyPayment = async ({ chain, txHash, amount, since }) => {
  try {
    if (chain === "BEP20") {
      // NOTE: Without a BSCScan API key, we cannot reliably auto-verify.
      // Therefore, this will default to pending for manual admin approval.
      return { ok: true, status: "pending", note: "Requires Admin Approval" };
    }

    return { ok: false, reason: "Unsupported network. Only BEP20 is supported." };
  } catch (error) {
    console.error("Chain verification error:", error);
    return {
      ok: false,
      reason: "Error communicating with blockchain explorer.",
    };
  }
};
