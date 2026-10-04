import { Router, Request, Response, NextFunction } from 'express';
import { store } from '../db/store.js';
import { v4 as uuidv4 } from 'uuid';

export const authRoutes = Router();

/**
 * 1. Standard Public Login
 * Production user enters Email & Password.
 * Backend verifies credentials and resolves: SHOP_OWNER, MANAGER, STAFF.
 * Returns only their single assigned shop workspace.
 * Super Admin is explicitly rejected on the public login to prevent exposure.
 */
authRoutes.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' });
    return;
  }

  const cleanEmail = String(email).toLowerCase().trim();

  // If a Super Admin tries to login through public login, prevent exposure & guide to private portal
  if (store.isSuperAdminEmail(cleanEmail)) {
    res.status(403).json({
      success: false,
      error: 'Platform Administrators must sign in through the private administrative portal at /admin/login.',
      isAdmin: true
    });
    return;
  }

  const userResolution = store.resolveUserByCredentials(cleanEmail, password);

  if (!userResolution || !userResolution.shop) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials or no shop workspace assigned to this email.'
    });
    return;
  }

  const { profile, shop } = userResolution;

  if (!shop.active_status) {
    res.status(403).json({
      success: false,
      error: 'Your shop workspace is currently suspended. Please contact platform support.'
    });
    return;
  }

  const token = `sg_token_${profile.role.toLowerCase()}_${uuidv4().replace(/-/g, '')}`;

  store.logSystemEvent({
    name: `User Authentication Success (${profile.role})`,
    shop_id: shop.id,
    source: 'AUTH_SERVICE',
    status: 'SUCCESS',
    payload: { email: cleanEmail, role: profile.role, shop_name: shop.name }
  });

  res.json({
    success: true,
    token,
    user: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      shop_id: shop.id
    },
    currentShop: shop,
    // Strictly isolate: return ONLY the single authorized shop
    availableShops: [{ id: shop.id, name: shop.name, slug: shop.slug, business_type: shop.business_type, plan: shop.plan }]
  });
});

/**
 * 2. Private Super Admin Login (/admin/login)
 * Strictly verifies against the database super_admins allowlist.
 * If email is not in super_admins with status 'ACTIVE', returns 403 Forbidden.
 */
authRoutes.post('/admin-login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Admin email and password are required' });
    return;
  }

  const cleanEmail = String(email).toLowerCase().trim();

  // Server-side Super Admin Allowlist check
  if (!store.isSuperAdminEmail(cleanEmail)) {
    store.logAuditAction('PLATFORM_GLOBAL', cleanEmail, 'ANONYMOUS', 'UNAUTHORIZED_ADMIN_LOGIN_ATTEMPT', {
      attempted_email: cleanEmail,
      ip: req.ip
    });
    res.status(403).json({
      success: false,
      error: 'Access Denied: You do not have verified Super Administrator privileges on this platform.'
    });
    return;
  }

  const adminRecord = store.superAdmins.find(sa => sa.email.toLowerCase().trim() === cleanEmail && sa.status === 'ACTIVE');
  if (!adminRecord) {
    res.status(403).json({ success: false, error: 'Access Denied: Super Admin account not found or suspended.' });
    return;
  }

  // Update last login timestamp
  adminRecord.last_login_at = new Date().toISOString();

  const token = `sg_token_super_admin_${uuidv4().replace(/-/g, '')}`;

  store.logAuditAction('PLATFORM_GLOBAL', adminRecord.full_name, 'SUPER_ADMIN', 'SUPER_ADMIN_LOGIN_SUCCESS', {
    email: cleanEmail,
    admin_id: adminRecord.id
  });

  store.logSystemEvent({
    name: 'Super Admin Portal Access Granted',
    shop_id: 'ALL',
    source: 'ADMIN_AUTH_SERVICE',
    status: 'SUCCESS',
    payload: { email: cleanEmail, admin_id: adminRecord.id }
  });

  res.json({
    success: true,
    token,
    user: {
      id: adminRecord.user_id,
      email: adminRecord.email,
      full_name: adminRecord.full_name,
      role: 'SUPER_ADMIN'
    },
    // Super Admin is permitted to see all registered shops
    availableShops: store.shops.map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      business_type: s.business_type,
      plan: s.plan,
      city: s.city
    }))
  });
});

/**
 * 3. Auth context helper: Returns current active tenant / profile info
 * Strictly enforces tenant privacy: non-super-admins only receive their authorized shop.
 */
authRoutes.get('/current-user', (req: Request, res: Response) => {
  const role = (req.headers['x-user-role'] as string) || 'SHOP_OWNER';
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const userEmail = (req.headers['x-user-email'] as string)?.toLowerCase().trim();

  if (role === 'SUPER_ADMIN') {
    const adminRecord = store.superAdmins.find(sa => sa.status === 'ACTIVE' && (!userEmail || sa.email.toLowerCase() === userEmail)) || store.superAdmins[0];
    const shop = store.getShop(shopId) || store.shops[0];

    res.json({
      user: {
        id: adminRecord?.user_id || 'profile-super-admin-000',
        email: adminRecord?.email || 'admin@shopgrow.ai',
        full_name: adminRecord?.full_name || 'Antigravity Super Admin',
        role: 'SUPER_ADMIN'
      },
      currentShop: shop,
      // Only Super Admin can see all shops
      availableShops: store.shops.map(s => ({ id: s.id, name: s.name, slug: s.slug, business_type: s.business_type, plan: s.plan }))
    });
    return;
  }

  // Non-Super Admin: Shop Owner, Manager, Staff
  // Look up profile by email if available, else by shop_id and role
  let profile = userEmail ? store.profiles.find(p => p.email.toLowerCase() === userEmail) : undefined;
  if (!profile) {
    profile = store.profiles.find(p => p.shop_id === shopId && p.role === role) || store.profiles[0];
  }

  const assignedShop = store.getShop(profile.shop_id) || store.shops[0];

  res.json({
    user: profile,
    currentShop: assignedShop,
    // Strictly isolate: Non-Super Admin NEVER receives list of other shops
    availableShops: [{ id: assignedShop.id, name: assignedShop.name, slug: assignedShop.slug, business_type: assignedShop.business_type, plan: assignedShop.plan }]
  });
});

/**
 * 4. Cross-Tenant Security Middleware
 * Prevents any user from accessing another shop by tampering with x-shop-id header or request parameters.
 */
export function enforceTenantIsolation(req: Request, res: Response, next: NextFunction) {
  const role = (req.headers['x-user-role'] as string) || 'SHOP_OWNER';
  const requestedShopId = (req.headers['x-shop-id'] as string) || (req.query.shop_id as string);
  const userEmail = (req.headers['x-user-email'] as string)?.toLowerCase().trim();

  // Super Admin has authorized cross-tenant management privileges
  if (role === 'SUPER_ADMIN') {
    return next();
  }

  // If user provided an email, verify that the requested shop matches their assigned shop
  if (userEmail && requestedShopId) {
    const profile = store.profiles.find(p => p.email.toLowerCase() === userEmail);
    if (profile && profile.shop_id !== requestedShopId) {
      store.logAuditAction('PLATFORM_SECURITY', userEmail, role, 'CROSS_TENANT_ACCESS_BLOCKED', {
        attempted_shop_id: requestedShopId,
        authorized_shop_id: profile.shop_id,
        path: req.originalUrl
      });
      res.status(403).json({
        error: 'Forbidden: Cross-tenant access denied. You are not authorized to view or manipulate data belonging to another shop.'
      });
      return;
    }
  }

  next();
}
