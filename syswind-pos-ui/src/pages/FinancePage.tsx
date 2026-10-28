import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  Plus, 
  CreditCard, 
  PieChart, 
  X,
  Receipt,
  QrCode,
  Trash2,
  Edit,
  CheckCircle2,
  Eye,
  Building2
} from 'lucide-react';
import { FinancialAccount, Transaction, Expense, PaymentMethodItem } from '../types';
import { api, formatMMK, formatDate, hasPermission } from '../api/client';
import { ImageUpload } from '../components/ImageUpload';

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pnl' | 'transactions' | 'expenses' | 'accounts' | 'payment_methods'>('pnl');
  const [summary, setSummary] = useState<any>(null);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Payment Methods Modals & Form
  const [addMethodModalOpen, setAddMethodModalOpen] = useState(false);
  const [editMethodModalOpen, setEditMethodModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodItem | null>(null);
  const [pmName, setPmName] = useState('');
  const [pmNameMm, setPmNameMm] = useState('');
  const [pmType, setPmType] = useState<string>('MOBILE_WALLET');
  const [pmAccountName, setPmAccountName] = useState('');
  const [pmAccountNumber, setPmAccountNumber] = useState('');
  const [pmQrUrl, setPmQrUrl] = useState('');
  const [pmLogoUrl, setPmLogoUrl] = useState('');
  const [pmInstruction, setPmInstruction] = useState('');
  const [pmIsActive, setPmIsActive] = useState(true);
  const [pmSortOrder, setPmSortOrder] = useState<number>(1);
  const [pmSubmitting, setPmSubmitting] = useState(false);

  // QR Preview Modal
  const [qrPreviewModalOpen, setQrPreviewModalOpen] = useState(false);
  const [previewQrUrl, setPreviewQrUrl] = useState('');
  const [previewMethodName, setPreviewMethodName] = useState('');

  // New Expense Modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('PACKAGING');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expMethod, setExpMethod] = useState('KBZPAY');
  const [expAccountId, setExpAccountId] = useState('');
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // Fund Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [srcAccountId, setSrcAccountId] = useState('');
  const [destAccountId, setDestAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferNote, setTransferNote] = useState('');

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const [sumRes, accRes, txnRes, expRes, trendRes, pmRes] = await Promise.all([
        api.get('/finance/summary'),
        api.get('/finance/accounts'),
        api.get('/finance/transactions?limit=100'),
        api.get('/finance/expenses'),
        api.get('/finance/trends'),
        api.get('/payments/methods').catch(() => ({ payment_methods: [] })),
      ]);

      setSummary(sumRes.summary);
      setAccounts(accRes.accounts || []);
      setTransactions(txnRes.transactions || []);
      setExpenses(expRes.expenses || []);
      setTrends(trendRes);
      setPaymentMethods(pmRes?.payment_methods || []);

      if (accRes.accounts?.length > 0 && !expAccountId) {
        setExpAccountId(accRes.accounts[0].id);
        setSrcAccountId(accRes.accounts[0].id);
        if (accRes.accounts.length > 1) {
          setDestAccountId(accRes.accounts[1].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const openAddMethodModal = () => {
    setPmName('');
    setPmNameMm('');
    setPmType('MOBILE_WALLET');
    setPmAccountName('');
    setPmAccountNumber('');
    setPmQrUrl('');
    setPmLogoUrl('');
    setPmInstruction('');
    setPmIsActive(true);
    setPmSortOrder(paymentMethods.length + 1);
    setAddMethodModalOpen(true);
  };

  const openEditMethodModal = (pm: PaymentMethodItem) => {
    setSelectedMethod(pm);
    setPmName(pm.name || '');
    setPmNameMm(pm.name_mm || '');
    setPmType(pm.type || 'MOBILE_WALLET');
    setPmAccountName(pm.account_name || '');
    setPmAccountNumber(pm.account_number || '');
    setPmQrUrl(pm.qr_code_url || '');
    setPmLogoUrl(pm.logo_url || '');
    setPmInstruction(pm.instruction || '');
    setPmIsActive(pm.is_active ?? true);
    setPmSortOrder(pm.sort_order ?? 1);
    setEditMethodModalOpen(true);
  };

  const handleCreatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmName.trim()) {
      alert('Please enter payment method name');
      return;
    }
    try {
      setPmSubmitting(true);
      await api.post('/payments/methods', {
        name: pmName.trim(),
        name_mm: pmNameMm.trim() || null,
        type: pmType,
        account_name: pmAccountName.trim() || null,
        account_number: pmAccountNumber.trim() || null,
        qr_code_url: pmQrUrl || null,
        logo_url: pmLogoUrl || null,
        instruction: pmInstruction.trim() || null,
        is_active: pmIsActive,
        sort_order: pmSortOrder,
      });
      setAddMethodModalOpen(false);
      loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Failed to create payment method');
    } finally {
      setPmSubmitting(false);
    }
  };

  const handleUpdatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) return;
    try {
      setPmSubmitting(true);
      await api.put(`/payments/methods/${selectedMethod.id}`, {
        name: pmName.trim(),
        name_mm: pmNameMm.trim() || null,
        type: pmType,
        account_name: pmAccountName.trim() || null,
        account_number: pmAccountNumber.trim() || null,
        qr_code_url: pmQrUrl || null,
        logo_url: pmLogoUrl || null,
        instruction: pmInstruction.trim() || null,
        is_active: pmIsActive,
        sort_order: pmSortOrder,
      });
      setEditMethodModalOpen(false);
      setSelectedMethod(null);
      loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment method');
    } finally {
      setPmSubmitting(false);
    }
  };

  const handleTogglePaymentMethod = async (id: string) => {
    try {
      await api.patch(`/payments/methods/${id}/toggle`, {});
      loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDeletePaymentMethod = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete payment method "${name}"?`)) return;
    try {
      await api.delete(`/payments/methods/${id}`);
      loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete payment method');
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/expenses', {
        title: expTitle,
        category: expCategory,
        amount: expAmount,
        payment_method: expMethod,
        account_id: expAccountId,
        paid_to: expPaidTo || null,
        notes: expNotes || null,
      });

      setExpenseModalOpen(false);
      loadFinanceData();
      // Reset
      setExpTitle('');
      setExpAmount(0);
      setExpPaidTo('');
      setExpNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to record expense');
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (srcAccountId === destAccountId) {
      alert('Source and destination accounts must be different.');
      return;
    }

    try {
      await api.post('/finance/transactions', {
        transaction_type: 'TRANSFER',
        source_account_id: srcAccountId,
        destination_account_id: destAccountId,
        amount: transferAmount,
        category: 'Inter-Account Transfer',
        description: transferNote || 'Fund transfer between accounts',
      });

      setTransferModalOpen(false);
      loadFinanceData();
      alert('Transfer completed successfully!');
    } catch (err: any) {
      alert(err.message || 'Transfer failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Tab Controls */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('pnl')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'pnl'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Profit & Loss (အမြတ်/အရှုံး)</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'accounts'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Accounts & Wallets ({accounts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'transactions'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>General Ledger (လယ်ဂျာ)</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'expenses'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Expenses (ကုန်ကျစရိတ်)</span>
          </button>

          <button
            onClick={() => setActiveTab('payment_methods')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'payment_methods'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Payment Methods ({paymentMethods.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto shrink-0">
          {activeTab === 'payment_methods' ? (
            hasPermission('payment:manage') && (
              <button
                onClick={openAddMethodModal}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Payment Method</span>
              </button>
            )
          ) : (
            <>
              {hasPermission('finance:expense_record') && (
                <button
                  onClick={() => setTransferModalOpen(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center space-x-1"
                >
                  <ArrowUpRight className="w-4 h-4 text-brand-400" />
                  <span>Transfer Funds</span>
                </button>
              )}

              {hasPermission('finance:expense_record') && (
                <button
                  onClick={() => setExpenseModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Expense</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 1. P&L Statement Tab */}
      {activeTab === 'pnl' && (
        <div className="space-y-5">
          {/* Key Financial KPIs - Uniform Heights & Text Alignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between min-h-[110px]">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Paid Revenue (ရောင်းရငွေ)</span>
              <p className="text-xl font-black text-white font-mono my-1">{formatMMK(summary?.paid_revenue)}</p>
              <span className="text-[10px] text-emerald-400 font-medium">Confirmed orders</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between min-h-[110px]">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">COGS (ကုန်ကျစရိတ် မူရင်း)</span>
              <p className="text-xl font-black text-slate-300 font-mono my-1">{formatMMK(summary?.cogs)}</p>
              <span className="text-[10px] text-slate-400 font-medium">Product unit costs</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between min-h-[110px]">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Gross Profit (အကြမ်းဖျင်းအမြတ်)</span>
              <p className="text-xl font-black text-blue-400 font-mono my-1">{formatMMK(summary?.gross_profit)}</p>
              <span className="text-[10px] text-blue-300 font-medium">Revenue minus COGS</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between min-h-[110px]">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Operating Expenses</span>
              <p className="text-xl font-black text-rose-400 font-mono my-1">{formatMMK(summary?.total_expenses)}</p>
              <span className="text-[10px] text-rose-300 font-medium">Rent, Ads, Packaging</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex flex-col justify-between min-h-[110px]">
              <span className="text-[10px] font-bold uppercase text-emerald-300 tracking-wider">Net Profit (အသားတင်အမြတ်)</span>
              <p className="text-2xl font-black text-emerald-400 font-mono my-1">{formatMMK(summary?.net_profit)}</p>
              <span className="text-[10px] text-emerald-400 font-semibold">Actual bottom-line</span>
            </div>
          </div>

          {/* Breakdown & Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Expense Categories Breakdown */}
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-brand-400" />
                <span>Operating Expense Breakdown (လည်ပတ်စရိတ်များ)</span>
              </h3>

              <div className="space-y-2.5">
                {summary?.expense_by_category && summary.expense_by_category.map((cat: any) => (
                  <div key={cat.category} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-200">{cat.category.replace(/_/g, ' ')}</p>
                      <span className="text-[10px] text-slate-400">{cat.count} records</span>
                    </div>
                    <span className="font-mono font-bold text-rose-400">{formatMMK(cat.total_expenses)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods Distribution */}
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Payment Channel Volumes (ငွေပေးချေမှုပုံစံများ)</span>
              </h3>

              <div className="space-y-2.5">
                {trends?.payment_methods && trends.payment_methods.map((pm: any) => (
                  <div key={pm.payment_method} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-200">{pm.payment_method.replace(/_/g, ' ')}</p>
                      <span className="text-[10px] text-slate-400">{pm.count} orders processed</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">{formatMMK(pm.total_amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {acc.account_code}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                    {acc.account_type}
                  </span>
                </div>
                <h4 className="font-bold text-white text-base">{acc.account_name}</h4>
                <p className="text-xs text-slate-400">{acc.account_name_mm}</p>
                {acc.account_number && (
                  <p className="text-xs text-slate-400 font-mono mt-1">A/C: {acc.account_number}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Balance:</span>
                <span className="text-xl font-extrabold font-mono text-emerald-400">
                  {formatMMK(acc.current_balance)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. General Ledger Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              General Ledger Records (အထွေထွေ လယ်ဂျာ ဝင်/ထွက် စာရင်း)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-4">Txn #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Source / Destination Account</th>
                  <th className="py-3 px-4">Description / Reference</th>
                  <th className="py-3 px-4 text-right">Amount (MMK)</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-slate-800/40 text-slate-300">
                    <td className="py-3 px-4 font-mono font-bold text-white">{txn.transaction_number}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{formatDate(txn.transaction_date)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        txn.transaction_type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-300' :
                        txn.transaction_type === 'EXPENSE' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {txn.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {txn.source_account_name && (
                        <div className="text-[11px] text-slate-400">From: {txn.source_account_name}</div>
                      )}
                      {txn.dest_account_name && (
                        <div className="text-[11px] text-emerald-400">To: {txn.dest_account_name}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                      {txn.description}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${
                      txn.transaction_type === 'INCOME' ? 'text-emerald-400' :
                      txn.transaction_type === 'EXPENSE' ? 'text-rose-400' : 'text-blue-300'
                    }`}>
                      {txn.transaction_type === 'INCOME' ? '+' : txn.transaction_type === 'EXPENSE' ? '-' : ''}
                      {formatMMK(txn.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{txn.created_by_name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Operating Expenses Trail (ကုန်ကျစရိတ် မှတ်တမ်းများ)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Expense Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Paid To</th>
                  <th className="py-3 px-4 text-right">Amount (MMK)</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 text-slate-300">
                    <td className="py-3 px-4 font-mono text-slate-400">{exp.expense_date}</td>
                    <td className="py-3 px-4 font-semibold text-white">{exp.title}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {exp.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{exp.payment_method}</td>
                    <td className="py-3 px-4 text-slate-400">{exp.paid_to || 'N/A'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      -{formatMMK(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{exp.created_by_name || 'Accountant'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Payment Methods Tab */}
      {activeTab === 'payment_methods' && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Methods</span>
              <p className="text-xl font-black text-white font-mono my-1">{paymentMethods.length}</p>
              <span className="text-[10px] text-brand-400 font-medium">Configured gateways</span>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Mobile Wallets</span>
              <p className="text-xl font-black text-emerald-400 font-mono my-1">
                {paymentMethods.filter(p => p.type === 'MOBILE_WALLET').length}
              </p>
              <span className="text-[10px] text-emerald-300 font-medium">KBZPay, WaveMoney, etc.</span>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Bank Accounts</span>
              <p className="text-xl font-black text-blue-400 font-mono my-1">
                {paymentMethods.filter(p => p.type === 'BANK_TRANSFER').length}
              </p>
              <span className="text-[10px] text-blue-300 font-medium">KBZ, AYA, CB Bank</span>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Active Status</span>
              <p className="text-xl font-black text-amber-400 font-mono my-1">
                {paymentMethods.filter(p => p.is_active).length} / {paymentMethods.length}
              </p>
              <span className="text-[10px] text-amber-300 font-medium">Available at checkout</span>
            </div>
          </div>

          {/* Payment Methods Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((pm) => (
              <div 
                key={pm.id} 
                className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  pm.is_active ? 'border-slate-800 bg-slate-900/60' : 'border-slate-800/40 bg-slate-950/40 opacity-75'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center overflow-hidden shrink-0">
                        {pm.logo_url ? (
                          <img src={pm.logo_url} alt={pm.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <QrCode className="w-6 h-6 text-brand-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-white text-sm">{pm.name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            pm.type === 'MOBILE_WALLET' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            pm.type === 'BANK_TRANSFER' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            pm.type === 'CASH_ON_DELIVERY' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-slate-700/50 text-slate-300'
                          }`}>
                            {pm.type.replace('_', ' ')}
                          </span>
                        </div>
                        {pm.name_mm && (
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{pm.name_mm}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleTogglePaymentMethod(pm.id)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                        pm.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                      }`}
                      title="Click to toggle active status"
                    >
                      {pm.is_active ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>

                  {/* Account Details Box */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2 mb-3 text-xs">
                    {pm.account_name && (
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400">Account Name:</span>
                        <span className="font-semibold text-white">{pm.account_name}</span>
                      </div>
                    )}
                    {pm.account_number && (
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400">Account / Phone:</span>
                        <span className="font-mono font-bold text-brand-300 tracking-wider">{pm.account_number}</span>
                      </div>
                    )}
                    {pm.instruction && (
                      <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
                        {pm.instruction}
                      </div>
                    )}
                  </div>

                  {/* QR Code Preview Thumbnail */}
                  {pm.qr_code_url && (
                    <div 
                      onClick={() => {
                        setPreviewQrUrl(pm.qr_code_url!);
                        setPreviewMethodName(pm.name);
                        setQrPreviewModalOpen(true);
                      }}
                      className="cursor-pointer group flex items-center space-x-3 p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 transition-colors mb-3"
                    >
                      <img 
                        src={pm.qr_code_url} 
                        alt="QR Code" 
                        className="w-12 h-12 object-contain rounded-lg border border-slate-700 bg-white p-0.5 shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-brand-300 transition-colors flex items-center space-x-1">
                          <span>Payment QR Attached</span>
                          <Eye className="w-3.5 h-3.5" />
                        </p>
                        <p className="text-[10px] text-slate-400">Click to view or scan full QR</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800/60 mt-2">
                  {pm.qr_code_url && (
                    <button
                      onClick={() => {
                        setPreviewQrUrl(pm.qr_code_url!);
                        setPreviewMethodName(pm.name);
                        setQrPreviewModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center space-x-1 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5 text-brand-400" />
                      <span>QR</span>
                    </button>
                  )}
                  {hasPermission('payment:manage') && (
                    <button
                      onClick={() => openEditMethodModal(pm)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-400" />
                      <span>Edit</span>
                    </button>
                  )}
                  {hasPermission('payment:manage') && (
                    <button
                      onClick={() => handleDeletePaymentMethod(pm.id, pm.name)}
                      className="px-3 py-1.5 bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {paymentMethods.length === 0 && (
            <div className="text-center py-12 glass-panel rounded-2xl border border-slate-800">
              <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-bold text-sm">No payment methods found</p>
              <p className="text-slate-500 text-xs mt-1">Configure your shop's mobile wallets, QR codes, or bank accounts.</p>
              {hasPermission('payment:manage') && (
                <button
                  onClick={openAddMethodModal}
                  className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl"
                >
                  Add First Payment Method
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Record Expense Modal */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Record Operating Expense</h3>
              <button onClick={() => setExpenseModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Expense Title (ခေါင်းစဉ်)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Poly Mailer Bags Bulk Purchase"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="PACKAGING">Packaging (ထုပ်ပိုးပစ္စည်း)</option>
                    <option value="MARKETING_ADS">Marketing / Facebook Ads</option>
                    <option value="RENT">Rent (ဆိုင်/ဂိုဒေါင် ငှားရမ်းခ)</option>
                    <option value="LOGISTICS">Logistics / Delivery Coupons</option>
                    <option value="SALARY">Staff Salary (လစာ)</option>
                    <option value="UTILITIES">Utilities (မီးဖိုး၊ ရေဖိုး)</option>
                    <option value="OTHER">Other Expenses</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Amount (MMK)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="95000"
                    value={expAmount}
                    onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Paid From Account</label>
                  <select
                    value={expAccountId}
                    onChange={(e) => setExpAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.account_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Payment Method</label>
                  <select
                    value={expMethod}
                    onChange={(e) => setExpMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="KBZPAY">KBZPay</option>
                    <option value="WAVEMONEY">WavePay</option>
                    <option value="CASH">Cash on Hand</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Paid To (Vendor / Person)</label>
                <input
                  type="text"
                  placeholder="Shwe Packaging Wholesale"
                  value={expPaidTo}
                  onChange={(e) => setExpPaidTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Transfer Funds Between Accounts</h3>
              <button onClick={() => setTransferModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">From Account (ငွေထုတ်မည့် အကောင့်)</label>
                <select
                  value={srcAccountId}
                  onChange={(e) => setSrcAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.account_name} ({formatMMK(a.current_balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">To Destination Account (ငွေသွင်းမည့် အကောင့်)</label>
                <select
                  value={destAccountId}
                  onChange={(e) => setDestAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.account_name} ({formatMMK(a.current_balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Transfer Amount (MMK)</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="500000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm font-bold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Transfer Note</label>
                <input
                  type="text"
                  placeholder="e.g. KBZPay shop counter withdrawal to main bank"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {addMethodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-white text-base">Add New Payment Method (ငွေပေးချေမှု နည်းလမ်းအသစ်)</h3>
              </div>
              <button onClick={() => setAddMethodModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePaymentMethod} className="space-y-4 text-xs">
              {/* Quick Myanmar Payment Presets */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-brand-400 block uppercase tracking-wider">
                  Quick Myanmar Payment Presets (အသုံးများသော နည်းလမ်းများ ချက်ချင်းဖြည့်ရန်):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'COD (ပစ္စည်းရောက်ငွေချေ)', name: 'Cash on Delivery (COD)', nameMm: 'ပစ္စည်းရောက်မှ ငွေချေ (COD)', type: 'CASH_ON_DELIVERY', inst: 'ပစ္စည်းပို့ဆောင်သူထံသို့ တိုက်ရိုက်ငွေချေပါ' },
                    { label: 'KBZPay (Kpay)', name: 'KBZPay (Kpay)', nameMm: 'ကေဘီဇက်ပေး (KPay)', type: 'MOBILE_WALLET', inst: 'ငွေလွှဲပြီးပါက screenshot သို့မဟုတ် Transaction နောက်ဆုံး ၄ လုံးပို့ပေးပါ' },
                    { label: 'Wave Money (WavePay)', name: 'Wave Money (WavePay)', nameMm: 'ဝေ့ဗ်မနီ (WavePay)', type: 'MOBILE_WALLET', inst: 'ငွေလွှဲပြီးပါက screenshot ပို့ပေးပါ' },
                    { label: 'AYA Pay', name: 'AYA Pay', nameMm: 'ဧရာပေး (AYA Pay)', type: 'MOBILE_WALLET', inst: 'ငွေလွှဲပြီးပါက screenshot ပို့ပေးပါ' },
                    { label: 'CB Pay', name: 'CB Pay', nameMm: 'စီဘီပေး (CB Pay)', type: 'MOBILE_WALLET', inst: 'ငွေလွှဲပြီးပါက screenshot ပို့ပေးပါ' },
                    { label: 'KBZ Mobile Banking', name: 'KBZ Mobile Banking', nameMm: 'ကမ္ဘောဇဘဏ်', type: 'BANK_TRANSFER', inst: 'KBZ Bank Account သို့ ငွေလွှဲပြီး screenshot ပို့ပေးပါ' },
                    { label: 'CB Bank Transfer', name: 'CB Bank Transfer', nameMm: 'စီဘီဘဏ်', type: 'BANK_TRANSFER', inst: 'CB Bank Account သို့ ငွေလွှဲပြီး screenshot ပို့ပေးပါ' },
                    { label: 'AYA Bank Transfer', name: 'AYA Bank Transfer', nameMm: 'ဧရာဝတီဘဏ်', type: 'BANK_TRANSFER', inst: 'AYA Bank Account သို့ ငွေလွှဲပြီး screenshot ပို့ပေးပါ' },
                    { label: 'UAB Pay', name: 'UAB Pay', nameMm: 'ယူအေဘီပေး', type: 'MOBILE_WALLET', inst: 'ငွေလွှဲပြီးပါက screenshot ပို့ပေးပါ' },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setPmName(preset.name);
                        setPmNameMm(preset.nameMm);
                        setPmType(preset.type);
                        setPmInstruction(preset.inst);
                      }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-brand-600 hover:text-white border border-slate-700/80 rounded-lg text-[10px] font-semibold text-slate-300 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Method Name (e.g. KBZPay, CB Bank) *</label>
                  <input
                    type="text"
                    required
                    placeholder="KBZPay Official"
                    value={pmName}
                    onChange={(e) => setPmName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Burmese Name (အမည် မြန်မာလို)</label>
                  <input
                    type="text"
                    placeholder="ကေဘီဇက်ပေး"
                    value={pmNameMm}
                    onChange={(e) => setPmNameMm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Gateway Type *</label>
                  <select
                    value={pmType}
                    onChange={(e) => setPmType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                  >
                    <option value="MOBILE_WALLET">Mobile Wallet (KBZPay, WaveMoney, AYA Pay)</option>
                    <option value="BANK_TRANSFER">Bank Transfer (KBZ, CB, AYA, Yoma)</option>
                    <option value="CASH_ON_DELIVERY">Cash on Delivery (COD)</option>
                    <option value="CARD">Debit / Credit Card (MPU, Visa)</option>
                    <option value="OTHER">Other Gateway</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    min="1"
                    value={pmSortOrder}
                    onChange={(e) => setPmSortOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Account Holder Name (အမည်)</label>
                  <input
                    type="text"
                    placeholder="U Kyaw Kyaw / Syswind Retail"
                    value={pmAccountName}
                    onChange={(e) => setPmAccountName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Account / Phone Number (နံပါတ်)</label>
                  <input
                    type="text"
                    placeholder="09971234567 or 01234567890"
                    value={pmAccountNumber}
                    onChange={(e) => setPmAccountNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Payment Instructions for Customer</label>
                <textarea
                  rows={2}
                  placeholder="ငွေလွှဲပြီးပါက screenshot သို့မဟုတ် Transaction နောက်ဆုံး ၄ လုံးပို့ပေးပါ"
                  value={pmInstruction}
                  onChange={(e) => setPmInstruction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <ImageUpload
                    label="Payment Logo / Brand Icon"
                    value={pmLogoUrl}
                    onChange={setPmLogoUrl}
                  />
                </div>
                <div>
                  <ImageUpload
                    label="Payment QR Code (Scan to Pay)"
                    value={pmQrUrl}
                    onChange={setPmQrUrl}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="addPmActive"
                  checked={pmIsActive}
                  onChange={(e) => setPmIsActive(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <label htmlFor="addPmActive" className="text-slate-300 font-medium cursor-pointer">
                  Activate this payment method immediately (ချက်ချင်း အသုံးပြုမည်)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  disabled={pmSubmitting}
                  onClick={() => setAddMethodModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pmSubmitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>{pmSubmitting ? 'Saving...' : 'Save Payment Method'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Method Modal */}
      {editMethodModalOpen && selectedMethod && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Edit className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Edit Payment Method ({selectedMethod.name})</h3>
              </div>
              <button onClick={() => setEditMethodModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePaymentMethod} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Method Name *</label>
                  <input
                    type="text"
                    required
                    value={pmName}
                    onChange={(e) => setPmName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Burmese Name</label>
                  <input
                    type="text"
                    value={pmNameMm}
                    onChange={(e) => setPmNameMm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Gateway Type</label>
                  <select
                    value={pmType}
                    onChange={(e) => setPmType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                  >
                    <option value="MOBILE_WALLET">Mobile Wallet (KBZPay, WaveMoney)</option>
                    <option value="BANK_TRANSFER">Bank Transfer (KBZ, CB, AYA)</option>
                    <option value="CASH_ON_DELIVERY">Cash on Delivery (COD)</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="OTHER">Other Gateway</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    min="1"
                    value={pmSortOrder}
                    onChange={(e) => setPmSortOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={pmAccountName}
                    onChange={(e) => setPmAccountName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Account / Phone Number</label>
                  <input
                    type="text"
                    value={pmAccountNumber}
                    onChange={(e) => setPmAccountNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Payment Instructions</label>
                <textarea
                  rows={2}
                  value={pmInstruction}
                  onChange={(e) => setPmInstruction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <ImageUpload
                    label="Payment Logo / Brand Icon"
                    value={pmLogoUrl}
                    onChange={setPmLogoUrl}
                  />
                </div>
                <div>
                  <ImageUpload
                    label="Payment QR Code (Scan to Pay)"
                    value={pmQrUrl}
                    onChange={setPmQrUrl}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="editPmActive"
                  checked={pmIsActive}
                  onChange={(e) => setPmIsActive(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <label htmlFor="editPmActive" className="text-slate-300 font-medium cursor-pointer">
                  Payment Method Active (အသုံးပြုရန် ဖွင့်ထားမည်)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  disabled={pmSubmitting}
                  onClick={() => setEditMethodModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pmSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{pmSubmitting ? 'Updating...' : 'Update Method'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Fullscreen / Enlarge Preview Modal */}
      {qrPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setQrPreviewModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                Official Payment QR
              </span>
              <h3 className="text-base font-bold text-white mt-2">{previewMethodName}</h3>
              <p className="text-xs text-slate-400">Scan this QR code to make payment</p>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mx-auto max-w-[260px] aspect-square">
              <img 
                src={previewQrUrl} 
                alt="Payment QR" 
                className="w-full h-full object-contain rounded-lg" 
              />
            </div>

            <div className="pt-2">
              <button
                onClick={() => setQrPreviewModalOpen(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
