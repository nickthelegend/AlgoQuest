"use client"

import { useState } from "react"
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown } from "react-native-reanimated"
import { router } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { LinearGradient } from "expo-linear-gradient"
import { ArrowRight, KeyRound, ArrowLeft } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"
import algosdk from "algosdk"

const supabase = createClient(
  "https://tficheendnovlkzoqoop.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmaWNoZWVuZG5vdmxrem9xb29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MTM5NjksImV4cCI6MjA1NDk4OTk2OX0.TNCHYkgbgFchghO2FGoC9c_hSm1x1ACtBdzLdFQSbPE",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
)

export default function WalletBackupScreen() {
  const [mnemonic, setMnemonic] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRestore = async () => {
    try {
      setIsLoading(true)
      setError("")

      // Validate mnemonic format
      const words = mnemonic.trim().split(/\s+/)
      if (words.length !== 25) {
        setError("Please enter all 25 words of your recovery phrase")
        return
      }

      // Try to recover the account from mnemonic
      try {
        const account = algosdk.mnemonicToSecretKey(mnemonic)
        const walletAddress = account.addr.toString()

        console.log("Wallet restored successfully:", walletAddress)

        // Store wallet address and mnemonic in secure storage
        await SecureStore.setItemAsync("mnemonic", mnemonic)
        await SecureStore.setItemAsync("walletAddress", walletAddress)

        // Check if user exists in database
        const { data: existingUser } = await supabase
          .from("users")
          .select("*")
          .eq("wallet_address", walletAddress)
          .single()

        // If user doesn't exist, create a minimal profile
        if (!existingUser) {
          await supabase.from("users").insert([
            {
              wallet_address: walletAddress,
              created_at: new Date().toISOString(),
              profile_created: false,
            },
          ])
        }

        // Navigate to home screen
        router.push("/(tabs)")
      } catch (error) {
        console.error("Invalid mnemonic:", error)
        setError("Invalid recovery phrase. Please check and try again.")
      }
    } catch (error) {
      console.error("Error restoring wallet:", error)
      setError("Failed to restore wallet. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.content}>
          <BlurView intensity={40} tint="dark" style={styles.formCard}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <KeyRound size={32} color="#7C3AED" />
            <Text style={styles.title}>Restore Your Wallet</Text>
            <Text style={styles.subtitle}>Enter your 25-word recovery phrase to access your wallet</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Recovery Phrase</Text>
              <TextInput
                style={styles.mnemonicInput}
                placeholder="Enter your 25-word recovery phrase..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={mnemonic}
                onChangeText={setMnemonic}
                multiline
                numberOfLines={4}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
              />
              <Text style={styles.helperText}>Enter all 25 words in order, separated by spaces</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft size={20} color="#ffffff" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, !mnemonic.trim() && styles.buttonDisabled]}
                onPress={handleRestore}
                disabled={!mnemonic.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Restore Wallet</Text>
                    <ArrowRight size={20} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  formCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  mnemonicInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    textAlignVertical: "top",
    minHeight: 120,
  },
  helperText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 2,
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
})
