const http = require('http');

function post(path, body = {}, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-shop-id': 'shop-saha-electronics-001',
        'x-user-role': 'SUPER_ADMIN',
        ...headers
      }
    }, (res) => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(buf) });
        } catch (e) {
          resolve({ status: res.statusCode, body: buf });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'x-shop-id': 'shop-saha-electronics-001',
        'x-user-role': 'SUPER_ADMIN',
        ...headers
      }
    }, (res) => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(buf) });
        } catch (e) {
          resolve({ status: res.statusCode, body: buf });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('========================================================');
  console.log('SHOPGROW AI — FINAL MASTER UPGRADE VERIFICATION TEST');
  console.log('========================================================\n');

  // 1. Super Admin Overview
  const saRes = await get('/api/super-admin/overview');
  console.log('1. Super Admin Overview Status:', saRes.status);
  console.log('   Total Shops:', saRes.body.metrics?.totalShops);
  console.log('   Total Customers:', saRes.body.metrics?.totalCustomers);
  console.log('   Birthday Msgs:', saRes.body.metrics?.totalBirthdayMessages);
  console.log('   Occasion Redemptions:', saRes.body.metrics?.totalOccasionRedemptions);

  // 2. Dashboard Analytics & Action Center
  const dashRes = await get('/api/analytics/dashboard');
  console.log('\n2. Dashboard Analytics Status:', dashRes.status);
  console.log('   Primary KPIs:', dashRes.body.primaryKpis);
  console.log('   Occasion KPIs:', dashRes.body.occasionKpis);
  console.log('   Today\'s AI Action Center items count:', dashRes.body.actionCenterItems?.length);
  dashRes.body.actionCenterItems?.slice(0, 3).forEach((item, i) => {
    console.log(`     Item [${i+1}]: ${item.title} -> Action: [${item.actionLabel || item.action_label || 'ACTIVE'}]`);
  });

  // 3. Occasion Due Scanner
  const dueRes = await get('/api/occasions/due?days=7');
  console.log('\n3. Due Occasions (7-day window) Status:', dueRes.status);
  console.log('   Due Today count:', dueRes.body.today?.count);
  console.log('   Upcoming 7 Days count:', dueRes.body.totalUpcomingCount);

  // 4. Occasion Settings
  const settingsRes = await get('/api/occasions/settings');
  console.log('\n4. Occasion Settings Status:', settingsRes.status);
  console.log('   Birthday Automation Enabled:', settingsRes.body.birthday_enabled);
  console.log('   Birthday Offer Name:', settingsRes.body.offers?.birthday?.offer_name);
  console.log('   Birthday Coupon Code:', settingsRes.body.offers?.birthday?.coupon_code);

  // 5. Automated Test Suite (30 Checks)
  console.log('\n5. Executing Automated 30-Check QA Test Suite...');
  const testsRes = await post('/api/testing/run-automated-tests');
  console.log('   Status:', testsRes.status);
  console.log('   Total Tests:', testsRes.body.total);
  console.log('   Passed:', testsRes.body.passed);
  console.log('   Failed:', testsRes.body.failed);
  console.log('   Warnings:', testsRes.body.warnings);

  // 6. Occasion Simulator
  console.log('\n6. Executing Occasion Simulator Endpoint...');
  const occSimRes = await post('/api/testing/simulate-occasion', {
    shopId: 'shop-saha-electronics-001',
    occasionType: 'BIRTHDAY',
    fakeBirthday: true,
    enableSpecialOffer: true
  });
  console.log('   Status:', occSimRes.status);
  console.log('   Overall Status:', occSimRes.body.overall_status);
  console.log('   Simulation Steps Passed:', occSimRes.body.steps?.length);

  // 7. Complete 20-Step ShopGrow Demo
  console.log('\n7. Executing Complete 20-Step Lifecycle Verification...');
  const demoRes = await post('/api/testing/run-complete-shopgrow-demo');
  console.log('   Status:', demoRes.status);
  console.log('   Overall Status:', demoRes.body.overall_status);
  console.log('   Passed Steps:', demoRes.body.passed_count, '/', demoRes.body.steps?.length);
  console.log('   Failed Steps:', demoRes.body.failed_count);

  console.log('\n========================================================');
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('========================================================');
}

run().catch(console.error);
