export type UserRole = 'SUPER_ADMIN' | 'SHOP_OWNER' | 'MANAGER' | 'STAFF';

export type BusinessType = 
  | 'MOBILE_ELECTRONICS'
  | 'FURNITURE'
  | 'HOME_APPLIANCES'
  | 'FASHION_CLOTHING'
  | 'JEWELLERY'
  | 'OPTICAL'
  | 'GENERAL_RETAIL'
  | 'OTHER';

export type SubscriptionPlan = 'STARTER' | 'GROWTH' | 'PRO' | 'MANAGED';
export type OperatingMode = 'SHOP_MANAGED' | 'MANAGED_SERVICE';

export type LeadChannel = 'WHATSAPP' | 'FACEBOOK' | 'INSTAGRAM' | 'WEBSITE' | 'WALK_IN' | 'MANUAL';

export type SourceChannel = 
  | 'Facebook' 
  | 'Instagram' 
  | 'WhatsApp' 
  | 'Messenger' 
  | 'Website' 
  | 'QR' 
  | 'Existing Database' 
  | 'Walk-in' 
  | 'Referral' 
  | 'Manual';

export type AudienceMode = 
  | 'AI_RECOMMENDED'
  | 'SAME_CATEGORY'
  | 'CROSS_CATEGORY'
  | 'ALL_ELIGIBLE'
  | 'CUSTOM_SEGMENT'
  | 'MANUAL_SELECTION';

export type CampaignDispatchState = 
  | 'IDLE'
  | 'PREPARING'
  | 'VALIDATING_AUDIENCE'
  | 'QUEUED'
  | 'SENDING'
  | 'COMPLETED'
  | 'PARTIALLY_FAILED'
  | 'FAILED';

export interface ShopInvite {
  id: string;
  shop_id: string;
  shop_name: string;
  email: string;
  invite_token: string;
  role: UserRole;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  created_at: string;
  expires_at: string;
}

export type ConsentType = 'OPT_IN' | 'OPT_OUT';
export type ConsentSource = 'QR' | 'WEBSITE_FORM' | 'IN_STORE' | 'IMPORTED_VERIFIED_CONSENT';

export type CampaignStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'SCHEDULED' 
  | 'SENDING' 
  | 'COMPLETED' 
  | 'PAUSED' 
  | 'CANCELLED';

export type CampaignType = 
  | 'NEW_PRODUCT_ARRIVAL'
  | 'NEW_COLLECTION'
  | 'PRODUCT_LAUNCH'
  | 'SEASONAL_OFFER'
  | 'EXCHANGE_CAMPAIGN'
  | 'CROSS_SELL'
  | 'UPSELL'
  | 'OLD_CUSTOMER_REACTIVATION'
  | 'CUSTOMER_ANNIVERSARY'
  | 'SERVICE_REMINDER'
  | 'FESTIVE_CAMPAIGN'
  | 'CLEARANCE_CAMPAIGN'
  | 'STORE_EVENT';

export type MessageDirection = 'OUTBOUND' | 'INBOUND';
export type MessageDeliveryStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export type LeadInterestLevel = 'COLD' | 'WARM' | 'HOT';

export type LeadIntent = 
  | 'PRICE_ENQUIRY'
  | 'EXCHANGE_ENQUIRY'
  | 'EMI_ENQUIRY'
  | 'STOCK_ENQUIRY'
  | 'STORE_LOCATION'
  | 'PRODUCT_COMPARISON'
  | 'INTERESTED'
  | 'VISIT_INTENT'
  | 'PURCHASE_INTENT'
  | 'NOT_INTERESTED'
  | 'UNSUBSCRIBE'
  | 'NEEDS_HUMAN'
  | 'OCCASION_GREETING'
  | 'OCCASION_REPLY'
  | 'OTHER';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'ENGAGED' | 'STORE_VISIT' | 'CONVERTED' | 'LOST';

export type CustomerSource = 
  | 'EXISTING_DATABASE'
  | 'WALK_IN'
  | 'FACEBOOK_AD'
  | 'FACEBOOK_COMMENT'
  | 'INSTAGRAM'
  | 'WEBSITE'
  | 'QR'
  | 'REFERRAL'
  | 'WHATSAPP'
  | 'MANUAL_ENTRY'
  | 'GOOGLE_LEAD'
  | 'OTHER';

