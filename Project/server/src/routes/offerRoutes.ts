import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { Offer } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List all offers for shop
router.get('/', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const offers = store.getOffers(shopId);
  res.json(offers);
});

// Create new offer
router.post('/', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const {
    title,
    product_id,
    brand,
    model,
    mrp,
    offer_price,
    exchange_offer,
    emi_information,
    cashback,
    valid_from,
    valid_until,
    stock_status,
    terms,
    image
  } = req.body;

  if (!title || !brand || !model || !mrp || !offer_price || !valid_until) {
    res.status(400).json({ error: 'Missing mandatory offer fields (title, brand, model, mrp, offer_price, valid_until)' });
    return;
  }

  const numMrp = Number(mrp);
  const numOfferPrice = Number(offer_price);
  const discountPercent = numMrp > numOfferPrice ? Number((((numMrp - numOfferPrice) / numMrp) * 100).toFixed(2)) : 0;

  const newOffer: Offer = {
    id: uuidv4(),
    shop_id: shopId,
    title,
    product_id: product_id || undefined,
    brand,
    model,
    mrp: numMrp,
    offer_price: numOfferPrice,
    discount: discountPercent,
    exchange_offer: exchange_offer || '',
    emi_information: emi_information || '',
    cashback: cashback || '',
    valid_from: valid_from || new Date().toISOString().slice(0, 10),
    valid_until,
    stock_status: stock_status || 'IN_STOCK',
    terms: terms || 'Standard retail warranty and return policy apply.',
    image: image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    active_status: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  store.offers.unshift(newOffer);
  res.status(201).json(newOffer);
});

// Update or toggle active status of offer
router.patch('/:id', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const offer = store.offers.find(o => o.id === req.params.id && o.shop_id === shopId);
  if (!offer) {
    res.status(404).json({ error: 'Offer not found' });
    return;
  }

  Object.assign(offer, req.body);
  offer.updated_at = new Date().toISOString();

  res.json(offer);
});

export default router;
