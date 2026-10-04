import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';

const router = Router();

// List leads (e.g. hot leads today)
router.get('/', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  let leads = store.getLeads(shopId);
  const { filter, status } = req.query;

  if (filter === 'hot') {
    leads = leads.filter(l => l.interest_level === 'HOT' || l.lead_score >= 70);
  }

  if (status && status !== 'ALL') {
    leads = leads.filter(l => l.status === status);
  }

  // Sort by score descending
  leads.sort((a, b) => b.lead_score - a.lead_score);

  res.json(leads);
});

// Update lead status (e.g. VISITED, WON, LOST, FOLLOW_UP)
router.patch('/:id/status', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const { status, notes } = req.body;

  const lead = store.leads.find(l => l.id === req.params.id && l.shop_id === shopId);
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  lead.status = status;
  lead.updated_at = new Date().toISOString();

  // Also sync customer lead_status
  const customer = store.customers.find(c => c.id === lead.customer_id);
  if (customer) {
    if (status === 'VISITED') customer.lead_status = 'STORE_VISIT';
    else if (status === 'WON') customer.lead_status = 'CONVERTED';
    else if (status === 'LOST') customer.lead_status = 'LOST';
    customer.updated_at = new Date().toISOString();
  }

  res.json({ success: true, lead, customer });
});

export default router;
