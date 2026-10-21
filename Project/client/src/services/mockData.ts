export const MOCK_DASHBOARD = {
  shop: {
    id: "shop-saha-electronics-001",
    name: "Saha Electronics",
    slug: "saha-electronics",
    phone: "+919830012345",
    address: "142 Bipin Bihari Ganguly Street, Bowbazar",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700012",
    business_hours: "Mon-Sat: 10:00 AM - 9:00 PM | Sun: 11:00 AM - 6:00 PM",
    business_type: "MOBILE_ELECTRONICS",
    plan: "GROWTH",
    operating_mode: "SHOP_MANAGED",
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
    created_at: "2024-01-10T00:00:00.000Z"
  },
  primaryKpis: {
    newLeads: 4,
    hotLeads: 2,
    todayVisits: 2,
    confirmedSales: 2,
    attributedRevenue: 78989
  },
  occasionKpis: {
    todayBirthdays: 3,
    todayWeddingAnniversaries: 2,
    todayPurchaseAnniversaries: 1,
    upcomingOccasions: 3,
    occasionOfferRedemptions: 0,
    occasionAttributedRevenue: 0
  },
  kpiCards: {
    totalCustomers: 16,
    optedInCustomers: 11,
    campaignsSent: 3,
    messagesDelivered: 28,
    replies: 7,
    interestedCustomers: 5,
    hotLeads: 2,
    storeVisitIntent: 2,
    confirmedSales: 2,
    attributedRevenue: 78989,
    todayBirthdays: 3,
    todayWeddingAnniversaries: 2,
    todayPurchaseAnniversaries: 1,
    upcomingOccasions: 3,
    occasionOfferRedemptions: 0
  },
  actionCenterItems: [
    {
      id: "hot-leads-followup",
      type: "HOT_LEADS",
      count: 2,
      title: "2 Hot Leads Need Follow-Up",
      description: "High-intent customers asking for exchange bonus or pricing within the last 24h.",
      severity: "HIGH",
      badge: "Immediate Revenue",
      actions: [
        { label: "VIEW", action: "NAVIGATE", target: "inbox", payload: { tab: "hot_leads" } },
        { label: "CALL", action: "CALL", target: "+919830123456" }
      ]
    },
    {
      id: "store-visits-today",
      type: "VISIT_INTENT",
      count: 2,
      title: "2 Customers May Visit Today",
      description: "Confirmed intent to inspect devices or sofas in the showroom today.",
      severity: "HIGH",
      badge: "Store Footfall",
      actions: [
        { label: "VIEW", action: "NAVIGATE", target: "inbox", payload: { filter: "visit" } },
        { label: "MARK VISITED", action: "MARK_VISITED" }
      ]
    },
    {
      id: "birthdays-today",
      type: "BIRTHDAY",
      count: 3,
      title: "3 Customer Birthdays Today",
      description: "Customers: Anirban Mukherjee, Arindam Dutta, Pritam Paul. Automated greeting & offer ready.",
      severity: "MEDIUM",
      badge: "Occasion Celebration",
      actions: [
        { label: "SEND GREETING", action: "TRIGGER_OCCASION_JOB", target: "BIRTHDAY" },
        { label: "VIEW OCCASION OFFER", action: "NAVIGATE", target: "automated-occasions", payload: { tab: "offers" } }
      ]
    },
    {
      id: "wedding-anniversaries-today",
      type: "WEDDING_ANNIVERSARY",
      count: 2,
      title: "2 Wedding Anniversaries Today",
      description: "Customers: Debolina Roy, Bikash Mondal. Gift discount ready.",
      severity: "MEDIUM",
      badge: "Loyalty Retention",
      actions: [
        { label: "SEND GREETING", action: "TRIGGER_OCCASION_JOB", target: "WEDDING_ANNIVERSARY" },
        { label: "VIEW OCCASION OFFER", action: "NAVIGATE", target: "automated-occasions", payload: { tab: "offers" } }
      ]
    },
    {
      id: "campaign-eligible-customers",
      type: "CAMPAIGN_ELIGIBLE",
      count: 11,
      title: "11 Customers Eligible For New Campaign",
      description: "Verified active WhatsApp marketing consent, not in 14-day anti-spam cooldown.",
      severity: "LOW",
      badge: "Audience Ready",
      actions: [
        { label: "CREATE CAMPAIGN", action: "NAVIGATE", target: "campaigns" }
      ]
    }
  ],
  funnel: {
    audience: 11,
    delivered: 10,
    replied: 4,
    interested: 3,
    hotLeads: 2,
    storeVisits: 2,
    sales: 2,
    attributedRevenue: 78989
  },
  hotLeadsToday: [
    {
      id: "d401c799-80ff-4d6a-9b3d-51a2564dadfa",
      shop_id: "shop-saha-electronics-001",
      customer_id: "cust-001",
      channel: "WHATSAPP",
      source_channel: "WhatsApp",
      source_type: "CAMPAIGN",
      source_campaign: "Samsung Galaxy Upgrade Fest (18+ Mo Customers)",
      first_touch_source: "WhatsApp Campaign",
      last_touch_source: "WhatsApp",
      customer_name: "Anirban Mukherjee",
      customer_phone: "+919830123456",
      product: "Samsung Galaxy S24 FE 5G",
      interested_product: "Samsung Galaxy S24 FE 5G",
      intent: "EXCHANGE_ENQUIRY",
      interest_level: "HOT",
      lead_score: 85,
      recommended_action: "Customer visiting store tomorrow for exchange valuation. Keep Galaxy S24 FE demo ready.",
      status: "OPEN",
      lead_status: "HOT",
      last_message: "Amar purono Galaxy M31 exchange hobe? Kal dokane aschi exchange korte.",
      created_at: "2026-10-20T09:05:12.966Z",
      updated_at: "2026-10-21T07:18:32.966Z"
    },
    {
      id: "0f13bceb-bd90-4ea5-a60f-0f83833c93b2",
      shop_id: "shop-saha-electronics-001",
      customer_id: "cust-ig-002",
      channel: "INSTAGRAM",
      source_channel: "Instagram",
      source_type: "POST_COMMENT",
      source_post: "ig_reel_camera_test",
      source_comment: "Is 0% No Cost EMI available with debit cards?",
      first_touch_source: "Instagram Showcase Reel",
      last_touch_source: "Instagram Direct Message",
      customer_name: "Rohan Sen",
      customer_phone: "+919830776655",
      product: "Samsung Galaxy S24 FE 5G",
      interested_product: "Samsung Galaxy S24 FE 5G",
      intent: "EMI_ENQUIRY",
      interest_level: "HOT",
      lead_score: 78,
      recommended_action: "Customer visiting store for Bajaj Finserv 0% EMI scheme",
      status: "VISITED",
      lead_status: "HOT",
      last_message: "Kal asbo documents niye Bajaj EMI er jonno",
      created_at: "2026-10-21T00:21:52.966Z",
      updated_at: "2026-10-21T07:18:32.966Z"
    }
  ]
};

