import React, { useEffect, useState } from 'react';
import { 
  X, User, Phone, MapPin, Tag, ShieldCheck, ShieldAlert, 
  ShoppingBag, Send, MessageSquare, Clock, History, AlertTriangle, Brain,
  Gift, Sparkles, Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';

interface CustomerDetailDrawerProps {
  customerId: string | null;
  onClose: () => void;
  onCustomerUpdated: () => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  customerId,
  onClose,
  onCustomerUpdated
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId) {
      setData(null);
      return;
    }
    fetchCustomerData(customerId);
  }, [customerId]);

  const fetchCustomerData = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/${id}`);
      setData(res);
    } catch (err: any) {
      alert('Error fetching customer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConsent = async () => {
    if (!customerId) return;
    if (!window.confirm('Are you sure you want to revoke WhatsApp marketing consent for this customer?')) return;

    try {
      await api.patch(`/customers/${customerId}/opt-out`);
      fetchCustomerData(customerId);
      onCustomerUpdated();
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  if (!customerId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              {data?.customer?.full_name ? data.customer.full_name[0] : 'C'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>{data?.customer?.full_name || 'Loading customer...'}</span>
                {data?.customer?.whatsapp_opt_in ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Consent Active
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    No Consent / DNC
                  </span>
                )}
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {data?.customer?.phone_e164}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            Loading Customer 360 profile...
          </div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 sm:space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Total Purchases</span>
                <span className="text-base font-bold text-white">
                  ₹{Number(data.customer.purchase_value || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Engagement</span>
                <span className="text-base font-bold text-emerald-400">
                  {data.customer.engagement_score} / 100
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Lead Stage</span>
                <span className="text-base font-bold text-amber-400 font-mono">
                  {data.customer.lead_status}
                </span>
              </div>
            </div>

            {/* Profile Overview */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Device & Purchase History
              </h3>
              <div className="flex justify-between">
                <span className="text-slate-400">Device Owned:</span>
                <span className="font-semibold text-white">{data.customer.brand} {data.customer.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Purchase Date:</span>
                <span className="text-slate-300">{data.customer.purchase_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="text-slate-300">{data.customer.location || 'Kolkata'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tags:</span>
                <div className="flex space-x-1">
                  {data.customer.tags?.map((t: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Stored Memory (Ask Once -> Reuse) */}
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Brain className="h-4 w-4 text-emerald-400" />
                  <span>AI Customer Memory (Ask Once → Reuse)</span>
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                  Never Re-ask
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Stored Budget Range</span>
                  <span className="font-semibold text-white font-mono">
                    {data.customer.budget_range || 'Not specified yet'}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Active Context Product</span>
                  <span className="font-semibold text-cyan-300 truncate block">
                    {data.customer.last_discussed_product || data.customer.model || 'None'}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Stored Residence/City</span>
                  <span className="font-semibold text-white">
                    {data.customer.location || 'Kolkata'}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Multi-Channel Link</span>
                  <span className="font-semibold text-purple-300 truncate block">
                    {data.customer.social_user_id ? `${data.customer.social_platform || 'Social'}: ${data.customer.social_user_id}` : 'WhatsApp Native'}
                  </span>
                </div>
              </div>
            </div>

            {/* Occasion & Relationship Profile */}
            <div className="bg-slate-950 p-4 rounded-xl border border-pink-500/30 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Gift className="h-4 w-4 text-pink-400" />
                  <span>Occasion & Relationship Data</span>
                </h3>
                <span className="text-[10px] bg-pink-500/10 text-pink-300 border border-pink-500/20 px-2 py-0.5 rounded-full font-mono">
                  Automated Engine
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Date of Birth</span>
                  <span className="font-semibold text-white font-mono">
                    {data.customer.date_of_birth ? new Date(data.customer.date_of_birth).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not recorded'}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Wedding Anniversary</span>
                  <span className="font-semibold text-white font-mono">
                    {data.customer.wedding_anniversary ? new Date(data.customer.wedding_anniversary).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not recorded'}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Customer Since</span>
                  <span className="font-semibold text-slate-300 font-mono">
                    {data.customer.customer_since_date || data.customer.created_at?.slice(0, 10) || 'N/A'}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">First Purchase Date</span>
                  <span className="font-semibold text-slate-300 font-mono">
                    {data.customer.first_purchase_date || data.customer.purchase_date || 'N/A'}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Last Birthday Greeting</span>
                  <span className="font-semibold text-pink-300 font-mono">
                    {data.customer.last_birthday_message_at ? new Date(data.customer.last_birthday_message_at).toLocaleDateString() : 'Never sent'}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Last Anniversary Greeting</span>
                  <span className="font-semibold text-purple-300 font-mono">
                    {data.customer.last_anniversary_message_at ? new Date(data.customer.last_anniversary_message_at).toLocaleDateString() : 'Never sent'}
                  </span>
                </div>
              </div>

              {/* Occasion Logs / Redemption History */}
              {data.occasionHistory && data.occasionHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Occasion Offer History</span>
                  {data.occasionHistory.map((occ: any, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-white">{occ.occasion_type} ({occ.year})</span>
                        <span className="text-slate-400 block text-[10px] font-mono">Coupon: {occ.coupon_code || 'Greeting Only'}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        occ.redeemed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {occ.redeemed ? `Redeemed (₹${occ.attributed_sale_amount || 0})` : 'Delivered'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unified Customer Journey Timeline */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <History className="h-4 w-4 text-purple-400" />
                  <span>Unified Customer Journey Timeline</span>
                </h3>
                <span className="text-[10px] text-slate-400 bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full font-mono">
                  {data.journeyTimeline?.length || 0} Touchpoints
                </span>
              </div>

              {data.journeyTimeline && data.journeyTimeline.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {data.journeyTimeline.map((item: any) => {
                    const getIcon = () => {
                      switch (item.type) {
                        case 'COMMENT':
                          return <MessageSquare className="h-3 w-3 text-blue-400" />;
                        case 'LEAD_QUALIFIED':
                          return <Tag className="h-3 w-3 text-amber-400" />;
                        case 'CONSENT':
                          return <ShieldCheck className="h-3 w-3 text-emerald-400" />;
                        case 'CAMPAIGN':
                          return <Send className="h-3 w-3 text-cyan-400" />;
                        case 'DEMO_VISIT':
                          return <MapPin className="h-3 w-3 text-pink-400" />;
                        case 'PURCHASE':
                          return <ShoppingBag className="h-3 w-3 text-emerald-400" />;
                        case 'OCCASION':
                          return <Gift className="h-3 w-3 text-pink-400" />;
                        case 'OFFER_REDEEMED':
                          return <Sparkles className="h-3 w-3 text-amber-400" />;
                        default:
                          return <Clock className="h-3 w-3 text-slate-400" />;
                      }
                    };

                    const getBadgeClass = () => {
                      switch (item.channel) {
                        case 'FACEBOOK':
                          return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                        case 'INSTAGRAM':
                          return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
                        case 'WHATSAPP':
                          return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                        case 'BILLING_POS':
                        case 'SHOWROOM':
                          return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                        case 'OCCASION_ENGINE':
                          return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
                        default:
                          return 'bg-slate-800 text-slate-300 border-slate-700';
                      }
                    };

                    return (
                      <div key={item.id} className="relative group">
                        {/* Dot indicator */}
                        <div className="absolute -left-6 top-1 h-4 w-4 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center group-hover:border-purple-400 transition">
                          {getIcon()}
                        </div>

                        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <span className="font-semibold text-slate-200">{item.title}</span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getBadgeClass()}`}>
                                {item.channel}
                              </span>
                              {item.scoreDelta && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Score: {item.scoreDelta}/100
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                              {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-[11px]">No journey timeline recorded yet.</p>
              )}
            </div>

            {/* Consent Audit Trail */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>WhatsApp Consent Audit Trail</span>
                </h3>
                {data.customer.whatsapp_opt_in && (
                  <button
                    onClick={handleRevokeConsent}
                    className="text-[11px] text-rose-400 hover:text-rose-300 underline"
                  >
                    Revoke Consent (Opt-Out)
                  </button>
                )}
              </div>

              {data.consentHistory?.length > 0 ? (
                <div className="space-y-2">
                  {data.consentHistory.map((ce: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start space-x-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold ${ce.type === 'OPT_IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {ce.type}
                          </span>
                          <span className="text-slate-400">via {ce.source}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(ce.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{ce.evidence_reference}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-[11px]">No consent audit events recorded yet.</p>
              )}
            </div>

            {/* Campaigns Received */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Send className="h-4 w-4 text-cyan-400" />
                <span>Campaigns Dispatched ({data.campaignsReceived?.length || 0})</span>
              </h3>

              {data.campaignsReceived?.length > 0 ? (
                <div className="space-y-2">
                  {data.campaignsReceived.map((cr: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="font-mono text-slate-300 text-xs">{cr.message_id}</span>
                        <span className="text-[10px] text-slate-500 block">Sent on: {new Date(cr.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        {cr.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-[11px]">No campaigns dispatched to this customer yet.</p>
              )}
            </div>
          </div>
        ) : null}

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
