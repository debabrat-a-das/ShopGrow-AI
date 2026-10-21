import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ProductCatalog } from './pages/ProductCatalog';
import { CustomerDatabase } from './pages/CustomerDatabase';
import { OfferManager } from './pages/OfferManager';
import { CampaignStudio } from './pages/CampaignStudio';
import { AIInbox } from './pages/AIInbox';
import { SalesTracking } from './pages/SalesTracking';
import { Analytics } from './pages/Analytics';
import { PublicOptIn } from './pages/PublicOptIn';
import { SuperAdmin } from './pages/SuperAdmin';
import { TestingCenter } from './pages/TestingCenter';
import { Settings } from './pages/Settings';
import { HowItWorks } from './pages/HowItWorks';
import { AuthPages } from './pages/AuthPages';
import { SocialLeads } from './pages/SocialLeads';
import { AutomatedOccasions } from './pages/AutomatedOccasions';

import { CustomerImportModal } from './components/CustomerImportModal';
import { CustomerDetailDrawer } from './components/CustomerDetailDrawer';
import { RecordSaleModal } from './components/RecordSaleModal';
import { NewOfferModal } from './components/NewOfferModal';
import { WhatsAppSimulatorDrawer } from './components/WhatsAppSimulatorDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';

import { api } from './services/api';
import { UserRole, Customer, BusinessType, SubscriptionPlan, OperatingMode, Shop, ShopBranding } from './types';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      if (path.includes('/login') || search.includes('token') || search.includes('invite')) {
        return false;
      }
    }
    return true;
  });
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('SHOP_OWNER');
  const [currentShopId, setCurrentShopId] = useState<string>('shop-saha-electronics-001');
  const [availableShops, setAvailableShops] = useState<Shop[]>([]);
  const [branding, setBranding] = useState<ShopBranding | null>({
    shop_id: 'shop-saha-electronics-001',
    bg_type: 'DEFAULT_WHITE',
    bg_color: '#FFFFFF',
    bg_display: 'cover',
    overlay_type: 'NONE',
    overlay_strength: 30,
    updated_at: new Date().toISOString()
  });
  const [shopInfo, setShopInfo] = useState<{
    name: string;
    city: string;
    business_type: BusinessType;
    plan: SubscriptionPlan;
    operating_mode: OperatingMode;
  }>({
    name: 'Saha Electronics',
    city: 'Kolkata',
    business_type: 'MOBILE_ELECTRONICS',
    plan: 'GROWTH',
    operating_mode: 'SHOP_MANAGED'
  });

  const [hotLeadsCount, setHotLeadsCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false);
  const [isNewOfferOpen, setIsNewOfferOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  
  // Navigation contextual state
  const [preselectedOfferId, setPreselectedOfferId] = useState<string | null>(null);
  const [preselectedProductId, setPreselectedProductId] = useState<string | null>(null);
  const [inboxInitialTab, setInboxInitialTab] = useState<string>('all');
  const [inboxCustomerPhone, setInboxCustomerPhone] = useState<string | undefined>(undefined);
  const [preselectedSaleCustomer, setPreselectedSaleCustomer] = useState<Customer | null>(null);

  // Key to force refresh of child components
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    const handleConnectionChange = (e: any) => {
      if (e.detail && typeof e.detail.connected === 'boolean') {
        setIsOnline(e.detail.connected);
      }
    };
    const handleGlobalError = (event: ErrorEvent) => {
      console.warn('[Global Safe Handler] Captured unhandled window error:', event.error || event.message);
    };
    const handleGlobalRejection = (event: PromiseRejectionEvent) => {
      console.warn('[Global Safe Handler] Captured unhandled promise rejection:', event.reason);
    };

    window.addEventListener('shopgrow-connection-status', handleConnectionChange);
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalRejection);

    return () => {
      window.removeEventListener('shopgrow-connection-status', handleConnectionChange);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalRejection);
    };
  }, []);

  useEffect(() => {
    api.setUserRole(currentRole);
    api.setShopId(currentShopId);
    fetchGlobalCounters();
    
    // Strict tenant isolation: ONLY SUPER_ADMIN queries the global shop list
    if (currentRole === 'SUPER_ADMIN') {
      fetchAvailableShops();
    } else {
      // Non-admins never receive or query other shops
      setAvailableShops([
        {
          id: currentShopId,
          name: shopInfo.name,
          city: shopInfo.city,
          business_type: shopInfo.business_type,
          plan: shopInfo.plan,
          operating_mode: shopInfo.operating_mode,
          created_at: new Date().toISOString()
        } as any
      ]);
    }

    fetchShopBranding(currentShopId);
  }, [currentRole, currentShopId, refreshKey]);

  useEffect(() => {
    const handleBrandingUpdate = (e: any) => {
      if (e.detail) {
        setBranding(e.detail);
      } else {
        fetchShopBranding(currentShopId);
      }
    };
    window.addEventListener('shop-branding-updated', handleBrandingUpdate);
    return () => {
      window.removeEventListener('shop-branding-updated', handleBrandingUpdate);
    };
  }, [currentShopId]);

  const fetchShopBranding = async (shopId: string) => {
    try {
      const res = await api.get(`/settings/branding?shopId=${shopId}`);
      if (res && res.success && res.branding) {
        setBranding(res.branding);
      }
    } catch (err) {
      // Non-blocking fallback
    }
  };

  const fetchAvailableShops = async () => {
    try {
      const res = await api.get('/super-admin/shops');
      if (Array.isArray(res)) {
        setAvailableShops(res);
      }
    } catch (err) {
      // Non-blocking if endpoint fails or permissions restrict
    }
  };

  const fetchGlobalCounters = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setHotLeadsCount(res.kpiCards?.hotLeads || 0);
      if (res.shop) {
        setShopInfo({
          name: res.shop.name,
          city: res.shop.city,
          business_type: res.shop.business_type || 'MOBILE_ELECTRONICS',
          plan: res.shop.plan || 'GROWTH',
          operating_mode: res.shop.operating_mode || 'SHOP_MANAGED'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    api.setUserRole(newRole);
  };

  const handleShopChange = (newShopId: string, customName?: string) => {
    api.setShopId(newShopId);
    setCurrentShopId(newShopId);
    
    // Look up in availableShops if present
    const matched = availableShops.find(s => s.id === newShopId);
    if (matched) {
      setShopInfo({
        name: matched.name,
        city: matched.city || 'Kolkata',
        business_type: matched.business_type || 'MOBILE_ELECTRONICS',
        plan: matched.plan || 'GROWTH',
        operating_mode: matched.operating_mode || 'SHOP_MANAGED'
      });
    } else if (newShopId === 'shop-furniture-002') {
      setShopInfo({
        name: 'Royal Teak & Home Decor',
        city: 'Kolkata',
        business_type: 'FURNITURE',
        plan: 'PRO',
        operating_mode: 'MANAGED_SERVICE'
      });
    } else {
      setShopInfo({
        name: customName || 'Saha Electronics',
        city: 'Kolkata',
        business_type: 'MOBILE_ELECTRONICS',
        plan: 'GROWTH',
        operating_mode: 'SHOP_MANAGED'
      });
    }
    triggerGlobalRefresh();
  };

  const handleNavigate = (tab: string, extra?: any) => {
    if (tab === 'inbox' && extra) {
      if (extra.tab) setInboxInitialTab(extra.tab);
      if (extra.customerPhone) setInboxCustomerPhone(extra.customerPhone);
    }
    if (tab === 'campaigns') {
      if (extra?.offerId) {
        setPreselectedOfferId(extra.offerId);
        setPreselectedProductId(null);
      }
      if (extra?.productId) {
        setPreselectedProductId(extra.productId);
        setPreselectedOfferId(null);
      }
    }
    setCurrentTab(tab);
  };

  const handleLaunchCampaignForOffer = (offerId: string) => {
    setPreselectedOfferId(offerId);
    setPreselectedProductId(null);
    setCurrentTab('campaigns');
  };

  const handleLaunchCampaignForProduct = (productId: string) => {
    setPreselectedProductId(productId);
    setPreselectedOfferId(null);
    setCurrentTab('campaigns');
  };

  const handleRecordSale = (customer?: Customer) => {
    setPreselectedSaleCustomer(customer || null);
    setIsRecordSaleOpen(true);
  };

  const triggerGlobalRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!isAuthenticated) {
    return (
      <AuthPages
        initialMode={typeof window !== 'undefined' && window.location.pathname.includes('/admin') ? 'admin' : 'owner'}
        availableShops={availableShops}
        onOpenHowItWorks={() => {
          setIsAuthenticated(true);
          setCurrentTab('how-it-works');
        }}
        onLoginSuccess={(role, shopId) => {
          setIsAuthenticated(true);
          setCurrentRole(role);
          if (shopId) {
            handleShopChange(shopId);
          }
          if (role === 'SUPER_ADMIN') {
            setCurrentTab('super-admin');
          } else {
            setCurrentTab('dashboard');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        currentShopId={currentShopId}
        onShopChange={handleShopChange}
        availableShops={availableShops}
        currentTab={currentTab}
        onReturnToSuperAdmin={() => setCurrentTab('super-admin')}
        onLogout={() => {
          setIsAuthenticated(false);
          api.setToken('');
        }}
        shopInfo={shopInfo}
      />

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setInboxInitialTab('all');
            setInboxCustomerPhone(undefined);
            setCurrentTab(tab);
          }}
          userRole={currentRole}
          hotLeadsCount={hotLeadsCount}
        />

        {/* Dynamic Content Pane with Tenant-Specific Branding */}
        {(() => {
          const isSuperAdminPortal = currentRole === 'SUPER_ADMIN' && currentTab === 'super-admin';
          const mainStyle: React.CSSProperties = isSuperAdminPortal
            ? { backgroundColor: '#020617' }
            : branding?.bg_type === 'CUSTOM_COLOR'
            ? { backgroundColor: branding.bg_color || '#FFFFFF' }
            : branding?.bg_type === 'CUSTOM_IMAGE' && branding.bg_image_url
            ? {
                backgroundImage: `url(${branding.bg_image_url})`,
                backgroundSize: branding.bg_display === 'cover' ? 'cover' : branding.bg_display === 'contain' ? 'contain' : 'auto',
                backgroundPosition: branding.bg_display === 'top' ? 'top center' : 'center',
                backgroundRepeat: branding.bg_display === 'no-repeat' || branding.bg_display === 'cover' ? 'no-repeat' : 'repeat',
                backgroundAttachment: 'fixed'
              }
            : { backgroundColor: '#FFFFFF' };

          return (
            <main
              style={mainStyle}
              className="flex-1 overflow-y-auto relative transition-colors duration-200"
            >
              {/* Optional Contrast Overlay for Image Backgrounds */}
              {!isSuperAdminPortal && branding?.bg_type === 'CUSTOM_IMAGE' && branding?.overlay_type !== 'NONE' && (
                <div
                  className={`absolute inset-0 pointer-events-none z-0 ${
                    branding.overlay_type === 'DARK' ? 'bg-black' : 'bg-white'
                  }`}
                  style={{ opacity: (branding.overlay_strength || 30) / 100 }}
                />
              )}

              {/* Dynamic Page Views Wrapped in z-10 for Uncompromised Readability */}
                            {!isOnline && (
                <div className="bg-amber-950/90 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between z-30 sticky top-0 backdrop-blur-md shadow-md animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                    <span className="font-medium">Backend server is offline or reconnecting. Displaying cached store data safely.</span>
                  </div>
                  <button
                    onClick={async () => {
                      const ok = await api.pingBackend();
                      if (ok) triggerGlobalRefresh();
                    }}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-semibold border border-amber-500/40 transition active:scale-95"
                  >
                    Retry Connection
                  </button>
                </div>
              )}
              <ErrorBoundary key={`${currentTab}-${refreshKey}`} fallbackTitle={`Temporary issue loading ${currentTab}`} onReset={triggerGlobalRefresh}>
              <div className="relative z-10 min-h-full">
                {currentTab === 'dashboard' && (
                  <Dashboard
                    key={refreshKey}
                    onNavigate={handleNavigate}
                    onOpenSimulator={() => setIsSimulatorOpen(true)}
                    onOpenImport={() => setIsImportOpen(true)}
                    onRecordSale={handleRecordSale}
                    onViewCustomer={(id) => setSelectedCustomerId(id)}
                  />
                )}

          {currentTab === 'products' && (
            <ProductCatalog
              key={refreshKey}
              onLaunchCampaignForProduct={handleLaunchCampaignForProduct}
            />
          )}

          {currentTab === 'customers' && (
            <CustomerDatabase
              key={refreshKey}
              onOpenImport={() => setIsImportOpen(true)}
              onViewCustomer={(id) => setSelectedCustomerId(id)}
              currentShopId={currentShopId}
            />
          )}

          {currentTab === 'offers' && (
            <OfferManager
              key={refreshKey}
              onOpenNewOffer={() => setIsNewOfferOpen(true)}
              onLaunchCampaignForOffer={handleLaunchCampaignForOffer}
            />
          )}

          {currentTab === 'campaigns' && (
            <CampaignStudio
              key={refreshKey}
              preselectedOfferId={preselectedOfferId}
              preselectedProductId={preselectedProductId}
              onCampaignDispatched={triggerGlobalRefresh}
            />
          )}

          {currentTab === 'automated-occasions' && (
            <AutomatedOccasions
              key={refreshKey}
              onNavigate={handleNavigate}
              onRecordSale={handleRecordSale}
              onViewCustomer={(id) => setSelectedCustomerId(id)}
            />
          )}

          {currentTab === 'inbox' && (
            <AIInbox
              key={`${refreshKey}-${inboxInitialTab}-${inboxCustomerPhone || ''}`}
              initialTab={inboxInitialTab}
              initialCustomerPhone={inboxCustomerPhone}
              onRecordSale={handleRecordSale}
              onViewCustomer={(id) => setSelectedCustomerId(id)}
            />
          )}

          {currentTab === 'social-leads' && (
            <SocialLeads key={refreshKey} currentShopId={currentShopId} />
          )}

          {currentTab === 'sales' && (
            <SalesTracking
              key={refreshKey}
              onOpenRecordSale={() => handleRecordSale()}
            />
          )}

          {currentTab === 'analytics' && (
            <Analytics key={refreshKey} />
          )}

          {currentTab === 'optin' && (
            <PublicOptIn key={refreshKey} />
          )}

          {currentTab === 'super-admin' && (
            <SuperAdmin 
              key={refreshKey}
              onSwitchToShopWorkspace={(shopId, shopName) => {
                handleShopChange(shopId, shopName);
                setCurrentTab('dashboard');
              }}
            />
          )}

          {currentTab === 'testing-center' && (
            <TestingCenter
              key={refreshKey}
              currentShopId={currentShopId}
              onSwitchShop={(id) => handleShopChange(id)}
              onNavigateToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'settings' && (
            <Settings key={refreshKey} />
          )}

              {currentTab === 'how-it-works' && (
                <HowItWorks
                  key={refreshKey}
                  onNavigateToTab={handleNavigate}
                  onLaunchDemoScenario={(scenario) => {
                    if (scenario === 'A') {
                      handleNavigate('campaigns', { productId: 'prod-saha-001' });
                    } else {
                      handleNavigate('testing-center');
                    }
                  }}
                />
              )}
              </div>
              </ErrorBoundary>
            </main>
          );
        })()}
      </div>

      {/* Global Modals and Drawers */}
      <CustomerImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={triggerGlobalRefresh}
      />

      <CustomerDetailDrawer
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        onCustomerUpdated={triggerGlobalRefresh}
      />

      <RecordSaleModal
        isOpen={isRecordSaleOpen}
        onClose={() => {
          setIsRecordSaleOpen(false);
          setPreselectedSaleCustomer(null);
        }}
        onSaleRecorded={triggerGlobalRefresh}
        preselectedCustomer={preselectedSaleCustomer}
      />

      <NewOfferModal
        isOpen={isNewOfferOpen}
        onClose={() => setIsNewOfferOpen(false)}
        onOfferCreated={triggerGlobalRefresh}
      />

      <WhatsAppSimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onRefreshData={triggerGlobalRefresh}
      />
    </div>
  );
}

export default App;
