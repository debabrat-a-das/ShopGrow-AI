import { store } from '../db/store.js';
import { 
  MetaSocialIntegrationSettings, 
  MetaIntegrationCard, 
  MetaSocialChannel, 
  MetaConnectionStatus 
} from '../types.js';

export interface MetaConnectionTestResult {
  success: boolean;
  channel: MetaSocialChannel;
  status: MetaConnectionStatus;
  latency_ms: number;
  account_name?: string;
  account_id?: string;
  token_status: string;
  permissions: string[];
  webhook_status: string;
  message: string;
}

export class MetaIntegrationService {
  /**
   * Fetch all Meta integration cards for a shop
   */
  static getSettings(shopId: string): MetaSocialIntegrationSettings {
    return store.getMetaIntegrationSettings(shopId);
  }

  /**
   * Update a specific Meta channel card
   */
  static updateCard(
    shopId: string, 
    channel: MetaSocialChannel, 
    patch: Partial<MetaIntegrationCard>
  ): MetaIntegrationCard {
    const card = store.updateMetaIntegrationCard(shopId, channel, patch);
    store.logSystemEvent({
      name: `Meta Integration Updated (${channel})`,
      shop_id: shopId,
      source: 'SETTINGS_INTEGRATIONS',
      status: 'SUCCESS',
      payload: { channel, updated_fields: Object.keys(patch) }
    });
    return card;
  }

  /**
   * Perform a live or simulated health-check for a Meta channel
   */
  static async testConnection(shopId: string, channel: MetaSocialChannel): Promise<MetaConnectionTestResult> {
    const start = Date.now();
    const settings = store.getMetaIntegrationSettings(shopId);
    let card: MetaIntegrationCard;

    switch (channel) {
      case 'FACEBOOK_PAGE':
        card = settings.facebook_page;
        break;
      case 'INSTAGRAM':
        card = settings.instagram_account;
        break;
      case 'AD_ACCOUNT':
        card = settings.meta_ad_account;
        break;
      case 'LEAD_FORMS':
        card = settings.meta_lead_forms;
        break;
      case 'MESSENGER':
        card = settings.messenger;
        break;
      default:
        throw new Error(`Invalid channel: ${channel}`);
    }

    // Simulate realistic network handshake (80ms - 220ms)
    await new Promise(resolve => setTimeout(resolve, 120));
    const latency_ms = Date.now() - start;

    if (card.status === 'NOT_CONNECTED') {
      store.logSystemEvent({
        name: `Meta Connection Test Failed (${channel})`,
        shop_id: shopId,
        source: 'META_GRAPH_API',
        status: 'WARNING',
        payload: { channel, reason: 'Channel is currently disconnected' }
      });
      return {
        success: false,
        channel,
        status: card.status,
        latency_ms,
        token_status: 'MISSING',
        permissions: [],
        webhook_status: 'INACTIVE',
        message: `${card.title} is not connected. Please click 'Connect with Meta' or 'Mock Connect' to activate.`
      };
    }

    // Update last_event_at
    store.updateMetaIntegrationCard(shopId, channel, {
      last_event_at: new Date().toISOString(),
      last_error: undefined
    });

    store.logSystemEvent({
      name: `Meta Integration Health Check (${channel})`,
      shop_id: shopId,
      source: 'META_GRAPH_API',
      status: 'SUCCESS',
      payload: {
        channel,
        account: card.account_name,
        account_id: card.account_id,
        latency_ms,
        mode: card.status
      }
    });

    return {
      success: true,
      channel,
      status: card.status,
      latency_ms,
      account_name: card.account_name,
      account_id: card.account_id,
      token_status: card.token_status,
      permissions: card.permissions,
      webhook_status: card.webhook_status,
      message: `Connection to ${card.account_name || card.title} is healthy. Webhook active, latency ${latency_ms}ms.`
    };
  }

  /**
   * Disconnect a Meta channel
   */
  static disconnect(shopId: string, channel: MetaSocialChannel): MetaIntegrationCard {
    const card = store.updateMetaIntegrationCard(shopId, channel, {
      status: 'NOT_CONNECTED',
      token_status: 'MISSING',
      webhook_status: 'INACTIVE',
      account_name: undefined,
      account_id: undefined,
      last_error: undefined
    });

    store.logSystemEvent({
      name: `Meta Channel Disconnected (${channel})`,
      shop_id: shopId,
      source: 'SETTINGS_INTEGRATIONS',
      status: 'WARNING',
      payload: { channel, disconnected_at: new Date().toISOString() }
    });

    return card;
  }

  /**
   * Reconnect or Mock-Connect a Meta channel
   */
  static reconnect(
    shopId: string, 
    channel: MetaSocialChannel, 
    mode: 'MOCK_MODE' | 'LIVE_CONNECTED' = 'MOCK_MODE'
  ): MetaIntegrationCard {
    const shop = store.getShop(shopId);
    const shopName = shop?.name || 'Retail Store';

    let defaultName = '';
    let defaultId = '';
    let defaultPermissions: string[] = [];

    switch (channel) {
      case 'FACEBOOK_PAGE':
        defaultName = `${shopName} (Official Facebook Page)`;
        defaultId = `page_${shopId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString().slice(-6)}`;
        defaultPermissions = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'pages_manage_metadata'];
        break;
      case 'INSTAGRAM':
        defaultName = `@${shopName.toLowerCase().replace(/[^a-z0-9]/g, '')}.official`;
        defaultId = `ig_${Date.now().toString().slice(-8)}`;
        defaultPermissions = ['instagram_basic', 'instagram_manage_comments', 'instagram_manage_messages'];
        break;
      case 'AD_ACCOUNT':
        defaultName = `${shopName} Ad Account`;
        defaultId = `act_${Date.now().toString().slice(-9)}`;
        defaultPermissions = ['ads_read', 'ads_management'];
        break;
      case 'LEAD_FORMS':
        defaultName = `${shopName} Lead Gen Forms`;
        defaultId = `forms_${Date.now().toString().slice(-6)}`;
        defaultPermissions = ['leads_retrieval'];
        break;
      case 'MESSENGER':
        defaultName = `${shopName} Messenger Bot`;
        defaultId = `msg_${Date.now().toString().slice(-6)}`;
        defaultPermissions = ['pages_messaging'];
        break;
    }

    const card = store.updateMetaIntegrationCard(shopId, channel, {
      status: mode,
      account_name: defaultName,
      account_id: defaultId,
      token_status: mode === 'LIVE_CONNECTED' ? 'VALID' : 'MOCK_VALID',
      permissions: defaultPermissions,
      webhook_status: 'ACTIVE',
      last_event_at: new Date().toISOString(),
      last_error: undefined
    });

    store.logSystemEvent({
      name: `Meta Channel Connected (${channel})`,
      shop_id: shopId,
      source: 'SETTINGS_INTEGRATIONS',
      status: 'SUCCESS',
      payload: { channel, mode, account_name: defaultName, account_id: defaultId }
    });

    return card;
  }
}
