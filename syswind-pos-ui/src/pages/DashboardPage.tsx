import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  Truck, 
  TrendingUp, 
  ArrowUpRight, 
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { DashboardStats, Order } from '../types';
import { api, formatMMK, hasPermission } from '../api/client';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onViewInvoice: (order: Order) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onViewInvoice }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setStats(res.stats);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading Syswind Operations Dashboard...</p>
        </div>
      </div>
    );
  }

  const pCounts = stats?.pipeline_counts || {
    PENDING: 0,
    CONFIRMED: 0,
    PACKED: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Myanmar Online Shop Operations
              </span>
              <span className="text-[11px] text-slate-400 font-mono">PostgreSQL Connected</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Syswind Enterprise Command Center
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              ပစ္စည်းစာရင်း၊ ဖောက်သည် CRM၊ အော်ဒါစီမံခန့်ခွဲမှု၊ ဒယ်လီဗရီ ခြေရာခံခြင်းနှင့် ငွေစာရင်း လယ်ဂျာတို့ကို တစ်နေရာတည်းတွင် ချိန်ညှိစီမံခြင်း။
            </p>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0 self-start md:self-auto">
            <button
              onClick={() => onNavigate('pos')}
              className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>POS / အော်ဒါသစ်ဖွင့်ရန်</span>
            </button>
            <button
              onClick={loadStats}
              title="Refresh Data"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - Uniform Heights & Alignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-brand-500/40 transition-all flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Sales (ယနေ့အရောင်း)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {formatMMK(stats?.today_revenue)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1">
              <span className="font-semibold text-emerald-400">{stats?.today_orders} orders today</span>
            </p>
          </div>
        </div>

        {/* Total Paid Revenue */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-primary-500/40 transition-all flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales (စုစုပေါင်းအရောင်း)</span>
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {formatMMK(stats?.total_revenue)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Paid orders across all channels</p>
          </div>
        </div>

        {/* Pending Delivery & COD to Collect */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-all flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Dispatches (ပို့ဆောင်ဆဲ)</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-extrabold text-white font-mono tracking-tight">{stats?.pending_deliveries}</p>
              <span className="text-xs text-indigo-300 font-medium">packages</span>
            </div>
            <p className="text-xs text-amber-400 mt-0.5 font-mono font-semibold">
              COD: {formatMMK(stats?.pending_cod_amount)}
            </p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between min-h-[130px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock (လက်ကျန်နည်း)</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-extrabold text-amber-400 font-mono tracking-tight">{stats?.low_stock_count}</p>
              <span className="text-xs text-slate-400">items need restock</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center text-amber-400 group-hover:underline">
              <span>View inventory alerts</span>
              <ArrowUpRight className="w-3 h-3 ml-1" />
            </p>
          </div>
        </div>
      </div>

      {/* Order Status Pipeline Flow - Uniform Equal Height Cards */}
      <div className="glass-panel p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Order Workflow Pipeline (အော်ဒါ အဆင့်ဆင့် စီမံခန့်ခွဲမှု)
            </h3>
            <p className="text-xs text-slate-400">Live order lifecycle breakdown</p>
          </div>
          <button 
            onClick={() => onNavigate('orders')}
            className="text-xs text-brand-400 hover:underline flex items-center space-x-1"
          >
            <span>Open Kanban</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Pending */}
          <div className="bg-slate-900/80 border border-amber-500/30 p-3.5 rounded-xl text-center flex flex-col justify-between min-h-[96px]">
            <span className="text-[10px] font-bold uppercase text-amber-400">Pending</span>
            <p className="text-2xl font-black text-white font-mono my-1">{pCounts.PENDING}</p>
            <span className="text-[10px] text-slate-400">စောင့်ဆိုင်းဆဲ</span>
          </div>

          {/* Confirmed */}
          <div className="bg-slate-900/80 border border-blue-500/30 p-3.5 rounded-xl text-center flex flex-col justify-between min-h-[96px]">
            <span className="text-[10px] font-bold uppercase text-blue-400">Confirmed</span>
            <p className="text-2xl font-black text-white font-mono my-1">{pCounts.CONFIRMED}</p>
            <span className="text-[10px] text-slate-400">အတည်ပြုပြီး</span>
          </div>

          {/* Packed */}
          <div className="bg-slate-900/80 border border-purple-500/30 p-3.5 rounded-xl text-center flex flex-col justify-between min-h-[96px]">
            <span className="text-[10px] font-bold uppercase text-purple-400">Packed</span>
            <p className="text-2xl font-black text-white font-mono my-1">{pCounts.PACKED}</p>
            <span className="text-[10px] text-slate-400">ထုပ်ပိုးပြီး</span>
          </div>

          {/* Shipped */}
          <div className="bg-slate-900/80 border border-indigo-500/30 p-3.5 rounded-xl text-center flex flex-col justify-between min-h-[96px]">
            <span className="text-[10px] font-bold uppercase text-indigo-400">Shipped</span>
            <p className="text-2xl font-black text-white font-mono my-1">{pCounts.SHIPPED}</p>
            <span className="text-[10px] text-slate-400">ပို့ဆောင်ဆဲ</span>
          </div>

          {/* Delivered */}
          <div className="bg-slate-900/80 border border-emerald-500/30 p-3.5 rounded-xl text-center flex flex-col justify-between min-h-[96px]">
            <span className="text-[10px] font-bold uppercase text-emerald-400">Delivered</span>
            <p className="text-2xl font-black text-white font-mono my-1">{pCounts.DELIVERED}</p>
            <span className="text-[10px] text-slate-400">ရောက်ရှိပြီး</span>
          </div>

          {/* Cancelled */}
          <div className="bg-slate-900/80 border border-rose-500/30 p-3.5 rounded-xl text-center flex flex-col justify-between min-h-[96px]">
            <span className="text-[10px] font-bold uppercase text-rose-400">Cancelled</span>
            <p className="text-2xl font-black text-white font-mono my-1">{pCounts.CANCELLED}</p>
            <span className="text-[10px] text-slate-400">ပယ်ဖျက်ပြီး</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Orders (2 Cols) & Liquid Accounts (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Orders (လတ်တလော အော်ဒါများ)
              </h3>
              <p className="text-xs text-slate-400">Latest customer orders in the system</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs text-brand-400 hover:underline flex items-center space-x-1"
            >
              <span>View all orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1 -mx-5 px-5">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 pb-2">
                  <th className="py-2.5">Order #</th>
                  <th className="py-2.5">Customer & Township</th>
                  <th className="py-2.5">Payment</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Total (MMK)</th>
                  <th className="py-2.5 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats?.recent_orders && stats.recent_orders.length > 0 ? (
                  stats.recent_orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 text-slate-300">
                      <td className="py-3 font-mono font-bold text-white">{ord.order_number}</td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-200">{ord.recipient_name}</div>
                        <div className="text-[11px] text-slate-400">{ord.township_name}</div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          ord.payment_status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {ord.payment_method.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          ord.order_status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-300' :
                          ord.order_status === 'SHIPPED' ? 'bg-indigo-500/20 text-indigo-300' :
                          ord.order_status === 'PACKED' ? 'bg-purple-500/20 text-purple-300' :
                          ord.order_status === 'CONFIRMED' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {ord.order_status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-400">
                        {formatMMK(ord.total_amount)}
                      </td>
                      <td className="py-3 text-center">
                        {hasPermission('order:invoice') && (
                          <button
                            onClick={() => onViewInvoice(ord)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg transition-colors"
                          >
                            Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">No orders recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Liquid Account Balances & Top Products */}
        <div className="space-y-6">
          {/* Liquid Balances */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-brand-400" />
                <span>Liquid Accounts (လက်ကျန်ငွေများ)</span>
              </h3>
              <button
                onClick={() => onNavigate('finance')}
                className="text-xs text-brand-400 hover:underline"
              >
                Ledger
              </button>
            </div>

            <div className="space-y-2.5">
              {stats?.accounts && stats.accounts.map((acc) => (
                <div key={acc.account_code} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-200 truncate">{acc.account_name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{acc.account_code}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 shrink-0">
                    {formatMMK(acc.current_balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Top Selling Products (အရောင်းရဆုံး ပစ္စည်းများ)
            </h3>
            <div className="space-y-2">
              {stats?.top_products && stats.top_products.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/50">
                  <div className="truncate pr-2">
                    <p className="font-semibold text-slate-200 truncate">{p.product_name}</p>
                    <span className="text-[10px] text-slate-400">{p.total_sold} units sold</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 shrink-0">
                    {formatMMK(p.total_revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
