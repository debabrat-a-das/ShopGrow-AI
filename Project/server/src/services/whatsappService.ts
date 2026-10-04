import { IntegrationSettings, MessageDeliveryStatus } from '../types.js';

export interface SendMessagePayload {
  to: string; // E.164 phone e.g. +919830123456
  text: string;
  templateName?: string;
  templateLanguage?: string;
  templateParams?: string[];
}

export interface SendMessageResponse {
  success: boolean;
  providerMessageId: string;
  status: MessageDeliveryStatus;
  error?: string;
}

export interface IWhatsAppProvider {
  sendMessage(payload: SendMessagePayload, config: IntegrationSettings): Promise<SendMessageResponse>;
}

export class MetaWhatsAppCloudAPIProvider implements IWhatsAppProvider {
  async sendMessage(payload: SendMessagePayload, config: IntegrationSettings): Promise<SendMessageResponse> {
    if (!config.phone_number_id || !config.access_token) {
      return {
        success: false,
        providerMessageId: '',
        status: 'FAILED',
        error: 'Meta WhatsApp Cloud API credentials missing (phone_number_id or access_token)'
      };
    }

    try {
      const url = `https://graph.facebook.com/v20.0/${config.phone_number_id}/messages`;
      const bodyPayload = payload.templateName 
        ? {
            messaging_product: 'whatsapp',
            to: payload.to.replace('+', ''),
            type: 'template',
            template: {
              name: payload.templateName,
              language: { code: payload.templateLanguage || 'en' }
            }
          }
        : {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: payload.to.replace('+', ''),
            type: 'text',
            text: { preview_url: false, body: payload.text }
          };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          providerMessageId: '',
          status: 'FAILED',
          error: data?.error?.message || 'Meta API request failed'
        };
      }

      const wamid = data?.messages?.[0]?.id || `wamid_${Date.now()}`;
      return {
        success: true,
        providerMessageId: wamid,
        status: 'SENT'
      };
    } catch (err: any) {
      return {
        success: false,
        providerMessageId: '',
        status: 'FAILED',
        error: err?.message || 'Network exception calling Meta WhatsApp API'
      };
    }
  }
}

export class MockWhatsAppProvider implements IWhatsAppProvider {
  async sendMessage(payload: SendMessagePayload, _config: IntegrationSettings): Promise<SendMessageResponse> {
    // Generate realistic WhatsApp Message ID
    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    const providerMessageId = `wamid.HBgMOTE5ODMwMDEyMzQ1NhUCABEYEkZERT${randomSuffix}==`;

    // Simulate realistic send delay (50ms)
    await new Promise(r => setTimeout(r, 50));

    return {
      success: true,
      providerMessageId,
      status: 'SENT'
    };
  }
}

export class WhatsAppService {
  private static liveProvider = new MetaWhatsAppCloudAPIProvider();
  private static mockProvider = new MockWhatsAppProvider();

  static getProvider(config: IntegrationSettings): IWhatsAppProvider {
    if (config.provider === 'META_CLOUD_API' && config.status === 'CONNECTED' && config.access_token) {
      return this.liveProvider;
    }
    return this.mockProvider;
  }

  static async dispatchMessage(payload: SendMessagePayload, config: IntegrationSettings): Promise<SendMessageResponse> {
    const provider = this.getProvider(config);
    return await provider.sendMessage(payload, config);
  }
}
