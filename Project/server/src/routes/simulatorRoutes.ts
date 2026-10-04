import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';

const router = Router();

// Inject customer reply to simulate Meta webhook
router.post('/simulate-reply', async (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const { customerPhone, messageText, profileName, socialUserId, platform } = req.body;

  if (!customerPhone || !messageText) {
    res.status(400).json({ error: 'customerPhone and messageText are required' });
    return;
  }

  // Format as Meta Cloud API incoming webhook payload
  const webhookPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '109823485764832',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+919830012345',
                phone_number_id: '109823485764832'
              },
              contacts: [
                {
                  profile: { name: profileName || 'Customer Simulator' },
                  wa_id: customerPhone.replace('+', '')
                }
              ],
              messages: [
                {
                  from: customerPhone.replace('+', ''),
                  id: `wamid.sim_${Date.now()}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  text: { body: messageText },
                  type: 'text',
                  profile: { name: profileName },
                  social_user_id: socialUserId,
                  platform: platform
                }
              ]
            },
            field: 'messages'
          }
        ]
      }
    ]
  };

  try {
    // Send to our own webhook handler internally
    const webhookUrl = `http://localhost:${process.env.PORT || 3001}/api/webhooks/whatsapp`;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shop-id': shopId
      },
      body: JSON.stringify(webhookPayload)
    });

    const data = await response.json();
    res.json({
      success: true,
      simulationResult: data,
      message: 'Simulated customer reply processed through webhook pipeline successfully!'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Simulator failed: ' + err.message });
  }
});

// Reset demo state
router.post('/reset', (req: Request, res: Response) => {
  store.shops = [];
  store.profiles = [];
  store.customers = [];
  store.customerImports = [];
  store.consentEvents = [];
  store.products = [];
  store.offers = [];
  store.campaigns = [];
  store.campaignRecipients = [];
  store.conversations = [];
  store.messages = [];
  store.leads = [];
  store.sales = [];
  store.shopSettings = {};
  store.integrationSettings = {};

  store.seedDemoShop();

  res.json({ success: true, message: 'Demo shop re-seeded to initial pristine state.' });
});

export default router;
