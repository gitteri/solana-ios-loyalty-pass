import { BN } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';

/**
 * Wallet: A type representing a wallet with its public key, private key,
 * SOL balance, SPL token balance, and transaction history
 */
export type Wallet = {
  publicKey: PublicKey;
  secretKey: Uint8Array;
  solBalance: BN;
  splBalance: BN;
  txnHistory: SimpleTransaction[];
};

/**
 * Generates a new Wallet with default balances and an empty transaction history.
 * @returns A new Wallet object
 */
export const generateWallet = (): Wallet => {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey,
    secretKey: keypair.secretKey,
    solBalance: new BN(0),
    splBalance: new BN(0),
    txnHistory: [],
  };
};

/**
 * Parses a wallet string from local storage and converts it to a Wallet object
 * @param walletString - The stringified wallet data from local storage
 * @returns A Wallet object
 */
export const parseWallet = (walletString: string): Wallet => {
  const walletData = JSON.parse(walletString || '{}');
  return {
    ...walletData,
    publicKey: new PublicKey(walletData.publicKey),
    secretKey: new Uint8Array(Object.values(walletData.secretKey)),
    solBalance: new BN(walletData.solBalance, 16),
    splBalance: new BN(walletData.splBalance, 16),
    txnHistory: walletData.txnHistory || [],
  };
};

/**
 * SimpleTransaction: A type representing a simple transaction with its signature and slot
 */
export type SimpleTransaction = {
  signature: string;
  slot: number;
  // Additional fields can be added here as needed
};
