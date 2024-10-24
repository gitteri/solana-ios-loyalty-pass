import { Wallet } from "@/app/types/Wallet";
import { SolanaSignInInput, SolanaSignInOutput } from "@solana/wallet-standard-features";
import { createSignInMessage } from "@solana/wallet-standard-util";
import { ed25519 } from "@noble/curves/ed25519";

/**
 * Creates sign-in data for Solana wallet authentication.
 * @param address - The wallet address.
 * @param nonce - A unique nonce for the sign-in request.
 * @returns SolanaSignInInput object with sign-in data.
 */
export const createSignInData = (address: string, nonce: string): SolanaSignInInput => {
  const now = new Date();
  const currentUrl = new URL(window.location.href);
  const domain = currentUrl.host;

  return {
    address,
    domain,
    statement: "Clicking Sign or Approve only means you have proved this wallet is owned by you. This request will not trigger any blockchain transaction or cost any gas fee.",
    uri: undefined,
    version: "1",
    nonce: nonce,
    chainId: "devnet",
    issuedAt: now.toISOString(),
    expirationTime: undefined,
    notBefore: undefined,
    requestId: undefined,
    resources: undefined,
  };
};

/**
 * Performs the sign-in process for a Solana wallet.
 * @param wallet - The wallet to sign in with.
 * @param input - Optional SolanaSignInInput to override default values.
 * @returns SolanaSignInOutput containing the signed message and signature.
 */
export const signIn = (wallet: Wallet, input: SolanaSignInInput = {}): SolanaSignInOutput => {
    const domain = input.domain || window.location.host;
    const address = input.address || wallet.publicKey.toBase58();
    const signedMessage = createSignInMessage({
        ...input,
        domain,
        address,
    });
    const signature = ed25519.sign(signedMessage, wallet.secretKey.slice(0, 32));

    return {
        account: {
            address,
            publicKey: wallet.publicKey.toBytes(),
            chains: [],
            features: [],
        },
        signedMessage,
        signature,
    };
}

/**
 * Constants for random string generation
 * Note: These are copied from the StableLib library
 * https://github.com/StableLib/stablelib/blob/master/packages/random/random.ts
 */
const QUOTA = 65536;
const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Generates random bytes using the crypto API.
 * @param length - The number of random bytes to generate.
 * @returns A Uint8Array of random bytes.
 */
const randomBytes = (length: number): Uint8Array => {
    if (typeof crypto === "undefined" || !('getRandomValues' in crypto)) {
        throw new Error("System random byte generator is not available.");
    }
    const out = new Uint8Array(length);
    for (let i = 0; i < out.length; i += QUOTA) {
        crypto.getRandomValues(out.subarray(i, i + Math.min(out.length - i, QUOTA)));
    }
    return out;
}

/**
 * Generates a random string of specified length using the given charset.
 * @param length - The length of the random string to generate.
 * @param charset - The set of characters to use (default is alphanumeric).
 * @returns A random string.
 */
export function randomString(
    length: number,
    charset = ALPHANUMERIC,
): string {
    if (charset.length < 2) {
        throw new Error("randomString charset is too short");
    }
    if (charset.length > 256) {
        throw new Error("randomString charset is too long");
    }
    let out = '';
    const charsLen = charset.length;
    const maxByte = 256 - (256 % charsLen);
    while (length > 0) {
        const buf = randomBytes(Math.ceil(length * 256 / maxByte));
        for (let i = 0; i < buf.length && length > 0; i++) {
            const randomByte = buf[i];
            if (randomByte < maxByte) {
                out += charset.charAt(randomByte % charsLen);
                length--;
            }
        }
        // Clear the buffer for security
        buf.fill(0);
    }
    return out;
}

/**
 * Generates a random string with at least the specified number of bits of entropy.
 * @param bits - The minimum number of bits of entropy required.
 * @param charset - The set of characters to use (default is alphanumeric).
 * @returns A random string with the required entropy.
 */
export function randomStringForEntropy(
    bits: number,
    charset = ALPHANUMERIC,
): string {
    const length = Math.ceil(bits / (Math.log(charset.length) / Math.LN2));
    return randomString(length, charset);
}