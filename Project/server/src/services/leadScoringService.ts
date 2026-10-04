import { LeadIntent, LeadInterestLevel } from '../types.js';

export interface LeadScoreCalculation {
  score: number;
  interestLevel: LeadInterestLevel;
  reasons: string[];
  recommendedAction: string;
}

export class LeadScoringService {
  /**
   * Deterministic scoring engine combining intent weights, customer signal keywords,
   * message frequency, and previous engagement.
   */
  static calculateScore(params: {
    intent: LeadIntent;
    messageText: string;
    messageCount: number;
    previousScore?: number;
    hasStoreVisitIntent?: boolean;
    hasPurchaseIntent?: boolean;
  }): LeadScoreCalculation {
    let score = 20; // Base baseline for any inbound reply
    const reasons: string[] = ['Base engagement (+20)'];
    const textLower = params.messageText.toLowerCase();

    // 1. Visit Intention (+40) - Highest buying signal for retail electronics shop!
    const visitKeywords = [
      'visit', 'come tomorrow', 'kal asbo', 'ashbo', 'dokane aschi', 'store location', 
      'kothay', 'address', 'timing', 'time', 'dokan khola', 'opening time', 'sunday'
    ];
    if (params.hasStoreVisitIntent || params.intent === 'VISIT_INTENT' || visitKeywords.some(k => textLower.includes(k))) {
      score += 40;
      reasons.push('Store visit intention detected (+40)');
    }

    // 2. Purchase Intention (+35)
    const purchaseKeywords = [
      'buy', 'purchase', 'kinbo', 'nite chai', 'ready to buy', 'booking', 'hold', 'final price'
    ];
    if (params.hasPurchaseIntent || params.intent === 'PURCHASE_INTENT' || purchaseKeywords.some(k => textLower.includes(k))) {
      score += 35;
      reasons.push('Direct purchase commitment (+35)');
    }

    // 3. Exchange Enquiry (+25)
    const exchangeKeywords = ['exchange', 'purono', 'old phone', 'trade in', 'palte'];
    if (params.intent === 'EXCHANGE_ENQUIRY' || exchangeKeywords.some(k => textLower.includes(k))) {
      score += 25;
      reasons.push('Old device exchange enquiry (+25)');
    }

    // 4. EMI Enquiry (+20)
    const emiKeywords = ['emi', 'bajaj', 'hdfc', 'credit card', 'down payment', 'kisti'];
    if (params.intent === 'EMI_ENQUIRY' || emiKeywords.some(k => textLower.includes(k))) {
      score += 20;
      reasons.push('EMI / financing enquiry (+20)');
    }

    // 5. Price & Stock Enquiry (+15)
    const priceStockKeywords = ['price', 'koto', 'dam', 'offer', 'stock', 'available', 'colour', 'color'];
    if (params.intent === 'PRICE_ENQUIRY' || params.intent === 'STOCK_ENQUIRY' || priceStockKeywords.some(k => textLower.includes(k))) {
      score += 15;
      reasons.push('Price/Stock check (+15)');
    }

    // 6. Interaction Depth (+10 for multi-message conversation)
    if (params.messageCount > 2) {
      score += 10;
      reasons.push('Multi-turn active conversation (+10)');
    }

    // Negative intent penalties
    if (params.intent === 'NOT_INTERESTED') {
      score = 10;
      reasons.push('Not interested (-30)');
    } else if (params.intent === 'UNSUBSCRIBE') {
      score = 0;
      reasons.push('Unsubscribe request (score reset to 0)');
    }

    // Cap between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Determine Interest Level
    let interestLevel: LeadInterestLevel = 'COLD';
    let recommendedAction = 'Monitor for customer response';

    if (score >= 70) {
      interestLevel = 'HOT';
      if (reasons.some(r => r.includes('visit'))) {
        recommendedAction = 'Call immediately or confirm appointment for store visit tomorrow';
      } else if (reasons.some(r => r.includes('exchange'))) {
        recommendedAction = 'Confirm exchange evaluation at store with bill/box';
      } else {
        recommendedAction = 'Assign staff to close sale within 15 minutes';
      }
    } else if (score >= 40) {
      interestLevel = 'WARM';
      recommendedAction = 'Share detailed offer specs, brochure & EMI breakdown';
    } else {
      interestLevel = 'COLD';
      recommendedAction = 'Keep customer informed during next festive cycle';
    }

    return {
      score,
      interestLevel,
      reasons,
      recommendedAction
    };
  }
}
