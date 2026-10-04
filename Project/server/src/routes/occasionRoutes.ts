import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { OccasionService } from '../services/occasionService.js';
import { AIService } from '../services/aiService.js';
import { OccasionType, OccasionAutomationSettings } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 1. Get Occasion Settings & Backend Offer Configurations
router.get('/settings', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const settings = store.getOccasionSettings(shopId) || {
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
    offers: {
      birthday: { enabled: false },
      wedding_anniversary: { enabled: false },
      purchase_anniversary: { enabled: false }
    },
    updated_at: new Date().toISOString()
  };
  res.json(settings);
});

// 2. Update Occasion Settings & Special Offers
router.put('/settings', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const incoming = req.body as Partial<OccasionAutomationSettings>;

  const current = store.getOccasionSettings(shopId) || {
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
    offers: {
      birthday: { enabled: false },
      wedding_anniversary: { enabled: false },
      purchase_anniversary: { enabled: false }
    }
  } as any;

  store.occasionSettings[shopId] = {
    ...current,
    ...incoming,
    shop_id: shopId,
    updated_at: new Date().toISOString()
  };

  store.logSystemEvent({
    name: 'Occasion Settings & Special Offers Updated',
    shop_id: shopId,
    source: 'OCCASION_SETTINGS',
    status: 'SUCCESS',
    payload: {
      birthday_enabled: store.occasionSettings[shopId].birthday_enabled,
      wedding_anniversary_enabled: store.occasionSettings[shopId].wedding_anniversary_enabled,
      purchase_anniversary_enabled: store.occasionSettings[shopId].purchase_anniversary_enabled,
      birthday_offer_active: store.occasionSettings[shopId].offers?.birthday?.enabled,
      anniversary_offer_active: store.occasionSettings[shopId].offers?.wedding_anniversary?.enabled
    }
  });

  res.json({
    success: true,
    settings: store.occasionSettings[shopId],
    message: 'Occasion automation settings and backend offer configurations saved.'
  });
});

// 3. Get Due & Upcoming Occasions (Today + Next 7 Days)
router.get('/due', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const { days = '7' } = req.query;
  const numDays = Math.min(Math.max(parseInt(days as string) || 7, 0), 30);

  const today = new Date();
  const todayDue = OccasionService.getDueOccasions(shopId, today, 0);

  // Next X days
  const upcomingList: Array<{ dayOffset: number; dateStr: string; items: any[] }> = [];
  for (let d = 1; d <= numDays; d++) {
    const futureDate = new Date(today.getTime() + d * 86400000);
    const items = OccasionService.getDueOccasions(shopId, today, d);
    if (items.length > 0) {
      upcomingList.push({
        dayOffset: d,
        dateStr: futureDate.toISOString().slice(0, 10),
        items
      });
    }
  }

  res.json({
    today: {
      dateStr: today.toISOString().slice(0, 10),
      count: todayDue.length,
      items: todayDue
    },
    upcoming: upcomingList,
    totalUpcomingCount: upcomingList.reduce((acc, u) => acc + u.items.length, 0)
  });
});

// 4. Send Individual Occasion Greeting (or Manual Send from UI)
router.post('/send-greeting', async (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const { 
    customer_id, 
    occasion_type, 
    custom_message, 
    bypass_quiet_hours = true, 
    bypass_idempotency = false 
  } = req.body;

  if (!customer_id || !occasion_type) {
    res.status(400).json({ error: 'customer_id and occasion_type are required' });
    return;
  }

  const customer = store.customers.find(c => c.id === customer_id && c.shop_id === shopId);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found in this shop' });
    return;
  }

  const result = await OccasionService.sendOccasionGreeting(
    shopId,
    customer,
    occasion_type as OccasionType,
    custom_message,
    bypass_quiet_hours === true,
    bypass_idempotency === true
  );

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error
    });
    return;
  }

  res.json({
    success: true,
    log: result.log,
    message: `${occasion_type} greeting dispatched successfully to ${customer.full_name}.`
  });
});

