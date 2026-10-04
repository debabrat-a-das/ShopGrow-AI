import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { AIService } from '../services/aiService.js';
import { LeadScoringService } from '../services/leadScoringService.js';
import { WhatsAppService } from '../services/whatsappService.js';
import { CustomerMemoryService } from '../services/customerMemoryService.js';
import { normalizeIndianPhone } from '../services/phoneNormalizer.js';
import { SocialLeadService } from '../services/socialLeadService.js';
import { Customer } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Meta Webhook Verification (GET)
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check against any configured shop webhook_secret or default
  const defaultSecret = 'shopgrow_whsec_saha_2026';
  const matchingShop = Object.values(store.integrationSettings).find(i => i.webhook_secret === token);

  if (mode === 'subscribe' && (token === defaultSecret || matchingShop)) {
    res.status(200).send(challenge);
    return;
  }

  res.status(403).send('Verification token mismatch');
});

// Meta Webhook Handler (POST) - Processes Inbound Messages & Delivery Statuses
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Fast-path for testing simulator directly passing payload or Meta standard format
    const shopId = (req.headers['x-shop-id'] as string) || req.body.shopId || req.query.shopId || 'shop-1';
    const shop = store.getShop(shopId);

    if (!shop) {
      res.status(404).json({ error: `Shop not found: ${shopId}` });
      return;
    }

    // 1. Process Meta Delivery/Read Status updates
    const statuses = body.entry?.[0]?.changes?.[0]?.value?.statuses || body?.statuses;
    if (statuses && Array.isArray(statuses) && statuses.length > 0) {
      for (const st of statuses) {
        const wamid = st.id;
        const newStatus = (st.status || '').toUpperCase(); // 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
        const recipient = store.campaignRecipients.find(cr => cr.message_id === wamid);
        if (recipient) {
          if (newStatus === 'DELIVERED') recipient.delivered_at = new Date().toISOString();
          if (newStatus === 'READ') recipient.read_at = new Date().toISOString();
          recipient.status = newStatus as any;
        }
        const msg = store.messages.find(m => m.provider_message_id === wamid);
        if (msg) {
          msg.status = newStatus as any;
          store.logSystemEvent({
            name: `Message Status: ${newStatus}`,
            shop_id: shopId,
            customer_name: 'Customer',
            source: 'WHATSAPP_WEBHOOK',
            status: newStatus === 'FAILED' ? 'FAILED' : 'SUCCESS',
            payload: { provider_message_id: wamid, status: newStatus }
          });
        }
      }
      res.status(200).json({ status: 'STATUS_PROCESSED' });
      return;
    }

    // 2. Process Meta Feed Comments & Instagram Post Comments Webhook
    const change = body.entry?.[0]?.changes?.[0];
    const field = change?.field;

    if (field === 'feed' || field === 'comments' || body.object === 'page' || body.object === 'instagram' || body.comment_id) {
      const value = change?.value || body;
      const isComment = value.item === 'comment' || value.comment_id || (value.text && !body.messages) || (value.message && !body.messages);
      if (isComment && (value.verb === 'add' || !value.verb)) {
        const commentId = value.comment_id || value.id || `comm_${Date.now()}`;
        const authorName = value.from?.name || value.author_name || 'Social User';
        const authorId = value.from?.id || value.author_id || `meta_user_${Date.now()}`;
        const commentText = value.message || value.text || value.comment_text || '';
        const postId = value.post_id || value.media?.id || 'post_meta_01';
        const channel = (body.object === 'instagram' || value.media_type || value.channel === 'INSTAGRAM') ? 'INSTAGRAM' : 'FACEBOOK';

        const result = await SocialLeadService.processSocialComment({
          shopId,
          channel,
          sourcePostId: postId,
          sourceCommentId: commentId,
          authorName,
          authorId,
          commentText,
          customerPhone: value.customer_phone
        });

        res.status(200).json({ status: 'COMMENT_PROCESSED', result });
        return;
      }
    }

    // 3. Process Meta LeadGen Webhook
    if (field === 'leadgen' || body.leadgen_id) {
      const value = change?.value || body;
      const leadgenId = value.leadgen_id || Date.now().toString();
      const formId = value.form_id || 'form_festive_01';
      const result = await SocialLeadService.processSocialComment({
        shopId,
        channel: 'FACEBOOK',
        sourcePostId: `form_${formId}`,
        sourceCommentId: `leadgen_${leadgenId}`,
        authorName: value.full_name || value.name || 'Lead Ad User',
        authorId: `lead_${leadgenId}`,
        commentText: `Submitted Lead Gen Form: ${value.ad_name || 'Festive Offer'} (${value.product_interest || 'General Inquiry'})`,
        customerPhone: value.phone_number
      });

      res.status(200).json({ status: 'LEADGEN_PROCESSED', result });
      return;
    }

    // 4. Process Inbound Messages (WhatsApp / Messenger / Simulator)
    const incomingMessages = body.entry?.[0]?.changes?.[0]?.value?.messages || body?.messages;
    if (!incomingMessages || !Array.isArray(incomingMessages) || incomingMessages.length === 0) {
      res.status(200).json({ status: 'NO_MESSAGES' });
      return;
    }

    const firstMsg = incomingMessages[0];
    const rawFrom = firstMsg.from; // e.g. "919830123456"
    const messageText = firstMsg.text?.body || firstMsg.body || '';
    const providerMessageId = firstMsg.id || `wamid_inbound_${Date.now()}`;
    const socialUserId = firstMsg.social_user_id || firstMsg.messenger_user_id || firstMsg.instagram_user_id;
    const socialPlatform = firstMsg.platform || (firstMsg.instagram_user_id ? 'INSTAGRAM' : firstMsg.messenger_user_id ? 'MESSENGER' : 'WHATSAPP');
    const incomingProfileName = firstMsg.profile?.name || firstMsg.sender_name;

    const normalizedPhone = normalizeIndianPhone(rawFrom).phone_e164 || `+${rawFrom}`;
    const nowStr = new Date().toISOString();

    // Multi-Channel Identification via CustomerMemoryService
    let customer: Customer;
    const identified = CustomerMemoryService.identifyCustomer({
      shopId,
      phone: rawFrom,
      socialUserId,
      socialPlatform: socialPlatform as any
    });

    if (!identified) {
      const initialName = (incomingProfileName && CustomerMemoryService.isNameKnown(incomingProfileName))
        ? incomingProfileName
        : 'WhatsApp Customer';

      customer = {
        id: uuidv4(),
        shop_id: shopId,
        full_name: initialName,
        phone_e164: normalizedPhone,
        language: 'bn',
        location: 'Kolkata',
        product_category: 'Electronics',
        brand: 'Samsung',
        model: 'Customer Inquiry',
        purchase_date: nowStr.slice(0, 10),
        purchase_value: 0,
        tags: ['Inbound Inquiry'],
        whatsapp_opt_in: true,
        opt_in_at: nowStr,
        opt_in_source: socialPlatform === 'WHATSAPP' ? 'WEBSITE_FORM' : 'FACEBOOK_AD',
        social_user_id: socialUserId,
        social_platform: socialPlatform as any,
        do_not_contact: false,
        last_campaign_at: null,
        last_reply_at: nowStr,
        engagement_score: 50,
        lead_status: 'ENGAGED',
        created_at: nowStr,
        updated_at: nowStr
      };
      store.customers.push(customer);
    } else {
      customer = identified;
      customer.last_reply_at = nowStr;
      if (socialUserId && !customer.social_user_id) customer.social_user_id = socialUserId;
      if (incomingProfileName && !CustomerMemoryService.isNameKnown(customer.full_name) && CustomerMemoryService.isNameKnown(incomingProfileName)) {
        customer.full_name = incomingProfileName;
      }
    }

    // Find or create conversation
    let conv = store.conversations.find(c => c.customer_id === customer.id && c.shop_id === shopId);
    if (!conv) {
      conv = {
        id: uuidv4(),
        shop_id: shopId,
        customer_id: customer.id,
        customer_name: customer.full_name,
        customer_phone: customer.phone_e164,
        last_message_at: nowStr,
        status: 'ACTIVE',
        assigned_to: store.profiles[0]?.id || null,
        is_human_takeover: false,
        lead_score: 20,
        intent: 'OTHER',
        interest_level: 'COLD',
        interested_product: customer.last_discussed_product || 'Electronics',
        context_product: customer.last_discussed_product || 'Electronics',
        recommended_action: 'Analyze customer message',
        created_at: nowStr,
        updated_at: nowStr
      };
      store.conversations.unshift(conv);
    } else {
      conv.customer_name = customer.full_name;
    }

    // Retrieve previous messages for memory context before saving current message
    const previousMessages = store.messages.filter(m => m.conversation_id === conv!.id);

    // Save Inbound Message
    const inboundMsg: any = {
      id: uuidv4(),
      shop_id: shopId,
      conversation_id: conv.id,
      direction: 'INBOUND' as const,
      sender_phone: customer.phone_e164,
      recipient_phone: shop.phone,
      provider_message_id: providerMessageId,
      body: messageText,
      status: 'DELIVERED' as const,
      ai_generated: false,
      created_at: nowStr
    };
    store.messages.push(inboundMsg);

    // Customer Memory Delta Extraction & Application (Ask Once -> Save -> Reuse)
    const memoryDelta = CustomerMemoryService.extractMemoryDelta(messageText, customer, conv);
    CustomerMemoryService.applyMemoryDelta(customer, memoryDelta, shopId, conv);
    const memoryContext = CustomerMemoryService.buildMemoryContext(customer, conv, previousMessages);

    // Run AI Intent Classification & Answering Engine with full memory context
    const offers = store.getOffers(shopId);
    const settings = store.shopSettings[shopId] || {
      faqs: [],
      ai_guardrails: ''
    };

    const aiResult = await AIService.classifyInboundMessage({
      messageText,
      shop,
      offers,
      settings: settings as any,
      customerName: customer.full_name,
      customer,
      conversation: conv,
      conversationHistory: previousMessages.slice(-6),
      memoryContext,
      memoryDelta
    });

    inboundMsg.intent_classified = aiResult.intent;

    // Handle Unsubscribe / Opt-out
    if (aiResult.is_opt_out) {
      customer.whatsapp_opt_in = false;
      customer.do_not_contact = true;
      customer.lead_status = 'LOST';
      store.consentEvents.push({
        id: uuidv4(),
        shop_id: shopId,
        customer_id: customer.id,
        type: 'OPT_OUT',
        source: 'IN_STORE',
        evidence_reference: `WhatsApp STOP message: "${messageText}"`,
        created_at: nowStr
      });

      store.logSystemEvent({
        name: 'STOP Opt-Out: Consent Revoked',
        shop_id: shopId,
        customer_id: customer.id,
        customer_name: customer.full_name,
        source: 'SAFETY_ENGINE',
        status: 'WARNING',
        payload: {
          message: messageText,
          action: 'REVOKE_CONSENT',
          whatsapp_opt_in: false,
          do_not_contact: true,
          campaigns_blocked: true
        }
      });
    } else {
      store.logSystemEvent({
        name: `Inbound WhatsApp: ${aiResult.intent}`,
        shop_id: shopId,
        customer_id: customer.id,
        customer_name: customer.full_name,
        source: 'WHATSAPP_WEBHOOK',
        status: 'SUCCESS',
        payload: {
          message: messageText,
          intent: aiResult.intent,
          product: aiResult.product
        }
      });
    }

    // Lead Scoring Engine
    const totalMsgCount = store.messages.filter(m => m.conversation_id === conv!.id).length;
    const scoreResult = LeadScoringService.calculateScore({
      intent: aiResult.intent,
      messageText,
      messageCount: totalMsgCount,
      hasStoreVisitIntent: aiResult.intent === 'VISIT_INTENT',
      hasPurchaseIntent: aiResult.intent === 'PURCHASE_INTENT'
    });

    // Update conversation state
    conv.last_message_at = nowStr;
    conv.intent = aiResult.intent;
    conv.interest_level = scoreResult.interestLevel;
    conv.lead_score = scoreResult.score;
    conv.interested_product = aiResult.product || conv.interested_product;
    conv.recommended_action = scoreResult.recommendedAction;
    conv.updated_at = nowStr;

    // Hot Lead handling: If score >= 70 or intent is HOT, create/update Lead
    if (scoreResult.score >= 70 || scoreResult.interestLevel === 'HOT') {
      customer.lead_status = 'ENGAGED';
      customer.engagement_score = scoreResult.score;

      let lead = store.leads.find(l => l.customer_id === customer!.id);
      if (!lead) {
        lead = {
          id: uuidv4(),
          shop_id: shopId,
          customer_id: customer.id,
          conversation_id: conv.id,
          campaign_id: store.campaigns[0]?.id,
          customer_name: customer.full_name,
          customer_phone: customer.phone_e164,
          product: conv.interested_product,
          intent: aiResult.intent,
          interest_level: 'HOT',
          lead_score: scoreResult.score,
          recommended_action: scoreResult.recommendedAction,
          status: 'OPEN',
          last_message: messageText,
          created_at: nowStr,
          updated_at: nowStr
        };
        store.leads.unshift(lead);
      } else {
        lead.intent = aiResult.intent;
        lead.interest_level = 'HOT';
        lead.lead_score = scoreResult.score;
        lead.recommended_action = scoreResult.recommendedAction;
        lead.last_message = messageText;
        lead.updated_at = nowStr;
      }

      store.logSystemEvent({
        name: 'Hot Lead Promoted (Score 80+)',
        shop_id: shopId,
        customer_id: customer.id,
        customer_name: customer.full_name,
        source: 'LEAD_SCORING_ENGINE',
        status: 'SUCCESS',
        payload: {
          score: scoreResult.score,
          intent: aiResult.intent,
          product: conv.interested_product
        }
      });
    }

    // AI Safe Grounded Response Dispatch (if not human takeover & not opted out)
    let dispatchedReply: string | null = null;
    if (!conv.is_human_takeover && !customer.do_not_contact) {
      const replyText = aiResult.suggested_reply;
      const integration = store.integrationSettings[shopId] || {
        provider: 'MOCK',
        phone_number_id: 'mock',
        status: 'CONNECTED'
      };

      const sendRes = await WhatsAppService.dispatchMessage(
        { to: customer.phone_e164, text: replyText },
        integration as any
      );

      store.logSystemEvent({
        name: 'AI Reply Dispatched to Customer',
        shop_id: shopId,
        customer_id: customer.id,
        customer_name: customer.full_name,
        source: 'AI_AGENT',
        status: 'SUCCESS',
        payload: {
          reply: replyText,
          intent: aiResult.intent,
          provider_status: sendRes.status
        }
      });

      const outMsg = {
        id: uuidv4(),
        shop_id: shopId,
        conversation_id: conv.id,
        direction: 'OUTBOUND' as const,
        sender_phone: shop.phone,
        recipient_phone: customer.phone_e164,
        provider_message_id: sendRes.providerMessageId,
        body: replyText,
        status: sendRes.status,
        ai_generated: true,
        created_at: new Date().toISOString()
      };
      store.messages.push(outMsg);
      dispatchedReply = replyText;

      // If AI flagged needs_human, switch to handoff mode
      if (aiResult.needs_human) {
        conv.is_human_takeover = true;
        conv.status = 'HANDOFF';
      }
    }

    res.status(200).json({
      status: 'SUCCESS',
      intent: aiResult.intent,
      interestLevel: scoreResult.interestLevel,
      leadScore: scoreResult.score,
      needsHuman: aiResult.needs_human,
      dispatchedReply,
      conversationId: conv.id,
      customer: {
        id: customer.id,
        name: customer.full_name,
        location: customer.location,
        budget: customer.budget_range,
        contextProduct: customer.last_discussed_product
      },
      memoryDelta,
      memoryContext: {
        is_name_known: memoryContext.is_name_known,
        known_name: memoryContext.known_name,
        is_location_known: memoryContext.is_location_known,
        known_location: memoryContext.known_location,
        is_budget_known: memoryContext.is_budget_known,
        known_budget: memoryContext.known_budget,
        last_discussed_product: memoryContext.last_discussed_product
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Webhook processing error: ' + err.message });
  }
});

export default router;
