import React, { useEffect, useState } from 'react';
import { 
  Package, Plus, Search, Filter, Sparkles, Tag, Layers, 
  CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Eye 
} from 'lucide-react';
import { api } from '../services/api';
import { Product, ProductCategory, ProductAttribute } from '../types';

interface ProductCatalogProps {
  onLaunchCampaignForProduct: (productId: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  onLaunchCampaignForProduct
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyNewArrivals, setOnlyNewArrivals] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Add Product Modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newBrand, setNewBrand] = useState<string>('');
  const [newModel, setNewModel] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [newSku, setNewSku] = useState<string>('');
  const [newMrp, setNewMrp] = useState<string>('');
  const [newStock, setNewStock] = useState<string>('5');
  const [newAttributes, setNewAttributes] = useState<Array<{ key: string; value: string }>>([
    { key: 'Material', value: 'Teakwood' },
    { key: 'Finish', value: 'Walnut Matte' }
  ]);
  const [newIsArrival, setNewIsArrival] = useState<boolean>(true);
  const [launchCampaignAfterSave, setLaunchCampaignAfterSave] = useState<boolean>(false);

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory, onlyNewArrivals]);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', {
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          is_new_arrival: onlyNewArrivals ? 'true' : undefined
        }),
        api.get('/products/meta/categories').catch(() => [])
      ]);
      const prodList = Array.isArray(prodRes) ? prodRes : (Array.isArray(prodRes?.products) ? prodRes.products : []);
      setProducts(prodList);
      setCategories(catRes || []);
      if (catRes && catRes.length > 0 && !newCategory) {
        setNewCategory(catRes[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttributeField = () => {
    setNewAttributes(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveAttributeField = (index: number) => {
    setNewAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, field: 'key' | 'value', text: string) => {
    setNewAttributes(prev => {
      const copy = [...prev];
      copy[index][field] = text;
      return copy;
    });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand || !newModel || !newMrp) {
      alert('Brand, Model, and MRP are required.');
      return;
    }

    const customAttrs: Record<string, any> = {};
    newAttributes.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        customAttrs[item.key.trim()] = item.value.trim();
      }
    });

    try {
      const created = await api.post('/products', {
        brand: newBrand,
        model: newModel,
        category: newCategory || 'General Product',
        sku: newSku || `SKU-${Date.now().toString().slice(-5)}`,
        mrp: Number(newMrp),
        stock_quantity: Number(newStock || 1),
        custom_attributes: customAttrs,
        is_new_arrival: newIsArrival,
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600']
      });

      setShowAddModal(false);
      setNewBrand('');
      setNewModel('');
      setNewMrp('');
      await fetchCatalog();

      if (launchCampaignAfterSave && created?.id) {
        onLaunchCampaignForProduct(created.id);
      }
    } catch (err: any) {
      alert('Failed to add product: ' + err.message);
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];
  const filteredProducts = safeProducts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.model.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Package className="h-5 w-5 text-emerald-400" />
            <span>Product & Catalog Engine</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
              Generic Multi-Industry Retail
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain flexible inventory, custom attributes (material, size, finish), and ask AI: “Who should know about this?”
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/25 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search products by brand, model, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto py-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Categories ({safeProducts.length})
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                selectedCategory === c.name
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* New Arrival Filter Toggle */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <button
            onClick={() => setOnlyNewArrivals(!onlyNewArrivals)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              onlyNewArrivals
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>New Arrivals Only</span>
          </button>

          <button
            onClick={fetchCatalog}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading catalog items...
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map(product => {
            const hasCustomAttrs = product.custom_attributes && Object.keys(product.custom_attributes).length > 0;
            const isLowStock = product.stock_quantity <= 2;

            return (
              <div
                key={product.id}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between space-y-4 shadow-xl hover:shadow-emerald-950/20 transition group"
              >
                <div className="space-y-3">
                  {/* Top Badges & SKU */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-500">
                      {product.sku || 'SKU-RETAIL'}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {product.is_new_arrival && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold text-[10px] flex items-center space-x-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>NEW ARRIVAL</span>
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        isLowStock 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        Stock: {product.stock_quantity}
                      </span>
                    </div>
                  </div>

                  {/* Product Title & Brand */}
                  <div>
                    <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      {product.brand} • {product.category}
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                      {product.model}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-bold font-mono text-white">
                      ₹{Number(product.mrp).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500">MRP incl. GST</span>
                  </div>

                  {/* Custom Flexible Attributes Pills */}
                  {hasCustomAttrs && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                        Product Specifications
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(product.custom_attributes || {}).map(([key, val]) => (
                          <span
                            key={key}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300"
                          >
                            <span className="text-slate-500 font-medium">{key}:</span>{' '}
                            <span className="text-slate-200 font-semibold">{String(val)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action: "Who should know about this?" */}
                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => onLaunchCampaignForProduct(product.id)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition active:scale-98"
                  >
                    <Sparkles className="h-4 w-4 text-emerald-200" />
                    <span>Who should know about this?</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1 text-emerald-200" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <Package className="h-8 w-8 text-slate-600 mx-auto" />
          <p>No products match your search or filter.</p>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Package className="h-4 w-4 text-emerald-400" />
                <span>Add Product to Catalog</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Brand / Maker</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Teak, Samsung, Titan"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="General Retail">General Retail</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Model / Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maharaja Teakwood Bed (King Size) or Galaxy S24 FE"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 52000"
                    value={newMrp}
                    onChange={(e) => setNewMrp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Stock Qty</label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">SKU (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dynamic Custom Attributes */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold">
                    Custom Attributes (e.g. Material, Size, Storage, Finish)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddAttributeField}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1 text-[11px]"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Attribute</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {newAttributes.map((attr, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Attribute Name (e.g. Material)"
                        value={attr.key}
                        onChange={(e) => handleAttributeChange(idx, 'key', e.target.value)}
                        className="w-1/2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. Teak Wood)"
                        value={attr.value}
                        onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                        className="w-1/2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttributeField(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Arrival Checkbox */}
              <label className="flex items-center space-x-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={newIsArrival}
                  onChange={(e) => setNewIsArrival(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                />
                <span className="text-slate-300">Mark as New Arrival (Recommended for AI Arrival Campaigns)</span>
              </label>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={() => setLaunchCampaignAfterSave(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium"
                >
                  Save Only
                </button>
                <button
                  type="submit"
                  onClick={() => setLaunchCampaignAfterSave(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
                  <span>Save & Launch Awareness</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
