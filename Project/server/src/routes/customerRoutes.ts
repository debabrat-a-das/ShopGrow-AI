import { Router, Request, Response } from 'express';
import multer from 'multer';
import { store } from '../db/store.js';
import { CustomerImportService } from '../services/customerImportService.js';
import { v4 as uuidv4 } from 'uuid';
import { normalizeIndianPhone } from '../services/phoneNormalizer.js';
import { CustomerImport } from '../types.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// List customers with search, filtering, and pagination
router.get('/', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  let customers = store.getCustomers(shopId);

  const { search, brand, minPurchaseMonths, category, consent, leadStatus, sortBy, sortOrder } = req.query;

  // Search by name or phone
  if (search) {
    const q = String(search).toLowerCase();
    customers = customers.filter(c => 
      c.full_name.toLowerCase().includes(q) || 
      c.phone_e164.includes(q) || 
      c.model.toLowerCase().includes(q)
    );
  }

  // Filter by brand
  if (brand && brand !== 'ALL') {
    customers = customers.filter(c => c.brand.toLowerCase() === String(brand).toLowerCase());
  }

  // Filter by category
  if (category && category !== 'ALL') {
    customers = customers.filter(c => c.product_category.toLowerCase() === String(category).toLowerCase());
  }

  // Filter by consent
  if (consent !== undefined && consent !== 'ALL') {
    const consentBool = consent === 'true';
    customers = customers.filter(c => c.whatsapp_opt_in === consentBool);
  }

  // Filter by leadStatus
  if (leadStatus && leadStatus !== 'ALL') {
    customers = customers.filter(c => c.lead_status === leadStatus);
  }

  // Filter by purchase age in months
  if (minPurchaseMonths) {
    const months = Number(minPurchaseMonths);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    customers = customers.filter(c => new Date(c.purchase_date) <= cutoffDate);
  }

  // Sorting
  customers.sort((a, b) => {
    const fieldA = a[sortBy as keyof typeof a] ?? a.created_at;
    const fieldB = b[sortBy as keyof typeof b] ?? b.created_at;
    if (sortOrder === 'asc') {
      return fieldA > fieldB ? 1 : -1;
    }
    return fieldA < fieldB ? 1 : -1;
  });

  res.json({
    total: customers.length,
    customers
  });
});

