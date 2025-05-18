"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BarCodeScanner } from "expo-barcode-scanner"
import { router } from "expo-router"
import { ArrowLeft, Check } from "lucide-react-native"
import { createClient } from "@supabase/supabase-js"
import * as SecureStore from "expo-secure-store"
import algosdk from "algosdk" // Import algosdk

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://tficheendnovlkzoqoop.supabase.co"
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmaWNoZWVuZG5vdmxrem9xb29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MTM5NjksImV4cCI6MjA1NDk4OTk2OX0.TNCHYkgbgFchghO2FGoC9c_hSm1x1ACtBdzLdFQSbPE"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === "granted")
    }

    getBarCodeScannerPermissions()
  }, [])

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    try {
      setScanned(true)
      setConnecting(true)
      setError(null)

      // Parse the QR code data
      const qrData = JSON.parse(data)

      if (!qrData.sessionId || qrData.type !== "connect") {
        throw new Error("Invalid QR code format")
      }

      const sessionId = qrData.sessionId
      console.log("Session ID:", sessionId)

      // Get wallet address from secure storage
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (!mnemonic) {
        throw new Error("No wallet found. Please create a wallet first.")
      }

      // Get the wallet address
      const account = algosdk.mnemonicToSecretKey(mnemonic)
      const walletAddress = account.addr.toString()

      // Connect to Supabase realtime channel
      const channel = supabase
        .channel(`wallet_connect:${sessionId}`)
        .on("broadcast", { event: "message" }, (payload) => {
          console.log("Received message:", payload)
        })
        .subscribe()

      // Send wallet address to the web app
      await channel.send({
        type: "broadcast",
        event: "wallet_connect",
        payload: {
          address: walletAddress,
          provider: "algoquest",
        },
      })

      setConnected(true)
      setConnecting(false)

      // Auto-navigate back after successful connection
      setTimeout(() => {
        router.back()
      }, 2000)
    } catch (err: any) {
      console.error("Error scanning QR code:", err)
      setError(err.message || "Failed to connect wallet")
      setConnecting(false)
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No access to camera</Text>
          <Text style={styles.errorSubtext}>Please enable camera permissions in your device settings</Text>
          <TouchableOpacity style={styles.button} onPress={handleGoBack}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={{ width: 24 }} />
      </View>

      {!scanned && (
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.overlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.instructionText}>Scan the QR code from the web app</Text>
          </View>
        </View>
      )}

      {scanned && (
        <View style={styles.resultContainer}>
          {connecting && (
            <>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.connectingText}>Connecting wallet...</Text>
            </>
          )}

          {connected && (
            <>
              <View style={styles.successIcon}>
                <Check size={40} color="#10B981" />
              </View>
              <Text style={styles.successText}>Wallet connected successfully!</Text>
              <Text style={styles.redirectingText}>Redirecting back...</Text>
            </>
          )}

          {error && (
            <>
              <Text style={styles.errorText}>Connection Error</Text>
              <Text style={styles.errorSubtext}>{error}</Text>
              <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  scannerContainer: {
    flex: 1,
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#7C3AED",
    backgroundColor: "transparent",
    borderRadius: 16,
    marginBottom: 24,
  },
  instructionText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    marginHorizontal: 32,
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  connectingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successText: {
    color: "#10B981",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  redirectingText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  errorSubtext: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    marginTop: 16,
  },
})
