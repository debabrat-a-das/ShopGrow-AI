# 🔐 ShopGrow AI — User Credentials & Testing Reference Guide

## 1. Overview of Authentication Routes

| Login Type | URL Route | Description |
| :--- | :--- | :--- |
| **Standard Store Operations** | `http://localhost:5173/` or `/login` | For Shop Owners, Managers, and Staff. Pure Email + Password. Resolves role and authorized shop automatically. |
| **Private Super Admin Portal** | `http://localhost:5173/admin/login` | For Platform Super Administrators only. Enforces server-side allowlist against `super_admins` database table. |

---

## 2. Platform Super Admin Accounts (Private Portal Only)

> ⚠️ **Security Rule**: Super Admin accounts **cannot** log in from the public `/login` page. Enter via **`/admin/login`**.

| User ID | Full Name | Email | Password | Role | Permitted Access |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `profile-super-admin-000` | Antigravity Super Admin | `admin@shopgrow.ai` | `Admin@ShopGrow2026!` *(or `adminpassword`)* | **SUPER_ADMIN** | **All Shops** (Global Shop Switcher, Platform Admin, Admin Access Allowlist, Testing Center) |
| `profile-sa-002` | Vikram Sen (Co-Admin) | `admin2@shopgrow.ai` | `Admin@ShopGrow2026!` *(or `adminpassword`)* | **SUPER_ADMIN** | **All Shops** (Granted by existing Super Admin via Settings → Admin Access) |

---

## 3. Shop 1: Saha Electronics (`shop-saha-electronics-001`)
*Category: Mobile & Consumer Electronics • Plan: Growth (Shop Managed)*

| User ID | Full Name | Email | Password | Role | Permitted Access & UI Experience |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `profile-subhasish-saha-001` | Subhasish Saha | `owner@sahaelectronics.com` | `ShopOwner@2026` *(or `password123`)* | **SHOP_OWNER** | **Full Store Operations**: Dashboard, Products, CRM, Offers, Campaigns, Automated Occasions, Inbox, Sales, Analytics, Settings & Branding. **No other shop names visible in header (static badge only).** |
| `profile-rajesh-manager-002` | Rajesh Mondal | `rajesh@sahaelectronics.com` | `ManagerPass@2026` *(or `password123`)* | **MANAGER** | Store Operations, CRM, Campaigns, and Settings. |
| `profile-priya-staff-003` | Priya Das | `priya@sahaelectronics.com` | `StaffPass@2026` *(or `password123`)* | **STAFF** | **Operational Modules Only**: Dashboard, Products, CRM, Unified Inbox, Walk-in Sales, In-Store QR. **Settings & Super Admin hidden from sidebar.** |

---

## 4. Shop 2: Royal Teak & Home Decor (`shop-furniture-002`)
*Category: Solid Teak & Designer Furniture • Plan: Pro (Managed Service) • Custom Showroom Wallpaper*

| User ID | Full Name | Email | Password | Role | Permitted Access & UI Experience |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `profile-furniture-owner-001` | Debashis Roy | `owner@royalteak.in` | `ShopOwner@2026` *(or `password123`)* | **SHOP_OWNER** | **Full Store Operations for Royal Teak**: Cannot see Saha Electronics. Header shows static identity badge. |
| `profile-furniture-staff-002` | Kavita Sharma | `staff@royalteak.in` | `StaffPass@2026` *(or `password123`)* | **STAFF** | Operational modules for Royal Teak only. |

---

## 5. Instant 1-Click QA Login in Development Mode

When visiting `http://localhost:5173/login`, scroll to the bottom and click on:
**"QA / Developer Sandbox Accounts"** to expand the 1-click login buttons for:
- Subhasish Saha (Owner • Saha Electronics)
- Debashis Roy (Owner • Royal Teak Furniture)
- Priya Das (Staff • Saha Electronics)
- Kavita Sharma (Staff • Royal Teak Furniture)

---

## 6. Security Scenarios Testing Quick Guide

### Test 1: Cross-Tenant Privacy Verification
1. Log in as `owner@sahaelectronics.com`.
2. Notice the header shows `Saha Electronics` as a static badge with **no dropdown**.
3. Attempt to fetch Royal Teak data by sending a request to `GET /api/customers?shop_id=shop-furniture-002`.
4. Response: **`403 Forbidden`** (*Tenant isolation violation*).

### Test 2: Super Admin Private Login Verification
1. Open `http://localhost:5173/login` (public). Try `admin@shopgrow.ai` -> **Access Denied** (Must use admin portal).
2. Open `http://localhost:5173/admin/login` (private). Enter `admin@shopgrow.ai` and `Admin@ShopGrow2026!` -> **Login Successful**, Super Admin workspace opens.
