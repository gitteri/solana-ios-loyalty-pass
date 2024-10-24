'use client';

import React, { useState } from 'react';
import { useWalletsState } from '../context/WalletContext';
import { useSpl } from '../context/SplContext';
import { formatSOLBalance } from '../utils/balance';
import { PublicKey } from '@solana/web3.js';
import { SplToken } from '../types/SplToken';
import { SimpleTransaction } from '../types/Wallet';

// Public Key Component
const PublicKeySection = ({ publicKey }: { publicKey: PublicKey }) => (
  <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Public Key</h2>
    <div className="flex items-center">
      <p className="text-gray-600 dark:text-gray-400 break-all mr-2">{publicKey.toString()}</p>
    </div>
  </div>
);

// Secret Key Component
const SecretKeySection = ({ secretKey, showSecretKey, toggleSecretKey }: { secretKey: Uint8Array, showSecretKey: boolean, toggleSecretKey: () => void }) => (
  <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Secret Key</h2>
    {showSecretKey ? (
      <p className="text-gray-600 dark:text-gray-400 break-all">
        {Buffer.from(secretKey).toString('hex')}
      </p>
    ) : (
      <p className="text-gray-600 dark:text-gray-400">Hidden for security</p>
    )}
    <button
      onClick={toggleSecretKey}
      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
    >
      {showSecretKey ? 'Hide' : 'Reveal'} Secret Key
    </button>
  </div>
);

// Balances Component
const BalancesSection = ({ solBalance, splBalance, splToken, handleRefresh }: { solBalance: number, splBalance: number, splToken: SplToken | undefined, handleRefresh: () => void }) => (
  <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Balances</h2>
    <p className="text-gray-600 dark:text-gray-400">SOL Balance: {formatSOLBalance(solBalance)} SOL</p>
    <p className="text-gray-600 dark:text-gray-400">SPL Token Balance: {splToken ? splBalance.toString() : 'N/A'} {splToken?.symbol}</p>
    <button
      onClick={handleRefresh}
      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      Refresh Balances
    </button>
  </div>
);

// Transaction History Component
const TransactionHistorySection = ({ txnHistory }: { txnHistory: SimpleTransaction[] }) => (
  <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Transaction History</h2>
    {txnHistory.length > 0 ? (
      <div className="grid grid-cols-1 gap-4">
        {txnHistory.map((tx, index) => (
          <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Slot</span>
              <span className="text-sm text-gray-800 dark:text-gray-200">{tx.slot}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Signature</span>
              <p className="text-xs text-gray-800 dark:text-gray-200 break-all">{tx.signature}</p>
            </div>
            <div className="mt-2">
              <a
                href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View in Explorer
              </a>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-600 dark:text-gray-400">No transactions yet</p>
    )}
  </div>
);

/**
 * WalletPage component displays wallet details, balances, and transaction history.
 */
const WalletPage: React.FC = () => {
  const { wallet, updateWalletBalance, updateWalletHistory } = useWalletsState();
  const { splToken } = useSpl();
  const [showSecretKey, setShowSecretKey] = useState(false);

  if (!wallet) {
    return <div className="text-center mt-8">Loading wallet...</div>;
  }

  /**
   * Refreshes wallet balances and transaction history.
   */
  const handleRefresh = async () => {
    await updateWalletBalance(wallet.publicKey, splToken);
    await updateWalletHistory(wallet.publicKey);
  };

  /**
   * Toggles the visibility of the secret key.
   */
  const toggleSecretKey = () => {
    setShowSecretKey(!showSecretKey);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Wallet Details</h1>
      <PublicKeySection publicKey={wallet.publicKey} />
      <SecretKeySection
        secretKey={wallet.secretKey}
        showSecretKey={showSecretKey}
        toggleSecretKey={toggleSecretKey}
      />
      <BalancesSection
        solBalance={wallet.solBalance}
        splBalance={wallet.splBalance}
        splToken={splToken}
        handleRefresh={handleRefresh}
      />
      <TransactionHistorySection txnHistory={wallet.txnHistory} />
    </div>
  );
};

export default WalletPage;