export interface ShopFeatureFlags {
  enable_whatsapp: boolean;
  enable_social_leads: boolean;
  enable_facebook: boolean;
  enable_instagram: boolean;
  enable_ai_replies: boolean;
  enable_managed_service: boolean;
  enable_sales_tracking: boolean;
  enable_inventory: boolean;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  business_hours: string;
  business_type: BusinessType;
  plan: SubscriptionPlan;
  operating_mode: OperatingMode;
  feature_flags?: ShopFeatureFlags;
  active_status: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  shop_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  created_at: string;
}

export interface Customer {
  id: string;
  shop_id: string;
  full_name: string;
  phone_e164: string;
  language: string;
  location: string;
  source?: CustomerSource;
  product_category: string;
  brand: string;
  model: string;
  purchase_date: string;
  purchase_value: number;
  product_interests?: string[];
  past_enquiries?: Array<{ date: string; channel: LeadChannel; query: string; product: string }>;
  customer_lifetime_value?: number;
  tags: string[];
  whatsapp_opt_in: boolean;
  opt_in_at: string | null;
  opt_in_source: ConsentSource | null;
  do_not_contact: boolean;
  last_campaign_at: string | null;
  last_reply_at: string | null;
  engagement_score: number;
  lead_status: LeadStatus;
  budget_range?: string;
  preferred_brand?: string;
  last_discussed_product?: string;
  social_user_id?: string;
  social_platform?: 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP';
  known_attributes?: Record<string, any>;
  // Occasion & Lifecycle Data
  date_of_birth?: string;
  wedding_anniversary?: string;
  customer_since_date?: string;
  first_purchase_date?: string;
  preferred_language?: string;
  preferred_channel?: 'WHATSAPP' | 'SMS';
  last_birthday_message_at?: string | null;
  last_anniversary_message_at?: string | null;
  last_purchase_anniversary_message_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerMemoryContext {
  known_name?: string;
  is_name_known: boolean;
  known_location?: string;
  is_location_known: boolean;
  known_budget?: string;
  is_budget_known: boolean;
  last_discussed_product?: string;
  purchase_history_summary?: string;
  has_active_consent: boolean;
  is_opted_out: boolean;
  recent_messages?: Array<{ direction: 'INBOUND' | 'OUTBOUND'; text: string; time: string }>;
  identity_conflict?: {
    detected: boolean;
    previous_name: string;
    new_name: string;
  };
}

export interface CustomerImport {
  id: string;
  shop_id: string;
  filename: string;
  total_rows: number;
  valid_count: number;
  duplicate_count: number;
  invalid_count: number;
  no_consent_count: number;
  status: string;
  created_at: string;
}

export interface ConsentEvent {
  id: string;
  shop_id: string;
  customer_id: string;
  type: ConsentType;
  source: ConsentSource;
  evidence_reference: string;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  shop_id: string;
  name: string;
  slug: string;
  business_type: BusinessType;
  description?: string;
  created_at: string;
}

export interface ProductAttribute {
  id: string;
  shop_id: string;
  category_id?: string;
  name: string;
  data_type: 'TEXT' | 'NUMBER' | 'SELECT' | 'BOOLEAN';
  options?: string[];
  created_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  category: string;
  category_id?: string;
  sku?: string;
  brand: string;
  model: string;
  mrp: number;
  cost_price: number;
  stock_quantity: number;
  specs: Record<string, any>;
  custom_attributes?: Record<string, any>;
  images?: string[];
  is_new_arrival?: boolean;
  is_featured?: boolean;
  created_at: string;
}

export interface Offer {
  id: string;
  shop_id: string;
  title: string;
  product_id?: string;
  brand: string;
  model: string;
  mrp: number;
  offer_price: number;
  discount: number;
  exchange_offer: string;
  emi_information: string;
  cashback: string;
  valid_from: string;
  valid_until: string;
  stock_status: string;
  terms: string;
  image?: string;
  active_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  shop_id: string;
  offer_id?: string;
  product_id?: string;
  name: string;
  campaign_type?: CampaignType;
  audience_mode?: AudienceMode;
  custom_instruction?: string;
  target_segment_criteria: {
    brand?: string;
    category?: string;
    min_purchase_age_months?: number;
    min_clv?: number;
    consent_required: boolean;
    frequency_cooldown_days: number;
    reasoning?: string;
  };
  message_template: string;
  language: string;
  status: CampaignStatus;
  approved_by: string | null;
  approved_at: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  total_audience: number;
  delivered_count: number;
  replied_count: number;
  hot_leads_count: number;
  sales_count: number;
  attributed_revenue: number;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  shop_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  channel?: LeadChannel;
  source_reference?: string;
  last_message_at: string;
  status: 'ACTIVE' | 'RESOLVED' | 'HANDOFF';
  assigned_to: string | null;
  is_human_takeover: boolean;
  lead_score: number;
  intent: LeadIntent;
  interest_level: LeadInterestLevel;
  interested_product: string;
  context_product?: string;
  memory_snapshot?: Record<string, any>;
  recommended_action: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  shop_id: string;
  conversation_id: string;
  direction: MessageDirection;
  channel?: LeadChannel;
  sender_phone: string;
  recipient_phone: string;
  provider_message_id: string;
  body: string;
  status: MessageDeliveryStatus;
  ai_generated: boolean;
  intent_classified?: LeadIntent;
  created_at: string;
}

export interface Lead {
  id: string;
  shop_id: string;
  customer_id: string;
  conversation_id?: string;
  campaign_id?: string;
  channel?: LeadChannel;
  source_channel?: SourceChannel;
  source_type?: string;
  source_campaign?: string;
  source_post?: string;
  source_ad?: string;
  source_comment?: string;
  source_conversation?: string;
  first_touch_source?: string;
  last_touch_source?: string;
  customer_name: string;
  customer_phone: string;
  product: string;
  interested_product?: string;
  intent: LeadIntent;
  interest_level: LeadInterestLevel;
  lead_score: number;
  recommended_action: string;
  status: 'OPEN' | 'VISITED' | 'WON' | 'LOST' | 'FOLLOW_UP';
  lead_status?: string;
  sale_id?: string;
  attributed_revenue?: number;
  last_message: string;
  created_at: string;
  updated_at: string;
}

export interface SocialLead {
  id: string;
  shop_id: string;
  channel: LeadChannel;
  source_post_id?: string;
  source_comment_id?: string;
  author_name: string;
  author_id?: string;
  content: string;
  intent: LeadIntent;
  interest_level: LeadInterestLevel;
  public_reply_sent?: string;
  private_reply_sent?: string;
  converted_to_whatsapp: boolean;
  whatsapp_phone?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  shop_id: string;
  customer_id: string;
  customer_name: string;
  campaign_id?: string;
  campaign_name?: string;
  lead_id?: string;
  source_channel?: SourceChannel;
  source_type?: string;
  product: string;
  sale_amount: number;
  sale_date: string;
  staff: string;
  notes: string;
  occasion_type?: OccasionType;
  coupon_code?: string;
  discount_amount?: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  shop_id: string;
  actor_name: string;
  actor_role: UserRole;
  action: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface ShopSettings {
  id: string;
  shop_id: string;
  daily_campaign_limit: number;
  contact_frequency_days: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  default_language: string;
  faqs: Array<{ q: string; a: string }>;
  ai_guardrails: string;
}

export interface IntegrationSettings {
  id: string;
  shop_id: string;
  provider: 'MOCK' | 'META_CLOUD_API';
  phone_number_id: string;
  waba_id: string;
  access_token: string;
  webhook_secret: string;
  facebook_page_id?: string;
  instagram_account_id?: string;
  social_access_token?: string;
  status: 'NOT_CONNECTED' | 'CONNECTED' | 'CONFIGURATION_ERROR';
  last_sync_at: string;
}

export interface SystemTraceEvent {
  id: string;
  timestamp: string;
  name: string;
  shop_id: string;
  shop_name?: string;
  customer_id?: string;
  customer_name?: string;
  source: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  payload?: any;
  error?: string;
}

export type MetaSocialChannel = 'FACEBOOK_PAGE' | 'INSTAGRAM' | 'AD_ACCOUNT' | 'LEAD_FORMS' | 'MESSENGER';
export type MetaConnectionStatus = 'LIVE_CONNECTED' | 'MOCK_MODE' | 'NOT_CONNECTED';

export interface MetaIntegrationCard {
  channel: MetaSocialChannel;
  title: string;
  description: string;
  status: MetaConnectionStatus;
  account_name?: string;
  account_id?: string;
  token_status: 'VALID' | 'EXPIRED' | 'MISSING' | 'MOCK_VALID';
  permissions: string[];
  webhook_status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  last_event_at?: string;
  last_error?: string;
  oauth_url?: string;
}

export interface MetaSocialIntegrationSettings {
  shop_id: string;
  facebook_page: MetaIntegrationCard;
  instagram_account: MetaIntegrationCard;
  meta_ad_account: MetaIntegrationCard;
  meta_lead_forms: MetaIntegrationCard;
  messenger: MetaIntegrationCard;
  updated_at: string;
}

export interface SocialCommentRecord {
  id: string;
  shop_id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM';
  page_id?: string;
  account_id?: string;
  post_id: string;
  media_id?: string;
  comment_id: string;
  parent_comment_id?: string;
  platform_user_id: string;
  user_display_name: string;
  comment_text: string;
  timestamp: string;
  campaign_id?: string;
  ad_id?: string;
  processing_status: 'PROCESSED' | 'DUPLICATE_IGNORED' | 'FAILED';
  detected_intent?: string;
  lead_id?: string;
  customer_id?: string;
}

export interface CustomerExternalIdentity {
  id: string;
  customer_id: string;
  shop_id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP';
  external_user_id: string;
  display_name?: string;
  created_at: string;
}

// ============================================================================
// OCCASION AUTOMATION & OFFERS TYPES
// ============================================================================
export type OccasionType = 
  | 'BIRTHDAY' 
  | 'WEDDING_ANNIVERSARY' 
  | 'PURCHASE_ANNIVERSARY' 
  | 'RELATIONSHIP_ANNIVERSARY' 
  | 'CUSTOM_OCCASION';

export type OccasionDiscountType = 
  | 'PERCENTAGE' 
  | 'FLAT_AMOUNT' 
  | 'CUSTOM' 
  | 'FREE_GIFT' 
  | 'PRODUCT_SPECIFIC';

export type OccasionValidityOption = 
  | 'OCCASION_DAY_ONLY' 
  | '3_DAYS' 
  | '7_DAYS' 
  | 'CUSTOM_RANGE';

export interface OccasionSpecialOfferConfig {
  enabled: boolean;
  offer_name: string;
  discount_type: OccasionDiscountType;
  discount_value: number;
  applicable_product?: string;
  applicable_category?: string;
  min_purchase_amount?: number;
  max_discount?: number;
  coupon_code: string;
  validity_option: OccasionValidityOption;
  valid_from?: string;
  valid_until?: string;
  terms_conditions: string;
  store_visit_required: boolean;
  is_paused: boolean;
}

export interface OccasionAutomationSettings {
  id: string;
  shop_id: string;
  birthday_enabled: boolean;
  wedding_anniversary_enabled: boolean;
  purchase_anniversary_enabled: boolean;
  relationship_anniversary_enabled: boolean;
  channel: 'WHATSAPP' | 'SMS' | 'AUTO';
  send_time: string; // e.g. "10:00"
  send_days_in_advance: number; // 0 for exact day
  default_language: 'bn' | 'en';
  template_birthday?: string;
  template_anniversary?: string;
  template_purchase_anniversary?: string;
  offers: {
    birthday: OccasionSpecialOfferConfig;
    wedding_anniversary: OccasionSpecialOfferConfig;
    purchase_anniversary: OccasionSpecialOfferConfig;
  };
  updated_at: string;
}

export interface OccasionLog {
  id: string;
  shop_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  occasion_type: OccasionType;
  year: number;
  idempotency_key: string; // shop_id + customer_id + occasion_type + year
  channel: 'WHATSAPP' | 'SMS';
  message: string;
  offer_included: boolean;
  coupon_code?: string;
  discount_details?: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'REPLIED' | 'REDEEMED' | 'SKIPPED';
  sent_at: string;
  delivered_at?: string;
  replied_at?: string;
  redeemed_at?: string;
  sale_id?: string;
  attributed_revenue?: number;
}

export type SuperAdminStatus = 'ACTIVE' | 'REVOKED' | 'SUSPENDED';

export interface SuperAdminRecord {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  status: SuperAdminStatus;
  granted_by: string;
  granted_at: string;
  revoked_at?: string;
  created_at: string;
  last_login_at?: string;
}

export type BrandingBackgroundType = 'DEFAULT_WHITE' | 'CUSTOM_COLOR' | 'CUSTOM_IMAGE';
export type BrandingDisplayOption = 'cover' | 'contain' | 'center' | 'top' | 'no-repeat';
export type BrandingOverlayType = 'NONE' | 'LIGHT' | 'DARK';

export interface ShopBranding {
  shop_id: string;
  bg_type: BrandingBackgroundType;
  bg_color: string;
  bg_image_url?: string;
  bg_display: BrandingDisplayOption;
  overlay_type: BrandingOverlayType;
  overlay_strength: number;
  updated_at: string;
}


