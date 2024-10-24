'use client';

import React from 'react';
import Link from 'next/link';
import { verifySignIn } from '@solana/wallet-standard-util';
import { useWalletsState } from '@/app/context/WalletContext';
import { useSpl } from '@/app/context/SplContext';
import { createSignInData, signIn } from '@/app/utils/proofOfWallet';
import { validatePublicKey } from '@/app/utils/publicKey';
import { createNonce } from './actions';

// Component for creating an Apple Wallet Pass
const Pass: React.FC = () => {
  const { wallet } = useWalletsState();
  const { splToken } = useSpl();  

  // Function to handle the creation of a pass
  const handleCreatePass = async () => {
    if (!wallet) {
      console.error('Wallet not found');
      return;
    }

    try {
      // Generate a nonce for the sign-in process
      const nonce = await createNonce();

      // Check if wallet.publicKey is defined and has the toBase58 method
      if (!validatePublicKey(wallet.publicKey)) {
        return;
      }

      // Create and sign the sign-in data
      const signInData = createSignInData(wallet.publicKey.toBase58(), nonce);
      const signInDataOutput = signIn(wallet, signInData);

      // Verify the signed data
      const isValid = verifySignIn(signInData, signInDataOutput);
      console.log('Signature validation:', isValid);
      if (!isValid) {
        console.error('Invalid signature');
        return;
      }

      // Send request to create the pass
      const response = await fetch('/api/passes', {
        method: 'POST',
        body: JSON.stringify({
          splToken,
          signInData,
          signInDataOutput,
          nonce,
        }),
      });

      if (response.ok) {
        // If successful, create a download link for the pass
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${wallet.publicKey.toBase58()}.pkpass`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to create pass');
      }
    } catch (error) {
      console.error('Error creating pass:', error);
    }
  };

  // Loading state
  if (!wallet) {
    return <div>Loading...</div>;
  }

  // No SPL token found state
  if (!splToken) {
    return (
      <div>
        <h1>No SPL token found</h1>
        <p>Please add an SPL token to your wallet</p>
        <Link href="/token">Create a new Token</Link>
      </div>
    );
  }

  // Render the main component
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl font-bold mb-6">Create Apple Wallet Pass</h1>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Pass Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pass Label
              </label>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {splToken?.name}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pass Amount
              </label>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {wallet?.splBalance.toString()} {splToken?.symbol}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleCreatePass}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-colors"
          >
            Create Pass
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pass;