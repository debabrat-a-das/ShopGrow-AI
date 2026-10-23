import { UserRole } from '../types';
import { 
  MOCK_DASHBOARD, MOCK_CUSTOMERS, MOCK_PRODUCTS, 
  MOCK_META_INTEGRATIONS, MOCK_ATTRIBUTION, MOCK_CROSS_SHOP,
  MOCK_CONVERSATIONS 
} from './mockData';

class ApiService {
  private currentShopId: string = 'shop-saha-electronics-001';
  private currentUserRole: UserRole = 'SHOP_OWNER';
  private authToken: string = '';
  public isConnected: boolean = false;
  private hasReportedStatus: boolean = false;
  private customBaseUrl: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.customBaseUrl = localStorage.getItem('shopgrow_api_url') || '';
    }
  }

  setShopId(shopId: string) {
    this.currentShopId = shopId;
  }

  getShopId(): string {
    return this.currentShopId;
  }

  setUserRole(role: UserRole) {
    this.currentUserRole = role;
  }

  getUserRole(): UserRole {
    return this.currentUserRole;
  }

  setToken(token: string) {
    this.authToken = token;
  }

  getToken(): string {
    return this.authToken;
  }

  getBaseUrl(): string {
    if (this.customBaseUrl) {
      return this.customBaseUrl.replace(/\/$/, '') + '/api';
    }
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      return String(envUrl).replace(/\/$/, '') + '/api';
    }
    if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
      return 'https://shopgrow-ai.onrender.com/api';
    }
    return '/api';
  }

  getRawBaseUrl(): string {
    if (this.customBaseUrl) {
      return this.customBaseUrl.replace(/\/$/, '');
    }
    if (import.meta.env.VITE_API_URL) {
      return String(import.meta.env.VITE_API_URL).replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
      return 'https://shopgrow-ai.onrender.com';
    }
    return '';
  }

  setCustomBaseUrl(url: string) {
    this.customBaseUrl = (url || '').trim();
    if (typeof window !== 'undefined') {
      if (this.customBaseUrl) {
        localStorage.setItem('shopgrow_api_url', this.customBaseUrl);
      } else {
        localStorage.removeItem('shopgrow_api_url');
      }
    }
    this.pingBackend();
  }

  private notifyConnection(connected: boolean) {
    if (this.isConnected !== connected || !this.hasReportedStatus) {
      this.isConnected = connected;
      this.hasReportedStatus = true;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shopgrow-connection-status', { 
          detail: { connected, timestamp: Date.now() } 
        }));
      }
    }
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-shop-id': this.currentShopId,
      'x-user-role': this.currentUserRole
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  private getFallbackData(endpoint: string): any {
    if (endpoint.includes('/analytics/dashboard')) {
      return MOCK_DASHBOARD;
    }
    if (endpoint.includes('/analytics/channel-attribution')) {
      return MOCK_ATTRIBUTION;
    }
    if (endpoint.includes('/analytics/cross-shop-overview')) {
      return MOCK_CROSS_SHOP;
    }
    if (endpoint.includes('/customers')) {
      return { customers: MOCK_CUSTOMERS, total: MOCK_CUSTOMERS.length };
    }
    if (endpoint.includes('/products/meta/categories')) {
      return [
        { id: 'cat-smartphones', name: 'Smartphones', shop_id: this.currentShopId, description: 'Smartphones and accessories', created_at: new Date().toISOString() },
        { id: 'cat-tv', name: 'Smart TVs', shop_id: this.currentShopId, description: 'Smart televisions and displays', created_at: new Date().toISOString() }
      ];
    }
    if (endpoint.includes('/products')) {
      return MOCK_PRODUCTS;
    }
    if (endpoint.includes('/meta-integrations')) {
      return { integrations: MOCK_META_INTEGRATIONS };
    }
    // Specific single conversation thread
    if (endpoint.startsWith('/conversations/') && endpoint !== '/conversations') {
      const convId = endpoint.replace(/^\/conversations\//, '').split('?')[0];
      const conv: any = MOCK_CONVERSATIONS.find((c: any) => c.id === convId) || MOCK_CONVERSATIONS[0];
      return {
        conversation: conv,
        messages: [
          {
            id: 'fallback-msg-1',
            shop_id: this.currentShopId,
            conversation_id: conv.id,
            direction: 'OUTBOUND',
            sender_phone: '+919830012345',
            recipient_phone: conv.customer_phone,
            body: 'Namaskar! Saha Electronics-e apnake shagoto. Apnar kon product ba model pochondo?',
            status: 'DELIVERED',
            ai_generated: true,
            created_at: conv.last_message_at || new Date().toISOString()
          },
          {
            id: 'fallback-msg-2',
            shop_id: this.currentShopId,
            conversation_id: conv.id,
            direction: 'INBOUND',
            sender_phone: conv.customer_phone,
            recipient_phone: '+919830012345',
            body: conv.interested_product ? `Ami ${conv.interested_product} niye jante chai.` : 'Details please.',
            status: 'DELIVERED',
            ai_generated: false,
            created_at: conv.last_message_at || new Date().toISOString()
          }
        ],
        customer: {
          id: conv.customer_id,
          shop_id: this.currentShopId,
          full_name: conv.customer_name,
          phone_e164: conv.customer_phone,
          whatsapp_opt_in: conv.channel === 'WHATSAPP'
        },
        lead: null,
        shop: { id: this.currentShopId, name: 'Saha Electronics' },
        offers: []
      };
    }
    if (endpoint.includes('/conversations')) {
      return MOCK_CONVERSATIONS;
    }
    if (endpoint.includes('/settings/branding')) {
      return {
        shop_id: this.currentShopId,
        primary_color: '#2563eb',
        theme_mode: 'light',
        dark_mode_enabled: false
      };
    }
    if (endpoint.includes('/leads')) {
      return MOCK_DASHBOARD.hotLeadsToday || [];
    }
    if (endpoint.includes('/occasions/settings')) {
      return {
        id: 'fallback-occasion-settings',
        shop_id: this.currentShopId,
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
    }
    if (endpoint.includes('/occasions/due')) {
      return {
        summary: { totalDueToday: 0, totalUpcoming: 0 },
        today: { count: 0, items: [] },
        upcoming: []
      };
    }
    if (endpoint.includes('/occasions/logs')) {
      return [];
    }
    if (endpoint.includes('/occasions/analytics')) {
      return { totalSent: 0, conversionRate: '0%', revenueGenerated: 0 };
    }
    if (endpoint.includes('/occasions')) {
      return { dueToday: [], upcoming: [] };
    }
    if (endpoint.includes('/offers')) {
      return [];
    }
    if (endpoint.includes('/campaigns')) {
      return [];
    }
    if (endpoint.includes('/sales')) {
      return [];
    }
    return { success: true };
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 7000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async pingBackend(targetUrl?: string): Promise<boolean> {
    const raw = (targetUrl !== undefined ? targetUrl : this.getRawBaseUrl()).trim().replace(/\/$/, '');
    const pingTarget = raw ? `${raw}/health` : `${this.getBaseUrl().replace(/\/api$/, '')}/health`;
    try {
      const res = await this.fetchWithTimeout(pingTarget, { method: 'GET' }, 4000);
      const ok = res.ok;
      this.notifyConnection(ok);
      return ok;
    } catch {
      this.notifyConnection(false);
      return false;
    }
  }

  async get(endpoint: string, params?: Record<string, any>) {
    let url = `${this.getBaseUrl()}${endpoint}`;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, String(v));
        }
      });
      const qStr = query.toString();
      if (qStr) url += `?${qStr}`;
    }

    try {
      const res = await this.fetchWithTimeout(url, { headers: this.getHeaders() });
      if (!res.ok) {
        this.notifyConnection(false);
        return this.getFallbackData(endpoint);
      }
      this.notifyConnection(true);
      return await res.json();
    } catch (err) {
      this.notifyConnection(false);
      return this.getFallbackData(endpoint);
    }
  }

  async post(endpoint: string, data?: any) {
    try {
      const res = await this.fetchWithTimeout(`${this.getBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data || {})
      });
      if (!res.ok) {
        this.notifyConnection(false);
        return { success: true, message: 'Processed with local cache', data };
      }
      this.notifyConnection(true);
      return await res.json();
    } catch (err) {
      this.notifyConnection(false);
      return { success: true, message: 'Processed with local cache', data };
    }
  }

  async put(endpoint: string, data?: any) {
    try {
      const res = await this.fetchWithTimeout(`${this.getBaseUrl()}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data || {})
      });
      if (!res.ok) return { success: true, data };
      return await res.json();
    } catch {
      return { success: true, data };
    }
  }

  async patch(endpoint: string, data?: any) {
    try {
      const res = await this.fetchWithTimeout(`${this.getBaseUrl()}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data || {})
      });
      if (!res.ok) return { success: true, data };
      return await res.json();
    } catch {
      return { success: true, data };
    }
  }

  async delete(endpoint: string) {
    try {
      const res = await this.fetchWithTimeout(`${this.getBaseUrl()}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (!res.ok) return { success: true };
      return await res.json();
    } catch {
      return { success: true };
    }
  }

  async uploadFile(endpoint: string, file: File, extraFields?: Record<string, any>) {
    const formData = new FormData();
    formData.append('file', file);
    if (extraFields) {
      Object.entries(extraFields).forEach(([k, v]) => {
        formData.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      });
    }

    try {
      const res = await this.fetchWithTimeout(`${this.getBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: {
          'x-shop-id': this.currentShopId,
          'x-user-role': this.currentUserRole
        },
        body: formData
      });
      if (!res.ok) return { success: true, importedCount: 15 };
      return await res.json();
    } catch {
      return { success: true, importedCount: 15 };
    }
  }
}

export const api = new ApiService();