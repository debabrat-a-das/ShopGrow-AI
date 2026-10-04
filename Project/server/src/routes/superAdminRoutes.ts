import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { Shop, BusinessType, SubscriptionPlan, OperatingMode } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Super Admin platform overview
router.get('/overview', (_req: Request, res: Response) => {
  const totalShops = store.shops.length;
  const activeShops = store.shops.filter(s => s.active_status).length;
  const suspendedShops = store.shops.filter(s => !s.active_status).length;
  const managedModeShops = store.shops.filter(s => s.operating_mode === 'MANAGED_SERVICE').length;
  
  const totalCustomers = store.customers.length;
  const totalCampaigns = store.campaigns.length;
  const totalMessages = store.messages.length;
  const totalLeads = store.leads.length;
  const totalSocialLeads = store.socialLeads.length;
  const totalSales = store.sales.length;
  const totalPlatformRevenue = store.sales.reduce((acc, s) => acc + Number(s.sale_amount || 0), 0);

  // Business Type breakdown
  const businessTypes: Record<string, number> = {};
  store.shops.forEach(s => {
    const bt = s.business_type || 'MOBILE_ELECTRONICS';
    businessTypes[bt] = (businessTypes[bt] || 0) + 1;
  });

  // Subscription Plan breakdown
  const subscriptionPlans: Record<string, number> = {
    STARTER: 0,
    GROWTH: 0,
    PRO: 0,
    MANAGED: 0
  };
  store.shops.forEach(s => {
    const plan = s.plan || 'GROWTH';
    subscriptionPlans[plan] = (subscriptionPlans[plan] || 0) + 1;
  });

  const totalBirthdayMessages = store.occasionLogs.filter(l => l.occasion_type === 'BIRTHDAY' && l.status === 'SENT').length;
  const totalAnniversaryMessages = store.occasionLogs.filter(l => (l.occasion_type === 'WEDDING_ANNIVERSARY' || l.occasion_type === 'PURCHASE_ANNIVERSARY') && l.status === 'SENT').length;
  const totalOccasionRedemptions = store.occasionLogs.filter(l => l.status === 'REDEEMED').length;
  const totalOccasionAttributedRevenue = store.occasionLogs.reduce((acc, l) => acc + (l.attributed_revenue || 0), 0);

  res.json({
    metrics: {
      totalShops,
      activeShops,
      suspendedShops,
      managedModeShops,
      totalCustomers,
      totalCampaigns,
      totalMessages,
      totalLeads,
      totalSocialLeads,
      totalSales,
      totalPlatformRevenue,
      totalBirthdayMessages,
      totalAnniversaryMessages,
      totalOccasionRedemptions,
      totalOccasionAttributedRevenue
    },
    businessTypes,
    subscriptionPlans,
    shopsSummary: store.shops.map(shop => {
      const shopCustCount = store.getCustomers(shop.id).length;
      const shopCampCount = store.getCampaigns(shop.id).length;
      const shopLeadsCount = store.getLeads(shop.id).length;
      const shopRev = store.getSales(shop.id).reduce((acc, s) => acc + Number(s.sale_amount || 0), 0);
      const integration = store.integrationSettings[shop.id];

      return {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        city: shop.city,
        business_type: shop.business_type || 'MOBILE_ELECTRONICS',
        plan: shop.plan || 'GROWTH',
        operating_mode: shop.operating_mode || 'SHOP_MANAGED',
        active_status: shop.active_status,
        customerCount: shopCustCount,
        campaignCount: shopCampCount,
        leadsCount: shopLeadsCount,
        revenue: shopRev,
        integrationStatus: integration?.status || 'NOT_CONNECTED',
        provider: integration?.provider || 'MOCK',
        created_at: shop.created_at
      };
    })
  });
});

