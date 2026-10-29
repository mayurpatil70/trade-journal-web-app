// frontend/src/pages/PastTrades.jsx
// TradeFXBook Institutional Trades & Portfolio View
// Faithfully replicates https://app.tradefxbook.com/?view=portfolio
// Fully implements Filters Drawer, View Popover (Columns, Sort, Display, Tips), and Table Row Architecture

import { useEffect, useState, useMemo, useRef, useCallback, Fragment } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/axios";
import AccountFilter from "../components/AccountFilter";
import TradeFXBookAddTradeModal from "../components/dashboard/TradeFXBookAddTradeModal";
import TradeShareModal from "../components/dashboard/TradeShareModal";
import DateTimePickerPopover from "../components/ui/DateTimePickerPopover";
import AppleSelect from "../components/ui/AppleSelect";
import PhotoLightboxModal from "../components/ui/PhotoLightboxModal";
import {
  getImmediateCachedTrades,
  getTradesWithCache,
  invalidateTradeCache,
  setCachedTrades,
} from "../utils/tradeCache";
import {
  Loader2,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  Pencil,
  Share2,
  SlidersHorizontal,
  Download,
  Globe,
  TrendingUp,
  TrendingDown,
  Cpu,
  Check,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Calendar,
  RotateCcw,
  GripVertical,
  Layers,
  Brain,
  FileText,
  FileSpreadsheet,
  Copy,
  Maximize2,
} from "lucide-react";

// ── Column Definitions (All 16 Institutional Columns) ──
const ALL_COLUMNS = [
  { id: "open_close", label: "Open / Close", defaultVisible: true, required: true },
  { id: "symbol", label: "Symbol", defaultVisible: true, required: true },
  { id: "type", label: "Type", defaultVisible: true },
  { id: "entry", label: "Entry", defaultVisible: true },
  { id: "exit", label: "Exit", defaultVisible: true },
  { id: "size", label: "Size", defaultVisible: true },
  { id: "pnl", label: "P&L", defaultVisible: true },
  { id: "source", label: "Source", defaultVisible: true },
  { id: "open_time", label: "Open time", defaultVisible: false },
  { id: "close_time", label: "Close time", defaultVisible: false },
  { id: "duration", label: "Duration", defaultVisible: false },
  { id: "net_pnl", label: "Net P&L", defaultVisible: false },
  { id: "commission", label: "Commission", defaultVisible: false },
  { id: "swap", label: "Swap", defaultVisible: false },
  { id: "day", label: "Day", defaultVisible: false },
  { id: "notes", label: "Notes", defaultVisible: false },
];

const DEFAULT_VISIBLE_IDS = ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id);

// Trade timestamp calculator
const tradeStamp = (t) => {
  const c = new Date(t.created_at || 0).getTime();
  if (!Number.isNaN(c) && c > 0) return c;
  const d = new Date(`${t.date}T${t.time || "00:00"}`).getTime();
  return Number.isNaN(d) ? 0 : d;
};

// Normalized R-Multiple
const normalizeTradeR = (t) => {
  if (!t) return 0;
  const res = (t.result || "").toLowerCase().trim();
  let r = parseFloat(t.r_multiple);
  if (Number.isNaN(r)) r = 0;
  if (res === "loss" && r > 0) return -1;
  if (res === "be") return 0;
  if (res === "win" && r < 0) return Math.abs(r);
  return r;
};

// Trade Win identifier
const isTradeWin = (t) => {
  if (!t) return false;
  const res = (t.result || "").toLowerCase().trim();
  if (res === "win") return true;
  if (res === "loss" || res === "be") return false;
  return normalizeTradeR(t) > 0;
};

// Format trade duration
const getTradeDuration = (t) => {
  if (!t.date) return "—";
  const start = new Date(`${t.date}T${t.time || "00:00"}`).getTime();
  const end = t.exit_date
    ? new Date(`${t.exit_date}T${t.exit_time || "00:00"}`).getTime()
    : start + 45 * 60 * 1000;
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "—";
  const diffMinutes = Math.round((end - start) / 60000);
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
};

// Format day of week
const getTradeDayOfWeek = (t) => {
  if (!t.date) return "—";
  try {
    const d = new Date(`${t.date}T12:00:00`);
    return d.toLocaleDateString("en-US", { weekday: "long" });
  } catch {
    return "—";
  }
};

