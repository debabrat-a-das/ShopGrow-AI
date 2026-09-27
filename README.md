# 🌟 ShopGrow AI — Master Repository & Archive

Welcome to the **ShopGrow AI** project backup and repository on `E:\ShopGrow_AI`.

## 📁 Repository Directory Structure

```
E:\ShopGrow_AI\
├── Project\                          # Complete Application Source Code
│   ├── client\                       # React 18, TypeScript, Vite, Tailwind CSS Frontend
│   │   ├── src\
│   │   │   ├── components\           # Navbar, Sidebar, Modals, Drawers
│   │   │   ├── pages\                # Dashboard, CRM, AI Inbox, Occasions, Campaigns, Settings
│   │   │   ├── services\             # REST API Client with Token & Tenant Context
│   │   │   └── types\                # TypeScript Type Definitions
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── server\                       # Node.js, Express, TypeScript API Backend
│   │   ├── src\
│   │   │   ├── db\store.ts           # In-memory Store with Tenant Isolation & Allowlist
│   │   │   ├── routes\               # Modular REST Routers (/auth, /super-admin, etc.)
│   │   │   └── services\             # AI, WhatsApp, Occasion, & Meta Services
│   │   └── package.json
│   ├── supabase\                     # PostgreSQL Migrations & Row-Level Security Rules
│   ├── demo-data\                    # Sample Datasets for Saha Electronics & Royal Teak
│   └── scratch\                      # Automated Test Suites & Security Validators
│
└── info\                             # Comprehensive Documentation & Testing Guides
    ├── USER_CREDENTIALS_AND_TESTING_GUIDE.md  # All User IDs, Emails, Passwords, Roles
    ├── ARCHITECTURE_AND_SECURITY.md           # Multi-Tenant Isolation & Allowlist Model
    ├── API_ROUTES_AND_SCHEMA.md               # Complete REST API & Entity Schema
    ├── SETUP_AND_RUN_INSTRUCTIONS.md          # Step-by-Step Installation & Run Guide
    └── TEST_RESULTS_AND_QA_REPORT.md          # Verified QA Matrix (Tests A through G)
```

---

## ⚡ Quick Start

```powershell
# 1. Install & start Backend (Port 3001)
cd E:\ShopGrow_AI\Project\server
npm install
npm run dev

# 2. In a new terminal, install & start Frontend (Port 5173)
cd E:\ShopGrow_AI\Project\client
npm install
npm run dev

# 3. Open in Browser
# Standard Login: http://localhost:5173/login
# Super Admin Portal: http://localhost:5173/admin/login
```

For complete credentials, see [USER_CREDENTIALS_AND_TESTING_GUIDE.md](info/USER_CREDENTIALS_AND_TESTING_GUIDE.md).
