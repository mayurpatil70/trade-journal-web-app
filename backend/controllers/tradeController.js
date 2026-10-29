// backend/controllers/tradeController.js
import { Parser } from "json2csv";
import ExcelJS from "exceljs";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  PageBreak,
  BorderStyle,
} from "docx";
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
      const uploaded = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer))
      );
      imageUrls.push(...uploaded);
    } else if (tradeData.images) {
      try {
        const parsed = typeof tradeData.images === "string" ? JSON.parse(tradeData.images) : tradeData.images;
        if (Array.isArray(parsed)) imageUrls.push(...parsed.filter(Boolean));
      } catch (e) {
        if (typeof tradeData.images === "string" && tradeData.images.startsWith("http")) {
          imageUrls.push(tradeData.images);
        }
      }
    }
    if (imageUrls.length === 0) {
      if (tradeData.before_image) imageUrls.push(tradeData.before_image);
      if (tradeData.after_image) imageUrls.push(tradeData.after_image);
    }

    const rawLotSize =
      tradeData.lotSize !== undefined && tradeData.lotSize !== "" && tradeData.lotSize !== null
        ? normaliseTradeNumber(tradeData.lotSize)
        : tradeData.lot_size !== undefined && tradeData.lot_size !== "" && tradeData.lot_size !== null
        ? normaliseTradeNumber(tradeData.lot_size)
        : null;

    // Parse executions if they exist (usually sent as JSON string in FormData)
    let parsedExecutions = [];
    if (tradeData.executions) {
      try {
        parsedExecutions =
          typeof tradeData.executions === "string"
            ? JSON.parse(tradeData.executions)
            : tradeData.executions;
      } catch (e) {
        console.error("Failed to parse executions:", e);
      }
    }

    if (rawLotSize !== null) {
      if (Array.isArray(parsedExecutions) && parsedExecutions.length > 0) {
        parsedExecutions = parsedExecutions.map((e) => ({ ...e, lot_size: rawLotSize }));
      } else {
        parsedExecutions = [{ lot_size: rawLotSize }];
      }
    }

    const entry = normaliseTradeNumber(tradeData.entry);
    const sl = normaliseTradeNumber(tradeData.sl);
    const tp = normaliseTradeNumber(tradeData.tp);
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

    const userRisk =
      tradeData.risk !== undefined && tradeData.risk !== "" && tradeData.risk !== null
        ? normaliseTradeNumber(tradeData.risk)
        : null;

    const exitPrice = normaliseTradeNumber(
      tradeData.exit_price !== undefined && tradeData.exit_price !== "" && tradeData.exit_price !== null
        ? tradeData.exit_price
        : tradeData.exitPrice !== undefined && tradeData.exitPrice !== "" && tradeData.exitPrice !== null
        ? tradeData.exitPrice
        : null
    );
    const exitDate = tradeData.exit_date || tradeData.exitDate || null;
    const exitTime = tradeData.exit_time || tradeData.exitTime || null;
    const entryDate = tradeData.entry_date || tradeData.entryDate || tradeData.date || null;
    const entryTime = tradeData.entry_time || tradeData.entryTime || tradeData.time || null;

    // Extract & sanitize profit / loss in USD ($)
    const rawPnl =
      tradeData.pnl !== undefined && tradeData.pnl !== "" && tradeData.pnl !== null
        ? normaliseTradeNumber(tradeData.pnl)
        : tradeData.profit !== undefined && tradeData.profit !== "" && tradeData.profit !== null
        ? normaliseTradeNumber(tradeData.profit)
        : null;

    let finalPnl = rawPnl;
    if (finalPnl !== null) {
      const normRes = (tradeData.result || "").toLowerCase().trim();
      if (normRes === "loss" && finalPnl > 0) {
        finalPnl = -Math.abs(finalPnl);
      } else if (normRes === "win" && finalPnl < 0) {
        finalPnl = Math.abs(finalPnl);
      } else if (normRes === "be") {
        finalPnl = 0;
      }
    }

    const insertData = {
      user_id: userId,
      date: tradeData.date || entryDate,
      time: tradeData.time || entryTime,
      asset: tradeData.asset,
      direction: tradeData.direction,
      session: tradeData.session,
      setup: tradeData.setup,
      entry,
      sl,
      tp,
      risk: userRisk !== null ? userRisk : 1.0,
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
      before_image: imageUrls[0] || tradeData.before_image || null,
      after_image: imageUrls[1] || tradeData.after_image || null,
      executions: parsedExecutions,
      ...(rawLotSize !== null && { lot_size: rawLotSize }),
      ...(finalPnl !== null && { pnl: finalPnl }),
      ...(tradeData.commissions !== undefined && tradeData.commissions !== "" && { commissions: normaliseTradeNumber(tradeData.commissions) }),
      ...(tradeData.swap !== undefined && tradeData.swap !== "" && { swap: normaliseTradeNumber(tradeData.swap) }),
      ...(tradeData.status && { status: tradeData.status }),
      ...(tradeData.hold_duration_minutes !== undefined && tradeData.hold_duration_minutes !== "" && { hold_duration_minutes: normaliseTradeNumber(tradeData.hold_duration_minutes) }),
      ...(entryDate && { entry_date: entryDate }),
      ...(entryTime && { entry_time: entryTime }),
      ...(exitDate && { exit_date: exitDate }),
      ...(exitTime && { exit_time: exitTime }),
      ...(exitPrice !== null && { exit_price: exitPrice }),
    };

    let { data, error } = await supabase
      .from("trades")
      .insert([insertData])
      .select();

    if (error && error.message) {
      let retried = false;
      const columnsToCheck = ["lot_size", "exit_date", "exit_time", "exit_price", "entry_date", "entry_time", "pnl", "commissions", "swap", "status", "hold_duration_minutes"];
      for (const col of columnsToCheck) {
        if (error.message.includes(col) && insertData[col] !== undefined) {
          delete insertData[col];
          retried = true;
        }
      }
      if (retried) {
        const retry = await supabase
          .from("trades")
          .insert([insertData])
          .select();
        data = retry.data;
        error = retry.error;
      }
    }

    if (error) throw error;

    const savedTrade = data?.[0]
      ? {
          ...data[0],
          lot_size:
            data[0].lot_size !== undefined && data[0].lot_size !== null
              ? data[0].lot_size
              : data[0].executions?.[0]?.lot_size !== undefined
              ? data[0].executions[0].lot_size
              : rawLotSize,
        }
      : data?.[0];

    res.status(201).json({ success: true, data: savedTrade });
  } catch (error) {
    console.error("Trade Creation Error:", error);
    res.status(500).json({ success: false, error: "Failed to save trade." });
  }
};

