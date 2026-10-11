import { Router } from 'express';
import { MetaIntegrationService } from '../services/metaIntegrationService.js';
import { store } from '../db/store.js';
import { MetaSocialChannel } from '../types.js';

export const metaIntegrationRoutes = Router();

// Helper to get active shopId
function getShopId(req: any): string {
  return (req.headers['x-shop-id'] as string) || (req.query.shop_id as string) || 'shop-saha-electronics-001';
}

function parseChannel(param: string): MetaSocialChannel {
  const norm = (param || '').toUpperCase().trim();
  if (norm === 'FACEBOOK' || norm === 'FACEBOOK_PAGE') return 'FACEBOOK_PAGE';
  if (norm === 'INSTAGRAM') return 'INSTAGRAM';
  if (norm === 'AD_ACCOUNT' || norm === 'AD-ACCOUNT' || norm === 'ADS') return 'AD_ACCOUNT';
  if (norm === 'LEAD_FORMS' || norm === 'LEAD-FORMS') return 'LEAD_FORMS';
  return norm as MetaSocialChannel;
}

// 1. GET Settings / Cards for Shop
metaIntegrationRoutes.get('/', (req, res) => {
  try {
    const shopId = getShopId(req);
    const settings = MetaIntegrationService.getSettings(shopId);
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. POST Test Connection Health-Check
metaIntegrationRoutes.post('/:channel/test', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const channel = parseChannel(req.params.channel);
    const result = await MetaIntegrationService.testConnection(shopId, channel);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST Reconnect / Mock Connect
metaIntegrationRoutes.post('/:channel/reconnect', (req, res) => {
  try {
    const shopId = getShopId(req);
    const channel = parseChannel(req.params.channel);
    const mode = req.body.mode === 'LIVE_CONNECTED' ? 'LIVE_CONNECTED' : 'MOCK_MODE';
    const updatedCard = MetaIntegrationService.reconnect(shopId, channel, mode);
    res.json({ success: true, data: updatedCard });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. POST Disconnect
metaIntegrationRoutes.post('/:channel/disconnect', (req, res) => {
  try {
    const shopId = getShopId(req);
    const channel = parseChannel(req.params.channel);
    const updatedCard = MetaIntegrationService.disconnect(shopId, channel);
    res.json({ success: true, data: updatedCard });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. GET Ingested Social Comments for Social Leads Dashboard
metaIntegrationRoutes.get('/comments', (req, res) => {
  try {
    const shopId = getShopId(req);
    const comments = store.getSocialComments(shopId);
    res.json({ success: true, data: comments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. GET OAuth Initiation URL
metaIntegrationRoutes.get('/oauth-start/:channel', (req, res) => {
  try {
    const shopId = getShopId(req);
    const channel = req.params.channel.toUpperCase() as MetaSocialChannel;
    const clientId = 'MOCK_META_APP_ID';
    const clientBase = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : 'http://localhost:5173';
    const redirectUri = encodeURIComponent(`${clientBase}/settings?tab=meta-social&auth_success=true&channel=${channel}`);
    const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_manage_comments`;
    res.json({ success: true, oauth_url: oauthUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
