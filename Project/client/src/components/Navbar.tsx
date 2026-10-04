import React from 'react';
import { Sparkles, Store, Shield, Radio, PlayCircle, ArrowLeft, ExternalLink, ShieldAlert, LogOut } from 'lucide-react';
import { UserRole, BusinessType, SubscriptionPlan, OperatingMode } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenSimulator: () => void;
  currentShopId: string;
  onShopChange: (shopId: string) => void;
  availableShops?: Array<{ id: string; name: string; business_type?: string; plan?: string }>;
  currentTab?: string;
  onReturnToSuperAdmin?: () => void;
  onLogout?: () => void;
  shopInfo?: {
    name: string;
    city: string;
    business_type: BusinessType;
    plan: SubscriptionPlan;
    operating_mode: OperatingMode;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  onOpenSimulator,
  currentShopId,
  onShopChange,
  availableShops = [],
  currentTab = 'dashboard',
  onReturnToSuperAdmin,
  onLogout,
  shopInfo = {
    name: 'Saha Electronics',
    city: 'Kolkata',
    business_type: 'MOBILE_ELECTRONICS',
    plan: 'GROWTH',
    operating_mode: 'SHOP_MANAGED'
  }
}) => {
  // Only SUPER_ADMIN is permitted to access the global shop list
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const isManagingShopAsAdmin = isSuperAdmin && currentTab !== 'super-admin' && currentTab !== 'testing-center';

  return (
    <div className="sticky top-0 z-30 flex flex-col">
      {/* Super Admin Workspace Emulation Banner */}
      {isManagingShopAsAdmin && (
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 border-b border-purple-500/30 px-6 py-1.5 flex items-center justify-between text-xs text-purple-200">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-4 w-4 text-purple-400 animate-pulse" />
            <span>
              <strong>Super Admin Mode:</strong> You are currently operating inside <strong>{shopInfo?.name}</strong> workspace ({shopInfo?.business_type?.replace('_', ' ')}).
            </span>
          </div>

          <button
            onClick={onReturnToSuperAdmin}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] px-3 py-1 rounded-lg flex items-center space-x-1.5 shadow-md shadow-purple-600/20 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Super Admin Portal</span>
          </button>
        </div>
      )}

      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between">
        {/* Brand & Tagline */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SHOPGROW <span className="text-emerald-400">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {isSuperAdmin ? 'Platform Admin' : 'Retail Cloud'}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Turn your existing customer database into repeat sales.
            </p>
          </div>
        </div>

        {/* Center Tenant Switcher & Provider Status */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Shop Identity: Super Admin gets global dropdown switcher; Owners & Staff see STATIC NON-CLICKABLE identity */}
          {isSuperAdmin ? (
            <div className="relative group">
              <div className="flex items-center space-x-2 bg-purple-950/40 hover:bg-purple-950/60 border border-purple-500/40 rounded-xl px-3 py-1.5 text-xs text-purple-200 cursor-pointer shadow-sm transition">
                <Store className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Tenant:</span>
                <select
                  value={currentShopId}
                  onChange={(e) => onShopChange(e.target.value)}
                  className="bg-transparent text-white font-bold cursor-pointer focus:outline-none pr-1 max-w-[200px] truncate"
                >
                  {availableShops.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white font-sans">
                      {s.name} ({s.business_type ? s.business_type.replace('_', ' ') : 'Store'})
                    </option>
                  ))}
                </select>
                <span className="text-purple-400/50">|</span>
                <span className="text-purple-300 font-bold text-[10px] uppercase px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/30">
                  {shopInfo?.plan || 'GROWTH'}
                </span>
              </div>
            </div>
          ) : (
            /* NON-CLICKABLE STATIC SHOP IDENTITY - NEVER REVEALS OTHER SHOPS */
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 shadow-sm select-none">
              <Store className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-bold text-white tracking-wide max-w-[220px] truncate">
                {shopInfo?.name}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 font-bold text-[10px] uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                {shopInfo?.plan || 'GROWTH'}
              </span>
              <span className="text-slate-400 text-[10px]">
                {shopInfo?.operating_mode === 'MANAGED_SERVICE' ? 'Agency Mode' : 'Shop Mode'}
              </span>
            </div>
          )}

          {/* Integration Status Badge */}
          <div className="flex items-center space-x-1.5 bg-emerald-950/50 border border-emerald-600/30 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Radio className="h-3.5 w-3.5 text-emerald-400" />
            <span>Meta Sandbox API</span>
          </div>
        </div>

        {/* Right Controls: Simulator Trigger + Authenticated User Badge */}
        <div className="flex items-center space-x-3">
          {/* Simulator Trigger Button (only visible in dev/QA or Super Admin) */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-95 border border-emerald-400/30"
            title="Open interactive multi-channel simulator drawer"
          >
            <PlayCircle className="h-4 w-4 animate-spin text-emerald-200" style={{ animationDuration: '8s' }} />
            <span>Multi-Channel Simulator</span>
          </button>

          {/* Authenticated User Role Badge (Non-tamperable) */}
          <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Shield className={`h-3.5 w-3.5 ${isSuperAdmin ? 'text-purple-400' : 'text-emerald-400'}`} />
            <span className="text-slate-200 font-semibold">
              {currentRole === 'SUPER_ADMIN' && 'Super Admin'}
              {currentRole === 'SHOP_OWNER' && 'Shop Owner'}
              {currentRole === 'MANAGER' && 'Manager'}
              {currentRole === 'STAFF' && 'Staff'}
            </span>
          </div>

          {/* Logout Action */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-rose-500/20"
              title="Sign Out of Shop Workspace"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>
    </div>
  );
};
