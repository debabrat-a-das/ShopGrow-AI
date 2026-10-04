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

app.use(cors());
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

app.listen(PORT, () => {
  console.log(`🚀 ShopGrow AI API Server running at http://localhost:${PORT}`);
});
