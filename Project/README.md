# SHOPGROW AI 🚀
> **Tagline:** “Turn your existing customer database into repeat sales.”

ShopGrow AI is an AI-powered customer re-engagement, CRM, WhatsApp marketing, and sales-assistant SaaS platform designed specifically for local mobile and electronics retail shops (e.g. *Saha Electronics*, Kolkata / West Bengal, India).

The platform strictly uses **official Meta WhatsApp Business Platform / Cloud API** standards. It is engineered with zero web scrapers, SIM farms, or unofficial WhatsApp libraries.

---

## 🏗️ Architecture & Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, Canvas-Confetti, QRCode generator, Vite.
- **Backend Service:** Node.js, Express, TypeScript, Zod, Multer, XLSX stream parser, OpenAI Structured API client, Meta WhatsApp Cloud API client, Mock WhatsApp Provider, Webhook handler.
- **Database & Multi-Tenancy:** PostgreSQL / Supabase with Row Level Security (RLS) policies enforcing complete isolation (`shop_id`).
- **Roles:** `SUPER_ADMIN`, `SHOP_OWNER`, `MANAGER`, `STAFF`.

---

## ✨ Core Feature Highlights

1. **8-Step Customer Import Wizard (`/customers`)**
   - Supports `.xlsx`, `.xls`, and `.csv`.
   - Normalizes Indian phone numbers into E.164 (`+91XXXXXXXXXX`).
   - Duplicate detection per shop.
   - Strict WhatsApp marketing consent audit (never automatically treats raw phone number as marketing consent).
   - Full validation breakdown summary before database commit.

2. **Ground Truth Offer Manager (`/offers`)**
   - Stores verified retail deals (MRP, Offer Price, Discount %, Spot Exchange Bonus, 0% EMI terms, Cashback, Validity).
   - **Anti-Hallucination Guardrail:** AI never fabricates pricing, stock, warranty, or trade-in value not present in verified offer records.

3. **AI Campaign Studio (`/campaigns`)**
   - Step 1: Select Active Offer.
   - Step 2: AI Audience Recommendation with transparent reasoning (e.g. Samsung phone owners >18 months old).
   - Step 3: Safety filter exclusion counts (Total DB → Matched → Excluded for No Consent → Excluded for Cooldown → Final Audience).
   - Step 4: Multi-lingual Copy Generator (Professional English, Friendly Bengali বাংলা, Banglish, Short WhatsApp).
   - Step 5: **V1 Human Approval Barrier** — Shop owner must explicitly review and approve before dispatch.

4. **Campaign Safety Engine**
   - Hard checks before dispatch: `whatsapp_opt_in === true`, `do_not_contact === false`, valid E.164 number, active offer validity, 14-day customer cooldown, quiet hours (21:00 to 09:00 IST), and emergency pause.

5. **Official Meta WhatsApp Cloud API & Mock Provider**
   - Production adapter for `https://graph.facebook.com/v20.0/{phone_number_id}/messages`.
   - Built-in **Mock WhatsApp Provider & Interactive Simulator** with webhook verification, real-time message bubbles, delivery receipts, and live customer reply emulation.

6. **AI Conversation Agent & Two-Pane Inbox (`/inbox`)**
   - Classifies customer inbound messages into structured intents: `EXCHANGE_ENQUIRY`, `PRICE_ENQUIRY`, `EMI_ENQUIRY`, `VISIT_INTENT`, `STORE_LOCATION`, `UNSUBSCRIBE`, `NEEDS_HUMAN`, etc.
   - Grounded auto-answering quotes exclusively from shop profile, offers, and approved FAQs.
   - Escalates unknown technical queries to staff with `needs_human = true`.
   - Instant opt-out revocation if customer types `STOP` or `Unsubscribe`.
   - Human takeover toggle: Customer is never trapped inside automation.

7. **Deterministic Lead Scoring & Sales Attribution (`/sales`, `/analytics`)**
   - Score calculated from 0–100 with `COLD`, `WARM`, and `HOT` tiers.
   - Store visit commitments trigger instant `HOT` lead alert.
   - When a sale is confirmed, it links back to the originating WhatsApp campaign and calculates attributed revenue and conversion rates.

8. **In-Store Opt-in Landing Page & QR Counter Standee (`/optin`)**
   - Public mobile-first page: `/optin/saha-electronics`.
   - Generates high-resolution downloadable QR code for store checkout counters.

9. **Super Admin Portal (`/super-admin`)**
   - Cross-tenant metrics (total shops, platform customers, messages, revenue).
   - Provision and toggle shop tenants with complete conversation privacy.

---

## 🚀 Running Locally

### 1. Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### 2. Start Backend API Server (Port 3001)
```bash
cd server
npm install
npx tsx src/index.ts
```
*The server will start listening at `http://localhost:3001` pre-seeded with demo data for Saha Electronics.*

### 3. Start Frontend Client (Port 5173)
```bash
cd client
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🎯 Acceptance Criteria Flow Walkthrough

The exact 17-step flow can be demonstrated right in the application:

1. **Login as Saha Electronics Owner** (Default role in header).
2. **Customer Import**: Click *Import Customer Excel* on the dashboard. Drag and drop `demo-data/saha_electronics_customers.xlsx`. Inspect the 8-step validation metrics and commit.
3. **Offer Selection**: View the pre-seeded *Samsung Galaxy S24 FE Upgrade Carnival* in Offer Manager.
4. **Audience Recommendation**: Open AI Campaign Studio. Notice the AI explains why Samsung customers >18 months old are targeted, and excludes those without verified consent or on cooldown.
5. **AI Copy Generation**: Select the *Banglish* or *Bengali* variant and preview the WhatsApp chat bubble.
6. **Owner Approval**: Click *Review & Approve Campaign* (V1 requirement).
7. **Dispatch**: Send via the Mock/Meta WhatsApp provider.
8. **Inbound Reply & AI Classifier**: Click the top-right **WhatsApp Simulator** button and click *Scenario 1 (Acceptance Flow)*:
   > Customer: *"Amar purono Galaxy M31 exchange hobe? Kal dokane aschi exchange korte."*
9. **Webhook Receipt & Scoring**: Webhook processes message → AI classifies `EXCHANGE_ENQUIRY` + `VISIT_INTENT` → Lead score jumps to **85 (HOT)** → Grounded AI reply sent confirming exchange bonus!
10. **Hot Lead Action**: Go to Dashboard or Inbox. View Anirban Mukherjee under *Hot Leads Today*.
11. **Confirm Sale & Attribution**: Click *Confirm Sale* (₹49,999). Celebratory confetti fires, and Campaign Analytics attributes the ₹49,999 revenue directly to the campaign!
