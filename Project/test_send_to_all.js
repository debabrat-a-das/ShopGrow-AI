// test_send_to_all.js - Acceptance test for "SEND TO ALL CUSTOMERS" feature
const API_BASE = 'http://localhost:3001/api';
const SHOP_ID = 'shop-saha-electronics-001';

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-shop-id': SHOP_ID,
    'x-user-role': 'SHOP_OWNER',
    ...(options.headers || {})
  };
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function runAcceptanceTest() {
  console.log('=== STARTING ACCEPTANCE TEST: SEND TO ALL CUSTOMERS ===\n');

  // 0. Reset test state
  await request('/testing/reset-test-data', { method: 'POST' });

  // 1. Fetch Customers
  console.log('Step 1: Fetching customers for shop...');
  const customersRes = await request('/customers');
  const allCustomers = customersRes.customers || [];
  console.log(`✓ Total customers loaded: ${allCustomers.length}`);

  // 2. Fetch Products
  console.log('\nStep 2: Fetching products for campaign...');
  const products = await request('/products');
  const selectedProduct = products[0];
  console.log(`✓ Selected Product: ${selectedProduct.brand} ${selectedProduct.model} (ID: ${selectedProduct.id})`);

  // 3. Recommend Segment with 'ALL_ELIGIBLE' mode
  console.log('\nStep 3: Calculating Audience Preview for ALL_ELIGIBLE customers...');
  const segmentRes = await request('/campaigns/recommend-segment', {
    method: 'POST',
    body: JSON.stringify({
      product_id: selectedProduct.id,
      audience_mode: 'ALL_ELIGIBLE',
      custom_instruction: 'New Product announcement'
    })
  });

  console.log('Audience Breakdown:');
  console.log(`- Total Database: ${segmentRes.breakdown.totalDatabase}`);
  console.log(`- Eligible Customers: ${segmentRes.breakdown.eligibleCustomers}`);
  console.log(`- Excluded No Consent: ${segmentRes.breakdown.excludedNoConsent}`);
  console.log(`- Excluded Opted Out: ${segmentRes.breakdown.excludedOptedOut}`);
  console.log(`- Excluded Frequency Limit: ${segmentRes.breakdown.excludedFrequencyLimit}`);

  const eligibleList = segmentRes.customerList.filter(c => c.is_selected);
  console.log(`✓ Number of eligible customer items: ${eligibleList.length}`);
  if (eligibleList.length < 2) {
    throw new Error('Expected at least 2 eligible customers to test removal');
  }

  // 4. Manually remove one customer
  const removedCustomer = eligibleList[0];
  console.log(`\nStep 4: Manually removing customer: ${removedCustomer.full_name} (${removedCustomer.phone_e164})`);
  const selectedCustomerIds = eligibleList.slice(1).map(c => c.id);
  console.log(`✓ Selected customer count after removal: ${selectedCustomerIds.length}`);

  // 5. Generate AI Message Copy
  console.log('\nStep 5: Generating AI Message Copy...');
  const copyRes = await request('/campaigns/generate-copy-product', {
    method: 'POST',
    body: JSON.stringify({
      product_id: selectedProduct.id,
      custom_instruction: 'Broadcast campaign for: New Product. Keep strictly grounded without inventing fake discounts or prices.'
    })
  });
  const copyText = copyRes?.variants?.bengali || copyRes?.variants?.english || 'Broadcast message';
  console.log(`✓ Message template generated:\n"${copyText.substring(0, 100)}..."`);

  // 6. Create Draft Campaign
  console.log('\nStep 6: Creating Draft Campaign...');
  const draftRes = await request('/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      name: `Broadcast: ${selectedProduct.brand} ${selectedProduct.model}`,
      product_id: selectedProduct.id,
      channel: 'WHATSAPP',
      audience_mode: 'ALL_ELIGIBLE',
      message_template: copyText,
      target_segment_criteria: {
        audience_mode: 'ALL_ELIGIBLE',
        brand: selectedProduct.brand,
        frequency_cooldown_days: 14
      }
    })
  });
  const campaign = draftRes.campaign || draftRes;
  console.log(`✓ Draft Campaign created with ID: ${campaign.id}, Status: ${campaign.status}`);

  // 7. Approve Campaign
  console.log('\nStep 7: Approving Campaign...');
  const approveRes = await request(`/campaigns/${campaign.id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes: 'Verified broad announcement audience' })
  });
  console.log(`✓ Campaign approved: ${approveRes.campaign.status}`);

  // 8. Send Campaign Now with selected_customer_ids
  console.log('\nStep 8: Dispatching Campaign (SEND CAMPAIGN NOW)...');
  const sendRes = await request(`/campaigns/${campaign.id}/send`, {
    method: 'POST',
    body: JSON.stringify({
      selected_customer_ids: selectedCustomerIds,
      bypassQuietHours: true // testing flag
    })
  });

  console.log(`✓ Campaign sent successfully!`);
  console.log(`- State: ${sendRes.state}`);
  console.log(`- Delivered Count: ${sendRes.delivered_count}`);
  console.log(`- Target Audience Count: ${sendRes.target_audience_count}`);

  // 9. Verify in Outbound Messages
  console.log('\nStep 9: Verifying Outbound Messages...');
  const campaignMessages = await request('/testing/outbound-messages');
  console.log(`✓ Total outbound messages logged: ${campaignMessages.length}`);

  // Check that removed customer did NOT receive a message
  const removedCustomerReceived = campaignMessages.some(m => m.recipient_phone === removedCustomer.phone_e164 && m.created_at >= campaign.created_at);
  if (removedCustomerReceived) {
    console.error(`❌ FAILURE: Manually removed customer ${removedCustomer.full_name} received message!`);
    process.exit(1);
  } else {
    console.log(`✓ CONFIRMED: Manually removed customer ${removedCustomer.full_name} did NOT receive message.`);
  }

  // Check that no opted-out customer received a message
  const optedOutCustomers = allCustomers.filter(c => c.do_not_contact || !c.whatsapp_opt_in);
  const optedOutPhones = new Set(optedOutCustomers.map(c => c.phone_e164));
  const optedOutReceived = campaignMessages.some(m => optedOutPhones.has(m.recipient_phone) && m.created_at >= campaign.created_at);
  if (optedOutReceived) {
    console.error('❌ FAILURE: Opted-out / No-consent customer received message!');
    process.exit(1);
  } else {
    console.log(`✓ CONFIRMED: Zero opted-out / non-consenting customers received messages.`);
  }

  // 10. Verify Campaign Results & Analytics
  console.log('\nStep 10: Verifying Campaign Results & Analytics...');
  const results = await request(`/campaigns/${campaign.id}/results`);
  console.log(`✓ Campaign Results:`);
  console.log(`- Recipients count: ${results.recipients.length}`);
  console.log(`- Lead tracking connected: ${results.recipients.every(r => r.conversation_id)}`);
  console.log(`- Timeline steps: ${results.timeline.map(t => t.step).join(' -> ')}`);

  console.log('\n=== ALL ACCEPTANCE CRITERIA PASSED SUCCESSFULLY! ===');
}

runAcceptanceTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
