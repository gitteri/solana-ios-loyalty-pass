'use server';

import { RpcService } from "@/app/services/rpcService";
import { validatePublicKey } from "@/app/utils/publicKey";
import { getSplToken, saveSplToken } from "./fs";
import { getWallet } from "../wallet/fs";

/**
 * Handles GET requests to retrieve the SPL token information.
 * @returns {Promise<Response>} JSON response with token info or appropriate error response.
 */
export async function GET() {
  try {
    const token = await getSplToken();
    if (!token.mint) {
      return new Response(null, { status: 500 });
    }
    return new Response(JSON.stringify(token), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching token:', error);
    return new Response(null, { status: 404 });
  }
}

/**
 * Handles POST requests to create a new SPL token or return an existing one.
 * @returns {Promise<Response>} JSON response with token info or error response.
 */
export async function POST() {
  try {
    const existingToken = await getSplToken();
    if (existingToken.mint) {
      return new Response(JSON.stringify(existingToken), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error reading token file:', error);
  }

  try {
    const wallet = await getWallet();
    const rpc = new RpcService(process.env.NEXT_PUBLIC_HELIUS_API_KEY || '', "devnet");

    // Check if wallet.publicKey is defined and has the toBase58 method
    if (!validatePublicKey(wallet.publicKey)) {
      console.error('Invalid wallet public key');
      return new Response('Invalid wallet public key', { status: 400 });
    }

    console.log('Creating token with wallet', wallet.publicKey.toBase58());
    const newToken = await rpc.createSplToken(wallet);
    await saveSplToken(newToken);

    return new Response(JSON.stringify(newToken), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating token:', error);
    return new Response(null, { status: 500 });
  }
}