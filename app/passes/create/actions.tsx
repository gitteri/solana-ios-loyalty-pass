'use server'

import { randomStringForEntropy } from '@/app/utils/proofOfWallet';

/**
 * Creates a cryptographically secure nonce for use in pass creation.
 * 
 * @returns {Promise<string>} A promise that resolves to the generated nonce.
 * @throws {Error} If nonce creation fails or the generated nonce is too short.
 */
export async function createNonce(): Promise<string> {
  // Generate a nonce with 96 bits of entropy
  const nonce = randomStringForEntropy(96);

  // Validate the generated nonce
  if (!nonce || nonce.length < 8) {
    throw new Error('Error during nonce creation: Invalid nonce generated.');
  }

  // TODO: Implement nonce storage in database
  // TODO: Implement nonce verification in pass creation process

  return nonce;
}