// Customer 360 view
router.get('/:id', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const customer = store.customers.find(c => c.id === req.params.id && c.shop_id === shopId);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  const consentHistory = store.consentEvents.filter(ce => ce.customer_id === customer.id);
  const conversations = store.conversations.filter(cv => cv.customer_id === customer.id);
  const salesHistory = store.sales.filter(s => s.customer_id === customer.id);
  const campaignsReceived = store.campaignRecipients.filter(cr => cr.customer_id === customer.id);
  const leads = store.leads.filter(l => l.customer_id === customer.id || l.customer_phone === customer.phone_e164);

  // Build unified customer journey timeline
  const journeyTimeline: Array<{
    id: string;
    type: 'TOUCHPOINT' | 'COMMENT' | 'LEAD_QUALIFIED' | 'CONSENT' | 'CAMPAIGN' | 'DEMO_VISIT' | 'PURCHASE' | 'OCCASION' | 'OFFER_REDEEMED';
    title: string;
    description: string;
    channel: string;
    timestamp: string;
    scoreDelta?: number;
    status?: string;
    metadata?: any;
  }> = [];

  // 1. Initial touchpoint / acquisition
  journeyTimeline.push({
    id: `touch-${customer.id}`,
    type: 'TOUCHPOINT',
    title: `First Touchpoint: ${customer.acquisition_source || customer.source || 'STORE_WALKIN'}`,
    description: `Customer first interacted with ${customer.shop_id} via ${customer.acquisition_source || customer.source || 'In-store inquiry'}. Registered device: ${customer.brand} ${customer.model}`,
    channel: customer.acquisition_source || customer.source || 'WALK_IN',
    timestamp: customer.created_at
  });

  // 2. Consent events
  consentHistory.forEach((ce, i) => {
    journeyTimeline.push({
      id: `consent-${i}-${ce.id || i}`,
      type: 'CONSENT',
      title: ce.type === 'OPT_IN' ? 'WhatsApp Consent Granted' : 'Opt-Out Recorded',
      description: `Opt-in status: ${ce.type} recorded via ${ce.source} (${ce.evidence_reference || 'Self-service verification'})`,
      channel: 'WHATSAPP',
      timestamp: ce.created_at
    });
  });

  // 3. Social leads / Comments / Inquiries
  leads.forEach((ld, i) => {
    const isSocialComment = ld.source_channel === 'Facebook' || ld.source_channel === 'Instagram';
    journeyTimeline.push({
      id: `lead-${ld.id || i}`,
      type: isSocialComment ? 'COMMENT' : 'TOUCHPOINT',
      title: `${ld.source_channel || 'Lead'} Inquiry: ${ld.interested_product || ld.product || 'Product Inquiry'}`,
      description: ld.last_message || `Inquiry created with status [${ld.status}]. Lead interest: ${ld.interest_level || 'WARM'}.`,
      channel: ld.source_channel || ld.channel || 'Facebook',
      timestamp: ld.created_at,
      scoreDelta: ld.interest_level === 'HOT' ? 85 : 60,
      metadata: { post: ld.source_post, comment: ld.source_comment, ad: ld.source_ad }
    });

    if (ld.interest_level === 'HOT' || ld.status === 'WON') {
      journeyTimeline.push({
        id: `lead-hot-${ld.id || i}`,
        type: 'LEAD_QUALIFIED',
        title: `AI Qualification: High Purchase Intent (${ld.interest_level || 'HOT'})`,
        description: `Lead engagement escalated with high purchase intent for ${ld.interested_product || ld.product || 'flagship product'}. Staff prompted for instant WhatsApp follow-up.`,
        channel: 'AI_COPILOT',
        timestamp: new Date(new Date(ld.created_at).getTime() + 1800000).toISOString()
      });
    }

    if (ld.status === 'VISITED' || ld.status === 'WON') {
      journeyTimeline.push({
        id: `demo-${ld.id || i}`,
        type: 'DEMO_VISIT',
        title: 'Showroom Visit & Inspection',
        description: `Customer attended an in-store inspection at the showroom. Staff assisted with device hands-on demo.`,
        channel: 'SHOWROOM',
        timestamp: new Date(new Date(ld.created_at).getTime() + 86400000).toISOString()
      });
    }
  });

  // 4. Campaigns received
  campaignsReceived.forEach((cr, i) => {
    journeyTimeline.push({
      id: `camp-${cr.id || i}`,
      type: 'CAMPAIGN',
      title: `Campaign Message Dispatched (${cr.status})`,
      description: `Targeted WhatsApp broadcast message delivered. Message ID: ${cr.message_id || 'MSG-Q7'}`,
      channel: 'WHATSAPP',
      timestamp: cr.sent_at || cr.delivered_at || new Date().toISOString()
    });
  });

  // 5. Sales / Purchase confirmation
  salesHistory.forEach((s, i) => {
    journeyTimeline.push({
      id: `sale-${s.id || i}`,
      type: 'PURCHASE',
      title: `Purchase Confirmed: ₹${Number(s.sale_amount || 0).toLocaleString('en-IN')}`,
      description: `Invoice recorded for ${s.product || 'Product'}. Attributed channel: ${s.source_channel || s.campaign_id || (s.occasion_type ? `${s.occasion_type} Offer` : 'DIRECT')}. Repeat customer value updated.`,
      channel: 'BILLING_POS',
      timestamp: s.created_at
    });
  });

  // 6. Occasion Greetings & Offer Redemptions
  const customerOccasionLogs = store.occasionLogs.filter(ol => ol.customer_id === customer.id);
  customerOccasionLogs.forEach((ol, i) => {
    journeyTimeline.push({
      id: `occ-${ol.id || i}`,
      type: 'OCCASION',
      title: `${ol.occasion_type === 'BIRTHDAY' ? '🎂 Birthday Greeting' : ol.occasion_type === 'WEDDING_ANNIVERSARY' ? '💐 Wedding Anniversary' : '🎁 Purchase Anniversary'} Dispatched`,
      description: ol.offer_included 
        ? `${ol.message.slice(0, 100)}... [Coupon: ${ol.coupon_code || 'OFFER'}]`
        : ol.message.slice(0, 100),
      channel: ol.channel || 'WHATSAPP',
      timestamp: ol.sent_at,
      status: ol.status
    });

    if (ol.status === 'REDEEMED' && ol.redeemed_at) {
      journeyTimeline.push({
        id: `occ-red-${ol.id || i}`,
        type: 'OFFER_REDEEMED',
        title: `Occasion Offer Redeemed (${ol.coupon_code})`,
        description: `Customer applied celebratory discount at showroom checkout. Attributed revenue: ₹${(ol.attributed_revenue || 0).toLocaleString('en-IN')}`,
        channel: 'BILLING_POS',
        timestamp: ol.redeemed_at
      });
    }
  });

  // Sort timeline chronologically (latest first)
  journeyTimeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({
    customer,
    consentHistory,
    conversations,
    salesHistory,
    campaignsReceived,
    leads,
    occasionHistory: customerOccasionLogs,
    journeyTimeline
  });
});

