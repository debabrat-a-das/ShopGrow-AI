import { UserRole } from '../types';

const API_BASE = '/api';

class ApiService {
  private currentShopId: string = 'shop-saha-electronics-001';
  private currentUserRole: UserRole = 'SHOP_OWNER';
  private authToken: string = '';

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

  async get(endpoint: string, params?: Record<string, any>) {
    let url = `${API_BASE}${endpoint}`;
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

    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async post(endpoint: string, data?: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data || {})
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async put(endpoint: string, data?: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data || {})
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async patch(endpoint: string, data?: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data || {})
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async delete(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async uploadFile(endpoint: string, file: File, extraFields?: Record<string, any>) {
    const formData = new FormData();
    formData.append('file', file);
    if (extraFields) {
      Object.entries(extraFields).forEach(([k, v]) => {
        formData.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      });
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'x-shop-id': this.currentShopId,
        'x-user-role': this.currentUserRole
      },
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return res.json();
  }
}

export const api = new ApiService();
