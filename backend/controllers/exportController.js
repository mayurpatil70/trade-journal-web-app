import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const exportUserData = async (req, res) => {
  try {
    const { userId, format } = req.query;

    if (!userId) {
      return.status(400).json({ error: "User ID is required." });
    }

    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    if (!trades || trades.length === 0) {
      return.status(404).json({ error: "No trades found to export." });
    }

    if (format === "csv") {
      const headers = ["Date", "Asset", "Direction", "Setup", "Result", "R-Multiple", "Net P&L"];
      const rows = trades.map(t => [
        t.date,
        t.asset,
        t.direction,
        t.setup,
        t.result,
        t.r_multiple,
        t.net_pl || 0
      ]);

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=trade_journal.csv");
      return res.status(200).send(csvContent);
    }

    // For other formats (Excel, PDF, DOC), send JSON or formatted payload
    return.status(200).json({ success: true, data: trades });
  } catch (error) {
    console.error("Export Error:", error);
    return.status(500).json({ error: "Failed to generate export file." });
  }
};