// Parse spreadsheet and return 8-step preview
router.post('/import/preview', upload.single('file'), (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';

  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    const { headers, rows } = CustomerImportService.parseSpreadsheet(req.file.buffer);
    const suggestedMapping = CustomerImportService.suggestColumnMapping(headers);

    const existingPhones = new Set(store.getCustomers(shopId).map(c => c.phone_e164));
    const summary = CustomerImportService.validateAndProcess(rows, suggestedMapping, shopId, existingPhones);

    res.json({
      headers,
      suggestedMapping,
      summary: {
        totalRows: summary.totalRows,
        validCount: summary.validCount,
        duplicateCount: summary.duplicateCount,
        invalidPhoneCount: summary.invalidPhoneCount,
        noConsentCount: summary.noConsentCount,
        previewRows: summary.previewRows
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to parse file: ' + err.message });
  }
});

// Commit import to store
router.post('/import/commit', upload.single('file'), (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  let mapping = req.body.mapping;
  if (typeof mapping === 'string') {
    mapping = JSON.parse(mapping);
  }

  let rows: any[] = [];
  if (req.file) {
    const parsed = CustomerImportService.parseSpreadsheet(req.file.buffer);
    rows = parsed.rows;
    if (!mapping) {
      mapping = CustomerImportService.suggestColumnMapping(parsed.headers);
    }
  } else if (req.body.rows) {
    rows = req.body.rows;
  }

  if (rows.length === 0) {
    res.status(400).json({ error: 'No data to import' });
    return;
  }

  const existingPhones = new Set(store.getCustomers(shopId).map(c => c.phone_e164));
  const summary = CustomerImportService.validateAndProcess(rows, mapping, shopId, existingPhones);

  // Commit valid customers
  summary.processedCustomers.forEach(customer => {
    store.customers.push(customer);

    if (customer.whatsapp_opt_in) {
      store.consentEvents.push({
        id: uuidv4(),
        shop_id: shopId,
        customer_id: customer.id,
        type: 'OPT_IN',
        source: 'IMPORTED_VERIFIED_CONSENT',
        evidence_reference: `Customer Import File: ${req.file?.originalname || 'batch_upload'}`,
        created_at: new Date().toISOString()
      });
    }
  });

  // Record import audit record
  const importRecord: CustomerImport = {
    id: uuidv4(),
    shop_id: shopId,
    filename: req.file?.originalname || 'batch_upload.xlsx',
    total_rows: summary.totalRows,
    valid_count: summary.validCount,
    duplicate_count: summary.duplicateCount,
    invalid_count: summary.invalidPhoneCount,
    no_consent_count: summary.noConsentCount,
    status: 'COMPLETED',
    created_at: new Date().toISOString()
  };
  store.customerImports.unshift(importRecord);

  res.json({
    success: true,
    importedCount: summary.processedCustomers.length,
    importRecord,
    summary: {
      totalRows: summary.totalRows,
      validCount: summary.validCount,
      duplicateCount: summary.duplicateCount,
      invalidPhoneCount: summary.invalidPhoneCount,
      noConsentCount: summary.noConsentCount
    }
  });
});

// Single customer creation with consent audit
router.post('/', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const { full_name, phone, brand, model, purchase_date, purchase_value, whatsapp_opt_in, consent_source } = req.body;

  const phoneRes = normalizeIndianPhone(phone);
  if (!phoneRes.valid) {
    res.status(400).json({ error: phoneRes.error });
    return;
  }

  const existing = store.getCustomers(shopId).find(c => c.phone_e164 === phoneRes.phone_e164);
  if (existing) {
    res.status(400).json({ error: 'Customer with this phone number already exists in your shop' });
    return;
  }

  const customerId = uuidv4();
  const now = new Date().toISOString();
  const customer = {
    id: customerId,
    shop_id: shopId,
    full_name: full_name || 'Customer',
    phone_e164: phoneRes.phone_e164,
    language: 'bn',
    location: 'Kolkata',
    product_category: 'Electronics',
    brand: brand || 'Samsung',
    model: model || 'Device',
    purchase_date: purchase_date || now.slice(0, 10),
    purchase_value: Number(purchase_value) || 0,
    tags: [brand].filter(Boolean),
    whatsapp_opt_in: !!whatsapp_opt_in,
    opt_in_at: whatsapp_opt_in ? now : null,
    opt_in_source: whatsapp_opt_in ? (consent_source || 'IN_STORE') : null,
    do_not_contact: false,
    last_campaign_at: null,
    last_reply_at: null,
    engagement_score: 20,
    lead_status: 'NEW' as const,
    created_at: now,
    updated_at: now
  };

  store.customers.unshift(customer);

  if (whatsapp_opt_in) {
    store.consentEvents.push({
      id: uuidv4(),
      shop_id: shopId,
      customer_id: customerId,
      type: 'OPT_IN',
      source: consent_source || 'IN_STORE',
      evidence_reference: 'Store Counter Checkbox',
      created_at: now
    });
  }

  res.status(201).json(customer);
});

// Revoke WhatsApp marketing consent / Opt-out
router.patch('/:id/opt-out', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const customer = store.customers.find(c => c.id === req.params.id && c.shop_id === shopId);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  customer.whatsapp_opt_in = false;
  customer.do_not_contact = true;
  customer.updated_at = new Date().toISOString();

  store.consentEvents.push({
    id: uuidv4(),
    shop_id: shopId,
    customer_id: customer.id,
    type: 'OPT_OUT',
    source: 'IN_STORE',
    evidence_reference: 'Customer verbal or digital opt-out request',
    created_at: new Date().toISOString()
  });

  res.json({ success: true, customer });
});

export default router;
