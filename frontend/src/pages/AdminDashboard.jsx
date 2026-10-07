// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  DollarSign,
  Users,
  Loader2,
  Trash2,
  ExternalLink,
  Copy,
} from "lucide-react";
import api from "../api/axios";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    metrics: { totalRevenue: 0, paidOrdersCount: 0, activeAccounts: 0 },
    recentOrders: [],
    accounts: [],
  });

  const fetchData = async () => {
    try {
      const response = await api.get("/api/admin/metrics");
      if (response.data.success) setData(response.data);
    } catch (error) {
      console.error("Failed to fetch admin metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleVerifyOrder = async (orderId) => {
    try {
      await api.put(`/api/admin/subscription/${orderId}`, { status: "paid" });
      await fetchData();
    } catch (error) {
      alert("Failed to verify subscription");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Revoke this subscription? The user will lose access.")) return;
    try {
      await api.delete(`/api/admin/subscription/${orderId}`);
      await fetchData();
    } catch (error) {
      alert("Failed to revoke subscription");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user's account completely? This cannot be undone.")) return;
    try {
      await api.delete(`/api/admin/user/${userId}`);
      await fetchData();
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-[#10b981] animate-spin mb-3" />
        <p className="text-sm text-gray-500 font-medium">Loading Admin Center...</p>
      </div>
    );
  }

  const { metrics = {}, recentOrders = [], accounts = [], withdrawals = [], affiliates = [] } = data || {};

  const handleUpdateWithdrawal = async (id, status) => {
    try {
      await api.put(`/api/admin/withdrawal/${id}`, { status });
      fetchData();
    } catch (error) {
      alert("Failed to update withdrawal");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-16 px-4 md:px-8 mt-6 md:mt-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center backdrop-blur-sm">
          <ShieldCheck className="w-6 h-6 text-[#10b981]" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Admin Command Center</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage revenue, payments, and user access</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/10 pb-4 mb-6">
        <button onClick={() => setActiveTab("overview")} className={`text-sm font-bold uppercase tracking-wider ${activeTab === "overview" ? "text-emerald-400" : "text-gray-500 hover:text-white"}`}>Overview</button>
        <button onClick={() => setActiveTab("affiliates")} className={`text-sm font-bold uppercase tracking-wider ${activeTab === "affiliates" ? "text-[#10b981]" : "text-gray-500 hover:text-white"}`}>Affiliates & Payouts</button>
      </div>

      {activeTab === "overview" && (
        <>
        {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Revenue */}
        <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-4xl font-black text-white">${(metrics.totalRevenue || 0).toFixed(2)}</p>
          <p className="text-xs text-emerald-400 font-medium mt-2">{metrics.paidOrdersCount || 0} confirmed USDT payments</p>
        </div>

        {/* Active Users */}
        <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active SAAS Users</span>
            <div className="w-8 h-8 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#10b981]" />
            </div>
          </div>
          <p className="text-4xl font-black text-white">{accounts?.length || 0}</p>
          <p className="text-xs text-[#10b981] font-medium mt-2">Registered users total</p>
        </div>

        {/* Pending Payments */}
        <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-4xl font-black text-white">
            {recentOrders?.filter(o => o.status === "pending").length || 0}
          </p>
          <p className="text-xs text-amber-400 font-medium mt-2">Awaiting payment verification</p>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl mb-6">
        <h2 className="text-base font-bold text-white mb-5">Recent Payment Submissions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="pb-3 pr-4">User ID</th>
                <th className="pb-3 pr-4">TXID</th>
                <th className="pb-3 pr-4">Screenshot</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {recentOrders?.length > 0 ? recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4 font-mono text-gray-400 max-w-[120px] truncate">
                    {ord.user_id?.substring(0, 16)}...
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-gray-300 text-[10px] max-w-[100px] truncate">{ord.tx_hash || ord.txid || "N/A"}</span>
                      {(ord.tx_hash || ord.txid) && (
                        <button onClick={() => copyToClipboard(ord.tx_hash || ord.txid)} className="text-gray-500 hover:text-white transition-colors">
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    {ord.payment_screenshot ? (
                      <a href={ord.payment_screenshot} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-[#10b981] hover:underline text-[10px] font-bold">
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : <span className="text-gray-600 text-[10px]">No screenshot</span>}
                  </td>
                  <td className="py-3 pr-4 font-bold text-white">${ord.amount_usdt || 0} USDT</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ord.status === "paid"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {ord.status === "pending" && (
                        <button onClick={() => handleVerifyOrder(ord.id)}
                          className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all">
                          Verify
                        </button>
                      )}
                      <button onClick={() => handleDeleteOrder(ord.id)}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-600 text-sm">No payment submissions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-white mb-5">All Registered Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Discord</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {accounts?.length > 0 ? accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4 font-medium text-white">{acc.email || "Unknown"}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${acc.discord_verified ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-gray-500/10 text-gray-500 border border-gray-500/20"}`}>
                      {acc.discord_verified ? "Verified" : "Not linked"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-500 font-mono">
                    {acc.created_at ? new Date(acc.created_at).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => handleDeleteUser(acc.id)}
                      className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all flex items-center gap-1 ml-auto">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-600 text-sm">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Incomplete Registrations Table */}
      <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl mt-6">
        <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
          Incomplete Registrations 
          <span className="text-[10px] font-normal bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Follow-up List</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {accounts?.filter(acc => !recentOrders?.some(ord => ord.user_id === acc.id && ord.status === 'paid'))?.length > 0 ? (
                accounts.filter(acc => !recentOrders?.some(ord => ord.user_id === acc.id && ord.status === 'paid')).map((acc) => (
                  <tr key={`inc-${acc.id}`} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4 font-medium text-white">{acc.email || "Unknown"}</td>
                    <td className="py-3 pr-4 text-gray-500 font-mono">
                      {acc.created_at ? new Date(acc.created_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => {
                          if (acc.email) {
                              navigator.clipboard.writeText(acc.email);
                              alert("Email copied to clipboard!");
                          }
                        }}
                        className="text-[#10b981] hover:underline text-[10px] font-bold uppercase tracking-wider ml-auto">
                        Copy Email
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-gray-600 text-sm">No incomplete registrations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>)}
      
      {activeTab === "affiliates" && (
        <div className="space-y-6">
          <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-5">Withdrawal Requests</h2>
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
                  {withdrawals?.length > 0 ? withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-4 font-medium text-white">{w.users?.email || "Unknown"}</td>
                      <td className="py-3 pr-4 text-emerald-400 font-bold">${w.amount}</td>
                      <td className="py-3 pr-4 font-mono text-gray-400 text-[10px] break-all">{w.wallet_address}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${w.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : w.status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => window.open(`mailto:${w.users?.email}?subject=ForexNotes Affiliate Payout&body=Your withdrawal of $${w.amount} has been processed!`, "_blank")}
                            className="bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981] hover:text-white border border-[#10b981]/20 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all">
                            Email
                          </button>
                          {w.status === "pending" && (
                            <>
                              <button onClick={() => handleUpdateWithdrawal(w.id, "completed")}
                                className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all">
                                Paid
                              </button>
                              <button onClick={() => handleUpdateWithdrawal(w.id, "rejected")}
                                className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all">
                                Unpaid
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-600 text-sm">No withdrawal requests yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl mt-6">
            <h2 className="text-base font-bold text-white mb-5">All Affiliate Wallets</h2>
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
                  {affiliates?.length > 0 ? affiliates.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-4 font-medium text-white">{a.email || "Unknown"}</td>
                      <td className="py-3 pr-4 font-mono text-gray-400">{a.referral_code}</td>
                      <td className="py-3 text-right font-bold text-emerald-400">${a.wallet_balance} USDT</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-gray-600 text-sm">No affiliate balances.</td>
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
