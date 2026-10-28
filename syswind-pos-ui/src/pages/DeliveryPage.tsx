import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Search,
  RefreshCw,
  Edit,
  X,
  Plus,
  Trash2,
  Building2,
  Phone,
  Mail,
  Globe,
  ExternalLink
} from 'lucide-react';
import { Delivery, Township, FinancialAccount, DeliveryProviderItem } from '../types';
import { api, formatMMK, hasPermission } from '../api/client';
import { ImageUpload } from '../components/ImageUpload';

export const DeliveryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dispatches' | 'townships' | 'providers'>('dispatches');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [townships, setTownships] = useState<Township[]>([]);
  const [providers, setProviders] = useState<DeliveryProviderItem[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [townshipSearch, setTownshipSearch] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Dispatch Assignment Modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [providerId, setProviderId] = useState('');
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // COD Reconciliation Modal
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [reconcileDelivery, setReconcileDelivery] = useState<Delivery | null>(null);
  const [reconcileAmount, setReconcileAmount] = useState<number>(0);
  const [depositAccountId, setDepositAccountId] = useState('');
  const [referenceNote, setReferenceNote] = useState('');

  // Add Township Modal
  const [addTownshipModalOpen, setAddTownshipModalOpen] = useState(false);
  const [createDivision, setCreateDivision] = useState('Yangon');
  const [createCity, setCreateCity] = useState('Yangon');
  const [createNameEn, setCreateNameEn] = useState('');
  const [createNameMm, setCreateNameMm] = useState('');
  const [createFee, setCreateFee] = useState<number>(2500);
  const [createDays, setCreateDays] = useState<number>(1);
  const [createIsCod, setCreateIsCod] = useState(true);
  const [townshipSubmitting, setTownshipSubmitting] = useState(false);

  // Township Edit Modal
  const [editTownshipModalOpen, setEditTownshipModalOpen] = useState(false);
  const [selectedTownship, setSelectedTownship] = useState<Township | null>(null);
  const [editDivision, setEditDivision] = useState('Yangon');
  const [editCity, setEditCity] = useState('Yangon');
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameMm, setEditNameMm] = useState('');
  const [newFee, setNewFee] = useState<number>(2500);
  const [newDays, setNewDays] = useState<number>(2);
  const [editIsCod, setEditIsCod] = useState(true);

  // Provider Modals
  const [addProviderModalOpen, setAddProviderModalOpen] = useState(false);
  const [editProviderModalOpen, setEditProviderModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<DeliveryProviderItem | null>(null);
  const [provName, setProvName] = useState('');
  const [provType, setProvType] = useState<'INTERNAL' | 'THIRD_PARTY'>('THIRD_PARTY');
  const [provContact, setProvContact] = useState('');
  const [provPhone, setProvPhone] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provAddress, setProvAddress] = useState('');
  const [provTrackingUrl, setProvTrackingUrl] = useState('');
  const [provLogoUrl, setProvLogoUrl] = useState('');
  const [provIsActive, setProvIsActive] = useState(true);
  const [provSubmitting, setProvSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      let queryStr = `/deliveries?limit=100`;
      if (statusFilter) queryStr += `&status=${statusFilter}`;
      if (search) queryStr += `&search=${encodeURIComponent(search)}`;

      const [delivRes, townRes, provRes, accRes] = await Promise.all([
        api.get(queryStr),
        api.get('/deliveries/townships'),
        api.get('/deliveries/providers'),
        api.get('/finance/accounts'),
      ]);

      setDeliveries(delivRes.deliveries || []);
      setTownships(townRes.townships || []);
      setProviders(provRes.providers || []);
      setAccounts(accRes.accounts || []);
      if (accRes.accounts?.length > 0 && !depositAccountId) {
        setDepositAccountId(accRes.accounts[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search]);

  const openDispatchModal = (d: Delivery) => {
    setSelectedDelivery(d);
    setProviderId(d.provider_id || providers[0]?.id || '');
    setRiderName(d.rider_name || '');
    setRiderPhone(d.rider_phone || '');
    setTrackingNumber(d.tracking_number || `TRK-${d.order_number}`);
    setDeliveryNotes(d.delivery_notes || '');
    setDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    try {
      await api.put(`/deliveries/${selectedDelivery.id}/dispatch`, {
        provider_id: providerId || null,
        rider_name: riderName || null,
        rider_phone: riderPhone || null,
        tracking_number: trackingNumber || null,
        delivery_notes: deliveryNotes || null,
      });

      if (riderName) {
        await api.put(`/deliveries/${selectedDelivery.id}/status`, { status: 'IN_TRANSIT' });
      }

      setDispatchModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update dispatch details');
    }
  };

  const openReconcileModal = (d: Delivery) => {
    setReconcileDelivery(d);
    setReconcileAmount(parseFloat(String(d.cod_amount_expected || d.total_amount)));
    setReferenceNote(`Rider cash settlement for ${d.order_number}`);
    setReconcileModalOpen(true);
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileDelivery) return;

    try {
      await api.post(`/deliveries/${reconcileDelivery.id}/reconcile-cod`, {
        amount_received: reconcileAmount,
        deposit_account_id: depositAccountId,
        reference_note: referenceNote,
      });

      setReconcileModalOpen(false);
      loadData();
      alert('COD successfully reconciled and funds credited to account!');
    } catch (err: any) {
      alert(err.message || 'Failed to reconcile COD');
    }
  };

  const handleUpdateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      await api.put(`/deliveries/${deliveryId}/status`, { delivery_status: newStatus });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update delivery status');
    }
  };

  const handleCreateTownship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNameEn.trim()) {
      alert('Township name (English) is required.');
      return;
    }
    try {
      setTownshipSubmitting(true);
      await api.post('/deliveries/townships', {
        state_division: createDivision.trim() || 'Yangon',
        city: createCity.trim() || 'Yangon',
        name_en: createNameEn.trim(),
        name_mm: createNameMm.trim() || createNameEn.trim(),
        standard_delivery_fee: createFee,
        estimated_days: createDays,
        is_cod_available: createIsCod,
      });

      setAddTownshipModalOpen(false);
      setCreateNameEn('');
      setCreateNameMm('');
      setCreateFee(2500);
      setCreateDays(1);
      loadData();
      alert('New delivery rate added successfully! (ပို့ခနှုန်းထားအသစ် ထည့်သွင်းပြီးပါပြီ)');
    } catch (err: any) {
      alert(err.message || 'Failed to add township rate');
    } finally {
      setTownshipSubmitting(false);
    }
  };

  const openTownshipEdit = (t: Township) => {
    setSelectedTownship(t);
    setEditDivision(t.state_division || 'Yangon');
    setEditCity(t.city || 'Yangon');
    setEditNameEn(t.name_en || '');
    setEditNameMm(t.name_mm || '');
    setNewFee(parseFloat(String(t.standard_delivery_fee)) || 0);
    setNewDays(t.estimated_days || 1);
    setEditIsCod(t.is_cod_available !== false);
    setEditTownshipModalOpen(true);
  };

  const handleTownshipUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTownship) return;

    try {
      setTownshipSubmitting(true);
      await api.put(`/deliveries/townships/${selectedTownship.id}`, {
        state_division: editDivision.trim() || selectedTownship.state_division,
        city: editCity.trim() || selectedTownship.city,
        name_en: editNameEn.trim() || selectedTownship.name_en,
        name_mm: editNameMm.trim() || selectedTownship.name_mm,
        standard_delivery_fee: newFee,
        estimated_days: newDays,
        is_cod_available: editIsCod,
      });
      setEditTownshipModalOpen(false);
      loadData();
      alert('Delivery rate updated successfully! (ပို့ခနှုန်းထား ပြင်ဆင်ပြီးပါပြီ)');
    } catch (err: any) {
      alert(err.message || 'Failed to update delivery rate');
    } finally {
      setTownshipSubmitting(false);
    }
  };

  const handleDeleteTownship = async (t: Township) => {
    if (!confirm(`Are you sure you want to remove delivery rate for ${t.name_en} (${t.name_mm})?`)) return;
    try {
      await api.delete(`/deliveries/townships/${t.id}`);
      setEditTownshipModalOpen(false);
      loadData();
      alert('Township removed successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete township rate');
    }
  };

  // Provider Handlers
  const openAddProviderModal = () => {
    setProvName('');
    setProvType('THIRD_PARTY');
    setProvContact('');
    setProvPhone('');
    setProvEmail('');
    setProvAddress('');
    setProvTrackingUrl('');
    setProvLogoUrl('');
    setProvIsActive(true);
    setAddProviderModalOpen(true);
  };

  const openEditProviderModal = (p: DeliveryProviderItem) => {
    setSelectedProvider(p);
    setProvName(p.name || '');
    setProvType(p.provider_type || 'THIRD_PARTY');
    setProvContact(p.contact_person || '');
    setProvPhone(p.phone || '');
    setProvEmail(p.email || '');
    setProvAddress(p.address || '');
    setProvTrackingUrl(p.tracking_url_template || '');
    setProvLogoUrl(p.logo_url || '');
    setProvIsActive(p.is_active !== false);
    setEditProviderModalOpen(true);
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provName.trim()) {
      alert('Provider name is required.');
      return;
    }
    try {
      setProvSubmitting(true);
      await api.post('/deliveries/providers', {
        name: provName.trim(),
        provider_type: provType,
        contact_person: provContact.trim() || null,
        phone: provPhone.trim() || null,
        email: provEmail.trim() || null,
        address: provAddress.trim() || null,
        tracking_url_template: provTrackingUrl.trim() || null,
        logo_url: provLogoUrl || null,
        is_active: provIsActive,
      });

      setAddProviderModalOpen(false);
      loadData();
      alert('Delivery provider added successfully! (ပို့ဆောင်ရေးကုမ္ပဏီ အသစ်ထည့်သွင်းပြီးပါပြီ)');
    } catch (err: any) {
      alert(err.message || 'Failed to create provider');
    } finally {
      setProvSubmitting(false);
    }
  };

  const handleUpdateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    try {
      setProvSubmitting(true);
      await api.put(`/deliveries/providers/${selectedProvider.id}`, {
        name: provName.trim(),
        provider_type: provType,
        contact_person: provContact.trim() || null,
        phone: provPhone.trim() || null,
        email: provEmail.trim() || null,
        address: provAddress.trim() || null,
        tracking_url_template: provTrackingUrl.trim() || null,
        logo_url: provLogoUrl || null,
        is_active: provIsActive,
      });

      setEditProviderModalOpen(false);
      loadData();
      alert('Provider details updated successfully! (ပြင်ဆင်ချက်များ သိမ်းဆည်းပြီးပါပြီ)');
    } catch (err: any) {
      alert(err.message || 'Failed to update provider');
    } finally {
      setProvSubmitting(false);
    }
  };

  const handleDeleteProvider = async (p: DeliveryProviderItem) => {
    if (!confirm(`Are you sure you want to deactivate delivery provider "${p.name}"?`)) return;
    try {
      await api.delete(`/deliveries/providers/${p.id}`);
      setEditProviderModalOpen(false);
      loadData();
      alert('Delivery provider deactivated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate provider');
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Selectors & Filter Bar */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('dispatches')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${activeTab === 'dispatches'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <Truck className="w-4 h-4" />
            <span>Active Dispatches & Riders (ဒယ်လီဗရီ ပို့ဆောင်မှုများ)</span>
          </button>

          <button
            onClick={() => setActiveTab('townships')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${activeTab === 'townships'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Township Delivery Fees (မြို့နယ် ပို့ခနှုန်းထားများ)</span>
          </button>

          <button
            onClick={() => setActiveTab('providers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${activeTab === 'providers'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Delivery Providers & Fleets (ဒယ်လီဗရီ ကုမ္ပဏီများ)</span>
          </button>
        </div>

        {activeTab === 'dispatches' && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 self-start md:self-auto">
            <div className="relative min-w-[180px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                placeholder="Search Rider, Order #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="ASSIGNED">Assigned (လွှဲအပ်ပြီး)</option>
              <option value="IN_TRANSIT">In Transit (လမ်းကြောင်းပေါ်တွင်)</option>
              <option value="DELIVERED">Delivered (ပို့ဆောင်ပြီး)</option>
              <option value="FAILED">Failed / Reschedule</option>
            </select>

            <button onClick={loadData} className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 1. Dispatches Tab */}
      {activeTab === 'dispatches' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px] border-collapse">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-[16%] whitespace-nowrap">Order & Tracking #</th>
                  <th className="py-3.5 px-4 w-[22%] whitespace-nowrap">Recipient & Destination</th>
                  <th className="py-3.5 px-4 w-[20%] whitespace-nowrap">Assigned Logistics / Rider</th>
                  <th className="py-3.5 px-4 w-[12%] whitespace-nowrap">Delivery Status</th>
                  <th className="py-3.5 px-4 w-[12%] text-right whitespace-nowrap">COD Expected</th>
                  <th className="py-3.5 px-4 w-[12%] text-center whitespace-nowrap">COD Clearance</th>
                  <th className="py-3.5 px-4 w-[14%] text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {deliveries.map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="font-mono font-bold text-white text-xs">{d.order_number}</div>
                      <span className="font-mono text-[10px] text-slate-400 block mt-0.5">{d.tracking_number || 'No tracking'}</span>
                    </td>

                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-semibold text-white whitespace-nowrap">{d.recipient_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono whitespace-nowrap">{d.recipient_phone}</div>
                      <span className="inline-block text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded mt-0.5 border border-slate-700/60 whitespace-nowrap">
                        {d.township_name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-semibold text-slate-200 whitespace-nowrap">{d.provider_name || 'In-House Fleet'}</div>
                      {d.rider_name ? (
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5 whitespace-nowrap">
                          <span>{d.rider_name}</span>
                          {d.rider_phone && <span className="font-mono">({d.rider_phone})</span>}
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-medium whitespace-nowrap">Unassigned Rider</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {hasPermission('delivery:update_status') ? (
                        <select
                          value={d.delivery_status}
                          onChange={(e) => handleUpdateDeliveryStatus(d.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1 focus:outline-none focus:border-brand-500 whitespace-nowrap"
                        >
                          <option value="ASSIGNED">ASSIGNED (လွှဲအပ်ပြီး)</option>
                          <option value="IN_TRANSIT">IN_TRANSIT (ပို့ဆောင်ဆဲ)</option>
                          <option value="DELIVERED">DELIVERED (ရောက်ရှိပြီး)</option>
                          <option value="FAILED">FAILED (မအောင်မြင်)</option>
                        </select>
                      ) : (
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${d.delivery_status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-300' :
                            d.delivery_status === 'IN_TRANSIT' ? 'bg-indigo-500/20 text-indigo-300' :
                              d.delivery_status === 'ASSIGNED' ? 'bg-blue-500/20 text-blue-300' :
                                'bg-amber-500/20 text-amber-300'
                          }`}>
                          {d.delivery_status}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-middle text-right font-mono font-bold text-amber-400 whitespace-nowrap text-xs">
                      {formatMMK(d.cod_amount_expected)}
                    </td>

                    <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                      {d.cod_reconciled ? (
                        <span className="inline-block text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
                          Reconciled ✓
                        </span>
                      ) : parseFloat(String(d.cod_amount_expected)) > 0 ? (
                        <span className="inline-block text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
                          Pending Collection
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">Prepaid</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5 whitespace-nowrap shrink-0">
                        {hasPermission('delivery:assign') && (
                          <button
                            onClick={() => openDispatchModal(d)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 hover:border-slate-600 transition-colors whitespace-nowrap"
                          >
                            Dispatch
                          </button>
                        )}

                        {!d.cod_reconciled && parseFloat(String(d.cod_amount_expected)) > 0 && hasPermission('delivery:reconcile') && (
                          <button
                            onClick={() => openReconcileModal(d)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors whitespace-nowrap"
                          >
                            Reconcile COD
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Townships Tab */}
      {activeTab === 'townships' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span>Configured Townships & Delivery Rates</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-brand-400 font-mono font-bold border border-slate-700">
                  {townships.filter(t => !townshipSearch.trim() || t.name_en?.toLowerCase().includes(townshipSearch.toLowerCase()) || t.name_mm?.toLowerCase().includes(townshipSearch.toLowerCase()) || t.city?.toLowerCase().includes(townshipSearch.toLowerCase())).length} townships
                </span>
              </h3>
              <p className="text-xs text-slate-400">Township-specific standard logistics fees & delivery turnaround (ပို့ခနှုန်းထားများ)</p>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search township, city..."
                  value={townshipSearch}
                  onChange={(e) => setTownshipSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              {hasPermission('township:manage') && (
                <button
                  onClick={() => setAddTownshipModalOpen(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center space-x-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Township Rate</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px] border-collapse">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-[16%] whitespace-nowrap">State / Division</th>
                  <th className="py-3.5 px-4 w-[15%] whitespace-nowrap">City</th>
                  <th className="py-3.5 px-4 w-[18%] whitespace-nowrap">Township (English)</th>
                  <th className="py-3.5 px-4 w-[18%] whitespace-nowrap">Township (မြန်မာ)</th>
                  <th className="py-3.5 px-4 w-[13%] text-right whitespace-nowrap">Standard Fee (MMK)</th>
                  <th className="py-3.5 px-4 w-[7%] text-center whitespace-nowrap">Est. Days</th>
                  <th className="py-3.5 px-4 w-[8%] text-center whitespace-nowrap">COD Option</th>
                  <th className="py-3.5 px-4 w-[5%] text-center whitespace-nowrap">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {townships
                  .filter(t => {
                    if (!townshipSearch.trim()) return true;
                    const q = townshipSearch.toLowerCase();
                    return (
                      t.name_en?.toLowerCase().includes(q) ||
                      t.name_mm?.toLowerCase().includes(q) ||
                      t.city?.toLowerCase().includes(q) ||
                      t.state_division?.toLowerCase().includes(q)
                    );
                  })
                  .map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                      <td className="py-3 px-4 align-middle font-semibold text-slate-200 whitespace-nowrap">{t.state_division}</td>
                      <td className="py-3 px-4 align-middle text-slate-400 whitespace-nowrap">{t.city}</td>
                      <td className="py-3 px-4 align-middle font-bold text-white whitespace-nowrap">{t.name_en}</td>
                      <td className="py-3 px-4 align-middle text-slate-300 whitespace-nowrap">{t.name_mm}</td>
                      <td className="py-3 px-4 align-middle text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {formatMMK(t.standard_delivery_fee)}
                      </td>
                      <td className="py-3 px-4 align-middle text-center font-mono whitespace-nowrap">{t.estimated_days} days</td>
                      <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                        {t.is_cod_available !== false ? (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                            COD ✓
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                            Prepaid Only
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                        {hasPermission('township:manage') && (
                          <button
                            onClick={() => openTownshipEdit(t)}
                            className="p-1.5 bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-300 rounded-lg border border-slate-700 hover:border-brand-500 transition-all"
                            title="Edit Rate & Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
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

      {/* 3. Delivery Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          {/* Header & Filter Controls */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-400" />
                <span>Logistics Partners & Fleet Management (ဒယ်လီဗရီ ဝန်ဆောင်မှု ကုမ္ပဏီများ)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ဆိုင်ကိုယ်ပိုင် စီးနင်းသူများနှင့် ပြင်ပ ပို့ဆောင်ရေး ကုမ္ပဏီများ၏ အချက်အလက်၊ Logo နှင့် ဖုန်းနံပါတ်များ စီမံရန်
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search provider name or phone..."
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              {hasPermission('provider:manage') && (
                <button
                  onClick={openAddProviderModal}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/30 flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Provider (အသစ်ထည့်ရန်)</span>
                </button>
              )}
            </div>
          </div>

          {/* Providers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers
              .filter(p => {
                if (!providerSearch) return true;
                const q = providerSearch.toLowerCase();
                return (
                  p.name?.toLowerCase().includes(q) ||
                  p.phone?.toLowerCase().includes(q) ||
                  p.contact_person?.toLowerCase().includes(q) ||
                  p.email?.toLowerCase().includes(q)
                );
              })
              .map(p => (
                <div
                  key={p.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4 group relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {p.logo_url ? (
                        <img
                          src={p.logo_url}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-contain bg-slate-900 p-1 border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600/30 to-indigo-600/30 border border-brand-500/30 flex items-center justify-center shrink-0">
                          <Truck className="w-6 h-6 text-brand-400" />
                        </div>
                      )}

                      <div>
                        <h4 className="font-bold text-white text-sm leading-snug">{p.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          {p.provider_type === 'INTERNAL' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              In-House Riders
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                              3rd Party Partner
                            </span>
                          )}

                          {p.is_active !== false ? (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                              Disabled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {hasPermission('provider:manage') && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditProviderModal(p)}
                          className="p-1.5 bg-slate-900 hover:bg-brand-600 hover:text-white text-slate-400 rounded-lg border border-slate-800 transition-colors"
                          title="Edit Provider"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProvider(p)}
                          className="p-1.5 bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition-colors"
                          title="Deactivate Provider"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                    {p.contact_person && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px] w-14 shrink-0">Contact:</span>
                        <span className="font-medium text-slate-200">{p.contact_person}</span>
                      </div>
                    )}
                    {p.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <a href={`tel:${p.phone}`} className="font-mono text-emerald-400 hover:underline">
                          {p.phone}
                        </a>
                      </div>
                    )}
                    {p.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-300 truncate">{p.email}</span>
                      </div>
                    )}
                    {p.address && (
                      <div className="flex items-start gap-2 text-slate-400 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="truncate">{p.address}</span>
                      </div>
                    )}
                    {p.tracking_url_template && (
                      <div className="flex items-center gap-1.5 text-[10px] text-brand-400 bg-brand-500/10 px-2 py-1 rounded-lg border border-brand-500/20 mt-1">
                        <Globe className="w-3 h-3 shrink-0" />
                        <span className="truncate font-mono">{p.tracking_url_template}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add Delivery Provider Modal */}
      {addProviderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Add Delivery Provider</h3>
                  <p className="text-xs text-slate-400">ဒယ်လီဗရီ ဝန်ဆောင်မှု ကုမ္ပဏီ အသစ်ထည့်သွင်းရန်</p>
                </div>
              </div>
              <button
                onClick={() => setAddProviderModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProvider} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Provider Name (ကုမ္ပဏီ အမည်) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Express, BeeXprss, In-House Riders"
                    value={provName}
                    onChange={(e) => setProvName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Provider Type (အမျိုးအစား)
                  </label>
                  <select
                    value={provType}
                    onChange={(e) => setProvType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                  >
                    <option value="THIRD_PARTY">Third-Party Logistics (ပြင်ပကုမ္ပဏီ)</option>
                    <option value="INTERNAL">Internal Fleet (ဆိုင်ကိုယ်ပိုင် စီးနင်းသူ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Contact Person (ဆက်သွယ်ရန် ပုဂ္ဂိုလ်)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ko Aung Kyaw, Operations Lead"
                    value={provContact}
                    onChange={(e) => setProvContact(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Hotline Phone (ဖုန်းနံပါတ်)
                  </label>
                  <input
                    type="text"
                    placeholder="09..."
                    value={provPhone}
                    onChange={(e) => setProvPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="ops@delivery.com"
                    value={provEmail}
                    onChange={(e) => setProvEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Office / Warehouse Address (လိပ်စာ)
                  </label>
                  <input
                    type="text"
                    placeholder="Hub address, township..."
                    value={provAddress}
                    onChange={(e) => setProvAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Tracking URL Template
                  </label>
                  <input
                    type="text"
                    placeholder="https://tracker.com/status?trk={TRACKING_NO}"
                    value={provTrackingUrl}
                    onChange={(e) => setProvTrackingUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <ImageUpload
                    value={provLogoUrl}
                    onChange={setProvLogoUrl}
                    label="Provider Logo (ကုမ္ပဏီ တံဆိပ်/လိုဂို)"
                    labelMm="လိုဂိုဓာတ်ပုံ တင်ရန် (PNG/JPG)"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAddProviderModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
                >
                  {provSubmitting ? 'Creating...' : 'Create Provider (သိမ်းဆည်းမည်)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Delivery Provider Modal */}
      {editProviderModalOpen && selectedProvider && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Edit Delivery Provider</h3>
                  <p className="text-xs text-slate-400">{selectedProvider.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditProviderModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProvider} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Provider Name (ကုမ္ပဏီ အမည်) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={provName}
                    onChange={(e) => setProvName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-brand-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Provider Type
                  </label>
                  <select
                    value={provType}
                    onChange={(e) => setProvType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                  >
                    <option value="THIRD_PARTY">Third-Party Logistics</option>
                    <option value="INTERNAL">Internal Fleet (In-House)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={provContact}
                    onChange={(e) => setProvContact(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={provPhone}
                    onChange={(e) => setProvPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={provEmail}
                    onChange={(e) => setProvEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Office / Hub Address
                  </label>
                  <input
                    type="text"
                    value={provAddress}
                    onChange={(e) => setProvAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Tracking URL Template
                  </label>
                  <input
                    type="text"
                    value={provTrackingUrl}
                    onChange={(e) => setProvTrackingUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500 text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <ImageUpload
                    value={provLogoUrl}
                    onChange={setProvLogoUrl}
                    label="Provider Logo (ကုမ္ပဏီ တံဆိပ်/လိုဂို)"
                    labelMm="လိုဂိုဓာတ်ပုံ ပြောင်းလဲရန်"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={provIsActive}
                      onChange={(e) => setProvIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 border-slate-700 bg-slate-900"
                    />
                    <div>
                      <span className="text-slate-200 font-semibold block text-xs">Active Provider</span>
                      <span className="text-slate-400 text-[10px]">ဤပို့ဆောင်ရေးဝန်ဆောင်မှုအား အော်ဒါများတွင် ရွေးချယ်ခွင့်ပြုသည်</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteProvider(selectedProvider)}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Deactivate</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditProviderModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={provSubmitting}
                    className="px-5 py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
                  >
                    {provSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Assignment Modal */}
      {dispatchModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Assign Rider / Provider</h3>
                <p className="text-xs text-slate-400">Order: {selectedDelivery.order_number}</p>
              </div>
              <button onClick={() => setDispatchModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Delivery Provider</label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.provider_type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Rider Name</label>
                <input
                  type="text"
                  placeholder="Ko Soe Win"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Rider Contact Phone</label>
                <input
                  type="text"
                  placeholder="09791112233"
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tracking Number / Waybill #</label>
                <input
                  type="text"
                  placeholder="TRK-SW-..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Special Delivery Notes</label>
                <input
                  type="text"
                  placeholder="Fragile cosmetic items / Call before delivery"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg"
                >
                  Save & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COD Reconciliation Modal */}
      {reconcileModalOpen && reconcileDelivery && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Reconcile COD Cash</h3>
                <p className="text-xs text-slate-400">Order: {reconcileDelivery.order_number}</p>
              </div>
              <button onClick={() => setReconcileModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReconcileSubmit} className="space-y-3 text-xs">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-emerald-300">
                <p className="text-xs font-semibold">Expected Cash Collection:</p>
                <p className="text-xl font-extrabold font-mono text-emerald-400">
                  {formatMMK(reconcileDelivery.cod_amount_expected)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Rider: {reconcileDelivery.rider_name || 'N/A'}</p>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Actual Amount Remitted (MMK)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={reconcileAmount}
                  onChange={(e) => setReconcileAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm font-bold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Deposit Cash To Financial Account</label>
                <select
                  value={depositAccountId}
                  onChange={(e) => setDepositAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.account_name} ({formatMMK(a.current_balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Settlement Note / Reference</label>
                <input
                  type="text"
                  value={referenceNote}
                  onChange={(e) => setReferenceNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReconcileModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
                >
                  Confirm Cash Reconciliation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Township Modal */}
      {addTownshipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Add New Delivery Rate</h3>
                  <p className="text-[11px] text-slate-400 font-medium">မြို့နယ် ပို့ခနှုန်းထား အသစ်ထည့်သွင်းခြင်း</p>
                </div>
              </div>
              <button onClick={() => setAddTownshipModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTownship} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">State / Division <span className="text-rose-400">*</span></label>
                  <select
                    value={createDivision}
                    onChange={(e) => setCreateDivision(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Yangon">Yangon (ရန်ကုန်)</option>
                    <option value="Mandalay">Mandalay (မန္တလေး)</option>
                    <option value="Naypyidaw">Naypyidaw (နေပြည်တော်)</option>
                    <option value="Bago">Bago (ပဲခူး)</option>
                    <option value="Shan State">Shan State (ရှမ်းပြည်နယ်)</option>
                    <option value="Ayeyarwady">Ayeyarwady (ဧရာဝတီ)</option>
                    <option value="Sagaing">Sagaing (စစ်ကိုင်း)</option>
                    <option value="Magway">Magway (မကွေး)</option>
                    <option value="Mon State">Mon State (မွန်ပြည်နယ်)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">City <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Yangon, Mandalay"
                    value={createCity}
                    onChange={(e) => setCreateCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Township (English) <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hlaing"
                    value={createNameEn}
                    onChange={(e) => setCreateNameEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Township (Burmese / မြန်မာ)</label>
                  <input
                    type="text"
                    placeholder="e.g. လှိုင်"
                    value={createNameMm}
                    onChange={(e) => setCreateNameMm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Delivery Fee (MMK) <span className="text-rose-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    placeholder="2500"
                    value={createFee}
                    onChange={(e) => setCreateFee(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Turnaround (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={createDays}
                    onChange={(e) => setCreateDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-2 pt-1">
                  <label className="flex items-center space-x-2.5 cursor-pointer bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={createIsCod}
                      onChange={(e) => setCreateIsCod(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 border-slate-700 bg-slate-900"
                    />
                    <div>
                      <span className="text-slate-200 font-semibold block text-xs">Enable Cash on Delivery (COD)</span>
                      <span className="text-slate-400 text-[10px]">ဤမြို့နယ်သို့ COD ပို့ဆောင်မှု လက်ခံသည်</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddTownshipModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={townshipSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
                >
                  {townshipSubmitting ? 'Adding...' : 'Add Township Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Township Modal */}
      {editTownshipModalOpen && selectedTownship && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Edit Delivery Rate</h3>
                  <p className="text-[11px] text-slate-400 font-medium">မြို့နယ်နှင့် ပို့ခနှုန်းထား ပြင်ဆင်ခြင်း</p>
                </div>
              </div>
              <button onClick={() => setEditTownshipModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTownshipUpdate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">State / Division</label>
                  <input
                    type="text"
                    required
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">City</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Township (English) <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={editNameEn}
                    onChange={(e) => setEditNameEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Township (Burmese / မြန်မာ)</label>
                  <input
                    type="text"
                    value={editNameMm}
                    onChange={(e) => setEditNameMm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Standard Delivery Fee (MMK) <span className="text-rose-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={newFee}
                    onChange={(e) => setNewFee(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm font-bold text-emerald-400 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Estimated Turnaround (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={newDays}
                    onChange={(e) => setNewDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-2 pt-1">
                  <label className="flex items-center space-x-2.5 cursor-pointer bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={editIsCod}
                      onChange={(e) => setEditIsCod(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 border-slate-700 bg-slate-900"
                    />
                    <div>
                      <span className="text-slate-200 font-semibold block text-xs">Enable Cash on Delivery (COD)</span>
                      <span className="text-slate-400 text-[10px]">ဤမြို့နယ်သို့ COD ငွေကောက်ခံ ပို့ဆောင်ခွင့်ပြုသည်</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteTownship(selectedTownship)}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-semibold flex items-center space-x-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditTownshipModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={townshipSubmitting}
                    className="px-5 py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
                  >
                    {townshipSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
