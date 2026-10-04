import { store } from '../db/store.js';
import { 
  Customer, OccasionType, OccasionAutomationSettings, OccasionLog, 
  Conversation, Message, MessageDeliveryStatus 
} from '../types.js';
import { WhatsAppService } from './whatsappService.js';
import { CampaignSafetyEngine } from './campaignSafetyEngine.js';
import { v4 as uuidv4 } from 'uuid';

export interface OccasionDueItem {
  customer: Customer;
  occasion_type: OccasionType;
  occasion_label: string;
  year: number;
  years_count?: number; // for purchase anniversary
  has_offer: boolean;
  offer_summary?: string;
  is_eligible: boolean;
  ineligibility_reason?: string;
}

export class OccasionService {
  /**
   * Evaluates due occasions for a shop on a target date (default: today)
   */
  static getDueOccasions(
    shopId: string, 
    targetDate: Date = new Date(),
    daysInAdvance: number = 0
  ): OccasionDueItem[] {
    const shop = store.getShop(shopId);
    if (!shop) return [];

    const settings = store.getOccasionSettings(shopId) || {
      birthday_enabled: true,
      wedding_anniversary_enabled: true,
      purchase_anniversary_enabled: true,
      relationship_anniversary_enabled: true,
      send_days_in_advance: 0,
      offers: {
        birthday: { enabled: false },
        wedding_anniversary: { enabled: false },
        purchase_anniversary: { enabled: false }
      }
    } as any;

    const customers = store.getCustomers(shopId);
    const existingLogs = store.getOccasionLogs(shopId);

    // Compute target date plus advance days
    const evalDate = new Date(targetDate.getTime() + daysInAdvance * 86400000);
    const currentYear = evalDate.getFullYear();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const targetMMDD = `${pad(evalDate.getMonth() + 1)}-${pad(evalDate.getDate())}`;

    const dueList: OccasionDueItem[] = [];

    for (const customer of customers) {
      // 1. Birthday Check
      if (settings.birthday_enabled && customer.date_of_birth) {
        const custDobMMDD = customer.date_of_birth.slice(5, 10);
        if (custDobMMDD === targetMMDD) {
          const idempotencyKey = `${shopId}:${customer.id}:BIRTHDAY:${currentYear}`;
          const alreadySent = existingLogs.some(
            l => l.idempotency_key === idempotencyKey && (l.status === 'SENT' || l.status === 'DELIVERED' || l.status === 'REDEEMED')
          );

          let isEligible = true;
          let ineligibilityReason = '';

          if (alreadySent) {
            isEligible = false;
            ineligibilityReason = `Already received ${currentYear} Birthday Greeting (Duplicate Protected)`;
          } else if (customer.do_not_contact) {
            isEligible = false;
            ineligibilityReason = 'Customer marked Do Not Contact';
          } else if (!customer.whatsapp_opt_in) {
            isEligible = false;
            ineligibilityReason = 'No WhatsApp marketing consent';
          } else if (!customer.phone_e164 || customer.phone_e164.length !== 13) {
            isEligible = false;
            ineligibilityReason = 'Invalid phone number format';
          }

          const offerConfig = settings.offers?.birthday;
          const hasOffer = Boolean(offerConfig?.enabled && !offerConfig?.is_paused);
          const offerSummary = hasOffer 
            ? `${offerConfig.offer_name} (${offerConfig.discount_type === 'PERCENTAGE' ? `${offerConfig.discount_value}%` : `₹${offerConfig.discount_value}`} Off, Coupon: ${offerConfig.coupon_code})`
            : undefined;

          dueList.push({
            customer,
            occasion_type: 'BIRTHDAY',
            occasion_label: 'Birthday',
            year: currentYear,
            has_offer: hasOffer,
            offer_summary: offerSummary,
            is_eligible: isEligible,
            ineligibility_reason: ineligibilityReason
          });
        }
      }

      // 2. Wedding Anniversary Check
      if (settings.wedding_anniversary_enabled && customer.wedding_anniversary) {
        const custAnnivMMDD = customer.wedding_anniversary.slice(5, 10);
        if (custAnnivMMDD === targetMMDD) {
          const idempotencyKey = `${shopId}:${customer.id}:WEDDING_ANNIVERSARY:${currentYear}`;
          const alreadySent = existingLogs.some(
            l => l.idempotency_key === idempotencyKey && (l.status === 'SENT' || l.status === 'DELIVERED' || l.status === 'REDEEMED')
          );

          let isEligible = true;
          let ineligibilityReason = '';

          if (alreadySent) {
            isEligible = false;
            ineligibilityReason = `Already received ${currentYear} Wedding Anniversary Greeting`;
          } else if (customer.do_not_contact) {
            isEligible = false;
            ineligibilityReason = 'Customer marked Do Not Contact';
          } else if (!customer.whatsapp_opt_in) {
            isEligible = false;
            ineligibilityReason = 'No WhatsApp marketing consent';
          } else if (!customer.phone_e164 || customer.phone_e164.length !== 13) {
            isEligible = false;
            ineligibilityReason = 'Invalid phone number format';
          }

          const offerConfig = settings.offers?.wedding_anniversary;
          const hasOffer = Boolean(offerConfig?.enabled && !offerConfig?.is_paused);
          const offerSummary = hasOffer 
            ? `${offerConfig.offer_name} (${offerConfig.discount_type === 'PERCENTAGE' ? `${offerConfig.discount_value}%` : `₹${offerConfig.discount_value}`} Off, Coupon: ${offerConfig.coupon_code})`
            : undefined;

          dueList.push({
            customer,
            occasion_type: 'WEDDING_ANNIVERSARY',
            occasion_label: 'Wedding Anniversary',
            year: currentYear,
            has_offer: hasOffer,
            offer_summary: offerSummary,
            is_eligible: isEligible,
            ineligibility_reason: ineligibilityReason
          });
        }
      }

      // 3. Purchase Anniversary Check (Exact full year anniversaries: 1 yr, 2 yrs, 3 yrs...)
      if (settings.purchase_anniversary_enabled && (customer.first_purchase_date || customer.purchase_date)) {
        const pDateStr = customer.first_purchase_date || customer.purchase_date;
        const pDate = new Date(pDateStr);
        const pYear = pDate.getFullYear();
        const pMMDD = pDateStr.slice(5, 10);
        const yearsPassed = currentYear - pYear;

        if (pMMDD === targetMMDD && yearsPassed >= 1) {
          const idempotencyKey = `${shopId}:${customer.id}:PURCHASE_ANNIVERSARY:${currentYear}`;
          const alreadySent = existingLogs.some(
            l => l.idempotency_key === idempotencyKey && (l.status === 'SENT' || l.status === 'DELIVERED' || l.status === 'REDEEMED')
          );

          let isEligible = true;
          let ineligibilityReason = '';

          if (alreadySent) {
            isEligible = false;
            ineligibilityReason = `Already sent ${yearsPassed}-year purchase anniversary in ${currentYear}`;
          } else if (customer.do_not_contact) {
            isEligible = false;
            ineligibilityReason = 'Customer marked Do Not Contact';
          } else if (!customer.whatsapp_opt_in) {
            isEligible = false;
            ineligibilityReason = 'No WhatsApp marketing consent';
          } else if (!customer.phone_e164 || customer.phone_e164.length !== 13) {
            isEligible = false;
            ineligibilityReason = 'Invalid phone number format';
          }

          const offerConfig = settings.offers?.purchase_anniversary;
          const hasOffer = Boolean(offerConfig?.enabled && !offerConfig?.is_paused);
          const offerSummary = hasOffer 
            ? `${offerConfig.offer_name} (${offerConfig.discount_type === 'PERCENTAGE' ? `${offerConfig.discount_value}%` : `₹${offerConfig.discount_value}`} Off, Coupon: ${offerConfig.coupon_code})`
            : undefined;

          dueList.push({
            customer,
            occasion_type: 'PURCHASE_ANNIVERSARY',
            occasion_label: `${yearsPassed}-Year Purchase Anniversary`,
            year: currentYear,
            years_count: yearsPassed,
            has_offer: hasOffer,
            offer_summary: offerSummary,
            is_eligible: isEligible,
            ineligibility_reason: ineligibilityReason
          });
        }
      }
    }

    return dueList;
  }

