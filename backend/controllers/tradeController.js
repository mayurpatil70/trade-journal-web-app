// backend/controllers/tradeController.js
import { Parser } from "json2csv";
import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";
import { supabase } from "../config/supabase.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const createTrade = async (req, res) => {
  try {
    const { userId } = req;
    const tradeData = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Missing User ID" });
    }

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        imageUrls.push(url);
      }
    }

    // Parse executions if they exist (usually sent as JSON string in FormData)
    let parsedExecutions = [];
    if (tradeData.executions) {
      try {
        parsedExecutions = JSON.parse(tradeData.executions);
      } catch (e) {
        console.error("Failed to parse executions:", e);
      }
    }

    const insertData = {
      user_id: userId,
      date: tradeData.date,
      time: tradeData.time,
      asset: tradeData.asset,
      direction: tradeData.direction,
      session: tradeData.session,
      setup: tradeData.setup,
      entry: tradeData.entry ? parseFloat(tradeData.entry) : null,
      sl: tradeData.sl ? parseFloat(tradeData.sl) : null,
      tp: tradeData.tp ? parseFloat(tradeData.tp) : null,
      risk: tradeData.risk ? parseFloat(tradeData.risk) : null,
      result: tradeData.result,
      r_multiple: tradeData.rMultiple ? parseFloat(tradeData.rMultiple) : null,
      rule_break: tradeData.ruleBreak,
      reason: tradeData.reason,
      lesson: tradeData.lesson,
      emotion_before: tradeData.emotionBefore,
      emotion_after: tradeData.emotionAfter,
      psych_note: tradeData.psychNote,
      // Maintain old images array for backwards compatibility
      images: imageUrls,
      // NEW FIELDS for Phase 3 Tools:
      before_image: imageUrls[0] || null, // First image is assumed to be 'Before'
      after_image: imageUrls[1] || null, // Second image is assumed to be 'After'
      executions: parsedExecutions, // Array of partial exits
    };

    const { data, error } = await supabase
      .from("trades")
      .insert([insertData])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    console.error("Trade Creation Error:", error);
    res.status(500).json({ success: false, error: "Failed to save trade." });
  }
};

export const getTrades = async (req, res) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Missing User ID" });
    }

    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("time", { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Fetch Trades Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch trades." });
  }
};

export const deleteAllTrades = async (req, res) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Missing User ID" });
    }

    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;

    res
      .status(200)
      .json({ success: true, message: "All trades deleted successfully." });
  } catch (error) {
    console.error("Delete Trades Error:", error);
    res.status(500).json({ success: false, error: "Failed to delete trades." });
  }
};

export const exportTrades = async (req, res) => {
  try {
    const { userId } = req;
    const { format } = req.query;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Missing User ID" });
    }

    const { data: trades, error } = await supabase
      .from("trades")
      .select(
        "date, time, asset, direction, session, setup, result, r_multiple, entry, sl, tp",
      )
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("time", { ascending: false });

    if (error) throw error;

    if (!trades || trades.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "No trades found to export." });
    }

    if (format === "csv") {
      const parser = new Parser();
      const csv = parser.parse(trades);
      res.header("Content-Type", "text/csv");
      res.attachment("Trade_Journey_Export.csv");
      return res.send(csv);
    }

    if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("My Trades");

      worksheet.columns = [
        { header: "Date", key: "date", width: 12 },
        { header: "Time", key: "time", width: 10 },
        { header: "Asset", key: "asset", width: 12 },
        { header: "Direction", key: "direction", width: 10 },
        { header: "Session", key: "session", width: 12 },
        { header: "Setup", key: "setup", width: 16 },
        { header: "Result", key: "result", width: 10 },
        { header: "R-Multiple", key: "r_multiple", width: 12 },
        { header: "Entry", key: "entry", width: 12 },
        { header: "SL", key: "sl", width: 12 },
        { header: "TP", key: "tp", width: 12 },
      ];

      trades.forEach((trade) => worksheet.addRow(trade));
      res.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.attachment("Trade_Journey_Export.xlsx");
      await workbook.xlsx.write(res);
      return res.end();
    }

    if (format === "doc") {
      const rows = trades.map(
        (t) =>
          new Paragraph({
            children: [
              new TextRun({
                text: `${t.date} ${t.time || ""} | ${t.asset} | ${t.direction || ""} | Setup: ${t.setup || "N/A"} | Result: ${t.result || "N/A"} | R: ${t.r_multiple ?? "N/A"}`,
                font: "Arial",
              }),
            ],
          }),
      );

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Trade Journey Export",
                    bold: true,
                    size: 28,
                  }),
                ],
              }),
              ...rows,
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      res.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      res.attachment("Trade_Journey_Export.docx");
      return res.send(buffer);
    }

    if (format === "pdf") {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      res.header("Content-Type", "application/pdf");
      res.attachment("Trade_Journey_Export.pdf");

      doc.pipe(res);
      doc
        .fontSize(20)
        .text("Trade Journey Export", { align: "center" })
        .moveDown();

      trades.forEach((t) => {
        doc
          .fontSize(11)
          .text(
            `${t.date} ${t.time || ""} | ${t.asset} | ${t.direction || ""} | Setup: ${t.setup || "N/A"} | Result: ${t.result || "N/A"} | R: ${t.r_multiple ?? "N/A"}`,
          );
        doc.moveDown(0.4);
      });

      doc.end();
      return;
    }

    return res
      .status(400)
      .json({ success: false, error: "Unsupported export format." });
  } catch (error) {
    console.error("Export Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to generate export file." });
  }
};
