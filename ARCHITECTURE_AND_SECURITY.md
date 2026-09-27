# 🏛️ ShopGrow AI — Architecture & Security Blueprint

## 1. Multi-Tenant Isolation Architecture

ShopGrow AI implements strict enterprise tenant isolation at all layers:

```
                      [Incoming Request]
                              │
                    [Authentication Layer]
                    - JWT Token validation
                    - Role & Identity resolution
                              │
                [enforceTenantIsolation Middleware]
          ┌───────────────────┴───────────────────┐
     Role == SUPER_ADMIN?                    Role != SUPER_ADMIN?
          │                                       │
  [Full Global Access]                  Does target shop_id match 
  - View all shops                      authenticated membership?
  - Switch tenant workspace                       │
                                        ┌─────────┴─────────┐
                                      YES                  NO
                                       │                    │
                            [Allow Operation]      [403 FORBIDDEN]
                            Scoped to shop_id      Tenant Violation
```

### Server-Side Isolation Guarantee
- **Middleware**: `enforceTenantIsolation` (in `server/src/routes/authRoutes.ts`) protects all `/api/` endpoints.
- **Shop Scope Header**: Requests carry `x-shop-id` and `x-user-role`. Non-admins querying another tenant receive immediate `403 Forbidden`.
- **Database Model**: Every business-owned entity (`Customer`, `Campaign`, `Offer`, `Product`, `OccasionOffer`, `Conversation`, `Sale`, `MetaIntegrationCard`, `ShopBranding`) includes `shop_id`.

---

## 2. Platform Super Admin Security Model

### Private Route & Concealed Access
- Public `/login` does NOT advertise Super Admin access and rejects Super Admin credentials if entered.
- Dedicated private route: `/admin/login`.

### Database Allowlist (`super_admins` Table)
```sql
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED', 'SUSPENDED')),
  granted_by VARCHAR(255) NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);
```
- Only existing active Super Admins can grant new Super Admins.
- Explicit confirmation checkbox required in UI.
- All additions, status changes, and suspensions are logged in the platform Audit Log.
- Genesis administrator is protected from accidental suspension or revocation.

---

## 3. Dynamic Branding & Background Customization

Located at `Settings → Branding & Background`:
- **Default Application Background**: Clean white (`#FFFFFF`).
- **Options**:
  1. `DEFAULT_WHITE`: Pure `#FFFFFF` light theme.
  2. `CUSTOM_COLOR`: Merchant hex color (e.g., `#F0FDF4`, `#F8FAFC`).
  3. `CUSTOM_IMAGE`: Upload or preset image (JPG, JPEG, PNG, WEBP) with display options (`cover`, `contain`, `center`, `top`, `no-repeat`).
- **Overlays**: Light or Dark contrast overlay with strength slider (0% to 80%).
- **Readability Guarantee**: All data tables, metric cards, and forms use solid/semi-transparent surfaces (`bg-slate-900/90`), guaranteeing 100% legibility on any wallpaper.
- **Tenant Isolation**: Saha Electronics' branding never affects Royal Teak. Super Admin workspace always retains clean platform dark theme (`#020617`).

---

## 4. Meta Social & Lead Ingestion Architecture

### End-to-End Attribution Chain
```
[Facebook Page] ─► [Post / Sponsored Ad] ─► [Inbound Comment / Lead Form / DM]
                                                           │
                                                           ▼
[Sales & Attribution] ◄─ [Store Walk-in] ◄─ [Hot Lead] ◄─ [Unified Inbox CRM]
```

### Verification & Real-State Health Badges
- `LIVE CONNECTED` (Emerald): Active token + verified webhooks.
- `MOCK META — NOT LIVE` (Amber): Local simulator/mock mode for test environments.
- `NOT CONNECTED` (Rose): Requires Page or Ad Account connection before campaign launch.
- If Facebook Page is missing in Social Campaigns: Shows warning banner with **"CONNECT FACEBOOK PAGE"**.
- If Ad Account is missing: Shows warning banner with **"CONNECT AD ACCOUNT"**.
