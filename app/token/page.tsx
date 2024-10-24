'use client';

import React, { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useWalletsState } from '../context/WalletContext';
import { useSpl } from '../context/SplContext';
import { useRpc } from '../context/RpcContext';
import { formatSOLBalance } from '../utils/balance';

const TokenPage: React.FC = () => {
  const { wallet } = useWalletsState();
  const { splToken, addSplToken } = useSpl();
  const rpc = useRpc();
  const [mintAmount, setMintAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  /**
   * Creates a new loyalty token by calling the backend API.
   */
  const handleCreateToken = async () => {
    setIsCreatingToken(true);
    try {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const token = await response.json();
      addSplToken(token);
    } catch (error) {
      console.error('Error creating token:', error);
    } finally {
      setIsCreatingToken(false);
    }
  };

  /**
   * Mints new tokens to a specified destination address.
   * @param destination The recipient's address
   */
  const handleMintToken = async (destination: string) => {
    if (!splToken) return;
    setIsMinting(true);
    try {
      await fetch('/api/token/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, amount: mintAmount })
      });
    } catch (error) {
      console.error('Error minting tokens:', error);
    } finally {
      setIsMinting(false);
    }
  };

  /**
   * Transfers tokens from the current wallet to a specified address.
   * @param destination The recipient's address
   * @param amount The amount of tokens to transfer
   */
  const handleTransferToken = async (destination: string, amount: string) => {
    if (!splToken || !wallet) return;
    setIsTransferring(true);
    try {
      const recipientAddress = new PublicKey(destination);
      await rpc.transferSpl(wallet, wallet, recipientAddress, new BN(amount), splToken);
    } catch (error) {
      console.error('Error transferring tokens:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  if (!splToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <button
          onClick={handleCreateToken}
          disabled={isCreatingToken}
          className={`px-6 py-3 text-white rounded-lg transition-colors ${isCreatingToken ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
            }`}
        >
          {isCreatingToken ? 'Creating Loyalty Token...' : 'Create Loyalty Token'}
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Loyalty Token Details</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Token Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <strong>Token Name:</strong> {splToken.name}
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <strong>Token Symbol:</strong> {splToken.symbol}
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <strong>Token Decimals:</strong> {splToken.decimals}
            </p>
          </div>
          <div>
            <div className="text-gray-700 dark:text-gray-300 mb-2">
              <strong>Token Mint:</strong>
              <div className="mt-1 break-all">
                <a href={`https://explorer.solana.com/address/${splToken.mint.toString()}?cluster=devnet`}
                  target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {splToken.mint.toString()}
                </a>
              </div>
            </div>
            <div className="text-gray-700 dark:text-gray-300 mb-2">
              <strong>Token Program ID:</strong>
              <div className="mt-1 break-all">
                <a href={`https://explorer.solana.com/address/${splToken.programId.toString()}?cluster=devnet`}
                  target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {splToken.programId.toString()}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {splToken.issuer && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Issuer Wallet Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Public Key:</strong>
                <span className="block mt-1 break-all">
                  {splToken.issuer.toString()}
                </span>
              </p>
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>SOL Balance:</strong> {formatSOLBalance(splToken.issuerBalanceSol)} SOL
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>SPL Balance:</strong> {splToken.issuerBalance.toString()} {splToken.symbol}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Mint Tokens</h2>
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="Recipient address"
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
        />
        <input
          type="number"
          value={mintAmount}
          onChange={(e) => setMintAmount(e.target.value)}
          placeholder="Amount to mint"
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={() => handleMintToken(recipientAddress)}
          disabled={isMinting}
          className={`px-4 py-2 text-white rounded transition-colors ${isMinting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
        >
          {isMinting ? 'Minting...' : 'Mint Tokens'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Transfer Tokens</h2>
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="Recipient address"
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
        />
        <input
          type="number"
          value={transferAmount}
          onChange={(e) => setTransferAmount(e.target.value)}
          placeholder="Amount to transfer"
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={() => handleTransferToken(recipientAddress, transferAmount)}
          disabled={isTransferring}
          className={`px-4 py-2 text-white rounded transition-colors ${isTransferring ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {isTransferring ? 'Transferring...' : 'Transfer Tokens'}
        </button>
      </div>
    </div>
  );
};

export default TokenPage;
