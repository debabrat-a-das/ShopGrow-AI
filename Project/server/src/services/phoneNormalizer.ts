/**
 * Phone Number Normalizer for Indian Mobile Numbers to E.164 (+91XXXXXXXXXX)
 */

export interface PhoneNormalizationResult {
  valid: boolean;
  phone_e164: string;
  original: string;
  error?: string;
}

export function normalizeIndianPhone(rawInput: string | number | undefined | null): PhoneNormalizationResult {
  if (rawInput === undefined || rawInput === null) {
    return {
      valid: false,
      phone_e164: '',
      original: '',
      error: 'Empty or missing phone number'
    };
  }

  const original = String(rawInput).trim();
  if (!original) {
    return {
      valid: false,
      phone_e164: '',
      original: '',
      error: 'Empty phone number'
    };
  }

  // Remove spaces, hyphens, brackets, dots
  let cleaned = original.replace(/[\s\-\(\)\.]/g, '');

  // Handle leading '+'
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // If starts with leading '0', strip it (e.g. 09830012345 -> 9830012345)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // If starts with '91' and length is 12 (country code without '+')
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }

  // An Indian mobile number must now be exactly 10 digits starting with 6, 7, 8, or 9
  const indianMobileRegex = /^[6-9]\d{9}$/;

  if (!indianMobileRegex.test(cleaned)) {
    return {
      valid: false,
      phone_e164: original,
      original,
      error: cleaned.length !== 10 
        ? `Invalid length (${cleaned.length} digits, expected 10)` 
        : 'Invalid Indian mobile prefix (must start with 6, 7, 8, or 9)'
    };
  }

  return {
    valid: true,
    phone_e164: `+91${cleaned}`,
    original
  };
}
