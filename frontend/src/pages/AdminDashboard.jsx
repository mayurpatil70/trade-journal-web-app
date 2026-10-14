// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect, useMemo } from "react";
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
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Key,
} from "lucide-react";
import api from "../api/axios";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
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

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [usersPage, setUsersPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const ROWS = 15;

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
      await fetchData();
    } catch (error) {
      alert("Failed to delete user");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGrantAccess = async (userId, type, days = 30) => {
    const label = type === "revoke" ? "revoke all access for" : `grant ${days} days of ${type} access to`;
    if (!window.confirm(`Are you sure you want to ${label} this user?`)) return;

    try {
      setActionLoadingId(userId);
      const res = await api.post(`/api/admin/user/${userId}/grant-access`, { type, days });
      if (res.data.success) {
        await fetchData();
      }
    } catch (error) {
      alert(error.response?.data?.error || "Failed to modify user access");
    } finally {
      setActionLoadingId(null);
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
    withdrawals = [],
    affiliates = [],
  } = data || {};

  // Filter accounts
  const filteredUsers = useMemo(() => {
    return accounts.filter((acc) => {
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
  }, [accounts, searchQuery, statusFilter]);

  const totalRegistered = accounts?.length || 0;
  const paidMembersCount = accounts?.filter((a) => a.subscription_status === "paid").length || 0;
  const trialMembersCount = accounts?.filter((a) => a.subscription_status === "trial").length || 0;
  const notSubscribedCount = accounts?.filter((a) => a.subscription_status === "not_subscribed" || a.subscription_status === "expired").length || 0;
  const pendingOrdersCount = recentOrders?.filter((o) => o.status === "pending").length || 0;

  const paginatedOrders = recentOrders.slice((ordersPage - 1) * ROWS, ordersPage * ROWS);
  const totalOrderPages = Math.max(1, Math.ceil(recentOrders.length / ROWS));

  const paginatedUsers = filteredUsers.slice((usersPage - 1) * ROWS, usersPage * ROWS);
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / ROWS));

  const incompleteRegistrations = useMemo(() => {
    return accounts.filter((acc) => acc.subscription_status === "not_subscribed" || acc.subscription_status === "expired");
  }, [accounts]);

  const copyAllIncompleteEmails = () => {
    const emails = incompleteRegistrations.map((u) => u.email).filter(Boolean).join(", ");
    copyToClipboard(emails, `Copied ${incompleteRegistrations.length} emails to clipboard!`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#0a0a0a]">
        <Loader2 className="w-10 h-10 text-[#10b981] animate-spin mb-4" />
        <p className="text-sm text-gray-400 font-medium">Connecting to Admin Command Center...</p>
        <p className="text-xs text-gray-600 mt-1">Retrieving user database and Supabase records</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 px-4 md:px-8 mt-6 md:mt-8 font-sans">
      {/* Top Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/25 flex items-center justify-center shadow-lg shadow-[#10b981]/5">
            <ShieldCheck className="w-6 h-6 text-[#10b981]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Admin Command Center
              <span className="text-[10px] font-bold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Live Supabase
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage user database, active subscriptions, revenue & payouts</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#10b981] ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
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
      <div className="flex gap-4 border-b border-white/10 pb-4 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`text-xs md:text-sm font-bold uppercase tracking-wider transition-colors pb-1 flex items-center gap-2 ${
            activeTab === "overview"
              ? "text-[#10b981] border-b-2 border-[#10b981]"
              : "text-gray-500 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          User Database & Metrics
        </button>
        <button
          onClick={() => setActiveTab("affiliates")}
          className={`text-xs md:text-sm font-bold uppercase tracking-wider transition-colors pb-1 flex items-center gap-2 ${
            activeTab === "affiliates"
              ? "text-[#10b981] border-b-2 border-[#10b981]"
              : "text-gray-500 hover:text-white"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Affiliates & Payouts ({withdrawals.filter((w) => w.status === "pending").length} Pending)
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {/* Total Revenue */}
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Revenue</span>
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-white">${(metrics.totalRevenue || 0).toFixed(2)}</p>
              <p className="text-[10px] text-emerald-400 font-medium mt-1">{metrics.paidOrdersCount || 0} orders</p>
            </div>

            {/* Total Registered */}
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Users</span>
                <div className="w-6 h-6 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-[#10b981]" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-white">{totalRegistered}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">Total in Supabase</p>
            </div>

            {/* Paid Members */}
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Paid Pro</span>
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-emerald-400">{paidMembersCount}</p>
              <p className="text-[10px] text-emerald-500/80 font-medium mt-1">Active Subscribers</p>
            </div>

            {/* Trial Users */}
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Free Trials</span>
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-blue-400">{trialMembersCount}</p>
              <p className="text-[10px] text-blue-400/80 font-medium mt-1">Trial Access</p>
            </div>

            {/* Pending Orders */}
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pending</span>
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-amber-400">{pendingOrdersCount}</p>
              <p className="text-[10px] text-amber-400/80 font-medium mt-1">Need Review</p>
            </div>

            {/* Total Journal Trades */}
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Trades</span>
                <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-white">{metrics.totalTrades || 0}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">Logged Across App</p>
            </div>
          </div>

          {/* Payment Submissions Table */}
          {recentOrders?.length > 0 && (
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl mb-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Payment Submissions & Crypto Receipts
                    <span className="text-[10px] font-normal bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                      {recentOrders.length} Total
                    </span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Verify pending crypto payments or review transaction proofs</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <th className="pb-3 pr-4">User</th>
                      <th className="pb-3 pr-4">Transaction / Chain</th>
                      <th className="pb-3 pr-4">Screenshot</th>
                      <th className="pb-3 pr-4">Amount</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {paginatedOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4 font-mono text-gray-300">
                          <div className="font-semibold text-white truncate max-w-[180px]">
                            {accounts.find((a) => a.id === ord.user_id)?.email || ord.user_id}
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono">ID: {ord.user_id?.substring(0, 10)}...</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-gray-300 text-[10px] max-w-[120px] truncate">
                              {ord.tx_hash || ord.txid || "Manual / Internal"}
                            </span>
                            {(ord.tx_hash || ord.txid) && (
                              <button
                                onClick={() => copyToClipboard(ord.tx_hash || ord.txid)}
                                className="text-gray-500 hover:text-white"
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
                            <span className="text-gray-600 text-[10px]">None attached</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 font-bold text-white">${ord.amount_usdt || 0} USDT</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              ord.status === "paid"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : ord.status === "pending"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
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
                                className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all disabled:opacity-50"
                              >
                                {actionLoadingId === ord.id ? "Verifying..." : "Approve & Verify"}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteOrder(ord.id)}
                              disabled={actionLoadingId === ord.id}
                              className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all flex items-center gap-1 disabled:opacity-50"
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
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4 text-xs text-gray-400">
                  <span>
                    Page <strong className="text-white">{ordersPage}</strong> of {totalOrderPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                      disabled={ordersPage <= 1}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 transition-all"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setOrdersPage((p) => Math.min(totalOrderPages, p + 1))}
                      disabled={ordersPage >= totalOrderPages}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ALL REGISTERED USERS DATABASE */}
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                  All User Database ({filteredUsers.length} of {accounts.length})
                  <span className="text-[10px] font-normal bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Full Supabase Sync
                  </span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Manage application access, grant subscriptions, extend trials, and view user metrics
                </p>
              </div>

              {/* Search & Filter Controls */}
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
                    className="w-56 sm:w-64 bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#10b981] transition-colors"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setUsersPage(1);
                  }}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#10b981]"
                >
                  <option value="all" className="bg-[#121212] text-white">All Statuses ({accounts.length})</option>
                  <option value="paid" className="bg-[#121212] text-emerald-400">Paid Subscribers ({paidMembersCount})</option>
                  <option value="trial" className="bg-[#121212] text-blue-400">Free Trials ({trialMembersCount})</option>
                  <option value="pending" className="bg-[#121212] text-amber-400">Pending Review ({pendingOrdersCount})</option>
                  <option value="expired" className="bg-[#121212] text-rose-400">Expired</option>
                  <option value="not_subscribed" className="bg-[#121212] text-gray-400">Not Subscribed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <th className="pb-3 pr-4">User</th>
                    <th className="pb-3 pr-4">Access Status</th>
                    <th className="pb-3 pr-4">Plan / Expiry</th>
                    <th className="pb-3 pr-4">Trades</th>
                    <th className="pb-3 pr-4">Discord</th>
                    <th className="pb-3 pr-4">Joined</th>
                    <th className="pb-3 text-right">Manage Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
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
                        <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pr-4 font-medium text-white">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white">{acc.email || "No email"}</span>
                              {acc.email && (
                                <button
                                  onClick={() => copyToClipboard(acc.email, "Email copied!")}
                                  className="text-gray-500 hover:text-white"
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
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle className="w-3 h-3" /> Paid Pro
                              </span>
                            ) : isTrial ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <Clock className="w-3 h-3" /> Trial Active
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Pending Review
                              </span>
                            ) : isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Expired
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                Free / Unsubscribed
                              </span>
                            )}
                          </td>

                          <td className="py-3 pr-4">
                            <div className="font-semibold text-gray-300 capitalize">{acc.current_plan || "None"}</div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              {expiryDate ? `Ends: ${new Date(expiryDate).toLocaleDateString()}` : "No expiry"}
                            </div>
                          </td>

                          <td className="py-3 pr-4 font-mono">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                tradeCount > 0 ? "bg-purple-500/10 text-purple-300 border border-purple-500/20" : "text-gray-500"
                              }`}
                            >
                              {tradeCount} trades
                            </span>
                          </td>

                          <td className="py-3 pr-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                acc.discord_verified
                                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                  : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                              }`}
                            >
                              {acc.discord_verified ? "Linked" : "No Discord"}
                            </span>
                          </td>

                          <td className="py-3 pr-4 text-gray-500 font-mono text-[11px]">
                            {acc.created_at ? new Date(acc.created_at).toLocaleDateString() : "N/A"}
                          </td>

                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleGrantAccess(acc.id, "paid", 30)}
                                disabled={actionLoadingId === acc.id}
                                title="Grant 30 days active subscription"
                                className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-all disabled:opacity-50"
                              >
                                +30d Pro
                              </button>
                              <button
                                onClick={() => handleGrantAccess(acc.id, "paid", 365)}
                                disabled={actionLoadingId === acc.id}
                                title="Grant 1 Year active subscription"
                                className="px-2 py-1 rounded-lg bg-[#10b981]/15 hover:bg-[#10b981] hover:text-black border border-[#10b981]/30 text-[#10b981] text-[10px] font-bold transition-all disabled:opacity-50"
                              >
                                +1y Pro
                              </button>
                              <button
                                onClick={() => handleGrantAccess(acc.id, "trial", 7)}
                                disabled={actionLoadingId === acc.id}
                                title="Grant 7-day trial"
                                className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/20 text-blue-400 text-[10px] font-bold transition-all disabled:opacity-50"
                              >
                                +7d Trial
                              </button>
                              {(isPaid || isTrial) && (
                                <button
                                  onClick={() => handleGrantAccess(acc.id, "revoke")}
                                  disabled={actionLoadingId === acc.id}
                                  title="Revoke subscription"
                                  className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-white border border-amber-500/20 text-amber-400 text-[10px] font-bold transition-all disabled:opacity-50"
                                >
                                  Revoke
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUser(acc.id)}
                                disabled={actionLoadingId === acc.id}
                                title="Delete user permanently"
                                className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 text-[10px] font-bold transition-all disabled:opacity-50"
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
                        No users matched the criteria. Try clearing search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Users */}
            {totalUserPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4 text-xs text-gray-400">
                <span>
                  Showing Page <strong className="text-white">{usersPage}</strong> of {totalUserPages} ({filteredUsers.length} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                    disabled={usersPage <= 1}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 transition-all font-medium"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setUsersPage((p) => Math.min(totalUserPages, p + 1))}
                    disabled={usersPage >= totalUserPages}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 transition-all font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Follow-up / Incomplete Registrations Card */}
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Follow-up / Unsubscribed Leads ({incompleteRegistrations.length})
                  <span className="text-[10px] font-normal bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Outreach List
                  </span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Users who registered but have not subscribed yet or whose trial has expired
                </p>
              </div>

              {incompleteRegistrations.length > 0 && (
                <button
                  onClick={copyAllIncompleteEmails}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/20 text-amber-400 text-xs font-bold transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy All {incompleteRegistrations.length} Emails
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Registered Date</th>
                    <th className="pb-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {incompleteRegistrations.slice(0, 10).map((acc) => (
                    <tr key={`inc-${acc.id}`} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-4 font-medium text-white">{acc.email || "Unknown"}</td>
                      <td className="py-3 pr-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-bold">
                          {acc.subscription_status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 font-mono">
                        {acc.created_at ? new Date(acc.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => copyToClipboard(acc.email, "Email copied!")}
                            className="text-[#10b981] hover:underline text-[10px] font-bold uppercase tracking-wider"
                          >
                            Copy Email
                          </button>
                          <button
                            onClick={() => handleGrantAccess(acc.id, "trial", 7)}
                            className="bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white px-2 py-1 rounded text-[10px] font-bold"
                          >
                            Give Trial
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "affiliates" && (
        <div className="space-y-6">
          {/* Withdrawal Requests */}
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              Withdrawal Requests
              <span className="text-[10px] font-normal bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                {withdrawals.length} Total
              </span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Wallet Address</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {withdrawals?.length > 0 ? (
                    withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4 font-medium text-white">{w.users?.email || w.email || "Unknown"}</td>
                        <td className="py-3 pr-4 text-emerald-400 font-bold">${w.amount} USDT</td>
                        <td className="py-3 pr-4 font-mono text-gray-400 text-[10px] break-all max-w-[200px]">
                          {w.wallet_address}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              w.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : w.status === "rejected"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
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
                              className="bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981] hover:text-white border border-[#10b981]/20 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all"
                            >
                              Email
                            </button>
                            {w.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleUpdateWithdrawal(w.id, "completed")}
                                  className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all"
                                >
                                  Mark Paid
                                </button>
                                <button
                                  onClick={() => handleUpdateWithdrawal(w.id, "rejected")}
                                  className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all"
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
                      <td colSpan={5} className="py-10 text-center text-gray-600 text-sm">
                        No withdrawal requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Affiliate Wallets */}
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              All Affiliate Wallets ({affiliates.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Referral Code</th>
                    <th className="pb-3 text-right">Wallet Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {affiliates.length > 0 ? (
                    affiliates.map((a) => (
                      <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4 font-medium text-white">{a.email || "Unknown"}</td>
                        <td className="py-3 pr-4 font-mono text-gray-300">
                          <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono text-[10px]">
                            {a.referral_code || "None"}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-emerald-400 font-mono text-sm">
                          ${Number(a.wallet_balance || 0).toFixed(2)} USDT
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-gray-600 text-sm">
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
    </div>
  );
}
