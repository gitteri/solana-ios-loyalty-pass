import { BN } from '@coral-xyz/anchor';

/**
 * Converts a BN balance to a string representation with the specified number of decimals.
 * @param balance The balance as a BN object
 * @param decimals The number of decimal places for the asset
 * @returns A string representation of the balance
 */
export function formatBalance(balance: BN, decimals: number): string {
  const balanceString = balance.toString().padStart(decimals + 1, '0');
  const integerPart = balanceString.slice(0, -decimals) || '0';
  const fractionalPart = balanceString.slice(-decimals);
  return `${integerPart}.${fractionalPart}`;
}

/**
 * Formats a SOL balance with 9 decimal places.
 * @param balance The SOL balance as a BN object
 * @returns A string representation of the SOL balance
 */
export function formatSOLBalance(balance: BN): string {
  return formatBalance(balance, 9);
}

/**
 * Converts a float string to BN for SOL (9 decimal places).
 * @param amount The SOL amount as a float string
 * @returns A BN representation of the SOL amount
 * @throws Error if the amount is not a valid float
 */
export function solToBN(amount: string): BN {
  return convertToBN(amount, 9);
}

/**
 * Converts a float string to BN for SPL tokens with specified decimal places.
 * @param amount The SPL token amount as a float string
 * @param decimals The number of decimal places for the SPL token
 * @returns A BN representation of the SPL token amount
 * @throws Error if the amount is not a valid float
 */
export function splToBN(amount: string, decimals: number): BN {
  return convertToBN(amount, decimals);
}

/**
 * Helper function to convert a float string to BN with specified decimal places.
 * @param amount The amount as a float string
 * @param decimals The number of decimal places
 * @returns A BN representation of the amount
 * @throws Error if the amount is not a valid float
 */
function convertToBN(amount: string, decimals: number): BN {
  const amountFloat = parseFloat(amount);
  if (isNaN(amountFloat)) {
    throw new Error("Invalid amount: unable to parse float");
  }
  const convertedAmount = Math.floor(amountFloat * 10 ** decimals);
  return new BN(convertedAmount);
}
