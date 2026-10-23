const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING ADMIN AUTHENTICATION TESTS ---');

  // 1. Wrong password check
  const wrongPass = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/admin-login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@shopgrow.ai', password: 'WrongPassword999!' });

  console.log('1. Wrong Password Attempt:', wrongPass.status, wrongPass.data);
  const wrongPassPassed = wrongPass.status === 401 && wrongPass.data.success === false;

  // 2. Correct password check
  const correctPass = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/admin-login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@shopgrow.ai', password: 'adminpassword' });

  console.log('2. Correct Password Attempt:', correctPass.status, correctPass.data.success, 'Role:', correctPass.data.user?.role);
  const correctPassPassed = correctPass.status === 200 && correctPass.data.user?.role === 'SUPER_ADMIN';

  // 3. Request reset token
  const forgotRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/admin/forgot-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@shopgrow.ai' });

  console.log('3. Forgot Password Request:', forgotRes.status, 'HasToken:', !!forgotRes.data.resetToken);
  const resetToken = forgotRes.data.resetToken;

  // 4. Complete reset with weak password (policy violation)
  const weakReset = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/admin/reset-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@shopgrow.ai', token: resetToken, newPassword: 'weak' });

  console.log('4. Weak Password Rejection:', weakReset.status, weakReset.data);
  const weakRejected = weakReset.status === 400 && weakReset.data.error.includes('8 characters');

  // 5. Complete reset with strong password
  const strongReset = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/admin/reset-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@shopgrow.ai', token: resetToken, newPassword: 'ShopGrow@Super2026' });

  console.log('5. Strong Password Reset:', strongReset.status, strongReset.data);
  const strongResetPassed = strongReset.status === 200 && strongReset.data.success === true;

  // 6. Old password fails
  const oldLogin = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/admin-login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@shopgrow.ai', password: 'adminpassword' });

  console.log('6. Old Password After Reset:', oldLogin.status, oldLogin.data);
  const oldLoginRejected = oldLogin.status === 401;

  // 7. New password succeeds
  const newLogin = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/admin-login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@shopgrow.ai', password: 'ShopGrow@Super2026' });

  console.log('7. New Password Login:', newLogin.status, newLogin.data.success);
  const newLoginPassed = newLogin.status === 200;

  // 8. Change password authenticated
  const changePass = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/admin/change-password',
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-role': 'SUPER_ADMIN',
      'x-user-email': 'admin@shopgrow.ai'
    }
  }, { currentPassword: 'ShopGrow@Super2026', newPassword: 'AdminPassword123' });

  console.log('8. Change Password Back:', changePass.status, changePass.data);
  const changePassPassed = changePass.status === 200;

  // 9. Verify password hash is never exposed in /api/super-admin/admins
  const adminListRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/super-admin/admins',
    method: 'GET',
    headers: {
      'x-user-role': 'SUPER_ADMIN',
      'x-shop-id': 'shop-saha-electronics-001'
    }
  });

  const admins = adminListRes.data?.data || [];
  const hashLeaked = admins.some(a => a.password_hash || a.password_salt || a.reset_token_hash);
  console.log('9. Hash leak check in /api/super-admin/admins:', !hashLeaked ? 'PASSED (0 hashes leaked)' : 'FAILED (Hash leaked!)');

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log('Wrong Password Blocked (401):', wrongPassPassed ? 'PASS' : 'FAIL');
  console.log('Correct Password Accepted (200):', correctPassPassed ? 'PASS' : 'FAIL');
  console.log('Weak Password Policy Enforcement:', weakRejected ? 'PASS' : 'FAIL');
  console.log('Secure Token Password Reset:', strongResetPassed ? 'PASS' : 'FAIL');
  console.log('Old Password Invalidation:', oldLoginRejected ? 'PASS' : 'FAIL');
  console.log('New Password Authentication:', newLoginPassed ? 'PASS' : 'FAIL');
  console.log('Authenticated Password Change:', changePassPassed ? 'PASS' : 'FAIL');
  console.log('Credential Privacy & Hash Protection:', !hashLeaked ? 'PASS' : 'FAIL');

  const allPassed = wrongPassPassed && correctPassPassed && weakRejected && strongResetPassed && oldLoginRejected && newLoginPassed && changePassPassed && !hashLeaked;
  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});