export const MOCK_ATTRIBUTION = {
  summary: {
    totalRevenue: 78989,
    totalSales: 2,
    totalLeads: 4,
    topChannel: "WhatsApp Marketing"
  },
  channelBreakdown: [
    {
      channel: "WhatsApp",
      displayName: "WhatsApp Broadcast & AI Engagement",
      revenue: 41999,
      sales: 1,
      leads: 2,
      roi: "12.4x",
      metrics: { hotLeads: 1, storeVisits: 1, sales: 1 }
    },
    {
      channel: "Instagram",
      displayName: "Instagram Reels & Direct Comments",
      revenue: 36990,
      sales: 1,
      leads: 2,
      roi: "8.6x",
      metrics: { hotLeads: 1, storeVisits: 1, sales: 1 }
    }
  ]
};

export const MOCK_CROSS_SHOP = {
  totals: {
    totalRevenue: 185000,
    totalShops: 2,
    totalCustomers: 32,
    totalSales: 5
  },
  shopComparison: [
    {
      id: "shop-saha-electronics-001",
      name: "Saha Electronics",
      city: "Kolkata",
      business_type: "MOBILE_ELECTRONICS",
      revenue: 78989,
      sales: 2,
      customers: 16
    },
    {
      id: "shop-furniture-002",
      name: "Royal Teak & Home Decor",
      city: "Kolkata",
      business_type: "FURNITURE",
      revenue: 106011,
      sales: 3,
      customers: 16
    }
  ]
};

