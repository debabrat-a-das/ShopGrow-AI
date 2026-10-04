import React, { useState } from 'react';
import { X, Tag, Plus, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface NewOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOfferCreated: () => void;
}

export const NewOfferModal: React.FC<NewOfferModalProps> = ({
  isOpen,
  onClose,
  onOfferCreated
}) => {
  const [title, setTitle] = useState('Samsung Galaxy A55 5G Diwali Dhamaka');
  const [brand, setBrand] = useState('Samsung');
  const [model, setModel] = useState('Galaxy A55 5G (8GB/128GB)');
  const [mrp, setMrp] = useState('39999');
  const [offerPrice, setOfferPrice] = useState('34999');
  const [exchangeOffer, setExchangeOffer] = useState('Flat ₹4,000 spot exchange bonus for any old smartphone');
  const [emiInfo, setEmiInfo] = useState('0% No-Cost EMI starting at ₹2,916/mo on Bajaj Finserv');
  const [cashback, setCashback] = useState('₹2,000 instant cashback on HDFC cards');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [terms, setTerms] = useState('Valid for in-store purchases at Saha Electronics with GST invoice.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/offers', {
        title,
        brand,
        model,
        mrp: Number(mrp),
        offer_price: Number(offerPrice),
        exchange_offer: exchangeOffer,
        emi_information: emiInfo,
        cashback,
        valid_until: validUntil,
        terms
      });
      onOfferCreated();
      onClose();
    } catch (err: any) {
      alert('Failed to create offer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create Verified Shop Offer</h2>
              <p className="text-xs text-slate-400">
                Ground truth anchor: AI will never invent facts not listed here.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Campaign / Deal Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Brand *</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Model *</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">MRP (₹) *</label>
              <input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Offer Price (₹) *</label>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg p-2.5 text-emerald-400 font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Valid Until *</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Exchange Bonus Offer</label>
            <input
              type="text"
              value={exchangeOffer}
              onChange={(e) => setExchangeOffer(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              placeholder="e.g. Up to ₹6,000 spot exchange bonus on older Galaxy phones"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">0% EMI Details</label>
            <input
              type="text"
              value={emiInfo}
              onChange={(e) => setEmiInfo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              placeholder="e.g. Bajaj Finserv / HDFC 0% No-Cost EMI available"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Cashback / Bank Terms</label>
            <input
              type="text"
              value={cashback}
              onChange={(e) => setCashback(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              placeholder="e.g. ₹2,000 instant cashback on select cards"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{loading ? 'Creating...' : 'Save & Activate Offer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
