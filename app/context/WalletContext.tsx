'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useRpc } from './RpcContext';
import { useSpl } from './SplContext';
import { generateWallet, parseWallet, Wallet } from '../types/Wallet';
import { SplToken } from '../types/SplToken';

// WalletState: Interface defining the structure of the wallet state context
interface WalletState {
  wallet: Wallet | undefined;
  setWallet: React.Dispatch<React.SetStateAction<Wallet>>;
  updateWalletBalance: (address: PublicKey, mint?: SplToken) => Promise<void>;
  updateWalletSolBalance: (address: PublicKey) => Promise<void>;
  updateWalletHistory: (address: PublicKey) => Promise<void>;
  hydrated: boolean;
}

/**
 * Retrieves the wallet from local storage and converts it to a Wallet object
 * @returns {Wallet | undefined} The parsed wallet or undefined if not found
 */
const getWallet = (): (Wallet | undefined) => {
  const walletString = typeof window !== 'undefined' ? localStorage?.getItem('wallet') : undefined;
  return walletString ? parseWallet(walletString) : undefined;
}

// Create the WalletStateContext with default values
const WalletStateContext = createContext<WalletState>({
  wallet: undefined,
  setWallet: () => { },
  updateWalletBalance: async () => { },
  updateWalletSolBalance: async () => { },
  updateWalletHistory: async () => { },
  hydrated: false,
});

// Custom hook to access the wallet state context
export const useWalletsState = () => useContext(WalletStateContext);

// WalletStateProvider: Component that provides wallet state to its children
export const WalletStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [wallet, setWallet] = useState<Wallet>(getWallet() || generateWallet());
  const [hydrated, setHydrated] = useState(false);
  const splTokenContext = useSpl();
  const rpc = useRpc();

  /**
   * Updates the SOL balance for a given wallet address
   * @param {PublicKey} address - The wallet address to update
   */
  const updateWalletSolBalance = async (address: PublicKey) => {
    const solBalance = await rpc.getSolBalance(address);
    console.log('Updating SOL balance for', address.toString(), 'to', solBalance);
    setWallet((prevWallet) =>
      prevWallet && prevWallet.publicKey.equals(address) ? {
        ...prevWallet,
        solBalance: solBalance,
      } : prevWallet
    );
  };

  /**
   * Updates both SOL and SPL token balances for a given wallet address
   * @param {PublicKey} address - The wallet address to update
   * @param {SplToken} [mint] - Optional SPL token information
   */
  const updateWalletBalance = async (address: PublicKey, mint?: SplToken) => {
    console.log('Updating balance for', address.toString());
    const allBalances = mint && mint.mint ? await rpc.getAllBalances(address, mint) : { solBalance: await rpc.getSolBalance(address), splBalance: new BN(0) };
    console.log('All balances for', address.toString(), 'are', allBalances);

    setWallet((prevWallet) =>
      prevWallet && prevWallet.publicKey.equals(address) ? {
        ...prevWallet,
        solBalance: allBalances.solBalance,
        splBalance: allBalances.splBalance,
      } : prevWallet
    );
  };

  /**
   * Updates the transaction history for a given wallet address
   * @param {PublicKey} address - The wallet address to update
   */
  const updateWalletHistory = async (address: PublicKey) => {
    const history = await rpc.getTxnHistory(address);
    console.log('Updating transaction history for', address.toString(), 'to', history);
    setWallet((prevWallet) =>
      prevWallet && prevWallet.publicKey.equals(address) ? {
        ...prevWallet,
        txnHistory: history,
      } : prevWallet
    );
  };

  // Initial state loading
  useEffect(() => {
    console.log("Debug: loading initial state");
    updateWalletBalance(wallet.publicKey, splTokenContext.splToken);
    updateWalletHistory(wallet.publicKey);
    setHydrated(true);
  }, []);

  // Periodic updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (wallet) {
        if (wallet.solBalance.eq(new BN(0))) {
          rpc.airdropSolana(wallet.publicKey, 5);
        }
        updateWalletBalance(wallet.publicKey, splTokenContext.splToken);
        updateWalletHistory(wallet.publicKey);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('wallet', JSON.stringify(wallet));
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [wallet]);

  return (
    <WalletStateContext.Provider value={{ wallet, setWallet, updateWalletBalance, updateWalletSolBalance, updateWalletHistory, hydrated }}>
      {children}
    </WalletStateContext.Provider>
  );
}