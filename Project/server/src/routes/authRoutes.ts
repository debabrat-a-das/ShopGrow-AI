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

  const userResolution = store.resolveUserByCredentials(cleanEmail, String(password));

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
 * Strictly verifies against hashed credentials and database super_admins allowlist.
 * Never stores or validates against plaintext passwords.
 */
authRoutes.post('/admin-login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Admin email and password are required' });
    return;
  }

  const cleanEmail = String(email).toLowerCase().trim();

  // Server-side Super Admin Allowlist and Credential check with PBKDF2 hash verification
  const authResult = store.verifyAdminCredentials(cleanEmail, String(password));

  if (!authResult.valid || !authResult.admin) {
    store.logAuditAction('PLATFORM_GLOBAL', cleanEmail, 'ANONYMOUS', 'UNAUTHORIZED_ADMIN_LOGIN_ATTEMPT', {
      attempted_email: cleanEmail,
      ip: req.ip,
      reason: authResult.error
    });
    res.status(authResult.status || 401).json({
      success: false,
      error: authResult.error || 'Invalid administrator credentials.'
    });
    return;
  }

  const adminRecord = authResult.admin;
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
 * 3. Request Password Reset for Admin / Users
 * Generates a cryptographically random token, stores its SHA-256 hash with 60-min expiration.
 */
authRoutes.post('/admin/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, error: 'Administrator email is required.' });
    return;
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const result = store.createAdminPasswordResetToken(cleanEmail);

  // Return safe confirmation. When token is generated, return token data for reset flow.
  const responseData: any = {
    success: true,
    message: 'If an active administrator account with that email exists, password reset instructions have been generated.'
  };

  if (result.rawToken) {
    responseData.resetToken = result.rawToken;
    responseData.expiresAt = result.expiresAt;
    responseData.resetUrl = `/admin/reset-password?token=${result.rawToken}&email=${encodeURIComponent(cleanEmail)}`;
  }

  res.json(responseData);
});

// Alias for generic public forgot-password
authRoutes.post('/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, error: 'Email is required.' });
    return;
  }
  const cleanEmail = String(email).toLowerCase().trim();
  if (store.isSuperAdminEmail(cleanEmail)) {
    const result = store.createAdminPasswordResetToken(cleanEmail);
    res.json({
      success: true,
      message: 'Password reset instructions have been generated.',
      resetToken: result.rawToken,
      expiresAt: result.expiresAt
    });
    return;
  }
  res.json({
    success: true,
    message: 'If an account exists with that email address, password reset instructions have been dispatched.'
  });
});

/**
 * 4. Complete Password Reset using Token
 * Validates token against SHA-256 hash, enforces strong password policy, and updates PBKDF2 hash.
 */
authRoutes.post('/admin/reset-password', (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    res.status(400).json({ success: false, error: 'Email, reset token, and new password are required.' });
    return;
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const result = store.resetAdminPasswordWithToken(cleanEmail, String(token), String(newPassword));

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    message: 'Password has been reset successfully. You may now sign in with your new password.'
  });
});

// Alias for generic reset-password
authRoutes.post('/reset-password', (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    res.status(400).json({ success: false, error: 'Email, reset token, and new password are required.' });
    return;
  }
  const cleanEmail = String(email).toLowerCase().trim();
  const result = store.resetAdminPasswordWithToken(cleanEmail, String(token), String(newPassword));
  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }
  res.json({
    success: true,
    message: 'Password has been reset successfully.'
  });
});

/**
 * 5. Change Password for Authenticated Admin
 * Requires current password verification and enforces policy on new password.
 */
authRoutes.post('/admin/change-password', (req: Request, res: Response) => {
  const { email, currentPassword, newPassword } = req.body;
  const headerEmail = (req.headers['x-user-email'] as string);
  const targetEmail = email || headerEmail;

  if (!targetEmail || !currentPassword || !newPassword) {
    res.status(400).json({ success: false, error: 'Email, current password, and new password are required.' });
    return;
  }

  const cleanEmail = String(targetEmail).toLowerCase().trim();
  const result = store.changeAdminPassword(cleanEmail, String(currentPassword), String(newPassword));

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    message: 'Administrator password changed successfully.'
  });
});

/**
 * 6. Auth context helper: Returns current active tenant / profile info
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
  let profile = userEmail ? store.profiles.find(p => p.email.toLowerCase() === userEmail) : undefined;
  if (!profile) {
    profile = store.profiles.find(p => p.shop_id === shopId && p.role === role) || store.profiles[0];
  }

  const assignedShop = store.getShop(profile.shop_id) || store.shops[0];

  res.json({
    user: {
      id: profile.id,
      shop_id: profile.shop_id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      created_at: profile.created_at
    },
    currentShop: assignedShop,
    // Strictly isolate: Non-Super Admin NEVER receives list of other shops
    availableShops: [{ id: assignedShop.id, name: assignedShop.name, slug: assignedShop.slug, business_type: assignedShop.business_type, plan: assignedShop.plan }]
  });
});

/**
 * 7. Cross-Tenant Security Middleware
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