  /**
   * Compiles the grounded message copy conforming strictly to shopkeeper configuration
   */
  static compileOccasionMessage(
    shopId: string,
    customer: Customer,
    occasionType: OccasionType,
    yearsCount: number = 1
  ): { message: string; offerIncluded: boolean; couponCode?: string; discountDetails?: string } {
    const shop = store.getShop(shopId);
    const shopName = shop?.name || 'Saha Electronics';
    const settings = store.getOccasionSettings(shopId);
    const customerName = customer.full_name?.trim() || '';
    const nameToken = customerName ? customerName : 'সম্মানীয় গ্রাহক';
    const productToken = customer.model || customer.brand || 'Electronics & Mobile';

    let offerIncluded = false;
    let couponCode: string | undefined;
    let discountDetails: string | undefined;

    let message = '';

    if (occasionType === 'BIRTHDAY') {
      const offer = settings?.offers?.birthday;
      const isOfferActive = Boolean(offer?.enabled && !offer?.is_paused);

      if (isOfferActive && offer) {
        offerIncluded = true;
        couponCode = offer.coupon_code;
        discountDetails = offer.discount_type === 'PERCENTAGE' 
          ? `${offer.discount_value}% Discount on ${offer.applicable_category || 'Store Items'}`
          : `₹${offer.discount_value} Off on ${offer.applicable_category || 'Store Items'}`;

        const validityDaysText = offer.validity_option === '3_DAYS' 
          ? 'আগামী 3 দিন valid' 
          : offer.validity_option === '7_DAYS' 
          ? 'আগামী 7 দিন valid' 
          : 'আজকের জন্য valid';

        message = `শুভ জন্মদিন ${nameToken}! 🎉\nআপনার জন্য রয়েছে Birthday Special Offer —\n${offer.applicable_category || 'Special Items'}-এ ${offer.discount_type === 'PERCENTAGE' ? `${offer.discount_value}%` : `₹${offer.discount_value}`} discount!\nCoupon Code: ${offer.coupon_code}\n${validityDaysText}।\n— ${shopName}`;
      } else {
        message = `শুভ জন্মদিন ${nameToken}! 🎉\nআপনার জন্য রইল আন্তরিক প্রীতি ও অনেক শুভেচ্ছা।\nদিনটি আনন্দময় হয়ে উঠুক!\n— ${shopName}`;
      }
    } else if (occasionType === 'WEDDING_ANNIVERSARY') {
      const offer = settings?.offers?.wedding_anniversary;
      const isOfferActive = Boolean(offer?.enabled && !offer?.is_paused);

      if (isOfferActive && offer) {
        offerIncluded = true;
        couponCode = offer.coupon_code;
        discountDetails = offer.discount_type === 'PERCENTAGE' 
          ? `${offer.discount_value}% Discount on ${offer.applicable_category || 'Store Items'}`
          : `₹${offer.discount_value} Off on ${offer.applicable_category || 'Store Items'}`;

        message = `আপনাদের বিবাহবার্ষিকীর অনেক শুভেচ্ছা ${nameToken}! 💐\nদিনটিকে আরও স্পেশাল করতে আমাদের দোকানে রয়েছে Anniversary Special Offer —\n${offer.applicable_category || 'Store items'}-এ flat ${offer.discount_type === 'PERCENTAGE' ? `${offer.discount_value}%` : `₹${offer.discount_value}`} discount!\nCoupon: ${offer.coupon_code}\n— ${shopName}`;
      } else {
        message = `আপনাদের বিবাহবার্ষিকীর অনেক শুভেচ্ছা ${nameToken} 💐\nসুন্দর দিনটি আরও বিশেষ হয়ে উঠুক।\n— ${shopName}`;
      }
    } else if (occasionType === 'PURCHASE_ANNIVERSARY') {
      const offer = settings?.offers?.purchase_anniversary;
      const isOfferActive = Boolean(offer?.enabled && !offer?.is_paused);

      if (isOfferActive && offer) {
        offerIncluded = true;
        couponCode = offer.coupon_code;
        discountDetails = `${offer.discount_value}% Off Loyalty`;

        message = `${nameToken},\nআজ থেকে ${yearsCount} বছর আগে আপনি আমাদের কাছ থেকে ${productToken} নিয়েছিলেন।\nআমাদের সঙ্গে থাকার জন্য ধন্যবাদ! আপনার জন্য রয়েছে Anniversary Special Loyalty Benefit (${offer.coupon_code})।\n— ${shopName}`;
      } else {
        message = `${nameToken},\nআজ থেকে ${yearsCount} বছর আগে আপনি আমাদের কাছ থেকে ${productToken} নিয়েছিলেন।\nআমাদের সঙ্গে থাকার জন্য ধন্যবাদ। নতুন collection ও offer জানতে reply করতে পারেন।\n— ${shopName}`;
      }
    } else {
      message = `নমস্কার ${nameToken}! ${shopName}-এর তরফ থেকে আপনাকে আন্তরিক শুভেচ্ছা।`;
    }

    return { message, offerIncluded, couponCode, discountDetails };
  }

