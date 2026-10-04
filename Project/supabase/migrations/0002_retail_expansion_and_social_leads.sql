-- ==============================================================================
-- SHOPGROW AI - MIGRATION 0002: RETAIL EXPANSION & SOCIAL LEAD ENGINE
-- Supports generic retail (Mobile, Furniture, Appliances, Fashion, Jewellery, etc.)
-- Adds Social Lead Engine (Facebook/Instagram/Meta Ads) and Unified Multi-Channel Inbox
-- ==============================================================================

-- 1. NEW ENUMS
CREATE TYPE business_type AS ENUM (
    'MOBILE_ELECTRONICS',
    'FURNITURE',
    'HOME_APPLIANCES',
    'FASHION_CLOTHING',
    'JEWELLERY',
    'OPTICAL',
    'GENERAL_RETAIL',
    'OTHER'
);

CREATE TYPE subscription_plan AS ENUM ('STARTER', 'GROWTH', 'PRO', 'MANAGED');

CREATE TYPE operating_mode AS ENUM ('SHOP_MANAGED', 'MANAGED_SERVICE');

CREATE TYPE lead_channel AS ENUM ('WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'WEBSITE', 'WALK_IN', 'MANUAL');

CREATE TYPE campaign_type AS ENUM (
    'NEW_PRODUCT_ARRIVAL',
    'NEW_COLLECTION',
    'PRODUCT_LAUNCH',
    'SEASONAL_OFFER',
    'EXCHANGE_CAMPAIGN',
    'CROSS_SELL',
    'UPSELL',
    'OLD_CUSTOMER_REACTIVATION',
    'CUSTOMER_ANNIVERSARY',
    'SERVICE_REMINDER',
    'FESTIVE_CAMPAIGN',
    'CLEARANCE_CAMPAIGN',
    'STORE_EVENT'
);

-- 2. EXTEND SHOPS TABLE (Non-destructive)
ALTER TABLE shops 
    ADD COLUMN IF NOT EXISTS business_type business_type DEFAULT 'MOBILE_ELECTRONICS',
    ADD COLUMN IF NOT EXISTS plan subscription_plan DEFAULT 'GROWTH',
    ADD COLUMN IF NOT EXISTS operating_mode operating_mode DEFAULT 'SHOP_MANAGED',
    ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{
        "enable_whatsapp": true,
        "enable_social_leads": true,
        "enable_facebook": true,
        "enable_instagram": true,
        "enable_ai_replies": true,
        "enable_managed_service": false,
        "enable_sales_tracking": true,
        "enable_inventory": true
    }'::jsonb;

-- 3. GENERIC PRODUCT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    business_type business_type NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_shop_category_slug UNIQUE (shop_id, slug)
);

-- 4. FLEXIBLE PRODUCT ATTRIBUTES DEFINITIONS
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    data_type VARCHAR(50) DEFAULT 'TEXT', -- TEXT, NUMBER, SELECT, BOOLEAN
    options JSONB DEFAULT '[]'::jsonb, -- e.g. ["Teak", "Sheesham", "Oak"] or ["Hydraulic", "Box"]
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EXTEND PRODUCTS TABLE FOR GENERIC ATTRIBUTES (Non-destructive)
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 6. EXTEND CUSTOMERS CRM (Non-destructive)
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'EXISTING_DATABASE',
    ADD COLUMN IF NOT EXISTS product_interests JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS past_enquiries JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS customer_lifetime_value NUMERIC(14, 2) DEFAULT 0.00;

-- 7. SOCIAL LEADS TABLE (Facebook, Instagram, Meta Ads)
CREATE TABLE IF NOT EXISTS social_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    channel lead_channel NOT NULL,
    source_post_id VARCHAR(100),
    source_comment_id VARCHAR(100),
    author_name VARCHAR(255) NOT NULL,
    author_id VARCHAR(100),
    content TEXT NOT NULL,
    intent lead_intent_enum DEFAULT 'OTHER',
    interest_level lead_interest_level DEFAULT 'WARM',
    public_reply_sent TEXT,
    private_reply_sent TEXT,
    converted_to_whatsapp BOOLEAN DEFAULT false,
    whatsapp_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. UNIFIED CONVERSATIONS & CHANNELS
ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS channel lead_channel DEFAULT 'WHATSAPP',
    ADD COLUMN IF NOT EXISTS source_reference VARCHAR(255);

ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS channel lead_channel DEFAULT 'WHATSAPP';

-- 9. AUDIT LOGGING TABLE (Managed Service & Governance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    actor_name VARCHAR(255) NOT NULL,
    actor_role user_role NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. RLS POLICIES FOR NEW TABLES
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_isolation_product_categories ON product_categories
    FOR ALL
    USING (shop_id = current_user_shop_id() OR current_setting('request.jwt.claim.role', true) = 'SUPER_ADMIN')
    WITH CHECK (shop_id = current_user_shop_id());

CREATE POLICY shop_isolation_product_attributes ON product_attributes
    FOR ALL
    USING (shop_id = current_user_shop_id() OR current_setting('request.jwt.claim.role', true) = 'SUPER_ADMIN')
    WITH CHECK (shop_id = current_user_shop_id());

CREATE POLICY shop_isolation_social_leads ON social_leads
    FOR ALL
    USING (shop_id = current_user_shop_id() OR current_setting('request.jwt.claim.role', true) = 'SUPER_ADMIN')
    WITH CHECK (shop_id = current_user_shop_id());

CREATE POLICY shop_isolation_audit_logs ON audit_logs
    FOR ALL
    USING (shop_id = current_user_shop_id() OR current_setting('request.jwt.claim.role', true) = 'SUPER_ADMIN')
    WITH CHECK (shop_id = current_user_shop_id());
