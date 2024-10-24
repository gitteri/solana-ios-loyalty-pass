'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { getNetworkFromEnv, RpcService } from '../services/rpcService';

// RpcContext: Provides the RPC service throughout the application
const RpcContext = createContext<RpcService | undefined>(undefined);

/**
 * RpcProvider: Wraps the application and provides the RPC service to all child components
 * @param {Object} props - The component props
 * @param {ReactNode} props.children - The child components
 */
export const RpcProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const rpcService = new RpcService(process.env.NEXT_PUBLIC_HELIUS_API_KEY || '', getNetworkFromEnv());

  return (
    <RpcContext.Provider value={rpcService}>
      {children}
    </RpcContext.Provider>
  );
};

/**
 * useRpc: Custom hook to access the RPC service
 * @throws {Error} If used outside of RpcProvider
 * @returns {RpcService} The RPC service instance
 */
export const useRpc = (): RpcService => {
  const context = useContext(RpcContext);
  if (!context) {
    throw new Error('useRpc must be used within an RpcProvider');
  }
  return context;
};

/**
 * useNetwork: Custom hook to get the current network
 * @returns {string} The current network
 */
export const useNetwork = (): string => getNetworkFromEnv();