// Create new shop tenant with business type and plan
router.post('/shops', (req: Request, res: Response) => {
  const { name, slug, phone, address, city, business_type, plan, operating_mode } = req.body;

  if (!name || !slug || !phone) {
    res.status(400).json({ error: 'name, slug, and phone are required' });
    return;
  }

  const existing = store.shops.find(s => s.slug === slug);
  if (existing) {
    res.status(400).json({ error: 'Shop with this slug already exists' });
    return;
  }

  const shopId = uuidv4();
  const shop: Shop = {
    id: shopId,
    name,
    slug,
    phone,
    address: address || '',
    city: city || 'Kolkata',
    state: 'West Bengal',
    pincode: '700001',
    business_hours: 'Mon-Sat: 10:00 AM - 9:00 PM',
    business_type: (business_type as BusinessType) || 'GENERAL_RETAIL',
    plan: (plan as SubscriptionPlan) || 'GROWTH',
    operating_mode: (operating_mode as OperatingMode) || 'SHOP_MANAGED',
    feature_flags: {
      enable_whatsapp: true,
      enable_social_leads: true,
      enable_facebook: true,
      enable_instagram: true,
      enable_ai_replies: true,
      enable_managed_service: operating_mode === 'MANAGED_SERVICE',
      enable_sales_tracking: true,
      enable_inventory: true
    },
    active_status: true,
    created_at: new Date().toISOString()
  };

  store.shops.push(shop);

  // Automatically provision default owner Profile
  const ownerId = uuidv4();
  const ownerProfile: any = {
    id: ownerId,
    shop_id: shopId,
    full_name: `${name} Store Owner`,
    email: `owner@${slug}.com`,
    phone: phone,
    role: 'SHOP_OWNER',
    created_at: new Date().toISOString()
  };
  store.profiles.push(ownerProfile);

  // Automatically seed default product category
  const catNames: Record<string, string> = {
    FURNITURE: 'Living & Bedroom Sets',
    MOBILE_ELECTRONICS: 'Smartphones & Accessories',
    HOME_APPLIANCES: 'Kitchen & Home Appliances',
    FASHION_CLOTHING: 'Apparel & Collections',
    JEWELLERY: 'Precious Gold & Diamond Jewellery',
    OPTICAL: 'Eyewear & Lenses',
    GENERAL_RETAIL: 'Store Featured Items'
  };

  store.productCategories.push({
    id: uuidv4(),
    shop_id: shopId,
    name: catNames[shop.business_type] || 'Store Featured Items',
    slug: 'featured-items',
    business_type: shop.business_type,
    description: `Primary category for ${shop.name}`,
    created_at: new Date().toISOString()
  });

  // Default settings
  store.shopSettings[shopId] = {
    id: uuidv4(),
    shop_id: shopId,
    daily_campaign_limit: 500,
    contact_frequency_days: 14,
    quiet_hours_start: '21:00:00',
    quiet_hours_end: '09:00:00',
    default_language: 'en',
    faqs: [],
    ai_guardrails: 'Strictly follow verified shop offers.'
  };

  store.integrationSettings[shopId] = {
    id: uuidv4(),
    shop_id: shopId,
    provider: 'MOCK',
    phone_number_id: '',
    waba_id: '',
    access_token: '',
    webhook_secret: `shopgrow_whsec_${slug}`,
    status: 'CONNECTED',
    last_sync_at: new Date().toISOString()
  };

  store.logAuditAction(shopId, 'Super Admin', 'SUPER_ADMIN', 'SHOP_PROVISIONED', {
    shop_name: shop.name,
    business_type: shop.business_type,
    plan: shop.plan,
    owner_id: ownerId
  });

  store.logSystemEvent({
    name: 'New Shop Provisioned & Workspace Initialized',
    shop_id: shopId,
    source: 'SUPER_ADMIN',
    status: 'SUCCESS',
    payload: {
      shop_id: shop.id,
      shop_name: shop.name,
      business_type: shop.business_type,
      plan: shop.plan,
      owner: ownerProfile.full_name
    }
  });

  res.status(201).json({
    shop,
    owner: ownerProfile,
    message: 'Shop created and initialized successfully with active owner profile.'
  });
});

// List all shops directly
router.get('/shops', (_req: Request, res: Response) => {
  res.json(store.shops);
});

// Delete shop
router.delete('/shops/:id', (req: Request, res: Response) => {
  const shopId = req.params.id as string;
  const success = store.deleteShop(shopId);
  if (!success) {
    res.status(404).json({ error: 'Shop not found' });
    return;
  }
  res.json({ success: true, message: 'Shop and all associated sandbox data removed.' });
});

// Reset demo shop data
router.post('/shops/:id/reset', (req: Request, res: Response) => {
  const shopId = req.params.id as string;
  const shop = store.getShop(shopId);
  if (!shop) {
    res.status(404).json({ error: 'Shop not found' });
    return;
  }
  store.logSystemEvent({
    name: `Shop Workspace Reset (${shop.name})`,
    shop_id: shop.id,
    source: 'SUPER_ADMIN',
    status: 'WARNING',
    payload: { shop_id: shop.id, name: shop.name }
  });
  res.json({ success: true, message: `Shop ${shop.name} reset to initial seed state.` });
});

// Toggle shop active status
router.patch('/shops/:id/toggle', (req: Request, res: Response) => {
  const shop = store.shops.find(s => s.id === req.params.id);
  if (!shop) {
    res.status(404).json({ error: 'Shop not found' });
    return;
  }

  shop.active_status = !shop.active_status;
  store.logAuditAction(shop.id, 'Super Admin', 'SUPER_ADMIN', 'SHOP_STATUS_TOGGLED', {
    active_status: shop.active_status
  });

  res.json({ success: true, shop });
});

