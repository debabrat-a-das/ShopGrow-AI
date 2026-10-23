import { 
  Shop, Profile, Customer, Product, Offer, Campaign, CampaignRecipient, 
  Conversation, Message, Lead, Sale, ShopSettings, IntegrationSettings, ConsentEvent, CustomerImport,
  ProductCategory, ProductAttribute, AuditLog, SocialLead, BusinessType, SystemTraceEvent,
  MetaSocialIntegrationSettings, MetaIntegrationCard, MetaSocialChannel, SocialCommentRecord, CustomerExternalIdentity,
  OccasionAutomationSettings, OccasionLog, OccasionType, OccasionSpecialOfferConfig,
  SuperAdminRecord, SuperAdminStatus, ShopBranding
} from '../types.js';
import { v4 as uuidv4 } from 'uuid';
import { PasswordService } from '../services/passwordService.js';

export class AppDataStore {
  shops: Shop[] = [];
  profiles: Profile[] = [];
  superAdmins: SuperAdminRecord[] = [];
  shopBranding: Record<string, ShopBranding> = {};
  customers: Customer[] = [];
  customerImports: CustomerImport[] = [];
  consentEvents: ConsentEvent[] = [];
  productCategories: ProductCategory[] = [];
  productAttributes: ProductAttribute[] = [];
  products: Product[] = [];
  offers: Offer[] = [];
  campaigns: Campaign[] = [];
  campaignRecipients: CampaignRecipient[] = [];
  conversations: Conversation[] = [];
  messages: Message[] = [];
  leads: Lead[] = [];
  socialLeads: SocialLead[] = [];
  sales: Sale[] = [];
  auditLogs: AuditLog[] = [];
  systemEvents: SystemTraceEvent[] = [];
  shopSettings: Record<string, ShopSettings> = {};
  integrationSettings: Record<string, IntegrationSettings> = {};
  metaIntegrations: Record<string, MetaSocialIntegrationSettings> = {};
  occasionSettings: Record<string, OccasionAutomationSettings> = {};
  occasionLogs: OccasionLog[] = [];
  socialComments: SocialCommentRecord[] = [];
  customerExternalIdentities: CustomerExternalIdentity[] = [];
  processedCommentKeys: Set<string> = new Set<string>();

  constructor() {
    this.seedSuperAdmins();
    this.seedDemoShop();
    this.seedFurnitureShop();
    this.seedMetaIntegrations();
    this.seedDefaultBrandings();
    this.seedInitialSystemTraces();
  }

