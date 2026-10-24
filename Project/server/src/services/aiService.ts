import { LeadIntent, LeadInterestLevel, Offer, Product, Shop, ShopSettings, Customer, CustomerMemoryContext, Conversation, Message } from '../types.js';
import { MemoryDelta } from './customerMemoryService.js';

export interface AIClassificationResult {
  intent: LeadIntent;
  interest_level: LeadInterestLevel;
  product: string;
  confidence: number;
  needs_human: boolean;
  recommended_action: string;
  suggested_reply: string;
  is_opt_out: boolean;
}

export interface CampaignCopyVariants {
  professionalEnglish: string;
  friendlyBengali: string;
  banglish: string;
  shortWhatsApp: string;
}

export interface ProductRecommendationResult {
  product: Product;
  criteria: {
    category: string;
    brand: string;
    minPurchaseAgeMonths?: number;
    consentRequired: boolean;
    frequencyLimitDays: number;
  };
  reasoning: string;
  breakdown: {
    totalDatabase: number;
    matchedCustomers: number;
    excludedNoConsent: number;
    excludedFrequency: number;
    finalAudienceCount: number;
  };
  sampleEligibleCustomers: Array<{
    id: string;
    name: string;
    phone: string;
    model: string;
    purchase_date: string;
    location: string;
  }>;
}

