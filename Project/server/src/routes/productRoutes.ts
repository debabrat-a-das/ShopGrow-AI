import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { Product, ProductCategory, ProductAttribute } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List products
router.get('/', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  let products = store.getProducts(shopId);

  const { category, search, is_new_arrival } = req.query;

  if (search) {
    const q = String(search).toLowerCase();
    products = products.filter(p => 
      p.model.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) || 
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  }

  if (category && category !== 'ALL') {
    products = products.filter(p => p.category.toLowerCase() === String(category).toLowerCase() || p.category_id === category);
  }

  if (is_new_arrival === 'true') {
    products = products.filter(p => p.is_new_arrival);
  }

  res.json(products);
});

// List categories
router.get('/meta/categories', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const categories = store.getProductCategories(shopId);
  res.json(categories);
});

// Create category
router.post('/meta/categories', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const shop = store.getShop(shopId);
  const { name, slug, description } = req.body;

  if (!name || !slug) {
    res.status(400).json({ error: 'Name and slug are required' });
    return;
  }

  const category: ProductCategory = {
    id: uuidv4(),
    shop_id: shopId,
    name,
    slug,
    business_type: shop?.business_type || 'GENERAL_RETAIL',
    description: description || '',
    created_at: new Date().toISOString()
  };

  store.productCategories.push(category);
  res.status(201).json(category);
});

// List attributes
router.get('/meta/attributes', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const attributes = store.getProductAttributes(shopId);
  res.json(attributes);
});

// Single product
router.get('/:id', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const product = store.products.find(p => p.id === req.params.id && p.shop_id === shopId);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(product);
});

// Create generic product with flexible attributes
router.post('/', (req: Request, res: Response) => {
  const shopId = (req.headers['x-shop-id'] as string) || 'shop-saha-electronics-001';
  const {
    category,
    category_id,
    sku,
    brand,
    model,
    mrp,
    cost_price,
    stock_quantity,
    specs,
    custom_attributes,
    images,
    is_new_arrival,
    is_featured
  } = req.body;

  if (!brand || !model || !mrp) {
    res.status(400).json({ error: 'Brand, model, and MRP are required' });
    return;
  }

  const product: Product = {
    id: uuidv4(),
    shop_id: shopId,
    category: category || 'Retail Item',
    category_id: category_id || undefined,
    sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
    brand,
    model,
    mrp: Number(mrp),
    cost_price: cost_price ? Number(cost_price) : undefined as any,
    stock_quantity: stock_quantity !== undefined ? Number(stock_quantity) : 1,
    specs: specs || {},
    custom_attributes: custom_attributes || {},
    images: images || ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600'],
    is_new_arrival: is_new_arrival ?? true,
    is_featured: is_featured ?? false,
    created_at: new Date().toISOString()
  };

  store.products.unshift(product);

  // Audit log
  store.logAuditAction(shopId, 'Store Staff', 'STAFF', 'PRODUCT_CREATED', {
    product_id: product.id,
    model: product.model,
    brand: product.brand,
    mrp: product.mrp
  });

  res.status(201).json(product);
});

export default router;
