import React, { useState } from 'react';
import { 
  X, Package, User, Plus, Trash2, CheckCircle2, 
  AlertCircle, Sparkles, Tag, Layers, IndianRupee, Phone 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded?: (item: any) => void;
  initialType?: 'PRODUCT' | 'CUSTOMER';
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onItemAdded,
  initialType = 'PRODUCT'
}) => {
  const [mode, setMode] = useState<'PRODUCT' | 'CUSTOMER'>(initialType);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Product Form State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('Smartphones & Mobile');
  const [mrp, setMrp] = useState('');
  const [stockQuantity, setStockQuantity] = useState('5');
  const [sku, setSku] = useState('');
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [attributes, setAttributes] = useState<Array<{ key: string; value: string }>>([
    { key: 'Color', value: 'Black' },
    { key: 'Warranty', value: '1 Year Manufacturer' }
  ]);

  // Customer Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerBrand, setCustomerBrand] = useState('Samsung');
  const [customerModel, setCustomerModel] = useState('Galaxy Smartphone');
  const [purchaseValue, setPurchaseValue] = useState('25000');
  const [whatsappConsent, setWhatsappConsent] = useState(true);

  if (!isOpen) return null;

  const handleAddAttribute = () => {
    setAttributes(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveAttribute = (idx: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateAttribute = (idx: number, field: 'key' | 'value', val: string) => {
    setAttributes(prev => {
      const copy = [...prev];
      copy[idx][field] = val;
      return copy;
    });
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!brand.trim()) {
      setError('Product Brand is required (e.g., Samsung, Apple, Sony).');
      return;
    }
    if (!model.trim()) {
      setError('Product Model/Name is required.');
      return;
    }
    if (!mrp.trim() || isNaN(Number(mrp)) || Number(mrp) <= 0) {
      setError('Please enter a valid MRP / Selling Price.');
      return;
    }

    const customAttrs: Record<string, string> = {};
    attributes.forEach(attr => {
      if (attr.key.trim() && attr.value.trim()) {
        customAttrs[attr.key.trim()] = attr.value.trim();
      }
    });

    setSubmitting(true);
    try {
      const payload = {
        brand: brand.trim(),
        model: model.trim(),
        category: category.trim() || 'General Product',
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        mrp: Number(mrp),
        stock_quantity: Number(stockQuantity) || 1,
        custom_attributes: customAttrs,
        is_new_arrival: isNewArrival,
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600']
      };

      const result = await api.post('/products', payload);
      
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {
        // Safe fallback if confetti isn't available
      }

      setSuccessMsg(`Product "${model}" successfully added to inventory!`);
      if (onItemAdded) {
        onItemAdded(result);
      }

      setTimeout(() => {
        setBrand('');
        setModel('');
        setMrp('');
        setSku('');
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to save product to database.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!customerName.trim()) {
      setError('Customer Full Name is required.');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        full_name: customerName.trim(),
        phone: cleanPhone.startsWith('91') && cleanPhone.length === 12 ? cleanPhone : cleanPhone.slice(-10),
        brand: customerBrand.trim() || 'General',
        model: customerModel.trim() || 'Device',
        purchase_value: Number(purchaseValue) || 0,
        whatsapp_opt_in: whatsappConsent,
        consent_source: 'STORE_COUNTER_ADMIN'
      };

      const result = await api.post('/customers', payload);
      
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {
        // Safe fallback
      }

      setSuccessMsg(`Customer "${customerName}" added to verified CRM!`);
      if (onItemAdded) {
        onItemAdded(result);
      }

      setTimeout(() => {
        setCustomerName('');
        setCustomerPhone('');
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to add customer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 id="add-item-modal-title" className="text-sm font-bold text-white">
                Add New {mode === 'PRODUCT' ? 'Inventory Item / Product' : 'Customer Profile'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Directly saves to the live store database and synchronizes dashboard metrics.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher: Add Product vs Add Customer */}
        <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setMode('PRODUCT'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition ${
              mode === 'PRODUCT'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Add Item / Product</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('CUSTOMER'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition ${
              mode === 'CUSTOMER'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-[11px]">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="text-[11px] font-semibold">{successMsg}</span>
          </div>
        )}

        {/* PRODUCT FORM */}
        {mode === 'PRODUCT' && (
          <form onSubmit={handleProductSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Brand <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samsung, Apple, Sony"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Smartphones & Mobile">Smartphones & Mobile</option>
                  <option value="Smart TVs & Display">Smart TVs & Display</option>
                  <option value="Audio & Wearables">Audio & Wearables</option>
                  <option value="Home Appliances">Home Appliances</option>
                  <option value="Furniture & Decor">Furniture & Decor</option>
                  <option value="General Retail">General Retail</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Model / Item Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Galaxy S24 FE 5G (128GB) or Solid Teak Sofa"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  MRP / Price (₹) <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="49999"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="5"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  SKU (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Custom Attributes */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300">
                  Custom Attributes (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleAddAttribute}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Attribute</span>
                </button>
              </div>

              {attributes.map((attr, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Key (e.g. Color)"
                    value={attr.key}
                    onChange={(e) => handleUpdateAttribute(idx, 'key', e.target.value)}
                    className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Phantom Silver)"
                    value={attr.value}
                    onChange={(e) => handleUpdateAttribute(idx, 'value', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* New Arrival Checkbox */}
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0 h-3.5 w-3.5 cursor-pointer"
              />
              <span>Mark as New Arrival (Highlights item across AI Campaigns and Dashboard)</span>
            </label>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>{submitting ? 'Saving to Database...' : 'Save Item to Database'}</span>
              </button>
            </div>
          </form>
        )}

        {/* CUSTOMER FORM */}
        {mode === 'CUSTOMER' && (
          <form onSubmit={handleCustomerSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Full Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Ghosh"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  WhatsApp Phone (10 digits) <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="9830012345"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Preferred Brand
                </label>
                <input
                  type="text"
                  placeholder="e.g. Samsung"
                  value={customerBrand}
                  onChange={(e) => setCustomerBrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Purchased Item / Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Galaxy S24"
                  value={customerModel}
                  onChange={(e) => setCustomerModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Purchase Value (₹)
                </label>
                <input
                  type="number"
                  placeholder="25000"
                  value={purchaseValue}
                  onChange={(e) => setPurchaseValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={whatsappConsent}
                onChange={(e) => setWhatsappConsent(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0 h-3.5 w-3.5 cursor-pointer"
              />
              <span>Verified WhatsApp Marketing Consent (Opt-in compliant)</span>
            </label>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>{submitting ? 'Saving Customer...' : 'Save Customer to Database'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
