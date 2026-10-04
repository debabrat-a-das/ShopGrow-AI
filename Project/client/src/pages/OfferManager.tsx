import React, { useEffect, useState } from 'react';
import { Tag, Plus, CheckCircle2, AlertCircle, Clock, ShieldCheck, Calendar, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { Offer } from '../types';

interface OfferManagerProps {
  onOpenNewOffer: () => void;
  onLaunchCampaignForOffer: (offerId: string) => void;
}

export const OfferManager: React.FC<OfferManagerProps> = ({
  onOpenNewOffer,
  onLaunchCampaignForOffer
}) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/offers');
      setOffers(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (offer: Offer) => {
    try {
      await api.patch(`/offers/${offer.id}`, { active_status: !offer.active_status });
      fetchOffers();
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Tag className="h-5 w-5 text-emerald-400" />
            <span>Store Offer Manager</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
              {offers.length} active deals
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified ground truth for AI marketing campaigns. AI will never fabricate prices or trade-in bonuses not defined here.
          </p>
        </div>

        <button
          onClick={onOpenNewOffer}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/25 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Verified Offer</span>
        </button>
      </div>

      {/* Grid of Offers */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading store offers...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map((offer) => {
            const savings = offer.mrp - offer.offer_price;
            const isExpired = new Date(offer.valid_until) < new Date();

            return (
              <div
                key={offer.id}
                className={`rounded-2xl border overflow-hidden transition flex flex-col justify-between ${
                  offer.active_status && !isExpired
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-xl'
                    : 'bg-slate-950/70 border-slate-900 opacity-60'
                }`}
              >
                <div>
                  {/* Banner Image */}
                  <div className="h-44 w-full relative overflow-hidden bg-slate-950">
                    <img
                      src={offer.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

                    {/* Badge */}
                    <div className="absolute top-3 left-3 flex space-x-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-md">
                        {offer.brand}
                      </span>
                      {offer.discount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-600 text-white shadow-md">
                          Save ₹{savings.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleToggleStatus(offer)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition ${
                          offer.active_status
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-900/80 text-slate-400 border-slate-700'
                        }`}
                      >
                        {offer.active_status ? 'Active in AI Studio' : 'Deactivated'}
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3.5">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {offer.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        {offer.model}
                      </p>
                    </div>

                    {/* Pricing Row */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Verified Price</span>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-lg font-black text-emerald-400 font-mono">
                            ₹{Number(offer.offer_price).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-slate-500 line-through font-mono">
                            MRP ₹{Number(offer.mrp).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Validity</span>
                        <div className="text-xs font-mono text-slate-300 flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>Till {offer.valid_until}</span>
                        </div>
                      </div>
                    </div>

                    {/* Perks List */}
                    <div className="space-y-1.5 text-xs">
                      {offer.exchange_offer && (
                        <div className="flex items-start space-x-2 text-slate-300">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span><strong>Exchange:</strong> {offer.exchange_offer}</span>
                        </div>
                      )}
                      {offer.emi_information && (
                        <div className="flex items-start space-x-2 text-slate-300">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span><strong>EMI:</strong> {offer.emi_information}</span>
                        </div>
                      )}
                      {offer.cashback && (
                        <div className="flex items-start space-x-2 text-slate-300">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span><strong>Cashback:</strong> {offer.cashback}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Terms: {offer.terms || 'Standard retail invoice'}
                  </span>

                  <button
                    onClick={() => onLaunchCampaignForOffer(offer.id)}
                    className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Run AI Campaign</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
