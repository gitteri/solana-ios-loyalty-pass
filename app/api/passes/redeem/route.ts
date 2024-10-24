import { PublicKey } from "@solana/web3.js";
import { SolanaSignInInput, SolanaSignInOutput } from '@solana/wallet-standard-features';
import { RpcService } from "@/app/services/rpcService";
import { splToBN } from "@/app/utils/balance";
import { verifySignIn } from "@solana/wallet-standard-util";
import { getWallet } from "../../wallet/fs";
import { getSplToken } from "../../token/fs";
import { CompressedOutput } from "../route";

/**
 * Converts a base64 string to a Uint8Array
 * @param base64 - The base64 string to convert
 * @returns The converted Uint8Array
 */
const convertBase64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  return Uint8Array.from(binaryString, char => char.charCodeAt(0));
};

/**
 * Decompresses the output from the QR code into SolanaSignInInput and SolanaSignInOutput
 * @param compressedOutput - The compressed output string from the QR code
 * @returns A tuple containing SolanaSignInInput and SolanaSignInOutput
 */
function decompressOutput(compressedOutput: string): [SolanaSignInInput, SolanaSignInOutput] {
  const decompressedOutput: CompressedOutput = JSON.parse(compressedOutput);
  const { input: signInData, publicKey, signature, signedMessage } = decompressedOutput;

  if (!signInData.address) {
    throw new Error("Missing address");
  }

  const signInDataOutput: SolanaSignInOutput = {
    account: {
      address: signInData.address,
      publicKey: convertBase64ToUint8Array(publicKey),
      chains: [],
      features: [],
    },
    signature: convertBase64ToUint8Array(signature),
    signedMessage: convertBase64ToUint8Array(signedMessage),
  };

  return [signInData, signInDataOutput];
}

/**
 * Handles the POST request for redeeming tokens
 * @param request - The incoming request object
 * @returns A Response object with the result of the redemption
 */
export async function POST(request: Request) {
  try {
    const { amount, qrCode } = await request.json();

    if (!amount || !qrCode) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const wallet = await getWallet();
    const splToken = await getSplToken();

    if (!splToken.mint) {
      console.error('Error redeeming token: token not found');
      return new Response(JSON.stringify({ error: "Token not found" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const [compressedOutput, nonce] = qrCode.split(/:(?=[^:]+$)/);
    console.log("compressedOutput", compressedOutput);
    console.log("nonce", nonce);

    const [signInData, signInDataOutput] = decompressOutput(compressedOutput);
    if (!verifySignIn(signInData, signInDataOutput)) {
      return new Response(JSON.stringify({ error: "Invalid sign in data" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TODO: verify nonce is valid

    const amountBN = splToBN(amount, splToken.decimals);
    const rpc = new RpcService(process.env.NEXT_PUBLIC_HELIUS_API_KEY || '', "devnet");

    const signature = await rpc.transferSplPermaDelegate(
      wallet,
      new PublicKey(signInDataOutput.account.address),
      new PublicKey(splToken.issuer),
      amountBN,
      splToken
    );

    return new Response(JSON.stringify({ signature }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error redeeming tokens:', error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
