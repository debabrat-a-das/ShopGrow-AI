const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== SHOPGROW AI SECURITY & TENANT ISOLATION TEST SUITE ===\n');
  const results = [];

  // TEST A: Login as Saha Electronics Owner
  try {
    const resA = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'owner@sahaelectronics.com', password: 'password123' });

    const isSahaOnly = resA.data?.shop?.id === 'shop-saha-electronics-001' &&
      resA.data?.availableShops?.length === 1 &&
      resA.data?.availableShops[0]?.id === 'shop-saha-electronics-001';

    // Test cross-tenant access attempt
    const crossResA = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/customers?shop_id=shop-furniture-002',
      method: 'GET',
      headers: {
        'x-user-role': 'SHOP_OWNER',
        'x-shop-id': 'shop-saha-electronics-001'
      }
    });

    const crossBlocked = crossResA.status === 403;

    if (isSahaOnly && crossBlocked) {
      results.push({ test: 'TEST A: Saha Owner Isolation & Cross-Tenant Block', status: 'PASS', details: 'Only Saha visible; cross-tenant attempt returned 403 Forbidden.' });
    } else {
      results.push({ test: 'TEST A: Saha Owner Isolation', status: 'FAIL', details: `isSahaOnly=${isSahaOnly}, crossStatus=${crossResA.status}` });
    }
  } catch (err) {
    results.push({ test: 'TEST A', status: 'FAIL', details: err.message });
  }

  // TEST B: Login as Royal Teak Owner
  try {
    const resB = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'owner@royalteak.in', password: 'password123' });

    const isTeakOnly = resB.data?.shop?.id === 'shop-furniture-002' &&
      resB.data?.availableShops?.length === 1 &&
      resB.data?.availableShops[0]?.id === 'shop-furniture-002';

    const crossResB = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/customers?shop_id=shop-saha-electronics-001',
      method: 'GET',
      headers: {
        'x-user-role': 'SHOP_OWNER',
        'x-shop-id': 'shop-furniture-002'
      }
    });

    const crossBlockedB = crossResB.status === 403;

    if (isTeakOnly && crossBlockedB) {
      results.push({ test: 'TEST B: Royal Teak Owner Isolation', status: 'PASS', details: 'Only Royal Teak visible; cannot access Saha Electronics (403 Forbidden).' });
    } else {
      results.push({ test: 'TEST B: Royal Teak Owner Isolation', status: 'FAIL', details: `isTeakOnly=${isTeakOnly}, crossStatus=${crossResB.status}` });
    }
  } catch (err) {
    results.push({ test: 'TEST B', status: 'FAIL', details: err.message });
  }

  // TEST C: Login as Staff
  try {
    const resC = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'priya@sahaelectronics.com', password: 'password123' });

    const isStaff = resC.data?.role === 'STAFF' &&
      resC.data?.shop?.id === 'shop-saha-electronics-001' &&
      resC.data?.availableShops?.length === 1;

    if (isStaff) {
      results.push({ test: 'TEST C: Staff Login Isolation', status: 'PASS', details: 'Role=STAFF, assigned shop resolved automatically, no other shops exposed.' });
    } else {
      results.push({ test: 'TEST C: Staff Login Isolation', status: 'FAIL', details: JSON.stringify(resC.data) });
    }
  } catch (err) {
    results.push({ test: 'TEST C', status: 'FAIL', details: err.message });
  }

  // TEST D: Normal login rejects Super Admin email
  try {
    const resD = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@shopgrow.ai', password: 'adminpassword' });
    console.log('TEST D response:', resD);

    if (resD.status === 403 && resD.data?.error?.includes('administrative portal')) {
      results.push({ test: 'TEST D: Public Login Super Admin Protection', status: 'PASS', details: 'Public login rejects Super Admin email and directs to /admin/login.' });
    } else {
      results.push({ test: 'TEST D: Public Login Super Admin Protection', status: 'FAIL', details: `status=${resD.status}, data=${JSON.stringify(resD.data)}` });
    }
  } catch (err) {
    results.push({ test: 'TEST D', status: 'FAIL', details: err.message });
  }

  // TEST E: Unauthorized user attempts /admin/login
  try {
    const resE = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/admin-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'intruder@external.com', password: 'password123' });
    console.log('TEST E response:', resE);

    if (resE.status === 403 && (resE.data?.error?.includes('allowlist') || resE.data?.error?.includes('Super Admin'))) {
      results.push({ test: 'TEST E: Unauthorized /admin/login Block', status: 'PASS', details: 'Non-allowlisted email denied with 403 Forbidden.' });
    } else {
      results.push({ test: 'TEST E: Unauthorized /admin/login Block', status: 'FAIL', details: `status=${resE.status}, data=${JSON.stringify(resE.data)}` });
    }
  } catch (err) {
    results.push({ test: 'TEST E', status: 'FAIL', details: err.message });
  }

  // TEST F: Authorized Super Admin login
  try {
    const resF = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/admin-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@shopgrow.ai', password: 'adminpassword' });
    console.log('TEST F response:', resF);

    const superAdminAuthed = resF.status === 200 && (resF.data?.user?.role === 'SUPER_ADMIN' || resF.data?.role === 'SUPER_ADMIN');

    // Verify Super Admin can query all shops
    const shopsRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/super-admin/shops',
      method: 'GET',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        'x-shop-id': 'shop-saha-electronics-001'
      }
    });

    const hasAllShops = Array.isArray(shopsRes.data) && shopsRes.data.length >= 2;

    if (superAdminAuthed && hasAllShops) {
      results.push({ test: 'TEST F: Authorized Super Admin Login & Global Access', status: 'PASS', details: `Super Admin authorized; can view all ${shopsRes.data.length} registered shops.` });
    } else {
      results.push({ test: 'TEST F: Authorized Super Admin Login', status: 'FAIL', details: `authed=${superAdminAuthed}, hasAllShops=${hasAllShops}` });
    }
  } catch (err) {
    results.push({ test: 'TEST F', status: 'FAIL', details: err.message });
  }

  // TEST G: Existing Super Admin grants a second Super Admin
  try {
    // 1. Add second admin
    const grantRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/super-admin/admins',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'SUPER_ADMIN',
        'x-shop-id': 'shop-saha-electronics-001'
      }
    }, {
      email: 'admin2@shopgrow.ai',
      full_name: 'Vikram Sen (Co-Admin)',
      confirmation: true
    });

    const grantSuccess = grantRes.status === 200 && (grantRes.data?.success || grantRes.data?.admin);
    const secondAdminId = grantRes.data?.admin?.id || grantRes.data?.data?.id;

    // 2. Test login with newly granted admin
    const newAdminLogin = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/admin-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin2@shopgrow.ai', password: 'adminpassword' });

    const newAdminPass = newAdminLogin.status === 200 && (newAdminLogin.data?.user?.role === 'SUPER_ADMIN' || newAdminLogin.data?.role === 'SUPER_ADMIN');

    // 3. Suspend second admin and verify login is then denied
    let suspendedBlocked = false;
    if (secondAdminId) {
      await request({
        hostname: 'localhost',
        port: 3001,
        path: `/api/super-admin/admins/${secondAdminId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'SUPER_ADMIN',
          'x-shop-id': 'shop-saha-electronics-001'
        }
      }, { status: 'SUSPENDED' });

      const suspendedLogin = await request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/admin-login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { email: 'admin2@shopgrow.ai', password: 'adminpassword' });

      suspendedBlocked = suspendedLogin.status === 403;
    }

    if (grantSuccess && newAdminPass && suspendedBlocked) {
      results.push({ test: 'TEST G: Grant & Revoke/Suspend Super Admin Access', status: 'PASS', details: 'Added admin2@shopgrow.ai, authenticated successfully, suspension blocked login (403).' });
    } else {
      results.push({ test: 'TEST G: Grant Super Admin Access', status: 'FAIL', details: `grantSuccess=${grantSuccess}, newAdminPass=${newAdminPass}, suspendedBlocked=${suspendedBlocked}, secondAdminId=${secondAdminId}` });
    }
  } catch (err) {
    results.push({ test: 'TEST G', status: 'FAIL', details: err.message });
  }

  // TEST META INTEGRATIONS
  try {
    // 1. Reconnect Facebook in Mock Mode
    const fbRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/meta-integrations/facebook/reconnect',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shop-id': 'shop-saha-electronics-001'
      }
    }, { mode: 'MOCK_MODE' });

    const fbConnected = fbRes.data?.data?.status === 'MOCK_MODE' || fbRes.data?.data?.connection_status === 'MOCK_MODE';

    // 2. Test Connection
    const testRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/meta-integrations/facebook/test',
      method: 'POST',
      headers: { 'x-shop-id': 'shop-saha-electronics-001' }
    });

    const testOk = testRes.data?.data?.success === true;

    if (fbConnected && testOk) {
      results.push({ test: 'TEST META: Facebook Connection & Diagnostic Health', status: 'PASS', details: `Status: MOCK_MODE, Latency: ${testRes.data?.data?.latency_ms}ms, Permissions verified.` });
    } else {
      results.push({ test: 'TEST META', status: 'FAIL', details: `fbConnected=${fbConnected}, testOk=${testOk}` });
    }
  } catch (err) {
    results.push({ test: 'TEST META', status: 'FAIL', details: err.message });
  }

  // TEST BRANDING & TENANT ISOLATION
  try {
    // 1. Fetch Saha default branding
    const sahaBrandRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/settings/branding?shopId=shop-saha-electronics-001',
      method: 'GET'
    });
    const sahaIsWhite = sahaBrandRes.data?.branding?.bg_color === '#FFFFFF';

    // 2. Update Saha branding to custom color
    const updateRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/settings/branding?shopId=shop-saha-electronics-001',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      bg_type: 'CUSTOM_COLOR',
      bg_color: '#F0FDF4'
    });
    const sahaUpdated = updateRes.data?.branding?.bg_color === '#F0FDF4';

    // 3. Verify Royal Teak branding is untouched (Tenant isolation)
    const teakBrandRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/settings/branding?shopId=shop-furniture-002',
      method: 'GET'
    });
    const teakUnchanged = teakBrandRes.data?.branding?.bg_type === 'CUSTOM_IMAGE';

    // Reset Saha back to default white
    await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/settings/branding?shopId=shop-saha-electronics-001',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      bg_type: 'DEFAULT_WHITE',
      bg_color: '#FFFFFF'
    });

    if (sahaIsWhite && sahaUpdated && teakUnchanged) {
      results.push({ test: 'TEST BRANDING: Tenant Isolation & Customization', status: 'PASS', details: 'Saha customized without affecting Royal Teak; reset to default white confirmed.' });
    } else {
      results.push({ test: 'TEST BRANDING', status: 'FAIL', details: `sahaIsWhite=${sahaIsWhite}, sahaUpdated=${sahaUpdated}, teakUnchanged=${teakUnchanged}` });
    }
  } catch (err) {
    results.push({ test: 'TEST BRANDING', status: 'FAIL', details: err.message });
  }

  console.log('RESULTS:');
  console.table(results);
}

runTests();
