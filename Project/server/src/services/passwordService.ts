import crypto from 'crypto';

export interface HashResult {
  hash: string;
  salt: string;
}

export interface PasswordPolicyResult {
  valid: boolean;
  error?: string;
}

export class PasswordService {
  private static readonly ITERATIONS = 100000;
  private static readonly KEYLEN = 64;
  private static readonly DIGEST = 'sha512';
  private static readonly SALT_BYTES = 16;

  /**
   * Hashes a plaintext password using PBKDF2 with a cryptographically secure random salt.
   * Standard 100,000 iterations of SHA-512.
   */
  static hashPassword(password: string): HashResult {
    const salt = crypto.randomBytes(this.SALT_BYTES).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, this.ITERATIONS, this.KEYLEN, this.DIGEST).toString('hex');
    return { hash, salt };
  }

  /**
   * Hashes a password with an existing salt to verify credentials.
   * Uses timingSafeEqual to avoid timing side-channel attacks.
   */
  static verifyPassword(password: string, storedHash: string, salt: string): boolean {
    if (!password || !storedHash || !salt) return false;
    try {
      const derivedHash = crypto.pbkdf2Sync(password, salt, this.ITERATIONS, this.KEYLEN, this.DIGEST).toString('hex');
      const bufA = Buffer.from(derivedHash, 'hex');
      const bufB = Buffer.from(storedHash, 'hex');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * Generates a cryptographically random reset token and its SHA-256 hash for database storage.
   * Only the hash is stored; the raw token is returned to be sent to the user.
   */
  static generateResetToken(expiryMinutes = 60): { rawToken: string; tokenHash: string; expiresAt: string } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();
    return { rawToken, tokenHash, expiresAt };
  }

  /**
   * Verifies a raw reset token against a stored SHA-256 hash.
   */
  static verifyResetToken(rawToken: string, storedTokenHash: string, expiresAt: string): boolean {
    if (!rawToken || !storedTokenHash || !expiresAt) return false;
    try {
      if (new Date() > new Date(expiresAt)) return false;
      const candidateHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const bufA = Buffer.from(candidateHash, 'hex');
      const bufB = Buffer.from(storedTokenHash, 'hex');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * Enforces strong password policy:
   * - At least 8 characters
   * - Contains uppercase and lowercase letters
   * - Contains at least one digit
   */
  static validatePolicy(password: string): PasswordPolicyResult {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: 'Password is required.' };
    }
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one lowercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one number.' };
    }
    return { valid: true };
  }
}