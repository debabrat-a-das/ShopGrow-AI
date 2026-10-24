import React, { useEffect, useState } from 'react';
import { 
  Share2, MessageSquare, Zap, ShieldCheck, Search, Filter, RefreshCw, 
  ExternalLink, User, CheckCircle2, AlertTriangle, ArrowRight, Clock, PlusCircle,
  Megaphone, Target, FileText, Layers, IndianRupee, Store, Eye, ThumbsUp
} from 'lucide-react';
import { api } from '../services/api';
import { SocialCommentRecord, Lead } from '../types';

interface SocialLeadsProps {
  currentShopId?: string;
}

export const SocialLeads: React.FC<SocialLeadsProps> = ({ currentShopId }) => {
  const [activeTab, setActiveTab] = useState<'CAMPAIGNS' | 'COMMENTS'>('CAMPAIGNS');
  const [comments, setComments] = useState<SocialCommentRecord[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [metaSettings, setMetaSettings] = useState<any>(null);
  const [filterPlatform, setFilterPlatform] = useState<'ALL' | 'FACEBOOK' | 'INSTAGRAM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PROCESSED' | 'DUPLICATE_IGNORED'>('ALL');

  // Simulation modal
  const [showSimModal, setShowSimModal] = useState(false);
  const [simPlatform, setSimPlatform] = useState<'FACEBOOK' | 'INSTAGRAM'>('FACEBOOK');
  const [simName, setSimName] = useState('Rahul Das');
  const [simCommentId, setSimCommentId] = useState(`comm_${Date.now()}`);
  const [simText, setSimText] = useState('OnePlus 12R exchange offer ache? Showroom-e stock ache?');
  const [simPhone, setSimPhone] = useState('+919830112233');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [currentShopId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [commentsRes, leadsRes, metaRes] = await Promise.all([
        api.get('/meta-integrations/comments').catch(() => ({ success: true, data: [] })),
        api.get('/leads').catch(() => []),
        api.get('/meta-integrations').catch(() => ({ success: true, data: {} }))
      ]);
      if (commentsRes && commentsRes.success) {
        setComments(commentsRes.data || []);
      }
      setLeads(leadsRes || []);
      if (metaRes && metaRes.success) {
        setMetaSettings(metaRes.data || {});
      }
    } catch (err) {
      console.error('Failed to fetch social leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectChannel = async (channel: string) => {
    try {
      await api.post(`/meta-integrations/${channel.toLowerCase()}/reconnect`, { mode: 'MOCK_MODE' });
      alert(`Connected ${channel} in MOCK MODE for this shop!`);
      fetchData();
    } catch (err: any) {
      alert('Failed to connect: ' + err.message);
    }
  };

  const handleSimulate = async (useExistingId = false) => {
    setSimLoading(true);
    setSimResult(null);
    try {
      const targetCommentId = useExistingId ? simCommentId : `comm_${Date.now()}`;
      if (!useExistingId) {
        setSimCommentId(targetCommentId);
      }
      const res = await api.post('/testing/simulate-meta-comment', {
        shopId: currentShopId || 'shop-saha-electronics-001',
        platform: simPlatform,
        postId: 'post_festive_ad_01',
        commentId: targetCommentId,
        authorName: simName,
        authorId: `user_${simName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        commentText: simText,
        customerPhone: simPhone
      });
      setSimResult(res);
      fetchData();
    } catch (err: any) {
      alert('Simulation failed: ' + err.message);
    } finally {
      setSimLoading(false);
    }
  };

  const safeComments = Array.isArray(comments) ? comments : [];
  const filteredComments = safeComments.filter(c => {
    if (filterPlatform !== 'ALL' && c.platform !== filterPlatform) return false;
    if (filterStatus !== 'ALL' && c.processing_status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.user_display_name?.toLowerCase().includes(q);
      const matchText = c.comment_text?.toLowerCase().includes(q);
      const matchIntent = c.detected_intent?.toLowerCase().includes(q);
      if (!matchName && !matchText && !matchIntent) return false;
    }
    return true;
  });

  // KPIs
  const totalComments = safeComments.length;
  const hotLeadsCount = safeComments.filter(c => c.detected_intent === 'PRICE_ENQUIRY' || c.detected_intent === 'VISIT_INTENT' || c.detected_intent === 'EXCHANGE_ENQUIRY').length;
  const duplicateIgnoredCount = safeComments.filter(c => c.processing_status === 'DUPLICATE_IGNORED').length;
  const uniqueUsers = new Set(safeComments.map(c => c.platform_user_id || c.user_display_name)).size;

  const isFbConnected = metaSettings?.facebook?.connection_status === 'LIVE_CONNECTED' || metaSettings?.facebook?.connection_status === 'MOCK_MODE';
  const isAdConnected = metaSettings?.ad_account?.connection_status === 'LIVE_CONNECTED' || metaSettings?.ad_account?.connection_status === 'MOCK_MODE';
  const isIgConnected = metaSettings?.instagram?.connection_status === 'LIVE_CONNECTED' || metaSettings?.instagram?.connection_status === 'MOCK_MODE';

  return (
    <div className="p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Share2 className="h-5 w-5 text-blue-400" />
            <span>Social Marketing & Meta Lead Ingestion</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Meta Facebook & Instagram integrated posts, lead forms, comments, and end-to-end showroom attribution.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'COMMENTS' && (
            <button
              onClick={() => setShowSimModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-1.5 transition text-xs shadow-lg shadow-blue-600/25"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Simulate Inbound Comment</span>
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('CAMPAIGNS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === 'CAMPAIGNS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>Marketing: Social Campaigns & Posts</span>
        </button>

        <button
          onClick={() => setActiveTab('COMMENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === 'COMMENTS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Captured Comments & Inquiries ({comments.length})</span>
        </button>
      </div>

      {activeTab === 'CAMPAIGNS' && (
        <div className="space-y-6">
          {/* Requirement 23: Facebook Page required check */}
          {!isFbConnected && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-amber-300">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Facebook Page is not connected.</h4>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    A verified Facebook Page is required to run live social campaigns, capture page comments, and track organic customer inquiries.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleConnectChannel('FACEBOOK')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition shrink-0"
              >
                CONNECT FACEBOOK PAGE
              </button>
            </div>
          )}

          {/* Requirement 24: Meta Ad Account required check */}
          {!isAdConnected && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-indigo-300">
                <Target className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Meta Ad Account is not connected.</h4>
                  <p className="text-xs text-indigo-200/80 mt-0.5">
                    Connect a permitted Meta Ad Account to manage paid sponsored campaigns, click-to-WhatsApp ads, and multi-touch lead attribution.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleConnectChannel('AD_ACCOUNT')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition shrink-0"
              >
                CONNECT AD ACCOUNT
              </button>
            </div>
          )}

          {/* Requirement 21 & 25: Social Lead Flow & Attribution Chain */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center space-x-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span>End-to-End Social Lead & Revenue Attribution Chain</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-mono">
                Active Closed-Loop Tracking
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-[10px]">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="text-blue-400 font-bold mb-1">1. Facebook Page</div>
                <span className="text-slate-400">Official Brand Page</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="text-blue-400 font-bold mb-1">2. Post / Ad</div>
                <span className="text-slate-400">Targeted Content</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="text-amber-400 font-bold mb-1">3. Interaction</div>
                <span className="text-slate-400">Comment / Form / DM</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="text-purple-400 font-bold mb-1">4. Lead Ingestion</div>
                <span className="text-slate-400">Dedup & Intent Filter</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="text-cyan-400 font-bold mb-1">5. CRM Profile</div>
                <span className="text-slate-400">Unified Inbox</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="text-rose-400 font-bold mb-1">6. Hot Lead</div>
                <span className="text-slate-400">High Purchase Intent</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="text-teal-400 font-bold mb-1">7. Store Visit</div>
                <span className="text-slate-400">In-Store Walk-in</span>
              </div>
              <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/40">
                <div className="text-emerald-400 font-bold mb-1">8. Sale & ROAS</div>
                <span className="text-emerald-200 font-mono">Revenue Attributed</span>
              </div>
            </div>
          </div>

          {/* Requirement 22: Connected shop's Facebook Posts, Instagram Posts, Tracked Ads, and Lead Forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Facebook & Instagram Posts */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                  <Share2 className="h-4 w-4 text-blue-400" />
                  <span>Shop Social Posts (Facebook & Instagram)</span>
                </h3>
                <span className="text-[10px] text-slate-400">Shop ID: {currentShopId}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold text-[10px]">Facebook</span>
                      <span className="font-semibold text-white">Festive Smart TV & Electronics Mega Exchange</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Up to ₹5,000 instant discount on exchange with warranty.</p>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                      <span className="flex items-center"><ThumbsUp className="h-3 w-3 mr-1" /> 142 Likes</span>
                      <span className="flex items-center"><MessageSquare className="h-3 w-3 mr-1" /> 19 Comments</span>
                      <span className="text-emerald-400 font-medium">9 Hot Leads Generated</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">Active</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded bg-pink-900/60 text-pink-300 font-bold text-[10px]">Instagram</span>
                      <span className="font-semibold text-white">Unboxing OnePlus 12R & New Flagship Arrivals</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Experience the Snapdragon 8 Gen 2 at our showroom today!</p>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                      <span className="flex items-center"><Eye className="h-3 w-3 mr-1" /> 1,280 Views</span>
                      <span className="flex items-center"><MessageSquare className="h-3 w-3 mr-1" /> 12 Comments</span>
                      <span className="text-emerald-400 font-medium">6 Hot Leads Generated</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">Active</span>
                </div>
              </div>
            </div>

            {/* Tracked Ads & Meta Lead Forms */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                  <Target className="h-4 w-4 text-indigo-400" />
                  <span>Meta Ads & Instant Lead Forms</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Pixel & CAPI Sync</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-bold text-[10px]">Meta Lead Ad</span>
                      <span className="font-semibold text-white">5km Local Radius Hyperlocal Campaign</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Instant Lead Form: "Claim In-Store VIP Upgrade Voucher ₹1,000"</p>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                      <span>3,420 Impressions</span>
                      <span className="text-emerald-400 font-medium">18 Form Submissions</span>
                      <span className="text-cyan-400">11 Visited Store</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">Tracking</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-bold text-[10px]">Click-to-WA</span>
                      <span className="font-semibold text-white">Direct WhatsApp Inquiry Ad</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Directs customer directly into ShopGrow AI Unified Inbox.</p>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                      <span>98 Clicks</span>
                      <span className="text-emerald-400 font-medium">24 Conversations</span>
                      <span className="text-teal-400">₹62,000 Attributed Sales</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">Running</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'COMMENTS' && (
        <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Ingested Comments</span>
          <div className="text-2xl font-bold text-white mt-1">{totalComments}</div>
          <span className="text-[10px] text-blue-400 flex items-center mt-1">
            <Share2 className="h-3 w-3 mr-1" />
            FB & IG Inbound Feed
          </span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Hot Intent Leads</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{hotLeadsCount}</div>
          <span className="text-[10px] text-emerald-400 flex items-center mt-1">
            <Zap className="h-3 w-3 mr-1" />
            Price, Visit & Exchange Queries
          </span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Unique Social Customers</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{uniqueUsers}</div>
          <span className="text-[10px] text-slate-400 flex items-center mt-1">
            <User className="h-3 w-3 mr-1" />
            Multi-turn CRM Unified Profiles
          </span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Idempotency Saves</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">{duplicateIgnoredCount}</div>
          <span className="text-[10px] text-purple-400 flex items-center mt-1">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Duplicate Webhook Rejections
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commenter, text, or intent..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterPlatform('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterPlatform === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Platforms
            </button>
            <button
              onClick={() => setFilterPlatform('FACEBOOK')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterPlatform === 'FACEBOOK' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Facebook
            </button>
            <button
              onClick={() => setFilterPlatform('INSTAGRAM')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterPlatform === 'INSTAGRAM' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Instagram
            </button>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="PROCESSED">Processed</option>
            <option value="DUPLICATE_IGNORED">Duplicate Ignored</option>
          </select>
        </div>
      </div>

      {/* Social Comments & Inbound Feed Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Platform & User</th>
                <th className="py-3 px-4">Inbound Comment Content</th>
                <th className="py-3 px-4">AI Intent & Status</th>
                <th className="py-3 px-4">CRM Lead & Consent</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No social leads match your filter. Ingest or simulate a Facebook or Instagram comment above!
                  </td>
                </tr>
              ) : (
                filteredComments.map((comment) => {
                  const isFB = comment.platform === 'FACEBOOK';
                  const isProcessed = comment.processing_status === 'PROCESSED';
                  const matchedLead = leads.find(l => l.id === comment.lead_id);

                  return (
                    <tr key={comment.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <span className={`p-1.5 rounded-lg ${isFB ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
                            {isFB ? (
                              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            ) : (
                              <svg className="h-4 w-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                              </svg>
                            )}
                          </span>
                          <div>
                            <span className="font-bold text-white block">{comment.user_display_name}</span>
                            <span className="font-mono text-slate-500 text-[10px]">{comment.platform_user_id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-200 line-clamp-2">{comment.comment_text}</p>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          Post: {comment.post_id}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {comment.detected_intent || 'GENERAL_QUERY'}
                          </span>
                          <div>
                            {isProcessed ? (
                              <span className="inline-flex items-center text-[10px] font-semibold text-emerald-400">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                PROCESSED
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-semibold text-amber-400">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                DUPLICATE_IGNORED
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {matchedLead ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              HOT LEAD ({matchedLead.status})
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px] block">Customer Profile Linked</span>
                          )}
                          <span className="text-[10px] text-rose-400/80 block flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1" />
                            No WA Opt-in (Safe)
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(comment.timestamp).toLocaleDateString()}{' '}
                        <span className="text-slate-500 text-[10px]">
                          {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <a
                          href="/inbox"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium inline-flex items-center space-x-1 border border-slate-700 transition mr-1.5"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>Inbox</span>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      )}

      {/* Simulator Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Share2 className="h-4 w-4 text-blue-400" />
                <span>Simulate Meta Social Comment Ingestion</span>
              </h2>
              <button
                onClick={() => setShowSimModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimPlatform('FACEBOOK')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      simPlatform === 'FACEBOOK' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Facebook Page Comment
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimPlatform('INSTAGRAM')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      simPlatform === 'INSTAGRAM' ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Instagram Post Comment
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Commenter Full Name</label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Comment ID (Idempotency Key)</label>
                <input
                  type="text"
                  value={simCommentId}
                  onChange={(e) => setSimCommentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Comment Text</label>
                <textarea
                  rows={2}
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Optional Phone (if lead form submitted)</label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono"
                />
              </div>

              {simResult && (
                <div className={`p-3 rounded-xl border ${
                  simResult.duplicateIgnored 
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' 
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                }`}>
                  <div className="font-bold flex items-center space-x-1.5">
                    {simResult.duplicateIgnored ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-amber-400" />
                        <span>DUPLICATE IGNORED (Idempotency Safe)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>COMMENT PROCESSED SUCCESSFULLY</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] mt-1 text-slate-300">
                    Intent: {simResult.result?.intent || 'CLASSIFIED'} | Lead Created: {String(simResult.result?.leadCreated)} | Open Leads: {simResult.openLeadsCount}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSimulate(true)}
                disabled={simLoading}
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 transition text-xs"
                title="Sends the exact same comment ID again to test duplicate protection"
              >
                Send Again (Test Idempotency)
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulate(false)}
                  disabled={simLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition"
                >
                  {simLoading ? 'Ingesting...' : 'Send New Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
