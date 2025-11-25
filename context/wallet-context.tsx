"use client"

import { createContext, useContext, useEffect, useState } from "react"
import * as SecureStore from "expo-secure-store"
import { router } from "expo-router"

interface WalletContextType {
  hasWallet: boolean | null; // Change to allow null
  checkWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({ 
  hasWallet: null,
  checkWallet: async () => {} 
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [hasWallet, setHasWallet] = useState<boolean | null>(null)

  const checkWallet = async () => {
    try {
      // Check for either mnemonic (generated wallet) or wallet address (PeraWallet)
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      const walletAddress = await SecureStore.getItemAsync("walletAddress")
      const hasAnyWallet = !!(mnemonic || walletAddress)
      
      setHasWallet(hasAnyWallet)

      if (!hasAnyWallet) {
        router.replace("/onboarding")
      }
    } catch (error) {
      console.error("Error checking wallet:", error)
      setHasWallet(false)
    }
  }

  useEffect(() => {
    checkWallet()
  }, []) // Removed checkWallet from dependencies

  return <WalletContext.Provider value={{ hasWallet, checkWallet }}>{children}</WalletContext.Provider>
}

export function useWallet() {
  return useContext(WalletContext);
}