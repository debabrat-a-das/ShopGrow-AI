import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { Sale } from '../types.js';
import { OccasionService } from '../services/occasionService.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List recorded sales
router.get('/', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const sales = store.getSales(shopId);
  res.json(sales);
});

// Record confirmed sale with campaign & occasion coupon attribution
router.post('/', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const { 
    customer_id, 
    campaign_id, 
    product, 
    sale_amount, 
    staff, 
    notes, 
    sale_date,
    occasion_type,
    coupon_code,
    discount_amount 
  } = req.body;

  const customer = store.customers.find(c => c.id === customer_id && c.shop_id === shopId);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  const campaign = campaign_id ? store.campaigns.find(c => c.id === campaign_id && c.shop_id === shopId) : undefined;
  const amount = Number(sale_amount) || 0;
  const discount = Number(discount_amount) || 0;

  const sale: Sale = {
    id: uuidv4(),
    shop_id: shopId,
    customer_id: customer.id,
    customer_name: customer.full_name,
    campaign_id: campaign?.id,
    campaign_name: campaign?.name,
    product: product || 'Electronics Device',
    sale_amount: amount,
    sale_date: sale_date || new Date().toISOString().slice(0, 10),
    staff: staff || 'Store Staff',
    notes: notes || 'Counter sale closed via ShopGrow AI follow-up',
    occasion_type,
    coupon_code,
    discount_amount: discount,
    created_at: new Date().toISOString()
  };

  store.sales.unshift(sale);

  // Link occasion redemption if coupon code used
  if (coupon_code) {
    OccasionService.recordOccasionRedemption(
      shopId,
      customer.id,
      coupon_code,
      sale.id,
      amount,
      discount
    );
  }

  // 1. Update customer status
  customer.lead_status = 'CONVERTED';
  customer.purchase_value = (customer.purchase_value || 0) + amount;
  customer.purchase_date = sale.sale_date;
  customer.engagement_score = 100;
  customer.updated_at = new Date().toISOString();

  // 2. Attribute sale to campaign if present
  if (campaign) {
    campaign.sales_count = (campaign.sales_count || 0) + 1;
    campaign.attributed_revenue = Number((campaign.attributed_revenue || 0)) + amount;
    campaign.updated_at = new Date().toISOString();
  }

  // 3. Mark corresponding lead as WON if exists
  const lead = store.leads.find(l => l.customer_id === customer.id && l.status !== 'WON');
  if (lead) {
    lead.status = 'WON';
    lead.updated_at = new Date().toISOString();
  }

  store.logSystemEvent({
    name: 'Sale Confirmed & Revenue Attributed',
    shop_id: shopId,
    customer_id: customer.id,
    customer_name: customer.full_name,
    source: 'SALES_ATTRIBUTION',
    status: 'SUCCESS',
    payload: {
      amount,
      product: sale.product,
      attributed_campaign: campaign?.name || 'Direct / Walk-in'
    }
  });

  res.status(201).json({
    success: true,
    sale,
    attributedCampaign: campaign ? { id: campaign.id, name: campaign.name, totalRevenue: campaign.attributed_revenue } : null
  });
});

export default router;
