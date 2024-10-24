'use server';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { ed25519 } from '@noble/curves/ed25519';
import { PKPass } from "passkit-generator";
import { SolanaSignInInput, SolanaSignInOutput } from '@solana/wallet-standard-features';
import { PublicKey } from '@solana/web3.js';
import { deriveSignInMessageText } from '@solana/wallet-standard-util';
import { getNetworkFromEnv, RpcService } from '@/app/services/rpcService';
import { createNonce } from '@/app/passes/create/actions';

const MODEL_FILES = [
  'icon.png', 'icon@2x.png', 'logo.png', 'logo@2x.png',
  'pass.json', 'strip.png', 'strip@2x.png'
];

const modelFiles: Record<string, Buffer> = {};

export type CompressedOutput = {
  input: SolanaSignInInput;
  signature: string;
  signedMessage: string;
  publicKey: string;
}

/**
 * Loads all model files into memory
 */
async function loadModelFiles() {
  await Promise.all(MODEL_FILES.map(async (fileName) => {
    const filePath = path.join(process.cwd(), `./server-files/solana.pass/${fileName}`);
    modelFiles[fileName] = await fs.readFile(filePath);
  }));
}

// Initialize pass template
const passTemplate = (async () => {
  const certificates = await getCertificates();
  await loadModelFiles();

  return new PKPass(modelFiles, {
    wwdr: certificates.wwdr,
    signerCert: certificates.signerCert,
    signerKey: certificates.signerKey,
    signerKeyPassphrase: certificates.signerKeyPassphrase,
  });
})();

/**
 * Shortens an address for display purposes
 * @param address Full address
 * @returns Shortened address
 */
const shortAddress = (address: string): string => 
  `${address.slice(0, 4)}...${address.slice(-4)}`;

/**
 * Generates a PKPass for a given address and balance
 * @param param0 Object containing address, balance, and message
 * @returns Buffer containing the generated pass or null if generation fails
 */
async function generatePass({ address, balance, message }: { address: string, balance: string, message: string }): Promise<Buffer | null> {
  try {
    const templatePass = await passTemplate;
    const pass = await PKPass.from(templatePass, { serialNumber: address });
    
    pass.type = "storeCard";
    pass.headerFields.push({ key: "header1", label: "LOYAL", value: balance });
    pass.secondaryFields.push({ key: "Address", label: "Address", value: shortAddress(address) });
    pass.setBarcodes({ message, format: "PKBarcodeFormatQR" });

    return pass.getAsBuffer();
  } catch (err) {
    console.error('Error generating pass:', err);
    return null;
  }
}

/**
 * Retrieves necessary certificates for pass generation
 * @returns Object containing certificate data
 */
async function getCertificates() {
  const [signerCert, signerKey, wwdr] = await Promise.all([
    fs.readFile(path.join(process.cwd(), './server-files/certs/signerCert.pem'), 'utf8'),
    fs.readFile(path.join(process.cwd(), './server-files/certs/signerKey.pem'), 'utf8'),
    fs.readFile(path.join(process.cwd(), './server-files/certs/wwdr.pem'), 'utf8'),
  ]);

  return { signerCert, signerKey, wwdr, signerKeyPassphrase: "test" };
}

/**
 * Converts an object to a Uint8Array
 * @param obj Object to convert
 * @returns Uint8Array representation of the object
 */
const convertToUint8Array = (obj: any): Uint8Array => new Uint8Array(Object.values(obj));

/**
 * Updates the SolanaSignInOutput to use Uint8Arrays
 * @param signInDataOutput Original SolanaSignInOutput
 * @returns Updated SolanaSignInOutput with Uint8Arrays
 */
const getUpdatedSignInDataOutput = (signInDataOutput: SolanaSignInOutput): SolanaSignInOutput => ({
  ...signInDataOutput,
  account: {
    ...signInDataOutput.account,
    publicKey: convertToUint8Array(signInDataOutput.account.publicKey),
  },
  signedMessage: convertToUint8Array(signInDataOutput.signedMessage),
  signature: convertToUint8Array(signInDataOutput.signature),
});

/**
 * Verifies the sign-in data
 * @param signInData SolanaSignInInput
 * @param signInDataOutput SolanaSignInOutput
 * @returns Boolean indicating whether the sign-in data is valid
 */
const verifySignInData = (signInData: SolanaSignInInput, signInDataOutput: SolanaSignInOutput): boolean => {
  const derivedMessage = deriveSignInMessageText(signInData, signInDataOutput);
  if (!derivedMessage) return false;

  const encodedMessage = new TextEncoder().encode(derivedMessage);
  if (!encodedMessage.every((value, index) => value === signInDataOutput.signedMessage[index])) {
    return false;
  }

  return ed25519.verify(signInDataOutput.signature, signInDataOutput.signedMessage, signInDataOutput.account.publicKey);
};

/**
 * Handles POST requests to generate and return a PKPass
 * @param request Incoming request
 * @returns NextResponse with the generated pass or an error message
 */
export async function POST(request: Request) {
  const { splToken, signInData, signInDataOutput, nonce } = await request.json();

  if (!signInData.address) {
    return new NextResponse('No address provided', { status: 400 });
  }

  const updatedSignInDataOutput = getUpdatedSignInDataOutput(signInDataOutput);
  if (!verifySignInData(signInData, updatedSignInDataOutput)) {
    return new NextResponse('Invalid sign in data', { status: 400 });
  }

  // TODO: validate nonce against db

  const compressedOutput: CompressedOutput = {
    input: signInData,
    signature: Buffer.from(updatedSignInDataOutput.signature).toString('base64'),
    signedMessage: Buffer.from(updatedSignInDataOutput.signedMessage).toString('base64'),
    publicKey: Buffer.from(updatedSignInDataOutput.account.publicKey).toString('base64'),
  };

  const replayProtectionNonce = await createNonce();
  const message = `${JSON.stringify(compressedOutput)}:${replayProtectionNonce}`;

  const rpcService = new RpcService(process.env.NEXT_PUBLIC_HELIUS_API_KEY || '', getNetworkFromEnv());
  const balance = await rpcService.getSplBalance(new PublicKey(signInData.address), splToken);

  const pass = await generatePass({
    address: signInData.address,
    balance: balance.toString(),
    message
  });

  if (!pass) {
    return new NextResponse('Failed to generate pass', { status: 500 });
  }

  // TODO: upload pass to S3 or save to local db

  return new NextResponse(pass, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="${signInData.address}.pkpass"`,
    },
  });
}
