import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

/**
 * Represents an SPL Token with its associated properties
 */
export type SplToken = {
  mint: PublicKey;           // The mint address of the token
  programId: PublicKey;      // The program ID of the token (TOKEN_2022_PROGRAM_ID)
  name: string;              // The name of the token
  symbol: string;            // The symbol of the token
  decimals: number;          // The number of decimal places for the token
  issuer: PublicKey;         // The public key of the token issuer
  issuerBalance: BN;         // The balance of the issuer in token units
  issuerBalanceSol: BN;      // The balance of the issuer in SOL
}
