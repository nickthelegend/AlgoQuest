"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Shield, Swords, Crown, Star, Users } from "lucide-react-native"
import { router } from "expo-router"
import * as NearbyConnections from "expo-nearby-connections"
import * as Notifications from "expo-notifications"
import * as SecureStore from "expo-secure-store"
import { PERMISSIONS, RESULTS, checkMultiple, requestMultiple } from "react-native-permissions"
import algosdk from "algosdk"

// Declare __DEV__ if it's not already defined (e.g., in a testing environment)
declare const __DEV__: boolean

interface Player {
  id: string
  name: string
  rank: number
  level: number
  winRate: string
  avatar: string
  status: "online" | "in-game" | "offline"
  selectedBeast?: {
    name: string
    power: number
    element: string
    image: string
  }
}

async function checkAndRequestPermissions(): Promise<boolean> {
  const permissions =
    Platform.OS === "ios"
      ? [PERMISSIONS.IOS.BLUETOOTH]
      : [
          PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE,
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
          PERMISSIONS.ANDROID.NEARBY_WIFI_DEVICES,
        ]

  try {
    const statuses = await checkMultiple(permissions)
    const allGranted = Object.values(statuses).every(
      (status) => status === RESULTS.GRANTED || status === RESULTS.UNAVAILABLE || status === RESULTS.LIMITED,
    )

    if (allGranted) return true

    const requestStatuses = await requestMultiple(permissions)
    return Object.values(requestStatuses).every(
      (status) => status === RESULTS.GRANTED || status === RESULTS.UNAVAILABLE || status === RESULTS.LIMITED,
    )
  } catch (error) {
    console.error("Error checking permissions:", error)
    return false
  }
}