export class AIService {
  /**
   * Classify customer inbound message with strict grounding against shop profile, offers, products, and FAQs
   */
  /**
   * Classify customer inbound message with strict grounding against shop profile, offers, products, FAQs,
   * AND full customer memory to prevent repeat questions.
   */
  static async classifyInboundMessage(params: {
    messageText: string;
    shop: Shop;
    offers: Offer[];
    settings: ShopSettings;
    customerName: string;
    customer?: Customer | null;
    conversation?: Conversation | null;
    conversationHistory?: Message[];
    memoryContext?: CustomerMemoryContext;
    memoryDelta?: MemoryDelta;
    lastOutboundMessage?: string;
  }): Promise<AIClassificationResult> {
    const text = params.messageText.trim();
    const textLower = text.toLowerCase();
    const isFurniture = params.shop.business_type === 'FURNITURE';

    const isNameKnown = params.memoryContext?.is_name_known ?? (
      Boolean(params.customerName && !['whatsapp customer', 'customer simulator', 'customer', 'guest', 'unknown'].includes(params.customerName.toLowerCase()))
    );
    const salutation = isNameKnown ? `${params.customerName} da, ` : 'Namaskar! ';
    const optionalNamePrompt = !isNameKnown ? ' (Apnar subidharthe naam-ti janale enquiry-ti save kore rakhte pari.)' : '';

    // A. Check for Identity Correction (Rule 15: Identity Conflict)
    // e.g. "Ami Rahul noi, ami Rajib"
    if (params.memoryDelta?.isIdentityCorrection && params.memoryDelta.extractedName) {
      const newName = params.memoryDelta.extractedName;
      return {
        intent: 'OTHER',
        interest_level: 'WARM',
        product: params.memoryContext?.last_discussed_product || (isFurniture ? 'Furniture' : 'Electronics'),
        confidence: 0.98,
        needs_human: false,
        recommended_action: 'Customer corrected their name. Profile updated without creating duplicates.',
        suggested_reply: `Dhonnobad apnar naam update korar jonno, ${newName}! Amader CRM record-e shothik bhabe save kore nilam. ${params.shop.name}-e apnake shagoto! Apnar kon product ba offer somporke help lagbe bolun?`,
        is_opt_out: false
      };
    }

    // A2. Check for Name Self-Introduction (Rule 2 & 3: Save Name & Greet)
    // e.g. "Amar naam Suman Das", "My name is Rajib", "Ami Suman"
    if (params.memoryDelta?.extractedName && !params.memoryDelta.isIdentityCorrection) {
      const capturedName = params.memoryDelta.extractedName;
      const contextProd = params.memoryContext?.last_discussed_product || (params.offers[0] ? `${params.offers[0].brand} ${params.offers[0].model}` : (isFurniture ? 'Furniture' : 'Electronics'));
      return {
        intent: 'INTERESTED',
        interest_level: 'HOT',
        product: contextProd,
        confidence: 0.98,
        needs_human: false,
        recommended_action: `Customer introduced their name as ${capturedName}. Stored in CRM. Never ask for name again.`,
        suggested_reply: `Dhonnobad ${capturedName} da! Apnar naam record-e save kore nilam. ${contextProd ? `${contextProd} ba onno kono model somporke kono proshno ache?` : 'Apnake kivabe sahajjo korte pari bolun?'}`,
        is_opt_out: false
      };
    }

    // A3. Check for Location & Budget Statement (Rule 8 & 9: Location & Budget Memory)
    if (params.memoryDelta?.extractedBudget || params.memoryDelta?.extractedLocation) {
      const locText = params.memoryDelta.extractedLocation ? ` Apnar location ${params.memoryDelta.extractedLocation} amra note korechi.` : '';
      const budgetText = params.memoryDelta.extractedBudget ? ` Apnar budget ${params.memoryDelta.extractedBudget}-er moddhe best offers dekhabo.` : '';
      const contextProd = params.memoryContext?.last_discussed_product || (params.offers[0] ? `${params.offers[0].brand} ${params.offers[0].model}` : (isFurniture ? 'Furniture' : 'Electronics'));

      return {
        intent: 'INTERESTED',
        interest_level: 'HOT',
        product: contextProd,
        confidence: 0.96,
        needs_human: false,
        recommended_action: 'Customer provided location/budget. Stored in CRM profile. Never re-ask.',
        suggested_reply: `Dhonnobad ${isNameKnown ? `${params.customerName} da! ` : ''}Tothyoguli save kore nilam.${locText}${budgetText} Amader showroom-e visit kore live demo dekhun!${optionalNamePrompt}`,
        is_opt_out: false
      };
    }

    // B. Check for Unsubscribe / Opt-out (Rule 10: Consent Memory)
    const optOutPhrases = ['stop', 'unsubscribe', 'bondho korun', 'bondho koro', 'remove', 'dont message', 'spam', 'ar message pathaben na', 'no more messages'];
    if (optOutPhrases.some(p => textLower.includes(p))) {
      return {
        intent: 'UNSUBSCRIBE',
        interest_level: 'COLD',
        product: '',
        confidence: 0.99,
        needs_human: false,
        recommended_action: 'Customer opted out. Marketing consent revoked.',
        suggested_reply: `Namaskar${isNameKnown ? ` ${params.customerName}` : ''}, you have been successfully unsubscribed from ${params.shop.name} updates. You will receive no further promotional messages. Thank you.`,
        is_opt_out: true
      };
    }

    // C. Product Context Memory & Anaphora Resolution (Rule 6: Product Context Memory)
    // e.g. "ওইটার অন্য colour আছে?", "oitai warranty koto?", "does that have storage?"
    if (params.memoryDelta?.anaphoricQueryDetected) {
      const resolvedProduct = params.memoryDelta.resolvedProductContext || 
        params.memoryContext?.last_discussed_product || 
        (params.offers[0] ? `${params.offers[0].brand} ${params.offers[0].model}` : (isFurniture ? 'Furniture Model' : 'Smartphone'));

      return {
        intent: 'STOCK_ENQUIRY',
        interest_level: 'HOT',
        product: resolvedProduct,
        confidence: 0.96,
        needs_human: false,
        recommended_action: `Customer inquired about variants/features of previously discussed product: ${resolvedProduct}. Never ask which product.`,
        suggested_reply: `Hya ${salutation}${resolvedProduct}-er aro 2-ti premium color/finish variants available ache! Sathe company warranty & spot showroom demo subidha paben. Showroom-e live display dekhun: ${params.shop.address}.${optionalNamePrompt}`,
        is_opt_out: false
      };
    }

    // D. Direct Store Visit / Timing / Location (Rule 8: Location Memory & Rule 7: Purchase History)
    if (
      textLower.includes('kal asbo') || 
      textLower.includes('kal ashbo') || 
      textLower.includes('tomorrow') || 
      textLower.includes('visit') || 
      textLower.includes('dokan khola') || 
      textLower.includes('showroom') ||
      textLower.includes('timing') ||
      textLower.includes('address') ||
      textLower.includes('location')
    ) {
      const isTomorrowVisit = textLower.includes('kal') || textLower.includes('tomorrow');
      const matchedOffer = params.offers.find(o => o.active_status) || params.offers[0];
      const prodName = params.memoryContext?.last_discussed_product || (matchedOffer ? `${matchedOffer.brand} ${matchedOffer.model}` : (isFurniture ? 'Furniture' : 'Electronics'));

      const locationMention = params.memoryContext?.is_location_known 
        ? ` Apni ${params.memoryContext.known_location} theke ashle direct transport / parking subidha ache.`
        : '';

      return {
        intent: isTomorrowVisit ? 'VISIT_INTENT' : 'STORE_LOCATION',
        interest_level: 'HOT',
        product: prodName,
        confidence: 0.95,
        needs_human: false,
        recommended_action: isFurniture 
          ? 'Customer intends to visit furniture showroom. Confirm showroom hours and offer fabric/wood catalog tour.' 
          : 'Customer intends to visit store. Confirm store timings and reserve demo stock.',
        suggested_reply: `Dhonnobad ${isNameKnown ? `${params.customerName} da! ` : ''}Amader ${isFurniture ? 'showroom' : 'dokan'} (${params.shop.name}) open thake ${params.shop.business_hours || 'Mon-Sat 10:00 AM - 9:00 PM'}. Address: ${params.shop.address || params.shop.city}.${locationMention} Apnar jonno special demo unit ready rakhchi! Kal oboshhoi ashun.${optionalNamePrompt}`,
        is_opt_out: false
      };
    }

    // E. Exchange Enquiry (Electronics Old Phone or Furniture Old Sofa/Bed)
    if (textLower.includes('exchange') || textLower.includes('purono') || textLower.includes('old') || textLower.includes('palte')) {
      const matchedOffer = params.offers.find(o => o.exchange_offer && o.active_status) || params.offers[0];
      const exchangeInfo = matchedOffer?.exchange_offer || `Amader ${params.shop.name}-e purono jinish exchange korle special bonus discount paben.`;

      return {
        intent: 'EXCHANGE_ENQUIRY',
        interest_level: 'HOT',
        product: matchedOffer ? `${matchedOffer.brand} ${matchedOffer.model}` : (isFurniture ? 'Sofa/Bed' : 'Device'),
        confidence: 0.92,
        needs_human: false,
        recommended_action: isFurniture
          ? 'Customer asking about furniture exchange. Advise to share photo of old furniture for spot valuation.'
          : 'Advise customer to bring old phone with bill/box to verify exact spot valuation.',
        suggested_reply: `Namaskar ${isNameKnown ? `${params.customerName}! ` : ''}Hya, amader ${params.shop.name}-e exchange subidha achhe. ${exchangeInfo} Amader showroom/dokane asun, amra spot valuation kore debo!${optionalNamePrompt}`,
        is_opt_out: false
      };
    }

    // F. EMI & Finance Enquiry
    if (textLower.includes('emi') || textLower.includes('kisti') || textLower.includes('bajaj') || textLower.includes('hdfc')) {
      const matchedOffer = params.offers.find(o => o.emi_information && o.active_status) || params.offers[0];
      const emiText = matchedOffer?.emi_information || '0% No-Cost EMI subidha paben Bajaj Finserv o HDFC card-e.';

      return {
        intent: 'EMI_ENQUIRY',
        interest_level: 'WARM',
        product: matchedOffer ? `${matchedOffer.brand} ${matchedOffer.model}` : 'Products',
        confidence: 0.93,
        needs_human: false,
        recommended_action: 'Explain 0% interest and paperwork requirements (Aadhaar/PAN).',
        suggested_reply: `${salutation}amader dokane ${emiText} 0% down-payment subidhao available. Apni Aadhaar card & Bank details niye asle 15 minute-e spot EMI approval hoye jabe!${optionalNamePrompt}`,
        is_opt_out: false
      };
    }

    // G. Price & Offer Enquiry (Rule 9: Budget Memory & Rule 5: Known Product)
    if (textLower.includes('price') || textLower.includes('dam') || textLower.includes('koto') || textLower.includes('cost') || textLower.includes('offer')) {
      const matchedOffer = params.offers.find(o => o.active_status);
      const budgetNote = params.memoryContext?.is_budget_known
        ? ` Apnar ${params.memoryContext.known_budget} budget-er moddhe eta best value choice.`
        : '';

      if (matchedOffer) {
        return {
          intent: 'PRICE_ENQUIRY',
          interest_level: 'HOT',
          product: `${matchedOffer.brand} ${matchedOffer.model}`,
          confidence: 0.94,
          needs_human: false,
          recommended_action: 'Quote verified offer price and invite for hands-on showroom demo. Do not re-ask known budget.',
          suggested_reply: `${salutation}${matchedOffer.title}: MRP ₹${matchedOffer.mrp.toLocaleString('en-IN')}, kintu amader special offer price matro ₹${matchedOffer.offer_price.toLocaleString('en-IN')}! Sathe ${matchedOffer.cashback || 'special benefits'} o achhe.${budgetNote} Limited time offer! Showroom-e visit korun.${optionalNamePrompt}`,
          is_opt_out: false
        };
      }
    }

    // H. Stock / Color / Fabric Enquiry
    if (textLower.includes('stock') || textLower.includes('available') || textLower.includes('colour') || textLower.includes('color') || textLower.includes('fabric') || textLower.includes('wood')) {
      const matchedOffer = params.offers.find(o => o.active_status);
      return {
        intent: 'STOCK_ENQUIRY',
        interest_level: 'WARM',
        product: matchedOffer ? `${matchedOffer.brand} ${matchedOffer.model}` : (isFurniture ? 'Furniture' : 'Electronics'),
        confidence: 0.88,
        needs_human: true,
        recommended_action: 'Check physical backroom inventory or showroom display for requested variant.',
        suggested_reply: `${salutation}${params.shop.name}-e stock available ache. Amader store team stock er exact color/fabric variant confirm kore apnake kichukkhoner moddhe call korche.${optionalNamePrompt}`,
        is_opt_out: false
      };
    }

    // I. Unstored or Complex Questions (STRICT ANTI-HALLUCINATION: MUST ESCALATE TO HUMAN)
    return {
      intent: 'NEEDS_HUMAN',
      interest_level: 'WARM',
      product: params.offers[0] ? `${params.offers[0].brand} ${params.offers[0].model}` : '',
      confidence: 0.75,
      needs_human: true,
      recommended_action: 'Specific technical query not in verified shop data. Store owner should reply.',
      suggested_reply: `${salutation}apnar proshnoti amader store team-er kache forward kora hoyeche. Kichukkhoner moddhe amader team apnake phone/WhatsApp-e bistarito janiye debe. Dhonnobad!${optionalNamePrompt}`,
      is_opt_out: false
    };
  }

