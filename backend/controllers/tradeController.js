// backend/controllers/tradeController.js
import { Parser } from "json2csv";
import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, TextRun, ImageRun } from "docx";
import PDFDocument from "pdfkit";
import { supabase } from "../config/supabase.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { loadTradeImages, tradeImageUrls } from "../utils/exportImages.js";

const normaliseTradeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const calculateRiskPercent = (entry, sl) => {
  if (entry === null || sl === null || entry === 0) return null;
  return Math.abs(((entry - sl) / entry) * 100);
};

const calculateRMultiple = (entry, sl, tp, direction) => {
  if (
    entry === null ||
    sl === null ||
    tp === null ||
    entry === 0 ||
    !direction
  ) {
    return null;
  }

  const risk = Math.abs(entry - sl);
  if (risk === 0) return 0;

  if (direction === "LONG") {
    return (tp - entry) / (entry - sl);
  }

  return (entry - tp) / (sl - entry);
};

export const sanitizeRMultiple = (result, rMultipleValue, plannedRR) => {
  const normResult = (result || "").toLowerCase().trim();

  if (normResult === "loss") {
    // A loss trade must have a negative R-multiple.
    // If the user specified a custom negative R (e.g. -0.5, -1.2), keep it.
    // If rMultipleValue was positive (e.g. from planned target R:R) or missing, default to -1.0.
    if (rMultipleValue !== null && rMultipleValue !== undefined && rMultipleValue < 0) {
      return rMultipleValue;
    }
    return -1.0;
  }

  if (normResult === "be") {
    return 0.0;
  }

  // Win
  if (rMultipleValue !== null && rMultipleValue !== undefined) {
    return Math.abs(rMultipleValue);
  }

  if (plannedRR !== null && plannedRR !== undefined) {
    return Math.abs(plannedRR);
  }

  return null;
};

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

    const entry = normaliseTradeNumber(tradeData.entry);
    const sl = normaliseTradeNumber(tradeData.sl);
    const tp = normaliseTradeNumber(tradeData.tp);
    const computedRisk = calculateRiskPercent(entry, sl);

    const plannedRR = calculateRMultiple(entry, sl, tp, tradeData.direction);
    const rawRMultiple =
      tradeData.rMultiple !== undefined && tradeData.rMultiple !== ""
        ? normaliseTradeNumber(tradeData.rMultiple)
        : null;

    const rMultipleValue = sanitizeRMultiple(
      tradeData.result,
      rawRMultiple,
      plannedRR
    );

    const insertData = {
      user_id: userId,
      date: tradeData.date,
      time: tradeData.time,
      asset: tradeData.asset,
      direction: tradeData.direction,
      session: tradeData.session,
      setup: tradeData.setup,
      entry,
      sl,
      tp,
      risk:
        computedRisk ??
        (tradeData.risk !== undefined && tradeData.risk !== ""
          ? normaliseTradeNumber(tradeData.risk)
          : null),
      result: tradeData.result,
      r_multiple: rMultipleValue,
      rule_break: tradeData.ruleBreak,
      reason: tradeData.reason,
      lesson: tradeData.lesson,
      emotion_before: tradeData.emotionBefore,
      emotion_after: tradeData.emotionAfter,
      psych_note: tradeData.psychNote,
      account_name: tradeData.accountName || "Default Account",
      images: imageUrls,
      before_image: imageUrls[0] || null,
      after_image: imageUrls[1] || null,
      executions: parsedExecutions,
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
      .order("time", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

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

export const deleteTrade = async (req, res) => {
  try {
    const { userId } = req;
    const { id } = req.params;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Missing User ID" });
    }

    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    res
      .status(200)
      .json({ success: true, message: "Trade deleted successfully." });
  } catch (error) {
    console.error("Delete Trade Error:", error);
    res.status(500).json({ success: false, error: "Failed to delete trade." });
  }
};

export const updateTrade = async (req, res) => {
  try {
    const { userId } = req;
    const { id } = req.params;
    const tradeData = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Missing User ID" });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from("trades")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, error: "Trade not found." });
    }

    const imageUrls = [...(existing.images || [])];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        imageUrls.push(url);
      }
    }

    const entry = normaliseTradeNumber(tradeData.entry !== undefined ? tradeData.entry : existing.entry);
    const sl = normaliseTradeNumber(tradeData.sl !== undefined ? tradeData.sl : existing.sl);
    const tp = normaliseTradeNumber(tradeData.tp !== undefined ? tradeData.tp : existing.tp);
    const direction = tradeData.direction || existing.direction;
    const result = tradeData.result || existing.result;

    const computedRisk = calculateRiskPercent(entry, sl);
    const plannedRR = calculateRMultiple(entry, sl, tp, direction);
    const rawRMultiple =
      tradeData.rMultiple !== undefined && tradeData.rMultiple !== ""
        ? normaliseTradeNumber(tradeData.rMultiple)
        : tradeData.r_multiple !== undefined && tradeData.r_multiple !== ""
        ? normaliseTradeNumber(tradeData.r_multiple)
        : null;

    const rMultipleValue = sanitizeRMultiple(result, rawRMultiple, plannedRR);

    const updateFields = {
      ...(tradeData.date !== undefined && { date: tradeData.date }),
      ...(tradeData.time !== undefined && { time: tradeData.time }),
      ...(tradeData.asset !== undefined && { asset: tradeData.asset }),
      ...(tradeData.direction !== undefined && { direction }),
      ...(tradeData.session !== undefined && { session: tradeData.session }),
      ...(tradeData.setup !== undefined && { setup: tradeData.setup }),
      entry,
      sl,
      tp,
      risk:
        computedRisk ??
        (tradeData.risk !== undefined && tradeData.risk !== ""
          ? normaliseTradeNumber(tradeData.risk)
          : existing.risk),
      result,
      r_multiple: rMultipleValue,
      ...(tradeData.ruleBreak !== undefined && { rule_break: tradeData.ruleBreak }),
      ...(tradeData.reason !== undefined && { reason: tradeData.reason }),
      ...(tradeData.lesson !== undefined && { lesson: tradeData.lesson }),
      ...(tradeData.emotionBefore !== undefined && { emotion_before: tradeData.emotionBefore }),
      ...(tradeData.emotionAfter !== undefined && { emotion_after: tradeData.emotionAfter }),
      ...(tradeData.psychNote !== undefined && { psych_note: tradeData.psychNote }),
      ...(tradeData.accountName !== undefined && { account_name: tradeData.accountName }),
      images: imageUrls,
      before_image: imageUrls[0] || null,
      after_image: imageUrls[1] || null,
    };

    const { data, error } = await supabase
      .from("trades")
      .update(updateFields)
      .eq("id", id)
      .eq("user_id", userId)
      .select();

    if (error) throw error;

    res.status(200).json({ success: true, data: data[0] });
  } catch (error) {
    console.error("Update Trade Error:", error);
    res.status(500).json({ success: false, error: "Failed to update trade." });
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
        "date, time, asset, direction, session, setup, result, r_multiple, entry, sl, tp, images, before_image, after_image",
      )
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("time", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!trades || trades.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "No trades found to export." });
    }

    if (format === "csv") {
      const rows = trades.map(
        ({ images, before_image, after_image, ...t }) => ({
          ...t,
          image_urls: tradeImageUrls({
            images,
            before_image,
            after_image,
          }).join(" | "),
        }),
      );
      const csv = new Parser().parse(rows);
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
        { header: "Screenshots", key: "shots", width: 40 },
      ];

      const imagesOf = await loadTradeImages(trades);
      trades.forEach((trade) => {
        const imgs = imagesOf(trade);
        const row = worksheet.addRow({
          ...trade,
          shots: imgs.length ? "" : "-",
        });
        if (!imgs.length) return;
        row.height = 150;
        imgs.slice(0, 3).forEach((img, i) => {
          const imageId = workbook.addImage({
            buffer: img.buffer,
            extension: img.type,
          });
          worksheet.addImage(imageId, {
            tl: { col: 11 + i, row: row.number - 1 },
            ext: { width: 200, height: 190 },
          });
        });
      });
      [12, 13].forEach((c) => (worksheet.getColumn(c + 1).width = 30));
      res.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.attachment("Trade_Journey_Export.xlsx");
      await workbook.xlsx.write(res);
      return res.end();
    }

    if (format === "doc") {
      const imagesOf = await loadTradeImages(trades);
      const rows = trades.flatMap((t) => [
        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({
              text: `${t.date} ${t.time || ""} | ${t.asset} | ${t.direction || ""} | Setup: ${t.setup || "N/A"} | Result: ${t.result || "N/A"} | R: ${t.r_multiple ?? "N/A"}`,
              font: "Arial",
            }),
          ],
        }),
        ...imagesOf(t).map(
          (img) =>
            new Paragraph({
              children: [
                new ImageRun({
                  type: img.type === "jpeg" ? "jpg" : img.type,
                  data: img.buffer,
                  transformation: { width: 450, height: 260 },
                }),
              ],
            }),
        ),
      ]);

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
      const imagesOf = await loadTradeImages(trades);
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
        imagesOf(t).forEach((img) => {
          if (doc.y > 560) doc.addPage();
          try {
            doc.image(img.buffer, { fit: [480, 250] });
          } catch {
            return;
          }
          doc.moveDown(0.4);
        });
        doc.moveDown(0.6);
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
