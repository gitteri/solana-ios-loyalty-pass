"use client";

import React from 'react';
import { WalletPassProvider } from "./WalletPassContext";
import { SplProvider } from "./SplContext";
import { WalletStateProvider } from "./WalletContext";
import { RpcProvider } from './RpcContext';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <RpcProvider>
      <SplProvider>
        <WalletStateProvider>
          <WalletPassProvider>
            {children}
          </WalletPassProvider>
        </WalletStateProvider>
      </SplProvider>
    </RpcProvider>
  );
}