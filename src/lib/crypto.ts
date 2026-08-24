import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

let encryptionKey: Buffer | null = null;

async function getEncryptionKey(): Promise<Buffer> {
  if (encryptionKey) return encryptionKey;

  const masterSecret = process.env.ENCRYPTION_MASTER_KEY;
  if (!masterSecret) {
    throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
  }

  const salt = Buffer.from(process.env.ENCRYPTION_SALT || 'chronova-salt', 'utf8');
  const derivedKey = await scryptAsync(masterSecret, salt, KEY_LENGTH);
  encryptionKey = derivedKey as Buffer;
  return encryptionKey;
}

export async function encrypt(text: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted1 = cipher.update(text, 'utf8');
  const encrypted2 = cipher.final();
  const encrypted = Buffer.concat([encrypted1, encrypted2]);
  const authTag = cipher.getAuthTag();

  const result = Buffer.concat([iv, authTag, encrypted]);
  return result.toString('base64');
}

export async function decrypt(encryptedData: string): Promise<string> {
  const key = await getEncryptionKey();
  const buffer = Buffer.from(encryptedData, 'base64');

  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted1 = decipher.update(encrypted);
  const decrypted2 = decipher.final();
  const decrypted = Buffer.concat([decrypted1, decrypted2]);

  return decrypted.toString('utf8');
}

export function isEncrypted(data: string): boolean {
  try {
    const buffer = Buffer.from(data, 'base64');
    return buffer.length > IV_LENGTH + TAG_LENGTH;
  } catch {
    return false;
  }
}
