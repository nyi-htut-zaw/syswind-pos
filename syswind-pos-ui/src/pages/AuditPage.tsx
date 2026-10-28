import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, RefreshCw, Key, UserCheck, Activity } from 'lucide-react';
import { api, formatDate } from '../api/client';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      let queryStr = '/audit-logs?limit=100';
      if (actionFilter) queryStr += `&action=${actionFilter}`;
      const res = await api.get(queryStr);
      setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Security & System Audit Logs</h3>
            <p className="text-xs text-slate-400">လုံခြုံရေးနှင့် စနစ်အတွင်း လုပ်ဆောင်ချက် မှတ်တမ်းများ (Immutable Audit Trail)</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Actions (လုပ်ဆောင်ချက် အားလုံး)</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="CREATE_ORDER">Order Creations</option>
            <option value="UPDATE_ORDER_STATUS">Status Updates</option>
            <option value="ADJUST_STOCK">Stock Adjustments</option>
            <option value="RECONCILE_COD">COD Reconciliations</option>
            <option value="CREATE_EXPENSE">Expenses Logged</option>
            <option value="CREATE_TRANSACTION">Fund Transfers</option>
          </select>

          <button
            onClick={loadAuditLogs}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4">Timestamp (MMT)</th>
                <th className="py-3 px-4">Operator / Role</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Payload & Event Details</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-slate-800/40 text-slate-300 font-mono text-[11px]">
                  <td className="py-3 px-4 text-slate-400">{formatDate(l.created_at)}</td>
                  <td className="py-3 px-4 font-sans">
                    <span className="font-semibold text-white">{l.user_full_name || l.username || 'System Engine'}</span>
                    {l.user_role && (
                      <span className="block text-[10px] text-brand-400 font-mono">{l.user_role}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-purple-300 border border-purple-500/20">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-sans">
                    {l.entity_name}
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-md truncate">
                    {typeof l.details === 'object' ? JSON.stringify(l.details) : l.details}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {l.ip_address || '::1 (local)'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No audit records found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
