import * as XLSX from 'xlsx';
import { Customer, ConsentSource, CustomerImport } from '../types.js';
import { normalizeIndianPhone } from './phoneNormalizer.js';
import { v4 as uuidv4 } from 'uuid';

export interface ColumnMapping {
  fullName: string;
  phone: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  purchaseValue?: string;
  language?: string;
  city?: string;
  consent?: string;
  consentSource?: string;
}

export interface ImportValidationSummary {
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidPhoneCount: number;
  noConsentCount: number;
  previewRows: Array<{
    original: any;
    normalizedPhone: string;
    isValidPhone: boolean;
    isDuplicate: boolean;
    hasConsent: boolean;
    status: 'VALID' | 'DUPLICATE' | 'INVALID_PHONE' | 'NO_CONSENT_AUDIT';
    errors: string[];
  }>;
  processedCustomers: Customer[];
}

export class CustomerImportService {
  static parseSpreadsheet(buffer: Buffer): { headers: string[]; rows: any[] } {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

    if (rawData.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = Object.keys(rawData[0]);
    return { headers, rows: rawData };
  }

  static suggestColumnMapping(headers: string[]): ColumnMapping {
    const lowerHeaders = headers.map(h => ({ original: h, lower: h.toLowerCase() }));

    const findMatch = (keywords: string[]) => {
      const match = lowerHeaders.find(h => keywords.some(k => h.lower.includes(k)));
      return match ? match.original : '';
    };

    return {
      fullName: findMatch(['name', 'customer', 'client', 'buyer']) || headers[0] || '',
      phone: findMatch(['phone', 'mobile', 'cell', 'contact', 'whatsapp', 'number']) || headers[1] || '',
      brand: findMatch(['brand', 'make', 'company']),
      model: findMatch(['model', 'product', 'device', 'item']),
      purchaseDate: findMatch(['date', 'invoice date', 'bought', 'purchased']),
      purchaseValue: findMatch(['price', 'value', 'amount', 'cost', 'inr', 'mrp']),
      language: findMatch(['language', 'lang', 'bengali', 'hindi']),
      city: findMatch(['city', 'location', 'address', 'area', 'pincode']),
      consent: findMatch(['consent', 'optin', 'opt-in', 'permission', 'agreed', 'whatsapp consent']),
      consentSource: findMatch(['source', 'channel', 'medium'])
    };
  }

  static validateAndProcess(
    rows: any[],
    mapping: ColumnMapping,
    shopId: string,
    existingPhoneSet: Set<string>
  ): ImportValidationSummary {
    const totalRows = rows.length;
    let duplicateCount = 0;
    let invalidPhoneCount = 0;
    let noConsentCount = 0;
    let validCount = 0;

    const seenInBatch = new Set<string>();
    const previewRows: ImportValidationSummary['previewRows'] = [];
    const processedCustomers: Customer[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: string[] = [];
      const fullName = String(row[mapping.fullName] || '').trim() || 'Unknown Customer';
      const rawPhone = row[mapping.phone];
      
      const phoneResult = normalizeIndianPhone(rawPhone);
      let isValidPhone = phoneResult.valid;
      let isDuplicate = false;
      let hasConsent = false;

      if (!isValidPhone) {
        invalidPhoneCount++;
        errors.push(phoneResult.error || 'Invalid phone format');
      } else {
        const phone = phoneResult.phone_e164;
        if (existingPhoneSet.has(phone) || seenInBatch.has(phone)) {
          isDuplicate = true;
          duplicateCount++;
          errors.push('Duplicate phone number already registered for this shop');
        } else {
          seenInBatch.add(phone);
        }
      }

      // Consent check: Must NOT automatically treat raw phone as consent
      const rawConsent = mapping.consent ? String(row[mapping.consent] || '').trim().toLowerCase() : '';
      if (['yes', 'true', '1', 'y', 'opted_in', 'optin', 'agreed'].includes(rawConsent)) {
        hasConsent = true;
      } else {
        noConsentCount++;
        // Note: they can still be imported as customer records, but whatsapp_opt_in will be false!
      }

      let status: 'VALID' | 'DUPLICATE' | 'INVALID_PHONE' | 'NO_CONSENT_AUDIT' = 'VALID';
      if (!isValidPhone) {
        status = 'INVALID_PHONE';
      } else if (isDuplicate) {
        status = 'DUPLICATE';
      } else if (!hasConsent) {
        status = 'NO_CONSENT_AUDIT';
      } else {
        validCount++;
      }

      if (i < 50) { // Limit preview payload for UI snappiness
        previewRows.push({
          original: row,
          normalizedPhone: phoneResult.phone_e164,
          isValidPhone,
          isDuplicate,
          hasConsent,
          status,
          errors
        });
      }

      // If valid phone and not duplicate, assemble customer record
      if (isValidPhone && !isDuplicate) {
        const now = new Date().toISOString();
        const purchaseVal = mapping.purchaseValue ? parseFloat(String(row[mapping.purchaseValue]).replace(/[^0-9.]/g, '')) || 0 : 0;
        
        const customer: Customer = {
          id: uuidv4(),
          shop_id: shopId,
          full_name: fullName,
          phone_e164: phoneResult.phone_e164,
          language: (row[mapping.language || ''] || 'bn').toLowerCase().startsWith('en') ? 'en' : 'bn',
          location: row[mapping.city || ''] || 'Kolkata',
          product_category: 'Electronics',
          brand: row[mapping.brand || ''] || 'Unknown',
          model: row[mapping.model || ''] || 'Unknown',
          purchase_date: row[mapping.purchaseDate || ''] || now.slice(0, 10),
          purchase_value: purchaseVal,
          tags: ['Imported', row[mapping.brand || '']].filter(Boolean),
          whatsapp_opt_in: hasConsent,
          opt_in_at: hasConsent ? now : null,
          opt_in_source: hasConsent ? 'IMPORTED_VERIFIED_CONSENT' : null,
          do_not_contact: false,
          last_campaign_at: null,
          last_reply_at: null,
          engagement_score: 10,
          lead_status: 'NEW',
          created_at: now,
          updated_at: now
        };

        processedCustomers.push(customer);
      }
    }

    return {
      totalRows,
      validCount,
      duplicateCount,
      invalidPhoneCount,
      noConsentCount,
      previewRows,
      processedCustomers
    };
  }
}
