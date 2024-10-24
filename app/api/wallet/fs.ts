'use server';

import { promises as fs } from "fs";
import path from "path";
import { Keypair } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Wallet } from "@/app/types/Wallet";

// Path to the wallet keypair file
const WALLET_FILE_PATH = path.join(process.cwd(), './server-files/issuer/keypair.json');

/**
 * Retrieves the wallet information from the file system.
 * @returns {Promise<Wallet>} A promise that resolves to the Wallet object.
 * @throws {Error} If there's an error reading or parsing the wallet file.
 */
export async function getWallet(): Promise<Wallet> {
  try {
    const walletData = await fs.readFile(WALLET_FILE_PATH, 'utf8');
    const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(walletData)));

    return {
      publicKey: keypair.publicKey,
      secretKey: keypair.secretKey,
      solBalance: new BN(0),
      splBalance: new BN(0),
      txnHistory: []
    };
  } catch (error) {
    console.error('Error reading or parsing wallet file:', error);
    throw error;
  }
}