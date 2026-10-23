import React, { useEffect, useState } from 'react';
import { IndianRupee, Plus, ShoppingBag, TrendingUp, Calendar, User, Tag } from 'lucide-react';
import { api } from '../services/api';
import { Sale } from '../types';

interface SalesTrackingProps {
  onOpenRecordSale: () => void;
}

export const SalesTracking: React.FC<SalesTrackingProps> = ({ onOpenRecordSale }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales');
      const salesList = Array.isArray(res) ? res : (Array.isArray(res?.sales) ? res.sales : []);
      setSales(salesList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const safeSales = Array.isArray(sales) ? sales : [];
  const totalRevenue = safeSales.reduce((acc, s) => acc + Number(s.sale_amount || 0), 0);
  const attributedSales = safeSales.filter(s => !!s.campaign_id);
  const attributedRevenue = attributedSales.reduce((acc, s) => acc + Number(s.sale_amount || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <IndianRupee className="h-5 w-5 text-emerald-400" />
            <span>Sales & Campaign Attribution</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
              {safeSales.length} confirmed sales
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track repeat sales generated through ShopGrow AI WhatsApp re-engagement campaigns.
          </p>
        </div>

        <button
          onClick={onOpenRecordSale}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/25 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Record Counter Sale</span>
        </button>
      </div>

      {/* Metric Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-slate-400 text-xs block mb-1">Total Confirmed Sales</span>
          <span className="text-2xl font-black text-white font-mono">{sales.length} orders</span>
          <p className="text-[11px] text-slate-500 mt-1">In-store closed transactions</p>
        </div>

        <div className="bg-emerald-950/40 p-5 rounded-2xl border border-emerald-500/30 shadow-lg">
          <span className="text-emerald-400 text-xs block mb-1 font-medium">Attributed Campaign Revenue</span>
          <span className="text-2xl font-black text-emerald-300 font-mono">
            ₹{attributedRevenue.toLocaleString('en-IN')}
          </span>
          <p className="text-[11px] text-emerald-400/80 mt-1">
            {attributedSales.length} sales directly linked to WhatsApp campaigns
          </p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-slate-400 text-xs block mb-1">Total Store Sales Volume</span>
          <span className="text-2xl font-black text-white font-mono">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">Saha Electronics counter</p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Product Purchased</th>
                <th className="p-3.5">Sale Amount</th>
                <th className="p-3.5">Originating Campaign (Attribution)</th>
                <th className="p-3.5">Staff In-Charge</th>
                <th className="p-3.5">Sale Date</th>
                <th className="p-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{s.customer_name}</div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-200">{s.product}</td>
                    <td className="p-3.5 font-bold font-mono text-emerald-400 text-sm">
                      ₹{Number(s.sale_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      {s.campaign_name ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {s.campaign_name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          Direct Walk-in
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400">{s.staff}</td>
                    <td className="p-3.5 text-slate-400 font-mono">{s.sale_date}</td>
                    <td className="p-3.5 text-slate-400 text-[11px] max-w-xs truncate">{s.notes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    No sales recorded yet. Click "Record Counter Sale" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
