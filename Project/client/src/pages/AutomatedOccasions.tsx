import React, { useEffect, useState } from 'react';
import { 
  Gift, Cake, Heart, Sparkles, Send, CheckCircle2, Clock, 
  AlertTriangle, ShieldCheck, ShieldAlert, Tag, Calendar, 
  Settings, RefreshCw, ChevronRight, Eye, Phone, MessageSquare, 
  Play, Percent, IndianRupee, Store, Check, Info, ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { 
  OccasionAutomationSettings, OccasionLog, OccasionType, 
  OccasionDiscountType, OccasionValidityOption, Customer 
} from '../types';

interface AutomatedOccasionsProps {
  onNavigate: (tab: string, extra?: any) => void;
  onViewCustomer: (customerId: string) => void;
  onRecordSale: (customer?: Customer) => void;
  currentShopId?: string;
}

export const AutomatedOccasions: React.FC<AutomatedOccasionsProps> = ({
  onNavigate,
  onViewCustomer,
  onRecordSale,
  currentShopId
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'upcoming' | 'settings' | 'offers' | 'logs'>('overview');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<OccasionAutomationSettings | null>(null);
  const [dueData, setDueData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [logs, setLogs] = useState<OccasionLog[]>([]);
  
  // Test send state
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // AI Copy Generator state
  const [aiPreviewOccasion, setAiPreviewOccasion] = useState<OccasionType>('BIRTHDAY');
  const [aiPreviewResult, setAiPreviewResult] = useState<any>(null);
  const [isGeneratingAiCopy, setIsGeneratingAiCopy] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [currentShopId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [settingsRes, dueRes, logsRes, analyticsRes] = await Promise.all([
        api.get('/occasions/settings'),
        api.get('/occasions/due?days=7'),
        api.get('/occasions/logs'),
        api.get('/occasions/analytics')
      ]);

      setSettings(settingsRes);
      setDueData(dueRes);
      setLogs(logsRes || []);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error('Failed to load occasion automation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDailyScan = async () => {
    try {
      setStatusMessage('Executing automated daily occasion scan...');
      const res = await api.post('/occasions/run-daily-job', { bypass_quiet_hours: true });
      setStatusMessage(`Scan Complete: ${res.summary.sentCount} sent, ${res.summary.skippedCount} skipped/duplicate protected.`);
      fetchAllData();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert('Scan failed: ' + err.message);
    }
  };

  const handleSendSingleGreeting = async (customerId: string, occasionType: OccasionType) => {
    try {
      setSendingId(customerId);
      const res = await api.post('/occasions/send-greeting', {
        customer_id: customerId,
        occasion_type: occasionType,
        bypass_quiet_hours: true,
        bypass_idempotency: false
      });
      alert(res.message || 'Greeting dispatched successfully!');
      fetchAllData();
    } catch (err: any) {
      alert('Dispatch failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSendingId(null);
    }
  };

  const handleSaveSettings = async (updatedSettings: OccasionAutomationSettings) => {
    setSavingSettings(true);
    try {
      const res = await api.put('/occasions/settings', updatedSettings);
      setSettings(res.settings);
      alert('Occasion automation settings and backend offer configurations saved!');
      fetchAllData();
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleGenerateAiCopyPreview = async (occasionType: OccasionType) => {
    setIsGeneratingAiCopy(true);
    try {
      const res = await api.post('/occasions/generate-ai-copy', {
        occasion_type: occasionType,
        language: 'bn'
      });
      setAiPreviewResult(res);
    } catch (err: any) {
      alert('AI Preview generation failed: ' + err.message);
    } finally {
      setIsGeneratingAiCopy(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Loading Automated Occasion Engine & Backend Offer Studio...
      </div>
    );
  }

  const todayItems = dueData?.today?.items || [];
  const upcomingGroups = dueData?.upcoming || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
              <Gift className="h-3 w-3" />
              <span>Automated Occasions & Loyalty Engine</span>
            </span>
            <span className="text-xs text-slate-400">Shopkeeper-Controlled Offers</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <span>Customer Celebration & Anniversary Marketing</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Celebrate customer birthdays, wedding anniversaries, and device purchase milestones with verified WhatsApp greetings and shopkeeper-governed special discounts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunDailyScan}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 flex items-center space-x-2 transition transform active:scale-95"
          >
            <Play className="h-4 w-4" />
            <span>Run Daily Occasion Scan</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-purple-950/60 border border-purple-500/40 p-4 rounded-xl text-purple-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-purple-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Total Occasion Messages</span>
            <Gift className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {analytics?.totalOccasionMessagesSent || logs.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {analytics?.messagesDelivered || logs.length} Delivered via WhatsApp/SMS
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Today's Celebrations</span>
            <Cake className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300 font-mono">
            {dueData?.today?.count || 0} Due Today
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {todayItems.filter((i: any) => i.has_offer).length} with Special Coupon Attached
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Offers Redeemed</span>
            <Percent className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {analytics?.offerRedemptions || logs.filter(l => l.status === 'REDEEMED').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Verified Store Checkout Redemptions
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/30 to-slate-900 border border-purple-500/30 shadow-lg shadow-purple-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-purple-300">Attributed Occasion Sales</span>
            <IndianRupee className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            ₹{Number(analytics?.attributedRevenue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Direct Repeat Customer Revenue
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'overview'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Gift className="h-4 w-4" />
          <span>Today's Occasions ({dueData?.today?.count || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'upcoming'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Upcoming (Next 7 Days) ({dueData?.totalUpcomingCount || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'offers'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="h-4 w-4" />
          <span>Special Offer Controls</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'settings'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Automation Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'logs'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Occasion History & Logs ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: TODAY'S DUE OCCASIONS */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Cake className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Celebrations Due Today ({new Date().toLocaleDateString('en-GB')})</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Auto-Protected from Duplicates
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Customers whose birthday, wedding anniversary, or 1-year device purchase milestone falls today.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunDailyScan}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
              >
                Send All Eligible Today
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Occasion</th>
                    <th className="p-3.5">Device History</th>
                    <th className="p-3.5">Offer Attached</th>
                    <th className="p-3.5">Eligibility & Safety</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {todayItems.length > 0 ? (
                    todayItems.map((item: any) => {
                      const c = item.customer;
                      const isSending = sendingId === c.id;

                      return (
                        <tr key={c.id + item.occasion_type} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <div className="font-bold text-white flex items-center space-x-1.5">
                              <span>{c.full_name}</span>
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">{c.phone_e164}</div>
                          </td>
                          <td className="p-3.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              item.occasion_type === 'BIRTHDAY'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : item.occasion_type === 'WEDDING_ANNIVERSARY'
                                ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            }`}>
                              {item.occasion_label}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            <div className="font-medium text-slate-200">{c.brand} {c.model}</div>
                            <div className="text-[10px] text-slate-500">Bought: {c.purchase_date}</div>
                          </td>
                          <td className="p-3.5">
                            {item.has_offer ? (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-1.5 max-w-xs text-[11px] text-emerald-300">
                                <span className="font-bold block">{item.offer_summary}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">Greeting only (Offer disabled)</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {item.is_eligible ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 w-fit">
                                <ShieldCheck className="h-3 w-3" />
                                <span>Verified Eligible</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1 w-fit" title={item.ineligibility_reason}>
                                <ShieldAlert className="h-3 w-3" />
                                <span>{item.ineligibility_reason || 'Excluded'}</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => onViewCustomer(c.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-semibold text-[11px]"
                            >
                              Profile
                            </button>
                            {item.is_eligible ? (
                              <button
                                disabled={isSending}
                                onClick={() => handleSendSingleGreeting(c.id, item.occasion_type)}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow-sm transition disabled:opacity-50"
                              >
                                {isSending ? 'Sending...' : 'Send Greeting Now'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSendSingleGreeting(c.id, item.occasion_type)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-[11px] border border-amber-500/30"
                                title="Force send test in QA mode"
                              >
                                Test Override
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                        No customer celebrations fall on today's date ({new Date().toLocaleDateString('en-GB')}). Check the Upcoming tab or use the Occasion Simulator in QA Testing Center!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UPCOMING OCCASIONS */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl p-5 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-400" />
                <span>Upcoming Celebrations in the Next 7 Days</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Plan ahead or configure advance notices so customers receive greetings and promotional vouchers before their special day.
              </p>
            </div>

            {upcomingGroups.length > 0 ? (
              upcomingGroups.map((group: any) => (
                <div key={group.dateStr} className="border border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-950 p-3 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-300">
                      Date: {group.dateStr} (In {group.dayOffset} day{group.dayOffset > 1 ? 's' : ''})
                    </span>
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono text-[10px]">
                      {group.items.length} Customer{group.items.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    {group.items.map((it: any) => (
                      <div key={it.customer.id + it.occasion_type} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/40 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-white flex items-center space-x-2">
                            <span>{it.customer.full_name}</span>
                            <span className="text-[10px] font-mono text-slate-400">({it.customer.phone_e164})</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                              {it.occasion_label}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Owned: {it.customer.brand} {it.customer.model} • {it.has_offer ? it.offer_summary : 'Greeting only'}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onViewCustomer(it.customer.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px] hover:text-white"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => handleSendSingleGreeting(it.customer.id, it.occasion_type)}
                            className="px-2.5 py-1 rounded bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[11px] hover:bg-purple-600 hover:text-white"
                          >
                            Send Advance
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No customer birthdays or anniversaries recorded for the upcoming 7 days.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BACKEND SPECIAL OFFER SETTINGS */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl text-amber-200 text-xs flex items-start space-x-3">
            <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm mb-0.5">Strict Shopkeeper Commercial Control</span>
              Discounts, coupon codes, and commercial terms are NEVER invented automatically by AI. Every coupon code, discount percentage, and applicable category must be explicitly enabled and configured by the shop owner here.
            </div>
          </div>

          {/* Birthday Offer */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Cake className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Birthday Special Offer</h3>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <span className="text-xs font-semibold text-slate-300">
                  {settings.offers.birthday?.enabled ? 'OFFER ACTIVE' : 'OFFER DISABLED (Greeting Only)'}
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.offers.birthday?.enabled)}
                  onChange={(e) => {
                    const next = { ...settings };
                    if (!next.offers.birthday) next.offers.birthday = {} as any;
                    next.offers.birthday.enabled = e.target.checked;
                    setSettings(next);
                  }}
                  className="h-5 w-5 accent-purple-600 rounded"
                />
              </label>
            </div>

            {settings.offers.birthday?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Offer Title</label>
                  <input
                    type="text"
                    value={settings.offers.birthday?.offer_name || ''}
                    onChange={(e) => {
                      const next = { ...settings };
                      next.offers.birthday.offer_name = e.target.value;
                      setSettings(next);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    placeholder="e.g. Birthday Special 10% Discount"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Discount Type & Value</label>
                  <div className="flex space-x-2">
                    <select
                      value={settings.offers.birthday?.discount_type || 'PERCENTAGE'}
                      onChange={(e) => {
                        const next = { ...settings };
                        next.offers.birthday.discount_type = e.target.value as any;
                        setSettings(next);
                      }}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT_AMOUNT">Flat Amount (₹)</option>
                      <option value="FREE_GIFT">Free Gift Item</option>
                    </select>
                    <input
                      type="number"
                      value={settings.offers.birthday?.discount_value || 0}
                      onChange={(e) => {
                        const next = { ...settings };
                        next.offers.birthday.discount_value = Number(e.target.value);
                        setSettings(next);
                      }}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={settings.offers.birthday?.coupon_code || ''}
                    onChange={(e) => {
                      const next = { ...settings };
                      next.offers.birthday.coupon_code = e.target.value.toUpperCase();
                      setSettings(next);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-300 font-mono font-bold uppercase"
                    placeholder="BDAY10"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Applicable Category</label>
                  <input
                    type="text"
                    value={settings.offers.birthday?.applicable_category || ''}
                    onChange={(e) => {
                      const next = { ...settings };
                      next.offers.birthday.applicable_category = e.target.value;
                      setSettings(next);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    placeholder="Mobile Accessories, Living Room, etc."
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Validity Duration</label>
                  <select
                    value={settings.offers.birthday?.validity_option || '3_DAYS'}
                    onChange={(e) => {
                      const next = { ...settings };
                      next.offers.birthday.validity_option = e.target.value as any;
                      setSettings(next);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs"
                  >
                    <option value="OCCASION_DAY_ONLY">Exact Birthday Only</option>
                    <option value="3_DAYS">Valid for 3 Days</option>
                    <option value="7_DAYS">Valid for 7 Days</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Store Visit Required</label>
                  <select
                    value={settings.offers.birthday?.store_visit_required ? 'YES' : 'NO'}
                    onChange={(e) => {
                      const next = { ...settings };
                      next.offers.birthday.store_visit_required = e.target.value === 'YES';
                      setSettings(next);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs"
                  >
                    <option value="YES">YES — Must visit store to redeem</option>
                    <option value="NO">NO — Online / WhatsApp order eligible</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Wedding Anniversary Offer */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-pink-400" />
                <h3 className="font-bold text-white text-base">Wedding Anniversary Offer</h3>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <span className="text-xs font-semibold text-slate-300">
                  {settings.offers.wedding_anniversary?.enabled ? 'OFFER ACTIVE' : 'OFFER DISABLED (Greeting Only)'}
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.offers.wedding_anniversary?.enabled)}
                  onChange={(e) => {
                    const next = { ...settings };
                    if (!next.offers.wedding_anniversary) next.offers.wedding_anniversary = {} as any;
                    next.offers.wedding_anniversary.enabled = e.target.checked;
                    setSettings(next);
                  }}
                  className="h-5 w-5 accent-purple-600 rounded"
                />
              </label>
            </div>

            {settings.offers.wedding_anniversary?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Offer Title</label>
                  <input
                    type="text"
                    value={settings.offers.wedding_anniversary?.offer_name || ''}
                    onChange={(e) => {
                      const next = { ...settings };
                      next.offers.wedding_anniversary.offer_name = e.target.value;
                      setSettings(next);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    placeholder="e.g. Anniversary Gift Voucher ₹500 Off"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={settings.offers.wedding_anniversary?.coupon_code || ''}
                    onChange={(e) => {
                      const next = { ...settings };
                      next.offers.wedding_anniversary.coupon_code = e.target.value.toUpperCase();
                      setSettings(next);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-pink-300 font-mono font-bold uppercase"
                    placeholder="ANNIV500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Flat Discount (₹)</label>
                  <input
                    type="number"
                    value={settings.offers.wedding_anniversary?.discount_value || 0}
                    onChange={(e) => {
                      const next = { ...settings };
                      next.offers.wedding_anniversary.discount_value = Number(e.target.value);
                      setSettings(next);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => handleSaveSettings(settings)}
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition"
            >
              {savingSettings ? 'Saving...' : 'Save Special Offer Settings'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: AUTOMATION SETTINGS & AI COPY GENERATOR */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-5">
            <h3 className="font-bold text-white text-base flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Settings className="h-5 w-5 text-purple-400" />
              <span>Occasion Automation Channels & Schedules</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Birthday Automation</span>
                <p className="text-slate-400 text-[11px]">Automatically message customers on their birth date.</p>
                <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.birthday_enabled}
                    onChange={(e) => setSettings({ ...settings, birthday_enabled: e.target.checked })}
                    className="h-4 w-4 accent-purple-600 rounded"
                  />
                  <span className="text-purple-300 font-semibold">{settings.birthday_enabled ? 'ENABLED' : 'DISABLED'}</span>
                </label>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Wedding Anniversary</span>
                <p className="text-slate-400 text-[11px]">Send congratulations and family celebration offer.</p>
                <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.wedding_anniversary_enabled}
                    onChange={(e) => setSettings({ ...settings, wedding_anniversary_enabled: e.target.checked })}
                    className="h-4 w-4 accent-purple-600 rounded"
                  />
                  <span className="text-purple-300 font-semibold">{settings.wedding_anniversary_enabled ? 'ENABLED' : 'DISABLED'}</span>
                </label>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Purchase Anniversary</span>
                <p className="text-slate-400 text-[11px]">Celebrate 1, 2, or 3 years of device ownership.</p>
                <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.purchase_anniversary_enabled}
                    onChange={(e) => setSettings({ ...settings, purchase_anniversary_enabled: e.target.checked })}
                    className="h-4 w-4 accent-purple-600 rounded"
                  />
                  <span className="text-purple-300 font-semibold">{settings.purchase_anniversary_enabled ? 'ENABLED' : 'DISABLED'}</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Primary Communication Channel</label>
                <select
                  value={settings.channel || 'WHATSAPP'}
                  onChange={(e) => setSettings({ ...settings, channel: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="WHATSAPP">WhatsApp (Meta Cloud API / Verified Provider)</option>
                  <option value="SMS">SMS (Transactional Provider)</option>
                  <option value="AUTO">Auto (WhatsApp Preferred, SMS Fallback)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Scheduled Send Time (IST)</label>
                <input
                  type="time"
                  value={settings.send_time || '10:00'}
                  onChange={(e) => setSettings({ ...settings, send_time: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Timing</label>
                <select
                  value={settings.send_days_in_advance || 0}
                  onChange={(e) => setSettings({ ...settings, send_days_in_advance: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value={0}>Send On Exact Occasion Day</option>
                  <option value={1}>Send 1 Day in Advance</option>
                  <option value={2}>Send 2 Days in Advance</option>
                  <option value={3}>Send 3 Days in Advance</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => handleSaveSettings(settings)}
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition"
              >
                {savingSettings ? 'Saving...' : 'Save Automation Settings'}
              </button>
            </div>
          </div>

          {/* Grounded AI Copy Generator Studio */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Grounded Occasion AI Message Preview</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setAiPreviewOccasion('BIRTHDAY');
                    handleGenerateAiCopyPreview('BIRTHDAY');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    aiPreviewOccasion === 'BIRTHDAY' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Birthday Preview
                </button>
                <button
                  onClick={() => {
                    setAiPreviewOccasion('WEDDING_ANNIVERSARY');
                    handleGenerateAiCopyPreview('WEDDING_ANNIVERSARY');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    aiPreviewOccasion === 'WEDDING_ANNIVERSARY' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Anniversary Preview
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              AI automatically combines customer profile information and the shopkeeper's configured offer details into a warm, natural message without hallucinating unauthorized discounts.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Live WhatsApp Message Preview
              </span>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-200 font-sans whitespace-pre-line leading-relaxed">
                {isGeneratingAiCopy ? (
                  <span className="text-slate-500 italic">Generating grounded preview...</span>
                ) : aiPreviewResult ? (
                  aiPreviewResult.bengali
                ) : (
                  `শুভ জন্মদিন Rahul da! 🎉\nআপনার জন্য রয়েছে Birthday Special Offer —\nMobile Accessories-এ 10% discount!\nCoupon Code: BDAY10\nআগামী 3 দিন valid।\n— Saha Electronics`
                )}
              </div>
              <p className="text-[10px] text-slate-500 flex items-center space-x-1 pt-1">
                <Check className="h-3 w-3 text-emerald-400" />
                <span>Includes customer name token, verified coupon, and shop signature.</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OCCASION LOGS & REDEMPTION HISTORY */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="h-4 w-4 text-purple-400" />
                <span>Occasion Greetings Dispatched & Offer Redemptions</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {logs.length} Total Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Occasion</th>
                    <th className="p-3.5">Message Sent</th>
                    <th className="p-3.5">Coupon & Offer</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Revenue</th>
                    <th className="p-3.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-white">{log.customer_name}</div>
                          <div className="font-mono text-[11px] text-slate-400">{log.customer_phone}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            log.occasion_type === 'BIRTHDAY'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : log.occasion_type === 'WEDDING_ANNIVERSARY'
                              ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}>
                            {log.occasion_type}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-xs truncate text-slate-300 italic" title={log.message}>
                          "{log.message}"
                        </td>
                        <td className="p-3.5">
                          {log.coupon_code ? (
                            <div className="flex items-center space-x-1.5 font-mono">
                              <Tag className="h-3 w-3 text-purple-400" />
                              <span className="font-bold text-purple-300">{log.coupon_code}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">No coupon</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            log.status === 'REDEEMED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : log.status === 'DELIVERED' || log.status === 'SENT'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : log.status === 'REPLIED'
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-white">
                          {log.attributed_revenue ? `₹${log.attributed_revenue.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="p-3.5 text-right text-slate-400 text-[11px]">
                          {new Date(log.sent_at).toLocaleDateString('en-GB')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                        No occasion greeting logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
