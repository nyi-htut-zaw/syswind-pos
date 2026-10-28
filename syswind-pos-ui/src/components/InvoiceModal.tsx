import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, Package, MapPin, Phone, Calendar } from 'lucide-react';
import { Order, Organization } from '../types';
import { formatMMK, formatDate, api, getImageUrl } from '../api/client';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
  organization?: Organization | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose, organization: propOrg }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [org, setOrg] = useState<Organization | null>(propOrg || null);

  useEffect(() => {
    if (!org) {
      api.get('/organizations/current')
        .then(res => {
          if (res?.organization) setOrg(res.organization);
        })
        .catch(() => {});
    }
  }, [org]);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Bar */}
        <div className="no-print p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-white text-base">Receipt & Delivery Waybill</h3>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
              {order.order_number}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice (A4 / Thermal)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="print-invoice-area p-8 overflow-y-auto bg-white text-slate-900 flex-1">
          {/* Shop Header with Organization Logo & Info */}
          <div className="border-b-2 border-slate-200 pb-5 mb-5 flex justify-between items-start gap-4">
            <div className="flex items-start space-x-3.5">
              {/* Organization Logo from Database */}
              {org?.logo_url ? (
                <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white p-1 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                  <img 
                    src={getImageUrl(org.logo_url)} 
                    alt={org.name} 
                    className="w-full h-full object-contain" 
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xl shrink-0 shadow-sm">
                  {org?.name ? org.name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}

              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  {org?.name || 'SYSWIND ONLINE SHOP'}
                </h2>
                <p className="text-xs font-semibold text-emerald-700">
                  {org?.code ? `Org Code: ${org.code}` : 'အွန်လိုင်းအရောင်းနှင့် ပို့ဆောင်ရေး'}
                </p>
                {org?.address && (
                  <p className="text-xs text-slate-600 mt-1">
                    {org.address}, {org.city || 'Yangon'}
                  </p>
                )}
                <p className="text-xs text-slate-600">
                  {org?.phone ? `Hotline: ${org.phone}` : 'Hotline: 09-798881122'} 
                  {org?.email ? ` | Email: ${org.email}` : ''}
                </p>
                {org?.tax_number && (
                  <p className="text-[11px] font-mono text-slate-500">Tax Reg No: {org.tax_number}</p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block bg-slate-900 text-white font-bold text-xs uppercase px-3 py-1 rounded">
                Official Receipt / Invoice
              </span>
              <p className="font-mono text-sm font-bold text-slate-900 mt-2">{order.order_number}</p>
              <p className="text-xs text-slate-600">{formatDate(order.created_at)}</p>
              <div className="mt-2 inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase border border-slate-300 bg-slate-100">
                {order.payment_method.replace(/_/g, ' ')} ({order.payment_status})
              </div>
            </div>
          </div>

          {/* Delivery & Customer Info Card */}
          <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Recipient / Customer (ပို့ဆောင်ရမည့်သူ)
              </p>
              <p className="text-sm font-bold text-slate-900">{order.recipient_name || order.customer_name || 'Valued Customer'}</p>
              <p className="text-slate-700 font-mono font-medium mt-0.5">{order.recipient_phone || order.customer_phone}</p>
              {order.loyalty_tier && (
                <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  {order.loyalty_tier} VIP Customer
                </span>
              )}
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Delivery Destination (ပို့ဆောင်မည့် လိပ်စာ)
              </p>
              <p className="text-slate-800 font-medium">{order.delivery_address || 'Shop pickup / Standard address'}</p>
              <p className="text-slate-900 font-bold mt-1">Township: {order.township_name}</p>
              {order.rider_name && (
                <p className="text-slate-600 mt-1">Rider: {order.rider_name} ({order.rider_phone || 'N/A'})</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-xs mb-6 border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Amount (MMK)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items && order.items.length > 0 ? (
                order.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5">
                      <p className="font-semibold text-slate-900">{it.product_name}</p>
                      {it.variant_name && (
                        <p className="text-[11px] text-slate-500">{it.variant_name}</p>
                      )}
                      {it.sku && <p className="text-[10px] text-slate-400 font-mono">SKU: {it.sku}</p>}
                    </td>
                    <td className="py-2.5 text-center font-bold text-slate-800">{it.quantity}</td>
                    <td className="py-2.5 text-right font-mono text-slate-700">{formatMMK(it.unit_price)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatMMK(it.subtotal)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400">Order item details loaded from server.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Financial Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal (ပစ္စည်းတန်ဖိုး):</span>
                <span className="font-mono font-medium">{formatMMK(order.subtotal_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee (ပို့ဆောင်ခ):</span>
                <span className="font-mono font-medium">{formatMMK(order.delivery_fee)}</span>
              </div>
              {parseFloat(String(order.discount_amount)) > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount (လျှော့ဈေး):</span>
                  <span className="font-mono font-medium">-{formatMMK(order.discount_amount)}</span>
                </div>
              )}
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Net Total (ကျသင့်ငွေ):</span>
                <span className="font-mono text-base text-emerald-800">{formatMMK(order.total_amount)}</span>
              </div>
              {order.payment_method === 'CASH_ON_DELIVERY' && (
                <div className="bg-amber-100 text-amber-900 p-2 rounded mt-2 text-center font-bold text-[11px] border border-amber-300">
                  ⚠️ COD: Please collect {formatMMK(order.total_amount)} from recipient upon delivery.
                </div>
              )}
            </div>
          </div>

          {/* Footer & Thank you */}
          <div className="border-t border-slate-200 pt-4 text-center text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">ဝယ်ယူအားပေးမှုအတွက် အထူးပင် ကျေးဇူးတင်ရှိပါသည်။</p>
            <p>Thank you for choosing {org?.name || 'Syswind Online Shop'}. For inquiries or exchanges, please contact our Hotline within 3 days.</p>
            <p className="font-mono text-[9px] text-slate-400 pt-1">Printed via Syswind Enterprise Operations System • {order.order_number}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
