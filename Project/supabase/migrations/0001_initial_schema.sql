-- ==============================================================================
-- SHOPGROW AI - PRODUCTION MULTI-TENANT DATABASE MIGRATION
-- Database: Supabase PostgreSQL (with Row Level Security)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'SHOP_OWNER', 'MANAGER', 'STAFF');
CREATE TYPE consent_type AS ENUM ('OPT_IN', 'OPT_OUT');
CREATE TYPE consent_source AS ENUM ('QR', 'WEBSITE_FORM', 'IN_STORE', 'IMPORTED_VERIFIED_CONSENT');
CREATE TYPE campaign_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'SENDING', 'COMPLETED', 'PAUSED', 'CANCELLED');
CREATE TYPE message_direction AS ENUM ('OUTBOUND', 'INBOUND');
CREATE TYPE message_delivery_status AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');
CREATE TYPE lead_interest_level AS ENUM ('COLD', 'WARM', 'HOT');
CREATE TYPE lead_intent_enum AS ENUM (
    'PRICE_ENQUIRY', 'EXCHANGE_ENQUIRY', 'EMI_ENQUIRY', 'STOCK_ENQUIRY', 
    'STORE_LOCATION', 'PRODUCT_COMPARISON', 'INTERESTED', 'VISIT_INTENT', 
    'PURCHASE_INTENT', 'NOT_INTERESTED', 'UNSUBSCRIBE', 'NEEDS_HUMAN', 'OTHER'
);
CREATE TYPE integration_status AS ENUM ('NOT_CONNECTED', 'CONNECTED', 'CONFIGURATION_ERROR');
CREATE TYPE lead_status_enum AS ENUM ('NEW', 'CONTACTED', 'ENGAGED', 'STORE_VISIT', 'CONVERTED', 'LOST');

-- 2. SHOPS TABLE (Multi-Tenant Root)
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address TEXT,
    city VARCHAR(100) DEFAULT 'Kolkata',
    state VARCHAR(100) DEFAULT 'West Bengal',
    pincode VARCHAR(20),
    active_status BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30),
    role user_role NOT NULL DEFAULT 'STAFF',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone_e164 VARCHAR(20) NOT NULL,
    language VARCHAR(20) DEFAULT 'bn', -- bn = Bengali, en = English, hi = Hindi
    location VARCHAR(255),
    product_category VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(200),
    purchase_date DATE,
    purchase_value NUMERIC(12, 2) DEFAULT 0.00,
    tags JSONB DEFAULT '[]'::jsonb,
    whatsapp_opt_in BOOLEAN DEFAULT false,
    opt_in_at TIMESTAMPTZ,
    opt_in_source consent_source,
    do_not_contact BOOLEAN DEFAULT false,
    last_campaign_at TIMESTAMPTZ,
    last_reply_at TIMESTAMPTZ,
    engagement_score INTEGER DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 100),
    lead_status lead_status_enum DEFAULT 'NEW',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_shop_customer_phone UNIQUE (shop_id, phone_e164)
);

-- 5. CUSTOMER IMPORTS AUDIT TABLE
CREATE TABLE IF NOT EXISTS customer_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    valid_count INTEGER NOT NULL DEFAULT 0,
    duplicate_count INTEGER NOT NULL DEFAULT 0,
    invalid_count INTEGER NOT NULL DEFAULT 0,
    no_consent_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONSENT AUDIT TRAIL TABLE
CREATE TABLE IF NOT EXISTS consent_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type consent_type NOT NULL,
    source consent_source NOT NULL,
    evidence_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    mrp NUMERIC(12, 2) NOT NULL,
    cost_price NUMERIC(12, 2),
    stock_quantity INTEGER DEFAULT 0,
    specs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. OFFERS TABLE (Truth anchor for AI generation)
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    mrp NUMERIC(12, 2) NOT NULL,
    offer_price NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(5, 2) DEFAULT 0.00,
    exchange_offer TEXT,
    emi_information TEXT,
    cashback TEXT,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    stock_status VARCHAR(50) DEFAULT 'IN_STOCK',
    terms TEXT,
    image TEXT,
    active_status BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offers(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    target_segment_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    message_template TEXT NOT NULL,
    language VARCHAR(20) DEFAULT 'bn',
    status campaign_status DEFAULT 'DRAFT',
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    total_audience INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    replied_count INTEGER DEFAULT 0,
    hot_leads_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    attributed_revenue NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CAMPAIGN SEGMENTS BREAKDOWN
CREATE TABLE IF NOT EXISTS campaign_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rules JSONB NOT NULL,
    matched_count INTEGER DEFAULT 0,
    excluded_no_consent INTEGER DEFAULT 0,
    excluded_frequency INTEGER DEFAULT 0,
    final_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CAMPAIGN RECIPIENTS LOG
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    phone_e164 VARCHAR(20) NOT NULL,
    provider_message_id VARCHAR(255),
    status message_delivery_status DEFAULT 'PENDING',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED, HANDOFF
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_human_takeover BOOLEAN DEFAULT false,
    lead_score INTEGER DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),
    intent lead_intent_enum DEFAULT 'OTHER',
    interest_level lead_interest_level DEFAULT 'COLD',
    interested_product VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    direction message_direction NOT NULL,
    sender_phone VARCHAR(30) NOT NULL,
    recipient_phone VARCHAR(30) NOT NULL,
    provider_message_id VARCHAR(255),
    body TEXT NOT NULL,
    status message_delivery_status DEFAULT 'SENT',
    ai_generated BOOLEAN DEFAULT false,
    intent_classified lead_intent_enum,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    product VARCHAR(255),
    intent lead_intent_enum NOT NULL,
    interest_level lead_interest_level NOT NULL DEFAULT 'WARM',
    lead_score INTEGER NOT NULL DEFAULT 50 CHECK (lead_score BETWEEN 0 AND 100),
    recommended_action TEXT,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, VISITED, WON, LOST, FOLLOW_UP
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. SALES & ATTRIBUTION TABLE
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    product VARCHAR(255) NOT NULL,
    sale_amount NUMERIC(12, 2) NOT NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    staff VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. AI EVENTS & TOKEN AUDIT
