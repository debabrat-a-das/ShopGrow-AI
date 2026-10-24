
const fs = require('fs');
const path = require('path');

console.log('=== SHOPGROW AI RESPONSIVE ARCHITECTURE TEST SUITE ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// 1. Check index.html viewport
const indexHtml = fs.readFileSync(path.join(__dirname, '../client/index.html'), 'utf-8');
assert(indexHtml.includes('viewport-fit=cover') || indexHtml.includes('width=device-width'), 'index.html has valid responsive viewport meta tag');
assert(indexHtml.includes('ShopGrow AI'), 'index.html has descriptive brand title');

// 2. Check Navbar responsive features
const navbarCode = fs.readFileSync(path.join(__dirname, '../client/src/components/Navbar.tsx'), 'utf-8');
assert(navbarCode.includes('onToggleMobileMenu'), 'Navbar supports mobile menu toggle prop');
assert(navbarCode.includes('Open navigation menu') || navbarCode.includes('Toggle navigation menu'), 'Navbar includes accessible mobile toggle button');
assert(navbarCode.includes('sm:inline') || navbarCode.includes('hidden sm:inline'), 'Navbar uses responsive simulator button formatting');

// 3. Check Sidebar responsive drawer
const sidebarCode = fs.readFileSync(path.join(__dirname, '../client/src/components/Sidebar.tsx'), 'utf-8');
assert(sidebarCode.includes('isOpen'), 'Sidebar supports isOpen prop for drawer behavior');
assert(sidebarCode.includes('-translate-x-full'), 'Sidebar translates off-canvas on mobile');
assert(sidebarCode.includes('min-h-[44px]'), 'Sidebar buttons maintain accessible 44px touch targets');

// 4. Check App.tsx mobile bottom navigation
const appCode = fs.readFileSync(path.join(__dirname, '../client/src/App.tsx'), 'utf-8');
assert(appCode.includes('isMobileNavOpen'), 'App manages isMobileNavOpen state');
assert(appCode.includes('aria-label="Mobile Navigation"'), 'App provides persistent mobile navigation bar');
assert(appCode.includes('pb-20 lg:pb-6') || appCode.includes('pb-20'), 'App provides bottom padding clearance for mobile navigation');

// 5. Check AIInbox responsive single-column switching
const inboxCode = fs.readFileSync(path.join(__dirname, '../client/src/pages/AIInbox.tsx'), 'utf-8');
assert(inboxCode.includes('hidden md:flex'), 'AIInbox uses responsive column hiding for mobile single-pane view');
assert(inboxCode.includes('ArrowLeft'), 'AIInbox includes mobile Back button to return to thread list');

// 6. Check Dashboard and Key Pages responsive grids
const dashCode = fs.readFileSync(path.join(__dirname, '../client/src/pages/Dashboard.tsx'), 'utf-8');
assert(dashCode.includes('sm:p-5') || dashCode.includes('p-3.5'), 'Dashboard uses fluid outer padding');
assert(dashCode.includes('flex flex-wrap'), 'Dashboard header buttons wrap responsively');

const custCode = fs.readFileSync(path.join(__dirname, '../client/src/pages/CustomerDatabase.tsx'), 'utf-8');
assert(custCode.includes('overflow-x-auto'), 'CustomerDatabase tables have overflow-x containment');
assert(custCode.includes('flex flex-wrap'), 'CustomerDatabase header actions wrap responsively');

console.log(`\n=== SUMMARY: ${passCount}/${passCount + failCount} RESPONSIVE ARCHITECTURE TESTS PASSED ===`);
if (failCount > 0) process.exit(1);
