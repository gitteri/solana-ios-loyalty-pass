'use client';

import React from 'react';
import Link from 'next/link';
import { useWalletPassContext } from '../context/WalletPassContext';

/**
 * PassList component displays a list of wallet passes and provides functionality to download them.
 */
const PassList: React.FC = () => {
  const { walletPasses } = useWalletPassContext();

  /**
   * Handles the download or opening of a pass file.
   * @param {Object} pass - The pass object containing id, label, amount, and buffer.
   */
  const handleGetPass = (pass: { id: string; label: string; amount: string; buffer: Buffer }) => {
    const blob = new Blob([pass.buffer], { type: 'application/vnd.apple.pkpass' });
    const url = URL.createObjectURL(blob);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);

    if (isIOS) {
      // For iOS devices, use a data URL to open the pass
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          window.location.href = e.target.result as string;
        }
      };
      reader.readAsDataURL(blob);
    } else {
      // For non-iOS devices, offer download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pass.label}.pkpass`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up the object URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-purple-600 dark:text-purple-400">Your Wallet Passes</h1>
      {walletPasses.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No passes generated yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {walletPasses.map((pass) => (
            <div key={pass.id} className="bg-gray-100 dark:bg-gray-800 shadow-lg rounded-lg p-6 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
              <Link href={`/passes/${pass.id}`}>
                <h2 className="text-xl font-semibold mb-2 text-purple-500 dark:text-purple-300">{pass.label}</h2>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{pass.amount}</span>
                </div>
              </Link>
              <button
                onClick={() => handleGetPass(pass)}
                className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white font-bold py-2 px-4 rounded"
              >
                Get Pass
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PassList;
