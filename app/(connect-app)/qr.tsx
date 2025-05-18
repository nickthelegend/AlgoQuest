"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, AppState, Alert, Modal } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BarCodeScanner } from "expo-barcode-scanner"
import { router } from "expo-router"
import { ArrowLeft, Check, Wifi, WifiOff, AlertCircle, X } from "lucide-react-native"
import { createClient } from "@supabase/supabase-js"
import * as SecureStore from "expo-secure-store"
import algosdk from "algosdk"
import { LinearGradient } from "expo-linear-gradient"

// Initialize Supabase client with WebSocket options
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://tficheendnovlkzoqoop.supabase.co"
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmaWNoZWVuZG5vdmxrem9xb29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MTM5NjksImV4cCI6MjA1NDk4OTk2OX0.TNCHYkgbgFchghO2FGoC9c_hSm1x1ACtBdzLdFQSbPE"

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    heartbeatIntervalMs: 5000, // Send heartbeat every 5 seconds
  },
})

export default function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listeningActive, setListeningActive] = useState(false)
  const [channelStatus, setChannelStatus] = useState<string>("CLOSED")
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [transactionRequest, setTransactionRequest] = useState<any>(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  const appState = useRef(AppState.currentState)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null)
  const timeDisplayTimerRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)
  const transactionChannelRef = useRef<any>(null)
  const listeningAddressRef = useRef<string>("")
  const endTimeRef = useRef<number>(0)

  // Update time remaining display
  useEffect(() => {
    if (listeningActive && endTimeRef.current > 0) {
      const updateTimeRemaining = () => {
        const now = Date.now()
        const remaining = Math.max(0, endTimeRef.current - now)

        if (remaining <= 0) {
          setTimeRemaining("Completed")
          if (timeDisplayTimerRef.current) {
            clearInterval(timeDisplayTimerRef.current)
          }
          stopListening()
          return
        }

        const minutes = Math.floor(remaining / 60000)
        const seconds = Math.floor((remaining % 60000) / 1000)
        setTimeRemaining(`${minutes}m ${seconds}s remaining`)
      }

      updateTimeRemaining()
      timeDisplayTimerRef.current = setInterval(updateTimeRemaining, 1000)

      return () => {
        if (timeDisplayTimerRef.current) {
          clearInterval(timeDisplayTimerRef.current)
        }
      }
    }
  }, [listeningActive])

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      console.log(`App state changed from ${appState.current} to ${nextAppState}`)

      if (appState.current.match(/inactive|background/) && nextAppState === "active" && listeningActive) {
        // App has come to the foreground and we're still in listening mode
        console.log("App has come to the foreground, checking WebSocket connection")

        // Check if we need to reconnect
        if (channelStatus !== "SUBSCRIBED" && listeningAddressRef.current) {
          console.log("WebSocket disconnected, reconnecting...")
          setupTransactionChannel(listeningAddressRef.current)
        } else {
          console.log("WebSocket connection still active")
          // Send a heartbeat to ensure connection is still alive
          sendHeartbeat()
        }
      }

      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [listeningActive, channelStatus])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupTimers()
    }
  }, [])

  const cleanupTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }
    if (timeDisplayTimerRef.current) {
      clearInterval(timeDisplayTimerRef.current)
      timeDisplayTimerRef.current = null
    }
  }

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === "granted")
    }

    getBarCodeScannerPermissions()
  }, [])

  const sendHeartbeat = () => {
    if (transactionChannelRef.current) {
      console.log("Sending heartbeat to keep WebSocket alive...")
      try {
        transactionChannelRef.current.send({
          type: "broadcast",
          event: "heartbeat",
          payload: { timestamp: new Date().toISOString() },
        })
      } catch (err) {
        console.error("Error sending heartbeat:", err)
      }
    }
  }

  const stopListening = () => {
    console.log("Stopping transaction listener")
    if (transactionChannelRef.current) {
      transactionChannelRef.current.unsubscribe()
      transactionChannelRef.current = null
    }

    setListeningActive(false)
    listeningAddressRef.current = ""
    endTimeRef.current = 0

    // Clean up timers
    cleanupTimers()

    Alert.alert("Listening Stopped", "Transaction listening has ended after 1 hour")
  }

  const setupTransactionChannel = (walletAddress: string) => {
    // Store the address for potential reconnects
    listeningAddressRef.current = walletAddress

    // For demo purposes, we'll use the fixed address from the user's request
    const listeningAddress = "ESCVMDFDZ4FB7V77D4FXCF3HY4DPWTZYAYHVZAVI3ZUFE5LWIWR5O4KMRY"

    console.log("Setting up WebSocket connection for:", listeningAddress)

    // If there's an existing channel, unsubscribe first
    if (transactionChannelRef.current) {
      transactionChannelRef.current.unsubscribe()
    }

    // Create a new channel with robust error handling
    const channel = supabase
      .channel(`wallet_transaction:${listeningAddress}`, {
        config: {
          broadcast: { self: true },
          presence: { key: walletAddress },
        },
      })
      .on("broadcast", { event: "transaction_request" }, async (payload) => {
        console.log("Received transaction request (event):", payload)
        // Show transaction request on screen
        setTransactionRequest(payload.payload)
        setShowTransactionModal(true)
      })
      .on("broadcast", { type: "broadcast" }, async (payload) => {
        console.log("Received broadcast message:", payload)
        if (payload.event === "transaction_request") {
          console.log("Received transaction request (broadcast):", payload)
          // Show transaction request on screen
          setTransactionRequest(payload.payload)
          setShowTransactionModal(true)
        }
      })
      .on("presence", { event: "sync" }, () => {
        console.log("Presence sync event")
      })
      .on("system", { event: "disconnect" }, (payload) => {
        console.log("System disconnect:", payload)
        setChannelStatus("DISCONNECTED")

        // Try to reconnect after a short delay
        if (listeningActive && !reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            console.log("Attempting to reconnect after disconnect...")
            reconnectTimerRef.current = null
            setupTransactionChannel(listeningAddressRef.current)
          }, 3000) // Wait 3 seconds before reconnecting
        }
      })

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log("WebSocket connection status:", status)
      setChannelStatus(status)

      if (status === "SUBSCRIBED") {
        // Store the channel reference
        transactionChannelRef.current = channel

        // Alert user
        Alert.alert(
          "Listening Active",
          `Listening for transaction requests on ${listeningAddress.substring(0, 8)}... for 1 hour`,
        )

        // Set up heartbeat interval to keep the connection alive
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current)
        }

        heartbeatTimerRef.current = setInterval(sendHeartbeat, 15000) // Send heartbeat every 15 seconds
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        console.log("WebSocket closed or error occurred, attempting to reconnect...")

        // Try to reconnect after a short delay
        if (listeningActive && !reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            console.log("Attempting to reconnect...")
            reconnectTimerRef.current = null
            setupTransactionChannel(listeningAddressRef.current)
          }, 3000) // Wait 3 seconds before reconnecting
        }
      }
    })

    return channel
  }

  const startTransactionListener = async (walletAddress: string) => {
    try {
      console.log("Starting transaction listener for:", walletAddress)
      setListeningActive(true)

      // Calculate end time (1 hour from now)
      const endTime = Date.now() + 60 * 60 * 1000 // 1 hour in milliseconds
      endTimeRef.current = endTime

      // Set up the transaction channel
      setupTransactionChannel(walletAddress)

      // Set timer to stop listening after 1 hour
      timerRef.current = setTimeout(
        () => {
          stopListening()
        },
        60 * 60 * 1000,
      ) // 1 hour in milliseconds

      return true
    } catch (err) {
      console.error("Error starting transaction listener:", err)
      Alert.alert("Error", "Failed to start transaction listener")
      return false
    }
  }

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
      channelRef.current = supabase
        .channel(`wallet_connect:${sessionId}`, {
          config: {
            broadcast: { self: true },
          },
        })
        .on("broadcast", { event: "message" }, (payload) => {
          console.log("Received message:", payload)
        })
        .subscribe()

      // Send wallet address to the web app
      await channelRef.current.send({
        type: "broadcast",
        event: "wallet_connect",
        payload: {
          address: walletAddress,
          provider: "algoquest",
        },
      })

      // Start transaction listener
      const success = await startTransactionListener(walletAddress)

      if (success) {
        setConnected(true)
        setConnecting(false)
      } else {
        throw new Error("Failed to start transaction listener")
      }
    } catch (err: any) {
      console.error("Error scanning QR code:", err)
      setError(err.message || "Failed to connect wallet")
      setConnecting(false)
    }
  }

  const handleViewTransaction = () => {
    if (transactionRequest) {
      router.push({
        pathname: "/(deep_url)/txn_handler",
        params: { txnData: JSON.stringify(transactionRequest) },
      })
      setShowTransactionModal(false)
    }
  }

  const handleGoBack = () => {
    if (listeningActive) {
      Alert.alert("Listening Active", "Transaction listening is active. Do you want to stop listening and go back?", [
        {
          text: "Keep Listening",
          style: "cancel",
        },
        {
          text: "Stop and Go Back",
          onPress: () => {
            stopListening()
            router.back()
          },
          style: "destructive",
        },
      ])
    } else {
      router.back()
    }
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
        <Text style={styles.headerTitle}>{scanned && connected ? "Transaction Listener" : "Scan QR Code"}</Text>
        {listeningActive && (
          <View style={styles.statusIndicator}>
            {channelStatus === "SUBSCRIBED" ? (
              <Wifi size={18} color="#10B981" />
            ) : (
              <WifiOff size={18} color="#EF4444" />
            )}
          </View>
        )}
      </View>

      {listeningActive && (
        <View style={styles.listeningBanner}>
          <Text style={styles.listeningText}>
            Listening for transactions {timeRemaining ? `(${timeRemaining})` : ""}
          </Text>
          <View
            style={[
              styles.statusDot,
              channelStatus === "SUBSCRIBED" ? styles.statusConnected : styles.statusDisconnected,
            ]}
          />
        </View>
      )}

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
              <Text style={styles.listeningText}>
                Listening for transaction requests for 1 hour
                {channelStatus !== "SUBSCRIBED" && " (Connecting...)"}
              </Text>

              <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Connection Status:</Text>
                  <View style={styles.statusValueContainer}>
                    <View
                      style={[
                        styles.statusIndicatorDot,
                        channelStatus === "SUBSCRIBED" ? styles.statusConnected : styles.statusDisconnected,
                      ]}
                    />
                    <Text style={styles.statusValue}>
                      {channelStatus === "SUBSCRIBED" ? "Connected" : "Reconnecting..."}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Time Remaining:</Text>
                  <Text style={styles.statusValue}>{timeRemaining || "Calculating..."}</Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Listening Address:</Text>
                  <Text style={styles.statusValue} numberOfLines={1}>
                    ESCVMD...O4KMRY
                  </Text>
                </View>
              </View>

              <Text style={styles.instructionText}>
                Keep this screen open to receive transaction requests. You'll see them appear here.
              </Text>

              <TouchableOpacity
                style={styles.stopButton}
                onPress={() => {
                  Alert.alert("Stop Listening", "Are you sure you want to stop listening for transactions?", [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Stop",
                      onPress: stopListening,
                      style: "destructive",
                    },
                  ])
                }}
              >
                <Text style={styles.stopButtonText}>Stop Listening</Text>
              </TouchableOpacity>
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

      {/* Transaction Request Modal */}
      <Modal
        visible={showTransactionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTransactionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={["#7C3AED", "#4F46E5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <AlertCircle size={24} color="#ffffff" />
              <Text style={styles.modalTitle}>Transaction Request</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowTransactionModal(false)}>
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                You have received a new transaction request that requires your approval.
              </Text>

              {transactionRequest && (
                <View style={styles.transactionInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Transaction ID:</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {transactionRequest.txnId}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Time Received:</Text>
                    <Text style={styles.infoValue}>{new Date(transactionRequest.timestamp).toLocaleTimeString()}</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.viewButton} onPress={handleViewTransaction}>
                <Text style={styles.viewButtonText}>View and Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dismissButton} onPress={() => setShowTransactionModal(false)}>
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  listeningBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  listeningText: {
    color: "#ffffff",
    fontSize: 14,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusConnected: {
    backgroundColor: "#10B981",
  },
  statusDisconnected: {
    backgroundColor: "#EF4444",
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
    marginTop: 16,
    marginBottom: 24,
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
  statusCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  statusLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  statusValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  statusValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  stopButton: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  stopButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#121212",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    padding: 16,
  },
  modalText: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 16,
  },
  transactionInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    width: 120,
  },
  infoValue: {
    color: "#ffffff",
    fontSize: 14,
    flex: 1,
  },
  viewButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  viewButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  dismissButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  dismissButtonText: {
    color: "#ffffff",
    fontSize: 16,
  },
})
