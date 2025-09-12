import * as aes from 'aes-js'

const defaultKey = aes.utils.utf8.toBytes(process.env.ENV_AES_KEY || '')
if (defaultKey.length !== 32)
  throw new Error('Invalid key size for AES. Must be 256-bit / 32 bytes.')

/**
 * Encrypts a given text using AES-CTR mode.
 * @param text - The text to encrypt.
 * @param customKey - Optional AES key (32 bytes). If not provided, uses the default key.
 * @returns - The encrypted text in HEX format.
 */
function encrypt(text: string, customKey?: Uint8Array): string {
  const key = customKey && customKey.length === 32 ? customKey : defaultKey
  const bytesInfo = aes.utils.utf8.toBytes(text)

  const aesCtr = new aes.ModeOfOperation.ctr(key)
  const encryptedBytes = aesCtr.encrypt(bytesInfo)
  return aes.utils.hex.fromBytes(encryptedBytes)
}

/**
 * Decrypts a given HEX string using AES-CTR mode.
 * @param encryptedHex - The encrypted text in HEX format.
 * @param customKey - Optional AES key (32 bytes). If not provided, uses the default key.
 * @returns - The decrypted text.
 */
function decrypt(encryptedHex: string, customKey?: Uint8Array): string {
  const key = customKey && customKey.length === 32 ? customKey : defaultKey
  const encryptedBytes = aes.utils.hex.toBytes(encryptedHex)

  const aesCtr = new aes.ModeOfOperation.ctr(key)
  const decryptedBytes = aesCtr.decrypt(encryptedBytes)
  return aes.utils.utf8.fromBytes(decryptedBytes)
}

/**
 * Generates a new random AES-256 key.
 * @returns - A 32-byte AES key in HEX format.
 */
async function generateAESKey(): Promise<string> {
  try {
    const keyBytes = crypto.getRandomValues(new Uint8Array(32))
    return aes.utils.hex.fromBytes(keyBytes)
  } catch (error) {
    console.error('Error generating AES key:', error)
    throw error
  }
}

export { encrypt, decrypt, generateAESKey }
