import React, { useState, useEffect } from 'react';
import { X, IndianRupee, ShoppingBag, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { Customer, Campaign } from '../types';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleRecorded: () => void;
  preselectedCustomer?: Customer | null;
  preselectedCampaignId?: string | null;
}

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({
  isOpen,
  onClose,
  onSaleRecorded,
  preselectedCustomer,
  preselectedCampaignId
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [campaignId, setCampaignId] = useState<string>('');
  const [product, setProduct] = useState('Samsung Galaxy S24 FE 5G');
  const [saleAmount, setSaleAmount] = useState('49999');
  const [staff, setStaff] = useState('Subhasish Saha');
  const [notes, setNotes] = useState('Store counter sale via ShopGrow AI follow-up');
  const [occasionType, setOccasionType] = useState<string>('NONE');
  const [couponCode, setCouponCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchDropdowns();
  }, [isOpen]);

  useEffect(() => {
    if (preselectedCustomer) {
      setCustomerId(preselectedCustomer.id);
    }
    if (preselectedCampaignId) {
      setCampaignId(preselectedCampaignId);
    }
  }, [preselectedCustomer, preselectedCampaignId]);

  const fetchDropdowns = async () => {
    try {
      const custRes = await api.get('/customers');
      setCustomers(custRes.customers || []);
      const campRes = await api.get('/campaigns');
      setCampaigns(campRes || []);

      if (custRes.customers?.length > 0 && !customerId) {
        setCustomerId(custRes.customers[0].id);
      }
      if (campRes?.length > 0 && !campaignId) {
        setCampaignId(campRes[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !product || !saleAmount) {
      alert('Please fill customer, product and sale amount');
      return;
    }

    setLoading(true);
    try {
      await api.post('/sales', {
        customer_id: customerId,
        campaign_id: campaignId || undefined,
        product,
        sale_amount: Number(saleAmount),
        staff,
        notes,
        occasion_type: occasionType !== 'NONE' ? occasionType : undefined,
        coupon_code: couponCode.trim() ? couponCode.trim().toUpperCase() : undefined,
        discount_amount: Number(discountAmount) || 0
      });

      // Trigger celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onSaleRecorded();
      onClose();
    } catch (err: any) {
      alert('Failed to record sale: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Confirm Customer Sale</h2>
              <p className="text-xs text-slate-400">
                Attributes revenue and closes the conversion funnel.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleRecordSale} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Customer *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.phone_e164}) - {c.brand}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Attributed Campaign</label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg p-2.5 text-white"
            >
              <option value="">(Direct Store Walk-in / No Campaign)</option>
              {campaigns.map(camp => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Product Sold *</label>
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              placeholder="e.g. Samsung Galaxy S24 FE 5G"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Sale Amount (INR) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
                <input
                  type="number"
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-7 pr-3 text-white font-mono font-bold"
                  placeholder="49999"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Staff In-Charge</label>
              <input
                type="text"
                value={staff}
                onChange={(e) => setStaff(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
          </div>

          <div className="p-3 bg-pink-950/20 border border-pink-500/20 rounded-xl space-y-2.5">
            <span className="text-[11px] font-bold text-pink-400 uppercase tracking-wider block">
              Occasion Offer Redemption (Optional)
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Occasion Type</label>
                <select
                  value={occasionType}
                  onChange={(e) => setOccasionType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                >
                  <option value="NONE">None</option>
                  <option value="BIRTHDAY">Birthday</option>
                  <option value="WEDDING_ANNIVERSARY">Wedding Anniv</option>
                  <option value="PURCHASE_ANNIVERSARY">Purchase Anniv</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs uppercase"
                  placeholder="e.g. BDAY10"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Discount (₹)</label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Internal Counter Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              placeholder="e.g. Spot exchange bonus applied on Galaxy M31"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{loading ? 'Recording...' : 'Confirm Sale & Attribute Revenue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
