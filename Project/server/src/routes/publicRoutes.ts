import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { normalizeIndianPhone } from '../services/phoneNormalizer.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get public shop details for opt-in page
router.get('/optin/:slug', (req: Request, res: Response) => {
  const shop = store.shops.find(s => s.slug === req.params.slug && s.active_status);
  if (!shop) {
    res.status(404).json({ error: 'Shop not found or inactive' });
    return;
  }

  const activeOffers = store.getOffers(shop.id).filter(o => o.active_status).slice(0, 2);

  res.json({
    shop: {
      name: shop.name,
      slug: shop.slug,
      phone: shop.phone,
      address: shop.address,
      city: shop.city,
      business_hours: shop.business_hours
    },
    featuredOffers: activeOffers
  });
});

// Submit customer consent via public landing page
router.post('/optin/:slug', (req: Request, res: Response) => {
  const shop = store.shops.find(s => s.slug === req.params.slug && s.active_status);
  if (!shop) {
    res.status(404).json({ error: 'Shop not found' });
    return;
  }

  const { full_name, phone, consent } = req.body;

  if (!consent) {
    res.status(400).json({ error: 'Consent checkbox is required to join WhatsApp VIP Club' });
    return;
  }

  const phoneRes = normalizeIndianPhone(phone);
  if (!phoneRes.valid) {
    res.status(400).json({ error: phoneRes.error || 'Invalid Indian mobile number' });
    return;
  }

  const nowStr = new Date().toISOString();
  let customer = store.customers.find(c => c.phone_e164 === phoneRes.phone_e164 && c.shop_id === shop.id);

  if (customer) {
    customer.whatsapp_opt_in = true;
    customer.do_not_contact = false;
    customer.opt_in_at = nowStr;
    customer.opt_in_source = 'WEBSITE_FORM';
    customer.updated_at = nowStr;
  } else {
    customer = {
      id: uuidv4(),
      shop_id: shop.id,
      full_name: full_name || 'VIP Member',
      phone_e164: phoneRes.phone_e164,
      language: 'bn',
      location: shop.city,
      product_category: 'Electronics',
      brand: 'General',
      model: 'In-Store VIP Member',
      purchase_date: nowStr.slice(0, 10),
      purchase_value: 0,
      tags: ['VIP Opt-in', 'Web Form'],
      whatsapp_opt_in: true,
      opt_in_at: nowStr,
      opt_in_source: 'WEBSITE_FORM',
      do_not_contact: false,
      last_campaign_at: null,
      last_reply_at: null,
      engagement_score: 30,
      lead_status: 'NEW',
      created_at: nowStr,
      updated_at: nowStr
    };
    store.customers.push(customer);
  }

  // Audit trail
  store.consentEvents.push({
    id: uuidv4(),
    shop_id: shop.id,
    customer_id: customer.id,
    type: 'OPT_IN',
    source: 'WEBSITE_FORM',
    evidence_reference: `Public Opt-in Landing Page (/optin/${shop.slug}) Form Checkbox`,
    created_at: nowStr
  });

  res.json({
    success: true,
    message: `Welcome to ${shop.name} WhatsApp VIP Club! You will receive exclusive local tech offers.`
  });
});

export default router;
