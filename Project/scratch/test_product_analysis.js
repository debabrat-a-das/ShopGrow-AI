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
  console.log('=== PRODUCT ANALYSIS & AI COPY GENERATION TEST SUITE ===');

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, message) {
    totalCount++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Valid Product Analysis
  console.log('\n--- 1. Testing Valid Product Analysis ---');
  const validRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/campaigns/generate-copy-product',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shop-id': 'shop-saha-electronics-001'
    }
  }, { product_id: 'prod-samsung-s24fe' });

  assert(validRes.status === 200, 'Endpoint returns HTTP 200 for valid product');
  assert(validRes.data.success === true, 'Response payload contains success: true');
  assert(validRes.data.variants !== undefined, 'Variants object is defined');

  const v = validRes.data.variants || {};
  assert(typeof v.banglish === 'string' && v.banglish.length > 20, 'Banglish variant is non-empty string');
  assert(typeof v.friendlyBengali === 'string' && v.friendlyBengali.length > 20, 'Friendly Bengali variant is non-empty string');
  assert(typeof v.professionalEnglish === 'string' && v.professionalEnglish.length > 20, 'Professional English variant is non-empty string');
  assert(typeof v.shortWhatsApp === 'string' && v.shortWhatsApp.length > 20, 'Short WhatsApp variant is non-empty string');

  // Verify Banglish language content
  assert(v.banglish.includes('chole esheche') || v.banglish.includes('New Arrival'), 'Banglish variant includes expected natural phrasings');

  // 2. Audience Segmentation for Product
  console.log('\n--- 2. Testing Audience Recommendation for Product ---');
  const segRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/campaigns/recommend-segment',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shop-id': 'shop-saha-electronics-001'
    }
  }, { product_id: 'prod-samsung-s24fe', audience_mode: 'ALL_ELIGIBLE' });

  assert(segRes.status === 200, 'Segment recommendation returns HTTP 200');
  assert(Array.isArray(segRes.data.customerList), 'Customer list is an array');
  assert(segRes.data.breakdown !== undefined, 'Breakdown statistics are provided');

  // 3. Failed API Response / Non-existent Product Handling
  console.log('\n--- 3. Testing Failed API Response Handling ---');
  const failRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/campaigns/generate-copy-product',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shop-id': 'shop-saha-electronics-001'
    }
  }, { product_id: 'non-existent-product-id-999' });

  assert(failRes.status === 404, 'Non-existent product returns HTTP 404');
  assert(failRes.data.success === false, 'Error response includes success: false');
  assert(typeof failRes.data.error === 'string', 'Error message is provided');

  // 4. Client-side Safe Extraction Simulation
  console.log('\n--- 4. Testing Client-side Safe Variant Extraction ---');
  
  // Case A: Missing variants completely (e.g. error response)
  const malformedResponseA = { success: false, error: 'Product not found' };
  const extractedVariantsA = malformedResponseA?.variants || malformedResponseA?.data?.variants;
  assert(extractedVariantsA === undefined, 'Correctly identifies missing variants without throwing');
  
  let didThrowA = false;
  try {
    const template = extractedVariantsA?.banglish || extractedVariantsA?.friendlyBengali || '';
    assert(template === '', 'Safely falls back to empty template when variants are undefined');
  } catch (err) {
    didThrowA = true;
  }
  assert(!didThrowA, 'Does not throw "Cannot read properties of undefined (reading banglish)"');

  // Case B: Variants present but banglish is null/undefined
  const malformedResponseB = {
    variants: {
      friendlyBengali: 'নমস্কার! অফার দেখুন।',
      professionalEnglish: 'Hello! Check out our new arrival.',
      shortWhatsApp: 'New arrival at store!'
    }
  };
  const extractedVariantsB = malformedResponseB.variants;
  const templateB = extractedVariantsB?.banglish 
    || extractedVariantsB?.friendlyBengali 
    || extractedVariantsB?.professionalEnglish 
    || '';
  assert(templateB === 'নমস্কার! অফার দেখুন।', 'Safely falls back to friendlyBengali when banglish is missing');

  // Case C: All optional languages missing except english
  const malformedResponseC = {
    variants: {
      professionalEnglish: 'English only arrival announcement.'
    }
  };
  const extractedVariantsC = malformedResponseC.variants;
  const templateC = extractedVariantsC?.banglish 
    || extractedVariantsC?.friendlyBengali 
    || extractedVariantsC?.professionalEnglish 
    || '';
  assert(templateC === 'English only arrival announcement.', 'Safely falls back to professionalEnglish when banglish and bengali are missing');

  // 5. Offer Analysis Flow Parity
  console.log('\n--- 5. Testing Offer Analysis Flow Parity ---');
  const offerRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/campaigns/generate-copy',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shop-id': 'shop-saha-electronics-001'
    }
  }, { offer_id: 'offer-samsung-s24fe-festive' });

  assert(offerRes.status === 200, 'Offer copy generation returns HTTP 200');
  assert(offerRes.data.success === true, 'Offer copy generation includes success: true');
  assert(typeof offerRes.data.variants?.banglish === 'string', 'Offer Banglish copy is generated');
  assert(typeof offerRes.data.variants?.friendlyBengali === 'string', 'Offer Bengali copy is generated');
  assert(typeof offerRes.data.variants?.professionalEnglish === 'string', 'Offer English copy is generated');

  console.log(`\n=== SUMMARY: ${passedCount}/${totalCount} TESTS PASSED ===`);
  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