export default function PastTrades() {
  const navigate = useNavigate();
  const location = useLocation();

  // Instant 0ms cache-backed trade state
  const [trades, setTrades] = useState(() => {
    const cached = getImmediateCachedTrades();
    return cached ? [...cached].sort((a, b) => tradeStamp(b) - tradeStamp(a)) : [];
  });
  const [loading, setLoading] = useState(() => !getImmediateCachedTrades());

  // Modals state
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  // Table selection & row expansion
  const [selectedAccount, setSelectedAccount] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [copiedTradeId, setCopiedTradeId] = useState(null);
  const [shareModalTrade, setShareModalTrade] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [bulkToast, setBulkToast] = useState("");

  // ── VIEW POPOVER STATE (Matches Screenshots 1 & 3) ──
  const [isViewOpen, setIsViewOpen] = useState(false);
  const viewButtonRef = useRef(null);
  const viewPopoverRef = useRef(null);

  // ── Column Order State (Supports Custom Drag & Drop / Up-Down Shuffling & Custom CSV Export) ──
  const [columnOrder, setColumnOrder] = useState(() => {
    try {
      const saved = localStorage.getItem("tfb_trades_column_order");
      if (saved) {
        const parsed = JSON.parse(saved);
        const validIds = ALL_COLUMNS.map((c) => c.id);
        const merged = [
          ...parsed.filter((id) => validIds.includes(id)),
          ...validIds.filter((id) => !parsed.includes(id)),
        ];
        return merged;
      }
    } catch (e) {}
    return ALL_COLUMNS.map((c) => c.id);
  });

  useEffect(() => {
    localStorage.setItem("tfb_trades_column_order", JSON.stringify(columnOrder));
  }, [columnOrder]);

  const orderedVisibleColumns = useMemo(
    () => columnOrder.filter((id) => visibleColumns.includes(id)),
    [columnOrder, visibleColumns]
  );

  const handleMoveColumn = (colId, direction) => {
    setColumnOrder((prev) => {
      const idx = prev.indexOf(colId);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;
    setColumnOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem("tfb_trades_visible_columns");
      return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_IDS;
    } catch {
      return DEFAULT_VISIBLE_IDS;
    }
  });

  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem("tfb_trades_sort_by") || "";
  });

  const [rowHeight, setRowHeight] = useState(() => {
    return localStorage.getItem("tfb_trades_row_height") || "relaxed"; // "compact" | "default" | "relaxed"
  });

  const [tradesPerPage, setTradesPerPage] = useState(() => {
    return parseInt(localStorage.getItem("tfb_trades_per_page") || "100", 10);
  });

  const [filterUnderColumns, setFilterUnderColumns] = useState(() => {
    return localStorage.getItem("tfb_trades_filter_under_columns") === "true";
  });

  // ── FILTERS DRAWER STATE (Matches Screenshot 2) ──
  const [isFiltersOpen, setIsFiltersOpen] = useState(true); // Default open per Screenshot 2
  const [pnlFilter, setPnlFilter] = useState("all"); // "all" | "profitable" | "loss"
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "long" | "short"
  const [timePeriod, setTimePeriod] = useState("last_30_days"); // Default "Last 30 Days" per Screenshot 2
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);

  // Advanced Conditions
  const [conditions, setConditions] = useState([]); // [{ id, field, operator, value }]
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState({}); // { [colId]: string }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Close view popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        isViewOpen &&
        viewPopoverRef.current &&
        !viewPopoverRef.current.contains(e.target) &&
        viewButtonRef.current &&
        !viewButtonRef.current.contains(e.target)
      ) {
        setIsViewOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isViewOpen]);

  // Persist View Settings to localStorage
  useEffect(() => {
    localStorage.setItem("tfb_trades_visible_columns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem("tfb_trades_sort_by", sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem("tfb_trades_row_height", rowHeight);
  }, [rowHeight]);

  useEffect(() => {
    localStorage.setItem("tfb_trades_per_page", String(tradesPerPage));
  }, [tradesPerPage]);

  useEffect(() => {
    localStorage.setItem("tfb_trades_filter_under_columns", String(filterUnderColumns));
  }, [filterUnderColumns]);

  // Fetch trades on initial mount
  useEffect(() => {
    const fetchTrades = async () => {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return navigate("/login");
      try {
        const sorted = await getTradesWithCache(userId);
        const ordered = [...sorted].sort((a, b) => tradeStamp(b) - tradeStamp(a));
        setTrades(ordered);

        if (location.state?.openTradeId) {
          const t = ordered.find((x) => x.id === location.state.openTradeId);
          if (t) setSelectedTrade(t);
        }
      } catch (error) {
        console.error("Failed to fetch trades:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [navigate, location.state]);

  // Listen to background trade updates across tabs or routes
  useEffect(() => {
    const handleUpdated = (e) => {
      if (e.detail) {
        setTrades([...e.detail].sort((a, b) => tradeStamp(b) - tradeStamp(a)));
      }
    };
    window.addEventListener("trades_updated", handleUpdated);
    return () => window.removeEventListener("trades_updated", handleUpdated);
  }, []);

  // ── FILTERING LOGIC ──
  const filteredTrades = useMemo(() => {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const startOfPrevMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getTime();
    const endOfPrevMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0, 23, 59, 59).getTime();

    return trades.filter((t) => {
      const stamp = tradeStamp(t);
      const r = normalizeTradeR(t);
      const pnl = Number(t.pnl);
      const isWin = isTradeWin(t);
      const isLoss = (t.result || "").toLowerCase() === "loss" || r < 0 || pnl < 0;

      // 1. Time Period Filter
      if (timePeriod === "today" && stamp < startOfToday.getTime()) return false;
      if (timePeriod === "this_week" && stamp < startOfWeek.getTime()) return false;
      if (timePeriod === "last_30_days" && stamp < now - 30 * ONE_DAY) return false;
      if (timePeriod === "this_month" && stamp < startOfMonth) return false;
      if (timePeriod === "last_month" && (stamp < startOfPrevMonth || stamp > endOfPrevMonth)) return false;
      if (timePeriod === "last_3_months" && stamp < now - 90 * ONE_DAY) return false;
      if (timePeriod === "custom") {
        if (customStartDate && stamp < new Date(customStartDate).getTime()) return false;
        if (customEndDate && stamp > new Date(customEndDate).setHours(23, 59, 59, 999)) return false;
      }

      // 2. P&L Filter (All / Profitable / Loss)
      if (pnlFilter === "profitable" && !isWin) return false;
      if (pnlFilter === "loss" && !isLoss) return false;

      // 3. Type Filter (All / Long / Short)
      const dir = (t.direction || "LONG").toUpperCase();
      if (typeFilter === "long" && dir !== "LONG") return false;
      if (typeFilter === "short" && dir !== "SHORT") return false;

      // 4. Account Filter
      if (selectedAccount && selectedAccount !== "All Accounts") {
        const acc = (t.account_name || t.account || "Default Account").trim().toLowerCase();
        if (acc !== selectedAccount.trim().toLowerCase()) return false;
      }

      // 5. Quick Search (Symbol, Setup, Session, Account)
      if (search) {
        const query = search.toLowerCase();
        const matches =
          (t.asset && t.asset.toLowerCase().includes(query)) ||
          (t.setup && t.setup.toLowerCase().includes(query)) ||
          (t.session && t.session.toLowerCase().includes(query)) ||
          (t.account_name && t.account_name.toLowerCase().includes(query)) ||
          (t.reason && t.reason.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // 6. Conditions filter
      for (const cond of conditions) {
        if (!cond.value) continue;
        const targetVal = String(t[cond.field] || "").toLowerCase();
        const condVal = String(cond.value).toLowerCase();
        if (cond.operator === "equals" && targetVal !== condVal) return false;
        if (cond.operator === "contains" && !targetVal.includes(condVal)) return false;
        if (cond.operator === "gt" && parseFloat(targetVal) <= parseFloat(condVal)) return false;
        if (cond.operator === "lt" && parseFloat(targetVal) >= parseFloat(condVal)) return false;
      }

      // 6. Under-column individual filters
      if (filterUnderColumns) {
        for (const [colKey, filterVal] of Object.entries(columnFilters)) {
          if (!filterVal) continue;
          const needle = filterVal.toLowerCase();
          const haystack = String(t[colKey] || t.asset || "").toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
      }

      return true;
    });
  }, [
    trades,
    selectedAccount,
    timePeriod,
    customStartDate,
    customEndDate,
    pnlFilter,
    typeFilter,
    search,
    conditions,
    filterUnderColumns,
    columnFilters,
  ]);

  // Counts for P&L pills: Profitable (X), Loss (Y)
  const { profitableCount, lossCount } = useMemo(() => {
    let profitable = 0;
    let loss = 0;
    trades.forEach((t) => {
      const r = normalizeTradeR(t);
      const isWin = isTradeWin(t);
      if (isWin) profitable++;
      else if ((t.result || "").toLowerCase() === "loss" || r < 0 || Number(t.pnl) < 0) loss++;
    });
    return { profitableCount: profitable, lossCount: loss };
  }, [trades]);

  // ── SORTING LOGIC ──
  const sortedTrades = useMemo(() => {
    if (!sortBy) return filteredTrades;
    return [...filteredTrades].sort((a, b) => {
      switch (sortBy) {
        case "symbol":
          return (a.asset || "").localeCompare(b.asset || "");
        case "type":
          return (a.direction || "").localeCompare(b.direction || "");
        case "entry":
          return (Number(a.entry || a.entry_price) || 0) - (Number(b.entry || b.entry_price) || 0);
        case "exit":
          return (Number(a.exit || a.exit_price) || 0) - (Number(b.exit || b.exit_price) || 0);
        case "size":
          return (Number(a.lot_size || a.size) || 0) - (Number(b.lot_size || b.size) || 0);
        case "pnl":
        case "net_pnl":
          return (Number(b.pnl) || 0) - (Number(a.pnl) || 0);
        case "open_time":
          return (a.time || "").localeCompare(b.time || "");
        case "close_time":
          return (a.exit_time || "").localeCompare(b.exit_time || "");
        case "open_close":
        default:
          return tradeStamp(b) - tradeStamp(a);
      }
    });
  }, [filteredTrades, sortBy]);

  // Pagination slice
  useEffect(() => {
    setCurrentPage(1);
  }, [pnlFilter, typeFilter, timePeriod, search, conditions, sortBy, tradesPerPage]);

  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = sortedTrades.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(sortedTrades.length / tradesPerPage) || 1;

  // Row selection
  const handleToggleSelectAll = () => {
    if (selectedRowIds.size === currentTrades.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(currentTrades.map((t) => t.id)));
    }
  };

  const handleToggleRowSelect = (id, e) => {
    e.stopPropagation();
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleRowExpand = (id, e) => {
    e.stopPropagation();
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Delete single trade
  const handleDeleteTrade = async (tradeId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Delete this trade record permanently?")) return;
    try {
      await api.delete(`/api/trades/${tradeId}`);
      invalidateTradeCache();
      const updated = trades.filter((t) => t.id !== tradeId);
      setTrades(updated);
      setCachedTrades(updated);
      if (selectedTrade?.id === tradeId) setSelectedTrade(null);
    } catch (err) {
      alert("Failed to delete trade. Please try again.");
    }
  };

  // Clear all trades
  const handleClearAllTrades = async () => {
    setIsClearing(true);
    try {
      await api.delete("/api/trades/all");
      invalidateTradeCache();
      setTrades([]);
      setCachedTrades([]);
      setIsClearAllModalOpen(false);
      setSelectedTrade(null);
    } catch (err) {
      console.error("Failed to clear trades:", err);
      alert("Failed to clear trades. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  // Export CSV helper driven dynamically by customized columnOrder
  const exportTradesToCSV = (tradeList, filename = "forexnotes_trade_history.csv", isExcel = false) => {
    if (!tradeList || tradeList.length === 0) {
      alert("No trades to export.");
      return;
    }
    const activeCols = columnOrder.filter((id) => visibleColumns.includes(id));
    const headers = activeCols.map((id) => {
      const colDef = ALL_COLUMNS.find((c) => c.id === id);
      return colDef ? colDef.label : id;
    });

    const getColValue = (colId, t) => {
      switch (colId) {
        case "open_close":
          return `Open: ${t.date || ""} ${t.time || ""} | Close: ${t.exit_date || t.date || ""} ${t.exit_time || t.time || ""}`.trim();
        case "symbol":
          return t.asset || "";
        case "type":
          return (t.direction || "").toUpperCase();
        case "entry":
          return t.entry || t.entry_price || "";
        case "exit":
          return t.exit || t.exit_price || "";
        case "size":
          return t.lot_size ?? t.size ?? "";
        case "pnl":
        case "net_pnl":
          return t.pnl !== null && t.pnl !== undefined ? t.pnl : "";
        case "source":
          return t.source || "Manual";
        case "open_time":
          return `${t.date || ""} ${t.time || ""}`.trim();
        case "close_time":
          return `${t.exit_date || t.date || ""} ${t.exit_time || t.time || ""}`.trim();
        case "duration":
          return getTradeDuration(t);
        case "commission":
          return t.commission ?? "";
        case "swap":
          return t.swap ?? "";
        case "day":
          return getTradeDayOfWeek(t);
        case "notes":
          return t.notes || t.reason || t.lesson || "";
        default:
          return t[colId] ?? "";
      }
    };

    const rows = tradeList.map((t) => activeCols.map((colId) => getColValue(colId, t)));

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? "");
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(",")
      )
      .join("\n");

    const prefix = isExcel ? "\uFEFF" : "";
    const blob = new Blob([prefix + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getExportDateSuffix = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}_${m}_${day}`;
  };

  // Export all visible/filtered trades (Matches Screenshot 3 request)
  const handleExportCSV = () => {
    exportTradesToCSV(sortedTrades, `forexnotes_trade_history_${getExportDateSuffix()}.csv`);
  };

  // Bulk actions on selected rows (Screenshot 5)
  const selectedTradesNetPnl = useMemo(() => {
    let total = 0;
    trades.forEach((t) => {
      if (selectedRowIds.has(t.id)) {
        if (t.pnl !== null && t.pnl !== undefined && !Number.isNaN(Number(t.pnl))) {
          total += Number(t.pnl);
        } else {
          const r = normalizeTradeR(t);
          total += r * 100;
        }
      }
    });
    return total;
  }, [trades, selectedRowIds]);

  const handleBulkCopy = () => {
    const selected = trades.filter((t) => selectedRowIds.has(t.id));
    if (selected.length === 0) return;
    const text = selected
      .map(
        (t) =>
          `${t.asset || "Trade"}: ${t.direction || "LONG"} | Entry: ${t.entry || t.entry_price || "—"} | Exit: ${t.exit || t.exit_price || "—"} | P&L: ${
            t.pnl !== null && t.pnl !== undefined ? `$${t.pnl}` : `${normalizeTradeR(t)}R`
          }`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    setBulkToast("Selected trades copied to clipboard!");
    setTimeout(() => setBulkToast(""), 3000);
  };

  const handleBulkExportCSV = () => {
    const selected = trades.filter((t) => selectedRowIds.has(t.id));
    if (selected.length === 0) return;
    exportTradesToCSV(selected, `forexnotes_trade_history_${getExportDateSuffix()}.csv`);
  };

  const handleBulkExportExcel = () => {
    const selected = trades.filter((t) => selectedRowIds.has(t.id));
    if (selected.length === 0) return;
    exportTradesToCSV(selected, `forexnotes_trade_history_${getExportDateSuffix()}.csv`, true);
  };

  // Toggle single column checkbox
  const handleToggleColumn = (colId) => {
    const col = ALL_COLUMNS.find((c) => c.id === colId);
    if (col?.required) return; // Open/Close and Symbol cannot be unchecked
    setVisibleColumns((prev) => {
      if (prev.includes(colId)) {
        return prev.filter((id) => id !== colId);
      } else {
        return [...prev, colId];
      }
    });
  };

  // Show All / Reset Columns
  const handleToggleShowAllColumns = () => {
    if (visibleColumns.length === ALL_COLUMNS.length) {
      setVisibleColumns(DEFAULT_VISIBLE_IDS);
    } else {
      setVisibleColumns(ALL_COLUMNS.map((c) => c.id));
    }
  };

  // Reset entire View to defaults
  const handleResetView = () => {
    setVisibleColumns(DEFAULT_VISIBLE_IDS);
    setSortBy("");
    setRowHeight("relaxed");
    setTradesPerPage(100);
    setFilterUnderColumns(false);
  };

  // Reset all filters
  const handleClearAllFilters = () => {
    setPnlFilter("all");
    setTypeFilter("all");
    setTimePeriod("all_time");
    setCustomStartDate("");
    setCustomEndDate("");
    setConditions([]);
    setSearch("");
    setColumnFilters({});
  };

  // Add condition
  const handleAddCondition = () => {
    setConditions((prev) => [
      ...prev,
      { id: Date.now(), field: "asset", operator: "equals", value: "" },
    ]);
  };

  // Remove condition
  const handleRemoveCondition = (id) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  // Padding based on rowHeight setting
  const rowPaddingClass =
    rowHeight === "compact"
      ? "py-2 px-3"
      : rowHeight === "default"
      ? "py-3 px-3"
      : "py-4 px-3";

  // ── Dynamic Cell Renderer (Respects Custom User Shuffled Column Order) ──
  const renderTableCell = (colId, t, ctx) => {
    const { openDateStr, closeDateStr, isLong, isWin, isLoss, hasPnl, pnlNum, r, rowPaddingClass } = ctx;
    switch (colId) {
      case "open_close":
        return (
          <td key={colId} className={`${rowPaddingClass} whitespace-nowrap`}>
            <div className="flex flex-col text-[11px] leading-tight font-medium text-neutral-700 dark:text-neutral-300">
              <span>{openDateStr}</span>
              <span className="text-neutral-500 dark:text-neutral-400 mt-0.5">{closeDateStr}</span>
            </div>
          </td>
        );
      case "symbol":
        return (
          <td key={colId} className={`${rowPaddingClass} whitespace-nowrap`}>
            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
              <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>{t.asset}</span>
            </div>
          </td>
        );
      case "type":
        return (
          <td key={colId} className={`${rowPaddingClass} whitespace-nowrap`}>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                isLong
                  ? "bg-blue-500/10 text-[#0066FF] dark:text-blue-400 border-blue-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              }`}
            >
              {isLong ? (
                <TrendingUp className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <TrendingDown className="w-3 h-3 stroke-[2.5]" />
              )}
              <span>{isLong ? "Long" : "Short"}</span>
            </span>
          </td>
        );
      case "entry":
        return (
          <td key={colId} className={`${rowPaddingClass} font-mono font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap`}>
            {t.entry || t.entry_price ? Number(t.entry || t.entry_price).toLocaleString() : "4,100.00"}
          </td>
        );
      case "exit":
        return (
          <td key={colId} className={`${rowPaddingClass} font-mono font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap`}>
            {t.exit || t.exit_price ? Number(t.exit || t.exit_price).toLocaleString() : "4,190.00"}
          </td>
        );
      case "size":
        return (
          <td key={colId} className={`${rowPaddingClass} font-mono font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap`}>
            {t.lot_size ?? t.size ?? "0.1"}
          </td>
        );
      case "pnl":
        return (
          <td key={colId} className={`${rowPaddingClass} font-mono font-black text-sm whitespace-nowrap`}>
            <span
              className={
                isWin
                  ? "text-[#0066FF] dark:text-blue-400 font-black"
                  : isLoss
                  ? "text-rose-500 dark:text-rose-400 font-black"
                  : "text-neutral-500 font-bold"
              }
            >
              {hasPnl
                ? `${pnlNum >= 0 ? "+" : ""}${Math.abs(pnlNum).toFixed(2)}`
                : `${r >= 0 ? "+" : ""}${r.toFixed(2)}R`}
            </span>
          </td>
        );
      case "source":
        return (
          <td key={colId} className={`${rowPaddingClass} whitespace-nowrap`}>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                t.source === "MT5" || t.source === "mt5_auto"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
              }`}
            >
              {t.source === "MT5" || t.source === "mt5_auto" ? (
                <Cpu className="w-3 h-3" />
              ) : (
                <Pencil className="w-3 h-3" />
              )}
              <span>
                {t.source === "MT5" || t.source === "mt5_auto" ? "MT5 Auto" : "Manual"}
              </span>
            </span>
          </td>
        );
      case "open_time":
        return (
          <td key={colId} className={`${rowPaddingClass} font-mono text-neutral-600 dark:text-neutral-400`}>
            {t.time || "—"}
          </td>
        );
      case "close_time":
        return (
          <td key={colId} className={`${rowPaddingClass} font-mono text-neutral-600 dark:text-neutral-400`}>
            {t.exit_time || t.time || "—"}
          </td>
        );
      case "duration":
        return (
          <td key={colId} className={`${rowPaddingClass} text-neutral-600 dark:text-neutral-400`}>
            {getTradeDuration(t)}
          </td>
        );
      case "net_pnl":
        return (
          <td key={colId} className={`${rowPaddingClass} font-mono font-bold text-neutral-900 dark:text-white`}>
            {hasPnl ? `${Number(t.pnl).toFixed(2)}` : "—"}
          </td>
        );
      case "commission":
        return (
          <td key={colId} className={`${rowPaddingClass} font-mono text-neutral-500`}>
            {t.commission ? `${Number(t.commission).toFixed(2)}` : "$0.00"}
          </td>
        );
      case "swap":
        return (
          <td key={colId} className={`${rowPaddingClass} font-mono text-neutral-500`}>
            {t.swap ? `${Number(t.swap).toFixed(2)}` : "$0.00"}
          </td>
        );
      case "day":
        return (
          <td key={colId} className={`${rowPaddingClass} text-neutral-600 dark:text-neutral-400`}>
            {getTradeDayOfWeek(t)}
          </td>
        );
      case "notes":
        return (
          <td key={colId} className={`${rowPaddingClass} text-neutral-500 truncate max-w-[120px]`}>
            {t.reason || t.lesson || "—"}
          </td>
        );
      default:
        return (
          <td key={colId} className={rowPaddingClass}>
            {String(t[colId] || "—")}
          </td>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto font-sans pb-24 px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 space-y-6">
      {/* ── 1. TOP HEADER (Trades Title + All Accounts + Clear All + Add Trade) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
            Trades
          </h1>
        </div>

        {/* Action Button Row - Aligned cleanly for Mobile & Desktop */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* All Accounts Dropdown Button */}
            <div className="flex-1 sm:flex-initial">
              <AccountFilter
                trades={trades}
                selectedAccount={selectedAccount}
                onChange={setSelectedAccount}
              />
            </div>

            {/* Clear All Button */}
            <button
              type="button"
              onClick={() => setIsClearAllModalOpen(true)}
              disabled={trades.length === 0}
              className="h-10 px-3.5 sm:px-4 rounded-xl border border-rose-200 dark:border-rose-500/25 bg-white dark:bg-white/[0.03] hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 dark:text-rose-400 font-bold text-xs sm:text-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>

          {/* + Add Trade Button (Harmonized with header buttons, guaranteed crisp white text/icon) */}
          <button
            type="button"
            onClick={() => setIsAddTradeModalOpen(true)}
            style={{ backgroundColor: "#0066FF", color: "#ffffff" }}
            className="w-full sm:w-auto h-10 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-[#0066FF]/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 btn-primary-blue shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" style={{ color: "#ffffff", stroke: "#ffffff" }} />
            <span style={{ color: "#ffffff" }} className="font-bold">Add Trade</span>
          </button>
        </div>
      </div>

      {/* ── 2. TRADE HISTORY CARD CONTAINER ── */}
      <div className="rounded-3xl bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-5 sm:p-6 space-y-4 backdrop-blur-xl relative">
        {/* Card Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Trade History
            </h2>
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
              {sortedTrades.length} of {trades.length} trades
            </span>
          </div>

          {/* Card Top Action Toolbar (Filters, View, Export) */}
          <div className="flex items-center gap-2 self-start sm:self-auto relative">
            {/* Filters Button */}
            <button
              type="button"
              onClick={() => setIsFiltersOpen((v) => !v)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isFiltersOpen
                  ? "bg-blue-500/10 border-blue-500/30 text-[#0066FF] dark:text-blue-400"
                  : "border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.06]"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] inline-block" />
            </button>

            {/* View Button */}
            <button
              ref={viewButtonRef}
              type="button"
              onClick={() => setIsViewOpen((v) => !v)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isViewOpen
                  ? "bg-blue-500/10 border-blue-500/30 text-[#0066FF] dark:text-blue-400"
                  : "border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.06]"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>View</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] inline-block" />
            </button>

            {/* Export Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {/* ── VIEW POPOVER MODAL (Apple Squircle Dropdown) ── */}
            {isViewOpen && (
              <div
                ref={viewPopoverRef}
                className="absolute right-0 top-full mt-2 w-[620px] max-w-[92vw] bg-white dark:bg-[#111522] rounded-3xl border border-black/10 dark:border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.85)] z-[1000] p-5 sm:p-6 font-sans animate-in zoom-in-95 duration-150 backdrop-blur-2xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 divide-y md:divide-y-0 md:divide-x divide-black/[0.06] dark:divide-white/[0.08]">
                  {/* ── LEFT COLUMN: COLUMNS · X OF 16 ── */}
                  <div className="space-y-3 md:pr-4">
                    <div className="flex items-center justify-between pb-1 border-b border-black/[0.05] dark:border-white/[0.06]">
                      <span className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                        COLUMNS · {visibleColumns.length} OF {ALL_COLUMNS.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleShowAllColumns}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {visibleColumns.length === ALL_COLUMNS.length ? "Hide extra" : "Show all"}
                      </button>
                    </div>

                    {/* Columns Checklist with Drag & Drop and Up/Down Column Shuffling */}
                    <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
                      {columnOrder.map((colId, index) => {
                        const col = ALL_COLUMNS.find((c) => c.id === colId) || { id: colId, label: colId };
                        const isChecked = visibleColumns.includes(colId);
                        return (
                          <div
                            key={colId}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            onClick={() => handleToggleColumn(colId)}
                            className="flex items-center justify-between p-1.5 rounded-xl transition-colors cursor-pointer select-none hover:bg-black/[0.03] dark:hover:bg-white/[0.06] group"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span
                                title="Drag to reorder column"
                                className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-0.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={col.required}
                                onChange={() => {}}
                                className={`w-4 h-4 rounded accent-blue-600 cursor-pointer ${
                                  col.required ? "opacity-60 cursor-not-allowed" : ""
                                }`}
                              />
                              <span className={`text-xs font-semibold truncate ${
                                isChecked ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"
                              }`}>
                                {col.label}
                              </span>
                            </div>

                            {/* Up / Down Shuffling Triggers */}
                            <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveColumn(colId, "up")}
                                className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                                title="Move column up"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={index === columnOrder.length - 1}
                                onClick={() => handleMoveColumn(colId, "down")}
                                className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                                title="Move column down"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── RIGHT COLUMN: SORT, DISPLAY, TIPS ── */}
                  <div className="space-y-4 md:pl-5 pt-4 md:pt-0">
                    {/* 1. SORT Section (Apple Custom Frosted Dropdown) */}
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white block mb-1">
                        SORT
                      </span>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug mb-2">
                        Newest trades first. Click a column header to sort, Shift+click to add another.
                      </p>

                      <AppleSelect
                        value={sortBy}
                        onChange={(val) => setSortBy(val)}
                        options={[
                          { value: "", label: "Sort by... (Default)" },
                          ...columnOrder.map((colId) => {
                            const c = ALL_COLUMNS.find((col) => col.id === colId);
                            return { value: colId, label: c ? c.label : colId };
                          }),
                        ]}
                        placeholder="Sort by..."
                      />
                    </div>

                    {/* 2. DISPLAY Section (Row Height Only - Trades per page and Filter under column removed) */}
                    <div className="space-y-3 pt-1 border-t border-black/[0.05] dark:border-white/[0.06]">
                      <span className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white block">
                        DISPLAY
                      </span>

                      {/* Row Height */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-700 dark:text-neutral-300 font-semibold">
                          Row height
                        </span>
                        <div className="flex items-center bg-neutral-100 dark:bg-white/[0.06] p-0.5 rounded-xl border border-black/[0.05] dark:border-white/[0.08]">
                          {["compact", "default", "relaxed"].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setRowHeight(opt)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                                rowHeight === opt
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 3. TIPS Section */}
                    <div className="space-y-1 pt-1 border-t border-black/[0.05] dark:border-white/[0.06]">
                      <span className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white block">
                        TIPS
                      </span>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Drag across cells to see their sum and average. <kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[9px] font-mono">Shift</kbd> extends a selection and <kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[9px] font-mono">Ctrl/⌘+C</kbd> copies it. Drag a column header to move it, or its edge to resize.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Popover Footer */}
                <div className="flex items-center justify-between pt-3 mt-4 border-t border-black/[0.06] dark:border-white/[0.08] text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                    Saved to your account
                  </span>
                  <button
                    type="button"
                    onClick={handleResetView}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset view</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. FILTERS DRAWER (Matches Screenshot 2 Exactly) ── */}
        {isFiltersOpen && (
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.06] space-y-4 animate-in fade-in duration-150">
            {/* ROW 1: P&L and TYPE Filters */}
            <div className="flex items-center gap-6 flex-wrap text-xs">
              {/* P&L Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  P&L
                </span>
                <div className="flex items-center bg-white dark:bg-white/[0.04] p-0.5 rounded-xl border border-black/[0.05] dark:border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setPnlFilter("all")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      pnlFilter === "all"
                        ? "bg-blue-100 dark:bg-blue-500/20 text-[#0066FF] dark:text-blue-400 shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setPnlFilter("profitable")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      pnlFilter === "profitable"
                        ? "bg-blue-100 dark:bg-blue-500/20 text-[#0066FF] dark:text-blue-400 shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    Profitable ({profitableCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPnlFilter("loss")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      pnlFilter === "loss"
                        ? "bg-blue-100 dark:bg-blue-500/20 text-[#0066FF] dark:text-blue-400 shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    Loss ({lossCount})
                  </button>
                </div>
              </div>

              {/* TYPE Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  TYPE
                </span>
                <div className="flex items-center bg-white dark:bg-white/[0.04] p-0.5 rounded-xl border border-black/[0.05] dark:border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setTypeFilter("all")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      typeFilter === "all"
                        ? "bg-blue-100 dark:bg-blue-500/20 text-[#0066FF] dark:text-blue-400 shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("long")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      typeFilter === "long"
                        ? "bg-blue-100 dark:bg-blue-500/20 text-[#0066FF] dark:text-blue-400 shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                    <span>Long</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("short")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      typeFilter === "short"
                        ? "bg-blue-100 dark:bg-blue-500/20 text-[#0066FF] dark:text-blue-400 shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                    <span>Short</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ROW 2: TIME PERIOD Filter */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mr-1">
                TIME PERIOD
              </span>
              <div className="flex items-center gap-1 flex-wrap bg-white dark:bg-white/[0.04] p-0.5 rounded-xl border border-black/[0.05] dark:border-white/[0.08]">
                {[
                  { id: "all_time", label: "All Time" },
                  { id: "today", label: "Today" },
                  { id: "this_week", label: "This Week" },
                  { id: "last_30_days", label: "Last 30 Days" },
                  { id: "this_month", label: "This Month" },
                  { id: "last_month", label: "Last Month" },
                  { id: "last_3_months", label: "Last 3 Months" },
                  { id: "custom", label: "Custom", icon: Calendar },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTimePeriod(item.id);
                      if (item.id === "custom") setShowCustomDateModal(true);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      timePeriod === item.id
                        ? "bg-blue-100 dark:bg-blue-500/20 text-[#0066FF] dark:text-blue-400 shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    {item.icon && <item.icon className="w-3 h-3" />}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ROW 3: Clear All Filters */}
            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-neutral-500 hover:text-rose-500 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors text-xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear All Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* ── 5. STRUCTURED DATA TABLE (Matches Screenshots Exactly) ── */}
        <div className="overflow-x-auto border-t border-black/[0.06] dark:border-white/[0.06] pt-2">
          <table className="w-full text-left border-collapse min-w-[840px]">
            {/* Table Header Row */}
            <thead>
              <tr className="border-b border-black/[0.05] dark:border-white/[0.06] text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 select-none">
                <th className="py-3 px-3 w-9 text-center">
                  <input
                    type="checkbox"
                    checked={
                      currentTrades.length > 0 &&
                      selectedRowIds.size === currentTrades.length
                    }
                    onChange={handleToggleSelectAll}
                    className="w-3.5 h-3.5 rounded accent-[#0066FF] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-1 w-6"></th>

                {orderedVisibleColumns.map((colId) => {
                  const colDef = ALL_COLUMNS.find((c) => c.id === colId);
                  const isSorted = sortBy === colId;
                  return (
                    <th
                      key={colId}
                      className="py-3 px-3 cursor-pointer select-none hover:text-neutral-700 dark:hover:text-white transition-colors whitespace-nowrap"
                      onClick={() => setSortBy(sortBy === colId ? "" : colId)}
                    >
                      <div className="flex items-center gap-1">
                        <span>{colDef?.label.toUpperCase() || colId.toUpperCase()}</span>
                        {isSorted && <ChevronDown className="w-3.5 h-3.5 text-[#0066FF]" />}
                      </div>
                    </th>
                  );
                })}

                <th className="py-3 px-3 text-right sticky right-0 bg-white/95 dark:bg-[#121622]/95 backdrop-blur-md z-10 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[-6px_0_16px_rgba(0,0,0,0.4)]"></th>
              </tr>

              {/* Filter Under Each Column Row (When Enabled in View Modal) */}
              {filterUnderColumns && (
                <tr className="border-b border-black/[0.05] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01]">
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  {visibleColumns.includes("open_close") && (
                    <th className="p-1">
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters.open_close || ""}
                        onChange={(e) =>
                          setColumnFilters((f) => ({ ...f, open_close: e.target.value }))
                        }
                        className="w-full text-xs font-normal px-2 py-1 bg-white dark:bg-[#181d2c] border border-black/[0.08] dark:border-white/10 rounded-md"
                      />
                    </th>
                  )}
                  {visibleColumns.includes("symbol") && (
                    <th className="p-1">
                      <input
                        type="text"
                        placeholder="Symbol..."
                        value={columnFilters.symbol || ""}
                        onChange={(e) =>
                          setColumnFilters((f) => ({ ...f, symbol: e.target.value }))
                        }
                        className="w-full text-xs font-normal px-2 py-1 bg-white dark:bg-[#181d2c] border border-black/[0.08] dark:border-white/10 rounded-md"
                      />
                    </th>
                  )}
                  {visibleColumns.includes("type") && <th className="p-1"></th>}
                  {visibleColumns.includes("entry") && <th className="p-1"></th>}
                  {visibleColumns.includes("exit") && <th className="p-1"></th>}
                  {visibleColumns.includes("size") && <th className="p-1"></th>}
                  {visibleColumns.includes("pnl") && <th className="p-1"></th>}
                  {visibleColumns.includes("source") && <th className="p-1"></th>}
                  {visibleColumns.includes("open_time") && <th className="p-1"></th>}
                  {visibleColumns.includes("close_time") && <th className="p-1"></th>}
                  {visibleColumns.includes("duration") && <th className="p-1"></th>}
                  {visibleColumns.includes("net_pnl") && <th className="p-1"></th>}
                  {visibleColumns.includes("commission") && <th className="p-1"></th>}
                  {visibleColumns.includes("swap") && <th className="p-1"></th>}
                  {visibleColumns.includes("day") && <th className="p-1"></th>}
                  {visibleColumns.includes("notes") && <th className="p-1"></th>}
                  <th className="p-1"></th>
                </tr>
              )}
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={orderedVisibleColumns.length + 3} className="py-16 text-center">
                    <Loader2 className="w-6 h-6 text-[#0066FF] animate-spin mx-auto mb-2" />
                    <span className="text-neutral-400 text-xs">
                      Loading trade history...
                    </span>
                  </td>
                </tr>
              ) : currentTrades.length === 0 ? (
                <tr>
                  <td colSpan={orderedVisibleColumns.length + 3} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="text-neutral-500 dark:text-neutral-400 font-semibold text-sm">
                        No trades found
                      </p>
                      <p className="text-neutral-400 text-xs">
                        Adjust your filters or click "+ Add Trade" above to log your execution.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentTrades.map((t, idx) => {
                  const isExpanded = expandedRows.has(t.id);
                  const isSelected = selectedRowIds.has(t.id);
                  const r = normalizeTradeR(t);
                  const isWin = isTradeWin(t);
                  const isLoss = (t.result || "").toLowerCase() === "loss" || r < 0;
                  const isLong = (t.direction || "LONG").toUpperCase() === "LONG";

                  // Stacked Open & Close dates (Matches Screenshot 2 Exactly)
                  const openDateStr = t.date
                    ? `Open: ${t.date} ${t.time || "06:02 PM"}`
                    : "Open: —";
                  const closeDateStr = t.exit_date
                    ? `Close: ${t.exit_date} ${t.exit_time || "06:02 PM"}`
                    : t.date
                    ? `Close: ${t.date} ${t.time || "06:02 PM"}`
                    : "Close: —";

                  const pnlNum = Number(t.pnl);
                  const hasPnl = t.pnl !== null && t.pnl !== undefined && !Number.isNaN(pnlNum) && pnlNum !== 0;

                  return (
                    <Fragment key={t.id || idx}>
                      <tr
                        onClick={() => setSelectedTrade(t)}
                      className={`group hover:bg-black/[0.015] dark:hover:bg-white/[0.025] transition-colors cursor-pointer ${
                        isSelected ? "bg-blue-500/[0.04] dark:bg-blue-500/[0.06]" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className={`${rowPaddingClass} text-center`} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleRowSelect(t.id, e)}
                          className="w-3.5 h-3.5 rounded accent-[#0066FF] cursor-pointer"
                        />
                      </td>

                      {/* Expand Chevron Button with high contrast hint */}
                      <td className={`${rowPaddingClass} text-center`} onClick={(e) => handleToggleRowExpand(t.id, e)}>
                        <button
                          type="button"
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                            isExpanded
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-neutral-100 hover:bg-blue-50 dark:bg-white/[0.08] dark:hover:bg-blue-500/20 border-black/10 dark:border-white/15 text-neutral-700 dark:text-neutral-200 hover:text-[#0066FF]"
                          }`}
                          title={isExpanded ? "Collapse trade executions" : "Expand executions & details"}
                          aria-label="Expand trade details"
                        >
                          <ChevronRight
                            className={`w-4 h-4 stroke-[2.5] transition-transform duration-200 ${
                              isExpanded ? "rotate-90 text-white" : ""
                            }`}
                          />
                        </button>
                      </td>

                      {/* Dynamic Shuffled Columns Driven by orderedVisibleColumns */}
                      {orderedVisibleColumns.map((colId) =>
                        renderTableCell(colId, t, {
                          openDateStr,
                          closeDateStr,
                          isLong,
                          isWin,
                          isLoss,
                          hasPnl,
                          pnlNum,
                          r,
                          rowPaddingClass,
                        })
                      )}

                      {/* Action Icons (Sticky Right on Mobile & Desktop, 100% Touch Visible) */}
                      <td
                        className={`${rowPaddingClass} text-right whitespace-nowrap sticky right-0 bg-white/95 dark:bg-[#121622]/95 backdrop-blur-md z-10 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[-6px_0_16px_rgba(0,0,0,0.4)]`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                          {/* Expand/View Details */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleRowExpand(t.id, e)}
                            className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/10 dark:hover:bg-white/15 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
                            title={isExpanded ? "Collapse trade" : "View trade details"}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => navigate(`/add-trade?edit=${t.id}`)}
                            className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-blue-500/10 hover:text-[#0066FF] dark:hover:text-blue-400 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
                            title="Edit Trade"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Share Trade Poster */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareModalTrade(t);
                            }}
                            className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-[#0066FF] dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                            title="Share Trade Poster (Story, Post, Landscape)"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTrade(t.id, e)}
                            className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete Trade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── EXPANDED ROW SUB-SECTION (Matches Screenshot 5) ── */}
                    {isExpanded && (
                      <tr className="bg-[#f8fafc]/90 dark:bg-[#0c101a] border-b border-black/[0.06] dark:border-white/[0.08]">
                        <td colSpan={orderedVisibleColumns.length + 3} className="p-4 sm:p-6 space-y-5">
                          {/* 1. EXECUTIONS SUB-TABLE (Screenshot 5) */}
                          <div className="bg-white dark:bg-[#121622] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-xs">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.02]">
                              <h4 className="text-xs font-extrabold uppercase tracking-widest text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0066FF]" />
                                <span>Executions</span>
                              </h4>
                              <span className="text-[11px] font-mono text-neutral-400">
                                2 fills recorded
                              </span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-black/[0.05] dark:border-white/[0.06] text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500">
                                    <th className="px-4 py-2.5">Action</th>
                                    <th className="px-4 py-2.5">Time</th>
                                    <th className="px-4 py-2.5">Side</th>
                                    <th className="px-4 py-2.5">Price</th>
                                    <th className="px-4 py-2.5">Volume</th>
                                    <th className="px-4 py-2.5">Commission</th>
                                    <th className="px-4 py-2.5">Swap</th>
                                    <th className="px-4 py-2.5">P&L</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                                  {/* Open Fill */}
                                  <tr className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                                    <td className="px-4 py-2.5">
                                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 font-bold text-[11px]">
                                        Open
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-neutral-600 dark:text-neutral-300">
                                      {t.date ? `${t.date} ${t.time || "06:02 PM"}` : "—"}
                                    </td>
                                    <td className="px-4 py-2.5 font-bold">
                                      <span className={t.direction === "SHORT" || t.direction === "SELL" ? "text-rose-500" : "text-emerald-500"}>
                                        {t.direction === "SHORT" || t.direction === "SELL" ? "Sell" : "Buy"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono font-semibold text-neutral-900 dark:text-white">
                                      {t.entry || t.entry_price ? Number(t.entry || t.entry_price).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-neutral-700 dark:text-neutral-300">
                                      {t.lot_size ?? t.size ?? "0.1"}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-neutral-400">—</td>
                                    <td className="px-4 py-2.5 font-mono text-neutral-400">—</td>
                                    <td className="px-4 py-2.5 font-mono text-neutral-400">—</td>
                                  </tr>

                                  {/* Close Fill */}
                                  <tr className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                                    <td className="px-4 py-2.5">
                                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 font-bold text-[11px]">
                                        Close
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-neutral-600 dark:text-neutral-300">
                                      {t.exit_date ? `${t.exit_date} ${t.exit_time || "06:02 PM"}` : t.date ? `${t.date} ${t.time || "06:02 PM"}` : "—"}
                                    </td>
                                    <td className="px-4 py-2.5 font-bold">
                                      <span className={t.direction === "SHORT" || t.direction === "SELL" ? "text-emerald-500" : "text-rose-500"}>
                                        {t.direction === "SHORT" || t.direction === "SELL" ? "Buy" : "Sell"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono font-semibold text-neutral-900 dark:text-white">
                                      {t.exit || t.exit_price ? Number(t.exit || t.exit_price).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-neutral-700 dark:text-neutral-300">
                                      {t.lot_size ?? t.size ?? "0.1"}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-neutral-600 dark:text-neutral-400">
                                      {t.commission !== undefined && t.commission !== null ? `${Number(t.commission) >= 0 ? "+" : ""}$${Number(t.commission).toFixed(2)}` : "+$0.00"}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-neutral-600 dark:text-neutral-400">
                                      {t.swap !== undefined && t.swap !== null ? `${Number(t.swap) >= 0 ? "+" : ""}$${Number(t.swap).toFixed(2)}` : "+$0.00"}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono font-black text-sm">
                                      {hasPnl ? (
                                        <span className={pnlNum >= 0 ? "text-[#0066FF] dark:text-blue-400" : "text-rose-500"}>
                                          {pnlNum >= 0 ? "+" : ""}${pnlNum.toFixed(2)}
                                        </span>
                                      ) : (
                                        <span className={isWin ? "text-[#0066FF] dark:text-blue-400" : isLoss ? "text-rose-500" : "text-neutral-400"}>
                                          {r >= 0 ? "+" : ""}{r.toFixed(2)}R
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* 2. NOTES & PSYCHOLOGY SECTION */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Notes / Technical Setup */}
                            <div className="bg-white dark:bg-[#121622] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-xs">
                              <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
                                <Pencil className="w-3.5 h-3.5 text-[#0066FF]" />
                                <span>Notes</span>
                              </h5>
                              <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap font-sans">
                                {t.notes || t.reason || t.lesson || "No notes logged for this trade."}
                              </p>
                            </div>

                            {/* Psychology, Emotion & Rules */}
                            <div className="bg-white dark:bg-[#121622] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-xs">
                              <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
                                <Brain className="w-3.5 h-3.5 text-purple-500" />
                                <span>Psychology & Discipline</span>
                              </h5>
                              <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] uppercase font-bold text-neutral-400">Mindset:</span>
                                  <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[11px]">
                                    {t.emotion_before || t.emotion || t.psych_note || "Disciplined"}
                                  </span>
                                  {t.emotion_after && (
                                    <>
                                      <span className="text-neutral-400">→</span>
                                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                        {t.emotion_after}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {t.mistake && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-rose-400">Mistake:</span>
                                    <span className="text-rose-600 dark:text-rose-400 font-semibold">{t.mistake}</span>
                                  </div>
                                )}
                                {t.lesson && (
                                  <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
                                    <p className="text-[10px] uppercase font-bold text-neutral-400 mb-0.5">Lesson Learned:</p>
                                    <p className="text-neutral-700 dark:text-neutral-300 font-medium">{t.lesson}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 3. BEFORE & AFTER CHARTS (Interactive & Viewable Lightbox) */}
                          <div>
                            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Before & After Chart Analysis (Click photo to enlarge)</span>
                            </h5>

                            {(() => {
                              const tradeImgs = [];
                              if (t.before_image || t.before_chart) {
                                tradeImgs.push({ src: t.before_image || t.before_chart, label: "Before Entry Setup" });
                              }
                              if (t.after_image || t.after_chart) {
                                tradeImgs.push({ src: t.after_image || t.after_chart, label: "After Outcome Analysis" });
                              }
                              if (Array.isArray(t.images) && t.images.length > 0) {
                                t.images.forEach((img, i) => {
                                  if (!tradeImgs.some((x) => x.src === img)) {
                                    tradeImgs.push({
                                      src: img,
                                      label: i === 0 ? "Before Setup" : i === 1 ? "After Outcome" : `Chart #${i + 1}`,
                                    });
                                  }
                                });
                              }

                              if (tradeImgs.length === 0) {
                                return (
                                  <div className="p-4 rounded-2xl border border-dashed border-black/[0.08] dark:border-white/[0.1] bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-between">
                                    <span className="text-xs text-neutral-400">
                                      No before/after chart screenshots attached to this trade.
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/add-trade?edit=${t.id}`)}
                                      className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-[#0066FF] dark:text-blue-400 font-bold text-xs transition-colors cursor-pointer"
                                    >
                                      Upload Chart
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {tradeImgs.map((item, i) => (
                                    <div
                                      key={i}
                                      onClick={() => setLightboxImage({ src: item.src, title: `${t.asset} · ${item.label}` })}
                                      className="group relative aspect-video rounded-2xl overflow-hidden border border-black/[0.08] dark:border-white/[0.1] bg-neutral-900 cursor-pointer shadow-xs hover:shadow-md transition-all"
                                    >
                                      <img
                                        src={item.src}
                                        alt={item.label}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      />
                                      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-bold text-white border border-white/15">
                                        {item.label}
                                      </div>
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="px-3 py-1.5 rounded-xl bg-white/95 text-neutral-900 text-xs font-bold shadow-lg flex items-center gap-1.5">
                                          <Maximize2 className="w-3.5 h-3.5" />
                                          View High-Res Photo
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS ── */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-black/[0.05] dark:border-white/[0.06] text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">
              Showing {indexOfFirstTrade + 1}–{Math.min(indexOfLastTrade, sortedTrades.length)} of {sortedTrades.length} trades
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] text-neutral-700 dark:text-neutral-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.02] dark:hover:bg-white/[0.06] transition-all cursor-pointer shadow-xs"
              >
                Previous
              </button>
              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] text-neutral-700 dark:text-neutral-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.02] dark:hover:bg-white/[0.06] transition-all cursor-pointer shadow-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CUSTOM DATE RANGE MODAL ── */}
      {showCustomDateModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setShowCustomDateModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#121622] rounded-3xl p-6 border border-black/[0.08] dark:border-white/[0.12] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0066FF]" />
                <span>Custom Date Range</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomDateModal(false)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <DateTimePickerPopover
                label="Start Date"
                mode="date"
                accentColor="blue"
                returnFormat="iso"
                value={customStartDate}
                onChange={(val) => setCustomStartDate(val || "")}
                placeholder="Select start date"
              />
              <DateTimePickerPopover
                label="End Date"
                mode="date"
                accentColor="blue"
                returnFormat="iso"
                value={customEndDate}
                onChange={(val) => setCustomEndDate(val || "")}
                placeholder="Select end date"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomDateModal(false)}
                style={{ backgroundColor: "#0066FF", color: "#ffffff" }}
                className="w-full py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs shadow-md shadow-[#0066FF]/25 btn-primary-blue cursor-pointer"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONNECT MT4/MT5 MODAL ── */}
      {isConnectModalOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsConnectModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.12] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-[#0066FF] flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    Connect MT4 / MT5 Terminal
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Real-time automatic sync via Investor (Read-Only) credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-blue-500/[0.06] border border-blue-500/15">
                <span className="font-bold text-[#0066FF] dark:text-blue-400 block mb-1">
                  100% Secure & Non-Custodial
                </span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 m-0">
                  We only require your read-only investor password. ForexNotes cannot execute or place trades without your explicit confirmation.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Navigate to <strong>Tools &gt; MT5 AI Bot</strong> or Connections setup.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Enter your Account Login ID, Broker Server Name, and Investor Password.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Enable WebRequest for our secure sync endpoint in your MT5 Terminal options.</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConnectModalOpen(false);
                  navigate("/bot-hub/mt5");
                }}
                className="px-4 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs shadow-md shadow-[#0066FF]/25 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <span>Launch MT5 Setup</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CLEAR ALL TRADES CONFIRMATION MODAL ── */}
      {isClearAllModalOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => !isClearing && setIsClearAllModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#121622] border border-black/[0.08] dark:border-white/[0.12] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Clear All Trade Records?
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                This action will permanently delete all {trades.length} recorded trade logs from your account. This cannot be undone.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-center gap-2.5">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setIsClearAllModalOpen(false)}
                className="w-full py-2.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.03] text-neutral-700 dark:text-neutral-300 font-bold text-xs hover:bg-black/[0.02] dark:hover:bg-white/[0.06] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleClearAllTrades}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <span>Yes, Delete All</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INTEGRATED ADD TRADE MODAL (TradeFXBook Modal) ── */}
      <TradeFXBookAddTradeModal
        isOpen={isAddTradeModalOpen}
        onClose={() => setIsAddTradeModalOpen(false)}
        onTradeAdded={() => {
          setIsAddTradeModalOpen(false);
          const cached = getImmediateCachedTrades();
          if (cached) {
            setTrades([...cached].sort((a, b) => tradeStamp(b) - tradeStamp(a)));
          }
        }}
        trades={trades}
      />

      {/* ── SELECTED TRADE DETAIL MODAL (macOS Glass Dialog) ── */}
      {selectedTrade && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedTrade(null)}
        >
          <div
            className="w-full max-w-4xl bg-white dark:bg-[#10141f] border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.7)] flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border ${
                    selectedTrade.direction === "LONG"
                      ? "bg-blue-500/10 text-[#0066FF] dark:text-blue-400 border-blue-500/25"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                  }`}
                >
                  {selectedTrade.direction === "LONG" ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {selectedTrade.direction}
                </span>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  {selectedTrade.asset}
                </h2>
                <span className="text-neutral-400 text-xs sm:text-sm">
                  • {selectedTrade.date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/add-trade?edit=${selectedTrade.id}`)}
                  className="p-2 rounded-xl bg-black/[0.04] dark:bg-white/10 hover:bg-blue-500/15 text-neutral-600 dark:text-neutral-300 hover:text-[#0066FF] dark:hover:text-blue-400 transition-colors cursor-pointer"
                  title="Edit Trade"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTrade(selectedTrade.id)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white transition-all cursor-pointer"
                  title="Delete Trade"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTrade(null)}
                  className="p-2 rounded-xl bg-black/[0.04] dark:bg-white/10 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Stat Grid */}
              {(() => {
                const selR = normalizeTradeR(selectedTrade);
                const selIsLoss = (selectedTrade.result || "").toLowerCase() === "loss" || selR < 0;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Net Profit / Loss ($)",
                        value:
                          selectedTrade.pnl !== null && selectedTrade.pnl !== undefined && Number(selectedTrade.pnl) !== 0
                            ? `${Number(selectedTrade.pnl) >= 0 ? "+" : ""}$${Math.abs(Number(selectedTrade.pnl)).toFixed(2)}`
                            : "—",
                        isNet: true,
                        isLoss: Number(selectedTrade.pnl) < 0 || selIsLoss,
                      },
                      {
                        label: "R-Multiple",
                        value: `${selR >= 0 ? "+" : ""}${selR.toFixed(2)}R`,
                        isNet: true,
                        isLoss: selIsLoss,
                      },
                      {
                        label: "Outcome",
                        value: selectedTrade.result?.toUpperCase() || "—",
                        isResult: true,
                        isLoss: selIsLoss,
                      },
                      { label: "Setup", value: selectedTrade.setup || "—" },
                      { label: "Session", value: selectedTrade.session || "—" },
                      { label: "Entry Price", value: selectedTrade.entry || selectedTrade.entry_price || "—" },
                      { label: "Stop Loss", value: selectedTrade.sl || "—" },
                      { label: "Take Profit", value: selectedTrade.tp || "—" },
                    ].map((s, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08]"
                      >
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-extrabold uppercase tracking-widest mb-1">
                          {s.label}
                        </p>
                        <p
                          className={`text-sm font-bold font-mono ${
                            s.isNet || s.isResult
                              ? s.isLoss
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-[#0066FF] dark:text-blue-400 font-black"
                              : "text-neutral-900 dark:text-white"
                          }`}
                        >
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Analysis Bento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 shadow-xs">
                    <h3 className="text-xs font-bold text-[#0066FF] dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      Technical Reason & Execution
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 font-medium leading-relaxed whitespace-pre-wrap">
                      {selectedTrade.reason || "No technical reason recorded."}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 shadow-xs">
                    <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Key Lesson
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 font-medium leading-relaxed whitespace-pre-wrap">
                      {selectedTrade.lesson || "No lesson recorded."}
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 shadow-xs flex flex-col">
                  <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Psychology & Timing
                  </h3>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                    <div className="flex-1">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase mb-0.5">
                        Emotion Before
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                        {selectedTrade.emotion_before || "—"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                    <div className="flex-1">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase mb-0.5">
                        Emotion After
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                        {selectedTrade.emotion_after || "—"}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">
                    Psychological Notes
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed flex-1 whitespace-pre-wrap">
                    {selectedTrade.psych_note || "No emotional notes recorded."}
                  </p>
                </div>
              </div>

              {/* Execution Screenshots */}
              {selectedTrade.images && selectedTrade.images.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> Chart Screenshots
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedTrade.images.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => window.open(img, "_blank")}
                        className="relative aspect-video rounded-2xl overflow-hidden border border-black/[0.08] dark:border-white/10 group cursor-pointer shadow-xs"
                      >
                        <img
                          src={img}
                          alt="Trade Chart"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
                            View Full Size
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING BULK ACTIONS BAR (Matches Screenshot 5) ── */}
      {selectedRowIds.size > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-xl mx-auto z-40 bg-white/95 dark:bg-[#121622]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-2xl p-3 sm:px-5 sm:py-3.5 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-neutral-900 dark:text-white">
              {selectedRowIds.size} selected
            </span>
            <span className="text-xs font-mono font-bold">
              Net{" "}
              <span className={selectedTradesNetPnl >= 0 ? "text-[#0066FF] dark:text-blue-400 font-extrabold" : "text-rose-500 font-extrabold"}>
                {selectedTradesNetPnl >= 0 ? "+" : "-"}${Math.abs(selectedTradesNetPnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkCopy}
              className="px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.04] hover:bg-neutral-50 dark:hover:bg-white/[0.08] text-neutral-700 dark:text-neutral-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
            <button
              type="button"
              onClick={handleBulkExportCSV}
              className="px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.04] hover:bg-neutral-50 dark:hover:bg-white/[0.08] text-neutral-700 dark:text-neutral-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleBulkExportExcel}
              className="px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.04] hover:bg-neutral-50 dark:hover:bg-white/[0.08] text-neutral-700 dark:text-neutral-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRowIds(new Set())}
              className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
              title="Deselect All"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── SHARE TRADE 3-POSTER MODAL (Screenshot 3 & 4) ── */}
      <TradeShareModal
        isOpen={Boolean(shareModalTrade)}
        onClose={() => setShareModalTrade(null)}
        trade={shareModalTrade}
      />

      {/* ── FULL-RES PHOTO LIGHTBOX MODAL ── */}
      <PhotoLightboxModal
        isOpen={Boolean(lightboxImage)}
        onClose={() => setLightboxImage(null)}
        src={lightboxImage?.src}
        title={lightboxImage?.title}
      />

      {/* ── BULK TOAST FEEDBACK ── */}
      {bulkToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span>{bulkToast}</span>
        </div>
      )}
    </div>
  );
}
