# 📡 ShopGrow AI — API Endpoints & Data Schema Reference

## 1. REST API Endpoints Map

### Authentication & Tenant Security
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public login for Shop Owners, Managers, and Staff. Auto-resolves role & assigned shop. |
| `POST` | `/api/auth/admin-login` | Private Super Admin login against database allowlist. |
| `GET` | `/api/auth/current-user` | Returns current user session and single authorized shop. |

### Super Admin Platform Governance
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/super-admin/shops` | List all registered tenant shops (Super Admin only). |
| `POST` | `/api/super-admin/shops` | Provision a new tenant shop workspace. |
| `GET` | `/api/super-admin/admins` | List all Super Admins in allowlist. |
| `POST` | `/api/super-admin/admins` | Grant Super Admin role (requires explicit confirmation). |
| `PATCH` | `/api/super-admin/admins/:id/status` | Suspend, Reactivate, or Revoke Super Admin access. |

### Settings & Tenant Branding
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/settings/branding` | Fetch tenant background & theme settings (`shopId` scoped). |
| `POST` | `/api/settings/branding` | Save tenant background (Color, Image, Display mode, Overlay). |

### Meta Social & Lead Ingestion
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/meta-integrations/` | Get connected social cards for current shop. |
| `POST` | `/api/meta-integrations/:channel/test` | Test channel connection health & response latency. |
| `POST` | `/api/meta-integrations/:channel/reconnect` | Reconnect channel (supports `MOCK_MODE` and `LIVE_CONNECTED`). |
| `POST` | `/api/meta-integrations/:channel/disconnect` | Disconnect Facebook, Instagram, or Ad Account. |
| `GET` | `/api/meta-integrations/comments` | Retrieve ingested comments for shop. |
| `POST` | `/api/testing/simulate-meta-comment` | Idempotent simulator for inbound social comments. |

### CRM, Campaigns & Operations
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/customers` | Scoped list of shop customers. |
| `POST` | `/api/customers/import` | Bulk customer import with consent validation. |
| `GET` | `/api/offers` | Active promotional offers for shop. |
| `POST` | `/api/campaigns/create-and-approve` | Authorize and queue targeted campaign. |
| `POST` | `/api/campaigns/dispatch` | 5-stage live dispatch stepper to WhatsApp Cloud API. |
| `POST` | `/api/campaigns/send-to-all` | Broad product-awareness campaign to all customers. |
| `GET` | `/api/conversations` | Multi-turn Unified Inbox customer threads. |
| `POST` | `/api/sales` | Record walk-in customer sale & attribute to campaign. |
| `GET` | `/api/occasions` | Automated lifecycle occasions (birthdays, anniversaries). |

---

## 2. Core Entities Schema

### Shop (`Shop`)
```typescript
interface Shop {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  business_type: BusinessType;
  plan: SubscriptionPlan;
  operating_mode: OperatingMode;
  feature_flags: Record<string, boolean>;
  active_status: boolean;
  created_at: string;
}
```

### Shop Branding (`ShopBranding`)
```typescript
interface ShopBranding {
  shop_id: string;
  bg_type: 'DEFAULT_WHITE' | 'CUSTOM_COLOR' | 'CUSTOM_IMAGE';
  bg_color: string;
  bg_image_url?: string;
  bg_display: 'cover' | 'contain' | 'center' | 'top' | 'no-repeat';
  overlay_type: 'NONE' | 'LIGHT' | 'DARK';
  overlay_strength: number;
  updated_at: string;
}
```

### Super Admin Record (`SuperAdminRecord`)
```typescript
interface SuperAdminRecord {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  status: 'ACTIVE' | 'REVOKED' | 'SUSPENDED';
  granted_by: string;
  granted_at: string;
  revoked_at?: string;
  created_at: string;
  last_login_at?: string;
}
```
