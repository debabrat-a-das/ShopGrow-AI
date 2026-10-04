import React, { useEffect, useState } from 'react';
import { 
  Users, Send, CheckCircle2, MessageSquare, Flame, 
  Store, IndianRupee, TrendingUp, Sparkles, ArrowRight, 
  Phone, ChevronRight, PlayCircle, ShoppingBag, Eye,
  Gift, Cake, Heart, Calendar, Tag, AlertTriangle, ShieldAlert,
  Clock, ArrowUpRight, Share2, Check, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Customer, Lead } from '../types';

interface DashboardProps {
  onNavigate: (tab: string, extra?: any) => void;
  onOpenSimulator: () => void;
  onOpenImport: () => void;
  onRecordSale: (customer?: Customer) => void;
  onViewCustomer: (customerId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenSimulator,
  onOpenImport,
  onRecordSale,
  onViewCustomer
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkVisit = async (leadId?: string) => {
    if (!leadId) {
      onNavigate('inbox', { filter: 'visit' });
      return;
    }
    try {
      await api.patch(`/leads/${leadId}/status`, { status: 'VISITED' });
      setActionStatus('Customer visit marked successfully!');
      fetchDashboardData();
      setTimeout(() => setActionStatus(null), 4000);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const handleActionClick = async (action: any) => {
    if (action.action === 'NAVIGATE') {
      onNavigate(action.target, action.payload);
    } else if (action.action === 'CALL') {
      if (action.target) {
        window.open(`tel:${action.target}`, '_self');
      } else {
        onNavigate('inbox', { tab: 'hot_leads' });
      }
    } else if (action.action === 'MARK_VISITED') {
      handleMarkVisit(action.target);
    } else if (action.action === 'TRIGGER_OCCASION_JOB') {
      try {
        setActionStatus('Dispatching automated occasion greetings...');
        await api.post('/occasions/run-daily-job', { bypass_quiet_hours: true });
        setActionStatus('Occasion greetings sent via WhatsApp/SMS!');
        fetchDashboardData();
        setTimeout(() => setActionStatus(null), 4000);
      } catch (err: any) {
        alert('Failed: ' + err.message);
      }
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Loading live retail marketing & sales dashboard...
      </div>
    );
  }

  const kpis = data.kpiCards;
  const primary = data.primaryKpis || {
    newLeads: kpis.interestedCustomers || 0,
    hotLeads: kpis.hotLeads || 0,
    todayVisits: kpis.storeVisitIntent || 0,
    confirmedSales: kpis.confirmedSales || 0,
    attributedRevenue: kpis.attributedRevenue || 0
  };
  const occasion = data.occasionKpis || {
    todayBirthdays: kpis.todayBirthdays || 0,
    todayWeddingAnniversaries: kpis.todayWeddingAnniversaries || 0,
    todayPurchaseAnniversaries: kpis.todayPurchaseAnniversaries || 0,
    upcomingOccasions: kpis.upcomingOccasions || 0,
    occasionOfferRedemptions: kpis.occasionOfferRedemptions || 0
  };

  const actionItems = data.actionCenterItems || [];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Welcome Banner & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {data.shop?.name || 'Saha Electronics'} • {data.shop?.city || 'Kolkata'}
            </span>
            <span className="text-xs text-slate-400">Retail Command Hub</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Customer Re-engagement & Sales Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Turn your customer database into repeat footfalls, occasion celebrations, and confirmed sales.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenImport}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
          >
            Import Customer Excel
          </button>
          <button
            onClick={() => onNavigate('automated-occasions')}
            className="px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 font-semibold text-xs border border-purple-500/30 flex items-center space-x-1.5 transition"
          >
            <Gift className="h-4 w-4 text-purple-400" />
            <span>Automated Occasions</span>
          </button>
          <button
            onClick={() => onNavigate('campaigns')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 flex items-center space-x-2 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>Launch AI Campaign</span>
          </button>
        </div>
      </div>

      {actionStatus && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 p-4 rounded-xl text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold">{actionStatus}</span>
          </div>
          <button onClick={() => setActionStatus(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TODAY'S AI ACTION CENTER (Section 3 Requirement) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/95 rounded-2xl border border-indigo-500/30 shadow-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5 animate-pulse text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center space-x-2">
                <span>TODAY'S AI ACTION CENTER</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Priority Tasks
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Actionable retail opportunities identified today across hot leads, store visits, celebrations, and customer follow-ups.
              </p>
            </div>
          </div>

          <button
            onClick={fetchDashboardData}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-semibold self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Actions</span>
          </button>
        </div>

        {/* Action Center Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {actionItems.map((item: any) => {
            const getIcon = () => {
              switch (item.type) {
                case 'HOT_LEADS': return <Flame className="h-4 w-4 text-rose-400" />;
                case 'VISIT_INTENT': return <Store className="h-4 w-4 text-amber-400" />;
                case 'BIRTHDAY': return <Cake className="h-4 w-4 text-purple-400" />;
                case 'WEDDING_ANNIVERSARY': return <Heart className="h-4 w-4 text-pink-400" />;
                case 'PURCHASE_ANNIVERSARY': return <Calendar className="h-4 w-4 text-cyan-400" />;
                case 'CAMPAIGN_ELIGIBLE': return <Send className="h-4 w-4 text-blue-400" />;
                case 'SOCIAL_COMMENTS': return <Share2 className="h-4 w-4 text-indigo-400" />;
                case 'FOLLOW_UP': return <Clock className="h-4 w-4 text-teal-400" />;
                case 'OFFER_REDEMPTION': return <Tag className="h-4 w-4 text-emerald-400" />;
                case 'DELIVERY_ERROR': return <AlertTriangle className="h-4 w-4 text-rose-400" />;
                default: return <Sparkles className="h-4 w-4 text-indigo-400" />;
              }
            };

            const isHigh = item.severity === 'HIGH';

            return (
              <div 
                key={item.id} 
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-150 ${
                  isHigh 
                    ? 'bg-slate-950/80 border-rose-500/30 hover:border-rose-500/50 shadow-md shadow-rose-950/20' 
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {item.badge}
                    </span>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {getIcon()}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-end space-x-2">
                  {item.actions?.map((act: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleActionClick(act)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition flex items-center space-x-1 ${
                        idx === 0 
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>{act.label}</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRIMARY KPI CARDS (Section 4 Requirement) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Primary Store Sales & Pipeline KPIs
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">New Leads</span>
            <div className="text-2xl font-extrabold text-white font-mono">{primary.newLeads}</div>
            <p className="text-[10px] text-slate-500 mt-1">Inquiries this month</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-rose-500/30 shadow-sm shadow-rose-950/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-rose-300 font-semibold">Hot Leads</span>
              <Flame className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-extrabold text-rose-400 font-mono">{primary.hotLeads}</div>
            <p className="text-[10px] text-slate-500 mt-1">Intent score &gt;= 70%</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-amber-300 font-semibold">Today's Visits</span>
              <Store className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-300 font-mono">{primary.todayVisits}</div>
            <p className="text-[10px] text-slate-500 mt-1">Showroom walk-in intent</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-semibold">Confirmed Sales</span>
              <ShoppingBag className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-cyan-300 font-mono">{primary.confirmedSales}</div>
            <p className="text-[10px] text-slate-500 mt-1">Closed store purchases</p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-emerald-300 font-bold">Attributed Revenue</span>
              <IndianRupee className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              ₹{Number(primary.attributedRevenue || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Total closed conversions</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. OCCASION KPI CARDS (Section 4 Requirement) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Gift className="h-3.5 w-3.5 text-purple-400" />
            <span>Customer Occasions & Anniversary Performance</span>
          </h3>
          <button 
            onClick={() => onNavigate('automated-occasions')}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1"
          >
            <span>Manage Occasion Offers</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Today's Birthdays</span>
              <Cake className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-purple-300 font-mono">{occasion.todayBirthdays}</div>
            <p className="text-[10px] text-slate-500 mt-1">Automated WhatsApp greeting</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Wedding Anniversaries</span>
              <Heart className="h-4 w-4 text-pink-400" />
            </div>
            <div className="text-2xl font-extrabold text-pink-300 font-mono">{occasion.todayWeddingAnniversaries}</div>
            <p className="text-[10px] text-slate-500 mt-1">Celebration gift vouchers</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Purchase Anniversaries</span>
              <Calendar className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-cyan-300 font-mono">{occasion.todayPurchaseAnniversaries}</div>
            <p className="text-[10px] text-slate-500 mt-1">1 or 2 years device tenure</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Upcoming (7 Days)</span>
              <Clock className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-300 font-mono">{occasion.upcomingOccasions}</div>
            <p className="text-[10px] text-slate-500 mt-1">Pre-planned celebrations</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-emerald-300 font-semibold">Offer Redemptions</span>
              <Tag className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">{occasion.occasionOfferRedemptions}</div>
            <p className="text-[10px] text-slate-500 mt-1">Celebratory sales closed</p>
          </div>
        </div>
      </div>

      {/* Secondary Operational KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400">
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
          <span>Total Database:</span>
          <span className="font-bold text-white font-mono">{kpis.totalCustomers} ({kpis.optedInCustomers} Opted In)</span>
        </div>
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
          <span>Campaigns Sent:</span>
          <span className="font-bold text-indigo-400 font-mono">{kpis.campaignsSent}</span>
        </div>
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
          <span>Messages Delivered:</span>
          <span className="font-bold text-emerald-400 font-mono">{kpis.messagesDelivered}</span>
        </div>
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
          <span>Customer Replies:</span>
          <span className="font-bold text-teal-400 font-mono">{kpis.replies}</span>
        </div>
      </div>

      {/* Hot Leads Today Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Hot Leads Today</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Immediate Sales Opportunity
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Customers actively asking about exchange bonus, price, or visiting the showroom today.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('inbox', { tab: 'hot_leads' })}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
          >
            <span>Open All in Inbox</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Product</th>
                <th className="p-3.5">Intent</th>
                <th className="p-3.5">Lead Score</th>
                <th className="p-3.5">Last Message</th>
                <th className="p-3.5">Recommended Action</th>
                <th className="p-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {data.hotLeadsToday?.length > 0 ? (
                data.hotLeadsToday.map((lead: Lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{lead.customer_name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{lead.customer_phone}</div>
                    </td>
                    <td className="p-3.5 text-slate-300 font-medium">{lead.product}</td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {lead.intent}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-rose-400 text-sm">
                          {lead.lead_score}
                        </span>
                        <span className="text-[10px] text-slate-500">/100</span>
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs truncate text-slate-300 italic">
                      "{lead.last_message}"
                    </td>
                    <td className="p-3.5 max-w-xs text-emerald-300 text-[11px]">
                      {lead.recommended_action}
                    </td>
                    <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => onNavigate('inbox', { customerPhone: lead.customer_phone })}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition font-semibold text-[11px]"
                      >
                        Open Chat
                      </button>
                      <button
                        onClick={() => handleMarkVisit(lead.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600 hover:text-white transition font-semibold text-[11px]"
                      >
                        Mark Visited
                      </button>
                      <button
                        onClick={() => onRecordSale({ id: lead.customer_id, full_name: lead.customer_name, phone_e164: lead.customer_phone } as any)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition font-semibold text-[11px]"
                      >
                        Confirm Sale
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 text-xs">
                    No hot leads pending right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Conversion Funnel */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>Full Campaign Conversion Funnel</span>
            </h3>
            <p className="text-xs text-slate-400">
              Track how customer database contacts convert into store visits and confirmed revenue.
            </p>
          </div>
          <button
            onClick={() => onNavigate('analytics')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
          >
            <span>View Full Analytics</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center text-xs pt-2">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">1. Audience</span>
            <span className="text-base font-bold text-white font-mono">{data.funnel.audience}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">2. Delivered</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{data.funnel.delivered}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">3. Replied</span>
            <span className="text-base font-bold text-teal-400 font-mono">{data.funnel.replied}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">4. Interested</span>
            <span className="text-base font-bold text-cyan-400 font-mono">{data.funnel.interested}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">5. Hot Leads</span>
            <span className="text-base font-bold text-rose-400 font-mono">{data.funnel.hotLeads}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">6. Store Visits</span>
            <span className="text-base font-bold text-amber-400 font-mono">{data.funnel.storeVisits}</span>
          </div>
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/40">
            <span className="text-[10px] text-emerald-400 block uppercase font-bold">7. Sales Confirmed</span>
            <span className="text-base font-bold text-white font-mono">{data.funnel.sales}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
