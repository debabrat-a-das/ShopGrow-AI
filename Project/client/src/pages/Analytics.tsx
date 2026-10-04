import React, { useEffect, useState } from 'react';
import { 
  BarChart3, TrendingUp, Users, Send, CheckCircle2, MessageSquare, 
  Flame, Store, IndianRupee, ShieldAlert, Share2, Layers, Filter,
  ArrowRight, Smartphone, Eye, Calendar, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'cross-shop'>('overview');
  const [data, setData] = useState<any>(null);
  const [attributionData, setAttributionData] = useState<any>(null);
  const [crossShopData, setCrossShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters for Cross-Shop Overview
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [dashRes, attrRes, crossRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/channel-attribution').catch(() => null),
        api.get('/analytics/cross-shop-overview').catch(() => null)
      ]);
      setData(dashRes);
      setAttributionData(attrRes);
      setCrossShopData(crossRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Loading campaign & attribution analytics...
      </div>
    );
  }

  const f = data.funnel;

  const funnelSteps = [
    { label: 'Audience Targeted', count: f.audience, pct: '100%', color: 'bg-slate-700' },
    { label: 'Messages Delivered', count: f.delivered, pct: `${Math.round((f.delivered / (f.audience || 1)) * 100)}%`, color: 'bg-emerald-700' },
    { label: 'Customer Replies', count: f.replied, pct: `${Math.round((f.replied / (f.delivered || 1)) * 100)}%`, color: 'bg-teal-600' },
    { label: 'High Intent / Interested', count: f.interested, pct: `${Math.round((f.interested / (f.replied || 1)) * 100)}%`, color: 'bg-cyan-600' },
    { label: 'Hot Leads Generated', count: f.hotLeads, pct: `${Math.round((f.hotLeads / (f.interested || 1)) * 100)}%`, color: 'bg-rose-600' },
    { label: 'Store Visit Commitments', count: f.storeVisits, pct: `${Math.round((f.storeVisits / (f.hotLeads || 1)) * 100)}%`, color: 'bg-amber-600' },
    { label: 'Confirmed Sales', count: f.sales, pct: `${Math.round((f.sales / (f.storeVisits || 1)) * 100)}%`, color: 'bg-emerald-500' }
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            <span>Campaign Performance & Revenue Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            End-to-end attribution showing how WhatsApp re-engagement and Meta social leads convert into confirmed retail sales.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview & Funnel
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'channels'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Channel & Lead Attribution
          </button>
          <button
            onClick={() => setActiveTab('cross-shop')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'cross-shop'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cross-Shop Master Admin
          </button>
        </div>
      </div>

      {/* VIEW 1: OVERVIEW & FUNNEL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Revenue Summary Card */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 p-6 rounded-2xl border border-emerald-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                Total Campaign Attributed Revenue
              </span>
              <div className="text-3xl font-black text-white font-mono">
                ₹{Number(data.kpiCards.attributedRevenue || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Directly generated from {data.kpiCards.confirmedSales} confirmed sales attributed to WhatsApp upgrade offers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Reply Rate</span>
                <span className="text-base font-bold text-teal-400 font-mono">
                  {f.delivered > 0 ? ((f.replied / f.delivered) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Lead Conversion</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {f.hotLeads > 0 ? ((f.sales / f.hotLeads) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Visual Funnel Waterfall */}
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>Campaign Conversion Waterfall</span>
              </h2>
              <p className="text-xs text-slate-400">
                Stage-by-stage drop-off and conversion rates from contact to cash register.
              </p>
            </div>

            <div className="space-y-3">
              {funnelSteps.map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-medium">{step.label}</span>
                    <span className="font-mono font-bold text-white">
                      {step.count} ({step.pct})
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${step.color} transition-all duration-500 rounded-full`}
                      style={{
                        width: `${Math.max(10, Math.min(100, Math.round((step.count / (f.audience || 1)) * 100)))}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CHANNEL & LEAD ATTRIBUTION DASHBOARD */}
      {activeTab === 'channels' && attributionData && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Channel Summary Header */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Total Attributed Revenue</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                ₹{Number(attributionData.summary?.totalRevenue || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Confirmed Closed Sales</span>
              <span className="text-2xl font-black text-white font-mono">{attributionData.summary?.totalSales}</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Total Leads Ingested</span>
              <span className="text-2xl font-black text-cyan-400 font-mono">{attributionData.summary?.totalLeads}</span>
            </div>
            <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl bg-emerald-950/20">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider block mb-1 font-bold">Top Performing Channel</span>
              <span className="text-xl font-black text-white">{attributionData.summary?.topChannel}</span>
            </div>
          </div>

          {/* Channel Funnel Breakdown Cards */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Share2 className="h-4 w-4 text-emerald-400" />
              <span>Multi-Touch Channel Funnels & Stage Metrics</span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {attributionData.funnels?.map((cf: any) => (
                <div key={cf.channel} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{cf.channel}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        Conv: {cf.conversionRate}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        ₹{Number(cf.metrics.revenue).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Attributed Revenue</span>
                    </div>
                  </div>

                  {/* 10-Stage Granular Funnel */}
                  <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block uppercase">Engage</span>
                      <span className="font-bold text-slate-200">{cf.metrics.engagements}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block uppercase">Comments</span>
                      <span className="font-bold text-slate-200">{cf.metrics.comments}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block uppercase">CRM Lead</span>
                      <span className="font-bold text-cyan-300">{cf.metrics.crmLeads}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block uppercase">Opt-in</span>
                      <span className="font-bold text-emerald-400">{cf.metrics.whatsappOptIns}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block uppercase">Warm Lead</span>
                      <span className="font-bold text-amber-300">{cf.metrics.warmLeads}</span>
                    </div>
                  </div>

                  {/* Bottom Funnel Stages */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    <div className="bg-slate-950 p-2 rounded-lg border border-rose-500/20 bg-rose-950/10">
                      <span className="text-rose-400 block uppercase font-bold">Hot Leads</span>
                      <span className="font-bold text-white">{cf.metrics.hotLeads}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-amber-500/20 bg-amber-950/10">
                      <span className="text-amber-400 block uppercase font-bold">Store Visit</span>
                      <span className="font-bold text-white">{cf.metrics.storeVisits}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-emerald-500/20 bg-emerald-950/10">
                      <span className="text-emerald-400 block uppercase font-bold">Closed Sale</span>
                      <span className="font-bold text-white">{cf.metrics.sales}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-purple-500/20 bg-purple-950/10">
                      <span className="text-purple-400 block uppercase font-bold">Channel ROI</span>
                      <span className="font-bold text-purple-300">{cf.roi}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SUPER ADMIN CROSS-SHOP MULTI-TENANT OVERVIEW */}
      {activeTab === 'cross-shop' && crossShopData && (
        <div className="space-y-6 animate-in fade-in">
          {/* Platform Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-2xl">
              <span className="text-[10px] text-purple-400 uppercase tracking-wider block mb-1 font-bold">Total Platform Revenue</span>
              <span className="text-2xl font-black text-white font-mono">
                ₹{Number(crossShopData.totals?.totalRevenue || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Active Shop Tenants</span>
              <span className="text-2xl font-black text-white font-mono">{crossShopData.totals?.totalShops}</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Total Opted-in Customers</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{crossShopData.totals?.totalCustomers}</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Closed Retail Sales</span>
              <span className="text-2xl font-black text-white font-mono">{crossShopData.totals?.totalSales}</span>
            </div>
          </div>

          {/* Multi-Tenant Shop Performance Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Store className="h-4 w-4 text-purple-400" />
                <span>Shop-by-Shop Performance Comparison</span>
              </h2>
              <span className="text-xs text-slate-400">
                Multi-Tenant Row-Level Isolated
              </span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3">Shop Tenant</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Customers</th>
                    <th className="p-3">FB Leads</th>
                    <th className="p-3">IG Leads</th>
                    <th className="p-3">Hot Leads</th>
                    <th className="p-3">Visits</th>
                    <th className="p-3">Sales</th>
                    <th className="p-3">Attributed Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {crossShopData.shops?.map((s: any) => (
                    <tr key={s.shop_id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-bold text-white">{s.shop_name}</td>
                      <td className="p-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {s.business_type}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{s.totalCustomers}</td>
                      <td className="p-3 font-mono text-blue-400">{s.facebookLeads}</td>
                      <td className="p-3 font-mono text-rose-400">{s.instagramLeads}</td>
                      <td className="p-3 font-mono text-amber-400 font-bold">{s.hotLeads}</td>
                      <td className="p-3 font-mono">{s.storeVisits}</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">{s.salesCount}</td>
                      <td className="p-3 font-mono font-bold text-white">
                        ₹{Number(s.revenue).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