  /**
   * Dispatches an occasion greeting to an individual customer with full idempotency & audit logging
   */
  static async sendOccasionGreeting(
    shopId: string,
    customer: Customer,
    occasionType: OccasionType,
    customMessage?: string,
    bypassQuietHours: boolean = false,
    bypassIdempotency: boolean = false
  ): Promise<{ success: boolean; log?: OccasionLog; error?: string }> {
    const shop = store.getShop(shopId);
    if (!shop) return { success: false, error: 'Shop not found' };

    const currentYear = new Date().getFullYear();
    const idempotencyKey = `${shopId}:${customer.id}:${occasionType}:${currentYear}`;

    // 1. Idempotency Check (Duplicate yearly send prevention)
    if (!bypassIdempotency) {
      const existing = store.occasionLogs.find(
        l => l.idempotency_key === idempotencyKey && (l.status === 'SENT' || l.status === 'DELIVERED' || l.status === 'REDEEMED')
      );
      if (existing) {
        store.logSystemEvent({
          name: 'Occasion Send Skipped: DUPLICATE_YEARLY_PROTECTED',
          shop_id: shopId,
          customer_id: customer.id,
          customer_name: customer.full_name,
          source: 'OCCASION_AUTOMATION',
          status: 'WARNING',
          payload: { idempotency_key: idempotencyKey, occasion_type: occasionType, year: currentYear }
        });
        return { success: false, error: `Customer already received ${occasionType} greeting for ${currentYear}. Duplicate prevented.` };
      }
    }

    // 2. Eligibility & Consent Verification
    if (customer.do_not_contact) {
      return { success: false, error: 'Customer is flagged as Do Not Contact (opted out).' };
    }
    if (!customer.whatsapp_opt_in) {
      return { success: false, error: 'Customer has not provided WhatsApp marketing consent.' };
    }
    if (!customer.phone_e164 || !customer.phone_e164.startsWith('+91') || customer.phone_e164.length !== 13) {
      return { success: false, error: 'Customer phone number is invalid.' };
    }

    // 3. Quiet Hours Check
    const shopSettings = store.shopSettings[shopId] || {
      quiet_hours_start: '21:00:00',
      quiet_hours_end: '09:00:00'
    } as any;

    if (!bypassQuietHours) {
      const quietCheck = CampaignSafetyEngine.isQuietHours(shopSettings);
      if (quietCheck.inQuietHours) {
        return { success: false, error: quietCheck.message || 'Blocked by commercial quiet hours.' };
      }
    }

    // 4. Message Assembly
    const compiled = this.compileOccasionMessage(shopId, customer, occasionType);
    const bodyText = customMessage || compiled.message;

    // 5. Dispatch via Unified Provider (Mock or Live Cloud API)
    const integration = store.integrationSettings[shopId] || {
      id: 'mock',
      shop_id: shopId,
      provider: 'MOCK',
      phone_number_id: 'mock',
      waba_id: 'mock',
      access_token: '',
      webhook_secret: '',
      status: 'CONNECTED',
      last_sync_at: new Date().toISOString()
    };

    const sendRes = await WhatsAppService.dispatchMessage(
      {
        to: customer.phone_e164,
        text: bodyText
      },
      integration
    );

    const nowStr = new Date().toISOString();

    // 6. Ensure Conversation Exists with Occasion Attribution Source
    const sourceRef = occasionType === 'BIRTHDAY' 
      ? 'Birthday Automation' 
      : occasionType === 'WEDDING_ANNIVERSARY'
      ? 'Wedding Anniversary Automation'
      : 'Purchase Anniversary Automation';

    let conv = store.conversations.find(c => c.customer_id === customer.id);
    if (!conv) {
      conv = {
        id: uuidv4(),
        shop_id: shopId,
        customer_id: customer.id,
        customer_name: customer.full_name,
        customer_phone: customer.phone_e164,
        channel: 'WHATSAPP',
        source_reference: sourceRef,
        last_message_at: nowStr,
        status: 'ACTIVE',
        assigned_to: 'AI_AGENT',
        is_human_takeover: false,
        lead_score: 30,
        intent: 'OCCASION_GREETING',
        interest_level: 'WARM',
        interested_product: compiled.couponCode ? `Occasion Offer: ${compiled.couponCode}` : 'Greeting Celebrations',
        recommended_action: 'Awaiting customer response to celebratory greeting',
        created_at: nowStr,
        updated_at: nowStr
      };
      store.conversations.unshift(conv);
    } else {
      conv.source_reference = sourceRef;
      conv.last_message_at = nowStr;
      conv.updated_at = nowStr;
    }

    // 7. Save outbound message to Unified Message Store
    const msgRecord: Message = {
      id: uuidv4(),
      shop_id: shopId,
      conversation_id: conv.id,
      direction: 'OUTBOUND',
      channel: 'WHATSAPP',
      sender_phone: '+919830012345',
      recipient_phone: customer.phone_e164,
      provider_message_id: sendRes.providerMessageId,
      body: bodyText,
      status: sendRes.status as MessageDeliveryStatus,
      ai_generated: false,
      intent_classified: 'OCCASION_GREETING',
      created_at: nowStr
    };
    store.messages.push(msgRecord);

    // 8. Update customer record timestamps
    if (occasionType === 'BIRTHDAY') {
      customer.last_birthday_message_at = nowStr;
    } else if (occasionType === 'WEDDING_ANNIVERSARY') {
      customer.last_anniversary_message_at = nowStr;
    } else if (occasionType === 'PURCHASE_ANNIVERSARY') {
      customer.last_purchase_anniversary_message_at = nowStr;
    }
    customer.last_campaign_at = nowStr;

    // 9. Record Occasion Log
    const occasionLog: OccasionLog = {
      id: uuidv4(),
      shop_id: shopId,
      customer_id: customer.id,
      customer_name: customer.full_name,
      customer_phone: customer.phone_e164,
      occasion_type: occasionType,
      year: currentYear,
      idempotency_key: idempotencyKey,
      channel: 'WHATSAPP',
      message: bodyText,
      offer_included: compiled.offerIncluded,
      coupon_code: compiled.couponCode,
      discount_details: compiled.discountDetails,
      status: sendRes.status === 'FAILED' ? 'FAILED' : 'SENT',
      sent_at: nowStr,
      delivered_at: sendRes.status !== 'FAILED' ? nowStr : undefined
    };
    store.occasionLogs.unshift(occasionLog);

    // 10. Trace Event in System Event Inspector
    store.logSystemEvent({
      name: `Occasion Message Dispatched: ${occasionType}`,
      shop_id: shopId,
      customer_id: customer.id,
      customer_name: customer.full_name,
      source: 'OCCASION_AUTOMATION',
      status: sendRes.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
      payload: {
        occasion_type: occasionType,
        year: currentYear,
        recipient_phone: customer.phone_e164,
        offer_included: compiled.offerIncluded,
        coupon_code: compiled.couponCode,
        provider: integration.provider,
        provider_message_id: sendRes.providerMessageId
      }
    });

    return { success: sendRes.status !== 'FAILED', log: occasionLog };
  }

