import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import customerRoutes from './routes/customerRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import simulatorRoutes from './routes/simulatorRoutes.js';
import productRoutes from './routes/productRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import testingRoutes from './routes/testingRoutes.js';
import occasionRoutes from './routes/occasionRoutes.js';
import { metaIntegrationRoutes } from './routes/metaIntegrationRoutes.js';
import { authRoutes, enforceTenantIsolation } from './routes/authRoutes.js';
import { store } from './db/store.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: (origin, callback) => {
    // Reflect request origin to allow GitHub Pages, local dev, and public domains with credentials
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-shop-id', 'x-user-role', 'Accept']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, _res, next) => {
  if (!req.path.startsWith('/api/analytics')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Authentication & Tenant Session Routes
app.use('/api/auth', authRoutes);

// Apply strict cross-tenant isolation enforcement across all tenant resources
app.use('/api', enforceTenantIsolation);

// API Routes
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhooks/whatsapp', webhookRoutes);
app.use('/api/webhooks/meta', webhookRoutes);
app.use('/api/meta-integrations', metaIntegrationRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/testing', testingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/occasions', occasionRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'ShopGrow AI Server',
    timestamp: new Date().toISOString(),
    demoShop: store.shops[0]?.name
  });
});


// Root Health check for hosting platforms (Render, Railway, Fly.io, etc.)
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'ShopGrow AI Server',
    timestamp: new Date().toISOString()
  });
});

// Production Unified Static Serving: Serve client/dist with SPA routing fallback
const clientDistCandidates = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'Project/client/dist')
];
const clientDistPath = clientDistCandidates.find(p => fs.existsSync(p));

if (typeof clientDistPath === 'string' && clientDistPath.length > 0) {
  const staticPath: string = clientDistPath;
  console.log('Serving production frontend build from:', staticPath);
  app.use(express.static(staticPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 ShopGrow AI API Server running on port ${PORT}`);
});
