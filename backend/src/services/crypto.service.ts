import * as crypto from 'crypto';

export class CryptoService {
  private algorithm = 'aes-256-gcm';
  // Use secret from env or fall back to safe placeholder for local development
  private masterKey = crypto.scryptSync(
    process.env.JWT_SECRET || 'heirloom-default-secret-salt-key',
    'heirloom-salt-constant',
    32
  );

  /**
   * Encrypts plain text data using AES-256-GCM.
   * Returns formatted string: iv_hex:auth_tag_hex:encrypted_payload_hex
   */
  public encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12); // GCM standard IV size
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv) as crypto.CipherGCM;
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts formatted AES-256-GCM payload.
   */
  public decrypt(encryptedPayload: string): string {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);

    // encryptedText is a Buffer, update can be called with buffer and output encoding 'utf8'
    let decrypted = decipher.update(encryptedText).toString('utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
export const cryptoService = new CryptoService();
