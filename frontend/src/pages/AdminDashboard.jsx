// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import {
  ShieldCheck,
  DollarSign,
  Users,
  Loader2,
  Trash2,
  ExternalLink,
  Copy,
  UserCheck,
  UserX,
  Activity,
  Search,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Key,
  ChevronDown,
  Download,
  UserPlus,
  Eye,
  Megaphone,
  TrendingUp,
  X,
  Send,
  Sliders,
  Check,
  XCircle,
  Ban,
} from "lucide-react";
import api from "../api/axios";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "trades" | "affiliates" | "broadcast"
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [data, setData] = useState({
    metrics: { totalRevenue: 0, paidOrdersCount: 0, activeAccounts: 0, paidMembers: 0, trialMembers: 0, totalTrades: 0 },
    recentOrders: [],
    accounts: [],
    trades: [],
    withdrawals: [],
    affiliates: [],
  });

  // Filters & Pagination for Users (Upper Table: Active Members)
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [showAllInUpperTable, setShowAllInUpperTable] = useState(false);
  const filterDropdownRef = useRef(null);
  const [usersPage, setUsersPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [tradesPage, setTradesPage] = useState(1);
  const ROWS = 15;

  // Filters & Pagination for Follow-up Leads Table (10 users per page)
  const [followUpPage, setFollowUpPage] = useState(1);
  const [followUpSearch, setFollowUpSearch] = useState("");
  const [followUpStatusFilter, setFollowUpStatusFilter] = useState("all"); // "all" | "not_subscribed" | "expired" | "no_discord"
  const FOLLOW_UP_ROWS = 10;

  // Modals state
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showCustomDaysModal, setShowCustomDaysModal] = useState(null); // user object

  // Add User Form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserType, setNewUserType] = useState("paid"); // "paid" | "trial"
  const [newUserDays, setNewUserDays] = useState(30);
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);

  // Custom Days Form state
  const [customDaysVal, setCustomDaysVal] = useState(30);
  const [customDaysType, setCustomDaysType] = useState("paid");

  // Broadcast state
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState("info");
  const [broadcastSaving, setBroadcastSaving] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Trades feed search & filter
  const [tradeSearch, setTradeSearch] = useState("");
  const [tradeResultFilter, setTradeResultFilter] = useState("all");

  // Close status filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setFetchError(null);
    try {
      const response = await api.get("/api/admin/metrics");
      if (response.data.success) {
        setData(response.data);
      } else {
        setFetchError(response.data.error || "Failed to load admin metrics");
      }

      // Fetch announcement if available
      try {
        const annRes = await api.get("/api/admin/announcement");
        if (annRes.data.success && annRes.data.announcement) {
          setBroadcastActive(annRes.data.announcement.active || false);
          setBroadcastMessage(annRes.data.announcement.message || "");
          setBroadcastType(annRes.data.announcement.type || "info");
        }
      } catch (e) {
        // Announcement fetch error is non-fatal
      }
    } catch (error) {
      console.error("Failed to fetch admin metrics:", error);
      setFetchError(
        error.response?.data?.error ||
        "Could not connect to the Admin API. Please make sure the backend is running and you are logged in with admin credentials."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyOrder = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const res = await api.put(`/api/admin/subscription/${orderId}`, { status: "paid" });
      if (res.data.success) {
        await fetchData();
      }
    } catch (error) {
      alert(error.response?.data?.error || "Failed to verify subscription");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Revoke this subscription? The user will lose access.")) return;
    try {
      setActionLoadingId(orderId);
      await api.delete(`/api/admin/subscription/${orderId}`);
      await fetchData();
    } catch (error) {
      alert("Failed to revoke subscription");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user's account and trades completely? This cannot be undone.")) return;
    try {
      setActionLoadingId(userId);
      await api.delete(`/api/admin/user/${userId}`);
      if (selectedUserForModal?.id === userId) setSelectedUserForModal(null);
      await fetchData();
    } catch (error) {
      alert("Failed to delete user");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleDiscord = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    const actionText = newStatus ? "manually verify Discord for" : "unlink Discord from";
    if (!window.confirm(`Are you sure you want to ${actionText} this user?`)) return;

    try {
      setActionLoadingId(userId);
      const res = await api.post(`/api/admin/user/${userId}/toggle-discord`, { verified: newStatus });
      if (res.data.success) {
        await fetchData();
        if (selectedUserForModal && selectedUserForModal.id === userId) {
          setSelectedUserForModal((prev) => ({ ...prev, discord_verified: newStatus }));
        }
      }
    } catch (error) {
      alert(error.response?.data?.error || "Failed to update Discord status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGrantAccess = async (userId, type, days = 30) => {
    const targetUser = data.accounts.find((a) => a.id === userId);
    const userEmail = targetUser?.email || userId;

    if (type === "revoke") {
      const confirmed = window.confirm(
        `🛑 CANCEL & REVOKE ACCESS:\n\nAre you sure you want to CANCEL all subscriptions and trial access for ${userEmail}?\n\nTheir access will be immediately terminated and they will be locked out of the dashboard.`
      );
      if (!confirmed) return;
    } else {
      if (targetUser && !targetUser.discord_verified) {
        const proceed = window.confirm(
          `⚠️ DISCORD GATE REMINDER:\n\n${userEmail} has NOT joined or verified Discord yet!\n\nEven after granting ${days} days of ${type} access, they will be STOPPED at the Discord Gate and CANNOT enter /dashboard until they join Discord (or until you manually verify their Discord).\n\nDo you still want to proceed?`
        );
        if (!proceed) return;
      } else {
        const confirmed = window.confirm(
          `Grant ${days} days of ${type.toUpperCase()} access to ${userEmail}?`
        );
        if (!confirmed) return;
      }
    }

    try {
      setActionLoadingId(userId);
      const res = await api.post(`/api/admin/user/${userId}/grant-access`, { type, days });
      if (res.data.success) {
        alert(type === "revoke" ? `Access successfully revoked for ${userEmail}.` : `Granted ${days} days of ${type} access to ${userEmail}.`);
        await fetchData();
        // Update user inside modal if open
        if (selectedUserForModal && selectedUserForModal.id === userId) {
          const updatedUser = data.accounts.find((a) => a.id === userId);
          if (updatedUser) setSelectedUserForModal({ ...updatedUser, subscription_status: type === "revoke" ? "expired" : type });
        }
      }
    } catch (error) {
      alert(error.response?.data?.error || "Failed to modify user access");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail || !newUserEmail.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      setAddUserSubmitting(true);
      const res = await api.post("/api/admin/user/create", {
        email: newUserEmail,
        type: newUserType,
        days: Number(newUserDays),
      });

      if (res.data.success) {
        alert(res.data.message || "User provisioned successfully!");
        setShowAddUserModal(false);
        setNewUserEmail("");
        await fetchData();
      }
    } catch (error) {
      alert(error.response?.data?.error || "Failed to create user");
    } finally {
      setAddUserSubmitting(false);
    }
  };

  const handleCustomDaysSubmit = async () => {
    if (!showCustomDaysModal) return;
    await handleGrantAccess(showCustomDaysModal.id, customDaysType, customDaysVal);
    setShowCustomDaysModal(null);
  };

  const handleSaveBroadcast = async () => {
    try {
      setBroadcastSaving(true);
      setBroadcastSuccess(false);
      const res = await api.post("/api/admin/announcement", {
        active: broadcastActive,
        message: broadcastMessage,
        type: broadcastType,
      });
      if (res.data.success) {
        setBroadcastSuccess(true);
        setTimeout(() => setBroadcastSuccess(false), 3000);
      }
    } catch (error) {
      alert(error.response?.data?.error || error.message || "Failed to save broadcast announcement");
    } finally {
      setBroadcastSaving(false);
    }
  };

  const handleUpdateWithdrawal = async (id, status) => {
    try {
      setActionLoadingId(id);
      await api.put(`/api/admin/withdrawal/${id}`, { status });
      await fetchData();
    } catch (error) {
      alert("Failed to update withdrawal");
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyToClipboard = (text, label = "Copied to clipboard!") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert(label);
  };

  const {
    metrics = {},
    recentOrders = [],
    accounts = [],
    trades = [],
    withdrawals = [],
    affiliates = [],
  } = data || {};

  // Export Users to CSV
  const exportUsersToCSV = () => {
    if (!accounts.length) return alert("No user data available to export");

    const headers = [
      "ID",
      "Email",
      "Status",
      "Plan",
      "Trades_Logged",
      "Subscription_Ends",
      "Trial_Ends",
      "Wallet_Balance_USDT",
      "Referral_Code",
      "Discord_Verified",
      "Registered_Date",
    ];

    const rows = accounts.map((acc) => [
      acc.id || "",
      acc.email || "",
      acc.subscription_status || "not_subscribed",
      acc.current_plan || "none",
      acc.trade_count || 0,
      acc.subscription_ends_at ? new Date(acc.subscription_ends_at).toISOString() : "",
      acc.trial_ends_at ? new Date(acc.trial_ends_at).toISOString() : "",
      acc.wallet_balance || 0,
      acc.referral_code || "",
      acc.discord_verified ? "true" : "false",
      acc.created_at ? new Date(acc.created_at).toISOString() : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join(
        "\n"
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `forexnotes_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lead detector: Not Subscribed OR Not Linked to Discord
  const isFollowUpLead = (acc) => {
    const isNotSubscribed =
      !acc.subscription_status ||
      acc.subscription_status === "not_subscribed" ||
      acc.subscription_status === "expired";
    const isNotLinked = !acc.discord_verified;
    return isNotSubscribed || isNotLinked;
  };

  // Upper Table shows ONLY active subscribed & linked members (excludes not subscribed / not linked leads)
  const upperAccounts = useMemo(() => {
    if (showAllInUpperTable) return accounts;
    return accounts.filter((acc) => !isFollowUpLead(acc));
  }, [accounts, showAllInUpperTable]);

  // Filter upper table accounts
  const filteredUsers = useMemo(() => {
    return upperAccounts.filter((acc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (acc.email && acc.email.toLowerCase().includes(q)) ||
        (acc.id && acc.id.toLowerCase().includes(q)) ||
        (acc.referral_code && acc.referral_code.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      return acc.subscription_status === statusFilter;
    });
  }, [upperAccounts, searchQuery, statusFilter]);

  // Counts for status options (Upper Table)
  const activeUpperCount = upperAccounts.length;
  const upperPaidCount = upperAccounts.filter((a) => a.subscription_status === "paid").length;
  const upperTrialCount = upperAccounts.filter((a) => a.subscription_status === "trial").length;
  const pendingOrdersCount = recentOrders?.filter((o) => o.status === "pending").length || 0;

  // Status Filter Options for Dropdown & Quick Pills (Upper Table)
  const STATUS_OPTIONS = [
    {
      key: "all",
      label: "Active Members",
      count: activeUpperCount,
      textColor: "text-gray-900 dark:text-white",
      badgeClass: "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-200 border-gray-300 dark:border-white/20",
    },
    {
      key: "paid",
      label: "Paid Subscribers",
      count: upperPaidCount,
      textColor: "text-emerald-700 dark:text-emerald-400 font-bold",
      badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    },
    {
      key: "trial",
      label: "Free Trials",
      count: upperTrialCount,
      textColor: "text-blue-700 dark:text-blue-400 font-bold",
      badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    },
    {
      key: "pending",
      label: "Pending Review",
      count: pendingOrdersCount,
      textColor: "text-amber-700 dark:text-amber-400 font-bold",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    },
  ];

  const currentStatusObj = STATUS_OPTIONS.find((opt) => opt.key === statusFilter) || STATUS_OPTIONS[0];

  // Pagination calculations (Upper Table)
  const paginatedOrders = recentOrders.slice((ordersPage - 1) * ROWS, ordersPage * ROWS);
  const totalOrderPages = Math.max(1, Math.ceil(recentOrders.length / ROWS));

  const paginatedUsers = filteredUsers.slice((usersPage - 1) * ROWS, usersPage * ROWS);
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / ROWS));

  // Follow-up / Unsubscribed Leads (Placed in lower table)
  const followUpLeads = useMemo(() => {
    return accounts.filter(isFollowUpLead);
  }, [accounts]);

  const filteredFollowUpLeads = useMemo(() => {
    return followUpLeads.filter((acc) => {
      const q = followUpSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (acc.email && acc.email.toLowerCase().includes(q)) ||
        (acc.id && acc.id.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (followUpStatusFilter === "all") return true;
      if (followUpStatusFilter === "not_subscribed") return acc.subscription_status === "not_subscribed";
      if (followUpStatusFilter === "expired") return acc.subscription_status === "expired";
      if (followUpStatusFilter === "no_discord") return !acc.discord_verified;
      return true;
    });
  }, [followUpLeads, followUpSearch, followUpStatusFilter]);

  const totalFollowUpPages = Math.max(1, Math.ceil(filteredFollowUpLeads.length / FOLLOW_UP_ROWS));
  const paginatedFollowUps = useMemo(() => {
    return filteredFollowUpLeads.slice(
      (followUpPage - 1) * FOLLOW_UP_ROWS,
      followUpPage * FOLLOW_UP_ROWS
    );
  }, [filteredFollowUpLeads, followUpPage]);

  const copyAllIncompleteEmails = () => {
    const emails = filteredFollowUpLeads.map((u) => u.email).filter(Boolean).join(", ");
    copyToClipboard(emails, `Copied ${filteredFollowUpLeads.length} emails to clipboard!`);
  };

  // Platform Trades feed filter & pagination
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const q = tradeSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (t.asset && t.asset.toLowerCase().includes(q)) ||
        (t.user_id && t.user_id.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (tradeResultFilter === "all") return true;
      return (t.result || "").toLowerCase() === tradeResultFilter.toLowerCase();
    });
  }, [trades, tradeSearch, tradeResultFilter]);

  const paginatedTrades = filteredTrades.slice((tradesPage - 1) * ROWS, tradesPage * ROWS);
  const totalTradePages = Math.max(1, Math.ceil(filteredTrades.length / ROWS));

  // Platform trading statistics
  const platformWins = trades.filter((t) => (t.result || "").toLowerCase() === "win").length;
  const platformLosses = trades.filter((t) => (t.result || "").toLowerCase() === "loss").length;
  const platformBE = trades.filter((t) => (t.result || "").toLowerCase() === "breakeven").length;
  const platformWinRate = trades.length > 0 ? ((platformWins / trades.length) * 100).toFixed(1) : 0;

  // Selected user trades in modal
  const selectedUserTrades = useMemo(() => {
    if (!selectedUserForModal) return [];
    return trades.filter((t) => t.user_id === selectedUserForModal.id);
  }, [selectedUserForModal, trades]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white dark:bg-[#0a0a0a]">
        <Loader2 className="w-10 h-10 text-[#10b981] animate-spin mb-4" />
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Connecting to Admin Command Center...</p>
        <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">Retrieving user database and Supabase records</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 px-4 md:px-8 mt-6 md:mt-8 font-sans transition-colors duration-150">
      {/* Top Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/25 flex items-center justify-center shadow-lg shadow-[#10b981]/5">
            <ShieldCheck className="w-6 h-6 text-[#10b981]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              Admin Command Center
              <span className="text-[10px] font-bold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Live Supabase
              </span>
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Manage all user databases, active subscriptions, live trading activities & announcements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#10b981] hover:bg-[#0ea371] text-black font-bold text-xs shadow-md shadow-[#10b981]/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Provision / Add User
          </button>

          <button
            onClick={exportUsersToCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 text-xs font-semibold text-gray-800 dark:text-white transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            Export CSV
          </button>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 text-xs font-semibold text-gray-800 dark:text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#10b981] ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={() => fetchData(true)}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg font-bold uppercase tracking-wider text-[10px]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-white/10 pb-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`text-xs md:text-sm font-bold uppercase tracking-wider transition-colors pb-1 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "overview"
              ? "text-[#10b981] border-b-2 border-[#10b981]"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          User Database & Metrics ({totalRegistered})
        </button>

        <button
          onClick={() => setActiveTab("trades")}
          className={`text-xs md:text-sm font-bold uppercase tracking-wider transition-colors pb-1 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "trades"
              ? "text-[#10b981] border-b-2 border-[#10b981]"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Live Trades & Platform Activity ({trades.length})
        </button>

        <button
          onClick={() => setActiveTab("affiliates")}
          className={`text-xs md:text-sm font-bold uppercase tracking-wider transition-colors pb-1 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "affiliates"
              ? "text-[#10b981] border-b-2 border-[#10b981]"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Affiliates & Payouts ({withdrawals.filter((w) => w.status === "pending").length} Pending)
        </button>

        <button
          onClick={() => setActiveTab("broadcast")}
          className={`text-xs md:text-sm font-bold uppercase tracking-wider transition-colors pb-1 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "broadcast"
              ? "text-[#10b981] border-b-2 border-[#10b981]"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Broadcast Banner {broadcastActive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
        </button>
      </div>

      {/* TAB 1: OVERVIEW & USER DATABASE */}
      {activeTab === "overview" && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {/* Total Revenue */}
            <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Revenue</span>
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">${(metrics.totalRevenue || 0).toFixed(2)}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">{metrics.paidOrdersCount || 0} orders</p>
            </div>

            {/* Total Registered */}
            <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Users</span>
                <div className="w-6 h-6 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-[#10b981]" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{totalRegistered}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-1">Total in Supabase</p>
            </div>

            {/* Paid Members */}
            <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Paid Pro</span>
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">{paidMembersCount}</p>
              <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80 font-medium mt-1">Active Subscribers</p>
            </div>

            {/* Trial Users */}
            <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Free Trials</span>
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400">{trialMembersCount}</p>
              <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-medium mt-1">Trial Access</p>
            </div>

            {/* Pending Orders */}
            <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Pending</span>
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400">{pendingOrdersCount}</p>
              <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium mt-1">Need Review</p>
            </div>

            {/* Total Journal Trades */}
            <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Trades</span>
                <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{trades.length || metrics.totalTrades || 0}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-1">{platformWinRate}% Win Rate</p>
            </div>
          </div>

          {/* Payment Submissions Table */}
          {recentOrders?.length > 0 && (
            <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-xl mb-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Payment Submissions & Crypto Receipts
                    <span className="text-[10px] font-normal bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                      {recentOrders.length} Total
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Verify pending crypto payments or review transaction proofs</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <th className="pb-3 pr-4">User</th>
                      <th className="pb-3 pr-4">Transaction / Chain</th>
                      <th className="pb-3 pr-4">Screenshot</th>
                      <th className="pb-3 pr-4">Amount</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                    {paginatedOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4 font-mono text-gray-800 dark:text-gray-300">
                          <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[180px]">
                            {accounts.find((a) => a.id === ord.user_id)?.email || ord.user_id}
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono">ID: {ord.user_id?.substring(0, 10)}...</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-gray-700 dark:text-gray-300 text-[10px] max-w-[120px] truncate">
                              {ord.tx_hash || ord.txid || "Manual / Internal"}
                            </span>
                            {(ord.tx_hash || ord.txid) && (
                              <button
                                onClick={() => copyToClipboard(ord.tx_hash || ord.txid)}
                                className="text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                                title="Copy TX Hash"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500">{ord.chain || "BEP-20"}</span>
                        </td>
                        <td className="py-3 pr-4">
                          {ord.payment_screenshot ? (
                            <a
                              href={ord.payment_screenshot}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[#10b981] hover:underline text-[11px] font-bold"
                            >
                              View Proof <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-[10px]">None attached</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 font-bold text-gray-900 dark:text-white">${ord.amount_usdt || 0} USDT</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              ord.status === "paid"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : ord.status === "pending"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {ord.status === "pending" && (
                              <button
                                onClick={() => handleVerifyOrder(ord.id)}
                                disabled={actionLoadingId === ord.id}
                                className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {actionLoadingId === ord.id ? "Verifying..." : "Approve & Verify"}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteOrder(ord.id)}
                              disabled={actionLoadingId === ord.id}
                              className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalOrderPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/5 mt-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Page <strong className="text-gray-900 dark:text-white">{ordersPage}</strong> of {totalOrderPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                      disabled={ordersPage <= 1}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-white disabled:opacity-40 transition-all cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setOrdersPage((p) => Math.min(totalOrderPages, p + 1))}
                      disabled={ordersPage >= totalOrderPages}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-white disabled:opacity-40 transition-all cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE SUBSCRIBED MEMBERS DATABASE (UPPER TABLE) */}
          <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-xl mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Active Members Database ({filteredUsers.length} of {upperAccounts.length})
                  <span className="text-[10px] font-semibold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {showAllInUpperTable ? "All Records" : "Subscribed & Linked"}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Showing active members with verified access. Unsubscribed and unlinked leads are managed in the Follow-up table below.
                </p>
              </div>

              {/* View Toggle & Search */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAllInUpperTable((prev) => !prev);
                    setUsersPage(1);
                  }}
                  className={`text-[11px] px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                    showAllInUpperTable
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                      : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-white/10 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  title="Toggle between showing only active subscribed & linked members or all database records"
                >
                  {showAllInUpperTable ? "Showing All Users" : "Leads Filtered Out"}
                </button>

              {/* Search & Custom Theme-Safe Filter Dropdown */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setUsersPage(1);
                    }}
                    placeholder="Search by email, ID or referral..."
                    className="w-56 sm:w-64 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#10b981] transition-colors"
                  />
                </div>

                {/* THEME-AWARE STATUS FILTER DROPDOWN (RESOLVES LIGHT MODE VISIBILITY) */}
                <div className="relative" ref={filterDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                    className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white font-medium focus:outline-none focus:border-[#10b981] cursor-pointer shadow-sm transition-all min-w-[170px]"
                  >
                    <span className="truncate flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        statusFilter === "paid"
                          ? "bg-emerald-500"
                          : statusFilter === "trial"
                          ? "bg-blue-500"
                          : statusFilter === "pending"
                          ? "bg-amber-500"
                          : statusFilter === "expired"
                          ? "bg-rose-500"
                          : statusFilter === "not_subscribed"
                          ? "bg-slate-400"
                          : "bg-gray-400"
                      }`} />
                      {currentStatusObj.label} ({currentStatusObj.count})
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isFilterDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu Overlay */}
                  {isFilterDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#12141a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/5 mb-1">
                        Filter by Account Status
                      </div>
                      {STATUS_OPTIONS.map((opt) => {
                        const isSelected = statusFilter === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              setStatusFilter(opt.key);
                              setUsersPage(1);
                              setIsFilterDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                                : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <span className="w-3.5 h-3.5" />
                              )}
                              <span className={opt.textColor}>{opt.label}</span>
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${opt.badgeClass}`}>
                              {opt.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Filter Status Pills */}
            <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 mr-1 shrink-0">Quick View:</span>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={`pill-${opt.key}`}
                  onClick={() => {
                    setStatusFilter(opt.key);
                    setUsersPage(1);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === opt.key
                      ? "bg-[#10b981] text-black border-[#10b981] shadow-sm"
                      : "bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20"
                  }`}
                >
                  {opt.label} ({opt.count})
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <th className="pb-3 pr-4">User</th>
                    <th className="pb-3 pr-4">Access Status</th>
                    <th className="pb-3 pr-4">Plan / Expiry</th>
                    <th className="pb-3 pr-4">Trades</th>
                    <th className="pb-3 pr-4">Discord</th>
                    <th className="pb-3 pr-4">Joined</th>
                    <th className="pb-3 text-right">Manage Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((acc) => {
                      const isPaid = acc.subscription_status === "paid";
                      const isTrial = acc.subscription_status === "trial";
                      const isPending = acc.subscription_status === "pending";
                      const isExpired = acc.subscription_status === "expired";

                      const tradeCount = acc.trade_count ?? 0;
                      const expiryDate = isPaid
                        ? acc.subscription_ends_at
                        : isTrial
                        ? acc.trial_ends_at
                        : null;

                      return (
                        <tr key={acc.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-900 dark:text-white">{acc.email || "No email"}</span>
                              {acc.email && (
                                <button
                                  onClick={() => copyToClipboard(acc.email, "Email copied!")}
                                  className="text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                                  title="Copy Email"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">ID: {acc.id?.substring(0, 16)}...</span>
                          </td>

                          <td className="py-3 pr-4">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                <CheckCircle className="w-3 h-3" /> Paid Pro (Active)
                              </span>
                            ) : isTrial ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                                <Clock className="w-3 h-3" /> Trial (Active)
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                Pending Review
                              </span>
                            ) : isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                                Expired (No Access)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
                                Not Subscribed (No Access)
                              </span>
                            )}
                          </td>

                          <td className="py-3 pr-4">
                            <div className="font-semibold text-gray-800 dark:text-gray-300 capitalize">{acc.current_plan || "None"}</div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              {expiryDate ? `Ends: ${new Date(expiryDate).toLocaleDateString()}` : "No expiry"}
                            </div>
                          </td>

                          <td className="py-3 pr-4 font-mono">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                tradeCount > 0
                                  ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                                  : "text-gray-400"
                              }`}
                            >
                              {tradeCount} trades
                            </span>
                          </td>

                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  acc.discord_verified
                                    ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                }`}
                              >
                                {acc.discord_verified ? "Linked" : "No Discord"}
                              </span>
                              <button
                                onClick={() => handleToggleDiscord(acc.id, acc.discord_verified)}
                                disabled={actionLoadingId === acc.id}
                                title={acc.discord_verified ? "Click to unlink Discord" : "Click to manually verify Discord"}
                                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                              >
                                {acc.discord_verified ? "Unlink" : "Verify"}
                              </button>
                            </div>
                          </td>

                          <td className="py-3 pr-4 text-gray-500 font-mono text-[11px]">
                            {acc.created_at ? new Date(acc.created_at).toLocaleDateString() : "N/A"}
                          </td>

                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Inspect user trades & full details */}
                              <button
                                onClick={() => setSelectedUserForModal(acc)}
                                title="Inspect user details & trades"
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* PROMINENT CANCEL ACCESS BUTTON: For active Pro or Trial */}
                              {(isPaid || isTrial) && (
                                <button
                                  onClick={() => handleGrantAccess(acc.id, "revoke")}
                                  disabled={actionLoadingId === acc.id}
                                  title="Immediately cancel and revoke active subscription or trial"
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 hover:text-white border border-rose-500/40 text-rose-700 dark:text-rose-400 text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Cancel Access
                                </button>
                              )}

                              <button
                                onClick={() => handleGrantAccess(acc.id, "paid", 30)}
                                disabled={actionLoadingId === acc.id}
                                title="Grant 30 days active subscription"
                                className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                              >
                                +30d Pro
                              </button>

                              <button
                                onClick={() => handleGrantAccess(acc.id, "paid", 365)}
                                disabled={actionLoadingId === acc.id}
                                title="Grant 1 Year active subscription"
                                className="px-2 py-1 rounded-lg bg-[#10b981]/15 hover:bg-[#10b981] hover:text-black border border-[#10b981]/30 text-[#0d9468] dark:text-[#10b981] text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                              >
                                +1y Pro
                              </button>

                              <button
                                onClick={() => handleGrantAccess(acc.id, "trial", 7)}
                                disabled={actionLoadingId === acc.id}
                                title="Grant 7-day trial"
                                className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                              >
                                +7d Trial
                              </button>

                              <button
                                onClick={() => {
                                  setShowCustomDaysModal(acc);
                                  setCustomDaysVal(30);
                                  setCustomDaysType("paid");
                                }}
                                title="Custom days access"
                                className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500 hover:text-white border border-purple-500/20 text-purple-700 dark:text-purple-400 text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Custom
                              </button>

                              <button
                                onClick={() => handleDeleteUser(acc.id)}
                                disabled={actionLoadingId === acc.id}
                                title="Delete user permanently"
                                className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500 text-sm">
                        <div className="max-w-md mx-auto space-y-2">
                          <Users className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            No active subscribed members in upper table
                          </p>
                          <p className="text-xs text-gray-500">
                            All {accounts.length} registered users currently require subscription or Discord verification and are placed in the Follow-up table below.
                          </p>
                          <a
                            href="#followup-table"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500 hover:text-black transition-all mt-2 cursor-pointer"
                          >
                            Go to Follow-up Leads ({followUpLeads.length}) ↓
                          </a>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Users (Upper Table) */}
            {totalUserPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/5 mt-4 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  Showing Page <strong className="text-gray-900 dark:text-white">{usersPage}</strong> of {totalUserPages} ({filteredUsers.length} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                    disabled={usersPage <= 1}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-white disabled:opacity-40 transition-all font-medium cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setUsersPage((p) => Math.min(totalUserPages, p + 1))}
                    disabled={usersPage >= totalUserPages}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-white disabled:opacity-40 transition-all font-medium cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Follow-up / Incomplete Registrations Card (LOWER TABLE - 10 per page pagination) */}
          <div id="followup-table" className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-xl scroll-mt-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Follow-up / Unsubscribed Leads ({filteredFollowUpLeads.length})
                  <span className="text-[10px] font-normal bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Outreach List (10 per page)
                  </span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Users who registered but have not subscribed yet, have expired access, or have not verified Discord
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search in follow-up leads */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={followUpSearch}
                    onChange={(e) => {
                      setFollowUpSearch(e.target.value);
                      setFollowUpPage(1);
                    }}
                    placeholder="Search leads..."
                    className="w-48 sm:w-56 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {filteredFollowUpLeads.length > 0 && (
                  <button
                    onClick={copyAllIncompleteEmails}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy All {filteredFollowUpLeads.length} Emails
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Pills for Follow-up Leads */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest shrink-0">
                Filter Leads:
              </span>
              {[
                { key: "all", label: "All Leads", count: followUpLeads.length },
                {
                  key: "not_subscribed",
                  label: "Not Subscribed",
                  count: followUpLeads.filter((u) => u.subscription_status === "not_subscribed").length,
                },
                {
                  key: "expired",
                  label: "Expired",
                  count: followUpLeads.filter((u) => u.subscription_status === "expired").length,
                },
                {
                  key: "no_discord",
                  label: "No Discord",
                  count: followUpLeads.filter((u) => !u.discord_verified).length,
                },
              ].map((opt) => (
                <button
                  key={`fu-opt-${opt.key}`}
                  onClick={() => {
                    setFollowUpStatusFilter(opt.key);
                    setFollowUpPage(1);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    followUpStatusFilter === opt.key
                      ? "bg-amber-500 text-black border-amber-500 shadow-sm"
                      : "bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-amber-400"
                  }`}
                >
                  {opt.label} ({opt.count})
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <th className="pb-3 pr-4">Email / User</th>
                    <th className="pb-3 pr-4">Access Status</th>
                    <th className="pb-3 pr-4">Discord</th>
                    <th className="pb-3 pr-4">Registered Date</th>
                    <th className="pb-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                  {paginatedFollowUps.length > 0 ? (
                    paginatedFollowUps.map((acc) => {
                      const isExpired = acc.subscription_status === "expired";
                      const isNotSub = acc.subscription_status === "not_subscribed";

                      return (
                        <tr key={`inc-${acc.id}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-900 dark:text-white">{acc.email || "Unknown"}</span>
                              {acc.email && (
                                <button
                                  onClick={() => copyToClipboard(acc.email, "Email copied!")}
                                  className="text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                                  title="Copy Email"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">ID: {acc.id?.substring(0, 16)}...</span>
                          </td>

                          <td className="py-3 pr-4">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${
                                isExpired
                                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                                  : isNotSub
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                  : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"
                              }`}
                            >
                              {acc.subscription_status || "not_subscribed"}
                            </span>
                          </td>

                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  acc.discord_verified
                                    ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                }`}
                              >
                                {acc.discord_verified ? "Linked" : "No Discord"}
                              </span>
                              <button
                                onClick={() => handleToggleDiscord(acc.id, acc.discord_verified)}
                                disabled={actionLoadingId === acc.id}
                                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                                title={acc.discord_verified ? "Unlink Discord" : "Manually verify Discord"}
                              >
                                {acc.discord_verified ? "Unlink" : "Verify"}
                              </button>
                            </div>
                          </td>

                          <td className="py-3 pr-4 text-gray-500 font-mono text-[11px]">
                            {acc.created_at ? new Date(acc.created_at).toLocaleDateString() : "N/A"}
                          </td>

                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                onClick={() => setSelectedUserForModal(acc)}
                                title="Inspect user details & trades"
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => copyToClipboard(acc.email, "Email copied!")}
                                className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Copy Email
                              </button>

                              <button
                                onClick={() => handleGrantAccess(acc.id, "trial", 7)}
                                disabled={actionLoadingId === acc.id}
                                className="bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all disabled:opacity-50"
                              >
                                Give 7d Trial
                              </button>

                              <button
                                onClick={() => handleGrantAccess(acc.id, "paid", 30)}
                                disabled={actionLoadingId === acc.id}
                                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all disabled:opacity-50"
                              >
                                +30d Pro
                              </button>

                              <button
                                onClick={() => handleDeleteUser(acc.id)}
                                disabled={actionLoadingId === acc.id}
                                title="Delete user"
                                className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500 text-xs">
                        No leads found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for Follow-up Table (10 users at a time) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-gray-200 dark:border-white/5 mt-4 text-xs text-gray-500 dark:text-gray-400 gap-3">
              <span>
                Showing{" "}
                <strong className="text-gray-900 dark:text-white">
                  {filteredFollowUpLeads.length === 0 ? 0 : (followUpPage - 1) * FOLLOW_UP_ROWS + 1}
                </strong>{" "}
                to{" "}
                <strong className="text-gray-900 dark:text-white">
                  {Math.min(followUpPage * FOLLOW_UP_ROWS, filteredFollowUpLeads.length)}
                </strong>{" "}
                of <strong className="text-gray-900 dark:text-white">{filteredFollowUpLeads.length}</strong> leads (Page {followUpPage} of {totalFollowUpPages})
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFollowUpPage((p) => Math.max(1, p - 1))}
                  disabled={followUpPage <= 1}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                >
                  Previous
                </button>

                {/* Page number indicators */}
                {Array.from({ length: totalFollowUpPages }, (_, i) => i + 1)
                  .filter((page) => page === 1 || page === totalFollowUpPages || Math.abs(page - followUpPage) <= 1)
                  .map((page, index, array) => {
                    const prev = array[index - 1];
                    const showEllipsis = prev && page - prev > 1;

                    return (
                      <span key={`fup-pg-${page}`} className="flex items-center gap-1">
                        {showEllipsis && <span className="px-1 text-gray-500">...</span>}
                        <button
                          onClick={() => setFollowUpPage(page)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            followUpPage === page
                              ? "bg-amber-500 text-black shadow-sm"
                              : "bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {page}
                        </button>
                      </span>
                    );
                  })}

                <button
                  onClick={() => setFollowUpPage((p) => Math.min(totalFollowUpPages, p + 1))}
                  disabled={followUpPage >= totalFollowUpPages}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
          </div>
        </>
      )}

      {/* TAB 2: LIVE TRADES & PLATFORM ACTIVITY */}
      {activeTab === "trades" && (
        <div className="space-y-6">
          {/* Trades Performance Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Platform Trades</span>
              <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mt-1">{trades.length}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Logged across all user journals</p>
            </div>
            <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Platform Win Rate</span>
              <p className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{platformWinRate}%</p>
              <p className="text-[10px] text-emerald-600/80 mt-0.5">{platformWins} Wins recorded</p>
            </div>
            <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Loss Trades</span>
              <p className="text-xl md:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{platformLosses}</p>
              <p className="text-[10px] text-rose-600/80 mt-0.5">{platformBE} Breakeven trades</p>
            </div>
            <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Active Traders</span>
              <p className="text-xl md:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {new Set(trades.map((t) => t.user_id).filter(Boolean)).size}
              </p>
              <p className="text-[10px] text-purple-600/80 mt-0.5">Traders with recorded trades</p>
            </div>
          </div>

          {/* Trades Feed Table */}
          <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Live Trades Stream ({filteredTrades.length} of {trades.length})
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Real-time trades recorded by traders across forex, crypto & commodities
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tradeSearch}
                    onChange={(e) => {
                      setTradeSearch(e.target.value);
                      setTradesPage(1);
                    }}
                    placeholder="Search asset, pair or user ID..."
                    className="w-48 sm:w-56 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981]"
                  />
                </div>

                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 text-xs">
                  {["all", "win", "loss", "breakeven"].map((res) => (
                    <button
                      key={res}
                      onClick={() => {
                        setTradeResultFilter(res);
                        setTradesPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[10px] transition-colors cursor-pointer ${
                        tradeResultFilter === res
                          ? "bg-[#10b981] text-black"
                          : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <th className="pb-3 pr-4">Trader Email / User</th>
                    <th className="pb-3 pr-4">Asset / Pair</th>
                    <th className="pb-3 pr-4">Direction</th>
                    <th className="pb-3 pr-4">Result</th>
                    <th className="pb-3 pr-4">R-Multiple</th>
                    <th className="pb-3 pr-4">P&L ($)</th>
                    <th className="pb-3 text-right">Trade Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                  {paginatedTrades.length > 0 ? (
                    paginatedTrades.map((t) => {
                      const trader = accounts.find((a) => a.id === t.user_id);
                      const isWin = (t.result || "").toLowerCase() === "win";
                      const isLoss = (t.result || "").toLowerCase() === "loss";
                      const isBE = (t.result || "").toLowerCase() === "breakeven";

                      return (
                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                            <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[170px]">
                              {trader?.email || t.user_id || "Anonymous"}
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">ID: {t.user_id?.substring(0, 10)}...</span>
                          </td>

                          <td className="py-3 pr-4 font-mono font-bold text-gray-900 dark:text-white">
                            <span className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-0.5 rounded text-[11px]">
                              {t.asset || "N/A"}
                            </span>
                          </td>

                          <td className="py-3 pr-4">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                (t.direction || "").toUpperCase() === "LONG"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : (t.direction || "").toUpperCase() === "SHORT"
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {t.direction || "N/A"}
                            </span>
                          </td>

                          <td className="py-3 pr-4">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                isWin
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : isLoss
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                  : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"
                              }`}
                            >
                              {t.result || "PENDING"}
                            </span>
                          </td>

                          <td className="py-3 pr-4 font-mono font-bold">
                            {t.r_multiple != null ? (
                              <span className={Number(t.r_multiple) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                                {Number(t.r_multiple) > 0 ? `+${t.r_multiple}R` : `${t.r_multiple}R`}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>

                          <td className="py-3 pr-4 font-mono font-bold">
                            {t.pnl != null ? (
                              <span className={Number(t.pnl) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                                ${Number(t.pnl).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>

                          <td className="py-3 text-right text-gray-500 font-mono text-[11px]">
                            {t.date || (t.created_at ? new Date(t.created_at).toLocaleDateString() : "N/A")}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-500 text-sm">
                        No trades matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalTradePages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/5 mt-4 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  Page <strong className="text-gray-900 dark:text-white">{tradesPage}</strong> of {totalTradePages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTradesPage((p) => Math.max(1, p - 1))}
                    disabled={tradesPage <= 1}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-white disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setTradesPage((p) => Math.min(totalTradePages, p + 1))}
                    disabled={tradesPage >= totalTradePages}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-white disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AFFILIATES & PAYOUTS */}
      {activeTab === "affiliates" && (
        <div className="space-y-6">
          {/* Withdrawal Requests */}
          <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-xl">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              Withdrawal Requests
              <span className="text-[10px] font-normal bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                {withdrawals.length} Total
              </span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Wallet Address</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                  {withdrawals?.length > 0 ? (
                    withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{w.users?.email || w.email || "Unknown"}</td>
                        <td className="py-3 pr-4 text-emerald-600 dark:text-emerald-400 font-bold">${w.amount} USDT</td>
                        <td className="py-3 pr-4 font-mono text-gray-500 dark:text-gray-400 text-[10px] break-all max-w-[200px]">
                          {w.wallet_address}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              w.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : w.status === "rejected"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                window.open(
                                  `mailto:${w.users?.email || w.email}?subject=ForexNotes Affiliate Payout&body=Your withdrawal of $${w.amount} has been processed!`,
                                  "_blank"
                                )
                              }
                              className="bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981] hover:text-white border border-[#10b981]/20 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all cursor-pointer"
                            >
                              Email
                            </button>
                            {w.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleUpdateWithdrawal(w.id, "completed")}
                                  className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all cursor-pointer"
                                >
                                  Mark Paid
                                </button>
                                <button
                                  onClick={() => handleUpdateWithdrawal(w.id, "rejected")}
                                  className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-500 text-sm">
                        No withdrawal requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Affiliate Wallets */}
          <div className="bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-xl">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              All Affiliate Wallets ({affiliates.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Referral Code</th>
                    <th className="pb-3 text-right">Wallet Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                  {affiliates.length > 0 ? (
                    affiliates.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{a.email || "Unknown"}</td>
                        <td className="py-3 pr-4 font-mono text-gray-700 dark:text-gray-300">
                          <span className="bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 px-2 py-0.5 rounded font-mono text-[10px]">
                            {a.referral_code || "None"}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                          ${Number(a.wallet_balance || 0).toFixed(2)} USDT
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-gray-500 text-sm">
                        No affiliate balances yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BROADCAST BANNER SYSTEM */}
      {activeTab === "broadcast" && (
        <div className="max-w-2xl bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Global System Broadcast Banner</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Display critical notices, maintenance countdowns, or product updates across the whole application
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Toggle Active */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-white block">Banner Visibility</span>
                <span className="text-[11px] text-gray-500">When enabled, all logged-in and visiting users will see this banner.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={broadcastActive}
                  onChange={(e) => setBroadcastActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10b981]"></div>
              </label>
            </div>

            {/* Banner Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Banner Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "info", label: "Information", color: "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                  { id: "warning", label: "Warning / Maintenance", color: "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                  { id: "success", label: "Announcement / Promo", color: "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setBroadcastType(type.id)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      broadcastType === type.id
                        ? `${type.color} ring-2 ring-emerald-500/30`
                        : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Announcement Text</label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="e.g. 🚨 Scheduled system maintenance at 10 PM UTC. Live trading sessions will remain unaffected."
                rows={3}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl p-3 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981]"
              />
            </div>

            {/* Live Preview (Mobile Notch Notification) */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Live Preview (Top Mobile Notch)</span>
              <div className="py-4 px-4 bg-gray-950/60 dark:bg-black/60 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center">
                <div className="relative overflow-hidden flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white shadow-[0_8px_30px_rgba(239,68,68,0.55)] border border-red-300/40 ring-1 ring-white/25 before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/25 before:to-transparent before:pointer-events-none">
                  <img src="/logo3d.png" alt="ForexNotes" className="w-5 h-5 object-contain shrink-0 drop-shadow-md" />
                  <span className="text-white font-bold text-xs sm:text-[13px] tracking-wide drop-shadow-sm">
                    {broadcastMessage || "Scheduled system maintenance at 11 PM today"}
                  </span>
                  <div className="ml-1.5 p-0.5 rounded-full text-white/80 hover:text-white cursor-pointer shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSaveBroadcast}
                disabled={broadcastSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#0ea371] text-black font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {broadcastSaving ? "Saving Announcement..." : "Save & Update Broadcast"}
              </button>

              {broadcastSuccess && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Broadcast published successfully!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PROVISION / CREATE NEW USER ── */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#12141a] border border-gray-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 text-[#10b981] flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Provision / Add New User</h3>
                <p className="text-xs text-gray-500">Directly grant access to a user in Supabase</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">User Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="trader@example.com"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Access Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUserType("paid")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      newUserType === "paid"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40"
                        : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10"
                    }`}
                  >
                    Paid Pro Access
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserType("trial")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      newUserType === "trial"
                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40"
                        : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10"
                    }`}
                  >
                    Free Trial Access
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Access Duration (Days)</label>
                <div className="flex gap-2 mb-2">
                  {[7, 14, 30, 90, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setNewUserDays(d)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                        newUserDays === d
                          ? "bg-emerald-500 text-black border-emerald-500"
                          : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10"
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={newUserDays}
                  onChange={(e) => setNewUserDays(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#10b981] hover:bg-[#0ea371] text-black font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {addUserSubmitting ? "Provisioning..." : "Provision User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CUSTOM ACCESS DURATION GRANT ── */}
      {showCustomDaysModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#12141a] border border-gray-200 dark:border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setShowCustomDaysModal(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Custom Access Grant</h3>
            <p className="text-xs text-gray-500 mb-4 truncate">{showCustomDaysModal.email}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Select Access Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomDaysType("paid")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      customDaysType === "paid"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40"
                        : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10"
                    }`}
                  >
                    Paid Pro
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomDaysType("trial")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      customDaysType === "trial"
                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40"
                        : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10"
                    }`}
                  >
                    Free Trial
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Number of Days</label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={customDaysVal}
                  onChange={(e) => setCustomDaysVal(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomDaysModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCustomDaysSubmit}
                  className="px-5 py-2 rounded-xl bg-[#10b981] hover:bg-[#0ea371] text-black font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Grant {customDaysVal} Days
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: USER DETAILS & LIVE TRADES INSPECTOR ── */}
      {selectedUserForModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#12141a] border border-gray-200 dark:border-white/10 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setSelectedUserForModal(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* User Profile Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
                {selectedUserForModal.email ? selectedUserForModal.email.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {selectedUserForModal.email}
                  </h3>
                  <button
                    onClick={() => copyToClipboard(selectedUserForModal.email)}
                    className="text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                  ID: {selectedUserForModal.id}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedUserForModal.subscription_status === "paid"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                        : selectedUserForModal.subscription_status === "trial"
                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                        : "bg-gray-500/15 text-gray-700 dark:text-gray-400 border border-gray-500/30"
                    }`}
                  >
                    {selectedUserForModal.subscription_status === "paid"
                      ? "PAID ACTIVE"
                      : selectedUserForModal.subscription_status === "trial"
                      ? "TRIAL ACTIVE"
                      : "NOT SUBSCRIBED (NO ACCESS)"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                      selectedUserForModal.discord_verified
                        ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {selectedUserForModal.discord_verified ? "Discord: Linked & Verified" : "Discord: NOT LINKED"}
                  </span>
                  <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/5">
                    Plan: {selectedUserForModal.current_plan || "None"}
                  </span>
                  <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/5">
                    Wallet: ${Number(selectedUserForModal.wallet_balance || 0).toFixed(2)} USDT
                  </span>
                  {selectedUserForModal.referral_code && (
                    <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/5">
                      Referral: {selectedUserForModal.referral_code}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 mb-6 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">Modify Access:</span>
              <button
                onClick={() => handleGrantAccess(selectedUserForModal.id, "paid", 30)}
                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
              >
                +30d Pro
              </button>
              <button
                onClick={() => handleGrantAccess(selectedUserForModal.id, "paid", 365)}
                className="px-2.5 py-1 bg-[#10b981]/15 hover:bg-[#10b981] hover:text-black text-[#0d9468] dark:text-[#10b981] text-xs font-bold rounded-lg border border-[#10b981]/30 transition-all cursor-pointer"
              >
                +1y Pro
              </button>
              <button
                onClick={() => handleGrantAccess(selectedUserForModal.id, "trial", 7)}
                className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-700 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-500/20 transition-all cursor-pointer"
              >
                +7d Trial
              </button>
              <button
                onClick={() => handleGrantAccess(selectedUserForModal.id, "revoke")}
                className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
                title="Immediately revoke all access and lock user out"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel / Revoke Access
              </button>
              <button
                onClick={() => handleToggleDiscord(selectedUserForModal.id, selectedUserForModal.discord_verified)}
                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 transition-all cursor-pointer"
              >
                {selectedUserForModal.discord_verified ? "Unlink Discord" : "Verify Discord"}
              </button>
              <button
                onClick={() => handleDeleteUser(selectedUserForModal.id)}
                className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-all cursor-pointer"
              >
                Delete Account
              </button>
            </div>

            {/* User Trades Log */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-between">
                <span>Trades Logged by this User ({selectedUserTrades.length})</span>
                {selectedUserTrades.length > 0 && (
                  <span className="text-[#10b981] font-mono text-xs">
                    {(
                      (selectedUserTrades.filter((t) => (t.result || "").toLowerCase() === "win").length /
                        selectedUserTrades.length) *
                      100
                    ).toFixed(1)}
                    % Win Rate
                  </span>
                )}
              </h4>

              {selectedUserTrades.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 dark:border-white/10 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <th className="p-3">Asset</th>
                        <th className="p-3">Direction</th>
                        <th className="p-3">Result</th>
                        <th className="p-3">R-Multiple</th>
                        <th className="p-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {selectedUserTrades.slice(0, 10).map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                          <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">{t.asset || "N/A"}</td>
                          <td className="p-3 font-semibold uppercase">{t.direction || "-"}</td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                (t.result || "").toLowerCase() === "win"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : (t.result || "").toLowerCase() === "loss"
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {t.result || "-"}
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            {t.r_multiple != null ? (
                              <span className={Number(t.r_multiple) >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                {t.r_multiple}R
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-3 text-right font-mono text-gray-500">
                            {t.date || (t.created_at ? new Date(t.created_at).toLocaleDateString() : "-")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-200 dark:border-white/10 text-gray-500 text-xs">
                  This user has not logged any trades in their journal yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