// 5. Trigger Daily Occasion Job
router.post('/run-daily-job', async (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const { bypass_quiet_hours = true } = req.body;

  const result = await OccasionService.runDailyOccasionScan(
    shopId,
    new Date(),
    bypass_quiet_hours === true
  );

  res.json({
    success: true,
    summary: result,
    message: `Daily occasion scan completed: ${result.sentCount} sent, ${result.skippedCount} skipped.`
  });
});

// 6. Occasion Logs & Redemption History
router.get('/logs', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const logs = store.getOccasionLogs(shopId);
  res.json(logs);
});

// 7. Grounded AI Occasion Message Generator
router.post('/generate-ai-copy', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const { occasion_type, customer_id, language = 'bn' } = req.body;

  const shop = store.getShop(shopId);
  const settings = store.getOccasionSettings(shopId);
  const customer = customer_id ? store.customers.find(c => c.id === customer_id) : undefined;

  const dummyCustomer = customer || {
    id: 'dummy',
    shop_id: shopId,
    full_name: 'Rahul da',
    phone_e164: '+919830000000',
    model: 'Galaxy S24 FE',
    brand: 'Samsung',
    product_category: 'Smartphones',
    purchase_date: '2023-01-10',
    purchase_value: 49999,
    whatsapp_opt_in: true,
    do_not_contact: false,
    engagement_score: 80,
    lead_status: 'ENGAGED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as any;

  const compiled = OccasionService.compileOccasionMessage(
    shopId,
    dummyCustomer,
    occasion_type as OccasionType || 'BIRTHDAY'
  );

  res.json({
    bengali: compiled.message,
    english: compiled.message,
    offer_included: compiled.offerIncluded,
    coupon_code: compiled.couponCode,
    discount_details: compiled.discountDetails,
    anti_hallucination_guarantee: 'Grounded strictly in stored backend offer parameters and customer record. No invented prices or discounts.'
  });
});

// 8. Occasion Analytics
router.get('/analytics', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const logs = store.getOccasionLogs(shopId);
  const sales = store.getSales(shopId).filter(s => s.occasion_type || s.coupon_code);

  const birthdayLogs = logs.filter(l => l.occasion_type === 'BIRTHDAY');
  const anniversaryLogs = logs.filter(l => l.occasion_type === 'WEDDING_ANNIVERSARY');
  const purchaseAnniversaryLogs = logs.filter(l => l.occasion_type === 'PURCHASE_ANNIVERSARY');

  const totalSent = logs.length;
  const delivered = logs.filter(l => l.status !== 'FAILED').length;
  const replies = logs.filter(l => l.status === 'REPLIED' || l.replied_at).length;
  const redemptions = logs.filter(l => l.status === 'REDEEMED' || l.redeemed_at).length;
  const totalAttributedRevenue = logs.reduce((acc, l) => acc + (l.attributed_revenue || 0), 0) +
    sales.reduce((acc, s) => acc + (s.sale_amount || 0), 0);

  res.json({
    totalOccasionMessagesSent: totalSent,
    messagesDelivered: delivered,
    customerReplies: replies,
    offerRedemptions: redemptions,
    attributedRevenue: totalAttributedRevenue,
    breakdown: {
      birthday: {
        sent: birthdayLogs.length,
        delivered: birthdayLogs.filter(l => l.status !== 'FAILED').length,
        replies: birthdayLogs.filter(l => l.status === 'REPLIED' || l.replied_at).length,
        redemptions: birthdayLogs.filter(l => l.status === 'REDEEMED').length
      },
      wedding_anniversary: {
        sent: anniversaryLogs.length,
        delivered: anniversaryLogs.filter(l => l.status !== 'FAILED').length,
        replies: anniversaryLogs.filter(l => l.status === 'REPLIED' || l.replied_at).length,
        redemptions: anniversaryLogs.filter(l => l.status === 'REDEEMED').length
      },
      purchase_anniversary: {
        sent: purchaseAnniversaryLogs.length,
        delivered: purchaseAnniversaryLogs.filter(l => l.status !== 'FAILED').length,
        replies: purchaseAnniversaryLogs.filter(l => l.status === 'REPLIED' || l.replied_at).length,
        redemptions: purchaseAnniversaryLogs.filter(l => l.status === 'REDEEMED').length
      }
    }
  });
});

export default router;
