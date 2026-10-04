import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';

const router = Router();

// Get settings for current shop
router.get('/', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const shop = store.getShop(shopId);
  const shopSettings = store.shopSettings[shopId];
  const integration = store.integrationSettings[shopId];
  const team = store.profiles.filter(p => p.shop_id === shopId);

  res.json({
    shop,
    settings: shopSettings,
    integration,
    team
  });
});

// Update shop profile
router.post('/shop', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const shop = store.getShop(shopId);
  if (!shop) {
    res.status(404).json({ error: 'Shop not found' });
    return;
  }

  Object.assign(shop, req.body);
  res.json({ success: true, shop });
});

// Update safety & campaign limits
router.post('/limits', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  let settings = store.shopSettings[shopId];
  if (!settings) {
    res.status(404).json({ error: 'Settings not found' });
    return;
  }

  const { daily_campaign_limit, contact_frequency_days, quiet_hours_start, quiet_hours_end } = req.body;
  if (daily_campaign_limit !== undefined) settings.daily_campaign_limit = Number(daily_campaign_limit);
  if (contact_frequency_days !== undefined) settings.contact_frequency_days = Number(contact_frequency_days);
  if (quiet_hours_start !== undefined) settings.quiet_hours_start = quiet_hours_start;
  if (quiet_hours_end !== undefined) settings.quiet_hours_end = quiet_hours_end;

  res.json({ success: true, settings });
});

// Update FAQs knowledge bank for AI grounding
router.post('/faqs', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  let settings = store.shopSettings[shopId];
  if (!settings) {
    res.status(404).json({ error: 'Settings not found' });
    return;
  }

  const { faqs, ai_guardrails } = req.body;
  if (faqs) settings.faqs = faqs;
  if (ai_guardrails) settings.ai_guardrails = ai_guardrails;

  res.json({ success: true, settings });
});

// Update WhatsApp integration settings
router.post('/whatsapp', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  let integration = store.integrationSettings[shopId];
  if (!integration) {
    res.status(404).json({ error: 'Integration settings not found' });
    return;
  }

  const { provider, phone_number_id, waba_id, access_token, webhook_secret } = req.body;
  if (provider) integration.provider = provider;
  if (phone_number_id !== undefined) integration.phone_number_id = phone_number_id;
  if (waba_id !== undefined) integration.waba_id = waba_id;
  if (access_token !== undefined) integration.access_token = access_token;
  if (webhook_secret !== undefined) integration.webhook_secret = webhook_secret;

  // Check connection status
  if (integration.provider === 'META_CLOUD_API') {
    integration.status = (integration.phone_number_id && integration.access_token) ? 'CONNECTED' : 'CONFIGURATION_ERROR';
  } else {
    integration.status = 'CONNECTED';
  }
  integration.last_sync_at = new Date().toISOString();

  res.json({ success: true, integration });
});

// Get shop branding & background customization
router.get('/branding', (req: Request, res: Response) => {
  const shopId = (req.query.shopId as string) || (req.query.shop_id as string) || (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const branding = store.getShopBranding(shopId);
  res.json({ success: true, branding });
});

// Update shop branding & background customization
router.post('/branding', (req: Request, res: Response) => {
  const shopId = (req.query.shopId as string) || (req.query.shop_id as string) || (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const updated = store.updateShopBranding(shopId, req.body);
  res.json({ success: true, branding: updated });
});

export default router;