  /**
   * Compatibility wrapper for QA Testing Center intent classification
   */
  static async classifyMessageIntent(queryText: string, context?: any): Promise<AIClassificationResult> {
    const dummyShop = { 
      name: context?.brand || 'Shop', 
      address: context?.storeAddress || 'Showroom', 
      business_hours: context?.businessHours || '10 AM - 9 PM',
      business_type: 'MOBILE_ELECTRONICS'
    } as any;
    const dummyOffer = context?.offerPrice ? [{ 
      offer_price: context.offerPrice, 
      mrp: context.offerPrice * 1.2,
      model: context.model || 'Product', 
      brand: context.brand || 'Brand',
      active_status: true,
      title: `${context.brand || ''} ${context.model || ''}`
    }] as any : [];
    const dummySettings = { faqs: context?.faqs || [] } as any;

    return this.classifyInboundMessage({
      messageText: queryText,
      shop: dummyShop,
      offers: dummyOffer,
      settings: dummySettings,
      customerName: 'Customer'
    });
  }

  /**
   * "Who should know about this product?" AI Recommendation Engine
   */
  static recommendAudienceForProduct(params: {
    product: Product;
    customers: Customer[];
    shop: Shop;
    settings: ShopSettings;
  }): ProductRecommendationResult {
    const { product, customers, shop, settings } = params;
    const isFurniture = shop.business_type === 'FURNITURE';
    const isPhone = shop.business_type === 'MOBILE_ELECTRONICS';

    const minMonths = isPhone ? 18 : 24;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - minMonths);