export const MOCK_CUSTOMERS = [
  {
    id: "cust-001",
    shop_id: "shop-saha-electronics-001",
    name: "Anirban Mukherjee",
    phone: "+919830123456",
    whatsapp_opt_in: true,
    whatsapp_opt_in_source: "BILLING_DESK",
    city: "Kolkata",
    preferred_language: "BENGALI",
    tags: ["LOYAL_CUSTOMER", "PREMIUM_BUYER"],
    last_purchase_date: "2023-04-12",
    total_spent: 42500,
    purchased_brand: "Samsung",
    birthday: "1988-10-21",
    created_at: "2023-04-12T10:00:00Z"
  },
  {
    id: "cust-002",
    shop_id: "shop-saha-electronics-001",
    name: "Sneha Roy",
    phone: "+919830234567",
    whatsapp_opt_in: true,
    whatsapp_opt_in_source: "QR_OPTIN",
    city: "Howrah",
    preferred_language: "ENGLISH",
    tags: ["SOCIAL_LEAD", "EXCHANGE_SEEKER"],
    last_purchase_date: "2023-08-20",
    total_spent: 18999,
    purchased_brand: "Vivo",
    birthday: "1994-11-05",
    created_at: "2023-08-20T11:00:00Z"
  },
  {
    id: "cust-003",
    shop_id: "shop-saha-electronics-001",
    name: "Debolina Roy",
    phone: "+919830345678",
    whatsapp_opt_in: true,
    whatsapp_opt_in_source: "IN_STORE",
    city: "Salt Lake",
    preferred_language: "BENGALI",
    tags: ["VIP"],
    last_purchase_date: "2023-01-15",
    total_spent: 85000,
    purchased_brand: "Apple",
    wedding_anniversary: "2018-10-21",
    created_at: "2023-01-15T12:00:00Z"
  }
];

export const MOCK_PRODUCTS = [
  {
    id: "prod-samsung-s24fe",
    shop_id: "shop-saha-electronics-001",
    name: "Samsung Galaxy S24 FE 5G (8GB/256GB)",
    category: "Smartphones",
    brand: "Samsung",
    price: 59999,
    offer_price: 52999,
    stock: 14,
    tags: ["FLAGSHIP", "FESTIVE_SPECIAL", "EXCHANGE_BONUS"],
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "prod-vivo-v30pro",
    shop_id: "shop-saha-electronics-001",
    name: "Vivo V30 Pro 5G (Zeiss Camera)",
    category: "Smartphones",
    brand: "Vivo",
    price: 46999,
    offer_price: 41999,
    stock: 8,
    tags: ["CAMERA_PHONE", "HOT_SELLER"],
    created_at: "2024-01-01T00:00:00Z"
  }
];

export const MOCK_META_INTEGRATIONS = [
  {
    channel: "FACEBOOK_PAGE",
    account_name: "Saha Electronics (Official Facebook Page)",
    account_id: "fb_page_saha_001",
    status: "CONNECTED",
    mode: "MOCK_MODE",
    last_sync: new Date().toISOString(),
    metrics: { comments: 42, leads: 18, reach: 14200 }
  },
  {
    channel: "INSTAGRAM",
    account_name: "@sahaelectronics.kolkata",
    account_id: "ig_saha_001",
    status: "CONNECTED",
    mode: "MOCK_MODE",
    last_sync: new Date().toISOString(),
    metrics: { comments: 85, leads: 29, reach: 29500 }
  }
];

export const MOCK_CONVERSATIONS = [
  {
    id: "conv-001",
    shop_id: "shop-saha-electronics-001",
    customer_id: "cust-001",
    customer_name: "Anirban Mukherjee",
    customer_phone: "+919830123456",
    channel: "WHATSAPP",
    status: "OPEN",
    interest_level: "HOT",
    last_message: "Amar purono Galaxy M31 exchange hobe? Kal dokane aschi.",
    last_message_at: new Date().toISOString(),
    unread: true,
    messages: [
      {
        id: "msg-1",
        sender: "CUSTOMER",
        text: "Amar purono Galaxy M31 exchange hobe? Kal dokane aschi.",
        timestamp: new Date().toISOString()
      }
    ]
  }
];