'use client';

import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useSpl } from '../../context/SplContext';
import { useWalletsState } from '../../context/WalletContext';

/**
 * RedeemPage component for redeeming loyalty tokens
 */
const RedeemPage: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { splToken } = useSpl();
  const { wallet } = useWalletsState();

  /**
   * Handles the token redemption process
   */
  const handleRedeem = async () => {
    if (!splToken || !wallet) return;

    setIsRedeeming(true);
    try {
      const response = await fetch('/api/passes/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, qrCode }),
      });

      if (response.ok) {
        alert('Tokens redeemed successfully!');
        setAmount('');
        setQrCode('');
      } else {
        const error = await response.text();
        alert(`Failed to redeem tokens: ${error}`);
      }
    } catch (error) {
      console.error('Error redeeming tokens:', error);
      alert('An error occurred while redeeming tokens.');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Redeem Loyalty Tokens</h1>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount to Redeem
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
            placeholder="Enter amount"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            QR Code
          </label>
          {isScanning ? (
            <Scanner
              onError={(error) => {
                console.error(error);
              }}
              onScan={(detectedCodes) => {
                if (detectedCodes.length > 0) {
                  setQrCode(detectedCodes[0].rawValue);
                  setIsScanning(false);
                }
              }}
            />
          ) : (
            <button
              onClick={() => setIsScanning(true)}
              className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Scan QR Code
            </button>
          )}
        </div>

        {qrCode && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">QR Code scanned successfully!</p>
          </div>
        )}

        <button
          onClick={handleRedeem}
          disabled={isRedeeming || !amount || !qrCode}
          className={`w-full p-2 text-white rounded-md transition-colors ${isRedeeming || !amount || !qrCode
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
            }`}
        >
          {isRedeeming ? 'Redeeming...' : 'Redeem Tokens'}
        </button>
      </div>
    </div>
  );
};

export default RedeemPage;
