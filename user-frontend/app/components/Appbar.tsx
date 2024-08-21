"use client";

import React, { useEffect } from "react"

import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from "@solana/wallet-adapter-react";
import axios from "axios";



export default function Appbar() {
    const {publicKey,signMessage} = useWallet();

    async function signAndSend() {
        if (!publicKey || !signMessage) return;

        const message = new TextEncoder().encode("You have signed-in to Crowd Source.");
        const signature = await signMessage?.(message);
        console.log("Signature Length frontend:", signature?.length);

    
        const response = await axios.post(`http://localhost:3000/v1/user/signin`,{
            signature,
            publicKey: publicKey?.toString()
        });

        localStorage.setItem("token",response.data.token);
    }

    useEffect(()=>{
        if(publicKey){
            signAndSend()
    }},[publicKey]);
    return (
        <div className="flex min-h-screenflex-col items-center justify-between p-4 border-gray-600 border-b-[0.2px]">
            <div>
                CROWD_SOURCE
            </div>
            <div>
            
            <WalletModalProvider>
            {publicKey ? <WalletDisconnectButton />:<WalletMultiButton />}
            </WalletModalProvider>
            </div>
        </div>
    )
}