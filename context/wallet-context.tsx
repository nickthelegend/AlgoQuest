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
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      setHasWallet(!!mnemonic)

      if (!mnemonic) {
        router.push("/create-wallet")
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