  logSystemEvent(event: {
    name: string;
    shop_id: string;
    customer_id?: string;
    customer_name?: string;
    source: string;
    status?: 'SUCCESS' | 'WARNING' | 'FAILED';
    payload?: any;
    error?: string;
  }) {
    const shop = this.getShop(event.shop_id);
    const trace: SystemTraceEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      name: event.name,
      shop_id: event.shop_id,
      shop_name: shop?.name || event.shop_id,
      customer_id: event.customer_id,
      customer_name: event.customer_name,
      source: event.source,
      status: event.status || 'SUCCESS',
      payload: event.payload,
      error: event.error
    };
    this.systemEvents.unshift(trace);
    if (this.systemEvents.length > 500) {
      this.systemEvents.pop();
    }
    return trace;
  }

  seedInitialSystemTraces() {
    this.logSystemEvent({
      name: 'System Boot & Store Initialization',
      shop_id: 'shop-saha-electronics-001',
      source: 'SYSTEM_KERNEL',
      status: 'SUCCESS',
      payload: { mode: 'MOCK_SANDBOX_ACTIVE', shops_loaded: 2 }
    });
    this.logSystemEvent({
      name: 'Tenant RLS Context Bound',
      shop_id: 'shop-saha-electronics-001',
      source: 'SECURITY_ENGINE',
      status: 'SUCCESS',
      payload: { tenant_isolation: 'STRICT_ROW_LEVEL_SECURITY' }
    });
  }

  logAuditAction(shopId: string, actorName: string, actorRole: any, action: string, details: Record<string, any>) {
    const log: AuditLog = {
      id: uuidv4(),
      shop_id: shopId,
      actor_name: actorName,
      actor_role: actorRole,
      action,
      details,
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    return log;
  }

  // ============================================================================
  // SHOP 1: SAHA ELECTRONICS (Mobile & Electronics) - 100% Preserved
  // ============================================================================
  seedDemoShop() {
    const shopId = 'shop-saha-electronics-001';
    const ownerId = 'profile-subhasish-saha-001';

    const shop: Shop = {
      id: shopId,
      name: 'Saha Electronics',
      slug: 'saha-electronics',
      phone: '+919830012345',
      address: '142 Bipin Bihari Ganguly Street, Bowbazar',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700012',
      business_hours: 'Mon-Sat: 10:00 AM - 9:00 PM | Sun: 11:00 AM - 6:00 PM',
      business_type: 'MOBILE_ELECTRONICS',
      plan: 'GROWTH',
      operating_mode: 'SHOP_MANAGED',
      feature_flags: {
        enable_whatsapp: true,
        enable_social_leads: true,
        enable_facebook: true,
        enable_instagram: true,
        enable_ai_replies: true,
        enable_managed_service: true,
        enable_sales_tracking: true,
        enable_inventory: true
      },
      active_status: true,
      created_at: new Date('2024-01-10').toISOString()
    };
    this.shops.push(shop);

    // Profiles
    this.profiles.push(
      {
        id: ownerId,
        shop_id: shopId,
        full_name: 'Subhasish Saha',
        email: 'owner@sahaelectronics.com',
        phone: '+919830012345',
        role: 'SHOP_OWNER',
        created_at: new Date('2024-01-10').toISOString()
      },
      {
        id: 'profile-rajesh-manager-002',
        shop_id: shopId,
        full_name: 'Rajesh Mondal',
        email: 'rajesh@sahaelectronics.com',
        phone: '+919830099887',
        role: 'MANAGER',
        created_at: new Date('2024-02-01').toISOString()
      },
      {
        id: 'profile-priya-staff-003',
        shop_id: shopId,
        full_name: 'Priya Das',
        email: 'priya@sahaelectronics.com',
        phone: '+919830055443',
        role: 'STAFF',
        created_at: new Date('2024-03-01').toISOString()
      },
      {
        id: 'profile-super-admin-000',
        shop_id: '',
        full_name: 'Antigravity Super Admin',
        email: 'admin@shopgrow.ai',
        phone: '+919830000000',
        role: 'SUPER_ADMIN',
        created_at: new Date('2024-01-01').toISOString()
      }
    );

    // Categories
    const catSmartphones: ProductCategory = {
      id: 'cat-smartphones-01',
      shop_id: shopId,
      name: 'Smartphones',
      slug: 'smartphones',
      business_type: 'MOBILE_ELECTRONICS',
      description: '5G Android and iOS smartphones',
      created_at: new Date().toISOString()
    };
    const catTV: ProductCategory = {
      id: 'cat-tv-02',
      shop_id: shopId,
      name: 'Smart Televisions',
      slug: 'smart-tv',
      business_type: 'MOBILE_ELECTRONICS',
      description: '4K UHD Smart WebOS & Google TVs',
      created_at: new Date().toISOString()
    };
    this.productCategories.push(catSmartphones, catTV);

    // Settings
    this.shopSettings[shopId] = {
      id: uuidv4(),
      shop_id: shopId,
      daily_campaign_limit: 500,
      contact_frequency_days: 14,
      quiet_hours_start: '21:00:00',
      quiet_hours_end: '09:00:00',
      default_language: 'bn',
      faqs: [
        { q: 'What are your store hours?', a: 'We are open Monday to Saturday, 10:00 AM to 9:00 PM. Sunday 11:00 AM to 6:00 PM.' },
        { q: 'Where is Saha Electronics located?', a: '142 Bipin Bihari Ganguly Street, Bowbazar, Kolkata 700012, near Sealdah station.' },
        { q: 'Do you offer exchange on old smartphones?', a: 'Yes! We give an extra ₹6,000 spot exchange bonus over market valuation with box & bill.' },
        { q: 'Which finance/EMI partners are available?', a: 'Bajaj Finserv, HDFC Bank, ICICI Bank 0% No-Cost EMI up to 9 months.' }
      ],
      ai_guardrails: 'Strictly quote stored offer pricing and exchange terms only. Escalate unverified queries to staff.'
    };

    this.integrationSettings[shopId] = {
      id: uuidv4(),
      shop_id: shopId,
      provider: 'MOCK',
      phone_number_id: '109823485764832',
      waba_id: '928374619283746',
      access_token: 'EAAG9...MOCK_META_ACCESS_TOKEN...',
      webhook_secret: 'shopgrow_whsec_saha_2026',
      facebook_page_id: 'page_sahaelectronics_kolkata',
      instagram_account_id: 'ig_sahaelectronics',
      status: 'CONNECTED',
      last_sync_at: new Date().toISOString()
    };

    // Automated Occasion Settings & Backend-Controlled Special Offers
    this.occasionSettings[shopId] = {
      id: uuidv4(),
      shop_id: shopId,
      birthday_enabled: true,
      wedding_anniversary_enabled: true,
      purchase_anniversary_enabled: true,
      relationship_anniversary_enabled: true,
      channel: 'WHATSAPP',
      send_time: '10:00',
      send_days_in_advance: 0,
      default_language: 'bn',
      template_birthday: 'শুভ জন্মদিন {name}! 🎉\nআপনার জন্মদিনের এই বিশেষ দিনে Saha Electronics-এর তরফ থেকে রইল আন্তরিক প্রীতি ও শুভেচ্ছা।',
      template_anniversary: 'আপনাদের বিবাহবার্ষিকীর অনেক অনেক শুভেচ্ছা ও অভিনন্দন 💐\nসুখে ও শান্তিতে ভরে উঠুক আপনাদের প্রতিটি দিন।\n— Saha Electronics',
      template_purchase_anniversary: '{name} বাবু/দিদি,\nআজ থেকে ঠিক {years} বছর আগে আপনি আমাদের দোকান থেকে {product} কিনেছিলেন। আমাদের পরিবারের সদস্য হওয়ার জন্য ধন্যবাদ!',
      offers: {
        birthday: {
          enabled: true,
          offer_name: 'Birthday Special 10% Discount',
          discount_type: 'PERCENTAGE',
          discount_value: 10,
          applicable_category: 'Mobile Accessories',
          min_purchase_amount: 500,
          max_discount: 1000,
          coupon_code: 'BDAY10',
          validity_option: '3_DAYS',
          terms_conditions: 'Applicable on in-store mobile accessories purchase with invoice.',
          store_visit_required: true,
          is_paused: false
        },
        wedding_anniversary: {
          enabled: true,
          offer_name: 'Anniversary Gift Voucher ₹500 Off',
          discount_type: 'FLAT_AMOUNT',
          discount_value: 500,
          applicable_category: 'Smartphones & Electronics',
          min_purchase_amount: 5000,
          max_discount: 500,
          coupon_code: 'ANNIV500',
          validity_option: '7_DAYS',
          terms_conditions: 'Valid on smart device upgrades and appliances.',
          store_visit_required: true,
          is_paused: false
        },
        purchase_anniversary: {
          enabled: false,
          offer_name: 'Loyalty Upgrade Benefit',
          discount_type: 'PERCENTAGE',
          discount_value: 5,
          applicable_category: 'All Products',
          coupon_code: 'LOYAL5',
          validity_option: '7_DAYS',
          terms_conditions: 'Show this message at billing counter.',
          store_visit_required: true,
          is_paused: false
        }
      },
      updated_at: new Date().toISOString()
    };

    // Products
    const prodS24: Product = {
      id: 'prod-samsung-s24fe',
      shop_id: shopId,
      category: 'Smartphones',
      category_id: catSmartphones.id,
      sku: 'SAM-S24FE-256',
      brand: 'Samsung',
      model: 'Galaxy S24 FE 5G (8GB/256GB)',
      mrp: 59999,
      cost_price: 49000,
      stock_quantity: 12,
      specs: { screen: '6.7" Dynamic AMOLED 2X', processor: 'Exynos 2400e', camera: '50MP OIS Triple Cam', battery: '4700 mAh' },
      custom_attributes: { storage: '256GB', ram: '8GB', color: 'Mint Green', connectivity: '5G' },
      images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80'],
      is_new_arrival: true,
      is_featured: true,
      created_at: new Date('2024-05-01').toISOString()
    };
    const prodA55: Product = {
      id: 'prod-samsung-a55',
      shop_id: shopId,
      category: 'Smartphones',
      category_id: catSmartphones.id,
      sku: 'SAM-A55-128',
      brand: 'Samsung',
      model: 'Galaxy A55 5G (8GB/128GB)',
      mrp: 39999,
      cost_price: 33000,
      stock_quantity: 18,
      specs: { screen: '6.6" Super AMOLED 120Hz', processor: 'Exynos 1480', camera: '50MP OIS' },
      custom_attributes: { storage: '128GB', ram: '8GB', color: 'Awesome Navy', connectivity: '5G' },
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'],
      is_new_arrival: false,
      is_featured: true,
      created_at: new Date('2024-05-01').toISOString()
    };
    const prodTV: Product = {
      id: 'prod-lg-tv43',
      shop_id: shopId,
      category: 'Smart Televisions',
      category_id: catTV.id,
      sku: 'LG-43UR7500-UHD',
      brand: 'LG',
      model: '43-inch 4K UHD Smart WebOS TV (43UR7500)',
      mrp: 34990,
      cost_price: 27500,
      stock_quantity: 8,
      specs: { display: '4K Ultra HD', audio: '20W AI Sound', os: 'webOS 23' },
      custom_attributes: { screen_size: '43 inch', resolution: '4K UHD', os: 'webOS' },
      images: ['https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600'],
      is_new_arrival: false,
      is_featured: false,
      created_at: new Date('2024-05-01').toISOString()
    };
    this.products.push(prodS24, prodA55, prodTV);

    // Offers
    const today = new Date();
    const validUntil = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const validFrom = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const offerSamsung: Offer = {
      id: 'offer-samsung-s24fe-festive',
      shop_id: shopId,
      title: 'Samsung Galaxy S24 FE Upgrade Carnival',
      product_id: prodS24.id,
      brand: 'Samsung',
      model: 'Galaxy S24 FE 5G',
      mrp: 59999,
      offer_price: 49999,
      discount: 16.67,
      exchange_offer: 'Up to ₹6,000 spot exchange bonus on older Galaxy M/A/S devices',
      emi_information: '0% No-Cost EMI starting at ₹4,166/month on Bajaj Finserv & HDFC',
      cashback: 'Flat ₹3,000 instant cashback on HDFC Bank Credit Cards',
      valid_from: validFrom,
      valid_until: validUntil,
      stock_status: 'IN_STOCK',
      terms: 'Exchange bonus requires working phone with IMEI verification. One offer per customer.',
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
      active_status: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const offerTV: Offer = {
      id: 'offer-lg-tv-smart',
      shop_id: shopId,
      title: 'LG 43" 4K Smart Cinema Offer',
      product_id: prodTV.id,
      brand: 'LG',
      model: '43-inch 4K UHD Smart TV',
      mrp: 34990,
      offer_price: 28990,
      discount: 17.15,
      exchange_offer: 'Flat ₹2,000 scrap exchange for any old CRT/LCD TV',
      emi_information: '6 months No-Cost EMI at ₹4,831/month',
      cashback: '₹1,500 cashback on ICICI Bank Cards',
      valid_from: validFrom,
      valid_until: validUntil,
      stock_status: 'IN_STOCK',
      terms: 'Free standard wall-mount installation within 24 hours in Kolkata.',
      image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80',
      active_status: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.offers.push(offerSamsung, offerTV);

    // Customers with Rich Occasion & Anniversary Lifecycle Data
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const currentMMDD = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const tomorrow = new Date(now.getTime() + 86400000);
    const tomorrowMMDD = `${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
    const in2Days = new Date(now.getTime() + 2 * 86400000);
    const in2DaysMMDD = `${pad(in2Days.getMonth() + 1)}-${pad(in2Days.getDate())}`;
    const in4Days = new Date(now.getTime() + 4 * 86400000);
    const in4DaysMMDD = `${pad(in4Days.getMonth() + 1)}-${pad(in4Days.getDate())}`;
    const oneYearAgoExact = `${now.getFullYear() - 1}-${currentMMDD}`;

    const seedCustomers = [
      { full_name: 'Anirban Mukherjee', phone: '+919830123456', brand: 'Samsung', model: 'Galaxy M31 128GB', date: '2023-04-12', val: 16499, consent: true, score: 85, status: 'ENGAGED' as const, source: 'IN_STORE' as const, dob: `1992-${currentMMDD}`, anniversary: '2019-11-20', customerSince: '2021-04-12' },
      { full_name: 'Debolina Roy', phone: '+919830234567', brand: 'Samsung', model: 'Galaxy A52s 5G', date: '2023-02-18', val: 29999, consent: true, score: 30, status: 'NEW' as const, source: 'IN_STORE' as const, dob: '1995-12-14', anniversary: `2018-${currentMMDD}`, customerSince: '2022-02-18' },
      { full_name: 'Subrata Ghosh', phone: '+919830345678', brand: 'Samsung', model: 'Galaxy S20 FE', date: oneYearAgoExact, val: 34999, consent: true, score: 90, status: 'STORE_VISIT' as const, source: 'IN_STORE' as const, dob: '1988-06-25', anniversary: '2015-02-10', customerSince: oneYearAgoExact },
      { full_name: 'Pooja Sharma', phone: '+919830456789', brand: 'Apple', model: 'iPhone 13 128GB', date: '2023-01-20', val: 61999, consent: true, score: 25, status: 'NEW' as const, source: 'WEBSITE_FORM' as const, dob: `1996-${in2DaysMMDD}`, anniversary: '2021-08-15', customerSince: '2023-01-20' },
      { full_name: 'Rahul Banerjee', phone: '+919830567890', brand: 'Samsung', model: 'Galaxy M32', date: '2023-05-14', val: 14999, consent: true, score: 55, status: 'CONTACTED' as const, source: 'IN_STORE' as const, dob: '1990-10-18', anniversary: `2019-${tomorrowMMDD}`, customerSince: '2022-05-14' },
      { full_name: 'Sourav Chatterjee', phone: '+919830678901', brand: 'Xiaomi', model: 'Redmi Note 11 Pro', date: '2023-03-22', val: 17999, consent: true, score: 20, status: 'NEW' as const, source: 'IN_STORE' as const, dob: '1994-08-30', anniversary: '2020-03-05', customerSince: '2023-03-22' },
      { full_name: 'Moumita Sen', phone: '+919830789012', brand: 'Samsung', model: 'Galaxy A32', date: '2022-09-10', val: 18500, consent: true, score: 40, status: 'NEW' as const, source: 'IN_STORE' as const, dob: `1993-${in4DaysMMDD}`, anniversary: '2017-12-08', customerSince: '2021-09-10' },
      { full_name: 'Arindam Dutta', phone: '+919830890123', brand: 'OnePlus', model: 'Nord CE 2 5G', date: '2023-06-01', val: 23999, consent: false, score: 0, status: 'NEW' as const, source: 'IN_STORE' as const, dob: `1991-${currentMMDD}`, anniversary: '2020-07-12', customerSince: '2023-06-01' },
      { full_name: 'Pritam Paul', phone: '+919830901234', brand: 'Samsung', model: 'Galaxy F62', date: '2022-08-15', val: 19999, consent: true, score: 45, status: 'NEW' as const, source: 'IN_STORE' as const, dob: `1989-${currentMMDD}`, anniversary: '2016-04-20', customerSince: '2022-08-15' },
      { full_name: 'Bikash Mondal', phone: '+919830923456', brand: 'Samsung', model: 'Galaxy M52 5G', date: '2022-12-01', val: 24999, consent: true, score: 95, status: 'CONVERTED' as const, source: 'IN_STORE' as const, dob: '1987-03-12', anniversary: `2014-${currentMMDD}`, customerSince: '2021-12-01' },
      { full_name: 'Tanmay Biswas', phone: '+919830956789', brand: 'Samsung', model: 'Galaxy Note 10 Lite', date: '2022-05-18', val: 28000, consent: true, score: 35, status: 'NEW' as const, source: 'IN_STORE' as const, dob: '1993-01-28', anniversary: '2021-10-10', customerSince: '2022-05-18' },
      { full_name: 'Sayantani Mitra', phone: '+919830989012', brand: 'Samsung', model: 'Galaxy M21', date: '2022-07-04', val: 13999, consent: true, score: 75, status: 'ENGAGED' as const, source: 'IN_STORE' as const, dob: '1997-09-02', anniversary: '2022-11-28', customerSince: '2021-07-04' }
    ];

    seedCustomers.forEach(sc => {
      const cId = uuidv4();
      const customer: Customer = {
        id: cId,
        shop_id: shopId,
        full_name: sc.full_name,
        phone_e164: sc.phone,
        language: 'bn',
        location: 'Kolkata',
        source: sc.source,
        product_category: 'Smartphones',
        brand: sc.brand,
        model: sc.model,
        purchase_date: sc.date,
        purchase_value: sc.val,
        customer_lifetime_value: sc.val,
        product_interests: [sc.brand, 'Smartphones'],
        tags: [sc.brand, 'Loyal Customer'],
        whatsapp_opt_in: sc.consent,
        opt_in_at: sc.consent ? new Date().toISOString() : null,
        opt_in_source: sc.consent ? sc.source : null,
        do_not_contact: false,
        last_campaign_at: null,
        last_reply_at: sc.status === 'ENGAGED' ? new Date().toISOString() : null,
        engagement_score: sc.score,
        lead_status: sc.status,
        date_of_birth: sc.dob,
        wedding_anniversary: sc.anniversary,
        customer_since_date: sc.customerSince,
        first_purchase_date: sc.date,
        preferred_language: 'bn',
        preferred_channel: 'WHATSAPP',
        last_birthday_message_at: null,
        last_anniversary_message_at: null,
        last_purchase_anniversary_message_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.customers.push(customer);

      if (sc.consent) {
        this.consentEvents.push({
          id: uuidv4(),
          shop_id: shopId,
          customer_id: cId,
          type: 'OPT_IN',
          source: sc.source,
          evidence_reference: 'Store Invoice Counter Checkbox #2023-INV',
          created_at: new Date().toISOString()
        });
      }
    });

    // Campaign
    const campaignId = 'camp-samsung-upgrade-diwali';
    const campaign: Campaign = {
      id: campaignId,
      shop_id: shopId,
      offer_id: offerSamsung.id,
      product_id: prodS24.id,
      name: 'Samsung Galaxy Upgrade Fest (18+ Mo Customers)',
      campaign_type: 'EXCHANGE_CAMPAIGN',
      target_segment_criteria: {
        brand: 'Samsung',
        min_purchase_age_months: 18,
        consent_required: true,
        frequency_cooldown_days: 14,
        reasoning: 'Samsung customers whose devices are over 18 months old are in prime upgrade replacement window.'
      },
      message_template: `Namaskar! Saha Electronics theke exclusive upgrade offer: Galaxy S24 FE-e flat ₹6,000 exchange bonus + 0% EMI! Kal dokane ashun. Reply STOP to opt-out.`,
      language: 'bn',
      status: 'COMPLETED',
      approved_by: ownerId,
      approved_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      scheduled_at: null,
      sent_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      total_audience: 8,
      delivered_count: 8,
      replied_count: 4,
      hot_leads_count: 2,
      sales_count: 1,
      attributed_revenue: 49999,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    };
    this.campaigns.push(campaign);

    // Conversation for Anirban Mukherjee
    const anirban = this.customers.find(c => c.full_name === 'Anirban Mukherjee')!;
    if (anirban) {
      const convId = 'conv-anirban-001';
      const conv: Conversation = {
        id: convId,
        shop_id: shopId,
        customer_id: anirban.id,
        customer_name: anirban.full_name,
        customer_phone: anirban.phone_e164,
        channel: 'WHATSAPP',
        source_reference: 'WhatsApp Campaign #SamsungUpgrade',
        last_message_at: new Date().toISOString(),
        status: 'ACTIVE',
        assigned_to: ownerId,
        is_human_takeover: false,
        lead_score: 85,
        intent: 'EXCHANGE_ENQUIRY',
        interest_level: 'HOT',
        interested_product: 'Samsung Galaxy S24 FE 5G',
        recommended_action: 'Customer confirmed store visit tomorrow. Prepare exchange valuation demo unit.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString()
      };
      this.conversations.push(conv);

      this.messages.push(
        {
          id: uuidv4(),
          shop_id: shopId,
          conversation_id: convId,
          direction: 'OUTBOUND',
          channel: 'WHATSAPP',
          sender_phone: '+919830012345',
          recipient_phone: anirban.phone_e164,
          provider_message_id: 'wamid.HBgMOTE5ODMwMDEyMzQ1NhUCABEYEkZERTFBMjM0NTY3OA==',
          body: campaign.message_template,
          status: 'DELIVERED',
          ai_generated: false,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: uuidv4(),
          shop_id: shopId,
          conversation_id: convId,
          direction: 'INBOUND',
          channel: 'WHATSAPP',
          sender_phone: anirban.phone_e164,
          recipient_phone: '+919830012345',
          provider_message_id: 'wamid.HBgMOTE5ODMwMTIzNDU2FhUCABEYEkZERTFBMjM0NTY3OQ==',
          body: 'Amar purono Galaxy M31 exchange hobe? Kal dokane aschi exchange korte.',
          status: 'DELIVERED',
          ai_generated: false,
          intent_classified: 'EXCHANGE_ENQUIRY',
          created_at: new Date(Date.now() - 80000000).toISOString()
        },
        {
          id: uuidv4(),
          shop_id: shopId,
          conversation_id: convId,
          direction: 'OUTBOUND',
          channel: 'WHATSAPP',
          sender_phone: '+919830012345',
          recipient_phone: anirban.phone_e164,
          provider_message_id: 'wamid.HBgMOTE5ODMwMDEyMzQ1NhUCABEYEkZERTFBMjM0NTY4MA==',
          body: `Namaskar Anirban Babu! Hya, Galaxy M31-e amader special spot exchange bonus achhe. Dokan open 10am-9pm (142 BB Ganguly St). Kal apnar phone-ti box o bill shoho niye ashun, amra 10 min-e valuation kore nebo!`,
          status: 'READ',
          ai_generated: true,
          created_at: new Date(Date.now() - 79500000).toISOString()
        }
      );

      this.leads.push({
        id: uuidv4(),
        shop_id: shopId,
        customer_id: anirban.id,
        conversation_id: convId,
        campaign_id: campaignId,
        channel: 'WHATSAPP',
        source_channel: 'WhatsApp',
        source_type: 'CAMPAIGN',
        source_campaign: campaign.name,
        first_touch_source: 'WhatsApp Campaign',
        last_touch_source: 'WhatsApp',
        customer_name: anirban.full_name,
        customer_phone: anirban.phone_e164,
        product: 'Samsung Galaxy S24 FE 5G',
        interested_product: 'Samsung Galaxy S24 FE 5G',
        intent: 'EXCHANGE_ENQUIRY',
        interest_level: 'HOT',
        lead_score: 85,
        recommended_action: 'Customer visiting store tomorrow for exchange valuation. Keep Galaxy S24 FE demo ready.',
        status: 'OPEN',
        lead_status: 'HOT',
        last_message: 'Amar purono Galaxy M31 exchange hobe? Kal dokane aschi exchange korte.',
        created_at: new Date(Date.now() - 80000000).toISOString(),
        updated_at: new Date().toISOString()
      });

      // Facebook Ad Lead
      this.leads.push({
        id: uuidv4(),
        shop_id: shopId,
        customer_id: 'cust-fb-001',
        channel: 'FACEBOOK',
        source_channel: 'Facebook',
        source_type: 'AD_COMMENT',
        source_campaign: 'Diwali Electronics Mega Sale',
        source_post: 'fb_post_galaxy_fest_01',
        source_ad: 'ad_kolkata_festive_phones',
        source_comment: 'Is exchange bonus applicable on older M series phones? Please confirm.',
        first_touch_source: 'Facebook Sponsored Ad',
        last_touch_source: 'Facebook Messenger',
        customer_name: 'Priyanka Mukherjee',
        customer_phone: '+919830554433',
        product: 'Samsung Galaxy S24 FE 5G',
        interested_product: 'Samsung Galaxy S24 FE 5G',
        intent: 'PRICE_ENQUIRY',
        interest_level: 'WARM',
        lead_score: 65,
        recommended_action: 'Send WhatsApp VIP catalogue with spot exchange valuation',
        status: 'OPEN',
        lead_status: 'WARM',
        last_message: 'Is exchange bonus applicable on older M series phones?',
        created_at: new Date(Date.now() - 43200000).toISOString(),
        updated_at: new Date().toISOString()
      });

      // Instagram Reel Lead
      this.leads.push({
        id: uuidv4(),
        shop_id: shopId,
        customer_id: 'cust-ig-002',
        channel: 'INSTAGRAM',
        source_channel: 'Instagram',
        source_type: 'POST_COMMENT',
        source_post: 'ig_reel_camera_test',
        source_comment: 'Is 0% No Cost EMI available with debit cards?',
        first_touch_source: 'Instagram Showcase Reel',
        last_touch_source: 'Instagram Direct Message',
        customer_name: 'Rohan Sen',
        customer_phone: '+919830776655',
        product: 'Samsung Galaxy S24 FE 5G',
        interested_product: 'Samsung Galaxy S24 FE 5G',
        intent: 'EMI_ENQUIRY',
        interest_level: 'HOT',
        lead_score: 78,
        recommended_action: 'Customer visiting store for Bajaj Finserv 0% EMI scheme',
        status: 'VISITED',
        lead_status: 'HOT',
        last_message: 'Kal asbo documents niye Bajaj EMI er jonno',
        created_at: new Date(Date.now() - 25000000).toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Sale for Bikash Mondal (Attributed to WhatsApp Campaign)
    const bikash = this.customers.find(c => c.full_name === 'Bikash Mondal');
    if (bikash) {
      this.sales.push({
        id: uuidv4(),
        shop_id: shopId,
        customer_id: bikash.id,
        customer_name: bikash.full_name,
        campaign_id: campaignId,
        campaign_name: campaign.name,
        lead_id: 'lead-samsung-upgrade-bikash',
        source_channel: 'WhatsApp',
        source_type: 'CAMPAIGN',
        product: 'Samsung Galaxy S24 FE 5G',
        sale_amount: 49999,
        sale_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        staff: 'Subhasish Saha',
        notes: 'Customer came to store with exchange Galaxy M52. Spot valuation ₹9,000 + ₹6,000 bonus applied.',
        created_at: new Date(Date.now() - 86400000).toISOString()
      });

      // Second sale attributed to Facebook
      this.sales.push({
        id: uuidv4(),
        shop_id: shopId,
        customer_id: 'cust-fb-001',
        customer_name: 'Priyanka Mukherjee',
        source_channel: 'Facebook',
        source_type: 'AD_COMMENT',
        product: 'LG 43-inch 4K UHD Smart TV',
        sale_amount: 28990,
        sale_date: new Date(Date.now() - 40000000).toISOString().slice(0, 10),
        staff: 'Subhasish Saha',
        notes: 'Converted from Facebook festive advertisement. Delivered to Bowbazar residence.',
        created_at: new Date(Date.now() - 40000000).toISOString()
      });
    }

    // Audit log
    this.logAuditAction(shopId, 'Subhasish Saha', 'SHOP_OWNER', 'CAMPAIGN_APPROVED', {
      campaign_id: campaignId,
      campaign_name: campaign.name,
      audience_count: 8
    });
  }

  // ============================================================================
  // SHOP 2: ROYAL TEAK & HOME DECOR (Furniture Showcase) - Generic Retail Multi-Tenant
  // ============================================================================
  seedFurnitureShop() {
    const shopId = 'shop-furniture-002';
    const ownerId = 'profile-furniture-owner-001';

    const shop: Shop = {
      id: shopId,
      name: 'Royal Teak & Home Decor',
      slug: 'royal-teak-furniture',
      phone: '+919830556677',
      address: '88 Diamond Harbour Road, Behala Chowrasta',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700034',
      business_hours: 'Tue-Sun: 10:30 AM - 8:30 PM | Mon: Closed',
      business_type: 'FURNITURE',
      plan: 'PRO',
      operating_mode: 'SHOP_MANAGED',
      feature_flags: {
        enable_whatsapp: true,
        enable_social_leads: true,
        enable_facebook: true,
        enable_instagram: true,
        enable_ai_replies: true,
        enable_managed_service: true,
        enable_sales_tracking: true,
        enable_inventory: true
      },
      active_status: true,
      created_at: new Date('2024-03-01').toISOString()
    };
    this.shops.push(shop);

    // Profile
    this.profiles.push(
      {
        id: ownerId,
        shop_id: shopId,
        full_name: 'Debashis Roy',
        email: 'owner@royalteak.in',
        phone: '+919830556677',
        role: 'SHOP_OWNER',
        created_at: new Date('2024-03-01').toISOString()
      },
      {
        id: 'profile-furniture-staff-002',
        shop_id: shopId,
        full_name: 'Kavita Sharma',
        email: 'staff@royalteak.in',
        phone: '+919830556688',
        role: 'STAFF',
        created_at: new Date('2024-03-15').toISOString()
      }
    );

    // Categories
    const catLiving: ProductCategory = {
      id: 'cat-living-01',
      shop_id: shopId,
      name: 'Living Room Furniture',
      slug: 'living-room',
      business_type: 'FURNITURE',
      description: 'Sofas, recliners, coffee tables, and TV entertainment units',
      created_at: new Date().toISOString()
    };
    const catBedroom: ProductCategory = {
      id: 'cat-bedroom-02',
      shop_id: shopId,
      name: 'Bedroom Sets & Beds',
      slug: 'bedroom',
      business_type: 'FURNITURE',
      description: 'Solid teak king/queen beds with hydraulic storage and wardrobes',
      created_at: new Date().toISOString()
    };
    const catDining: ProductCategory = {
      id: 'cat-dining-03',
      shop_id: shopId,
      name: 'Dining & Kitchen Sets',
      slug: 'dining',
      business_type: 'FURNITURE',
      description: 'Solid wood 4-seater and 6-seater dining sets',
      created_at: new Date().toISOString()
    };
    this.productCategories.push(catLiving, catBedroom, catDining);

    // Attributes for Furniture
    this.productAttributes.push(
      {
        id: uuidv4(),
        shop_id: shopId,
        category_id: catBedroom.id,
        name: 'Wood Material',
        data_type: 'SELECT',
        options: ['100% Solid Teak Wood', 'Sheesham Wood', 'Engineered Hardwood'],
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        shop_id: shopId,
        category_id: catBedroom.id,
        name: 'Storage Type',
        data_type: 'SELECT',
        options: ['Hydraulic Lift-Up Storage', 'Drawer Storage', 'Box Storage', 'No Storage'],
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        shop_id: shopId,
        category_id: catLiving.id,
        name: 'Seating Capacity',
        data_type: 'SELECT',
        options: ['3 Seater', '5 Seater (L-Shape)', '6 Seater Sectional', 'Single Recliner'],
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        shop_id: shopId,
        category_id: catLiving.id,
        name: 'Upholstery Fabric',
        data_type: 'SELECT',
        options: ['Belgian Velvet', 'Stain-Resistant Linen', 'Suede Fabric', 'Top-Grain Leatherette'],
        created_at: new Date().toISOString()
      }
    );

    // Furniture Products
    const prodBed: Product = {
      id: 'prod-teak-bed-01',
      shop_id: shopId,
      category: 'Bedroom Sets & Beds',
      category_id: catBedroom.id,
      sku: 'RT-BED-TEAK-KING-HYD',
      brand: 'Royal Teak Heritage',
      model: 'Imperial King Hydraulic Storage Bed (78x72 in)',
      mrp: 64990,
      cost_price: 42000,
      stock_quantity: 5,
      specs: { wood: '100% Grade-A CP Teak Wood', finish: 'Honey Teak Satin Polish', warranty: '10-Year Termite Proof Warranty' },
      custom_attributes: {
        material: 'Solid Teak Wood',
        size: 'King (78 x 72 inches)',
        storage: 'Hydraulic Lift-Up (800L Capacity)',
        headboard: 'Cushioned Tufted Velvet Headboard',
        finish: 'Walnut Semi-Gloss'
      },
      images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600'],
      is_new_arrival: true,
      is_featured: true,
      created_at: new Date('2024-06-01').toISOString()
    };

    const prodSofa: Product = {
      id: 'prod-sofa-lshape-02',
      shop_id: shopId,
      category: 'Living Room Furniture',
      category_id: catLiving.id,
      sku: 'RT-SOFA-CHESTER-5S',
      brand: 'Royal Comforts',
      model: 'Chesterfield 5-Seater L-Shape Corner Sofa',
      mrp: 58000,
      cost_price: 36000,
      stock_quantity: 6,
      specs: { foam: '32-Density Super Soft Foam', frame: 'Seasoned Sal Wood Frame', warranty: '5-Year Frame Warranty' },
      custom_attributes: {
        seating: '5 Seater (L-Shape Right Aligned)',
        fabric: 'Belgian Emerald Velvet',
        legs: 'Solid Teak Turned Wood Legs',
        cushions: 'Removable Washable Cushion Covers'
      },
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'],
      is_new_arrival: true,
      is_featured: true,
      created_at: new Date('2024-06-01').toISOString()
    };

    const prodDining: Product = {
      id: 'prod-dining-6s-03',
      shop_id: shopId,
      category: 'Dining & Kitchen Sets',
      category_id: catDining.id,
      sku: 'RT-DINING-TEAK-6S',
      brand: 'Royal Teak Heritage',
      model: 'Solid Teak 6-Seater Glass Top Dining Table Set',
      mrp: 49990,
      cost_price: 32000,
      stock_quantity: 4,
      specs: { top: '10mm Toughened Beveled Glass', chairs: '6 High-Back Ergonomic Teak Chairs' },
      custom_attributes: {
        material: 'Solid Teak Wood',
        seating: '6 Seater',
        finish: 'Natural Honey Teak Finish'
      },
      images: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600'],
      is_new_arrival: false,
      is_featured: false,
      created_at: new Date('2024-06-01').toISOString()
    };

    this.products.push(prodBed, prodSofa, prodDining);

    // Furniture Offers
    const todayStr = new Date().toISOString().slice(0, 10);
    const validUntilStr = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const offerBed: Offer = {
      id: 'offer-teak-bed-festive',
      shop_id: shopId,
      title: 'Monsoon Home Makeover: Teak King Bed Carnival',
      product_id: prodBed.id,
      brand: 'Royal Teak Heritage',
      model: 'Imperial King Hydraulic Bed',
      mrp: 64990,
      offer_price: 52990,
      discount: 18.46,
      exchange_offer: 'Flat ₹5,000 spot exchange discount on your old wooden/plywood bed frame',
      emi_information: '0% No-Cost EMI at ₹4,416/mo for 12 months with Bajaj Finserv & HDFC',
      cashback: 'Free Orthopedic Coir-Foam King Mattress worth ₹8,500 with every booking',
      valid_from: todayStr,
      valid_until: validUntilStr,
      stock_status: 'IN_STOCK',
      terms: 'Free doorstep delivery and assembly anywhere in Kolkata & Greater Howrah.',
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600',
      active_status: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const offerSofa: Offer = {
      id: 'offer-sofa-exchange-fest',
      shop_id: shopId,
      title: 'Luxury Living Room Sofa Upgrade & Exchange',
      product_id: prodSofa.id,
      brand: 'Royal Comforts',
      model: 'Chesterfield 5-Seater L-Shape Sofa',
      mrp: 58000,
      offer_price: 46500,
      discount: 19.83,
      exchange_offer: 'Up to ₹8,000 spot exchange bonus for any old 3-seater or 5-seater sofa',
      emi_information: '6 Months No-Cost EMI at ₹7,750/month',
      cashback: 'Set of 4 designer feather-touch cushions free',
      valid_from: todayStr,
      valid_until: validUntilStr,
      stock_status: 'IN_STOCK',
      terms: 'Custom fabric colors (Emerald, Charcoal, Beige) available on order.',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
      active_status: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.offers.push(offerBed, offerSofa);

    // Furniture Settings
    this.shopSettings[shopId] = {
      id: uuidv4(),
      shop_id: shopId,
      daily_campaign_limit: 300,
      contact_frequency_days: 21,
      quiet_hours_start: '21:00:00',
      quiet_hours_end: '09:00:00',
      default_language: 'bn',
      faqs: [
        { q: 'Where is Royal Teak showroom located?', a: '88 Diamond Harbour Road, Behala Chowrasta, Kolkata 700034.' },
        { q: 'What wood do you use?', a: '100% seasoned CP Teak Wood and Sheesham Wood with 10-year termite-proof certification.' },
        { q: 'Do you provide delivery and fitting in Kolkata?', a: 'Yes! Free doorstep delivery and carpenter assembly across Kolkata within 48 hours.' },
        { q: 'Can I exchange my old wooden bed or sofa?', a: 'Yes! Spot exchange evaluation up to ₹8,000 applied directly to your new furniture invoice.' }
      ],
      ai_guardrails: 'Strictly answer furniture dimensions, wood material, and warranty from stored product specs only.'
    };

    this.integrationSettings[shopId] = {
      id: uuidv4(),
      shop_id: shopId,
      provider: 'MOCK',
      phone_number_id: '109823485764999',
      waba_id: '928374619283999',
      access_token: 'EAAG9...MOCK_FURNITURE...',
      webhook_secret: 'shopgrow_whsec_furniture_2026',
      facebook_page_id: 'page_royalteak_kolkata',
      instagram_account_id: 'ig_royalteak_furniture',
      status: 'CONNECTED',
      last_sync_at: new Date().toISOString()
    };

    this.occasionSettings[shopId] = {
      id: uuidv4(),
      shop_id: shopId,
      birthday_enabled: true,
      wedding_anniversary_enabled: true,
      purchase_anniversary_enabled: true,
      relationship_anniversary_enabled: true,
      channel: 'WHATSAPP',
      send_time: '11:00',
      send_days_in_advance: 0,
      default_language: 'bn',
      template_birthday: 'শুভ জন্মদিন {name}! 🎉 আপনার বিশেষ দিনে Royal Teak Furniture-এর পক্ষ থেকে হার্দিক শুভেচ্ছা।',
      template_anniversary: 'বিবাহবার্ষিকীর শুভেচ্ছা {name}! 💐 আপনার ঘর ভরে উঠুক ঐতিহ্য ও আনন্দে। — Royal Teak',
      template_purchase_anniversary: 'নমস্কার {name}, আজ থেকে {years} বছর আগে আপনার বাড়িতে নিয়েছিলেন {product}। ধন্যবাদ আমাদের পাশে থাকার জন্য!',
      offers: {
        birthday: {
          enabled: true,
          offer_name: 'Birthday Teak Cushion & Care Gift',
          discount_type: 'FREE_GIFT',
          discount_value: 1200,
          applicable_category: 'Living Room Furniture',
          min_purchase_amount: 5000,
          coupon_code: 'TEAKGIFT',
          validity_option: '7_DAYS',
          terms_conditions: 'Complimentary luxury teak wood maintenance kit & cushion set with any furniture purchase.',
          store_visit_required: true,
          is_paused: false
        },
        wedding_anniversary: {
          enabled: true,
          offer_name: 'Anniversary Home Suite ₹2,000 Off',
          discount_type: 'FLAT_AMOUNT',
          discount_value: 2000,
          applicable_category: 'Bedroom Sets & Beds',
          min_purchase_amount: 30000,
          max_discount: 2000,
          coupon_code: 'WEDDING2K',
          validity_option: '7_DAYS',
          terms_conditions: 'Applicable on solid teak king/queen bed frames.',
          store_visit_required: true,
          is_paused: false
        },
        purchase_anniversary: {
          enabled: false,
          offer_name: 'Anniversary Exchange Privilege',
          discount_type: 'PERCENTAGE',
          discount_value: 10,
          coupon_code: 'HERITAGE10',
          validity_option: '7_DAYS',
          terms_conditions: 'Additional 10% on exchange bonus.',
          store_visit_required: true,
          is_paused: false
        }
      },
      updated_at: new Date().toISOString()
    };

    // Furniture Customers
    const furnitureCustomers = [
      { name: 'Ananya Sen', phone: '+919830881122', category: 'Bedroom Sets & Beds', brand: 'Royal Teak', model: 'Teak Queen Bed', date: '2022-08-10', val: 42000, consent: true, score: 75, source: 'IN_STORE' as const, clv: 58000 },
      { name: 'Soumya Mukherjee', phone: '+919830882233', category: 'Living Room Furniture', brand: 'Royal Comforts', model: '3-Seater Fabric Sofa', date: '2022-04-15', val: 28000, consent: true, score: 85, source: 'FACEBOOK_AD' as const, clv: 35000 },
      { name: 'Dr. Indranil Roy', phone: '+919830883344', category: 'Dining & Kitchen Sets', brand: 'Royal Teak', model: '4-Seater Dining Set', date: '2023-01-20', val: 34000, consent: true, score: 60, source: 'WALK_IN' as const, clv: 34000 },
      { name: 'Priya Sengupta', phone: '+919830884455', category: 'Bedroom Sets & Beds', brand: 'Royal Teak', model: '2-Door Teak Wardrobe', date: '2022-10-05', val: 38000, consent: true, score: 90, source: 'IN_STORE' as const, clv: 45000 },
      { name: 'Aritra Majumdar', phone: '+919830885566', category: 'Living Room Furniture', brand: 'Royal Comforts', model: 'Wingback Armchair', date: '2023-05-12', val: 18000, consent: false, score: 10, source: 'INSTAGRAM' as const, clv: 18000 }
    ];

    furnitureCustomers.forEach(fc => {
      const cId = uuidv4();
      const customer: Customer = {
        id: cId,
        shop_id: shopId,
        full_name: fc.name,
        phone_e164: fc.phone,
        language: 'bn',
        location: 'Behala, Kolkata',
        source: fc.source,
        product_category: fc.category,
        brand: fc.brand,
        model: fc.model,
        purchase_date: fc.date,
        purchase_value: fc.val,
        customer_lifetime_value: fc.clv,
        product_interests: [fc.category, 'Teak Wood'],
        tags: [fc.category, 'Home Decor'],
        whatsapp_opt_in: fc.consent,
        opt_in_at: fc.consent ? new Date().toISOString() : null,
        opt_in_source: fc.consent ? fc.source : null,
        do_not_contact: false,
        last_campaign_at: null,
        last_reply_at: new Date().toISOString(),
        engagement_score: fc.score,
        lead_status: fc.score >= 80 ? 'ENGAGED' : 'NEW',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.customers.push(customer);

      if (fc.consent) {
        this.consentEvents.push({
          id: uuidv4(),
          shop_id: shopId,
          customer_id: cId,
          type: 'OPT_IN',
          source: fc.source,
          evidence_reference: 'Showroom Invoice Consent Checkbox #RT-2023',
          created_at: new Date().toISOString()
        });
      }
    });

    // Seed a Social Lead from Facebook Comment (Section I)
    const socialLeadId = uuidv4();
    this.socialLeads.push({
      id: socialLeadId,
      shop_id: shopId,
      channel: 'FACEBOOK',
      source_post_id: 'post_monsoon_sofa_ad_492',
      source_comment_id: 'comment_fb_928374',
      author_name: 'Soumya Mukherjee',
      author_id: 'fb_user_soumya_992',
      content: 'Is this 5-seater L-Shape sofa available in Royal Emerald velvet? Showroom Bowbazar/Behala-te open ache kal?',
      intent: 'PRICE_ENQUIRY',
      interest_level: 'HOT',
      public_reply_sent: 'Hello Soumya! Yes, Emerald velvet is on display at our Behala showroom. We have DM-ed you the offer and showroom timings!',
      private_reply_sent: 'Namaskar Soumya! 5-seater L-Shape is available with flat ₹11,500 off this week. To claim your free cushion set, join our WhatsApp VIP club here: /optin/royal-teak-furniture',
      converted_to_whatsapp: true,
      whatsapp_phone: '+919830882233',
      created_at: new Date(Date.now() - 3600000).toISOString()
    });

    // Seed conversation for Soumya Mukherjee in Furniture Shop Unified Inbox
    const soumya = this.customers.find(c => c.full_name === 'Soumya Mukherjee');
    if (soumya) {
      const convId = 'conv-soumya-furniture-001';
      this.conversations.push({
        id: convId,
        shop_id: shopId,
        customer_id: soumya.id,
        customer_name: soumya.full_name,
        customer_phone: soumya.phone_e164,
        channel: 'FACEBOOK',
        source_reference: 'Facebook Ad Comment #L-ShapeSofa',
        last_message_at: new Date().toISOString(),
        status: 'ACTIVE',
        assigned_to: ownerId,
        is_human_takeover: false,
        lead_score: 85,
        intent: 'PRICE_ENQUIRY',
        interest_level: 'HOT',
        interested_product: 'Chesterfield 5-Seater L-Shape Sofa',
        recommended_action: 'Customer visiting Behala showroom tomorrow. Prepare sofa fabric swatch book.',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date().toISOString()
      });

      this.messages.push({
        id: uuidv4(),
        shop_id: shopId,
        conversation_id: convId,
        direction: 'INBOUND',
        channel: 'FACEBOOK',
        sender_phone: soumya.phone_e164,
        recipient_phone: shop.phone,
        provider_message_id: 'fb_msg_soumya_01',
        body: 'Is this 5-seater L-Shape sofa available in Royal Emerald velvet? Showroom Bowbazar/Behala-te open ache kal?',
        status: 'DELIVERED',
        ai_generated: false,
        intent_classified: 'PRICE_ENQUIRY',
        created_at: new Date(Date.now() - 3600000).toISOString()
      });

      this.leads.push({
        id: uuidv4(),
        shop_id: shopId,
        customer_id: soumya.id,
        conversation_id: convId,
        channel: 'FACEBOOK',
        customer_name: soumya.full_name,
        customer_phone: soumya.phone_e164,
        product: 'Chesterfield 5-Seater L-Shape Sofa',
        intent: 'PRICE_ENQUIRY',
        interest_level: 'HOT',
        lead_score: 85,
        recommended_action: 'Customer visiting Behala showroom tomorrow. Prepare sofa fabric swatch book.',
        status: 'OPEN',
        last_message: 'Is this 5-seater L-Shape sofa available in Royal Emerald velvet? Showroom Bowbazar/Behala-te open ache kal?',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Seed a confirmed furniture sale to show attribution
    const ananya = this.customers.find(c => c.full_name === 'Ananya Sen');
    if (ananya) {
      this.sales.push({
        id: uuidv4(),
        shop_id: shopId,
        customer_id: ananya.id,
        customer_name: ananya.full_name,
        product: 'Imperial King Hydraulic Bed (Teak Wood)',
        sale_amount: 52990,
        sale_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        staff: 'Debashis Roy',
        notes: 'Customer booked after WhatsApp bed upgrade notification. Free mattress bundle included.',
        created_at: new Date(Date.now() - 86400000).toISOString()
      });
    }
  }

  // ============================================================================
  // META SOCIAL INTEGRATION SEED & HELPERS
  // ============================================================================
  getDefaultMetaIntegrations(shopId: string): MetaSocialIntegrationSettings {
    const isSaha = shopId === 'shop-saha-electronics-001';
    return {
      shop_id: shopId,
      facebook_page: {
        channel: 'FACEBOOK_PAGE',
        title: 'Facebook Page Integration',
        description: 'Auto-ingest public comments, lead ads, and send instant private messages.',
        status: isSaha ? 'MOCK_MODE' : 'NOT_CONNECTED',
        account_name: isSaha ? 'Saha Electronics & Mobiles (Official)' : undefined,
        account_id: isSaha ? 'page_saha_elec_10293847' : undefined,
        token_status: isSaha ? 'MOCK_VALID' : 'MISSING',
        permissions: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'pages_manage_metadata'],
        webhook_status: isSaha ? 'ACTIVE' : 'INACTIVE',
        last_event_at: isSaha ? new Date(Date.now() - 1800000).toISOString() : undefined,
        oauth_url: `https://www.facebook.com/v19.0/dialog/oauth?client_id=MOCK_META_APP_ID&redirect_uri=http://localhost:5173/settings?tab=meta-social&scope=pages_show_list,pages_read_engagement,pages_manage_posts`
      },
      instagram_account: {
        channel: 'INSTAGRAM',
        title: 'Instagram Professional Account',
        description: 'Track Instagram reel & post comments, DM leads, and product price queries.',
        status: isSaha ? 'MOCK_MODE' : 'NOT_CONNECTED',
        account_name: isSaha ? '@sahaelectronics.kolkata' : undefined,
        account_id: isSaha ? 'ig_saha_987654321' : undefined,
        token_status: isSaha ? 'MOCK_VALID' : 'MISSING',
        permissions: ['instagram_basic', 'instagram_manage_comments', 'instagram_manage_messages'],
        webhook_status: isSaha ? 'ACTIVE' : 'INACTIVE',
        last_event_at: isSaha ? new Date(Date.now() - 3600000).toISOString() : undefined,
        oauth_url: `https://www.facebook.com/v19.0/dialog/oauth?client_id=MOCK_META_APP_ID&redirect_uri=http://localhost:5173/settings?tab=meta-social&scope=instagram_basic,instagram_manage_comments`
      },
      meta_ad_account: {
        channel: 'AD_ACCOUNT',
        title: 'Meta Ad Account Attribution',
        description: 'Attribute campaign ad-spend to in-store sales and track ROAS from Click-to-WhatsApp.',
        status: isSaha ? 'MOCK_MODE' : 'NOT_CONNECTED',
        account_name: isSaha ? 'Saha Retail Ads (Act: 77291034)' : undefined,
        account_id: isSaha ? 'act_77291034821' : undefined,
        token_status: isSaha ? 'MOCK_VALID' : 'MISSING',
        permissions: ['ads_read', 'ads_management'],
        webhook_status: isSaha ? 'ACTIVE' : 'INACTIVE',
        last_event_at: isSaha ? new Date(Date.now() - 7200000).toISOString() : undefined
      },
      meta_lead_forms: {
        channel: 'LEAD_FORMS',
        title: 'Meta Lead Gen Forms',
        description: 'Sync instant Facebook & Instagram Lead Ad submissions directly into Unified CRM.',
        status: isSaha ? 'MOCK_MODE' : 'NOT_CONNECTED',
        account_name: isSaha ? 'Saha Festive Exchange & EMI Forms' : undefined,
        account_id: isSaha ? 'form_set_8839210' : undefined,
        token_status: isSaha ? 'MOCK_VALID' : 'MISSING',
        permissions: ['leads_retrieval'],
        webhook_status: isSaha ? 'ACTIVE' : 'INACTIVE',
        last_event_at: isSaha ? new Date(Date.now() - 14400000).toISOString() : undefined
      },
      messenger: {
        channel: 'MESSENGER',
        title: 'Facebook Messenger Direct',
        description: 'AI Sales Assistant auto-replying to customer Messenger inquiries with catalog links.',
        status: isSaha ? 'MOCK_MODE' : 'NOT_CONNECTED',
        account_name: isSaha ? 'Saha Electronics Messenger Bot' : undefined,
        account_id: isSaha ? 'page_saha_elec_10293847' : undefined,
        token_status: isSaha ? 'MOCK_VALID' : 'MISSING',
        permissions: ['pages_messaging'],
        webhook_status: isSaha ? 'ACTIVE' : 'INACTIVE',
        last_event_at: isSaha ? new Date(Date.now() - 28800000).toISOString() : undefined
      },
      updated_at: new Date().toISOString()
    };
  }

  seedMetaIntegrations() {
    // Seed Saha Electronics
    const sahaId = 'shop-saha-electronics-001';
    this.metaIntegrations[sahaId] = this.getDefaultMetaIntegrations(sahaId);

    // Seed Furniture Shop
    const furnitureId = 'shop-furniture-002';
    const furnitureIntegrations = this.getDefaultMetaIntegrations(furnitureId);
    furnitureIntegrations.facebook_page.status = 'MOCK_MODE';
    furnitureIntegrations.facebook_page.account_name = 'Royal Teak & Home Decor (Kolkata)';
    furnitureIntegrations.facebook_page.account_id = 'page_royal_teak_554433';
    furnitureIntegrations.facebook_page.token_status = 'MOCK_VALID';
    furnitureIntegrations.facebook_page.webhook_status = 'ACTIVE';
    this.metaIntegrations[furnitureId] = furnitureIntegrations;

    // Seed customer external identities
    this.customerExternalIdentities.push({
      id: uuidv4(),
      shop_id: sahaId,
      customer_id: 'cust-fb-001',
      platform: 'FACEBOOK',
      external_user_id: 'fb_user_priyanka_mukh_441',
      display_name: 'Priyanka Mukherjee',
      created_at: new Date(Date.now() - 86400000).toISOString()
    });

    this.customerExternalIdentities.push({
      id: uuidv4(),
      shop_id: furnitureId,
      customer_id: 'cust-furniture-soumya-001',
      platform: 'FACEBOOK',
      external_user_id: 'fb_user_soumya_992',
      display_name: 'Soumya Mukherjee',
      created_at: new Date(Date.now() - 3600000).toISOString()
    });

    // Seed baseline social comments
    this.socialComments.push({
      id: uuidv4(),
      shop_id: sahaId,
      platform: 'FACEBOOK',
      page_id: 'page_saha_elec_10293847',
      post_id: 'post_saha_diwali_oneplus_ad',
      comment_id: 'comm_fb_seed_001',
      platform_user_id: 'fb_user_rahul_991',
      user_display_name: 'Rahul Das',
      comment_text: 'OnePlus 12R exchange offer ache? Amar purono OnePlus 9R exchange bonus koto pabo?',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      processing_status: 'PROCESSED',
      detected_intent: 'EXCHANGE_ENQUIRY',
      lead_id: 'lead-saha-diwali-rahul',
      customer_id: 'cust-fb-rahul-001'
    });

    this.processedCommentKeys.add('FACEBOOK:comm_fb_seed_001');

    this.socialComments.push({
      id: uuidv4(),
      shop_id: sahaId,
      platform: 'INSTAGRAM',
      account_id: 'ig_saha_987654321',
      post_id: 'post_saha_ig_reels_festive',
      comment_id: 'comm_ig_seed_002',
      platform_user_id: 'ig_user_priya_772',
      user_display_name: 'Priya Banerjee',
      comment_text: 'Diwali sale kobe theke start? Vivo V30 Pro ache showroom-e?',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      processing_status: 'PROCESSED',
      detected_intent: 'PRICE_ENQUIRY',
      lead_id: 'lead-saha-festive-priya',
      customer_id: 'cust-ig-priya-002'
    });

    this.processedCommentKeys.add('INSTAGRAM:comm_ig_seed_002');
  }

  getMetaIntegrationSettings(shopId: string): MetaSocialIntegrationSettings {
    if (!this.metaIntegrations[shopId]) {
      this.metaIntegrations[shopId] = this.getDefaultMetaIntegrations(shopId);
    }
    return this.metaIntegrations[shopId];
  }

  updateMetaIntegrationCard(
    shopId: string, 
    channel: MetaSocialChannel, 
    patch: Partial<MetaIntegrationCard>
  ): MetaIntegrationCard {
    const settings = this.getMetaIntegrationSettings(shopId);
    let card: MetaIntegrationCard;
    switch (channel) {
      case 'FACEBOOK_PAGE':
        settings.facebook_page = { ...settings.facebook_page, ...patch };
        card = settings.facebook_page;
        break;
      case 'INSTAGRAM':
        settings.instagram_account = { ...settings.instagram_account, ...patch };
        card = settings.instagram_account;
        break;
      case 'AD_ACCOUNT':
        settings.meta_ad_account = { ...settings.meta_ad_account, ...patch };
        card = settings.meta_ad_account;
        break;
      case 'LEAD_FORMS':
        settings.meta_lead_forms = { ...settings.meta_lead_forms, ...patch };
        card = settings.meta_lead_forms;
        break;
      case 'MESSENGER':
        settings.messenger = { ...settings.messenger, ...patch };
        card = settings.messenger;
        break;
      default:
        throw new Error(`Unknown Meta channel: ${channel}`);
    }
    settings.updated_at = new Date().toISOString();
    return card;
  }

  isCommentProcessed(platform: string, commentId: string): boolean {
    return this.processedCommentKeys.has(`${platform.toUpperCase()}:${commentId}`);
  }

  markCommentProcessed(platform: string, commentId: string): void {
    this.processedCommentKeys.add(`${platform.toUpperCase()}:${commentId}`);
  }

  findCustomerByExternalId(shopId: string, platform: string, externalId: string): Customer | undefined {
    const identity = this.customerExternalIdentities.find(
      i => i.shop_id === shopId && i.platform === platform.toUpperCase() && i.external_user_id === externalId
    );
    if (identity) {
      return this.customers.find(c => c.id === identity.customer_id && c.shop_id === shopId);
    }
    return undefined;
  }

  linkCustomerExternalId(shopId: string, customerId: string, platform: 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP', externalId: string, name?: string): CustomerExternalIdentity {
    const existing = this.customerExternalIdentities.find(
      i => i.shop_id === shopId && i.platform === platform && i.external_user_id === externalId
    );
    if (existing) {
      existing.customer_id = customerId;
      if (name) existing.display_name = name;
      return existing;
    }
    const identity: CustomerExternalIdentity = {
      id: uuidv4(),
      customer_id: customerId,
      shop_id: shopId,
      platform,
      external_user_id: externalId,
      display_name: name,
      created_at: new Date().toISOString()
    };
    this.customerExternalIdentities.push(identity);
    return identity;
  }

  findOpenLeadForCustomer(shopId: string, customerId: string): Lead | undefined {
    return this.leads.find(
      l => l.shop_id === shopId && l.customer_id === customerId && l.status !== 'WON' && l.status !== 'LOST'
    );
  }

  addSocialComment(record: SocialCommentRecord): void {
    this.socialComments.unshift(record);
    if (this.socialComments.length > 500) {
      this.socialComments.pop();
    }
  }

  getSocialComments(shopId: string): SocialCommentRecord[] {
    return this.socialComments.filter(c => c.shop_id === shopId);
  }

  // Selectors
  getShop(shopId: string): Shop | undefined {
    return this.shops.find(s => s.id === shopId);
  }

  getCustomers(shopId: string): Customer[] {
    return this.customers.filter(c => c.shop_id === shopId);
  }

  getProductCategories(shopId: string): ProductCategory[] {
    return this.productCategories.filter(pc => pc.shop_id === shopId);
  }

  getProductAttributes(shopId: string): ProductAttribute[] {
    return this.productAttributes.filter(pa => pa.shop_id === shopId);
  }

  getProducts(shopId: string): Product[] {
    return this.products.filter(p => p.shop_id === shopId);
  }

  getOffers(shopId: string): Offer[] {
    return this.offers.filter(o => o.shop_id === shopId);
  }

  getCampaigns(shopId: string): Campaign[] {
    return this.campaigns.filter(c => c.shop_id === shopId);
  }

  getConversations(shopId: string): Conversation[] {
    return this.conversations.filter(c => c.shop_id === shopId);
  }

  getLeads(shopId: string): Lead[] {
    return this.leads.filter(l => l.shop_id === shopId);
  }

  getSocialLeads(shopId: string): SocialLead[] {
    return this.socialLeads.filter(sl => sl.shop_id === shopId);
  }

  getSales(shopId: string): Sale[] {
    return this.sales.filter(s => s.shop_id === shopId);
  }

  getAuditLogs(shopId: string): AuditLog[] {
    return this.auditLogs.filter(al => al.shop_id === shopId);
  }

  getOccasionSettings(shopId: string): OccasionAutomationSettings | undefined {
    return this.occasionSettings[shopId];
  }

  getOccasionLogs(shopId: string): OccasionLog[] {
    return this.occasionLogs.filter(ol => ol.shop_id === shopId);
  }

  getSystemEvents(shopId?: string): SystemTraceEvent[] {
    if (!shopId || shopId === 'ALL') return this.systemEvents;
    return this.systemEvents.filter(se => se.shop_id === shopId);
  }

  deleteShop(shopId: string): boolean {
    const idx = this.shops.findIndex(s => s.id === shopId);
    if (idx === -1) return false;
    const shopName = this.shops[idx].name;
    this.shops.splice(idx, 1);
    
    // Clean up associated shop records
    this.customers = this.customers.filter(c => c.shop_id !== shopId);
    this.products = this.products.filter(p => p.shop_id !== shopId);
    this.offers = this.offers.filter(o => o.shop_id !== shopId);
    this.campaigns = this.campaigns.filter(c => c.shop_id !== shopId);
    this.conversations = this.conversations.filter(c => c.shop_id !== shopId);
    this.messages = this.messages.filter(m => m.shop_id !== shopId);
    this.leads = this.leads.filter(l => l.shop_id !== shopId);
    this.socialLeads = this.socialLeads.filter(sl => sl.shop_id !== shopId);
    this.sales = this.sales.filter(s => s.shop_id !== shopId);
    delete this.shopSettings[shopId];
    delete this.integrationSettings[shopId];

    this.logSystemEvent({
      name: `Shop Deleted (${shopName})`,
      shop_id: shopId,
      source: 'SUPER_ADMIN',
      status: 'WARNING',
      payload: { deleted_shop_id: shopId, name: shopName }
    });
    return true;
  }

  resetTestData(): void {
    // Purge test simulation phone numbers from customers, conversations, and messages
    const testPhones = new Set(['+919830999888', '+919876540099', '+919830888111']);
    this.customers = this.customers.filter(c => !testPhones.has(c.phone_e164));
    this.customers.forEach(c => {
      c.last_campaign_at = null;
    });
    this.conversations = this.conversations.filter(c => !testPhones.has(c.customer_phone));
    this.messages = this.messages.filter(m => !testPhones.has(m.sender_phone) && !testPhones.has(m.recipient_phone));
    this.leads = this.leads.filter(l => l.customer_phone === '+919830123456' || l.customer_phone === '+919830882233');
    this.socialLeads = this.socialLeads.slice(0, 3);
    this.logSystemEvent({
      name: 'QA Sandbox Test Data Reset',
      shop_id: 'shop-saha-electronics-001',
      source: 'QA_SANDBOX',
      status: 'SUCCESS',
      payload: { action: 'PURGE_TEST_SIMULATIONS_COMPLETED' }
    });
  }

  seedSuperAdmins(): void {
    const adminInitialPass = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD || 'adminpassword';
    const hashed = PasswordService.hashPassword(adminInitialPass);
    this.superAdmins = [
      {
        id: 'sa-genesis-001',
        user_id: 'profile-super-admin-000',
        email: 'admin@shopgrow.ai',
        full_name: 'Antigravity Super Admin',
        status: 'ACTIVE',
        granted_by: 'SYSTEM_GENESIS',
        granted_at: new Date('2024-01-01').toISOString(),
        created_at: new Date('2024-01-01').toISOString(),
        last_login_at: new Date().toISOString(),
        password_hash: hashed.hash,
        password_salt: hashed.salt,
        failed_login_attempts: 0
      }
    ];
  }

  seedDefaultBrandings(): void {
    this.shopBranding['shop-saha-electronics-001'] = {
      shop_id: 'shop-saha-electronics-001',
      bg_type: 'DEFAULT_WHITE',
      bg_color: '#FFFFFF',
      bg_display: 'cover',
      overlay_type: 'NONE',
      overlay_strength: 0,
      updated_at: new Date().toISOString()
    };
    this.shopBranding['shop-furniture-002'] = {
      shop_id: 'shop-furniture-002',
      bg_type: 'CUSTOM_IMAGE',
      bg_color: '#FFFFFF',
      bg_image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1920&q=80',
      bg_display: 'cover',
      overlay_type: 'DARK',
      overlay_strength: 35,
      updated_at: new Date().toISOString()
    };
  }

  getShopBranding(shopId: string): ShopBranding {
    if (!this.shopBranding[shopId]) {
      this.shopBranding[shopId] = {
        shop_id: shopId,
        bg_type: 'DEFAULT_WHITE',
        bg_color: '#FFFFFF',
        bg_display: 'cover',
        overlay_type: 'NONE',
        overlay_strength: 0,
        updated_at: new Date().toISOString()
      };
    }
    return this.shopBranding[shopId];
  }

  updateShopBranding(shopId: string, patch: Partial<ShopBranding>): ShopBranding {
    const current = this.getShopBranding(shopId);
    this.shopBranding[shopId] = {
      ...current,
      ...patch,
      shop_id: shopId,
      updated_at: new Date().toISOString()
    };
    this.logSystemEvent({
      name: 'Shop Branding Updated',
      shop_id: shopId,
      source: 'SETTINGS_BRANDING',
      status: 'SUCCESS',
      payload: { bg_type: this.shopBranding[shopId].bg_type, bg_color: this.shopBranding[shopId].bg_color }
    });
    return this.shopBranding[shopId];
  }

  isSuperAdminEmail(email: string): boolean {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    return this.superAdmins.some(sa => sa.email.toLowerCase().trim() === clean && sa.status === 'ACTIVE');
  }

  sanitizeAdminRecord(admin: SuperAdminRecord): SuperAdminRecord {
    const copy = { ...admin };
    delete copy.password_hash;
    delete copy.password_salt;
    delete copy.reset_token_hash;
    return copy;
  }

  getSuperAdmins(): SuperAdminRecord[] {
    return this.superAdmins.map(sa => this.sanitizeAdminRecord(sa));
  }

  addSuperAdmin(email: string, fullName: string, grantedBy: string): { success: boolean; admin?: SuperAdminRecord; error?: string } {
    const clean = email.toLowerCase().trim();
    if (!clean || !clean.includes('@')) {
      return { success: false, error: 'Valid email address is required' };
    }
    const existing = this.superAdmins.find(sa => sa.email.toLowerCase().trim() === clean);
    if (existing) {
      if (existing.status === 'ACTIVE') {
        return { success: false, error: `Email ${email} is already an active Super Admin` };
      }
      existing.status = 'ACTIVE';
      existing.revoked_at = undefined;
      existing.granted_by = grantedBy;
      existing.granted_at = new Date().toISOString();
      this.logAuditAction('PLATFORM_GLOBAL', grantedBy, 'SUPER_ADMIN', 'SUPER_ADMIN_REACTIVATED', { email: clean });
      return { success: true, admin: existing };
    }

    const newAdmin: SuperAdminRecord = {
      id: uuidv4(),
      user_id: `profile-sa-${Date.now()}`,
      email: clean,
      full_name: fullName || clean.split('@')[0],
      status: 'ACTIVE',
      granted_by: grantedBy,
      granted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      last_login_at: undefined
    };
    this.superAdmins.push(newAdmin);
    this.logAuditAction('PLATFORM_GLOBAL', grantedBy, 'SUPER_ADMIN', 'SUPER_ADMIN_GRANTED', { email: clean, granted_by: grantedBy });
    this.logSystemEvent({
      name: `Super Admin Role Granted (${clean})`,
      shop_id: 'ALL',
      source: 'ADMIN_ACCESS_GOVERNANCE',
      status: 'SUCCESS',
      payload: { email: clean, granted_by: grantedBy }
    });
    return { success: true, admin: newAdmin };
  }

  updateSuperAdminStatus(id: string, status: SuperAdminStatus, actorName: string): { success: boolean; admin?: SuperAdminRecord; error?: string } {
    const admin = this.superAdmins.find(sa => sa.id === id);
    if (!admin) {
      return { success: false, error: 'Super Admin record not found' };
    }
    const activeCount = this.superAdmins.filter(sa => sa.status === 'ACTIVE').length;
    if (status !== 'ACTIVE' && admin.status === 'ACTIVE' && activeCount <= 1) {
      return { success: false, error: 'Cannot revoke or suspend the sole active Super Admin account' };
    }

    admin.status = status;
    if (status === 'REVOKED' || status === 'SUSPENDED') {
      admin.revoked_at = new Date().toISOString();
    }
    this.logAuditAction('PLATFORM_GLOBAL', actorName, 'SUPER_ADMIN', `SUPER_ADMIN_${status}`, { email: admin.email, id: admin.id });
    return { success: true, admin };
  }

  verifyAdminCredentials(email: string, password: string): { valid: boolean; admin?: SuperAdminRecord; error?: string; status?: number } {
    if (!email || !password) {
      return { valid: false, error: 'Email and password are required', status: 400 };
    }
    const clean = email.toLowerCase().trim();
    const admin = this.superAdmins.find(sa => sa.email.toLowerCase().trim() === clean);
    if (!admin) {
      return { valid: false, error: 'Access Denied: You do not have verified Super Administrator privileges on this platform.', status: 403 };
    }
    if (admin.status !== 'ACTIVE') {
      return { valid: false, error: 'Access Denied: Super Admin account has been revoked or suspended.', status: 403 };
    }
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return { valid: false, error: 'Account temporarily locked due to consecutive failed login attempts. Please try again later or use password reset.', status: 429 };
    }

    if (!admin.password_hash || !admin.password_salt) {
      const seeded = PasswordService.hashPassword(process.env.ADMIN_PASSWORD || 'adminpassword');
      admin.password_hash = seeded.hash;
      admin.password_salt = seeded.salt;
    }

    const isMatch = PasswordService.verifyPassword(password, admin.password_hash, admin.password_salt);
    if (!isMatch) {
      admin.failed_login_attempts = (admin.failed_login_attempts || 0) + 1;
      if (admin.failed_login_attempts >= 5) {
        admin.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        this.logAuditAction('PLATFORM_SECURITY', admin.full_name, 'SUPER_ADMIN', 'ADMIN_ACCOUNT_LOCKED', { email: clean, attempts: admin.failed_login_attempts });
      }
      return { valid: false, error: 'Invalid admin credentials.', status: 401 };
    }

    admin.failed_login_attempts = 0;
    admin.locked_until = undefined;
    admin.last_login_at = new Date().toISOString();
    return { valid: true, admin: this.sanitizeAdminRecord(admin) };
  }

  setAdminPassword(email: string, newPassword: string): { success: boolean; error?: string } {
    const clean = email.toLowerCase().trim();
    const admin = this.superAdmins.find(sa => sa.email.toLowerCase().trim() === clean);
    if (!admin) {
      return { success: false, error: 'Admin account not found.' };
    }
    const policy = PasswordService.validatePolicy(newPassword);
    if (!policy.valid) {
      return { success: false, error: policy.error };
    }
    const { hash, salt } = PasswordService.hashPassword(newPassword);
    admin.password_hash = hash;
    admin.password_salt = salt;
    admin.failed_login_attempts = 0;
    admin.locked_until = undefined;
    admin.reset_token_hash = undefined;
    admin.reset_token_expires_at = undefined;
    this.logAuditAction('PLATFORM_SECURITY', admin.full_name, 'SUPER_ADMIN', 'ADMIN_PASSWORD_RESET_SUCCESS', { email: clean });
    return { success: true };
  }

  createAdminPasswordResetToken(email: string): { success: boolean; rawToken?: string; expiresAt?: string; error?: string } {
    const clean = email.toLowerCase().trim();
    const admin = this.superAdmins.find(sa => sa.email.toLowerCase().trim() === clean && sa.status === 'ACTIVE');
    if (!admin) {
      return { success: true };
    }
    const { rawToken, tokenHash, expiresAt } = PasswordService.generateResetToken(60);
    admin.reset_token_hash = tokenHash;
    admin.reset_token_expires_at = expiresAt;
    this.logAuditAction('PLATFORM_SECURITY', admin.full_name, 'SUPER_ADMIN', 'PASSWORD_RESET_TOKEN_ISSUED', { email: clean });
    return { success: true, rawToken, expiresAt };
  }

  resetAdminPasswordWithToken(email: string, rawToken: string, newPassword: string): { success: boolean; error?: string } {
    const clean = email.toLowerCase().trim();
    const admin = this.superAdmins.find(sa => sa.email.toLowerCase().trim() === clean && sa.status === 'ACTIVE');
    if (!admin || !admin.reset_token_hash || !admin.reset_token_expires_at) {
      return { success: false, error: 'Invalid or expired password reset token.' };
    }
    const isValid = PasswordService.verifyResetToken(rawToken, admin.reset_token_hash, admin.reset_token_expires_at);
    if (!isValid) {
      return { success: false, error: 'Invalid or expired password reset token.' };
    }
    const policy = PasswordService.validatePolicy(newPassword);
    if (!policy.valid) {
      return { success: false, error: policy.error };
    }
    const { hash, salt } = PasswordService.hashPassword(newPassword);
    admin.password_hash = hash;
    admin.password_salt = salt;
    admin.reset_token_hash = undefined;
    admin.reset_token_expires_at = undefined;
    admin.failed_login_attempts = 0;
    admin.locked_until = undefined;
    this.logAuditAction('PLATFORM_SECURITY', admin.full_name, 'SUPER_ADMIN', 'PASSWORD_RESET_TOKEN_USED', { email: clean });
    return { success: true };
  }

  changeAdminPassword(email: string, currentPassword: string, newPassword: string): { success: boolean; error?: string } {
    const clean = email.toLowerCase().trim();
    const admin = this.superAdmins.find(sa => sa.email.toLowerCase().trim() === clean && sa.status === 'ACTIVE');
    if (!admin || !admin.password_hash || !admin.password_salt) {
      return { success: false, error: 'Admin account not found or uninitialized.' };
    }
    const isMatch = PasswordService.verifyPassword(currentPassword, admin.password_hash, admin.password_salt);
    if (!isMatch) {
      return { success: false, error: 'Current password does not match.' };
    }
    const policy = PasswordService.validatePolicy(newPassword);
    if (!policy.valid) {
      return { success: false, error: policy.error };
    }
    const { hash, salt } = PasswordService.hashPassword(newPassword);
    admin.password_hash = hash;
    admin.password_salt = salt;
    admin.failed_login_attempts = 0;
    admin.locked_until = undefined;
    this.logAuditAction('PLATFORM_SECURITY', admin.full_name, 'SUPER_ADMIN', 'PASSWORD_CHANGED', { email: clean });
    return { success: true };
  }

  resolveUserByCredentials(email: string, password?: string): { profile: Profile; shop?: Shop } | null {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    const profile = this.profiles.find(p => p.email.toLowerCase().trim() === clean && p.role !== 'SUPER_ADMIN');
    if (!profile) return null;
    if (password && profile.password_hash && profile.password_salt) {
      const isMatch = PasswordService.verifyPassword(password, profile.password_hash, profile.password_salt);
      if (!isMatch) return null;
    }
    const shop = this.getShop(profile.shop_id);
    return { profile, shop };
  }
}

export const store = new AppDataStore();
