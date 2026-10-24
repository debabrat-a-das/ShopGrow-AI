import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, Store, Plus, Activity, CheckCircle2, XCircle, 
  Radio, IndianRupee, Layers, FileText, ArrowUpRight, RefreshCw,
  ExternalLink, UserCheck, Smartphone, Armchair, Sparkles,
  FlaskConical, Trash2, Gift, UserPlus, ShieldCheck, UserX, Users, Lock, AlertTriangle, X
} from 'lucide-react';
import { api } from '../services/api';
import { BusinessType, SubscriptionPlan, OperatingMode, SuperAdminRecord, SuperAdminStatus } from '../types';

interface SuperAdminProps {
  onSwitchToShopWorkspace?: (shopId: string, shopName: string) => void;
}

export const SuperAdmin: React.FC<SuperAdminProps> = ({
  onSwitchToShopWorkspace
}) => {
  const [data, setData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'admin-access' | 'audit-logs'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdShopModalData, setCreatedShopModalData] = useState<any | null>(null);

  // Super Admin Governance State
  const [superAdmins, setSuperAdmins] = useState<SuperAdminRecord[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [confirmAdminGrant, setConfirmAdminGrant] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(null);

  // New Shop Form
  const [newShopName, setNewShopName] = useState('');
  const [newShopSlug, setNewShopSlug] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('+919830099999');
  const [newShopCity, setNewShopCity] = useState('Howrah');
  const [newBusinessType, setNewBusinessType] = useState<BusinessType>('MOBILE_ELECTRONICS');
  const [newPlan, setNewPlan] = useState<SubscriptionPlan>('GROWTH');
  const [newOperatingMode, setNewOperatingMode] = useState<OperatingMode>('SHOP_MANAGED');

  useEffect(() => {
    fetchSuperAdminData();
    fetchSuperAdmins();
  }, []);

  const fetchSuperAdminData = async () => {
    setLoading(true);
    try {
      const [overviewRes, logsRes] = await Promise.all([
        api.get('/super-admin/overview'),
        api.get('/super-admin/audit-logs').catch(() => [])
      ]);
      setData(overviewRes);
      setAuditLogs(logsRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuperAdmins = async () => {
    setAdminsLoading(true);
    try {
      const res = await api.get('/super-admin/admins');
      if (res && res.success) {
        setSuperAdmins(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch super admins:', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminActionError(null);
    setAdminActionSuccess(null);

    if (!confirmAdminGrant) {
      setAdminActionError('You must confirm authorization before granting Super Admin access.');
      return;
    }

    try {
      const res = await api.post('/super-admin/admins', {
        email: newAdminEmail.trim(),
        full_name: newAdminName.trim(),
        confirmation: true
      });
      if (res && res.success) {
        setAdminActionSuccess(`Super Admin access granted to ${newAdminEmail}.`);
        setNewAdminEmail('');
        setNewAdminName('');
        setConfirmAdminGrant(false);
        setShowAddAdminModal(false);
        fetchSuperAdmins();
        fetchSuperAdminData();
      } else {
        setAdminActionError(res?.error || 'Failed to grant admin access.');
      }
    } catch (err: any) {
      setAdminActionError(err.message || 'Failed to grant admin access.');
    }
  };

  const handleUpdateAdminStatus = async (adminId: string, status: SuperAdminStatus, email: string) => {
    const actionVerb = status === 'REVOKED' ? 'permanently revoke' : status === 'SUSPENDED' ? 'suspend' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionVerb} Super Admin access for ${email}?`)) {
      return;
    }

    try {
      const res = await api.patch(`/super-admin/admins/${adminId}/status`, { status });
      if (res && res.success) {
        fetchSuperAdmins();
        fetchSuperAdminData();
      } else {
        alert(res?.error || 'Failed to update admin status.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleToggleShop = async (shopId: string) => {
    try {
      await api.patch(`/super-admin/shops/${shopId}/toggle`);
      fetchSuperAdminData();
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const handleDeleteShop = async (shopId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove test shop "${name}"?`)) return;
    try {
      await api.delete(`/super-admin/shops/${shopId}`);
      fetchSuperAdminData();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/super-admin/shops', {
        name: newShopName,
        slug: newShopSlug,
        phone: newShopPhone,
        city: newShopCity,
        business_type: newBusinessType,
        plan: newPlan,
        operating_mode: newOperatingMode
      });
      setCreatedShopModalData(res);
      setNewShopName('');
      setNewShopSlug('');
      fetchSuperAdminData();
    } catch (err: any) {
      alert('Failed to create shop: ' + err.message);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Loading Super Admin platform overview...
      </div>
    );
  }

  const m = data.metrics;

  const getBusinessIcon = (bt: string) => {
    if (bt === 'FURNITURE') return <Armchair className="h-3.5 w-3.5 text-amber-400" />;
    return <Smartphone className="h-3.5 w-3.5 text-blue-400" />;
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'MANAGED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'PRO':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'GROWTH':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-purple-400" />
            <span>SaaS Super Admin Master Portal</span>
            <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-mono">
              Multi-Industry Multi-Tenant
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-tenant overview, subscription plan management, business type breakdown, and tenant workspace switcher.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg shadow-purple-600/25 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Provision New Shop Tenant</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Store className="h-3.5 w-3.5" />
          <span>Registered Shops & Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('admin-access')}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition ${
            activeTab === 'admin-access'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Admin Access (Super Admins)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30">
            {superAdmins.filter(s => s.status === 'ACTIVE').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit-logs')}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition ${
            activeTab === 'audit-logs'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Platform Audit Logs</span>
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Platform KPI Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Shops Enrolled</span>
          <span className="text-2xl font-bold text-white font-mono">{m.totalShops}</span>
          <span className="text-[11px] text-emerald-400 block mt-1">
            {m.activeShops} active ({m.managedModeShops} managed service)
          </span>
        </div>
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Customers Across Platform</span>
          <span className="text-2xl font-bold text-slate-200 font-mono">{m.totalCustomers}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Tenant isolated database</span>
        </div>
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total WhatsApp & Social Leads</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono">
            {(m.totalMessages || 0) + (m.totalSocialLeads || 0)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            {m.totalMessages} WA msgs • {m.totalSocialLeads} social leads
          </span>
        </div>
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Platform Attributed Sales</span>
          <span className="text-2xl font-bold text-purple-400 font-mono">
            ₹{Number(m.totalPlatformRevenue || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">{m.totalSales} verified transactions</span>
        </div>
      </div>

      {/* Platform Occasion Automation KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-pink-500/20">
          <span className="text-xs text-pink-400 block mb-1">🎂 Birthday Greetings Sent</span>
          <span className="text-2xl font-bold text-white font-mono">{m.totalBirthdayMessages || 0}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Zero AI coupon hallucination</span>
        </div>
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-purple-500/20">
          <span className="text-xs text-purple-400 block mb-1">💍 Anniversary Greetings Sent</span>
          <span className="text-2xl font-bold text-white font-mono">{m.totalAnniversaryMessages || 0}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Wedding & Purchase anniversaries</span>
        </div>
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/20">
          <span className="text-xs text-emerald-400 block mb-1">🎟️ Occasion Offers Redeemed</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono">{m.totalOccasionRedemptions || 0}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Shopkeeper coupon conversions</span>
        </div>
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-amber-500/20">
          <span className="text-xs text-amber-400 block mb-1">💰 Occasion Attributed Revenue</span>
          <span className="text-2xl font-bold text-amber-400 font-mono">
            ₹{Number(m.totalOccasionAttributedRevenue || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Lifetime customer value lift</span>
        </div>
      </div>

      {/* Plan Distribution & Business Types Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subscription Plan Distribution */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <span>Subscription Tier Distribution</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            {Object.entries(data.subscriptionPlans || {}).map(([plan, count]) => (
              <div key={plan} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">{plan}</span>
                <span className="text-lg font-bold font-mono text-white block mt-1">{String(count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Business Industry Breakdown */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Store className="h-4 w-4 text-purple-400" />
            <span>Supported Industry Verticals</span>
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(data.businessTypes || {}).map(([type, count]) => (
              <div key={type} className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2">
                {getBusinessIcon(type)}
                <span className="text-slate-300 font-medium">{type.replace('_', ' ')}:</span>
                <span className="font-bold text-white font-mono">{String(count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Registered Shops Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-3">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Registered Multi-Industry Retail Shops</h2>
            <p className="text-xs text-slate-400">
              Tenant isolation policy: Customer conversations and phone numbers are strictly segregated per shop tenant.
            </p>
          </div>
          <button onClick={fetchSuperAdminData} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Shop Name & City</th>
                <th className="p-3.5">Industry Vertical</th>
                <th className="p-3.5">Plan & Mode</th>
                <th className="p-3.5">Customers</th>
                <th className="p-3.5">Campaigns</th>
                <th className="p-3.5">Revenue</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Switch Tenant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {data.shopsSummary?.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-white">{s.name}</div>
                    <div className="text-[11px] text-slate-400">{s.city} • slug: {s.slug}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
                      {getBusinessIcon(s.business_type)}
                      <span>{s.business_type.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPlanBadge(s.plan)}`}>
                        {s.plan}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {s.operating_mode === 'MANAGED_SERVICE' ? 'Managed' : 'Self'}
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-white">{s.customerCount}</td>
                  <td className="p-3.5 font-mono text-slate-300">{s.campaignCount}</td>
                  <td className="p-3.5 font-mono text-emerald-400 font-semibold">
                    ₹{Number(s.revenue).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => handleToggleShop(s.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                        s.active_status
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                      }`}
                    >
                      {s.active_status ? 'Active' : 'Suspended'}
                    </button>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          api.setShopId(s.id);
                          if (onSwitchToShopWorkspace) {
                            onSwitchToShopWorkspace(s.id, s.name);
                          }
                        }}
                        className="bg-purple-600/80 hover:bg-purple-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-sm transition"
                        title="Open shop in Testing Center"
                      >
                        <FlaskConical className="h-3 w-3" />
                        <span>Test Shop</span>
                      </button>

                      <button
                        onClick={() => {
                          api.setShopId(s.id);
                          if (onSwitchToShopWorkspace) {
                            onSwitchToShopWorkspace(s.id, s.name);
                          }
                        }}
                        className="bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-md shadow-emerald-600/20 transition"
                        title="Open shop workspace with active tenant context"
                      >
                        <span>Open Workspace</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </button>

                      {s.id !== 'shop-saha-electronics-001' && s.id !== 'shop-furniture-002' && (
                        <button
                          onClick={() => handleDeleteShop(s.id, s.name)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                          title="Delete test shop"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {/* Super Admin Access & Allowlist Governance View */}
  {activeTab === 'admin-access' && (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Notifications */}
      {adminActionSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{adminActionSuccess}</span>
        </div>
      )}
      {adminActionError && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <span>{adminActionError}</span>
        </div>
      )}

      {/* Admin Management Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <span>SUPER ADMINS (Server-Side Allowlist)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Only verified active Super Administrators listed below can authenticate through the private portal (/admin/login) and manage tenant workspaces.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchSuperAdmins}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Allowlist"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${adminsLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                setAdminActionError(null);
                setAdminActionSuccess(null);
                setShowAddAdminModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center space-x-1.5 transition text-xs shadow-lg shadow-purple-600/25"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Super Admin</span>
            </button>
          </div>
        </div>

        {/* Super Admins Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Administrator Name</th>
                <th className="p-3">Verified Email</th>
                <th className="p-3">Authorization Status</th>
                <th className="p-3">Granted By</th>
                <th className="p-3">Granted At</th>
                <th className="p-3">Last Login</th>
                <th className="p-3 text-right">Access Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {superAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-medium text-white">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">
                        {admin.full_name?.charAt(0) || 'A'}
                      </div>
                      <span>{admin.full_name || 'Admin'}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-purple-300">{admin.email}</td>
                  <td className="p-3">
                    {admin.status === 'ACTIVE' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                        ACTIVE
                      </span>
                    )}
                    {admin.status === 'SUSPENDED' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
                        SUSPENDED
                      </span>
                    )}
                    {admin.status === 'REVOKED' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5" />
                        REVOKED
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-[11px]">{admin.granted_by}</td>
                  <td className="p-3 text-slate-400 text-[11px]">
                    {new Date(admin.granted_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">
                    {admin.last_login_at ? new Date(admin.last_login_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {admin.status === 'ACTIVE' ? (
                        <>
                          <button
                            onClick={() => handleUpdateAdminStatus(admin.id, 'SUSPENDED', admin.email)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-[11px] border border-amber-500/20 transition"
                            title="Temporarily freeze access"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => handleUpdateAdminStatus(admin.id, 'REVOKED', admin.email)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-[11px] border border-rose-500/20 transition"
                            title="Permanently revoke platform admin permissions"
                          >
                            Revoke
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUpdateAdminStatus(admin.id, 'ACTIVE', admin.email)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-[11px] border border-emerald-500/20 transition"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {/* Central Security & Action Audit Logs */}
  {activeTab === 'audit-logs' && (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-3 animate-in fade-in duration-150">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <FileText className="h-4 w-4 text-amber-400" />
            <span>Platform Audit & Security Log Trail</span>
          </h2>
          <p className="text-xs text-slate-400">
            Immutable log of shop provisioning, Super Admin grants, catalog updates, human approvals, and customer consent events.
          </p>
        </div>
        <span className="text-xs text-slate-500 font-mono">{auditLogs.length} events</span>
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Actor & Role</th>
              <th className="p-3">Action Event</th>
              <th className="p-3">Event Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 font-mono text-[11px]">
            {auditLogs.map((log: any) => (
              <tr key={log.id} className="hover:bg-slate-800/30">
                <td className="p-3 text-slate-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="p-3 text-white">
                  <span className="text-slate-300 font-sans font-medium">{log.actor_name}</span>{' '}
                  <span className="text-[10px] text-purple-400 font-bold px-1.5 py-0.2 rounded bg-purple-500/10 border border-purple-500/20">
                    {log.actor_role}
                  </span>
                </td>
                <td className="p-3 text-emerald-400 font-bold">
                  {log.action}
                </td>
                <td className="p-3 text-slate-400 truncate max-w-xs font-sans text-xs">
                  {JSON.stringify(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )}

  {/* Modal: Add Super Admin */}
  {showAddAdminModal && (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <UserPlus className="h-4 w-4 text-purple-400" />
            <span>Grant Super Administrator Access</span>
          </h2>
          <button
            onClick={() => setShowAddAdminModal(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleAddAdmin} className="space-y-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300 text-[11px]">
            <strong>Security Notice:</strong> A Super Administrator has complete platform authority, including switching into any shop workspace, viewing all data, and provisioning/deleting tenants.
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Administrator Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Suman Sen"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Authorised Email Address</label>
            <input
              type="email"
              required
              placeholder="admin@example.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <label className="flex items-start space-x-2 text-[11px] text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              required
              checked={confirmAdminGrant}
              onChange={(e) => setConfirmAdminGrant(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-purple-600 mt-0.5"
            />
            <span>I explicitly confirm granting unrestricted platform Super Administrator privileges to this email address.</span>
          </label>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddAdminModal(false)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/20"
            >
              Send Invite / Grant Access
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

      {/* Provision Shop Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Store className="h-4 w-4 text-purple-400" />
                <span>{createdShopModalData ? 'Shop Provisioned' : 'Provision New Shop Tenant'}</span>
              </h2>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setCreatedShopModalData(null);
                }} 
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {createdShopModalData ? (
              <div className="space-y-4 py-2 text-center animate-in fade-in duration-200">
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Shop Created Successfully!</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Store and owner profile are active and isolated in the database.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shop Name:</span>
                    <span className="font-bold text-white">{createdShopModalData.shop.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Industry:</span>
                    <span className="text-emerald-400">{createdShopModalData.shop.business_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tenant Slug:</span>
                    <span className="text-purple-400">{createdShopModalData.shop.slug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Owner Assigned:</span>
                    <span className="text-slate-200">{createdShopModalData.owner.full_name}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-3 pt-2">
                  <button
                    onClick={() => {
                      const s = createdShopModalData.shop;
                      setCreatedShopModalData(null);
                      setShowCreateModal(false);
                      if (onSwitchToShopWorkspace) {
                        onSwitchToShopWorkspace(s.id, s.name);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center space-x-1.5 transition"
                  >
                    <span>Open Shop Workspace</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      setCreatedShopModalData(null);
                      setShowCreateModal(false);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2.5 rounded-xl transition"
                  >
                    Stay in Super Admin
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateShop} className="space-y-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Shop Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Teak & Home Decor"
                    value={newShopName}
                    onChange={(e) => {
                      setNewShopName(e.target.value);
                      if (!newShopSlug) {
                        setNewShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Subdomain Slug</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. royal-teak"
                      value={newShopSlug}
                      onChange={(e) => setNewShopSlug(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">City</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kolkata"
                      value={newShopCity}
                      onChange={(e) => setNewShopCity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Industry Vertical</label>
                    <select
                      value={newBusinessType}
                      onChange={(e) => setNewBusinessType(e.target.value as BusinessType)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="MOBILE_ELECTRONICS">Mobile & Electronics</option>
                      <option value="FURNITURE">Furniture & Home Decor</option>
                      <option value="HOME_APPLIANCES">Home Appliances</option>
                      <option value="FASHION_CLOTHING">Fashion & Clothing</option>
                      <option value="JEWELLERY">Jewellery</option>
                      <option value="OPTICAL">Optical & Eyewear</option>
                      <option value="GENERAL_RETAIL">General Retail</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Subscription Plan</label>
                    <select
                      value={newPlan}
                      onChange={(e) => setNewPlan(e.target.value as SubscriptionPlan)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="STARTER">Starter</option>
                      <option value="GROWTH">Growth</option>
                      <option value="PRO">Pro</option>
                      <option value="MANAGED">Managed Plan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Operating Mode</label>
                  <select
                    value={newOperatingMode}
                    onChange={(e) => setNewOperatingMode(e.target.value as OperatingMode)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="SHOP_MANAGED">Shop Managed (Self-service by store team)</option>
                    <option value="MANAGED_SERVICE">Managed Service (ShopGrow Agency Team)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/20"
                  >
                    Provision Tenant
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
