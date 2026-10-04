import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { WhatsAppService } from '../services/whatsappService.js';
import { AIService } from '../services/aiService.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List conversations with tab filtering
router.get('/', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  let convs = store.getConversations(shopId);
  const { tab, search } = req.query;

  if (search) {
    const q = String(search).toLowerCase();
    convs = convs.filter(c => 
      c.customer_name.toLowerCase().includes(q) || 
      c.customer_phone.includes(q) ||
      c.interested_product.toLowerCase().includes(q)
    );
  }

  if (tab === 'hot_leads') {
    convs = convs.filter(c => c.interest_level === 'HOT' || c.lead_score >= 70);
  } else if (tab === 'needs_human') {
    convs = convs.filter(c => c.is_human_takeover || c.intent === 'NEEDS_HUMAN');
  } else if (tab === 'ai_handled') {
    convs = convs.filter(c => !c.is_human_takeover && c.status === 'ACTIVE');
  } else if (tab === 'resolved') {
    convs = convs.filter(c => c.status === 'RESOLVED');
  }

  // Sort by latest message
  convs.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

  res.json(convs);
});

// Single conversation with message thread & customer 360 context
router.get('/:id', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const conv = store.conversations.find(c => c.id === req.params.id && c.shop_id === shopId);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const messages = store.messages
    .filter(m => m.conversation_id === conv.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const customer = store.customers.find(c => c.id === conv.customer_id);
  const lead = store.leads.find(l => l.customer_id === conv.customer_id && l.status === 'OPEN');
  const shop = store.getShop(shopId);
  const offers = store.getOffers(shopId);
  const settings = store.shopSettings[shopId];

  res.json({
    conversation: conv,
    messages,
    customer,
    lead,
    shop,
    offers,
    settings
  });
});

// Send manual reply from inbox or accept AI suggested reply
router.post('/:id/reply', async (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const { text, isAiGenerated } = req.body;

  const conv = store.conversations.find(c => c.id === req.params.id && c.shop_id === shopId);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const customer = store.customers.find(c => c.id === conv.customer_id);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  if (customer.do_not_contact) {
    res.status(400).json({ error: 'Customer has opted out of communications' });
    return;
  }

  const integration = store.integrationSettings[shopId] || {
    id: uuidv4(),
    shop_id: shopId,
    provider: 'MOCK',
    phone_number_id: 'mock',
    waba_id: 'mock',
    access_token: '',
    webhook_secret: '',
    status: 'CONNECTED',
    last_sync_at: new Date().toISOString()
  };

  const sendRes = await WhatsAppService.dispatchMessage(
    { to: conv.customer_phone, text },
    integration
  );

  const now = new Date().toISOString();
  const msg = {
    id: uuidv4(),
    shop_id: shopId,
    conversation_id: conv.id,
    direction: 'OUTBOUND' as const,
    sender_phone: '+919830012345',
    recipient_phone: conv.customer_phone,
    provider_message_id: sendRes.providerMessageId,
    body: text,
    status: sendRes.status,
    ai_generated: !!isAiGenerated,
    created_at: now
  };

  store.messages.push(msg);
  conv.last_message_at = now;
  conv.updated_at = now;

  res.json({ success: true, message: msg, sendResult: sendRes });
});

// Human handoff & takeover toggles
router.post('/:id/takeover', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const { is_human_takeover, assigned_to } = req.body;

  const conv = store.conversations.find(c => c.id === req.params.id && c.shop_id === shopId);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  conv.is_human_takeover = is_human_takeover ?? !conv.is_human_takeover;
  if (assigned_to !== undefined) {
    conv.assigned_to = assigned_to;
  }
  conv.updated_at = new Date().toISOString();

  res.json({ success: true, conversation: conv });
});

// Mark conversation resolved
router.post('/:id/resolve', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const conv = store.conversations.find(c => c.id === req.params.id && c.shop_id === shopId);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  conv.status = conv.status === 'RESOLVED' ? 'ACTIVE' : 'RESOLVED';
  conv.updated_at = new Date().toISOString();

  res.json({ success: true, conversation: conv });
});

export default router;
