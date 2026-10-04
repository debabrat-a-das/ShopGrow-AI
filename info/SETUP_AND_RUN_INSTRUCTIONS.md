# 🚀 ShopGrow AI — Setup & Local Execution Guide

## 1. Prerequisites
- **Node.js**: v18+ or v20+ recommended
- **npm**: v9+
- **OS**: Windows, macOS, or Linux

---

## 2. Directory Structure on E: Drive

```
E:\ShopGrow_AI\
├── Project\               # Complete source code tree
│   ├── client\            # React + TypeScript + Vite + Tailwind frontend
│   │   ├── src\
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── server\            # Node.js + Express + TypeScript API backend
│   │   ├── src\
│   │   └── package.json
│   ├── supabase\          # SQL migrations & RLS schema
│   ├── demo-data\         # Customer sample datasets (.csv, .xlsx)
│   └── scratch\           # Test runners & automated QA test suites
├── info\                  # Comprehensive system documentation
│   ├── USER_CREDENTIALS_AND_TESTING_GUIDE.md
│   ├── ARCHITECTURE_AND_SECURITY.md
│   ├── API_ROUTES_AND_SCHEMA.md
│   ├── SETUP_AND_RUN_INSTRUCTIONS.md
│   └── TEST_RESULTS_AND_QA_REPORT.md
└── README.md              # Master directory reference
```

---

## 3. Initial Setup & Installing Dependencies

Open a terminal in `E:\ShopGrow_AI\Project`:

### Backend Server
```powershell
cd E:\ShopGrow_AI\Project\server
npm install
```

### Frontend Client
```powershell
cd E:\ShopGrow_AI\Project\client
npm install
```

---

## 4. Running the Development Servers

### Terminal 1: Backend Server (Port 3001)
```powershell
cd E:\ShopGrow_AI\Project\server
npm run dev
```
> Server starts at `http://localhost:3001` with auto-reload (`tsx watch`).

### Terminal 2: Frontend Client (Port 5173)
```powershell
cd E:\ShopGrow_AI\Project\client
npm run dev
```
> Client starts at `http://localhost:5173`.

---

## 5. Running Automated Security & Tenant Isolation Tests

From `E:\ShopGrow_AI\Project`:
```powershell
node scratch/test_security_and_features.js
```
This runs the full test suite verifying:
- Saha Owner isolation
- Royal Teak Owner isolation
- Staff module restrictions
- Public login Super Admin protection
- Unauthorized admin login block
- Authorized Super Admin login & global shop access
- Granting/suspending secondary Super Admins
- Meta Facebook mock connection & diagnostic health
- Tenant background customization isolation
