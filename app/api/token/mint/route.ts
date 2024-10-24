'use server';

import { PublicKey } from "@solana/web3.js";
import { NextResponse } from 'next/server';
import { RpcService } from "@/app/services/rpcService";
import { splToBN } from "@/app/utils/balance";
import { getWallet } from "../../wallet/fs";
import { getSplToken } from "../fs";

/**
 * Handles POST requests to mint SPL tokens
 * @param {Request} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with minted token or error
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Extract destination address and amount from request body
    const { destination, amount } = await request.json();

    // Fetch wallet and SPL token information concurrently
    const [wallet, splToken] = await Promise.all([getWallet(), getSplToken()]);

    // Check if the SPL token is properly configured
    if (!splToken.mint) {
      console.error('Error minting token: token not found', splToken);
      return NextResponse.json({ error: 'Token not found' }, { status: 500 });
    }

    // Convert amount to BigNumber format
    const amountBN = splToBN(amount, splToken.decimals);

    // Initialize RPC service
    const rpc = new RpcService(process.env.NEXT_PUBLIC_HELIUS_API_KEY || '', "devnet");

    // Mint SPL tokens
    const token = await rpc.mintSplToken(wallet, new PublicKey(destination), amountBN, splToken);

    // Return minted token information
    return NextResponse.json(token);
  } catch (error) {
    console.error('Error minting token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}