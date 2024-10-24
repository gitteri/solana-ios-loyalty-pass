'use client'

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { BN } from '@coral-xyz/anchor';
import { useRpc } from './RpcContext';
import { SplToken } from '../types/SplToken';

interface SplContextType {
  splToken: SplToken | undefined;
  addSplToken: (token: SplToken) => void;
}

const SplContext = createContext<SplContextType | undefined>(undefined);

export const SplProvider = ({ children }: { children: ReactNode }) => {
  const rpc = useRpc();
  const storedSplToken = typeof window !== 'undefined' ? localStorage.getItem('splToken') : undefined;
  const [splToken, setSplToken] = useState<SplToken | undefined>(
    storedSplToken ? JSON.parse(storedSplToken) : undefined
  );

  /**
   * Adds a new SPL token to the context and stores it in local storage
   * @param token The SPL token to add
   */
  const addSplToken = (token: SplToken) => {
    setSplToken(token);
    localStorage.setItem('splToken', JSON.stringify(token));
  };

  /**
   * Updates the SPL and SOL balances for the issuer
   */
  const updateSplIssuerBalances = async () => {
    if (!splToken) return;

    const allBalances = await rpc.getAllBalances(splToken.issuer, splToken);
    console.log('Updating balances for', splToken.issuer.toString(), 'to', allBalances);

    setSplToken((prev) =>
      prev ? {
        ...prev,
        issuerBalance: allBalances.splBalance,
        issuerBalanceSol: allBalances.solBalance,
      } : prev
    );
  };

  useEffect(() => {
    console.log("Debug: loading initial state");
    fetch('/api/token')
      .then(response => response.json())
      .then(data => setSplToken(data));
    updateSplIssuerBalances();
  }, []);

  useEffect(() => {
    if (!splToken) return;

    const intervalId = setInterval(() => {
      console.log('Debug: checking SOL balance for', splToken.issuerBalanceSol);
      if (splToken.issuerBalanceSol && splToken.issuerBalanceSol.eq(new BN(0))) {
        rpc.airdropSolana(splToken.issuer, 5);
      }
      updateSplIssuerBalances();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [splToken]);

  return (
    <SplContext.Provider value={{ splToken, addSplToken }}>
      {children}
    </SplContext.Provider>
  );
};

/**
 * Custom hook to use the SPL context
 * @returns The SPL context
 * @throws Error if used outside of SplProvider
 */
export const useSpl = () => {
  const context = useContext(SplContext);
  if (!context) {
    throw new Error('useSpl must be used within a SplProvider');
  }
  return context;
};