CREATE TABLE IF NOT EXISTS ai_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- INTENT_CLASSIFICATION, COPY_GENERATION, ANSWER_GROUNDING
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    confidence NUMERIC(4, 3),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. USAGE LOGS TABLE
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. SHOP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS shop_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID UNIQUE NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    daily_campaign_limit INTEGER DEFAULT 500,
    contact_frequency_days INTEGER DEFAULT 14,
    quiet_hours_start TIME DEFAULT '21:00:00',
    quiet_hours_end TIME DEFAULT '09:00:00',
    default_language VARCHAR(20) DEFAULT 'bn',
    faqs JSONB DEFAULT '[
        {"q": "What are the store hours?", "a": "We are open Monday to Saturday, 10:00 AM to 9:00 PM. Sunday open 11:00 AM to 6:00 PM."},
        {"q": "Where is the shop located?", "a": "Saha Electronics, 142 Bipin Bihari Ganguly Street, Bowbazar, Kolkata 700012."},
        {"q": "Do you offer exchange on old phones?", "a": "Yes, we offer up to ₹15,000 spot exchange bonus depending on the phone condition and brand."},
        {"q": "Is 0% EMI available?", "a": "Yes! Bajaj Finserv, HDFC, and Credit Card No-Cost EMI are available for 3, 6, and 9 months."}
    ]'::jsonb,
    ai_guardrails TEXT DEFAULT 'Strictly never invent pricing, trade-in value, stock guarantee, or warranty. Only quote from verified shop offers.',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. INTEGRATION SETTINGS TABLE
CREATE TABLE IF NOT EXISTS integration_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID UNIQUE NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    provider VARCHAR(50) DEFAULT 'MOCK', -- 'META_CLOUD_API' or 'MOCK'
    phone_number_id VARCHAR(100),
    waba_id VARCHAR(100),
    access_token TEXT,
    webhook_secret VARCHAR(100),
    status integration_status DEFAULT 'CONNECTED',
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY SPEED & ISOLATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_shop_phone ON customers(shop_id, phone_e164);
CREATE INDEX IF NOT EXISTS idx_customers_brand_date ON customers(shop_id, brand, purchase_date);
CREATE INDEX IF NOT EXISTS idx_customers_lead_status ON customers(shop_id, lead_status);
CREATE INDEX IF NOT EXISTS idx_offers_shop_active ON offers(shop_id, active_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_shop_status ON campaigns(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_shop_customer ON conversations(shop_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_leads_shop_score ON leads(shop_id, lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_sales_campaign ON sales(campaign_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to extract shop_id from Supabase JWT auth context
CREATE OR REPLACE FUNCTION current_user_shop_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('request.jwt.claim.shop_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Tenant Isolation RLS Policies example:
CREATE POLICY shop_isolation_customers ON customers
    FOR ALL
    USING (shop_id = current_user_shop_id() OR current_setting('request.jwt.claim.role', true) = 'SUPER_ADMIN')
    WITH CHECK (shop_id = current_user_shop_id());

CREATE POLICY shop_isolation_offers ON offers
    FOR ALL
    USING (shop_id = current_user_shop_id() OR current_setting('request.jwt.claim.role', true) = 'SUPER_ADMIN')
    WITH CHECK (shop_id = current_user_shop_id());

CREATE POLICY shop_isolation_campaigns ON campaigns
    FOR ALL
    USING (shop_id = current_user_shop_id() OR current_setting('request.jwt.claim.role', true) = 'SUPER_ADMIN')
    WITH CHECK (shop_id = current_user_shop_id());

CREATE POLICY shop_isolation_conversations ON conversations
    FOR ALL
    USING (shop_id = current_user_shop_id() OR current_setting('request.jwt.claim.role', true) = 'SUPER_ADMIN')
    WITH CHECK (shop_id = current_user_shop_id());

CREATE POLICY shop_isolation_messages ON messages
    FOR ALL
    USING (shop_id = current_user_shop_id() OR current_setting('request.jwt.claim.role', true) = 'SUPER_ADMIN')
    WITH CHECK (shop_id = current_user_shop_id());

CREATE POLICY shop_isolation_leads ON leads
    FOR ALL
    USING (shop_id = current_user_shop_id() OR current_setting('request.jwt.claim.role', true) = 'SUPER_ADMIN')
    WITH CHECK (shop_id = current_user_shop_id());

CREATE POLICY shop_isolation_sales ON sales
    FOR ALL
    USING (shop_id = current_user_shop_id() OR current_setting('request.jwt.claim.role', true) = 'SUPER_ADMIN')
    WITH CHECK (shop_id = current_user_shop_id());