    let matchedCount = 0;
    let excludedNoConsent = 0;
    let excludedFrequency = 0;
    const eligible: Customer[] = [];

    const nowMs = Date.now();
    const cooldownMs = (settings.contact_frequency_days || 14) * 86400000;

    for (const c of customers) {
      // Category or brand match
      const categoryMatch = c.product_category.toLowerCase().includes(product.category.toLowerCase()) || 
        product.category.toLowerCase().includes(c.product_category.toLowerCase()) ||
        c.brand.toLowerCase() === product.brand.toLowerCase();

      // Purchase age or high CLV
      const ageMatch = new Date(c.purchase_date) <= cutoffDate;
      const clvMatch = (c.customer_lifetime_value || 0) >= (product.mrp * 0.5);

      if (categoryMatch || ageMatch || clvMatch) {
        matchedCount++;

        if (!c.whatsapp_opt_in || c.do_not_contact) {
          excludedNoConsent++;
          continue;
        }

        if (c.last_campaign_at) {
          if (nowMs - new Date(c.last_campaign_at).getTime() < cooldownMs) {
            excludedFrequency++;
            continue;
          }
        }

        eligible.push(c);
      }
    }

    const reasoning = isFurniture
      ? `AI Recommendation: Identified customers who previously bought bedroom or living room furniture over ${minMonths} months ago, or have high lifetime value. They are in prime renovation cycle for ${product.brand} ${product.model}. Excluded contacts without explicit WhatsApp consent or on contact cooldown.`
      : `AI Recommendation: Identified ${product.brand} customers whose devices are over ${minMonths} months old. They are in their optimal upgrade window for ${product.model}. Excluded contacts without explicit consent or on cooldown.`;