  /**
   * Automated Daily Job: Scans for due occasions and dispatches messages
   */
  static async runDailyOccasionScan(
    shopId?: string,
    targetDate: Date = new Date(),
    bypassQuietHours: boolean = false
  ): Promise<{
    processedShops: number;
    totalDue: number;
    sentCount: number;
    skippedCount: number;
    errorCount: number;
    results: Array<{ shopId: string; customerName: string; occasion: string; status: string; reason?: string }>;
  }> {
    const shopsToProcess = shopId ? store.shops.filter(s => s.id === shopId) : store.shops;
    let totalDue = 0;
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const results: Array<{ shopId: string; customerName: string; occasion: string; status: string; reason?: string }> = [];

    for (const shop of shopsToProcess) {
      const dueList = this.getDueOccasions(shop.id, targetDate);
      totalDue += dueList.length;

      for (const item of dueList) {
        if (!item.is_eligible) {
          skippedCount++;
          results.push({
            shopId: shop.id,
            customerName: item.customer.full_name,
            occasion: item.occasion_label,
            status: 'SKIPPED',
            reason: item.ineligibility_reason
          });
          continue;
        }

        const res = await this.sendOccasionGreeting(
          shop.id,
          item.customer,
          item.occasion_type,
          undefined,
          bypassQuietHours
        );

        if (res.success) {
          sentCount++;
          results.push({
            shopId: shop.id,
            customerName: item.customer.full_name,
            occasion: item.occasion_label,
            status: 'SENT'
          });
        } else {
          errorCount++;
          results.push({
            shopId: shop.id,
            customerName: item.customer.full_name,
            occasion: item.occasion_label,
            status: 'ERROR',
            reason: res.error
          });
        }
      }
    }

    return {
      processedShops: shopsToProcess.length,
      totalDue,
      sentCount,
      skippedCount,
      errorCount,
      results
    };
  }

  /**
   * Records an Occasion Offer Redemption when customer completes a purchase with an occasion coupon
   */
  static recordOccasionRedemption(
    shopId: string,
    customerId: string,
    couponCode: string,
    saleId: string,
    saleAmount: number,
    discountAmount: number
  ): boolean {
    const log = store.occasionLogs.find(
      l => l.shop_id === shopId && l.customer_id === customerId && l.coupon_code?.toUpperCase() === couponCode.toUpperCase()
    );

    if (log) {
      log.status = 'REDEEMED';
      log.redeemed_at = new Date().toISOString();
      log.sale_id = saleId;
      log.attributed_revenue = saleAmount;
    }

    store.logSystemEvent({
      name: 'Occasion Offer Redeemed at Store Checkout',
      shop_id: shopId,
      customer_id: customerId,
      source: 'POS_CHECKOUT',
      status: 'SUCCESS',
      payload: {
        coupon_code: couponCode,
        sale_id: saleId,
        sale_amount: saleAmount,
        discount_amount: discountAmount,
        occasion_log_linked: Boolean(log)
      }
    });

    return Boolean(log);
  }
}
