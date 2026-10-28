import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Boxes, 
  History, 
  ArrowUpDown, 
  X,
  FolderTree,
  FolderPlus,
  Tag,
  Edit,
  Trash2
} from 'lucide-react';
import { Product, Category } from '../types';
import { api, formatMMK, formatDate, hasPermission } from '../api/client';
import { ImageUpload } from '../components/ImageUpload';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'alerts' | 'logs'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Category Modal
  const [addCatModalOpen, setAddCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catNameMm, setCatNameMm] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catSubcategoriesInput, setCatSubcategoriesInput] = useState('');
  const [catSubmitting, setCatSubmitting] = useState(false);

  // Subcategory Modal
  const [addSubModalOpen, setAddSubModalOpen] = useState(false);
  const [targetCat, setTargetCat] = useState<Category | null>(null);
  const [subName, setSubName] = useState('');
  const [subNameMm, setSubNameMm] = useState('');
  const [subSubmitting, setSubSubmitting] = useState(false);

  // Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [changeType, setChangeType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN'>('STOCK_IN');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Add Product Modal
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNameMm, setNewNameMm] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newCostPrice, setNewCostPrice] = useState(0);
  const [newSalePrice, setNewSalePrice] = useState(0);
  const [newLowStock, setNewLowStock] = useState(5);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVariants, setNewVariants] = useState<Array<{ name: string; sku: string; stock: number; addPrice: number }>>([
    { name: 'Standard', sku: '', stock: 10, addPrice: 0 }
  ]);

  // Edit Product Modal
  const [editProductModalOpen, setEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameMm, setEditNameMm] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editCostPrice, setEditCostPrice] = useState(0);
  const [editSalePrice, setEditSalePrice] = useState(0);
  const [editLowStock, setEditLowStock] = useState(5);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVariants, setEditVariants] = useState<Array<{ id?: string; name: string; sku: string; stock: number; addPrice: number }>>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, alertRes, logRes] = await Promise.all([
        api.get(`/products?limit=100${search ? `&search=${encodeURIComponent(search)}` : ''}${categoryFilter ? `&category_id=${categoryFilter}` : ''}`),
        api.get('/products/categories'),
        api.get('/products/alerts'),
        api.get('/products/logs?limit=50'),
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.categories || []);
      setAlerts(alertRes.alerts || []);
      setLogs(logRes.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, categoryFilter]);

  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariantId(product.variants?.[0]?.id || '');
    setAdjustQty(1);
    setAdjustReason('');
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedVariantId) return;

    try {
      await api.post('/products/adjust-stock', {
        product_id: selectedProduct.id,
        variant_id: selectedVariantId,
        change_type: changeType,
        quantity: adjustQty,
        reason: adjustReason || 'Manual adjustment via dashboard',
      });
      setAdjustModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        name: newName,
        name_mm: newNameMm || null,
        sku: newSku,
        category_id: newCategoryId || null,
        cost_price: newCostPrice,
        sale_price: newSalePrice,
        low_stock_threshold: newLowStock,
        image_url: newImageUrl || null,
        variants: newVariants.map(v => ({
          variant_name: v.name,
          sku: v.sku || `${newSku}-${v.name.toUpperCase().replace(/\s+/g, '-')}`,
          stock_quantity: v.stock,
          additional_price: v.addPrice,
        })),
      });

      setAddProductModalOpen(false);
      loadData();
      // Reset form
      setNewName('');
      setNewSku('');
      setNewVariants([{ name: 'Standard', sku: '', stock: 10, addPrice: 0 }]);
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    }
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name || '');
    setEditNameMm(product.name_mm || '');
    setEditSku(product.sku || '');
    setEditCategoryId(product.category_id || '');
    setEditCostPrice(typeof product.cost_price === 'number' ? product.cost_price : parseFloat(String(product.cost_price)) || 0);
    setEditSalePrice(typeof product.sale_price === 'number' ? product.sale_price : parseFloat(String(product.sale_price)) || 0);
    setEditLowStock(product.low_stock_threshold || 5);
    setEditImageUrl(product.image_url || '');
    setEditDescription(product.description || '');
    setEditVariants(
      product.variants && product.variants.length > 0
        ? product.variants.map(v => ({
            id: v.id,
            name: v.variant_name,
            sku: v.sku,
            stock: v.stock_quantity,
            addPrice: typeof v.additional_price === 'number' ? v.additional_price : parseFloat(String(v.additional_price)) || 0,
          }))
        : [{ name: 'Standard Unit', sku: product.sku, stock: product.total_stock || 0, addPrice: 0 }]
    );
    setEditProductModalOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setEditSubmitting(true);
      await api.put(`/products/${editingProduct.id}`, {
        name: editName.trim(),
        name_mm: editNameMm.trim() || null,
        sku: editSku.trim(),
        category_id: editCategoryId || null,
        cost_price: editCostPrice,
        sale_price: editSalePrice,
        low_stock_threshold: editLowStock,
        image_url: editImageUrl || null,
        description: editDescription.trim() || null,
        variants: editVariants.map(v => ({
          id: v.id,
          variant_name: v.name,
          sku: v.sku || `${editSku}-${v.name.toUpperCase().replace(/\s+/g, '-')}`,
          stock_quantity: v.stock,
          additional_price: v.addPrice,
        })),
      });

      setEditProductModalOpen(false);
      setEditingProduct(null);
      loadData();
      alert('Product updated successfully! (ကုန်ပစ္စည်း အချက်အလက်နှင့် ဓာတ်ပုံ ပြင်ဆင်ပြီးပါပြီ)');
    } catch (err: any) {
      alert(err.message || 'Failed to update product');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Are you sure you want to remove "${p.name}"? (ကုန်ပစ္စည်း "${p.name}" အား စာရင်းမှ ဖျက်ရန် သေချာပါသလား?)`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      setEditProductModalOpen(false);
      setEditingProduct(null);
      loadData();
      alert('Product removed successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert('Category name is required.');
      return;
    }
    try {
      setCatSubmitting(true);
      const subs = catSubcategoriesInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      await api.post('/products/categories', {
        name: catName.trim(),
        name_mm: catNameMm.trim() || undefined,
        description: catDesc.trim() || undefined,
        subcategories: subs,
      });

      setAddCatModalOpen(false);
      setCatName('');
      setCatNameMm('');
      setCatDesc('');
      setCatSubcategoriesInput('');
      loadData();
      alert('Category created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCat || !subName.trim()) {
      alert('Subcategory name is required.');
      return;
    }
    try {
      setSubSubmitting(true);
      await api.post('/products/subcategories', {
        category_id: targetCat.id,
        name: subName.trim(),
        name_mm: subNameMm.trim() || undefined,
      });

      setAddSubModalOpen(false);
      setSubName('');
      setSubNameMm('');
      setTargetCat(null);
      loadData();
      alert('Subcategory added successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to add subcategory');
    } finally {
      setSubSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Tab Controls */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'products'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Product Catalog (ပစ္စည်းများ)</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'categories'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Categories & Subcategories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'alerts'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock Alerts ({alerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'logs'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Adjustment Logs (အဝင်/အထွက်)</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto shrink-0">
          {hasPermission('category:manage') && (
            <button
              onClick={() => setAddCatModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
            >
              <FolderPlus className="w-4 h-4 text-brand-400" />
              <span>+ Add Category</span>
            </button>
          )}

          {hasPermission('product:create') && (
            <button
              onClick={() => setAddProductModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product (ပစ္စည်းသစ်ထည့်ရန်)</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="glass-panel p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
              <input
                type="text"
                placeholder="Search products by SKU, English or Myanmar name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Categories (အမျိုးအစားစုံ)</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.name_mm})</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setAddCatModalOpen(true)}
                title="Create Category"
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs transition-colors shrink-0"
              >
                <FolderPlus className="w-4 h-4 text-brand-400" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[850px] border-collapse">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 w-[28%] whitespace-nowrap">Product Info</th>
                    <th className="py-3.5 px-4 w-[13%] whitespace-nowrap">Category</th>
                    <th className="py-3.5 px-4 w-[20%] whitespace-nowrap">Variants & SKUs</th>
                    <th className="py-3.5 px-4 w-[11%] text-right whitespace-nowrap">Cost (MMK)</th>
                    <th className="py-3.5 px-4 w-[11%] text-right whitespace-nowrap">Sale Price (MMK)</th>
                    <th className="py-3.5 px-4 w-[7%] text-center whitespace-nowrap">Stock Level</th>
                    <th className="py-3.5 px-4 w-[10%] text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products.map(p => {
                    const isLow = (p.total_stock || 0) <= p.low_stock_threshold;
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/80 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <Boxes className="w-5 h-5 text-slate-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-white text-xs sm:text-sm truncate leading-snug">{p.name}</p>
                              <p className="text-[11px] text-slate-400 truncate flex items-center space-x-1.5 mt-0.5 leading-normal">
                                <span>{p.name_mm || 'ကုန်ပစ္စည်း'}</span>
                                <span className="text-slate-600">•</span>
                                <span className="font-mono text-[10px] text-brand-400/90 font-medium">SKU: {p.sku}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 align-middle whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/90 text-slate-300 border border-slate-700/70">
                            {p.category_name || 'General'}
                          </span>
                        </td>

                        <td className="py-3 px-4 align-middle">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-[240px]">
                            {p.variants && p.variants.slice(0, 2).map(v => (
                              <span key={v.id} className="inline-flex items-center space-x-1 text-[11px] bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                <span className="font-medium text-slate-200">{v.variant_name}</span>
                                <span className={`font-mono text-[10px] font-bold ${v.stock_quantity <= p.low_stock_threshold ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  ({v.stock_quantity})
                                </span>
                              </span>
                            ))}
                            {p.variants && p.variants.length > 2 && (
                              <span className="text-[10px] text-slate-400 bg-slate-800/80 border border-slate-700 px-1.5 py-0.5 rounded-lg whitespace-nowrap font-medium">
                                +{p.variants.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 align-middle text-right font-mono text-slate-400 whitespace-nowrap text-xs">
                          {formatMMK(p.cost_price)}
                        </td>

                        <td className="py-3 px-4 align-middle text-right font-mono font-bold text-emerald-400 whitespace-nowrap text-xs">
                          {formatMMK(p.sale_price)}
                        </td>

                        <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center font-mono font-bold px-2.5 py-1 rounded-full text-xs ${
                            isLow
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {p.total_stock} pcs
                          </span>
                        </td>

                        <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5 whitespace-nowrap shrink-0">
                            {hasPermission('product:edit') && (
                              <button
                                onClick={() => openEditProductModal(p)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 hover:border-brand-500 transition-all flex items-center space-x-1 whitespace-nowrap shadow-sm"
                                title="Edit Product Details & Photo (ပစ္စည်းနှင့် ဓာတ်ပုံ ပြင်ရန်)"
                              >
                                <Edit className="w-3.5 h-3.5 text-brand-400" />
                                <span>Edit</span>
                              </button>
                            )}
                            {hasPermission('stock:adjust') && (
                              <button
                                onClick={() => openAdjustModal(p)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 hover:border-slate-600 transition-all flex items-center space-x-1 whitespace-nowrap shadow-sm"
                                title="Adjust Stock Quantity (လက်ကျန် စာရင်းညှိရန်)"
                              >
                                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Stock</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Categories & Subcategories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Top Bar */}
          <div className="glass-panel p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
              <input
                type="text"
                placeholder="Search categories by name or Myanmar translation..."
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {hasPermission('category:manage') && (
              <button
                onClick={() => setAddCatModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-500 hover:to-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-1.5 shrink-0"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create New Category (အမျိုးအစားအသစ်ဖွင့်ရန်)</span>
              </button>
            )}
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories
              .filter(c => 
                !catSearch || 
                c.name.toLowerCase().includes(catSearch.toLowerCase()) || 
                (c.name_mm && c.name_mm.includes(catSearch))
              )
              .map((cat) => (
                <div 
                  key={cat.id} 
                  className="glass-panel rounded-2xl p-4 flex flex-col justify-between border border-slate-800 hover:border-slate-700/80 transition-all hover:shadow-xl hover:shadow-brand-500/5 group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                          <FolderTree className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-100 truncate">{cat.name}</h4>
                          <p className="text-xs text-brand-400 font-medium truncate">{cat.name_mm || 'အမျိုးအစား'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/70 shrink-0">
                        {cat.product_count ?? 0} Products
                      </span>
                    </div>

                    {/* Description */}
                    {cat.description && (
                      <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                        {cat.description}
                      </p>
                    )}

                    {/* Subcategories */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
                        <span className="flex items-center space-x-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>Subcategories (အမျိုးအစားခွဲများ)</span>
                        </span>
                        <span className="text-[10px] text-slate-400">{cat.subcategories?.length || 0} items</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                        {cat.subcategories && cat.subcategories.length > 0 ? (
                          cat.subcategories.map((sub: any) => (
                            <span 
                              key={sub.id} 
                              className="px-2 py-0.5 rounded-lg text-[11px] bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-600 transition-colors"
                            >
                              {sub.name} {sub.name_mm && <span className="text-slate-400 text-[10px]">({sub.name_mm})</span>}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No subcategories defined yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Add Subcategory Button */}
                  {hasPermission('category:manage') && (
                    <div className="pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          setTargetCat(cat);
                          setSubName('');
                          setSubNameMm('');
                          setAddSubModalOpen(true);
                        }}
                        className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 text-xs font-semibold border border-slate-700 hover:border-indigo-500 transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Subcategory (အမျိုးအစားခွဲထည့်ရန်)</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>

          {categories.length === 0 && (
            <div className="glass-panel p-12 text-center text-slate-500 text-xs rounded-2xl">
              No product categories found. Click "Create New Category" to get started.
            </div>
          )}
        </div>
      )}

      {/* 3. Low Stock Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Low Stock Threshold Alerts (ပစ္စည်းပြတ်လပ်တော့မည့် စာရင်း)</span>
              </h3>
              <p className="text-xs text-slate-400">Items below minimum stock threshold requiring reorder</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {alerts.map(a => (
              <div key={a.variant_id} className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 flex justify-between items-center shadow-sm">
                <div>
                  <h4 className="font-bold text-white text-xs">{a.product_name}</h4>
                  <p className="text-[11px] text-slate-400">{a.variant_name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">SKU: {a.variant_sku}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-mono font-extrabold text-amber-400">
                    {a.stock_quantity} pcs left
                  </span>
                  <p className="text-[10px] text-slate-400">Threshold: {a.low_stock_threshold}</p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-500 text-xs">
                All inventory levels are healthy! No items below stock threshold.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Inventory Logs Tab */}
      {activeTab === 'logs' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Inventory In/Out & Adjustment Logs (ပစ္စည်း အဝင်/အထွက် မှတ်တမ်းများ)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px] border-collapse">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-[16%] whitespace-nowrap">Date & Time</th>
                  <th className="py-3.5 px-4 w-[24%] whitespace-nowrap">Product & Variant</th>
                  <th className="py-3.5 px-4 w-[14%] whitespace-nowrap">Action Type</th>
                  <th className="py-3.5 px-4 w-[12%] text-right whitespace-nowrap">Qty Change</th>
                  <th className="py-3.5 px-4 w-[12%] text-right whitespace-nowrap">New Stock</th>
                  <th className="py-3.5 px-4 w-[12%]">Reason / Notes</th>
                  <th className="py-3.5 px-4 w-[10%] whitespace-nowrap">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                    <td className="py-3.5 px-4 align-middle text-slate-400 font-mono text-[11px] whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-semibold text-white whitespace-nowrap">{log.product_name}</div>
                      <div className="text-[11px] text-slate-400 whitespace-nowrap">{log.variant_name}</div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                        log.change_type === 'STOCK_IN' ? 'bg-emerald-500/20 text-emerald-300' :
                        log.change_type === 'STOCK_OUT' ? 'bg-indigo-500/20 text-indigo-300' :
                        log.change_type === 'RETURN' ? 'bg-blue-500/20 text-blue-300' :
                        log.change_type === 'DAMAGE' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {log.change_type}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 align-middle text-right font-mono font-bold whitespace-nowrap ${
                      log.quantity_change > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                    </td>
                    <td className="py-3.5 px-4 align-middle text-right font-mono font-semibold text-white whitespace-nowrap">
                      {log.new_stock} pcs
                    </td>
                    <td className="py-3.5 px-4 align-middle text-slate-300 max-w-xs truncate" title={log.reason}>{log.reason}</td>
                    <td className="py-3.5 px-4 align-middle text-slate-400 whitespace-nowrap">{log.user_name || 'System Admin'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Adjust Stock Level</h3>
                <p className="text-xs text-slate-400">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setAdjustModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Variant</label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {selectedProduct.variants?.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.variant_name} (Current: {v.stock_quantity} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Adjustment Type</label>
                <select
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="STOCK_IN">Stock In (ပစ္စည်းအသစ်ဝင်ရောက်ခြင်း)</option>
                  <option value="STOCK_OUT">Stock Out (လက်ကျန်ထုတ်ယူခြင်း)</option>
                  <option value="ADJUSTMENT">Stock Audit (ရေတွက်စစ်ဆေးညှိနှိုင်းခြင်း)</option>
                  <option value="DAMAGE">Damaged / Expired (ပျက်စီးဆုံးရှုံး)</option>
                  <option value="RETURN">Customer Return (ဖောက်သည်ပြန်သွင်း)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  {changeType === 'ADJUSTMENT' ? 'New Exact Stock Count' : 'Quantity to Add / Deduct'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. New shipment from Thailand supplier"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {addProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Add New Product (ပစ္စည်းအသစ်သွင်းခြင်း)</h3>
              <button onClick={() => setAddProductModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">Product Name (English)</label>
                  <input
                    type="text"
                    required
                    placeholder="Korean Tone-Up Cream 50ml"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">Product Name (Burmese / မြန်မာ)</label>
                  <input
                    type="text"
                    placeholder="ကိုရီးယား အသားဖြူခရင်မ်"
                    value={newNameMm}
                    onChange={(e) => setNewNameMm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Product SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="COS-CRM-008"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono uppercase focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400">Category</label>
                    <button
                      type="button"
                      onClick={() => setAddCatModalOpen(true)}
                      className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold flex items-center space-x-1"
                    >
                      <FolderPlus className="w-3 h-3" />
                      <span>+ New Category</span>
                    </button>
                  </div>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.name_mm})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Cost Price (MMK)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="12000"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Sale Price (MMK)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="22000"
                    value={newSalePrice}
                    onChange={(e) => setNewSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <ImageUpload
                    value={newImageUrl}
                    onChange={(url) => setNewImageUrl(url)}
                    label="Product Photo"
                    labelMm="ပစ္စည်းဓာတ်ပုံ တင်ရန်"
                  />
                </div>
              </div>

              {/* Initial Variants */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-slate-400 block mb-1 font-bold">Initial Variant & Stock Quantity</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Variant name (e.g., Size M, Red)"
                    value={newVariants[0].name}
                    onChange={(e) => {
                      const updated = [...newVariants];
                      updated[0].name = e.target.value;
                      setNewVariants(updated);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={newVariants[0].stock}
                    onChange={(e) => {
                      const updated = [...newVariants];
                      updated[0].stock = parseInt(e.target.value, 10) || 0;
                      setNewVariants(updated);
                    }}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Edit Product & Photo</h3>
                  <p className="text-[11px] text-slate-400 font-medium">ကုန်ပစ္စည်း အချက်အလက်နှင့် ဓာတ်ပုံ ပြင်ဆင်ခြင်း</p>
                </div>
              </div>
              <button onClick={() => setEditProductModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1 font-medium">Product Name (English) <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Korean Tone-Up Cream 50ml"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1 font-medium">Product Name (Burmese / မြန်မာ)</label>
                  <input
                    type="text"
                    placeholder="ကိုရီးယား အသားဖြူခရင်မ်"
                    value={editNameMm}
                    onChange={(e) => setEditNameMm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Product SKU <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="COS-CRM-008"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono uppercase focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-medium">Category</label>
                    <button
                      type="button"
                      onClick={() => setAddCatModalOpen(true)}
                      className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold flex items-center space-x-1"
                    >
                      <FolderPlus className="w-3 h-3" />
                      <span>+ New Category</span>
                    </button>
                  </div>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.name_mm})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Cost Price (MMK)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="12000"
                    value={editCostPrice}
                    onChange={(e) => setEditCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Sale Price (MMK) <span className="text-rose-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="22000"
                    value={editSalePrice}
                    onChange={(e) => setEditSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1 font-medium">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={editLowStock}
                    onChange={(e) => setEditLowStock(parseInt(e.target.value, 10) || 5)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <ImageUpload
                    value={editImageUrl}
                    onChange={(url) => setEditImageUrl(url)}
                    label="Product Photo"
                    labelMm="ပစ္စည်းဓာတ်ပုံ ပြင်ဆင်ရန် / အသစ်တင်ရန်"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1 font-medium">Description (အသေးစိတ် အချက်အလက်)</label>
                  <textarea
                    rows={2}
                    placeholder="Product details, usage, formula..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold block">Product Variants & Stock</label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditVariants([
                        ...editVariants,
                        { name: '', sku: '', stock: 0, addPrice: 0 }
                      ]);
                    }}
                    className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold"
                  >
                    + Add Variant
                  </button>
                </div>
                {editVariants.map((v, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      placeholder="Variant (e.g. 50ml, Red)"
                      value={v.name}
                      onChange={(e) => {
                        const updated = [...editVariants];
                        updated[idx].name = e.target.value;
                        setEditVariants(updated);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="SKU"
                      value={v.sku}
                      onChange={(e) => {
                        const updated = [...editVariants];
                        updated[idx].sku = e.target.value;
                        setEditVariants(updated);
                      }}
                      className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs uppercase"
                    />
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-500 font-mono">Stock:</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Stock"
                        value={v.stock}
                        onChange={(e) => {
                          const updated = [...editVariants];
                          updated[idx].stock = parseInt(e.target.value, 10) || 0;
                          setEditVariants(updated);
                        }}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                {hasPermission('product:delete') ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(editingProduct)}
                    className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Product</span>
                  </button>
                ) : <div />}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditProductModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  {hasPermission('product:edit') && (
                    <button
                      type="submit"
                      disabled={editSubmitting}
                      className="px-5 py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
                    >
                      {editSubmitting ? 'Saving...' : 'Save Changes (ပြင်ဆင်ချက်သိမ်းမည်)'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {addCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel border border-slate-700 bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Add New Category</h3>
                  <p className="text-[11px] text-slate-400 font-medium">အမျိုးအစားအသစ်ဖွင့်လှစ်ခြင်း</p>
                </div>
              </div>
              <button
                onClick={() => setAddCatModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Category Name (English) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skin Care, Women Fashion, Gadgets"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Category Name (Burmese / မြန်မာ)
                </label>
                <input
                  type="text"
                  placeholder="e.g. အသားအရေထိန်းသိမ်းမှု၊ အမျိုးသမီးဝတ်"
                  value={catNameMm}
                  onChange={(e) => setCatNameMm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Description (ဖော်ပြချက်)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of this category..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Initial Subcategories (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleanser, Toner, Serum, Sunscreen"
                  value={catSubcategoriesInput}
                  onChange={(e) => setCatSubcategoriesInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  သီးခြားအမျိုးအစားခွဲများကို ကော်မာ ( , ) ခံ၍ ထည့်သွင်းနိုင်ပါသည်
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddCatModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {catSubmitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subcategory Modal */}
      {addSubModalOpen && targetCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel border border-slate-700 bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-0.5">
                  Category: {targetCat.name}
                </span>
                <h3 className="font-bold text-sm text-slate-100">Add Subcategory</h3>
              </div>
              <button
                onClick={() => setAddSubModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubcategory} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Subcategory Name (English) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Serum, Cotton Blouse, Earphone"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Subcategory Name (Burmese / မြန်မာ)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ဆီရမ်၊ ချည်အင်္ကျီ"
                  value={subNameMm}
                  onChange={(e) => setSubNameMm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddSubModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {subSubmitting ? 'Adding...' : 'Add Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
