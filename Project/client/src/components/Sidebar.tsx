import React from 'react';
import { 
  LayoutDashboard, Users, Tag, Send, MessageSquare, 
  IndianRupee, BarChart3, QrCode, ShieldAlert, Settings, Sparkles,
  Package, FlaskConical, HelpCircle, Share2, Gift
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole: UserRole;
  hotLeadsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  hotLeadsCount
}) => {
  // Base Operational Modules
  let navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products & Catalog', icon: Package, highlight: false },
    { id: 'customers', label: 'Customers & CRM', icon: Users },
    { id: 'offers', label: 'Offer Manager', icon: Tag },
    { id: 'campaigns', label: 'AI Campaign Studio', icon: Sparkles, highlight: false },
    { id: 'automated-occasions', label: 'Automated Occasions', icon: Gift, highlight: true },
    { 
      id: 'inbox', 
      label: 'Unified Inbox', 
      icon: MessageSquare, 
      badge: hotLeadsCount > 0 ? `${hotLeadsCount} Hot` : undefined 
    },
    { id: 'social-leads', label: 'Social Leads (Meta)', icon: Share2, highlight: false },
    { id: 'sales', label: 'Sales & Attribution', icon: IndianRupee },
    { id: 'analytics', label: 'Campaign Analytics', icon: BarChart3 },
    { id: 'optin', label: 'In-Store Opt-in & QR', icon: QrCode },
  ];

  // If STAFF: Show ONLY permitted operational modules (Dashboard, Products, Customers, Inbox, Sales, QR Opt-in)
  if (userRole === 'STAFF') {
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'products', label: 'Products & Catalog', icon: Package },
      { id: 'customers', label: 'Customers & CRM', icon: Users },
      { 
        id: 'inbox', 
        label: 'Unified Inbox', 
        icon: MessageSquare, 
        badge: hotLeadsCount > 0 ? `${hotLeadsCount} Hot` : undefined 
      },
      { id: 'sales', label: 'Sales Walk-in', icon: IndianRupee },
      { id: 'optin', label: 'In-Store QR Opt-in', icon: QrCode },
    ];
  }

  // Super Admin view (Strict isolation: only visible to SUPER_ADMIN)
  if (userRole === 'SUPER_ADMIN') {
    navItems.push({ id: 'super-admin', label: 'Super Admin Portal', icon: ShieldAlert, highlight: false });
    navItems.push({ id: 'testing-center', label: 'QA Testing Center', icon: FlaskConical, highlight: true });
  }

  // How ShopGrow Works
  navItems.push({ id: 'how-it-works', label: 'How ShopGrow Works', icon: HelpCircle, highlight: false });

  // Settings: Only for SHOP_OWNER, MANAGER, and SUPER_ADMIN (STAFF must NOT see Settings)
  if (userRole !== 'STAFF') {
    navItems.push({ id: 'settings', label: 'Settings & Branding', icon: Settings, highlight: false });
  }

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 flex flex-col justify-between py-4 px-3 select-none">
      <div className="space-y-1">
        <div className="px-3 pb-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          {userRole === 'SUPER_ADMIN' ? 'Platform Governance' : 'Store Operations'}
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white text-emerald-700' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-3 pt-4 border-t border-slate-800/80 text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span>ShopGrow Engine</span>
          <span className="text-emerald-400 font-mono">v2.2 Retail</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Official Meta Cloud API • Strict Consent Isolation
        </p>
      </div>
    </aside>
  );
};
