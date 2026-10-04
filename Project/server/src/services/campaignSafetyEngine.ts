import { Customer, Campaign, Offer, ShopSettings } from '../types.js';

export interface SafetyCheckResult {
  canSend: boolean;
  eligibleCustomers: Customer[];
  reasons: {
    excludedNoConsent: number;
    excludedDoNotContact: number;
    excludedFrequencyLimit: number;
    excludedAlreadySent: number;
    excludedInvalidPhone: number;
    blockedByQuietHours?: boolean;
    blockedByOfferExpiry?: boolean;
    blockedByUnapproved?: boolean;
    blockedByCampaignPaused?: boolean;
    blockedByDailyLimit?: boolean;
  };
  details: string[];
}

export class CampaignSafetyEngine {
  /**
   * Check if current time in IST is within quiet hours (e.g. 21:00 to 09:00)
   */
  static isQuietHours(settings: ShopSettings): { inQuietHours: boolean; message?: string } {
    // Current time in IST (UTC + 5:30)
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const istMinutesTotal = (utcHours * 60 + utcMinutes + 330) % 1440;
    const istHours = Math.floor(istMinutesTotal / 60);

    const [startH] = (settings.quiet_hours_start || '21:00:00').split(':').map(Number);
    const [endH] = (settings.quiet_hours_end || '09:00:00').split(':').map(Number);

    // If quiet hours cross midnight (e.g. 21:00 to 09:00)
    const isQuiet = (startH > endH)
      ? (istHours >= startH || istHours < endH)
      : (istHours >= startH && istHours < endH);

    if (isQuiet) {
      return {
        inQuietHours: true,
        message: `Quiet hours in effect (${settings.quiet_hours_start} - ${settings.quiet_hours_end} IST). Commercial WhatsApp messages are prohibited during this period.`
      };
    }

    return { inQuietHours: false };
  }

  /**
   * Evaluates all safety checks for a campaign against a customer list
   */
  static evaluateAudience(
    customers: Customer[],
    campaign: Campaign,
    offer?: Offer | null,
    settings?: ShopSettings,
    alreadyRecipientPhoneSet: Set<string> = new Set(),
    bypassQuietHoursForTest: boolean = false,
    selectedCustomerIds?: string[],
    bypassFrequencyForTest: boolean = false
  ): SafetyCheckResult {
    const details: string[] = [];
    const effectiveSettings = settings || {
      id: 'default',
      shop_id: campaign.shop_id,
      daily_campaign_limit: 500,
      contact_frequency_days: 14,
      quiet_hours_start: '21:00:00',
      quiet_hours_end: '09:00:00',
      default_language: 'bn',
      faqs: [],
      ai_guardrails: ''
    };

    // 1. Check Human Approval requirement (V1 strictly requires human approval)
    if (!campaign.approved_by && campaign.status !== 'APPROVED') {
      details.push('Human approval is required before sending outbound campaigns in V1.');
      return {
        canSend: false,
        eligibleCustomers: [],
        reasons: {
          excludedNoConsent: 0,
          excludedDoNotContact: 0,
          excludedFrequencyLimit: 0,
          excludedAlreadySent: 0,
          excludedInvalidPhone: 0,
          blockedByUnapproved: true
        },
        details
      };
    }

    // 2. Check Offer Expiry (only if campaign is tied to an offer)
    if (offer && offer.valid_until) {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (offer.valid_until < todayStr) {
        details.push(`Offer '${offer.title}' expired on ${offer.valid_until}. Sending prohibited.`);
        return {
          canSend: false,
          eligibleCustomers: [],
          reasons: {
            excludedNoConsent: 0,
            excludedDoNotContact: 0,
            excludedFrequencyLimit: 0,
            excludedAlreadySent: 0,
            excludedInvalidPhone: 0,
            blockedByOfferExpiry: true
          },
          details
        };
      }
    }

    // 3. Check Campaign Pause Status
    if (campaign.status === 'PAUSED' || campaign.status === 'CANCELLED') {
      details.push(`Campaign is currently ${campaign.status}.`);
      return {
        canSend: false,
        eligibleCustomers: [],
        reasons: {
          excludedNoConsent: 0,
          excludedDoNotContact: 0,
          excludedFrequencyLimit: 0,
          excludedAlreadySent: 0,
          excludedInvalidPhone: 0,
          blockedByCampaignPaused: true
        },
        details
      };
    }

    // 4. Quiet Hours Check
    if (!bypassQuietHoursForTest) {
      const quietCheck = this.isQuietHours(effectiveSettings);
      if (quietCheck.inQuietHours) {
        details.push(quietCheck.message || 'Blocked by quiet hours.');
        return {
          canSend: false,
          eligibleCustomers: [],
          reasons: {
            excludedNoConsent: 0,
            excludedDoNotContact: 0,
            excludedFrequencyLimit: 0,
            excludedAlreadySent: 0,
            excludedInvalidPhone: 0,
            blockedByQuietHours: true
          },
          details
        };
      }
    }

    // 5. Evaluate individual customers
    let excludedNoConsent = 0;
    let excludedDoNotContact = 0;
    let excludedFrequencyLimit = 0;
    let excludedAlreadySent = 0;
    let excludedInvalidPhone = 0;
    const eligibleCustomers: Customer[] = [];

    const nowMs = Date.now();
    const frequencyCooldownMs = (effectiveSettings.contact_frequency_days || 14) * 24 * 60 * 60 * 1000;

    const targetCustomerPool = (selectedCustomerIds && selectedCustomerIds.length > 0)
      ? customers.filter(c => selectedCustomerIds.includes(c.id))
      : customers;

    const enforceFrequency = !bypassFrequencyForTest && (campaign.target_segment_criteria?.frequency_cooldown_days !== 0);

    for (const customer of targetCustomerPool) {
      // Must have explicit WhatsApp opt-in
      if (!customer.whatsapp_opt_in) {
        excludedNoConsent++;
        continue;
      }

      // Must not be flagged Do Not Contact
      if (customer.do_not_contact) {
        excludedDoNotContact++;
        continue;
      }

      // Valid phone check
      if (!customer.phone_e164 || !customer.phone_e164.startsWith('+91') || customer.phone_e164.length !== 13) {
        excludedInvalidPhone++;
        continue;
      }

      // Duplicate campaign prevention: already received this campaign
      if (alreadyRecipientPhoneSet.has(customer.phone_e164)) {
        excludedAlreadySent++;
        continue;
      }

      // Frequency limit check: last campaign contact within cooldown
      if (enforceFrequency && customer.last_campaign_at) {
        const lastCampaignMs = new Date(customer.last_campaign_at).getTime();
        if (nowMs - lastCampaignMs < frequencyCooldownMs) {
          excludedFrequencyLimit++;
          continue;
        }
      }

      eligibleCustomers.push(customer);
    }

    if (eligibleCustomers.length === 0) {
      details.push(`All ${targetCustomerPool.length} audience contacts excluded: ${excludedFrequencyLimit} in 14-day anti-spam cooldown, ${excludedNoConsent} no consent, ${excludedDoNotContact} opted out.`);
    }

    return {
      canSend: eligibleCustomers.length > 0,
      eligibleCustomers,
      reasons: {
        excludedNoConsent,
        excludedDoNotContact,
        excludedFrequencyLimit,
        excludedAlreadySent,
        excludedInvalidPhone
      },
      details
    };
  }
}
