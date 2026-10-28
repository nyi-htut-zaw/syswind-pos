import React, { useState, useEffect } from 'react';
import { 
  Search, 
  LayoutGrid, 
  List, 
  Printer, 
  RefreshCw
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { api, formatMMK, formatDate, hasPermission } from '../api/client';

interface OrdersPageProps {
  onViewInvoice: (order: Order) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onViewInvoice }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      let queryStr = '/orders?limit=100';
      if (search) queryStr += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) queryStr += `&order_status=${statusFilter}`;
      if (paymentFilter) queryStr += `&payment_status=${paymentFilter}`;

      const res = await api.get(queryStr);
      setOrders(res.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [search, statusFilter, paymentFilter]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const markAsPaid = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/payment`, { payment_status: 'PAID' });
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status');
    }
  };

  const kanbanColumns: Array<{ status: OrderStatus; label: string; labelMm: string; color: string; badgeBg: string }> = [
    { status: 'PENDING', label: 'Pending', labelMm: 'စောင့်ဆိုင်းဆဲ', color: 'border-amber-500/50 text-amber-400', badgeBg: 'bg-amber-500/10 text-amber-300' },
    { status: 'CONFIRMED', label: 'Confirmed', labelMm: 'အတည်ပြုပြီး', color: 'border-blue-500/50 text-blue-400', badgeBg: 'bg-blue-500/10 text-blue-300' },
    { status: 'PACKED', label: 'Packed', labelMm: 'ထုပ်ပိုးပြီး', color: 'border-purple-500/50 text-purple-400', badgeBg: 'bg-purple-500/10 text-purple-300' },
    { status: 'SHIPPED', label: 'Shipped (In Transit)', labelMm: 'ပို့ဆောင်ဆဲ', color: 'border-indigo-500/50 text-indigo-400', badgeBg: 'bg-indigo-500/10 text-indigo-300' },
    { status: 'DELIVERED', label: 'Delivered', labelMm: 'ရောက်ရှိပြီး', color: 'border-emerald-500/50 text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-300' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
            <input
              type="text"
              placeholder="Search Order #, Customer, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses (အခြေအနေအားလုံး)</option>
            <option value="PENDING">Pending (စောင့်ဆိုင်းဆဲ)</option>
            <option value="CONFIRMED">Confirmed (အတည်ပြုပြီး)</option>
            <option value="PACKED">Packed (ထုပ်ပိုးပြီး)</option>
            <option value="SHIPPED">Shipped (ပို့ဆောင်ဆဲ)</option>
            <option value="DELIVERED">Delivered (ရောက်ရှိပြီး)</option>
            <option value="CANCELLED">Cancelled (ပယ်ဖျက်ပြီး)</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Payments</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid (COD)</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
          {/* View toggle */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'table' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={loadOrders}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kanban View - Horizontal scrolling with non-squishing columns */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start snap-x">
          {kanbanColumns.map(col => {
            const columnOrders = orders.filter(o => o.order_status === col.status);
            return (
              <div 
                key={col.status} 
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col w-[290px] sm:w-[320px] shrink-0 snap-start shadow-lg"
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between pb-3 border-b ${col.color} mb-3`}>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-100">{col.label}</h4>
                    <span className="text-[10px] text-slate-400">{col.labelMm}</span>
                  </div>
                  <span className={`text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full ${col.badgeBg}`}>
                    {columnOrders.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
                  {columnOrders.map(ord => (
                    <div
                      key={ord.id}
                      className="glass-card p-3.5 rounded-xl border border-slate-800/90 hover:border-slate-700 transition-all text-xs space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-white text-xs">{ord.order_number}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ord.payment_status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {ord.payment_status}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-100 text-xs">{ord.recipient_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{ord.recipient_phone}</p>
                        <p className="text-[10px] text-slate-400 truncate">{ord.township_name}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="font-mono font-extrabold text-emerald-400 text-xs">
                          {formatMMK(ord.total_amount)}
                        </span>
                        <span className="text-[10px] text-slate-400">{ord.payment_method.replace(/_/g, ' ')}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                        {hasPermission('order:invoice') && (
                          <button
                            onClick={() => onViewInvoice(ord)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-semibold flex items-center space-x-1 transition-colors"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Invoice</span>
                          </button>
                        )}

                        {/* Status Advancement */}
                        {hasPermission('order:edit') && (
                          <div className="flex items-center space-x-1">
                            {ord.order_status === 'PENDING' && (
                              <button
                                onClick={() => updateOrderStatus(ord.id, 'CONFIRMED')}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-colors"
                              >
                                Confirm →
                              </button>
                            )}
                            {ord.order_status === 'CONFIRMED' && (
                              <button
                                onClick={() => updateOrderStatus(ord.id, 'PACKED')}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold transition-colors"
                              >
                                Pack →
                              </button>
                            )}
                            {ord.order_status === 'PACKED' && (
                              <button
                                onClick={() => updateOrderStatus(ord.id, 'SHIPPED')}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition-colors"
                              >
                                Ship →
                              </button>
                            )}
                            {ord.order_status === 'SHIPPED' && (
                              <button
                                onClick={() => updateOrderStatus(ord.id, 'DELIVERED')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors"
                              >
                                Deliver ✓
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {columnOrders.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800/60 rounded-xl">
                      No orders
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px] border-collapse">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-[12%] whitespace-nowrap">Order #</th>
                  <th className="py-3.5 px-4 w-[11%] whitespace-nowrap">Date</th>
                  <th className="py-3.5 px-4 w-[24%] whitespace-nowrap">Customer & Township</th>
                  <th className="py-3.5 px-4 w-[14%] whitespace-nowrap">Payment Method</th>
                  <th className="py-3.5 px-4 w-[14%] whitespace-nowrap">Payment Status</th>
                  <th className="py-3.5 px-4 w-[12%] whitespace-nowrap">Workflow Status</th>
                  <th className="py-3.5 px-4 w-[10%] text-right whitespace-nowrap">Total (MMK)</th>
                  <th className="py-3.5 px-4 w-[7%] text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map(ord => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                    <td className="py-3.5 px-4 align-middle font-mono font-bold text-white whitespace-nowrap">
                      {ord.order_number}
                    </td>

                    <td className="py-3.5 px-4 align-middle text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(ord.created_at)}
                    </td>

                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-semibold text-slate-100 text-xs sm:text-sm truncate max-w-[200px]">{ord.recipient_name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px] flex items-center space-x-1.5 mt-0.5">
                        <span className="font-mono">{ord.recipient_phone}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{ord.township_name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                        {ord.payment_method.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          ord.payment_status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {ord.payment_status}
                        </span>
                        {ord.payment_status === 'UNPAID' && hasPermission('order:edit') && (
                          <button
                            onClick={() => markAsPaid(ord.id)}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline font-bold whitespace-nowrap"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {hasPermission('order:edit') ? (
                        <select
                          value={ord.order_status}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1 focus:outline-none focus:border-brand-500 whitespace-nowrap"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PACKED">PACKED</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      ) : (
                        <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60">
                          {ord.order_status}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-middle text-right font-mono font-bold text-emerald-400 whitespace-nowrap text-xs">
                      {formatMMK(ord.total_amount)}
                    </td>

                    <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                      {hasPermission('order:invoice') && (
                        <button
                          onClick={() => onViewInvoice(ord)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 mx-auto border border-slate-700 hover:border-slate-600 transition-colors whitespace-nowrap"
                        >
                          <Printer className="w-3.5 h-3.5 text-brand-400" />
                          <span>Invoice</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
