"use client";

import React, { FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

import { clusterApiUrl } from '@solana/web3.js';
 
// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');
 
export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Devnet;
 
    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
 
    const wallets = useMemo(
        () => [],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    );
 
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>       
                {children}
            </WalletProvider>
        </ConnectionProvider>
    );
};