export const getTrades = async (req, res) => {
  try {
    const rawUserId = req.query?.userId || req.userId;
    const userId = rawUserId || req.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Missing User ID" });
    }

    // Support account aliasing for test accounts
    let targetUserIds = [userId];
    if (
      userId === "fd2cc29c-e8cc-4720-8376-6bb975e394f0" ||
      userId === "684d8ce3-360d-439c-8b8a-980d2568455f" ||
      req.userId === "fd2cc29c-e8cc-4720-8376-6bb975e394f0" ||
      req.userId === "684d8ce3-360d-439c-8b8a-980d2568455f"
    ) {
      targetUserIds = [
        "684d8ce3-360d-439c-8b8a-980d2568455f",
        "fd2cc29c-e8cc-4720-8376-6bb975e394f0",
      ];
    }

    let { data, error } = await supabase
      .from("trades")
      .select("*")
      .in("user_id", targetUserIds)
      .order("date", { ascending: false })
      .order("time", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    // Fallback if empty and userId is an email
    if ((!data || data.length === 0) && typeof userId === "string" && userId.includes("@")) {
      const { data: userRecord } = await supabase.from("users").select("id").eq("email", userId).maybeSingle();
      if (userRecord?.id) {
        const fallback = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", userRecord.id)
          .order("date", { ascending: false })
          .order("time", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
        if (fallback.data && fallback.data.length > 0) {
          data = fallback.data;
        }
      }
    }

    if (error && (!data || data.length === 0)) throw error;

    const enriched = (data || []).map((t) => ({
      ...t,
      lot_size:
        t.lot_size !== undefined && t.lot_size !== null
          ? t.lot_size
          : t.executions?.[0]?.lot_size !== undefined
          ? t.executions[0].lot_size
          : null,
    }));

    res.status(200).json({ success: true, data: enriched });
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
      const uploaded = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer))
      );
      imageUrls.push(...uploaded);
    }

    const entry = normaliseTradeNumber(tradeData.entry !== undefined ? tradeData.entry : existing.entry);
    const sl = normaliseTradeNumber(tradeData.sl !== undefined ? tradeData.sl : existing.sl);
    const tp = normaliseTradeNumber(tradeData.tp !== undefined ? tradeData.tp : existing.tp);
    const direction = tradeData.direction || existing.direction;
    const result = tradeData.result || existing.result;

    const plannedRR = calculateRMultiple(entry, sl, tp, direction);
    const rawRMultiple =
      tradeData.rMultiple !== undefined && tradeData.rMultiple !== ""
        ? normaliseTradeNumber(tradeData.rMultiple)
        : tradeData.r_multiple !== undefined && tradeData.r_multiple !== ""
        ? normaliseTradeNumber(tradeData.r_multiple)
        : null;

    const rMultipleValue = sanitizeRMultiple(result, rawRMultiple, plannedRR);

    const userRisk =
      tradeData.risk !== undefined && tradeData.risk !== "" && tradeData.risk !== null
        ? normaliseTradeNumber(tradeData.risk)
        : undefined;

    const riskValue =
      userRisk !== undefined
        ? userRisk
        : existing.risk !== null && existing.risk !== undefined
        ? existing.risk
        : 1.0;

    const rawLotSize =
      tradeData.lotSize !== undefined && tradeData.lotSize !== "" && tradeData.lotSize !== null
        ? normaliseTradeNumber(tradeData.lotSize)
        : tradeData.lot_size !== undefined && tradeData.lot_size !== "" && tradeData.lot_size !== null
        ? normaliseTradeNumber(tradeData.lot_size)
        : undefined;

    let parsedExecutions = undefined;
    if (tradeData.executions !== undefined) {
      try {
        parsedExecutions =
          typeof tradeData.executions === "string"
            ? JSON.parse(tradeData.executions || "[]")
            : tradeData.executions;
      } catch (e) {
        parsedExecutions = [];
      }
    } else if (existing.executions) {
      parsedExecutions = Array.isArray(existing.executions)
        ? [...existing.executions]
        : [existing.executions];
    }

    if (rawLotSize !== undefined && rawLotSize !== null) {
      if (Array.isArray(parsedExecutions) && parsedExecutions.length > 0) {
        parsedExecutions = parsedExecutions.map((e) => ({ ...e, lot_size: rawLotSize }));
      } else {
        parsedExecutions = [{ lot_size: rawLotSize }];
      }
    }

    // Extract & sanitize profit / loss in USD ($) for update
    const rawUpdatePnl =
      tradeData.pnl !== undefined && tradeData.pnl !== "" && tradeData.pnl !== null
        ? normaliseTradeNumber(tradeData.pnl)
        : tradeData.profit !== undefined && tradeData.profit !== "" && tradeData.profit !== null
        ? normaliseTradeNumber(tradeData.profit)
        : null;

    let finalUpdatePnl = rawUpdatePnl;
    if (finalUpdatePnl !== null) {
      const normRes = (result || tradeData.result || "").toLowerCase().trim();
      if (normRes === "loss" && finalUpdatePnl > 0) {
        finalUpdatePnl = -Math.abs(finalUpdatePnl);
      } else if (normRes === "win" && finalUpdatePnl < 0) {
        finalUpdatePnl = Math.abs(finalUpdatePnl);
      } else if (normRes === "be") {
        finalUpdatePnl = 0;
      }
    }

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
      risk: riskValue,
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
      before_image: imageUrls[0] || tradeData.before_image || null,
      after_image: imageUrls[1] || tradeData.after_image || null,
      ...(parsedExecutions !== undefined && { executions: parsedExecutions }),
      ...(rawLotSize !== undefined && { lot_size: rawLotSize }),
      ...(tradeData.entry_date !== undefined && { entry_date: tradeData.entry_date }),
      ...(tradeData.entryDate !== undefined && { entry_date: tradeData.entryDate }),
      ...(tradeData.entry_time !== undefined && { entry_time: tradeData.entry_time }),
      ...(tradeData.entryTime !== undefined && { entry_time: tradeData.entryTime }),
      ...(tradeData.exit_date !== undefined && { exit_date: tradeData.exit_date }),
      ...(tradeData.exitDate !== undefined && { exit_date: tradeData.exitDate }),
      ...(tradeData.exit_time !== undefined && { exit_time: tradeData.exit_time }),
      ...(tradeData.exitTime !== undefined && { exit_time: tradeData.exitTime }),
      ...(tradeData.exit_price !== undefined && { exit_price: normaliseTradeNumber(tradeData.exit_price) }),
      ...(tradeData.exitPrice !== undefined && { exit_price: normaliseTradeNumber(tradeData.exitPrice) }),
      ...(finalUpdatePnl !== null && { pnl: finalUpdatePnl }),
      ...(tradeData.commissions !== undefined && { commissions: normaliseTradeNumber(tradeData.commissions) }),
      ...(tradeData.swap !== undefined && { swap: normaliseTradeNumber(tradeData.swap) }),
      ...(tradeData.status !== undefined && { status: tradeData.status }),
      ...(tradeData.hold_duration_minutes !== undefined && { hold_duration_minutes: normaliseTradeNumber(tradeData.hold_duration_minutes) }),
    };

    let { data, error } = await supabase
      .from("trades")
      .update(updateFields)
      .eq("id", id)
      .eq("user_id", userId)
      .select();

    if (error && error.message) {
      let retried = false;
      const columnsToCheck = ["lot_size", "exit_date", "exit_time", "exit_price", "entry_date", "entry_time", "pnl", "commissions", "swap", "status", "hold_duration_minutes"];
      for (const col of columnsToCheck) {
        if (error.message.includes(col) && updateFields[col] !== undefined) {
          delete updateFields[col];
          retried = true;
        }
      }
      if (retried) {
        const retry = await supabase
          .from("trades")
          .update(updateFields)
          .eq("id", id)
          .eq("user_id", userId)
          .select();
        data = retry.data;
        error = retry.error;
      }
    }

    if (error) throw error;

    const updatedTrade = data?.[0]
      ? {
          ...data[0],
          lot_size:
            data[0].lot_size !== undefined && data[0].lot_size !== null
              ? data[0].lot_size
              : data[0].executions?.[0]?.lot_size !== undefined
              ? data[0].executions[0].lot_size
              : rawLotSize,
        }
      : data?.[0];

    res.status(200).json({ success: true, data: updatedTrade });
  } catch (error) {
    console.error("Update Trade Error:", error);
    res.status(500).json({ success: false, error: "Failed to update trade." });
  }
};