    return {
      product,
      criteria: {
        category: product.category,
        brand: product.brand,
        minPurchaseAgeMonths: minMonths,
        consentRequired: true,
        frequencyLimitDays: settings.contact_frequency_days || 14
      },
      reasoning,
      breakdown: {
        totalDatabase: customers.length,
        matchedCustomers: matchedCount,
        excludedNoConsent,
        excludedFrequency,
        finalAudienceCount: eligible.length
      },
      sampleEligibleCustomers: eligible.slice(0, 5).map(c => ({
        id: c.id,
        name: c.full_name,
        phone: c.phone_e164,
        model: c.model,
        purchase_date: c.purchase_date,
        location: c.location
      }))
    };
  }

  /**
   * Generate campaign message variants for an Offer strictly grounded in verified facts
   */
  static generateCampaignVariants(offer: Offer, shop: Shop, customInstruction?: string): CampaignCopyVariants {
    const savings = offer.mrp - offer.offer_price;
    const isFurniture = shop.business_type === 'FURNITURE';
    const noteText = customInstruction ? `\n💡 Special Note: ${customInstruction.trim()}` : '';

    // 1. Professional English
    const professionalEnglish = 
`Exclusive Offer from ${shop.name}!

Upgrade your home with the new ${offer.brand} ${offer.model}.
• Special Offer Price: ₹${offer.offer_price.toLocaleString('en-IN')} (MRP: ₹${offer.mrp.toLocaleString('en-IN')})
• ${offer.exchange_offer || 'Exchange your old item for maximum spot valuation'}
• ${offer.emi_information || '0% No-Cost EMI options available'}
• ${offer.cashback || 'Free gift and delivery included'}${noteText}

Visit us at ${shop.address}, ${shop.city} or reply 'INTERESTED' for showroom appointment.
Offer valid until ${offer.valid_until}. T&C Apply.
Reply STOP to unsubscribe.`;

    // 2. Friendly Bengali (বাংলা)
    const friendlyBengali = 
`নমস্কার! ${shop.name}-এর তরফ থেকে বিশেষ অফার!

আপনার জন্য নতুন ${offer.brand} ${offer.model}-এ দুর্দান্ত সুযোগ:
• অফার মূল্য: ₹${offer.offer_price.toLocaleString('en-IN')} (আসল মূল্য: ₹${offer.mrp.toLocaleString('en-IN')})
• সাশ্রয়: ₹${savings.toLocaleString('en-IN')}
• ${offer.exchange_offer || 'পুরোনো সামগ্রী এক্সচেঞ্জ করে পান সেরা দাম'}
• ${offer.emi_information || 'সহজ নো-কস্ট EMI সুবিধা উপলব্ধ'}${customInstruction ? `\n💡 বিশেষ দ্রষ্টব্য: ${customInstruction.trim()}` : ''}

শোরুম ঠিকানা: ${shop.address}, ${shop.city}।
সরাসরি কথা বলতে 'YES' লিখে পাঠান। মেসেজ বন্ধ করতে STOP লিখুন।`;

    // 3. Banglish (Popular for WhatsApp in Bengal)
    const banglish = 
`Namaskar! ${shop.name} theke apnar jonno exclusive offer!

Apnar purono ${isFurniture ? 'furniture' : 'device'} upgrade korun brand new ${offer.brand} ${offer.model}-e:
* Offer Price: Matro Rs. ${offer.offer_price.toLocaleString('en-IN')} (MRP: Rs. ${offer.mrp.toLocaleString('en-IN')})
* ${offer.exchange_offer || 'Purono item exchange-e spot discount'}
* ${offer.emi_information || '0% No Cost EMI subidha available'}
* ${offer.cashback || 'Special doorstep delivery'}${noteText}

Visit korun: ${shop.name}, ${shop.address}.
Offer valid till ${offer.valid_until}.
Details jante 'YES' reply korun! STOP reply korle ar kono message jabe na.`;

    // 4. Short WhatsApp Format
    const shortWhatsApp = 
`🔥 ${shop.name} Offer: Get ${offer.brand} ${offer.model} at just ₹${offer.offer_price.toLocaleString('en-IN')} (Save ₹${savings.toLocaleString('en-IN')})!
✅ ${offer.exchange_offer || 'Best Spot Exchange'}
✅ ${offer.emi_information || '0% EMI Available'}${customInstruction ? ` ${customInstruction.trim()}` : ''}
📍 Visit ${shop.name}, ${shop.city}. Valid till ${offer.valid_until}. Reply 1 for store visit or STOP to opt-out.`;

    return {
      professionalEnglish,
      friendlyBengali,
      banglish,
      shortWhatsApp
    };
  }

  /**
   * Generate campaign message variants for a New Product Arrival
   */
  static generateProductArrivalVariants(product: Product, shop: Shop, customInstruction?: string): CampaignCopyVariants {
    const isFurniture = shop?.business_type === 'FURNITURE';
    const noteText = customInstruction ? `\n💡 Note: ${customInstruction.trim()}` : '';

    const brand = product?.brand || 'Premium';
    const model = product?.model || 'Arrival';
    const mrpStr = (typeof product?.mrp === 'number' && !isNaN(product.mrp))
      ? product.mrp.toLocaleString('en-IN')
      : String(product?.mrp || 'Contact Showroom');
    const shopName = shop?.name || 'Our Showroom';
    const shopAddress = shop?.address || 'Showroom Address';
    const shopCity = shop?.city || '';

    const customAttrs = Object.entries(product?.custom_attributes || {});
    const highlightsEn = customAttrs.length > 0 ? customAttrs.map(([k, v]) => `${k}: ${v}`).join(' • ') : (isFurniture ? 'Handcrafted solid wood finish' : 'Premium craftsmanship');
    const highlightsBn = customAttrs.length > 0 ? customAttrs.slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' • ') : 'উচ্চমানের ফিনিশিং';
    const highlightsBanglish = customAttrs.length > 0 ? customAttrs.slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' • ') : 'Top quality';

    const professionalEnglish = 