export default function FindPlayersScreen() {
  const [players, setPlayers] = useState<Player[]>([])
  const [scanning, setScanning] = useState(false)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [myPeerId, setMyPeerId] = useState<string>("")
  const [username, setUsername] = useState<string>("Player")
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [connectedPeerId, setConnectedPeerId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Set up notification handler
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    })

    // Request notification permissions
    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== "granted") {
        console.log("Notification permissions not granted")
      }
    }

    requestNotificationPermissions()
  }, [])

  // Initialize permissions and load username and wallet address
  useEffect(() => {
    const initializePermissions = async () => {
      const granted = await checkAndRequestPermissions()
      setPermissionsGranted(granted)
      if (granted) {
        loadUserData()
      } else {
        Alert.alert(
          "Permissions Required",
          "This feature requires Bluetooth and Location permissions to work properly.",
        )
      }
    }

    initializePermissions()

    return () => {
      if (scanning) {
        stopScanning()
      }
    }
  }, [])

  // Set up NearbyConnections listeners
  useEffect(() => {
    if (!permissionsGranted) return

    // Listen for discovered peers
    const onPeerFoundListener = NearbyConnections.onPeerFound((data) => {
      console.log("Player found:", data)
      setDebugInfo((prev) => prev + `\nPeer found: ${JSON.stringify(data)}`)

      setPlayers((prev) => {
        if (prev.some((player) => player.id === data.peerId)) return prev

        // Create a new player from the discovered peer
        const newPlayer: Player = {
          id: data.peerId,
          name: data.name || "Unknown Player",
          rank: Math.floor(Math.random() * 2000) + 1,
          level: Math.floor(Math.random() * 100) + 1,
          winRate: `${Math.floor(Math.random() * 100)}%`,
          avatar:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7BC5DA1ABA-D239-47BF-86A4-7F62F953B61C%7D-oDh5OOGSt6RLj6h8lnARTFRGEVF7dC.png",
          status: "online",
          selectedBeast: {
            name: "Mystery Beast",
            power: Math.floor(Math.random() * 10000),
            element: ["Fire", "Water", "Earth", "Air", "Light", "Dark"][Math.floor(Math.random() * 6)],
            image: "/placeholder.svg?height=100&width=100",
          },
        }

        return [...prev, newPlayer]
      })
    })

    const onPeerLostListener = NearbyConnections.onPeerLost((data) => {
      console.log("Player lost:", data)
      setDebugInfo((prev) => prev + `\nPeer lost: ${JSON.stringify(data)}`)
      setPlayers((prev) => prev.filter((player) => player.id !== data.peerId))
    })

    // Listen for battle invitations
    const onInvitationListener = NearbyConnections.onInvitationReceived((data) => {
      console.log("Battle invitation received from:", data.name)
      setDebugInfo((prev) => prev + `\nInvitation received: ${JSON.stringify(data)}`)

      // Schedule a local notification to alert the user
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Battle Challenge",
          body: `${data.name} wants to battle with you!`,
        },
        trigger: null, // sends the notification immediately
      })

      // Prompt the user to accept or reject the battle
      Alert.alert(
        "Battle Challenge",
        `${data.name} wants to battle with you!`,
        [
          {
            text: "Decline",
            onPress: () => handleRejectBattle(data.peerId),
            style: "cancel",
          },
          {
            text: "Accept",
            onPress: () => handleAcceptBattle(data.peerId),
          },
        ],
        { cancelable: false },
      )
    })

    // Listen for connection state changes
    const onConnectedListener = NearbyConnections.onConnected((data) => {
      console.log("Connected to:", data)
      setDebugInfo((prev) => prev + `\nConnected: ${JSON.stringify(data)}`)
      setConnectedPeerId(data.peerId)

      // If we're connected, we can navigate to the battle arena
      if (data.name) {
        Alert.alert("Battle Starting", `Connected with ${data.name}. Prepare for battle!`, [
          {
            text: "Let's Go!",
            onPress: () => router.push("/battle-arena"),
          },
        ])
      }
    })

    const onDisconnectedListener = NearbyConnections.onDisconnected((data) => {
      console.log("Disconnected from:", data)
      setDebugInfo((prev) => prev + `\nDisconnected: ${JSON.stringify(data)}`)
      setConnectedPeerId(null)
    })

    return () => {
      onPeerFoundListener()
      onPeerLostListener()
      onInvitationListener()
      onConnectedListener()
      onDisconnectedListener()
    }
  }, [permissionsGranted])

  const loadUserData = async () => {
    try {
      // Load username
      const storedUsername = await SecureStore.getItemAsync("username")
      if (storedUsername) {
        setUsername(storedUsername)
      }

      // Load wallet address
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (mnemonic) {
        const account = algosdk.mnemonicToSecretKey(mnemonic)
        const address = account.addr.toString()
        setWalletAddress(address)
        console.log("Wallet address loaded:", address)
        setDebugInfo((prev) => prev + `\nWallet address loaded: ${address}`)
      } else {
        console.log("No mnemonic found in secure storage")
        setDebugInfo((prev) => prev + `\nNo mnemonic found in secure storage`)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
      setDebugInfo((prev) => prev + `\nError loading user data: ${error}`)
    }
  }

  const startScanning = async () => {
    if (!permissionsGranted) {
      const granted = await checkAndRequestPermissions()
      if (!granted) {
        Alert.alert(
          "Permissions Required",
          "Please grant the required permissions in your device settings to use this feature.",
        )
        return
      }
      setPermissionsGranted(granted)
    }

    if (!walletAddress) {
      Alert.alert("Error", "Wallet address not found. Please create a wallet first.")
      return
    }

    try {
      // First stop any existing discovery and advertising
      await stopScanning()

      // Clear debug info
      setDebugInfo("Starting scan...")

      // Set scanning state to true
      setScanning(true)

      // Add the current user to the players list for testing
      const myPlayer: Player = {
        id: "self-test-id",
        name: username || "Me (Test)",
        rank: 999,
        level: 99,
        winRate: "100%",
        avatar:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7BC5DA1ABA-D239-47BF-86A4-7F62F953B61C%7D-oDh5OOGSt6RLj6h8lnARTFRGEVF7dC.png",
        status: "online",
        selectedBeast: {
          name: "My Beast",
          power: 9999,
          element: "Light",
          image: "/placeholder.svg?height=100&width=100",
        },
      }

      setPlayers((prevPlayers) => {
        // Check if the user is already in the list
        if (!prevPlayers.some((player) => player.id === "self-test-id")) {
          return [...prevPlayers, myPlayer]
        }
        return prevPlayers
      })

      // Start advertising with a delay to ensure previous operations are completed
      setTimeout(async () => {
        try {
          console.log("Starting advertising with username:", username)
          setDebugInfo((prev) => prev + `\nStarting advertising with username: ${username}`)

          // Make sure we have a valid service ID
          const serviceId = walletAddress.substring(0, 15) // Use first 15 chars of wallet address as service ID
          setDebugInfo((prev) => prev + `\nUsing service ID: ${serviceId}`)

          const advertisePeerId = await NearbyConnections.startAdvertise(username)
          setMyPeerId(advertisePeerId)
          console.log("Started advertising with peerId:", advertisePeerId)
          setDebugInfo((prev) => prev + `\nStarted advertising with peerId: ${advertisePeerId}`)

          // Start discovery after advertising is successful
          setTimeout(async () => {
            try {
              console.log("Starting discovery with wallet address:", walletAddress)
              setDebugInfo((prev) => prev + `\nStarting discovery with wallet address: ${walletAddress}`)

              // Use the same service ID for discovery
              await NearbyConnections.startDiscovery(serviceId)
              console.log("Discovery started successfully")
              setDebugInfo((prev) => prev + `\nDiscovery started successfully`)
            } catch (discoveryError) {
              console.error("Error starting discovery:", discoveryError)
              setDebugInfo((prev) => prev + `\nError starting discovery: ${discoveryError}`)
              // Don't set scanning to false here, as advertising is still running
            }
          }, 1000)
        } catch (advertiseError) {
          console.error("Error starting advertising:", advertiseError)
          setDebugInfo((prev) => prev + `\nError starting advertising: ${advertiseError}`)
          setScanning(false)
          Alert.alert("Error", "Failed to start advertising. Please try again.")
        }
      }, 1000)
    } catch (error) {
      console.error("Error in startScanning:", error)
      setDebugInfo((prev) => prev + `\nError in startScanning: ${error}`)
      setScanning(false)
      Alert.alert("Error", "Failed to start scanning for players")
    }
  }

  const stopScanning = async () => {
    try {
      setDebugInfo((prev) => prev + `\nStopping scanning...`)

      // Stop both advertising and discovery
      try {
        await NearbyConnections.stopAdvertise()
        console.log("Advertising stopped")
        setDebugInfo((prev) => prev + `\nAdvertising stopped`)
      } catch (advertiseError) {
        console.error("Error stopping advertising:", advertiseError)
        setDebugInfo((prev) => prev + `\nError stopping advertising: ${advertiseError}`)
      }

      try {
        await NearbyConnections.stopDiscovery()
        console.log("Discovery stopped")
        setDebugInfo((prev) => prev + `\nDiscovery stopped`)
      } catch (discoveryError) {
        console.error("Error stopping discovery:", discoveryError)
        setDebugInfo((prev) => prev + `\nError stopping discovery: ${discoveryError}`)
      }

      setScanning(false)

      // Remove the self-test user when stopping
      setPlayers((prevPlayers) => prevPlayers.filter((player) => player.id !== "self-test-id"))
    } catch (error) {
      console.error("Error in stopScanning:", error)
      setDebugInfo((prev) => prev + `\nError in stopScanning: ${error}`)
    }
  }

  const handleChallenge = (player: Player) => {
    Alert.alert("Challenge Player", `Do you want to challenge ${player.name}?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Challenge",
        onPress: async () => {
          try {
            // Special case for self-testing
            if (player.id === "self-test-id") {
              console.log("Self-testing notification...")
              setDebugInfo((prev) => prev + `\nSelf-testing notification...`)

              // Directly trigger a notification for testing
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "Battle Challenge",
                  body: `${username} wants to battle with you!`,
                },
                trigger: null, // sends the notification immediately
              })

              // Show test alert
              Alert.alert(
                "Battle Challenge (Test)",
                `${username} wants to battle with you!`,
                [
                  {
                    text: "Decline",
                    style: "cancel",
                  },
                  {
                    text: "Accept",
                    onPress: () => router.push("/battle-arena"),
                  },
                ],
                { cancelable: false },
              )

              return
            }

            // Normal flow for other players
            console.log("Sending challenge to player:", player.id)
            setDebugInfo((prev) => prev + `\nSending challenge to player: ${player.id}`)

            // Make sure we have a valid connection
            if (!player.id) {
              throw new Error("Invalid player ID")
            }

            // Send battle invitation to the player
            await NearbyConnections.requestConnection(player.id)

            // Show a toast or alert that the challenge was sent
            Alert.alert("Challenge Sent", `Challenge sent to ${player.name}. Waiting for response...`)
          } catch (error) {
            console.error("Error sending challenge:", error)
            setDebugInfo((prev) => prev + `\nError sending challenge: ${error}`)
            Alert.alert("Error", `Failed to send challenge invitation: ${error}`)
          }
        },
      },
    ])
  }

  const handleAcceptBattle = async (peerId: string) => {
    try {
      setDebugInfo((prev) => prev + `\nAccepting battle from: ${peerId}`)
      await NearbyConnections.acceptConnection(peerId)
      setConnectedPeerId(peerId)

      // Navigate to battle arena after accepting
      router.push("/battle-arena")
    } catch (error) {
      console.error("Error accepting battle:", error)
      setDebugInfo((prev) => prev + `\nError accepting battle: ${error}`)
      Alert.alert("Error", "Failed to accept battle challenge")
    }
  }

  const handleRejectBattle = async (peerId: string) => {
    try {
      setDebugInfo((prev) => prev + `\nRejecting battle from: ${peerId}`)
      await NearbyConnections.rejectConnection(peerId)
    } catch (error) {
      console.error("Error rejecting battle:", error)
      setDebugInfo((prev) => prev + `\nError rejecting battle: ${error}`)
    }
  }

  const getStatusColor = (status: Player["status"]) => {
    switch (status) {
      case "online":
        return "#4ADE80"
      case "in-game":
        return "#F59E0B"
      case "offline":
        return "#94A3B8"
    }
  }

  if (!permissionsGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Permissions Required</Text>
          <Text style={styles.permissionText}>
            This feature requires Bluetooth and Location permissions to work properly.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              const granted = await checkAndRequestPermissions()
              setPermissionsGranted(granted)
            }}
          >
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Find Players</Text>
      </View>

      {/* Scanning Status */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.scanningCard}>
        <BlurView intensity={40} tint="dark" style={styles.cardContent}>
          <LinearGradient colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
          <Users size={24} color="#7C3AED" />
          <Text style={styles.scanningText}>
            {scanning ? "Scanning for nearby players..." : "Start scanning for players"}
          </Text>
          <TouchableOpacity
            style={[styles.scanButton, scanning && styles.stopButton]}
            onPress={scanning ? stopScanning : startScanning}
          >
            <Text style={styles.scanButtonText}>{scanning ? "Stop Scanning" : "Start Scanning"}</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      {/* Debug Info */}
      {__DEV__ && (
        <ScrollView style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </ScrollView>
      )}

      {/* Players List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {players.map((player, index) => (
          <Animated.View key={player.id} entering={FadeInDown.delay(300 + index * 100)}>
            <BlurView intensity={40} tint="dark" style={styles.playerCard}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]}
                style={StyleSheet.absoluteFill}
              />

              {/* Player Info Section */}
              <View style={styles.playerInfo}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: player.avatar }} style={styles.avatar} />
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(player.status) }]} />
                </View>

                <View style={styles.playerDetails}>
                  <Text style={styles.playerName}>
                    {player.name}
                    {player.id === "self-test-id" && " (You)"}
                  </Text>

                  <View style={styles.statsRow}>
                    <View style={styles.statBadge}>
                      <Crown size={12} color="#FFD700" />
                      <Text style={styles.statText}>Rank #{player.rank}</Text>
                    </View>

                    <View style={styles.statBadge}>
                      <Star size={12} color="#F59E0B" />
                      <Text style={styles.statText}>Level {player.level}</Text>
                    </View>

                    <View style={styles.statBadge}>
                      <Shield size={12} color="#3B82F6" />
                      <Text style={styles.statText}>Win Rate {player.winRate}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Selected Beast Section */}
              {player.selectedBeast && (
                <View style={styles.beastSection}>
                  <View style={styles.beastInfo}>
                    <Image source={{ uri: player.selectedBeast.image }} style={styles.beastImage} />
                    <View style={styles.beastDetails}>
                      <Text style={styles.beastName}>{player.selectedBeast.name}</Text>
                      <Text style={styles.beastElement}>{player.selectedBeast.element} Element</Text>
                      <View style={styles.powerBadge}>
                        <Swords size={12} color="#EF4444" />
                        <Text style={styles.powerText}>{player.selectedBeast.power} Power</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.challengeButton, connectedPeerId === player.id && styles.connectedButton]}
                    onPress={() => handleChallenge(player)}
                    disabled={connectedPeerId === player.id}
                  >
                    <Swords size={20} color="#ffffff" />
                    <Text style={styles.challengeButtonText}>
                      {connectedPeerId === player.id ? "Connected" : "Challenge"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </BlurView>
          </Animated.View>
        ))}

        {players.length === 0 && scanning && (
          <BlurView intensity={40} tint="dark" style={styles.emptyState}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <Users size={32} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.emptyStateText}>Searching for nearby players...</Text>
          </BlurView>
        )}

        {players.length === 0 && !scanning && (
          <BlurView intensity={40} tint="dark" style={styles.emptyState}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <Users size={32} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.emptyStateText}>No players found. Start scanning to discover nearby players.</Text>
          </BlurView>
        )}
      </ScrollView>
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
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  scanningCard: {
    margin: 16,
    marginTop: 0,
  },
  cardContent: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  scanningText: {
    color: "#ffffff",
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  stopButton: {
    backgroundColor: "#EF4444",
  },
  scanButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  playerCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  playerInfo: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#000000",
  },
  playerDetails: {
    flex: 1,
    gap: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  beastSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
  },
  beastInfo: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  beastImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  beastDetails: {
    flex: 1,
    gap: 4,
  },
  beastName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  beastElement: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  powerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  powerText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },
  challengeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    padding: 12,
    borderRadius: 12,
  },
  connectedButton: {
    backgroundColor: "#4ADE80",
  },
  challengeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 16,
  },
  emptyStateText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    textAlign: "center",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  debugContainer: {
    maxHeight: 150,
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  debugTitle: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  debugText: {
    color: "#4ADE80",
    fontFamily: "monospace",
    fontSize: 12,
  },
})