const getExportNormalizedR = (trade) => {
  const isLoss = (trade.result || "").toLowerCase() === "loss";
  const isBe = (trade.result || "").toLowerCase() === "be";
  const num = Number(trade.r_multiple ?? 0);
  if (isLoss) {
    if (num > 0) return -num;
    if (num === 0) return -1;
    return num;
  }
  if (isBe) return 0;
  return num;
};

const isExportTradeWin = (trade) => {
  const res = (trade.result || "").toLowerCase();
  if (res === "loss" || res === "be") return false;
  return res === "win" || getExportNormalizedR(trade) > 0;
};

export const exportTrades = async (req, res) => {
  try {
    const { userId } = req;
    const { format, tradeId } = req.query;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Missing User ID" });
    }

    let query = supabase
      .from("trades")
      .select(
        "id, date, time, asset, direction, session, setup, result, r_multiple, entry, sl, tp, risk, rule_break, reason, lesson, emotion_before, emotion_after, psych_note, account_name, images, before_image, after_image",
      )
      .eq("user_id", userId);

    if (tradeId) {
      query = query.eq("id", tradeId);
    } else {
      query = query
        .order("date", { ascending: false })
        .order("time", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
    }

    const { data: trades, error } = await query;

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
        { header: "Account", key: "account_name", width: 15 },
        { header: "Asset", key: "asset", width: 12 },
        { header: "Direction", key: "direction", width: 10 },
        { header: "Session", key: "session", width: 12 },
        { header: "Setup", key: "setup", width: 16 },
        { header: "Result", key: "result", width: 10 },
        { header: "R-Multiple", key: "r_multiple", width: 12 },
        { header: "Entry", key: "entry", width: 12 },
        { header: "SL", key: "sl", width: 12 },
        { header: "TP", key: "tp", width: 12 },
        { header: "Risk %", key: "risk", width: 10 },
        { header: "Analysis", key: "reason", width: 30 },
        { header: "Lesson", key: "lesson", width: 30 },
        { header: "Screenshots", key: "shots", width: 40 },
      ];

      const imagesOf = await loadTradeImages(trades);
      trades.forEach((trade) => {
        const imgs = imagesOf(trade);
        const row = worksheet.addRow({
          ...trade,
          r_multiple: getExportNormalizedR(trade),
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
            tl: { col: 15 + i, row: row.number - 1 },
            ext: { width: 200, height: 190 },
          });
        });
      });
      [16, 17].forEach((c) => (worksheet.getColumn(c + 1).width = 30));
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

      const tableBorder = {
        style: BorderStyle.SINGLE,
        size: 1,
        color: "E2E8F0",
      };
      const cellBorders = {
        top: tableBorder,
        bottom: tableBorder,
        left: tableBorder,
        right: tableBorder,
      };

      const tradeSections = [];

      trades.forEach((trade, tradeIdx) => {
        const normR = getExportNormalizedR(trade);
        const isWin = isExportTradeWin(trade);
        const isLoss = (trade.result || "").toLowerCase() === "loss" || normR < 0;
        const resultColor = isLoss ? "DC2626" : isWin ? "16A34A" : "475569";
        const resultText = (trade.result || (normR >= 0 ? "WIN" : "LOSS")).toUpperCase();
        const rColor = isLoss ? "DC2626" : isWin ? "16A34A" : "475569";
        const rText = `${normR >= 0 ? "+" : ""}${normR.toFixed(2)}R`;
        const direction = (trade.direction || "LONG").toUpperCase();
        const isLong = direction === "LONG";

        const elements = [];

        // Title Header
        elements.push(
          new Paragraph({
            spacing: { before: 80, after: 140 },
            children: [
              new TextRun({
                text: `[${direction}] `,
                bold: true,
                color: isLong ? "059669" : "7E22CE",
                size: 24,
              }),
              new TextRun({
                text: `${trade.asset || "BTCUSD"} `,
                bold: true,
                color: "0F172A",
                size: 28,
              }),
              new TextRun({
                text: `• ${trade.date || ""}${trade.time ? `  ${trade.time}` : ""} `,
                color: "64748B",
                size: 20,
              }),
              ...(trade.account_name
                ? [
                    new TextRun({
                      text: `• Account: ${trade.account_name}`,
                      bold: true,
                      color: "64748B",
                      size: 20,
                    }),
                  ]
                : []),
            ],
          }),
        );

        const lotVal = trade.lot_size || trade.executions?.[0]?.lot_size;

        // 8 Metrics in a 2x4 Table
        const metricsRows = [
          [
            { label: "NET R", val: rText, color: rColor },
            { label: "RESULT", val: resultText, color: resultColor },
            { label: "SETUP", val: trade.setup || "—", color: "0F172A" },
            { label: "SESSION", val: trade.session || "—", color: "0F172A" },
          ],
          [
            {
              label: "ENTRY",
              val: trade.entry !== null && trade.entry !== undefined ? String(trade.entry) : "—",
              color: "0F172A",
            },
            {
              label: "STOP LOSS",
              val: trade.sl !== null && trade.sl !== undefined ? String(trade.sl) : "—",
              color: "0F172A",
            },
            {
              label: "TAKE PROFIT",
              val: trade.tp !== null && trade.tp !== undefined ? String(trade.tp) : "—",
              color: "0F172A",
            },
            {
              label: lotVal ? `RISK % (${lotVal}L)` : "RISK %",
              val: trade.risk ? `${Number(trade.risk).toFixed(2)}%` : "—",
              color: "0F172A",
            },
          ],
        ];

        const metricsTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: metricsRows.map(
            (row) =>
              new TableRow({
                children: row.map(
                  (col) =>
                    new TableCell({
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      borders: cellBorders,
                      shading: { fill: "F8FAFC" },
                      margins: { top: 90, bottom: 90, left: 110, right: 110 },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: col.label,
                              bold: true,
                              size: 15,
                              color: "64748B",
                            }),
                          ],
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: col.val,
                              bold: true,
                              size: 22,
                              color: col.color,
                            }),
                          ],
                        }),
                      ],
                    }),
                ),
              }),
          ),
        });
        elements.push(metricsTable);

        // Notes and Psychology Table (2 columns)
        const notesAndPsychTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: { top: 120 },
          rows: [
            new TableRow({
              children: [
                // Left Column: Analysis & Lesson
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: cellBorders,
                  shading: { fill: "F8FAFC" },
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "◎ ANALYSIS",
                          bold: true,
                          size: 18,
                          color: "059669",
                        }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { after: 120 },
                      children: [
                        new TextRun({
                          text: trade.reason || "No analysis recorded.",
                          size: 18,
                          color: "334155",
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "↗ LESSON",
                          bold: true,
                          size: 18,
                          color: "059669",
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: trade.lesson || "No lesson recorded.",
                          size: 18,
                          color: "334155",
                        }),
                      ],
                    }),
                  ],
                }),
                // Right Column: Psychology
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: cellBorders,
                  shading: { fill: "F8FAFC" },
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "◈ PSYCHOLOGY",
                          bold: true,
                          size: 18,
                          color: "7C3AED",
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Emotion Before: ",
                          bold: true,
                          size: 16,
                          color: "64748B",
                        }),
                        new TextRun({
                          text: `${trade.emotion_before || "—"}    →    `,
                          bold: true,
                          size: 18,
                          color: "0F172A",
                        }),
                        new TextRun({
                          text: "Emotion After: ",
                          bold: true,
                          size: 16,
                          color: "64748B",
                        }),
                        new TextRun({
                          text: trade.emotion_after || "—",
                          bold: true,
                          size: 18,
                          color: "0F172A",
                        }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 80 },
                      children: [
                        new TextRun({
                          text: "Psychological Notes:",
                          bold: true,
                          size: 16,
                          color: "64748B",
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: trade.psych_note || "No notes recorded.",
                          size: 18,
                          color: "334155",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
        elements.push(new Paragraph({ spacing: { before: 80 } }));
        elements.push(notesAndPsychTable);

        // Execution Evidence
        elements.push(
          new Paragraph({
            spacing: { before: 140, after: 80 },
            children: [
              new TextRun({
                text: "▨ EXECUTION EVIDENCE",
                bold: true,
                size: 18,
                color: "64748B",
              }),
            ],
          }),
        );

        const imgs = imagesOf(trade);
        if (imgs && imgs.length > 0) {
          imgs.forEach((img) => {
            try {
              elements.push(
                new Paragraph({
                  spacing: { after: 100 },
                  children: [
                    new ImageRun({
                      type: img.type === "jpeg" ? "jpg" : img.type,
                      data: img.buffer,
                      transformation: { width: 500, height: 270 },
                    }),
                  ],
                }),
              );
            } catch (err) {
              console.error("Failed to insert image into docx:", err);
            }
          });
        } else {
          elements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "No execution evidence screenshots attached.",
                  italics: true,
                  size: 18,
                  color: "94A3B8",
                }),
              ],
            }),
          );
        }

        // 1 TRADE PER PAGE
        if (tradeIdx < trades.length - 1) {
          elements.push(new Paragraph({ children: [new PageBreak()] }));
        }

        tradeSections.push(...elements);
      });

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 720,
                  bottom: 720,
                  left: 720,
                  right: 720,
                },
              },
            },
            children: tradeSections,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      res.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      const filename = trades.length === 1
        ? `trade_${trades[0].asset || "detail"}_${trades[0].date || "export"}.docx`
        : `trade_journal_${new Date().toISOString().slice(0, 10)}.docx`;
      res.attachment(filename);
      return res.send(buffer);
    }

    if (format === "pdf") {
      const imagesOf = await loadTradeImages(trades);
      const doc = new PDFDocument({
        margin: 36,
        size: "A4",
        autoFirstPage: false,
      });

      res.header("Content-Type", "application/pdf");
      const filename = trades.length === 1
        ? `trade_${trades[0].asset || "detail"}_${trades[0].date || "export"}.pdf`
        : `trade_journal_${new Date().toISOString().slice(0, 10)}.pdf`;
      res.attachment(filename);

      doc.pipe(res);

      trades.forEach((trade, tradeIdx) => {
        doc.addPage({ margin: 36, size: "A4" });

        const normR = getExportNormalizedR(trade);
        const isWin = isExportTradeWin(trade);
        const isLoss = (trade.result || "").toLowerCase() === "loss" || normR < 0;
        const resultColor = isLoss ? "#DC2626" : isWin ? "#16A34A" : "#475569";
        const resultText = (trade.result || (normR >= 0 ? "WIN" : "LOSS")).toUpperCase();
        const rColor = isLoss ? "#DC2626" : isWin ? "#16A34A" : "#475569";
        const rText = `${normR >= 0 ? "+" : ""}${normR.toFixed(2)}R`;
        const direction = (trade.direction || "LONG").toUpperCase();
        const isLong = direction === "LONG";

        // 1. Outer Container Card matching Screenshot 2
        doc.roundedRect(36, 36, 523, 755, 14).fillAndStroke("#FFFFFF", "#E2E8F0");

        // Header Background
        doc.roundedRect(36, 36, 523, 44, 14).fillAndStroke("#F8FAFC", "#E2E8F0");

        // Direction Pill
        if (isLong) {
          doc.roundedRect(50, 48, 48, 20, 5).fill("#ECFDF5");
          doc.fillColor("#059669").fontSize(9).font("Helvetica-Bold").text("LONG", 50, 53, { width: 48, align: "center" });
        } else {
          doc.roundedRect(50, 48, 48, 20, 5).fill("#F3E8FF");
          doc.fillColor("#7E22CE").fontSize(9).font("Helvetica-Bold").text("SHORT", 50, 53, { width: 48, align: "center" });
        }

        // Asset Name
        const assetName = trade.asset || "BTCUSD";
        doc.fillColor("#0F172A").fontSize(15).font("Helvetica-Bold").text(assetName, 108, 50);

        // Date and Time
        const assetWidth = doc.widthOfString(assetName);
        const dateTimeStr = `• ${trade.date || ""}${trade.time ? `  ${trade.time}` : ""}`;
        doc.fillColor("#64748B").fontSize(10.5).font("Helvetica").text(dateTimeStr, 114 + assetWidth, 53);

        // Account Name Badge (Right Side)
        if (trade.account_name) {
          doc.fillColor("#64748B").fontSize(9.5).font("Helvetica-Bold").text(`Account: ${trade.account_name}`, 370, 53, { width: 175, align: "right" });
        }

        const lotVal = trade.lot_size || trade.executions?.[0]?.lot_size;

        // 2. Metrics Grid (2 rows x 4 cols = 8 cards)
        const metrics = [
          [
            { label: "NET R", val: rText, color: rColor },
            { label: "RESULT", val: resultText, color: resultColor },
            { label: "SETUP", val: trade.setup || "—", color: "#0F172A" },
            { label: "SESSION", val: trade.session || "—", color: "#0F172A" },
          ],
          [
            {
              label: "ENTRY",
              val: trade.entry !== null && trade.entry !== undefined ? String(trade.entry) : "—",
              color: "#0F172A",
            },
            {
              label: "STOP LOSS",
              val: trade.sl !== null && trade.sl !== undefined ? String(trade.sl) : "—",
              color: "#0F172A",
            },
            {
              label: "TAKE PROFIT",
              val: trade.tp !== null && trade.tp !== undefined ? String(trade.tp) : "—",
              color: "#0F172A",
            },
            {
              label: lotVal ? `RISK % (${lotVal}L)` : "RISK %",
              val: trade.risk ? `${Number(trade.risk).toFixed(2)}%` : "—",
              color: "#0F172A",
            },
          ],
        ];

        const cardW = 117;
        const cardH = 46;
        const gapX = 9;
        const startX = 50;

        metrics.forEach((row, rowIdx) => {
          const cardY = 92 + rowIdx * (cardH + 8);
          row.forEach((m, colIdx) => {
            const cardX = startX + colIdx * (cardW + gapX);
            doc.roundedRect(cardX, cardY, cardW, cardH, 7).fillAndStroke("#F8FAFC", "#E2E8F0");
            doc.fillColor("#64748B").fontSize(7.5).font("Helvetica-Bold").text(m.label, cardX + 9, cardY + 7);
            doc.fillColor(m.color).fontSize(12.5).font("Helvetica-Bold").text(m.val, cardX + 9, cardY + 22, { width: cardW - 18, ellipsis: true });
          });
        });

        // 3. Middle Section: Analysis & Lesson (Left) and Psychology (Right)
        // Analysis
        doc.fillColor("#059669").fontSize(8.5).font("Helvetica-Bold").text("◎  ANALYSIS", 50, 202);
        doc.roundedRect(50, 214, 240, 68, 7).fillAndStroke("#F8FAFC", "#E2E8F0");
        doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text(trade.reason || "No analysis recorded.", 58, 222, { width: 224, height: 52, ellipsis: true });

        // Lesson
        doc.fillColor("#059669").fontSize(8.5).font("Helvetica-Bold").text("↗  LESSON", 50, 290);
        doc.roundedRect(50, 302, 240, 68, 7).fillAndStroke("#F8FAFC", "#E2E8F0");
        doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text(trade.lesson || "No lesson recorded.", 58, 310, { width: 224, height: 52, ellipsis: true });

        // Psychology (Right Column)
        doc.fillColor("#7C3AED").fontSize(8.5).font("Helvetica-Bold").text("◈  PSYCHOLOGY", 304, 202);
        doc.roundedRect(304, 214, 241, 156, 7).fillAndStroke("#F8FAFC", "#E2E8F0");

        // Emotion Flow
        doc.fillColor("#64748B").fontSize(7).font("Helvetica-Bold").text("EMOTION BEFORE", 314, 224);
        doc.fillColor("#0F172A").fontSize(10.5).font("Helvetica-Bold").text(trade.emotion_before || "—", 314, 235, { width: 85, ellipsis: true });

        doc.fillColor("#94A3B8").fontSize(12).font("Helvetica").text("→", 405, 235);

        doc.fillColor("#64748B").fontSize(7).font("Helvetica-Bold").text("EMOTION AFTER", 428, 224);
        doc.fillColor("#0F172A").fontSize(10.5).font("Helvetica-Bold").text(trade.emotion_after || "—", 428, 235, { width: 105, ellipsis: true });

        // Divider
        doc.moveTo(314, 258).lineTo(535, 258).lineWidth(0.5).stroke("#E2E8F0");

        // Psychological Notes
        doc.fillColor("#64748B").fontSize(7).font("Helvetica-Bold").text("PSYCHOLOGICAL NOTES", 314, 266);
        doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text(trade.psych_note || "No notes recorded.", 314, 278, { width: 221, height: 84, ellipsis: true });

        // 4. Execution Evidence
        doc.fillColor("#64748B").fontSize(8.5).font("Helvetica-Bold").text("▨  EXECUTION EVIDENCE", 50, 380);

        const imgs = imagesOf(trade);
        const evidenceY = 394;
        const evidenceH = 374;

        if (!imgs || imgs.length === 0) {
          doc.roundedRect(50, evidenceY, 495, 120, 7).fillAndStroke("#F8FAFC", "#E2E8F0");
          doc.fillColor("#94A3B8").fontSize(9.5).font("Helvetica").text("No execution evidence screenshots attached.", 50, evidenceY + 52, { width: 495, align: "center" });
        } else if (imgs.length === 1) {
          doc.roundedRect(50, evidenceY, 495, evidenceH, 7).fillAndStroke("#F8FAFC", "#E2E8F0");
          try {
            doc.image(imgs[0].buffer, 56, evidenceY + 8, { fit: [483, evidenceH - 16], align: "center", valign: "center" });
          } catch {
            doc.fillColor("#EF4444").fontSize(9).text("Failed to render screenshot.", 56, evidenceY + 20);
          }
        } else {
          const imgBoxW = 242;
          doc.roundedRect(50, evidenceY, imgBoxW, evidenceH, 7).fillAndStroke("#F8FAFC", "#E2E8F0");
          try {
            doc.image(imgs[0].buffer, 56, evidenceY + 8, { fit: [imgBoxW - 12, evidenceH - 16], align: "center", valign: "center" });
          } catch {
            doc.fillColor("#EF4444").fontSize(9).text("Failed to render screenshot 1.", 56, evidenceY + 20);
          }

          doc.roundedRect(303, evidenceY, imgBoxW, evidenceH, 7).fillAndStroke("#F8FAFC", "#E2E8F0");
          try {
            doc.image(imgs[1].buffer, 309, evidenceY + 8, { fit: [imgBoxW - 12, evidenceH - 16], align: "center", valign: "center" });
          } catch {
            doc.fillColor("#EF4444").fontSize(9).text("Failed to render screenshot 2.", 309, evidenceY + 20);
          }
        }

        // Footer inside card
        doc.fillColor("#94A3B8").fontSize(7.5).font("Helvetica").text(
          `Trade Journal • Page ${tradeIdx + 1} of ${trades.length} • Generated on ${new Date().toISOString().slice(0, 10)}`,
          36,
          776,
          { width: 523, align: "center" }
        );
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

export const getTradeAnalytics = async (req, res) => {
  try {
    const rawUserId = req.query?.userId || req.userId;
    const userId = rawUserId || req.userId;
    const { accountName } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    let targetUserIds = [userId];
    if (
      userId === "fd2cc29c-e8cc-4720-8376-6bb975e394f0" ||
      userId === "684d8ce3-360d-439c-8b8a-980d2568455f" ||
      req.userId === "fd2cc29c-e8cc-4720-8376-6bb975e394f0" ||
      req.userId === "684d8ce3-360d-439c-8b8a-980d2568455f"
    ) {
      targetUserIds = [
        "684d8ce3-360d-439c-8b8a-980d2568455f",
        "fd2cc29c-e8cc-4720-8376-6bb975e394f0",
      ];
    }

    // Tier 1: Fast PostgreSQL Aggregation Pipeline via RPC in Supabase
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("aggregate_user_trades", {
        p_user_id: targetUserIds[0],
        p_account_name: accountName || null,
      });

      if (!rpcError && rpcData && Object.keys(rpcData).length > 0) {
        return res.status(200).json({ success: true, source: "database_pipeline", data: rpcData });
      }
    } catch (rpcErr) {
      // Continue to Tier 2 application fallback if RPC is not installed in database
    }

    // Tier 2: Resilient Application-Level Aggregation Pipeline Fallback
    let query = supabase
      .from("trades")
      .select("result, r_multiple, pnl, setup, session, asset, rule_break, direction, date")
      .in("user_id", targetUserIds);

    if (accountName) {
      query = query.eq("account_name", accountName);
    }

    const { data: trades, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    const list = trades || [];
    let wins = 0;
    let losses = 0;
    let be = 0;
    let totalR = 0;
    let totalPnl = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    const setups = {};
    const sessions = {};
    const assets = {};

    list.forEach((t) => {
      const resVal = (t.result || "").toLowerCase().trim();
      let r = parseFloat(t.r_multiple) || 0;
      let pnl = parseFloat(t.pnl) || 0;

      if (resVal === "loss") {
        losses++;
        if (r > 0) r = -r;
        if (pnl > 0) pnl = -pnl;
        grossLoss += Math.abs(pnl);
      } else if (resVal === "be") {
        be++;
        r = 0;
      } else if (resVal === "win") {
        wins++;
        if (r < 0) r = Math.abs(r);
        if (pnl < 0) pnl = Math.abs(pnl);
        grossProfit += pnl;
      }

      totalR += r;
      totalPnl += pnl;

      if (t.setup) {
        if (!setups[t.setup]) setups[t.setup] = { name: t.setup, total: 0, wins: 0, r: 0, pnl: 0 };
        setups[t.setup].total++;
        if (resVal === "win") setups[t.setup].wins++;
        setups[t.setup].r += r;
        setups[t.setup].pnl += pnl;
      }

      if (t.session) {
        if (!sessions[t.session]) sessions[t.session] = { name: t.session, total: 0, wins: 0, r: 0, pnl: 0 };
        sessions[t.session].total++;
        if (resVal === "win") sessions[t.session].wins++;
        sessions[t.session].r += r;
        sessions[t.session].pnl += pnl;
      }

      if (t.asset) {
        if (!assets[t.asset]) assets[t.asset] = { name: t.asset, total: 0, wins: 0, r: 0, pnl: 0 };
        assets[t.asset].total++;
        if (resVal === "win") assets[t.asset].wins++;
        assets[t.asset].r += r;
        assets[t.asset].pnl += pnl;
      }
    });

    const totalTrades = list.length;
    const validTrades = wins + losses;
    const winRate = validTrades > 0 ? (wins / validTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

    const formatGroup = (dict) =>
      Object.values(dict)
        .map((g) => ({
          ...g,
          winRate: g.total > 0 ? Number(((g.wins / g.total) * 100).toFixed(1)) : 0,
          netR: Number(g.r.toFixed(2)),
          netPnl: Number(g.pnl.toFixed(2)),
        }))
        .sort((a, b) => b.netR - a.netR);

    const fallbackResult = {
      summary: {
        total_trades: totalTrades,
        wins,
        losses,
        breakevens: be,
        win_rate: Number(winRate.toFixed(1)),
        total_r: Number(totalR.toFixed(2)),
        total_pnl: Number(totalPnl.toFixed(2)),
        profit_factor: Number(profitFactor.toFixed(2)),
      },
      by_setup: formatGroup(setups),
      by_session: formatGroup(sessions),
      by_asset: formatGroup(assets),
    };

    res.status(200).json({ success: true, source: "application_fallback", data: fallbackResult });
  } catch (error) {
    console.error("Trade Analytics Error:", error);
    res.status(500).json({ success: false, error: "Failed to generate trade analytics." });
  }
};
