import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { Product, Customer, Township, PaymentMethod, Order } from '../types';
import { api, formatMMK, hasPermission } from '../api/client';

interface CartItem {
  product: Product;
  variantId: string;
  variantName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
}

interface PosOrderPageProps {
  onOrderCreated: (order: Order) => void;
}

export const PosOrderPage: React.FC<PosOrderPageProps> = ({ onOrderCreated }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [townships, setTownships] = useState<Township[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Customer selection
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedTownship, setSelectedTownship] = useState<Township | null>(null);
  
  // Order info
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | string>('CASH_ON_DELIVERY');
  const [paymentReference, setPaymentReference] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [customerNotes, setCustomerNotes] = useState('');
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);
  const [selectedPmObj, setSelectedPmObj] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load products, townships, and payment methods
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, townRes, pmRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/deliveries/townships'),
        api.get('/payments/methods').catch(() => ({ payment_methods: [] })),
      ]);
      setProducts(prodRes.products || prodRes.data || []);
      setTownships(townRes.townships || []);
      if (townRes.townships && townRes.townships.length > 0) {
        setSelectedTownship(townRes.townships[0]);
      }
      // Filter out inactive methods client-side as extra safety
      const pms = (pmRes?.payment_methods || []).filter((p: any) => p.is_active !== false);
      setAvailableMethods(pms);
      if (pms.length > 0) {
        // Prefer COD/CASH_ON_DELIVERY as default; fall back to first active method
        const defaultMethod = pms.find((p: any) => p.type === 'COD' || p.type === 'CASH_ON_DELIVERY') || pms[0];
        setSelectedPmObj(defaultMethod);
        // Always send type code to backend (e.g. 'CASH_ON_DELIVERY', 'KBZPAY'), NOT the display name
        setPaymentMethod(defaultMethod.type === 'COD' || defaultMethod.type === 'CASH_ON_DELIVERY'
          ? 'CASH_ON_DELIVERY'
          : defaultMethod.type);
      }
    } catch (err) {
      console.error('Failed to load POS data:', err);
    }
  };

  // Search customers by phone or name
  useEffect(() => {
    if (customerSearch.trim().length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.get(`/customers?search=${encodeURIComponent(customerSearch)}&limit=5`);
          setCustomerResults(res.customers || []);
        } catch (err) {
          console.error(err);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setCustomerResults([]);
    }
  }, [customerSearch]);

  const selectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setRecipientName(cust.full_name);
    setRecipientPhone(cust.phone);
    setDeliveryAddress(cust.address);
    if (cust.township_name) {
      const found = townships.find(t => t.name_en.toLowerCase() === cust.township_name?.toLowerCase());
      if (found) setSelectedTownship(found);
    }
    setCustomerResults([]);
    setCustomerSearch('');
  };

  // Cart operations
  const addToCart = (product: Product, variantId?: string) => {
    setErrorMessage('');
    const targetVariant = product.variants?.find(v => v.id === variantId) || product.variants?.[0];
    const available = targetVariant ? targetVariant.stock_quantity : (product.total_stock || 0);

    if (available <= 0) {
      setErrorMessage(`"${product.name}" is currently out of stock.`);
      return;
    }

    const price = parseFloat(String(product.sale_price)) + parseFloat(String(targetVariant?.additional_price || '0'));
    const vId = targetVariant ? targetVariant.id : product.id;
    const vName = targetVariant ? targetVariant.variant_name : 'Standard';
    const vSku = targetVariant ? targetVariant.sku : product.sku;

    setCart(prev => {
      const existing = prev.find(item => item.variantId === vId);
      if (existing) {
        if (existing.quantity >= available) {
          setErrorMessage(`Only ${available} units available in stock.`);
          return prev;
        }
        return prev.map(item => 
          item.variantId === vId ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, {
          product,
          variantId: vId,
          variantName: vName,
          sku: vSku,
          unitPrice: price,
          quantity: 1,
          availableStock: available,
        }];
      }
    });
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.variantId === variantId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.availableStock) {
          setErrorMessage(`Cannot exceed available stock of ${item.availableStock}`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (variantId: string) => {
    setCart(prev => prev.filter(item => item.variantId !== variantId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const deliveryFee = selectedTownship ? parseFloat(String(selectedTownship.standard_delivery_fee)) : 0;
  const netTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  // Submit Order
  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      setErrorMessage('Please add at least one product to the order.');
      return;
    }

    if (!recipientName.trim() || !recipientPhone.trim() || !deliveryAddress.trim()) {
      setErrorMessage('Please provide customer name, phone number, and delivery address.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const orderPayload = {
        customer_id: selectedCustomer?.id || null,
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim(),
        delivery_address: deliveryAddress.trim(),
        township_id: selectedTownship?.id || null,
        township_name: selectedTownship?.name_en || 'Yangon',
        payment_method: paymentMethod,
        payment_reference: paymentReference || null,
        discount_amount: discountAmount,
        delivery_fee: deliveryFee,
        customer_notes: customerNotes || null,
        items: cart.map(it => ({
          product_id: it.product.id,
          variant_id: it.variantId,
          quantity: it.quantity,
          unit_price: it.unitPrice,
        })),
      };

      const res = await api.post('/orders', orderPayload);
      if (res.success && res.order) {
        const fullRes = await api.get(`/orders/${res.order.id}`);
        onOrderCreated(fullRes.order);
        setCart([]);
        setSelectedCustomer(null);
        setRecipientName('');
        setRecipientPhone('');
        setDeliveryAddress('');
        setDiscountAmount(0);
        setCustomerNotes('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.name_mm && p.name_mm.includes(productSearch));
    const matchCat = categoryFilter ? p.category_name === categoryFilter : true;
    return matchSearch && matchCat;
  });

  const uniqueCategories = Array.from(new Set(products.map(p => p.category_name).filter(Boolean)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
      {/* Product Catalog Picker (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Filters */}
        <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search products by Name, SKU, Burmese (လက်ဖက်, အင်္ကျီ)..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Categories (အားလုံး)</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat as string}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Product Cards Grid - Consistent Aspect Ratios & Equal Heights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredProducts.map(p => {
            const hasStock = (p.total_stock || 0) > 0;
            return (
              <div
                key={p.id}
                className={`glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-brand-500/50 transition-all ${
                  !hasStock ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div>
                  <div className="relative h-32 w-full bg-slate-800 rounded-lg overflow-hidden mb-2.5">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                        No Image
                      </div>
                    )}
                    <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow ${
                      hasStock ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {hasStock ? `${p.total_stock} in stock` : 'Out of Stock'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-100 text-xs line-clamp-1 h-4">{p.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{p.name_mm || p.category_name}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">SKU: {p.sku}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="font-mono font-extrabold text-sm text-brand-400">
                    {formatMMK(p.sale_price)}
                  </span>

                  {p.variants && p.variants.length > 1 ? (
                    <div className="flex flex-wrap gap-1 justify-end max-w-[65%]">
                      {p.variants.map(v => (
                        <button
                          key={v.id}
                          disabled={v.stock_quantity <= 0}
                          onClick={() => addToCart(p, v.id)}
                          title={`${v.variant_name} (${v.stock_quantity} in stock)`}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white rounded text-[10px] font-semibold transition-colors disabled:opacity-30"
                        >
                          {v.variant_name.replace('Size: ', '').replace('Color: ', '')}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(p)}
                      disabled={!hasStock}
                      className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POS Cart & Checkout (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-brand-400" />
              <h3 className="font-bold text-white text-base">New Order / Checkout</h3>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-semibold">
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>

          {errorMessage && (
            <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Customer Search & Info */}
          <div className="space-y-3 mb-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer Details (ဖောက်သည် အချက်အလက်)
              </span>
              {selectedCustomer && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  {selectedCustomer.loyalty_tier} VIP
                </span>
              )}
            </div>

            {/* Quick Customer Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search customer by Phone (09...) or Name..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />

              {customerResults.length > 0 && (
                <div className="absolute left-0 right-0 top-9 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 divide-y divide-slate-800 overflow-hidden">
                  {customerResults.map(c => (
                    <div
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="p-2.5 hover:bg-slate-800 cursor-pointer text-xs"
                    >
                      <div className="font-semibold text-white flex justify-between">
                        <span>{c.full_name}</span>
                        <span className="text-slate-400 font-mono">{c.phone}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{c.address}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Recipient Name</label>
                <input
                  type="text"
                  placeholder="Daw Mya Mya"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Phone (Viber)</label>
                <input
                  type="text"
                  placeholder="09250011223"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] text-slate-400 block mb-0.5">Township (မြို့နယ် - ပို့ခတွက်ရန်)</label>
                <select
                  value={selectedTownship?.id || ''}
                  onChange={(e) => {
                    const found = townships.find(t => t.id === e.target.value);
                    if (found) setSelectedTownship(found);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
                >
                  {townships.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name_en} ({t.name_mm}) - {formatMMK(t.standard_delivery_fee)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-[10px] text-slate-400 block mb-0.5">Delivery Address</label>
                <input
                  type="text"
                  placeholder="Street, Room/Building number..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Cart Items Table */}
          <div className="space-y-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Order Items ({cart.length})
            </span>

            {cart.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No items added yet. Click "+ Add" on any product to start.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.variantId} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-100 truncate">{item.product.name}</p>
                      <p className="text-[11px] text-slate-400">{item.variantName}</p>
                      <span className="text-brand-400 font-mono font-bold">{formatMMK(item.unitPrice)}</span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700">
                        <button
                          onClick={() => updateQuantity(item.variantId, -1)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-bold text-white text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, 1)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Payment Method & Summary */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Myanmar Payment Method (ငွေပေးချေမှု နည်းလမ်း)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(availableMethods.length > 0 ? availableMethods : [
                  { id: '1', name: 'Cash on Delivery (COD)', name_mm: 'ပစ္စည်းရောက်မှ ငွေချေ', type: 'COD' },
                  { id: '2', name: 'KBZPay (Kpay)', name_mm: 'ကေဘီဇက်ပေး', type: 'KBZPAY' },
                  { id: '3', name: 'Wave Money (WavePay)', name_mm: 'ဝေ့ဗ်မနီ', type: 'WAVEMONEY' },
                  { id: '4', name: 'AYA Pay', name_mm: 'ဧရာပေး', type: 'AYAPAY' },
                  { id: '5', name: 'CB Pay', name_mm: 'စီဘီပေး', type: 'CBPAY' },
                ]).map((pm: any) => {
                  const isSelected = selectedPmObj?.id === pm.id ||
                    (pm.type === 'COD' || pm.type === 'CASH_ON_DELIVERY' ? paymentMethod === 'CASH_ON_DELIVERY' : paymentMethod === pm.type);
                  return (
                    <button
                      key={pm.id || pm.name}
                      type="button"
                      onClick={() => {
                        setSelectedPmObj(pm);
                        // Send type code to backend, NOT the human-readable display name
                        setPaymentMethod(pm.type === 'COD' || pm.type === 'CASH_ON_DELIVERY'
                          ? 'CASH_ON_DELIVERY'
                          : pm.type);
                      }}
                      className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-brand-600/20 text-white border-brand-500 shadow-md shadow-brand-500/10'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-[11px] leading-tight block truncate text-slate-100">{pm.name}</span>
                      {pm.name_mm && (
                        <span className="text-[10px] text-brand-300 block truncate mt-0.5">{pm.name_mm}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Method Details Box */}
              {selectedPmObj && selectedPmObj.type !== 'COD' && selectedPmObj.type !== 'CASH_ON_DELIVERY' && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-1 text-[11px]">
                  {selectedPmObj.account_name && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Name:</span>
                      <span className="font-semibold text-slate-200">{selectedPmObj.account_name}</span>
                    </div>
                  )}
                  {selectedPmObj.account_number && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Number / Phone:</span>
                      <span className="font-mono font-bold text-brand-400">{selectedPmObj.account_number}</span>
                    </div>
                  )}
                  {selectedPmObj.instruction && (
                    <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
                      {selectedPmObj.instruction}
                    </p>
                  )}
                  {selectedPmObj.qr_code_url && (
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Scan to Pay QR:</span>
                      <button
                        type="button"
                        onClick={() => setShowQrModal(!showQrModal)}
                        className="text-[10px] text-brand-400 hover:underline font-semibold"
                      >
                        {showQrModal ? 'Hide QR Code' : 'View QR Code'}
                      </button>
                    </div>
                  )}
                  {showQrModal && selectedPmObj.qr_code_url && (
                    <div className="p-2 bg-white rounded-lg flex justify-center mt-1">
                      <img src={selectedPmObj.qr_code_url} alt="Payment QR" className="w-28 h-28 object-contain" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {paymentMethod !== 'CASH_ON_DELIVERY' && (
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Payment Transaction Ref # (Screenshots / Last 4 Digits)</label>
                <input
                  type="text"
                  placeholder="KP2026... / Transaction ID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            {/* Financial summary calculations */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal:</span>
                <span className="font-mono text-slate-200 font-semibold">{formatMMK(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery Fee ({selectedTownship?.name_en || 'Township'}):</span>
                <span className="font-mono text-slate-200 font-semibold">{formatMMK(deliveryFee)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Discount (Ks):</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 text-right bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-rose-400 font-mono focus:outline-none"
                />
              </div>
              <div className="border-t border-slate-800 pt-1.5 flex justify-between font-extrabold text-sm text-white">
                <span>Net Total:</span>
                <span className="font-mono text-emerald-400 text-base">{formatMMK(netTotal)}</span>
              </div>
            </div>

            {hasPermission('order:create') ? (
              <button
                onClick={handleCreateOrder}
                disabled={submitting || cart.length === 0}
                className="w-full mt-3 py-2.5 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? 'Processing Order...' : 'Confirm Order & Issue Invoice'}</span>
              </button>
            ) : (
              <div className="w-full mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold text-center">
                Order Creation Restricted (အော်ဒါဖွင့်ခွင့် မရှိပါ)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
