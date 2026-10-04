import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { SocialLeadService } from '../services/socialLeadService.js';

const router = Router();

// List social leads
router.get('/leads', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const leads = store.getSocialLeads(shopId);
  res.json(leads);
});

// Simulate social comment (Facebook Ads / Instagram Post)
router.post('/simulate-comment', async (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const { channel, authorName, commentText, sourcePostId, customerPhone } = req.body;

  if (!commentText || !authorName) {
    res.status(400).json({ error: 'commentText and authorName are required' });
    return;
  }

  try {
    const result = await SocialLeadService.processSocialComment({
      shopId,
      channel: channel || 'FACEBOOK',
      authorName,
      commentText,
      sourcePostId: sourcePostId || 'ad_campaign_post_01',
      customerPhone
    });

    res.json({
      success: true,
      result,
      message: 'Social lead processed, AI intent classified, and public/private responses drafted!'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process social comment: ' + err.message });
  }
});

// Invite social lead to WhatsApp VIP club
router.post('/leads/:id/invite-whatsapp', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const lead = store.socialLeads.find(l => l.id === req.params.id && l.shop_id === shopId);
  if (!lead) {
    res.status(404).json({ error: 'Social lead not found' });
    return;
  }

  const shop = store.getShop(shopId);
  const inviteLink = `${req.protocol}://${req.get('host')}/optin/${shop?.slug || 'shop'}`;

  lead.private_reply_sent = `Namaskar ${lead.author_name}! Unlock exclusive VIP showroom discounts & 0% EMI alerts by joining our official WhatsApp club here: ${inviteLink}`;

  res.json({
    success: true,
    inviteLink,
    privateReply: lead.private_reply_sent
  });
});

export default router;