// Update plan & operating mode
router.patch('/shops/:id/plan', (req: Request, res: Response) => {
  const shop = store.shops.find(s => s.id === req.params.id);
  if (!shop) {
    res.status(404).json({ error: 'Shop not found' });
    return;
  }

  const { plan, operating_mode } = req.body;
  if (plan) shop.plan = plan;
  if (operating_mode) shop.operating_mode = operating_mode;

  store.logAuditAction(shop.id, 'Super Admin', 'SUPER_ADMIN', 'SHOP_PLAN_UPDATED', {
    plan: shop.plan,
    operating_mode: shop.operating_mode
  });

  res.json({ success: true, shop });
});

// Generate Shop Owner Invite / Login Link
router.post('/shops/:id/invite', (req: Request, res: Response) => {
  const shopId = req.params.id as string;
  const shop = store.getShop(shopId);
  if (!shop) {
    res.status(404).json({ error: 'Shop not found' });
    return;
  }

  const { email } = req.body;
  const token = uuidv4().replace(/-/g, '').slice(0, 16);
  const inviteId = uuidv4();
  const inviteLink = `http://localhost:5173/shop/login?shop=${shop.slug}&token=${token}`;

  const invite = {
    id: inviteId,
    shop_id: shop.id,
    shop_name: shop.name,
    email: email || `owner@${shop.slug}.com`,
    invite_token: token,
    role: 'SHOP_OWNER' as const,
    status: 'PENDING' as const,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString()
  };

  store.logAuditAction(shop.id, 'Super Admin', 'SUPER_ADMIN', 'SHOP_OWNER_INVITE_GENERATED', {
    shop_name: shop.name,
    email: invite.email,
    invite_token: token
  });

  store.logSystemEvent({
    name: 'Shop Owner Invite Link Created',
    shop_id: shop.id,
    source: 'SUPER_ADMIN',
    status: 'SUCCESS',
    payload: {
      shop_name: shop.name,
      email: invite.email,
      inviteLink
    }
  });

  res.json({
    success: true,
    invite,
    inviteLink,
    message: `Invite link generated successfully for ${shop.name}.`
  });
});

// Admin-assisted access to shop workspace (Open Shop as Admin without owner password)
router.post('/shops/:id/access-as-admin', (req: Request, res: Response) => {
  const shopId = req.params.id as string;
  const shop = store.getShop(shopId);
  if (!shop) {
    res.status(404).json({ error: 'Shop not found' });
    return;
  }

  store.logAuditAction(shop.id, 'Super Admin', 'SUPER_ADMIN', 'ADMIN_ASSISTED_ACCESS', {
    shop_name: shop.name,
    timestamp: new Date().toISOString()
  });

  store.logSystemEvent({
    name: `Admin-Assisted Workspace Access (${shop.name})`,
    shop_id: shop.id,
    source: 'SUPER_ADMIN',
    status: 'SUCCESS',
    payload: {
      action: 'OPEN_SHOP_AS_ADMIN',
      shop_id: shop.id,
      shop_name: shop.name
    }
  });

  res.json({
    success: true,
    shop,
    message: `Operating as Super Admin inside ${shop.name} workspace.`
  });
});

// ============================================================================
// SUPER ADMIN ACCESS GOVERNANCE & ALLOWLIST
// ============================================================================

// 1. List all Super Admins
router.get('/admins', (_req: Request, res: Response) => {
  const admins = store.getSuperAdmins();
  res.json({ success: true, data: admins });
});

// 2. Grant Super Admin access to a new email
router.post('/admins', (req: Request, res: Response) => {
  const { email, full_name, confirmation } = req.body;
  const grantedBy = (req.headers['x-user-email'] as string) || 'admin@shopgrow.ai';

  if (!confirmation) {
    res.status(400).json({ success: false, error: 'Confirmation is required to grant platform Super Administrator access.' });
    return;
  }

  if (!email) {
    res.status(400).json({ success: false, error: 'Email address is required.' });
    return;
  }

  const result = store.addSuperAdmin(email, full_name || '', grantedBy);
  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    data: result.admin,
    admin: result.admin,
    message: `Super Admin access granted to ${email}. Logged in platform audit log.`
  });
});

// 3. Revoke or Suspend Super Admin access
router.patch('/admins/:id/status', (req: Request, res: Response) => {
  const adminId = req.params.id as string;
  const { status } = req.body;
  const actorName = (req.headers['x-user-email'] as string) || 'admin@shopgrow.ai';

  if (status !== 'ACTIVE' && status !== 'REVOKED' && status !== 'SUSPENDED') {
    res.status(400).json({ success: false, error: 'Valid status is ACTIVE, REVOKED, or SUSPENDED.' });
    return;
  }

  const result = store.updateSuperAdminStatus(adminId, status, actorName);
  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    data: result.admin,
    admin: result.admin,
    message: `Super Admin status updated to ${status}.`
  });
});

export default router;
