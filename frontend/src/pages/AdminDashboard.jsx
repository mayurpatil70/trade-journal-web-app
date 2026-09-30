// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  DollarSign,
  Activity,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import api from "../api/axios";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    metrics: {
      totalAccounts: 0,
      activeAccounts: 0,
      passedAccounts: 0,
      failedAccounts: 0,
      totalRevenue: 0,
      paidOrdersCount: 0,
    },
    recentOrders: [],
    accounts: [],
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await api.get("/api/admin/metrics");
        if (response.data.success) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch admin metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-[#2f8df4] animate-spin mb-3" />
        <p className="text-sm text-gray-500 font-medium">
          Loading Admin Command Center...
        </p>
      </div>
    );
  }

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to revoke access and delete this payment?')) return;
    try {
      await api.delete(/api/admin/orders/);
      const response = await api.get('/api/admin/metrics');
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('Failed to delete order');
    }
  };

  const { metrics, recentOrders, accounts } = data;

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight mb-1">
              Admin Command Center
            </h1>
            <p className="text-xs md:text-sm text-gray-400">
              Monitor firm revenue, challenge subscriptions, and user
              evaluations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#121418] border border-white/5 rounded-[2px] p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Total Revenue
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-[2px]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">
            ${metrics.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-500 font-medium mt-2">
            {metrics.paidOrdersCount} successful crypto orders
          </p>
        </div>

        <div className="bg-[#121418] border border-white/5 rounded-[2px] p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Active Challenges
            </span>
            <div className="p-2 bg-[#2f8df4]/10 text-[#2f8df4] rounded-[2px]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">
            {metrics.activeAccounts}
          </p>
          <p className="text-xs text-gray-500 font-medium mt-2">
            Out of {metrics.totalAccounts} total accounts
          </p>
        </div>

        <div className="bg-[#121418] border border-white/5 rounded-[2px] p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Passed Evaluations
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-[2px]">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">
            {metrics.passedAccounts}
          </p>
          <p className="text-xs text-emerald-500 font-medium mt-2">
            Ready for funded payouts
          </p>
        </div>

        <div className="bg-[#121418] border border-white/5 rounded-[2px] p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Violated / Failed
            </span>
            <div className="p-2 bg-red-500/10 text-red-500 rounded-[2px]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">
            {metrics.failedAccounts}
          </p>
          <p className="text-xs text-red-500 font-medium mt-2">
            Max drawdown breached
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#121418] border border-white/5 rounded-[2px] p-6 shadow-sm">
          <h2 className="text-base font-bold text-white mb-4">
            Recent Challenge Orders
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="pb-3">User / TXID</th>
                  <th className="pb-3">Screenshot</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-bold text-white">
                      <div>{ord.user_id || "Unknown"}</div><div className="text-gray-500 font-mono text-[10px]">{ord.txid || ord.chain || "N/A"}</div>
                    </td>
                    <td className="py-3 text-emerald-500 font-bold">
                      {ord.screenshot_url ? <a href={ord.screenshot_url} target="_blank" rel="noreferrer" className="text-blue-400 underline text-xs">View</a> : "N/A"}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-500">
                      <button onClick={() => handleDeleteOrder(ord.id)} className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-1 rounded-[2px] text-[10px] uppercase font-bold transition-colors">Revoke / Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#121418] border border-white/5 rounded-[2px] p-6 shadow-sm">
          <h2 className="text-base font-bold text-white mb-4">
            Active User Accounts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="pb-3">User ID</th>
                  <th className="pb-3">Balance</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">MT5 Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-medium text-white truncate max-w-[120px]">
                      {acc.user_id}
                    </td>
                    <td className="py-3 font-bold text-[#2f8df4]">
                      ${Number(acc.start_balance).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider ${
                          acc.status === "active"
                            ? "bg-blue-500/10 text-[#2f8df4]"
                            : acc.status === "passed"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {acc.status} (Ph {acc.phase})
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-gray-500">
                      {acc.mt5_login || "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}