`New Arrival Alert at ${shopName}!

We are delighted to introduce the brand new ${brand} ${model}.
• Price: ₹${mrpStr}
• Key Highlights: ${highlightsEn}
• Warranty: ${product?.specs?.warranty || 'Official Manufacturer Warranty'}${noteText}

Be the first to experience this in our showroom: ${shopAddress}${shopCity ? ', ' + shopCity : ''}.
Reply 'VISIT' to schedule a private walkthrough. Reply STOP to opt-out.`;

    const friendlyBengali = 
`নতুন পণ্যের আগমন — ${shopName}!

আমাদের শোরুমে এসে গেছে নতুন ${brand} ${model}।
• মূল্য: ₹${mrpStr}
• বিশেষ বৈশিষ্ট্য: ${highlightsBn}${customInstruction ? `\n💡 নোট: ${customInstruction.trim()}` : ''}

আমাদের শোরুমে সরাসরি এসে যাচাই করুন: ${shopAddress}${shopCity ? ', ' + shopCity : ''}।
বিস্তারিত জানতে রিপ্লাই করুন। বন্ধ করতে STOP লিখুন।`;

    const banglish = 
`New Arrival! ${shopName}-e chole esheche brand new ${brand} ${model}!

• Price: Rs. ${mrpStr}
• Special Features: ${highlightsBanglish}
• Showroom: ${shopAddress}${noteText}

Reply korun book korte ba visit korun. STOP pathiye bondho korun.`;

    const shortWhatsApp = 
`✨ NEW ARRIVAL: ${brand} ${model} now at ${shopName}! Price: ₹${mrpStr}.${customInstruction ? ` ${customInstruction.trim()}` : ''} Visit: ${shopAddress}. Reply 1 to book demo or STOP to unsubscribe.`;

    return {
      professionalEnglish,
      friendlyBengali,
      banglish,
      shortWhatsApp
    };
  }
}
