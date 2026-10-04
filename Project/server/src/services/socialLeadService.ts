import { store } from '../db/store.js';
import { SocialLead, LeadChannel, LeadIntent, LeadInterestLevel, Shop, SocialCommentRecord, Lead, Customer } from '../types.js';
import { AIService } from './aiService.js';
import { v4 as uuidv4 } from 'uuid';

export interface InboundSocialCommentPayload {
  shopId: string;
  channel: LeadChannel; // 'FACEBOOK' | 'INSTAGRAM'
  sourcePostId?: string;
  sourceCommentId?: string;
  authorName: string;
  authorId?: string;
  commentText: string;
  customerPhone?: string; // Optional if lead form provided phone
  adId?: string;
  campaignId?: string;
}

export interface ProcessSocialCommentResult {
  socialLead?: SocialLead;
  publicReply?: string;
  privateReply?: string;
  leadCreated: boolean;
  leadUpdated?: boolean;
  duplicate: boolean;
  status: 'PROCESSED' | 'IGNORED' | 'FAILED';
  intent?: string;
  interestLevel?: string;
  customerId?: string;
  leadId?: string;
}

export class SocialLeadService {
  /**
   * Process an inbound social lead / comment from Facebook Ads, Facebook Pages, or Instagram Posts.
   * Enforces:
   * 1. Idempotent deduplication for identical comment delivery (webhook retries)
   * 2. Customer profile deduplication (single customer across multi-turn comments)
   * 3. Open lead deduplication & progressive intent promotion (same open lead updated)
   * 4. Strict WhatsApp consent rule (social comment DOES NOT grant WhatsApp opt-in)
   */
  static async processSocialComment(payload: InboundSocialCommentPayload): Promise<ProcessSocialCommentResult> {
    const shop = store.getShop(payload.shopId) || store.shops[0];
    const offers = store.getOffers(shop.id);
    const products = store.getProducts(shop.id);
    const settings = store.shopSettings[shop.id];

    const commentId = payload.sourceCommentId || `comm_${Date.now()}`;
    const authorId = payload.authorId || `user_${Date.now()}`;
    const postId = payload.sourcePostId || 'ad_campaign_post_01';

    // =========================================================================
    // 1. IDEMPOTENCY CHECK (Exact same comment re-delivery)
    // =========================================================================
    if (payload.sourceCommentId && store.isCommentProcessed(payload.channel, payload.sourceCommentId)) {
      store.logSystemEvent({
        name: 'DUPLICATE COMMENT DETECTED — EVENT IGNORED',
        shop_id: shop.id,
        source: payload.channel,
        status: 'WARNING',
        payload: {
          channel: payload.channel,
          sourceCommentId: payload.sourceCommentId,
          authorName: payload.authorName,
          reason: 'Duplicate comment webhook ignored via idempotency check'
        }
      });

      const existingSocialLead = store.socialLeads.find(
        sl => sl.channel === payload.channel && sl.source_comment_id === payload.sourceCommentId
      );

      return {
        socialLead: existingSocialLead,
        publicReply: existingSocialLead?.public_reply_sent || '',
        privateReply: existingSocialLead?.private_reply_sent || '',
        leadCreated: false,
        leadUpdated: false,
        duplicate: true,
        status: 'IGNORED',
        intent: existingSocialLead?.intent,
        interestLevel: existingSocialLead?.interest_level
      };
    }

    // Mark comment as processed immediately to prevent concurrent race condition
    if (payload.sourceCommentId) {
      store.markCommentProcessed(payload.channel, payload.sourceCommentId);
    }

    // =========================================================================
    // 2. AI INTENT & SENTIMENT CLASSIFICATION
    // =========================================================================
    const aiClassification = await AIService.classifyInboundMessage({
      messageText: payload.commentText,
      shop,
      offers,
      settings: settings as any,
      customerName: payload.authorName
    });

    const isHot = aiClassification.interest_level === 'HOT' || 
                  aiClassification.intent === 'PRICE_ENQUIRY' || 
                  aiClassification.intent === 'VISIT_INTENT' ||
                  aiClassification.intent === 'EXCHANGE_ENQUIRY';

    // =========================================================================
    // 3. FORMULATE REPLIES (Public comment reply & Private message)
    // =========================================================================
    let publicReply = `Namaskar ${payload.authorName}! Dhonnobad for your interest in ${shop.name}. `;
    if (aiClassification.intent === 'PRICE_ENQUIRY' && offers[0]) {
      publicReply += `Special festival offer price starting at ₹${offers[0].offer_price.toLocaleString('en-IN')}. `;
    } else if (aiClassification.intent === 'STORE_LOCATION' || aiClassification.intent === 'VISIT_INTENT') {
      publicReply += `Our showroom is at ${shop.address}, open ${shop.business_hours}. `;
    } else if (aiClassification.intent === 'EXCHANGE_ENQUIRY') {
      publicReply += `Yes, spot exchange facility is available with instant valuation! `;
    }
    publicReply += `We have sent you complete catalogue and special voucher details via private message!`;

    const privateReply = 
      `Namaskar ${payload.authorName}! Thank you for commenting on our ${payload.channel === 'INSTAGRAM' ? 'Instagram post' : 'Facebook Ad'}. ` +
      `Special offer details for ${shop.name}: \n` +
      `📍 Showroom: ${shop.address}\n` +
      `🕒 Timings: ${shop.business_hours}\n\n` +
      `🎁 Get an extra ₹1,000 spot showroom discount voucher on WhatsApp: http://localhost:5173/optin/${shop.slug}\n` +
      `(Reply STOP anytime to opt out).`;

    // =========================================================================
    // 4. CUSTOMER PROFILE DEDUPLICATION
    // =========================================================================
    let customer: Customer;
    let existingCustomer: Customer | undefined;

    // Check by external platform user ID
    if (payload.authorId) {
      existingCustomer = store.findCustomerByExternalId(shop.id, payload.channel, payload.authorId);
    }

    // Check by phone number if provided
    if (!existingCustomer && payload.customerPhone) {
      existingCustomer = store.customers.find(c => c.shop_id === shop.id && c.phone_e164 === payload.customerPhone);
    }

    // Check by customer full name
    if (!existingCustomer && payload.authorName) {
      existingCustomer = store.customers.find(
        c => c.shop_id === shop.id && c.full_name.trim().toLowerCase() === payload.authorName.trim().toLowerCase()
      );
    }

    if (existingCustomer) {
      customer = existingCustomer;
      // Existing customer: update activity without duplicating
      customer.last_reply_at = new Date().toISOString();
      customer.updated_at = new Date().toISOString();
      if (isHot) {
        customer.engagement_score = Math.max(customer.engagement_score || 0, 85);
        customer.lead_status = 'ENGAGED';
      }
      if (payload.customerPhone && (!customer.phone_e164 || customer.phone_e164.startsWith('+9198000'))) {
        customer.phone_e164 = payload.customerPhone;
      }
      // Link external identity
      if (payload.authorId) {
        store.linkCustomerExternalId(shop.id, customer.id, payload.channel as any, payload.authorId, payload.authorName);
      }
    } else {
      // Create new customer profile with STRICT consent isolation
      const deterministicPhone = payload.customerPhone || `+9198000${Math.floor(10000 + Math.random() * 90000)}`;
      customer = {
        id: uuidv4(),
        shop_id: shop.id,
        full_name: payload.authorName,
        phone_e164: deterministicPhone,
        language: 'bn',
        location: shop.city,
        source: payload.channel === 'FACEBOOK' ? 'FACEBOOK_COMMENT' : 'INSTAGRAM',
        product_category: products[0]?.category || 'Retail',
        brand: products[0]?.brand || shop.name,
        model: aiClassification.product || products[0]?.model || 'Product Inquiry',
        purchase_date: new Date().toISOString().slice(0, 10),
        purchase_value: 0,
        tags: [payload.channel, 'Social Lead'],
        whatsapp_opt_in: false, // CRITICAL: Social comment NEVER grants WhatsApp marketing consent!
        opt_in_at: null,
        opt_in_source: null,
        do_not_contact: false,
        last_campaign_at: null,
        last_reply_at: new Date().toISOString(),
        engagement_score: isHot ? 80 : 45,
        lead_status: 'ENGAGED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      store.customers.push(customer);

      if (payload.authorId) {
        store.linkCustomerExternalId(shop.id, customer.id, payload.channel as any, payload.authorId, payload.authorName);
      }
    }

    // =========================================================================
    // 5. CONVERSATION DEDUPLICATION IN UNIFIED INBOX
    // =========================================================================
    let conv = store.conversations.find(c => c.shop_id === shop.id && c.customer_id === customer.id);
    if (conv) {
      conv.last_message_at = new Date().toISOString();
      conv.updated_at = new Date().toISOString();
      if (isHot) {
        conv.lead_score = Math.max(conv.lead_score, 85);
        conv.interest_level = 'HOT';
        conv.intent = aiClassification.intent;
      }
    } else {
      conv = {
        id: uuidv4(),
        shop_id: shop.id,
        customer_id: customer.id,
        customer_name: customer.full_name,
        customer_phone: customer.phone_e164,
        channel: payload.channel,
        source_reference: `${payload.channel === 'FACEBOOK' ? 'Facebook Comment' : 'Instagram DM'} (${postId})`,
        last_message_at: new Date().toISOString(),
        status: 'ACTIVE',
        assigned_to: store.profiles[0]?.id || null,
        is_human_takeover: false,
        lead_score: isHot ? 80 : 50,
        intent: aiClassification.intent,
        interest_level: aiClassification.interest_level,
        interested_product: aiClassification.product || products[0]?.model || 'Product Inquiry',
        recommended_action: isHot ? 'High intent social lead. Invite to showroom with WhatsApp VIP voucher.' : 'Social enquiry received. Send catalogue link.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      store.conversations.unshift(conv);
    }

    // Add inbound message to conversation history
    store.messages.push({
      id: uuidv4(),
      shop_id: shop.id,
      conversation_id: conv.id,
      direction: 'INBOUND',
      channel: payload.channel,
      sender_phone: customer.phone_e164,
      recipient_phone: shop.phone,
      provider_message_id: `social_${Date.now()}`,
      body: payload.commentText,
      status: 'DELIVERED',
      ai_generated: false,
      intent_classified: aiClassification.intent,
      created_at: new Date().toISOString()
    });

    // =========================================================================
    // 6. LEAD DEDUPLICATION & PROGRESSIVE UPGRADE
    // =========================================================================
    let leadCreated = false;
    let leadUpdated = false;
    let assignedLeadId: string | undefined;

    const existingLead = store.findOpenLeadForCustomer(shop.id, customer.id);
    if (existingLead) {
      // DEDUPLICATION: Update existing open lead instead of creating a duplicate!
      existingLead.last_message = payload.commentText;
      existingLead.intent = aiClassification.intent;
      if (isHot) {
        existingLead.interest_level = 'HOT';
        existingLead.lead_score = Math.max(existingLead.lead_score, 85);
        existingLead.recommended_action = 'Customer re-engaged with high purchase/visit intent. Follow up immediately!';
      }
      existingLead.updated_at = new Date().toISOString();
      assignedLeadId = existingLead.id;
      leadUpdated = true;
    } else if (isHot) {
      // Create new lead only if no active open lead exists
      const newLead: Lead = {
        id: uuidv4(),
        shop_id: shop.id,
        customer_id: customer.id,
        conversation_id: conv.id,
        channel: payload.channel,
        customer_name: customer.full_name,
        customer_phone: customer.phone_e164,
        product: conv.interested_product,
        intent: aiClassification.intent,
        interest_level: 'HOT',
        lead_score: 80,
        recommended_action: 'Respond to social comment and send showroom VIP invite.',
        status: 'OPEN',
        last_message: payload.commentText,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      store.leads.unshift(newLead);
      assignedLeadId = newLead.id;
      leadCreated = true;
    }

    // =========================================================================
    // 7. SAVE SOCIAL LEAD & AUDIT COMMENT RECORD
    // =========================================================================
    const socialLead: SocialLead = {
      id: uuidv4(),
      shop_id: shop.id,
      channel: payload.channel,
      source_post_id: postId,
      source_comment_id: commentId,
      author_name: payload.authorName,
      author_id: authorId,
      content: payload.commentText,
      intent: aiClassification.intent,
      interest_level: aiClassification.interest_level,
      public_reply_sent: publicReply,
      private_reply_sent: privateReply,
      converted_to_whatsapp: false,
      whatsapp_phone: payload.customerPhone || customer.phone_e164,
      created_at: new Date().toISOString()
    };
    store.socialLeads.unshift(socialLead);

    // Record in social comments registry
    const commentRecord: SocialCommentRecord = {
      id: uuidv4(),
      shop_id: shop.id,
      platform: payload.channel === 'INSTAGRAM' ? 'INSTAGRAM' : 'FACEBOOK',
      post_id: postId,
      comment_id: commentId,
      platform_user_id: authorId,
      user_display_name: payload.authorName,
      comment_text: payload.commentText,
      timestamp: new Date().toISOString(),
      campaign_id: payload.campaignId,
      ad_id: payload.adId,
      processing_status: 'PROCESSED',
      detected_intent: aiClassification.intent,
      lead_id: assignedLeadId,
      customer_id: customer.id
    };
    store.addSocialComment(commentRecord);

    // Update integration card last_event_at
    const channelKey = payload.channel === 'FACEBOOK' ? 'FACEBOOK_PAGE' : 'INSTAGRAM';
    store.updateMetaIntegrationCard(shop.id, channelKey, {
      last_event_at: new Date().toISOString()
    });

    return {
      socialLead,
      publicReply,
      privateReply,
      leadCreated,
      leadUpdated,
      duplicate: false,
      status: 'PROCESSED',
      intent: socialLead.intent,
      interestLevel: socialLead.interest_level,
      customerId: customer.id,
      leadId: assignedLeadId
    };
  }
}
