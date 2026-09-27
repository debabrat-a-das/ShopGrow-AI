// Test suite for ShopGrow AI Operational v2.2 Features
const BASE_URL = 'http://localhost:3001/api';

async function runTests() {
  console.log('--- Starting ShopGrow AI v2.2 Automated Verification ---');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  // Fetch real products first
  const prodRes = await fetch(`${BASE_URL}/products`, {
    headers: { 'x-shop-id': 'shop-saha-electronics-001', 'x-user-role': 'SHOP_OWNER' }
  });
  const products = await prodRes.json();
  const liveProductId = products[0]?.id;
  console.log(`Using live product ID: ${liveProductId}`);

  // 1. Test Customer 360 with Unified Journey Timeline
  await test('Customer 360 returns unified journey timeline', async () => {
    const listRes = await fetch(`${BASE_URL}/customers`, {
      headers: { 'x-shop-id': 'shop-saha-electronics-001', 'x-user-role': 'SHOP_OWNER' }
    });
    const listData = await listRes.json();
    const testCustId = listData.customers[0].id;
    const res = await fetch(`${BASE_URL}/customers/${testCustId}`, {
      headers: { 'x-shop-id': 'shop-saha-electronics-001', 'x-user-role': 'SHOP_OWNER' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.journeyTimeline || !Array.isArray(data.journeyTimeline)) {
      throw new Error('journeyTimeline array missing');
    }
    console.log(`   (Timeline has ${data.journeyTimeline.length} events for ${data.customer.full_name})`);
  });

  // 2. Test Multi-Channel Attribution Analytics
  await test('Analytics /channel-attribution returns funnels for all sources', async () => {
    const res = await fetch(`${BASE_URL}/analytics/channel-attribution`, {
      headers: { 'x-shop-id': 'shop-saha-electronics-001', 'x-user-role': 'SHOP_OWNER' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.funnels || !Array.isArray(data.funnels)) {
      throw new Error('funnels array missing');
    }
    const fbFunnel = data.funnels.find(f => f.channel === 'Facebook');
    if (!fbFunnel) throw new Error('Facebook funnel missing');
    console.log(`   (Attribution channels: ${data.funnels.map(f => f.channel).join(', ')})`);
  });

  // 3. Test Cross-Shop Super Admin Analytics
  await test('Analytics /cross-shop-overview returns multi-shop comparison', async () => {
    const res = await fetch(`${BASE_URL}/analytics/cross-shop-overview`, {
      headers: { 'x-user-role': 'SUPER_ADMIN' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.shops || data.shops.length === 0) throw new Error('No shops returned in cross-shop overview');
    console.log(`   (Found ${data.shops.length} shops in cross-shop overview)`);
  });

  // 4. Test Super Admin Shop Invite Link & Access as Admin
  await test('Super Admin can generate shop owner invite link and access shop workspace', async () => {
    const inviteRes = await fetch(`${BASE_URL}/super-admin/shops/shop-saha-electronics-001/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'SUPER_ADMIN' },
      body: JSON.stringify({ email: 'saha.owner@test.com' })
    });
    if (!inviteRes.ok) throw new Error(`Invite failed: HTTP ${inviteRes.status}`);
    const inviteData = await inviteRes.json();
    if (!inviteData.inviteLink || !inviteData.invite.invite_token) {
      throw new Error('Invite link or token missing');
    }

    const accessRes = await fetch(`${BASE_URL}/super-admin/shops/shop-saha-electronics-001/access-as-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'SUPER_ADMIN' }
    });
    if (!accessRes.ok) throw new Error(`Access as admin failed: HTTP ${accessRes.status}`);
    console.log(`   (Invite link generated: ${inviteData.inviteLink})`);
  });

  // 5. Test Campaign Audience Segmentation with CROSS_CATEGORY Mode
  let createdCampaignId = null;
  await test('Campaign Studio audience segmentation supports CROSS_CATEGORY mode', async () => {
    const previewRes = await fetch(`${BASE_URL}/campaigns/recommend-segment`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-shop-id': 'shop-saha-electronics-001',
        'x-user-role': 'SHOP_OWNER'
      },
      body: JSON.stringify({
        product_id: liveProductId,
        audience_mode: 'CROSS_CATEGORY'
      })
    });
    if (!previewRes.ok) {
      const err = await previewRes.json().catch(() => ({}));
      throw new Error(`recommend-segment failed: HTTP ${previewRes.status} -> ${JSON.stringify(err)}`);
    }
    const previewData = await previewRes.json();
    if (!previewData.breakdown || previewData.breakdown.total_database === 0) {
      throw new Error('Breakdown calculation failed');
    }
    console.log(`   (Cross-category breakdown: total=${previewData.breakdown.total_database}, eligible=${previewData.breakdown.eligible_audience}, final=${previewData.breakdown.final_audience_count})`);
  });

  // 6. Test Campaign Creation, Approval, and "Send Campaign Now" Full Dispatch Flow
  await test('Complete Send Campaign Now flow executes through all 5 stages', async () => {
    // 6a. Create Campaign with CROSS_CATEGORY mode & custom merchant instructions
    const createRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-shop-id': 'shop-saha-electronics-001',
        'x-user-role': 'SHOP_OWNER'
      },
      body: JSON.stringify({
        name: 'Automated Test Cross-Category Launch',
        product_id: liveProductId,
        audience_mode: 'CROSS_CATEGORY',
        custom_instruction: 'Mention 0% down-payment and free screen guard on spot booking.',
        language: 'en',
        target_segment_criteria: {
          category: 'Smartphones',
          consent_required: true,
          frequency_cooldown_days: 14
        },
        message_template: 'Namaskar! Special arrival offer for you.'
      })
    });
    if (!createRes.ok) throw new Error(`Create campaign failed: HTTP ${createRes.status}`);
    const camp = await createRes.json();
    createdCampaignId = camp.id;

    // 6b. Approve Campaign
    const approveRes = await fetch(`${BASE_URL}/campaigns/${createdCampaignId}/approve`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-shop-id': 'shop-saha-electronics-001',
        'x-user-role': 'SHOP_OWNER'
      }
    });
    if (!approveRes.ok) throw new Error(`Approve failed: HTTP ${approveRes.status}`);

    // 6c. Send Campaign Now
    const sendRes = await fetch(`${BASE_URL}/campaigns/${createdCampaignId}/send`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-shop-id': 'shop-saha-electronics-001',
        'x-user-role': 'SHOP_OWNER'
      },
      body: JSON.stringify({
        bypassQuietHours: true,
        bypassFrequency: true
      })
    });
    if (!sendRes.ok) {
      const err = await sendRes.json().catch(() => ({}));
      throw new Error(`Send failed: HTTP ${sendRes.status} -> ${JSON.stringify(err)}`);
    }
    const sendData = await sendRes.json();
    if (!sendData.success || sendData.sentCount === 0) {
      throw new Error(`Send failed: sentCount is 0 or success is false`);
    }
    console.log(`   (Dispatched: sentCount=${sendData.sentCount}, state=${sendData.state})`);

    // 6d. Check Campaign Performance Results Report
    const resultsRes = await fetch(`${BASE_URL}/campaigns/${createdCampaignId}/results`, {
      headers: { 
        'x-shop-id': 'shop-saha-electronics-001',
        'x-user-role': 'SHOP_OWNER'
      }
    });
    if (!resultsRes.ok) throw new Error(`Results failed: HTTP ${resultsRes.status}`);
    const resultsData = await resultsRes.json();
    if (!resultsData.metrics || resultsData.recipients?.length === 0) {
      throw new Error('Results metrics or recipients missing');
    }
    console.log(`   (Results: sent=${resultsData.metrics.sent_count}, delivered=${resultsData.metrics.delivered_count})`);
  });

  console.log('\n=========================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=========================================');
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
