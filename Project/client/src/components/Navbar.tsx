import React from 'react';
import { 
  Sparkles, Store, Shield, Radio, PlayCircle, ArrowLeft, 
  ExternalLink, ShieldAlert, LogOut, Menu, X 
} from 'lucide-react';
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
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
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
  },
  isMobileMenuOpen = false,
  onToggleMobileMenu
}) => {
  // Only SUPER_ADMIN is permitted to access the global shop list
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const isManagingShopAsAdmin = isSuperAdmin && currentTab !== 'super-admin' && currentTab !== 'testing-center';

  return (
    <div className="sticky top-0 z-30 flex flex-col w-full">
      {/* Super Admin Workspace Emulation Banner */}
      {isManagingShopAsAdmin && (
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 border-b border-purple-500/30 px-3 sm:px-6 py-2 sm:py-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-purple-200 gap-2">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-4 w-4 text-purple-400 shrink-0 animate-pulse" />
            <span className="leading-tight">
              <strong>Super Admin Mode:</strong> Operating inside <strong>{shopInfo?.name}</strong> ({shopInfo?.business_type?.replace('_', ' ')}).
            </span>
          </div>

          <button
            onClick={onReturnToSuperAdmin}
            className="w-full sm:w-auto justify-center bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] px-3 py-1 rounded-lg flex items-center space-x-1.5 shadow-md shadow-purple-600/20 transition shrink-0 active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Super Admin</span>
          </button>
        </div>
      )}

      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between w-full">
        {/* Brand & Mobile Menu Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          {/* Mobile Menu Hamburger Button */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-emerald-400" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}

          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent truncate">
                SHOPGROW <span className="text-emerald-400">AI</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                {isSuperAdmin ? 'Platform Admin' : 'Retail Cloud'}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden xl:block truncate">
              Turn your existing customer database into repeat sales.
            </p>
          </div>
        </div>

        {/* Center Tenant Switcher & Provider Status (Tablet & Desktop) */}
        <div className="hidden md:flex items-center space-x-2 lg:space-x-3 shrink-0">
          {/* Shop Identity: Super Admin gets global dropdown switcher; Owners & Staff see STATIC NON-CLICKABLE identity */}
          {isSuperAdmin ? (
            <div className="relative group">
              <div className="flex items-center space-x-2 bg-purple-950/40 hover:bg-purple-950/60 border border-purple-500/40 rounded-xl px-2.5 lg:px-3 py-1.5 text-xs text-purple-200 cursor-pointer shadow-sm transition">
                <Store className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider hidden lg:inline">Tenant:</span>
                <select
                  value={currentShopId}
                  onChange={(e) => onShopChange(e.target.value)}
                  className="bg-transparent text-white font-bold cursor-pointer focus:outline-none pr-1 max-w-[140px] lg:max-w-[200px] truncate"
                >
                  {availableShops.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white font-sans">
                      {s.name} ({s.business_type ? s.business_type.replace('_', ' ') : 'Store'})
                    </option>
                  ))}
                </select>
                <span className="text-purple-400/50">|</span>
                <span className="text-purple-300 font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                  {shopInfo?.plan || 'GROWTH'}
                </span>
              </div>
            </div>
          ) : (
            /* NON-CLICKABLE STATIC SHOP IDENTITY - NEVER REVEALS OTHER SHOPS */
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 lg:px-3 py-1.5 text-xs text-slate-200 shadow-sm select-none">
              <Store className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold text-white tracking-wide max-w-[120px] lg:max-w-[220px] truncate">
                {shopInfo?.name}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                {shopInfo?.plan || 'GROWTH'}
              </span>
              <span className="text-slate-400 text-[10px] hidden lg:inline">
                {shopInfo?.operating_mode === 'MANAGED_SERVICE' ? 'Agency' : 'Shop'}
              </span>
            </div>
          )}

          {/* Integration Status Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-emerald-950/50 border border-emerald-600/30 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Radio className="h-3.5 w-3.5 text-emerald-400" />
            <span>Meta Sandbox API</span>
          </div>
        </div>

        {/* Right Controls: Simulator Trigger + Authenticated User Badge */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
          {/* Simulator Trigger Button */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center space-x-1.5 sm:space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs px-2.5 sm:px-3.5 py-2 rounded-lg shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-95 border border-emerald-400/30"
            title="Open interactive multi-channel simulator drawer"
            aria-label="Open simulator"
          >
            <PlayCircle className="h-4 w-4 animate-spin text-emerald-200 shrink-0" style={{ animationDuration: '8s' }} />
            <span className="hidden sm:inline">Multi-Channel Simulator</span>
            <span className="sm:hidden text-[11px] font-semibold">Simulator</span>
          </button>

          {/* Authenticated User Role Badge (Non-tamperable) */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 sm:px-2.5 py-1.5 text-xs">
            <Shield className={`h-3.5 w-3.5 shrink-0 ${isSuperAdmin ? 'text-purple-400' : 'text-emerald-400'}`} />
            <span className="text-slate-200 font-semibold text-[11px] sm:text-xs">
              {currentRole === 'SUPER_ADMIN' && <><span className="hidden sm:inline">Super </span>Admin</>}
              {currentRole === 'SHOP_OWNER' && 'Owner'}
              {currentRole === 'MANAGER' && 'Manager'}
              {currentRole === 'STAFF' && 'Staff'}
            </span>
          </div>

          {/* Logout Action */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-rose-500/20 active:scale-95"
              title="Sign Out of Shop Workspace"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>
    </div>
  );
};
