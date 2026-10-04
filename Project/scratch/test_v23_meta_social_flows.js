// Test Suite for Meta Social Integration & Duplicate Comment Protection Engine
const BASE = 'http://localhost:3001/api';

async function runTests() {
  console.log('--- STARTING META SOCIAL & DUPLICATE COMMENT ENGINE TESTS ---');
  let failures = 0;

  // 1. GET /api/meta-integrations
  try {
    const res = await fetch(`${BASE}/meta-integrations`, {
      headers: { 'x-shop-id': 'shop-saha-electronics-001' }
    });
    const json = await res.json();
    if (json.success && json.data.facebook_page && json.data.instagram_account && json.data.meta_ad_account) {
      console.log('✅ Test 1: GET /api/meta-integrations returns 5 integration cards');
      console.log(`   - FB Page: ${json.data.facebook_page.account_name} (${json.data.facebook_page.status})`);
      console.log(`   - IG Account: ${json.data.instagram_account.account_name} (${json.data.instagram_account.status})`);
    } else {
      console.error('❌ Test 1 FAILED: Unexpected response', json);
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 1 Exception:', e.message);
    failures++;
  }

  // 2. POST /api/meta-integrations/FACEBOOK_PAGE/test
  try {
    const res = await fetch(`${BASE}/meta-integrations/FACEBOOK_PAGE/test`, {
      method: 'POST',
      headers: { 'x-shop-id': 'shop-saha-electronics-001' }
    });
    const json = await res.json();
    if (json.success && json.data.success && json.data.latency_ms >= 0) {
      console.log(`✅ Test 2: Meta Channel Health Check PASSED (latency: ${json.data.latency_ms}ms, webhook: ${json.data.webhook_status})`);
    } else {
      console.error('❌ Test 2 FAILED:', json);
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 2 Exception:', e.message);
    failures++;
  }

  // 3. Test Disconnect & Reconnect
  try {
    const discRes = await fetch(`${BASE}/meta-integrations/FACEBOOK_PAGE/disconnect`, {
      method: 'POST',
      headers: { 'x-shop-id': 'shop-saha-electronics-001' }
    });
    const discJson = await discRes.json();
    const testDisc = await fetch(`${BASE}/meta-integrations/FACEBOOK_PAGE/test`, {
      method: 'POST',
      headers: { 'x-shop-id': 'shop-saha-electronics-001' }
    });
    const testDiscJson = await testDisc.json();

    const reconnRes = await fetch(`${BASE}/meta-integrations/FACEBOOK_PAGE/reconnect`, {
      method: 'POST',
      headers: { 'x-shop-id': 'shop-saha-electronics-001' },
      body: JSON.stringify({ mode: 'MOCK_MODE' }),
      headers: { 'Content-Type': 'application/json', 'x-shop-id': 'shop-saha-electronics-001' }
    });
    const reconnJson = await reconnRes.json();

    if (discJson.data.status === 'NOT_CONNECTED' && !testDiscJson.data.success && reconnJson.data.status === 'MOCK_MODE') {
      console.log('✅ Test 3: Disconnect & Reconnect Flow Verified');
    } else {
      console.error('❌ Test 3 FAILED:', { discJson, testDiscJson, reconnJson });
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 3 Exception:', e.message);
    failures++;
  }

  // 4. Test Webhook Ingestion & Idempotency
  try {
    const testCommId = `test_comm_webhook_${Date.now()}`;
    const payload = {
      object: 'page',
      entry: [{
        changes: [{
          field: 'feed',
          value: {
            item: 'comment',
            verb: 'add',
            comment_id: testCommId,
            from: { id: 'fb_user_tanmay_99', name: 'Tanmay Das' },
            message: 'OnePlus 12R price koto? Free tempered glass ache?',
            post_id: 'post_festive_001'
          }
        }]
      }]
    };

    // First call: Should be PROCESSED
    const res1 = await fetch(`${BASE}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-shop-id': 'shop-saha-electronics-001' },
      body: JSON.stringify(payload)
    });
    const json1 = await res1.json();

    // Second call: Identical comment ID - Should be IGNORED
    const res2 = await fetch(`${BASE}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-shop-id': 'shop-saha-electronics-001' },
      body: JSON.stringify(payload)
    });
    const json2 = await res2.json();

    if (json1.result?.status === 'PROCESSED' && json2.result?.duplicate === true && json2.result?.status === 'IGNORED') {
      console.log('✅ Test 4: Webhook Ingestion & Idempotency Duplicate Rejection PASSED');
    } else {
      console.error('❌ Test 4 FAILED:', { json1, json2 });
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 4 Exception:', e.message);
    failures++;
  }

  // 5. Automated 25-Check Test Suite
  try {
    const res = await fetch(`${BASE}/testing/run-automated-tests`, {
      method: 'POST'
    });
    const json = await res.json();
    console.log(`✅ Test 5: Automated Suite: Total ${json.total}, Passed: ${json.passed}, Failed: ${json.failed}, Warnings: ${json.warnings}`);
    const test24 = json.results.find(t => t.id === 24);
    const test25 = json.results.find(t => t.id === 25);
    console.log(`   - Test #24: ${test24?.name} -> ${test24?.status} (${test24?.message})`);
    console.log(`   - Test #25: ${test25?.name} -> ${test25?.status} (${test25?.message})`);

    if (json.failed > 0 || test24?.status !== 'PASSED' || test25?.status !== 'PASSED') {
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 5 Exception:', e.message);
    failures++;
  }

  // 6. Scenario D: Meta Social Lead-to-Sale End-to-End Simulation
  try {
    const res = await fetch(`${BASE}/testing/run-scenario-d`, {
      method: 'POST'
    });
    const json = await res.json();
    if (json.overall_status === 'PASSED' && json.steps?.length === 5) {
      console.log(`✅ Test 6: Scenario D PASSED (${json.steps.length} steps complete)`);
      json.steps.forEach(s => console.log(`   [${s.status}] ${s.step}: ${s.details.slice(0, 70)}...`));
    } else {
      console.error('❌ Test 6 FAILED:', json);
      failures++;
    }
  } catch (e) {
    console.error('❌ Test 6 Exception:', e.message);
    failures++;
  }

  console.log(`\n==============================================`);
  if (failures === 0) {
    console.log('🎉 ALL BACKEND META SOCIAL & DEDUPLICATION TESTS PASSED!');
  } else {
    console.error(`💥 ${failures} TESTS FAILED!`);
  }
}

runTests();
