import { Customer, Conversation, Message, Shop, Offer, Product, CustomerMemoryContext } from '../types.js';
import { store } from '../db/store.js';
import { normalizeIndianPhone } from './phoneNormalizer.js';

export interface MemoryDelta {
  extractedName?: string;
  isIdentityCorrection?: boolean;
  previousName?: string;
  extractedLocation?: string;
  extractedBudget?: string;
  extractedBrand?: string;
  extractedProduct?: string;
  inferredLanguage?: string;
  anaphoricQueryDetected?: boolean;
  resolvedProductContext?: string;
}

export class CustomerMemoryService {
  private static PLACEHOLDER_NAMES = new Set([
    'whatsapp customer',
    'customer simulator',
    'customer',
    'guest',
    'unknown',
    'inbound caller',
    'facebook user',
    'instagram user',
    'social user'
  ]);

  /**
   * 1. Multi-Channel Customer Identification
   * Resolves customer identity via WhatsApp phone, customer_id, Messenger/FB ID, Instagram ID, Lead ID, or Conversation ID
   */
  static identifyCustomer(params: {
    shopId: string;
    phone?: string;
    customerId?: string;
    socialUserId?: string;
    socialPlatform?: 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP';
    conversationId?: string;
    leadId?: string;
  }): Customer | null {
    const { shopId, phone, customerId, socialUserId, conversationId, leadId } = params;

    // A. By customerId
    if (customerId) {
      const found = store.customers.find(c => c.id === customerId && c.shop_id === shopId);
      if (found) return found;
    }

    // B. By normalized phone
    if (phone) {
      const norm = normalizeIndianPhone(phone);
      const targetPhone = norm.valid ? norm.phone_e164 : (phone.startsWith('+') ? phone : `+${phone}`);
      const found = store.customers.find(c => c.phone_e164 === targetPhone && c.shop_id === shopId);
      if (found) return found;
    }

    // C. By socialUserId (Facebook / Instagram user ID)
    if (socialUserId) {
      const found = store.customers.find(c => c.social_user_id === socialUserId && c.shop_id === shopId);
      if (found) return found;

      // Check social leads
      const socialLead = store.socialLeads.find(sl => sl.author_id === socialUserId && sl.shop_id === shopId);
      if (socialLead?.whatsapp_phone) {
        const foundByPhone = store.customers.find(c => c.phone_e164 === socialLead.whatsapp_phone && c.shop_id === shopId);
        if (foundByPhone) return foundByPhone;
      }
    }

    // D. By conversationId
    if (conversationId) {
      const conv = store.conversations.find(c => c.id === conversationId && c.shop_id === shopId);
      if (conv) {
        const found = store.customers.find(c => c.id === conv.customer_id && c.shop_id === shopId);
        if (found) return found;
      }
    }

    // E. By leadId
    if (leadId) {
      const lead = store.leads.find(l => l.id === leadId && l.shop_id === shopId);
      if (lead) {
        const found = store.customers.find(c => c.id === lead.customer_id && c.shop_id === shopId);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Determine whether a customer's name is a genuine known human name
   */
  static isNameKnown(fullName?: string | null): boolean {
    if (!fullName) return false;
    const clean = fullName.trim().toLowerCase();
    if (!clean || clean.length < 2) return false;
    if (this.PLACEHOLDER_NAMES.has(clean)) return false;
    return true;
  }

  /**
   * 2. Intelligent Memory Extraction Delta
   * Analyzes incoming message text against existing CRM memory
   */
  static extractMemoryDelta(
    messageText: string,
    customer?: Customer | null,
    conversation?: Conversation | null
  ): MemoryDelta {
    const text = (messageText || '').trim();
    const textLower = text.toLowerCase();
    const delta: MemoryDelta = {};

    // --- A. Identity Conflict & Name Extraction ---
    // Example: "Ami Rahul noi, ami Rajib", "I am not Rahul, my name is Rajib", "Rahul na, Rajib"
    const identityCorrectionMatch = text.match(
      /(?:ami\s+)?([A-Za-z\u0980-\u09FF]+)\s+(?:noi|na|not)[,\s]+(?:ami|amar naam|my name is|actually|kintu)?\s*([A-Za-z\u0980-\u09FF]+)/i
    ) || text.match(
      /(?:ami|i am|my name is not|ami na|ami noi|not)\s+([A-Za-z\u0980-\u09FF]+)[,\s]+(?:ami|my name is|amar naam|actual name is|actually|kintu)\s+([A-Za-z\u0980-\u09FF]+)/i
    );
    if (identityCorrectionMatch) {
      const oldName = identityCorrectionMatch[1].trim();
      const newName = identityCorrectionMatch[2].trim();
      delta.isIdentityCorrection = true;
      delta.previousName = oldName;
      delta.extractedName = newName.charAt(0).toUpperCase() + newName.slice(1);
    } else {
      // Normal Name Self-introduction: "Amar naam Rahul", "My name is Suman", "I am Amit"
      const nameIntroMatch = text.match(
        /(?:amar naam|my name is|naam|name|ami)\s+([A-Za-z\u0980-\u09FF]{2,20}(?:\s+[A-Za-z\u0980-\u09FF]{2,20})?)/i
      );
      if (nameIntroMatch && !textLower.includes('kal asbo') && !textLower.includes('dokan') && !textLower.includes('price')) {
        const candidate = nameIntroMatch[1].trim();
        // Disqualify common keywords
        const blacklist = ['kal', 'customer', 'interested', 'phone', 'sofa', 'bed', 'price', 'offer'];
        if (!blacklist.some(b => candidate.toLowerCase().includes(b))) {
          delta.extractedName = candidate
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        }
      }
    }

    // --- B. Location Extraction ---
    // Example: "Ami Madhyamgram-e thaki", "Live in Birati", "Location: Salt Lake", "Bari Bowbazar"
    let locCandidate: string | undefined;
    const bengaliLocMatch = text.match(
      /([A-Za-z\u0980-\u09FF]{3,25})(?:[-_]?[e|te])\s+thaki/i
    );
    if (bengaliLocMatch) {
      locCandidate = bengaliLocMatch[1];
    } else {
      const locationMatch = text.match(
        /(?:thaki|bari|live in|location|stay at|area|from)\s+(?:in\s+|at\s+)?([A-Za-z\u0980-\u09FF\s]{3,25})/i
      );
      if (locationMatch) {
        locCandidate = locationMatch[1].replace(/[-_e]$/i, '').trim();
      }
    }

    if (locCandidate) {
      const locBlacklist = ['kal', 'phone', 'sofa', 'price', 'dokan', 'showroom', 'offer', 'ami', 'koto'];
      if (!locBlacklist.some(b => locCandidate!.toLowerCase().includes(b))) {
        delta.extractedLocation = locCandidate.charAt(0).toUpperCase() + locCandidate.slice(1);
      }
    }

    // --- C. Budget Extraction ---
    // Example: "Budget 30,000 - 40,000", "Under 25k", "Budget 30k", "Max 45000", "20 hazar er moddhe"
    const budgetRangeMatch = text.match(
      /(?:budget|dam|range|under|max|around|upto)\s*(?:of|is|holo|hobe)?\s*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]{1,3}k)\s*(?:to|-|theke)\s*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]{1,3}k)/i
    );
    if (budgetRangeMatch) {
      delta.extractedBudget = `₹${budgetRangeMatch[1]} - ₹${budgetRangeMatch[2]}`;
    } else {
      const singleBudgetMatch = text.match(
        /(?:budget|under|upto|max|dam)\s*(?:of|is|holo|hobe)?\s*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]{1,3}k|\d{4,6})/i
      );
      if (singleBudgetMatch && !textLower.includes('phone') && !textLower.includes('m31')) {
        delta.extractedBudget = `Up to ₹${singleBudgetMatch[1]}`;
      }
    }

    // --- D. Product Context & Anaphora Resolution ---
    // Example: "ওইটার অন্য colour আছে?", "What colors does that come in?", "Is there warranty on that?"
    const anaphoricKeywords = [
      'ওইটার', 'oitai', 'oita', 'oitar', 'tar', 'that one', 'that model', 
      'this one', 'onno colour', 'other color', 'other colours', 'warranty ache', 
      'specification', 'specs', 'features', 'same model'
    ];
    const isAnaphoric = anaphoricKeywords.some(kw => textLower.includes(kw));

    if (isAnaphoric) {
      delta.anaphoricQueryDetected = true;
      // Resolve to conversation.context_product or customer.last_discussed_product
      delta.resolvedProductContext = 
        conversation?.context_product || 
        conversation?.interested_product || 
        customer?.last_discussed_product || 
        (customer?.brand && customer?.model ? `${customer.brand} ${customer.model}` : undefined);
    }

    // Direct product interest detection: check offers first
    const offers = store.offers || [];
    let matchedOfferName: string | undefined;
    for (const off of offers) {
      if (textLower.includes(off.model.toLowerCase()) || textLower.includes(off.brand.toLowerCase())) {
        matchedOfferName = `${off.brand} ${off.model}`;
        break;
      }
    }
    if (matchedOfferName) {
      delta.extractedProduct = matchedOfferName;
    } else {
      const electronicsKeywords = ['s24', 'a55', 'm31', 'm32', 'iphone', 'tv', 'fridge', 'ac', 'laptop'];
      const furnitureKeywords = ['bed', 'sofa', 'dining', 'wardrobe', 'table', 'chair', 'l-shape'];
      
      [...electronicsKeywords, ...furnitureKeywords].forEach(kw => {
        if (textLower.includes(kw)) {
          delta.extractedProduct = kw.toUpperCase();
        }
      });
    }

    return delta;
  }

  /**
   * 3. Apply Memory Delta to Customer Record (Update instead of Duplicate)
   */
  static applyMemoryDelta(
    customer: Customer,
    delta: MemoryDelta,
    shopId: string,
    conversation?: Conversation | null
  ): void {
    let updated = false;

    // Update Name (with identity correction audit)
    if (delta.extractedName && delta.extractedName !== customer.full_name) {
      if (delta.isIdentityCorrection) {
        store.logSystemEvent({
          name: 'Identity Conflict Resolved: Profile Updated',
          shop_id: shopId,
          customer_id: customer.id,
          customer_name: delta.extractedName,
          source: 'CUSTOMER_MEMORY_ENGINE',
          status: 'WARNING',
          payload: {
            previous_name: delta.previousName || customer.full_name,
            new_name: delta.extractedName,
            reason: 'Customer explicitly corrected their name'
          }
        });
      }
      customer.full_name = delta.extractedName;
      if (conversation) conversation.customer_name = delta.extractedName;
      updated = true;
    }

    // Update Location
    if (delta.extractedLocation && delta.extractedLocation !== customer.location) {
      customer.location = delta.extractedLocation;
      updated = true;
    }

    // Update Budget
    if (delta.extractedBudget && delta.extractedBudget !== customer.budget_range) {
      customer.budget_range = delta.extractedBudget;
      updated = true;
    }

    // Update Product Context
    if (delta.extractedProduct) {
      customer.last_discussed_product = delta.extractedProduct;
      if (!customer.product_interests) customer.product_interests = [];
      if (!customer.product_interests.includes(delta.extractedProduct)) {
        customer.product_interests.push(delta.extractedProduct);
      }
      if (conversation) {
        conversation.interested_product = delta.extractedProduct;
        conversation.context_product = delta.extractedProduct;
      }
      updated = true;
    }

    if (updated) {
      customer.updated_at = new Date().toISOString();
      store.logSystemEvent({
        name: 'Customer Memory Synced',
        shop_id: shopId,
        customer_id: customer.id,
        customer_name: customer.full_name,
        source: 'CUSTOMER_MEMORY_ENGINE',
        status: 'SUCCESS',
        payload: {
          name: customer.full_name,
          location: customer.location,
          budget: customer.budget_range,
          context_product: customer.last_discussed_product
        }
      });
    }
  }

  /**
   * 4. Build Customer Memory Context for AI Reply Formulation
   */
  static buildMemoryContext(
    customer: Customer | null,
    conversation: Conversation | null,
    recentMessages: Message[] = []
  ): CustomerMemoryContext {
    const isNameValid = this.isNameKnown(customer?.full_name);
    const isLocValid = Boolean(customer?.location && customer.location.trim().length > 2 && customer.location.toLowerCase() !== 'unknown');
    const isBudgetValid = Boolean(customer?.budget_range && customer.budget_range.trim().length > 0);

    const purchaseSummary = (customer?.brand && customer?.model && customer.purchase_date)
      ? `${customer.brand} ${customer.model} purchased on ${customer.purchase_date}`
      : undefined;

    return {
      known_name: isNameValid ? customer!.full_name : undefined,
      is_name_known: isNameValid,
      known_location: isLocValid ? customer!.location : undefined,
      is_location_known: isLocValid,
      known_budget: isBudgetValid ? customer!.budget_range : undefined,
      is_budget_known: isBudgetValid,
      last_discussed_product: conversation?.context_product || conversation?.interested_product || customer?.last_discussed_product,
      purchase_history_summary: purchaseSummary,
      has_active_consent: Boolean(customer?.whatsapp_opt_in),
      is_opted_out: Boolean(customer?.do_not_contact),
      recent_messages: recentMessages.slice(-6).map(m => ({
        direction: m.direction,
        text: m.body,
        time: m.created_at
      }))
    };
  }
}
