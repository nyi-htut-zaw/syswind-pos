import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  X
} from 'lucide-react';
import { Customer, Township } from '../types';
import { api, formatMMK, formatDate, hasPermission } from '../api/client';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [townships, setTownships] = useState<Township[]>([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Add Customer Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAltPhone, setNewAltPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newTownshipId, setNewTownshipId] = useState('');
  const [newFb, setNewFb] = useState('');
  const [newViber, setNewViber] = useState('');
  const [newTier, setNewTier] = useState<'REGULAR' | 'SILVER' | 'GOLD' | 'PLATINUM'>('REGULAR');
  const [newNotes, setNewNotes] = useState('');

  // Customer History Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      let queryStr = `/customers?limit=100`;
      if (search) queryStr += `&search=${encodeURIComponent(search)}`;
      if (tierFilter) queryStr += `&loyalty_tier=${tierFilter}`;

      const [custRes, townRes] = await Promise.all([
        api.get(queryStr),
        api.get('/deliveries/townships'),
      ]);
      setCustomers(custRes.customers || []);
      setTownships(townRes.townships || []);
      if (townRes.townships && townRes.townships.length > 0 && !newTownshipId) {
        setNewTownshipId(townRes.townships[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, tierFilter]);

  const viewCustomerHistory = async (cust: Customer) => {
    try {
      const res = await api.get(`/customers/${cust.id}`);
      setSelectedCustomer(res.customer);
      setCustomerOrders(res.orders || []);
      setHistoryModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const town = townships.find(t => t.id === newTownshipId);
      await api.post('/customers', {
        full_name: newName,
        phone: newPhone,
        alt_phone: newAltPhone || null,
        address: newAddress,
        township_id: town?.id || null,
        township_name: town?.name_en || 'Yangon',
        city: town?.city || 'Yangon',
        fb_profile: newFb || null,
        viber_number: newViber || newPhone,
        loyalty_tier: newTier,
        notes: newNotes || null,
      });

      setAddModalOpen(false);
      loadCustomers();
      // Reset
      setNewName('');
      setNewPhone('');
      setNewAddress('');
      setNewNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Search */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
            <input
              type="text"
              placeholder="Search Name, Phone (09...), Address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="">All VIP Tiers</option>
            <option value="PLATINUM">Platinum VIP</option>
            <option value="GOLD">Gold VIP</option>
            <option value="SILVER">Silver VIP</option>
            <option value="REGULAR">Regular</option>
          </select>
        </div>

        {hasPermission('customer:create') && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center space-x-1.5 self-start md:self-auto shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Customer (ဖောက်သည်သစ်)</span>
          </button>
        )}
      </div>

      {/* Customer CRM Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[860px] border-collapse">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-[24%] whitespace-nowrap">Customer Details</th>
                <th className="py-3.5 px-4 w-[22%] whitespace-nowrap">Township & Address</th>
                <th className="py-3.5 px-4 w-[18%] whitespace-nowrap">Direct Communication</th>
                <th className="py-3.5 px-4 w-[12%] whitespace-nowrap">Loyalty Tier</th>
                <th className="py-3.5 px-4 w-[8%] text-center whitespace-nowrap">Orders</th>
                <th className="py-3.5 px-4 w-[16%] text-right whitespace-nowrap">Lifetime Spent (MMK)</th>
                <th className="py-3.5 px-4 w-[8%] text-center whitespace-nowrap">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                  <td className="py-3.5 px-4 align-middle">
                    <div className="font-bold text-white text-xs sm:text-sm whitespace-nowrap">{c.full_name}</div>
                    <div className="font-mono text-slate-400 text-xs mt-0.5 whitespace-nowrap">{c.phone}</div>
                    {c.alt_phone && (
                      <span className="text-[10px] text-slate-500 font-mono block whitespace-nowrap">Alt: {c.alt_phone}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 align-middle">
                    <span className="inline-block text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-semibold mb-1 whitespace-nowrap border border-slate-700/60">
                      {c.township_name || 'Yangon'}
                    </span>
                    <p className="text-[11px] text-slate-400 truncate max-w-[220px]" title={c.address}>{c.address}</p>
                  </td>

                  <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                    <div className="flex items-center space-x-1.5 whitespace-nowrap shrink-0">
                      {/* Viber chat launcher */}
                      <a
                        href={`viber://chat?number=${c.viber_number || c.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Chat on Viber"
                        className="px-2.5 py-1 bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white rounded-lg text-[10px] font-bold border border-purple-500/30 flex items-center space-x-1 transition-colors whitespace-nowrap"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Viber</span>
                      </a>

                      {/* Phone call */}
                      <a
                        href={`tel:${c.phone}`}
                        title="Call Customer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                      </a>

                      {/* Facebook profile */}
                      {c.fb_profile && (
                        <a
                          href={`https://${c.fb_profile.replace(/^https?:\/\//, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Facebook Profile"
                          className="p-1.5 bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-500/30 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${
                      c.loyalty_tier === 'PLATINUM' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      c.loyalty_tier === 'GOLD' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      c.loyalty_tier === 'SILVER' ? 'bg-slate-700 text-slate-200' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {c.loyalty_tier}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 align-middle text-center font-mono font-semibold text-slate-200 whitespace-nowrap">
                    {c.total_orders}
                  </td>

                  <td className="py-3.5 px-4 align-middle text-right font-mono font-bold text-emerald-400 whitespace-nowrap text-xs">
                    {formatMMK(c.total_spent)}
                  </td>

                  <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                    <button
                      onClick={() => viewCustomerHistory(c)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 hover:border-slate-600 transition-colors whitespace-nowrap"
                    >
                      Orders
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Orders History Modal */}
      {historyModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-base">{selectedCustomer.full_name}</h3>
                <p className="text-xs text-slate-400">{selectedCustomer.phone} • {selectedCustomer.township_name}</p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400">Loyalty Status</span>
                <p className="font-bold text-amber-400 text-sm">{selectedCustomer.loyalty_tier} VIP</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400">Total Orders</span>
                <p className="font-mono font-bold text-white text-sm">{selectedCustomer.total_orders}</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400">Lifetime Spent</span>
                <p className="font-mono font-bold text-emerald-400 text-sm">{formatMMK(selectedCustomer.total_spent)}</p>
              </div>
            </div>

            {selectedCustomer.notes && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs mb-4">
                <strong>Customer Notes:</strong> {selectedCustomer.notes}
              </div>
            )}

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Order History</h4>
              {customerOrders.length > 0 ? (
                customerOrders.map(ord => (
                  <div key={ord.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-white">{ord.order_number}</span>
                      <p className="text-[11px] text-slate-400 font-mono">{formatDate(ord.created_at)}</p>
                      <span className="inline-block text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded mt-0.5">
                        {ord.payment_method} ({ord.payment_status})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400">{formatMMK(ord.total_amount)}</span>
                      <p className="text-[10px] text-slate-400 font-semibold">{ord.order_status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No past orders found for this customer.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Register New Customer (ဖောက်သည်သစ်သွင်းရန်)</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">Customer Full Name (အမည်)</label>
                  <input
                    type="text"
                    required
                    placeholder="Daw Nilar Aye"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Primary Phone / Viber (ဖုန်းနံပါတ်)</label>
                  <input
                    type="text"
                    required
                    placeholder="09250011223"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Alt Phone (အပိုဖုန်း)</label>
                  <input
                    type="text"
                    placeholder="09790011223"
                    value={newAltPhone}
                    onChange={(e) => setNewAltPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">Township (မြို့နယ်)</label>
                  <select
                    value={newTownshipId}
                    onChange={(e) => setNewTownshipId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    {townships.map(t => (
                      <option key={t.id} value={t.id}>{t.name_en} ({t.name_mm}) - {t.city}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">Delivery Address (အိမ်အမှတ်၊ လမ်း၊ ရပ်ကွက်)</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="No. 45, Padonmar Road..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Facebook Profile Link / Name</label>
                  <input
                    type="text"
                    placeholder="facebook.com/nilar.fashion"
                    value={newFb}
                    onChange={(e) => setNewFb(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Loyalty Tier</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="REGULAR">Regular</option>
                    <option value="SILVER">Silver VIP</option>
                    <option value="GOLD">Gold VIP</option>
                    <option value="PLATINUM">Platinum VIP</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">Customer Preferences / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Prefers afternoon delivery, likes skincare products"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
