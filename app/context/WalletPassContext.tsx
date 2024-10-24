'use client';

import React, { createContext, useState, ReactNode, useContext } from 'react';
import { Buffer } from 'buffer';

export interface WalletPass {
  id: string;
  label: string;
  amount: string;
  buffer: Buffer;
}

interface WalletPassContextType {
  walletPasses: WalletPass[];
  addWalletPass: (newPass: WalletPass) => void;
  removeWalletPass: (passId: string) => void;
  getWalletPass: (passId: string) => WalletPass | undefined;
}

const WalletPassContext = createContext<WalletPassContextType | undefined>(undefined);

export const WalletPassProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [walletPasses, setWalletPasses] = useState<WalletPass[]>([]);

  /**
   * Adds a new wallet pass to the list of passes
   * @param newPass The new wallet pass to be added
   */
  const addWalletPass = (newPass: WalletPass) => {
    setWalletPasses((prevPasses) => [...prevPasses, newPass]);
  };

  /**
   * Removes a wallet pass from the list based on its ID
   * @param passId The ID of the pass to be removed
   */
  const removeWalletPass = (passId: string) => {
    setWalletPasses((prevPasses) => prevPasses.filter(pass => pass.id !== passId));
  };

  /**
   * Retrieves a wallet pass by its ID
   * @param passId The ID of the pass to retrieve
   * @returns The wallet pass if found, undefined otherwise
   */
  const getWalletPass = (passId: string) => {
    return walletPasses.find(pass => pass.id === passId);
  };

  return (
    <WalletPassContext.Provider value={{ walletPasses, addWalletPass, removeWalletPass, getWalletPass }}>
      {children}
    </WalletPassContext.Provider>
  );
};

/**
 * Custom hook for using the WalletPassContext
 * @returns The WalletPassContextType object
 * @throws Error if used outside of WalletPassProvider
 */
export const useWalletPassContext = (): WalletPassContextType => {
  const context = useContext(WalletPassContext);
  if (!context) {
    throw new Error('useWalletPassContext must be used within a WalletPassProvider');
  }
  return context;
};
