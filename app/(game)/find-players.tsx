"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Shield, Swords, Crown, Star, Users, X, Check, Plus, Copy, LogIn } from "lucide-react-native"
import { router } from "expo-router"
import * as NearbyConnections from "expo-nearby-connections"
import * as Notifications from "expo-notifications"
import * as SecureStore from "expo-secure-store"
import { PERMISSIONS, RESULTS, checkMultiple, requestMultiple } from "react-native-permissions"
import algosdk from "algosdk"
import { supabase } from "@/lib/supabase"
import { createBattleRoom, joinBattleRoom } from "@/lib/battleRoom"
import { setStringAsync } from "expo-clipboard"
import {
  validateRoomCodeFormat,
  handleInvalidRoomCode,
  handlePermissionDenied,
  handleDatabaseError,
  PermissionType,
  getUserFriendlyErrorMessage,
  AppError,
  ErrorType,
} from "@/lib/errorHandling"

// Declare __DEV__ if it's not already defined (e.g., in a testing environment)
declare const __DEV__: boolean

interface Beast {
  id: number
  name: string
  power: number
  element: string
  image_url: string // Changed from image to image_url
  owner_id: string
}

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
    image_url: string // Changed from image to image_url
  }
}

// Helper function to get the full image URL
const getImageUrl = (imageUrl: string | undefined) => {
  if (!imageUrl) return "/placeholder.svg?height=100&width=100"

  // If it's already a full URL, return it
  if (imageUrl.startsWith("http")) return imageUrl

  // If it's an IPFS hash, construct the full URL
  if (imageUrl.startsWith("Qm") || imageUrl.startsWith("baf")) {
    return `https://gateway.pinata.cloud/ipfs/${imageUrl}`
  }

  // Otherwise return as is
  return imageUrl
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
  // Move the useState hooks inside the component
  const [userBeasts, setUserBeasts] = useState<Beast[]>([])
  const [selectedBeast, setSelectedBeast] = useState<Beast | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [scanning, setScanning] = useState(false)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [myPeerId, setMyPeerId] = useState<string>("")
  const [username, setUsername] = useState<string>("Player")
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [connectedPeerId, setConnectedPeerId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [showBeastSelector, setShowBeastSelector] = useState(false)
  const [hasPermissions, setHasPermissions] = useState(false)
  
  // Room code states
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null)
  const [joinRoomCode, setJoinRoomCode] = useState<string>("")
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isJoiningRoom, setIsJoiningRoom] = useState(false)
  const [createdBattleId, setCreatedBattleId] = useState<string | null>(null)

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

    // Set up notification handler for deep links
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.roomCode && data?.battleId) {
        // Handle battle invitation from notification
        router.push({
          pathname: "/(game)/battle-lobby" as any,
          params: {
            battleId: data.battleId as string,
            roomCode: data.roomCode as string,
          },
        });
      } else if (data?.url) {
        // Handle legacy deep link URL
        const url = data.url as string;
        router.push(url as any);
      }
    })

    return () => {
      if (scanning) {
        stopScanning()
      }
      subscription.remove()
    }
  }, [])

  // Initialize permissions and load username and wallet address
  useEffect(() => {
    const initializePermissions = async () => {
      const granted = await checkAndRequestPermissions()
      setPermissionsGranted(granted)
      setHasPermissions(granted)
      if (granted) {
        loadUserData()
      } else {
        // Use error handling utility for permission denial
        handlePermissionDenied(
          PermissionType.BLUETOOTH,
          () => {
            // On Android, we can open app settings
            if (Platform.OS === 'android') {
              // User can manually open settings
              Alert.alert(
                "Open Settings",
                "Please enable Bluetooth and Location permissions in your device settings.",
                [{ text: "OK" }]
              )
            }
          }
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
            image_url: "/placeholder.svg?height=100&width=100",
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
      console.log("Full invitation data:", data)
      setDebugInfo((prev) => prev + `\nInvitation received: ${JSON.stringify(data)}`)

      try {
        // Parse the invitation payload to extract room code and battle information
        // The payload should be a JSON string with roomCode, battleId, and playerName
        let invitationData: {
          roomCode?: string;
          battleId?: string;
          playerName?: string;
          walletAddress?: string;
        } = {};

        // Try to parse the name field as JSON (new format with room code)
        try {
          invitationData = JSON.parse(data.name);
          console.log("Parsed invitation data from name:", invitationData);
        } catch (parseError) {
          // Fallback: treat name as wallet address (old format)
          console.log("Could not parse name as JSON, using as wallet address");
          invitationData = {
            walletAddress: data.name,
            playerName: data.name,
          };
        }

        const { roomCode, battleId, playerName, walletAddress } = invitationData;

        console.log("Extracted invitation data:", { roomCode, battleId, playerName, walletAddress });
        setDebugInfo((prev) => prev + `\nExtracted: roomCode=${roomCode}, battleId=${battleId}`);

        // Determine the display name
        const displayName = playerName || walletAddress || "Unknown Player";

        // Schedule a local notification to alert the user
        Notifications.scheduleNotificationAsync({
          content: {
            title: "Battle Challenge",
            body: `${displayName} wants to battle with you!${roomCode ? ` Room: ${roomCode}` : ''}`,
            data: {
              roomCode,
              battleId,
              walletAddress,
            },
          },
          trigger: null, // sends the notification immediately
        }).catch((notifError) => {
          console.error("Error scheduling notification:", notifError);
        });

        // Prompt the user to accept or reject the battle
        Alert.alert(
          "Battle Challenge",
          `${displayName} wants to battle with you!${roomCode ? `\n\nRoom Code: ${roomCode}` : ''}`,
          [
            {
              text: "Decline",
              onPress: () => handleRejectBattle(data.peerId),
              style: "cancel",
            },
            {
              text: "Accept",
              onPress: async () => {
                try {
                  console.log("Accepting battle invitation");
                  setDebugInfo((prev) => prev + `\nAccepting battle with room code: ${roomCode}`);

                  // If we have a room code, join the battle room
                  if (roomCode && selectedBeast) {
                    try {
                      const battleRoom = await joinBattleRoom({
                        room_code: roomCode,
                        player2_id: userId,
                        player2_beast_id: selectedBeast.id,
                      });

                      console.log("Successfully joined battle room:", battleRoom.id);
                      
                      // Navigate to battle arena
                      router.push({
                        pathname: "/(game)/battle-arena" as any,
                        params: {
                          battleId: battleRoom.id,
                          beastId: selectedBeast.id.toString(),
                        },
                      });
                    } catch (joinError: any) {
                      console.error("Error joining battle room:", joinError);
                      Alert.alert("Error", joinError.message || "Failed to join battle");
                    }
                  } else if (walletAddress) {
                    // Fallback to old flow if no room code
                    console.log("No room code, using legacy flow");
                    router.push({
                      pathname: "/(game)/confirm",
                      params: { sender: walletAddress },
                    });
                  } else {
                    Alert.alert("Error", "Invalid invitation data. Please try again.");
                  }
                } catch (error) {
                  console.error("Error accepting battle:", error);
                  Alert.alert("Error", "Failed to accept battle invitation");
                }
              },
            },
          ],
          { cancelable: false },
        );
      } catch (error) {
        console.error("Error processing invitation:", error);
        setDebugInfo((prev) => prev + `\nError processing invitation: ${error}`);
        Alert.alert("Error", "Failed to process battle invitation");
      }
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

    // Listen for text messages (used for battle notifications)
    const onTextReceivedListener = NearbyConnections.onTextReceived((data) => {
      console.log("Text message received:", data)
      setDebugInfo((prev) => prev + `\nText received: ${JSON.stringify(data)}`)

      try {
        // Try to parse the message as JSON for battle notifications
        const message = JSON.parse(data.text)

        if (message.type === "opponent_accepting" && message.acceptingPlayerId !== userId) {
          console.log("Opponent is accepting battle!")

          // Show notification that opponent is joining
          Alert.alert(
            "Opponent Joining!",
            message.message || "Your opponent is joining the battle!",
            [
              {
                text: "Get Ready!",
                onPress: () => {
                  // Navigate to battle arena immediately
                  router.push({
                    pathname: "/battle-arena",
                    params: {
                      beastId: selectedBeast?.id.toString(),
                      battleId: message.battleId,
                    },
                  })
                },
              },
            ],
            { cancelable: false },
          )
        }
      } catch (error) {
        // If it's not JSON, treat as regular text message
        console.log("Regular text message:", data.text)
      }
    })

    return () => {
      onPeerFoundListener()
      onPeerLostListener()
      onInvitationListener()
      onConnectedListener()
      onDisconnectedListener()
      onTextReceivedListener()
    }
  }, [permissionsGranted, userId, selectedBeast])

  // Modify the loadUserData function to directly fetch the user ID using wallet address
  const loadUserData = async () => {
    try {
      setIsLoading(true)

      // Load wallet address first
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (mnemonic) {
        const account = algosdk.mnemonicToSecretKey(mnemonic)
        const address = account.addr.toString()
        setWalletAddress(address)
        console.log("Wallet address loaded:", address)
        setDebugInfo((prev) => prev + `\nWallet address loaded: ${address}`)

        // Now fetch user ID directly using wallet address
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("wallet_address", address)
          .single()

        if (userError) {
          console.error("Error fetching user ID:", userError)
          setDebugInfo((prev) => prev + `\nError fetching user ID: ${userError.message}`)
        } else if (userData) {
          console.log("Found user ID:", userData.id)
          setDebugInfo((prev) => prev + `\nFound user ID: ${userData.id}`)

          // Save user ID to SecureStore for future use
          await SecureStore.setItemAsync("userId", userData.id.toString())
          setUserId(userData.id.toString())

          // Now fetch user's beasts with the retrieved ID
          await fetchUserBeasts(userData.id.toString())
        } else {
          console.log("No user found with wallet address:", address)
          setDebugInfo((prev) => prev + `\nNo user found with wallet address: ${address}`)
        }
      } else {
        console.log("No mnemonic found in secure storage")
        setDebugInfo((prev) => prev + `\nNo mnemonic found in secure storage`)

        // Try to load user ID from SecureStore as fallback
        const storedUserId = await SecureStore.getItemAsync("userId")
        if (storedUserId) {
          console.log("Using stored user ID:", storedUserId)
          setDebugInfo((prev) => prev + `\nUsing stored user ID: ${storedUserId}`)
          setUserId(storedUserId)
          await fetchUserBeasts(storedUserId)
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error)
      setDebugInfo((prev) => prev + `\nError loading user data: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Add a new function to fetch user profile if userId is not in SecureStore
  const fetchUserProfile = async () => {
    try {
      console.log("Fetching user profile using wallet address")
      setDebugInfo((prev) => prev + `\nFetching user profile using wallet address`)

      // First try to get the wallet address
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (!mnemonic) {
        console.log("No mnemonic found, cannot fetch user profile")
        setDebugInfo((prev) => prev + `\nNo mnemonic found, cannot fetch user profile`)
        return
      }

      const account = algosdk.mnemonicToSecretKey(mnemonic)
      const address = account.addr.toString()

      // Query the users table to find the user with this wallet address
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", address)
        .single()

      if (userError) {
        console.error("Error fetching user profile:", userError)
        setDebugInfo((prev) => prev + `\nError fetching user profile: ${userError.message}`)
        return
      }

      if (userData) {
        console.log("Found user profile:", userData)
        setDebugInfo((prev) => prev + `\nFound user profile: ${JSON.stringify(userData)}`)

        // Save the user ID to SecureStore for future use
        await SecureStore.setItemAsync("userId", userData.id.toString())

        setUserId(userData.id.toString())

        // Now fetch the beasts for this user
        await fetchUserBeasts(userData.id.toString())
      } else {
        console.log("No user profile found for wallet address:", address)
        setDebugInfo((prev) => prev + `\nNo user profile found for wallet address: ${address}`)
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      setDebugInfo((prev) => prev + `\nError in fetchUserProfile: ${error}`)
    }
  }

  // Replace the fetchUserBeasts function with this implementation:
  const fetchUserBeasts = async (userId: string) => {
    try {
      console.log("Fetching beasts for user:", userId)
      setDebugInfo((prev) => prev + `\nFetching beasts for user: ${userId}`)

      if (!userId) {
        console.log("No user ID provided, cannot fetch beasts")
        setDebugInfo((prev) => prev + `\nNo user ID provided, cannot fetch beasts`)
        return
      }

      // Get beasts owned by user using the correct query
      const { data: beastsData, error: beastsError } = await supabase
        .from("beasts")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })

      if (beastsError) {
        console.error("Error fetching beasts:", beastsError)
        setDebugInfo((prev) => prev + `\nError fetching beasts: ${beastsError.message}`)
        return
      }

      if (beastsData && beastsData.length > 0) {
        console.log(`Found ${beastsData.length} beasts for user`)
        setDebugInfo((prev) => prev + `\nFound ${beastsData.length} beasts for user`)

        // Update state with user's beasts
        setUserBeasts(beastsData)

        // Set the first beast as selected by default
        setSelectedBeast(beastsData[0])
      } else {
        console.log("No beasts found for user")
        setDebugInfo((prev) => prev + `\nNo beasts found for user`)
        setUserBeasts([])
        setSelectedBeast(null)
      }
    } catch (error) {
      console.error("Error fetching user beasts:", error)
      setDebugInfo((prev) => prev + `\nError fetching user beasts: ${error}`)
    }
  }

  // Update the startScanning function to handle the case when no beast is selected
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

    if (!selectedBeast) {
      Alert.alert("Select Beast", "Please select a beast for battle before scanning for players.", [
        {
          text: "OK",
          onPress: () => setShowBeastSelector(true),
        },
      ])
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
          name: selectedBeast.name,
          power: selectedBeast.power,
          element: selectedBeast.element,
          image_url: selectedBeast.image_url,
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
          console.log("Starting advertising with wallet address:", walletAddress)
          setDebugInfo((prev) => prev + `\nStarting advertising with wallet address: ${walletAddress}`)

          // Make sure we have a valid service ID
          const serviceId = walletAddress.substring(0, 15) // Use first 15 chars of wallet address as service ID
          setDebugInfo((prev) => prev + `\nUsing service ID: ${serviceId}`)

          const advertisePeerId = await NearbyConnections.startAdvertise(walletAddress)
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

  // Helper function to send battle notification via NearbyConnections
  const sendBattleNotification = (peerId: string, message: any) => {
    try {
      const messageText = JSON.stringify(message)
      NearbyConnections.sendText(peerId, messageText)
      console.log("Battle notification sent via NearbyConnections:", message)
    } catch (error) {
      console.error("Error sending battle notification via NearbyConnections:", error)
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
            // Validate prerequisites
            if (!selectedBeast) {
              Alert.alert("Error", "Please select a beast before challenging a player")
              return
            }

            if (!userId) {
              Alert.alert("Error", "User ID not found. Please try logging in again.")
              return
            }

            if (!player.id) {
              throw new Error("Invalid player ID")
            }

            console.log("Sending challenge to player:", player.id)
            setDebugInfo((prev) => prev + `\nSending challenge to player: ${player.id}`)

            // Special case for self-testing
            if (player.id === "self-test-id") {
              console.log("Self-testing notification...")
              setDebugInfo((prev) => prev + `\nSelf-testing notification...`)

              // Create a test battle room with room code
              const testBattleRoom = await createBattleRoom({
                player1_id: userId,
                player1_beast_id: selectedBeast.id,
              });

              console.log("Test battle room created:", testBattleRoom.room_code);

              // Directly trigger a notification for testing
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "Battle Challenge",
                  body: `${username} wants to battle with you! Room: ${testBattleRoom.room_code}`,
                  data: {
                    roomCode: testBattleRoom.room_code,
                    battleId: testBattleRoom.id,
                    walletAddress,
                  },
                },
                trigger: null,
              })

              // Show test alert
              Alert.alert(
                "Battle Challenge (Test)",
                `${username} wants to battle with you!\n\nRoom Code: ${testBattleRoom.room_code}`,
                [
                  {
                    text: "Decline",
                    style: "cancel",
                  },
                  {
                    text: "Accept",
                    onPress: () =>
                      router.push({
                        pathname: "/(game)/battle-lobby",
                        params: {
                          battleId: testBattleRoom.id,
                          beastId: selectedBeast.id.toString(),
                        },
                      }),
                  },
                ],
                { cancelable: false },
              )

              return
            }

            // Normal flow: Create battle room with room code
            console.log("Creating battle room with room code...")
            setDebugInfo((prev) => prev + `\nCreating battle room...`)

            const battleRoom = await createBattleRoom({
              player1_id: userId,
              player1_beast_id: selectedBeast.id,
            });

            console.log("Battle room created:", battleRoom.id, "Room code:", battleRoom.room_code)
            setDebugInfo((prev) => prev + `\nBattle created: ${battleRoom.id}, Room: ${battleRoom.room_code}`)

            // Set up real-time listener for when opponent joins
            const battleChannel = supabase.channel(`battle:${battleRoom.id}`)

            battleChannel
              .on(
                "postgres_changes",
                {
                  event: "UPDATE",
                  schema: "public",
                  table: "battles",
                  filter: `id=eq.${battleRoom.id}`,
                },
                (payload) => {
                  console.log("Battle update received:", payload.new)
                  const updatedBattle = payload.new as any

                  if (updatedBattle.status === "active" && updatedBattle.player2_id) {
                    console.log("Opponent joined! Redirecting to battle arena...")

                    // Unsubscribe from this channel
                    battleChannel.unsubscribe()

                    // Show notification and redirect
                    Alert.alert(
                      "Opponent Joined!",
                      "Your opponent has joined the battle. Get ready to fight!",
                      [
                        {
                          text: "Let's Battle!",
                          onPress: () => {
                            router.push({
                              pathname: "/(game)/battle-arena",
                              params: {
                                beastId: selectedBeast.id.toString(),
                                battleId: battleRoom.id,
                              },
                            })
                          },
                        },
                      ],
                      { cancelable: false },
                    )
                  }
                },
              )
              .subscribe()

            // Prepare invitation payload with room code and battle information
            // Note: expo-nearby-connections uses the 'name' parameter to pass data
            // We encode the invitation data as JSON in the name field
            const invitationPayload = JSON.stringify({
              roomCode: battleRoom.room_code,
              battleId: battleRoom.id,
              playerName: username || walletAddress,
              walletAddress: walletAddress,
            });

            console.log("Sending invitation with payload:", invitationPayload)
            setDebugInfo((prev) => prev + `\nSending invitation: ${invitationPayload}`)

            // Send battle invitation via Nearby Connections
            // The invitation payload is sent as the display name, which will be received
            // by the other device in the onInvitationReceived handler
            try {
              // Note: requestConnection takes (peerId) - the payload is sent via the advertise name
              // We need to re-advertise with the invitation data as the name
              await NearbyConnections.stopAdvertise();
              await NearbyConnections.startAdvertise(invitationPayload);
              await NearbyConnections.requestConnection(player.id);
              console.log("Invitation sent successfully")
              setDebugInfo((prev) => prev + `\nInvitation sent successfully`)
            } catch (connectionError) {
              console.error("Error sending nearby connection invitation:", connectionError)
              setDebugInfo((prev) => prev + `\nConnection error: ${connectionError}`)
              throw new Error("Failed to send invitation via Nearby Connections")
            }

            // Show success message and redirect to battle lobby
            Alert.alert(
              "Challenge Sent",
              `Challenge sent to ${player.name}.\n\nRoom Code: ${battleRoom.room_code}\n\nWaiting for opponent...`,
              [
                {
                  text: "OK",
                  onPress: () => {
                    router.push({
                      pathname: "/(game)/battle-lobby",
                      params: {
                        battleId: battleRoom.id,
                        opponentName: player.name,
                        beastId: selectedBeast.id.toString(),
                        roomCode: battleRoom.room_code || undefined,
                      },
                    })
                  },
                },
              ]
            )

            // Auto redirect after 2 seconds if user doesn't press OK
            setTimeout(() => {
              router.push({
                pathname: "/(game)/battle-lobby",
                params: {
                  battleId: battleRoom.id,
                  opponentName: player.name,
                  beastId: selectedBeast.id.toString(),
                  roomCode: battleRoom.room_code || undefined,
                },
              })
            }, 2000)
          } catch (error: any) {
            console.error("Error sending challenge:", error)
            setDebugInfo((prev) => prev + `\nError sending challenge: ${error}`)
            
            // Provide specific error messages based on error type
            let errorMessage = "Failed to send challenge invitation";
            if (error.message) {
              errorMessage = error.message;
            }
            
            Alert.alert("Error", errorMessage)
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
      console.log("Player has accepted")

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

  const handleSelectBeast = (beast: Beast) => {
    setSelectedBeast(beast)
    setShowBeastSelector(false)
    console.log("Selected beast:", beast.name)
    setDebugInfo((prev) => prev + `\nSelected beast: ${beast.name}`)
  }

  const handleCreateBeast = () => {
    setShowBeastSelector(false)
    router.push("/beast-creation")
  }

  // Handle creating a battle room
  const handleCreateBattleRoom = async () => {
    if (!selectedBeast) {
      Alert.alert("Select Beast", "Please select a beast before creating a battle room.")
      return
    }

    if (!userId) {
      Alert.alert("Error", "User ID not found. Please try logging in again.")
      return
    }

    try {
      setIsCreatingRoom(true)
      
      const battleRoom = await createBattleRoom({
        player1_id: userId,
        player1_beast_id: selectedBeast.id,
      })

      setCreatedRoomCode(battleRoom.room_code)
      setCreatedBattleId(battleRoom.id)
      
      Alert.alert(
        "Battle Room Created!",
        `Your room code is: ${battleRoom.room_code}\n\nShare this code with your opponent to start the battle.`,
        [{ text: "OK" }]
      )

      // Set up real-time listener for when opponent joins
      const battleChannel = supabase.channel(`battle:${battleRoom.id}`)
      
      battleChannel
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "battles",
            filter: `id=eq.${battleRoom.id}`,
          },
          (payload) => {
            const updatedBattle = payload.new as any
            
            if (updatedBattle.status === "active" && updatedBattle.player2_id) {
              battleChannel.unsubscribe()
              
              Alert.alert(
                "Opponent Joined!",
                "Your opponent has joined the battle. Get ready!",
                [
                  {
                    text: "Start Battle",
                    onPress: () => {
                      router.push({
                        pathname: "/(game)/battle-arena",
                        params: {
                          battleId: battleRoom.id,
                          beastId: selectedBeast.id.toString(),
                        },
                      })
                    },
                  },
                ],
                { cancelable: false }
              )
            }
          }
        )
        .subscribe()
    } catch (error: any) {
      console.error("Error creating battle room:", error)
      
      // Use error handling utilities
      if (error instanceof AppError) {
        if (error.type === ErrorType.NETWORK) {
          handleDatabaseError(error, 'creating battle room', handleCreateBattleRoom)
        } else if (error.type === ErrorType.VALIDATION) {
          Alert.alert("Validation Error", error.message)
        } else {
          Alert.alert("Error", getUserFriendlyErrorMessage(error))
        }
      } else {
        Alert.alert("Error", getUserFriendlyErrorMessage(error))
      }
    } finally {
      setIsCreatingRoom(false)
    }
  }

  // Handle joining a battle room
  const handleJoinBattleRoom = async () => {
    if (!selectedBeast) {
      Alert.alert("Select Beast", "Please select a beast before joining a battle room.")
      return
    }

    if (!userId) {
      Alert.alert("Error", "User ID not found. Please try logging in again.")
      return
    }

    // Validate room code format first
    const formatValidation = validateRoomCodeFormat(joinRoomCode)
    if (!formatValidation.isValid) {
      Alert.alert("Invalid Code", formatValidation.error || "Please enter a valid room code.")
      return
    }

    try {
      setIsJoiningRoom(true)
      
      const battleRoom = await joinBattleRoom({
        room_code: joinRoomCode.toUpperCase(),
        player2_id: userId,
        player2_beast_id: selectedBeast.id,
      })

      // Clear the input on success
      setJoinRoomCode("")

      Alert.alert(
        "Joined Battle!",
        "You've successfully joined the battle. Get ready!",
        [
          {
            text: "Start Battle",
            onPress: () => {
              router.push({
                pathname: "/(game)/battle-arena",
                params: {
                  battleId: battleRoom.id,
                  beastId: selectedBeast.id.toString(),
                },
              })
            },
          },
        ],
        { cancelable: false }
      )
    } catch (error: any) {
      console.error("Error joining battle room:", error)
      
      // Use error handling utilities
      if (error instanceof AppError) {
        if (error.type === ErrorType.VALIDATION) {
          // Handle invalid room code with retry option
          handleInvalidRoomCode(joinRoomCode, () => {
            setJoinRoomCode("")
          })
        } else if (error.type === ErrorType.NETWORK) {
          handleDatabaseError(error, 'joining battle room', handleJoinBattleRoom)
        } else {
          Alert.alert("Error", getUserFriendlyErrorMessage(error))
        }
      } else {
        Alert.alert("Error", getUserFriendlyErrorMessage(error))
      }
    } finally {
      setIsJoiningRoom(false)
    }
  }

  // Handle copying room code to clipboard
  const handleCopyRoomCode = async () => {
    if (createdRoomCode) {
      await setStringAsync(createdRoomCode)
      Alert.alert("Copied!", "Room code copied to clipboard")
    }
  }

  const renderBeastItem = ({ item }: { item: Beast }) => (
    <TouchableOpacity
      style={[styles.beastSelectorItem, selectedBeast?.id === item.id && styles.selectedBeastItem]}
      onPress={() => handleSelectBeast(item)}
    >
      <Image
        source={{ uri: getImageUrl(item.image_url) }}
        style={styles.beastSelectorImage}
        onError={(e) => console.log("Error loading beast image:", e.nativeEvent.error)}
      />
      <View style={styles.beastSelectorInfo}>
        <Text style={styles.beastSelectorName}>{item.name || "Unknown Beast"}</Text>
        <Text style={styles.beastSelectorElement}>{item.element || "Unknown"} Element</Text>
        <View style={styles.powerBadge}>
          <Swords size={12} color="#EF4444" />
          <Text style={styles.powerText}>{item.power || 0} Power</Text>
        </View>
      </View>
      {selectedBeast?.id === item.id && (
        <View style={styles.selectedCheckmark}>
          <Check size={16} color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  )

  // Always render the same component structure to avoid hook order issues
  return (
    <SafeAreaView style={styles.container}>
      {!hasPermissions ? (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Permissions Required</Text>
          <Text style={styles.permissionText}>
            This feature requires Bluetooth and Location permissions to work properly.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              const granted = await checkAndRequestPermissions()
              setHasPermissions(granted)
            }}
          >
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.title}>Find Players</Text>
          </View>

          {/* Selected Beast Banner */}
          <TouchableOpacity style={styles.selectedBeastBanner} onPress={() => setShowBeastSelector(true)}>
            <BlurView intensity={40} tint="dark" style={styles.selectedBeastContent}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]}
                style={StyleSheet.absoluteFill}
              />
              {selectedBeast ? (
                <View style={styles.selectedBeastInfo}>
                  <Image
                    source={{ uri: getImageUrl(selectedBeast.image_url) }}
                    style={styles.selectedBeastImage}
                    onError={(e) => console.log("Error loading selected beast image:", e.nativeEvent.error)}
                  />
                  <View style={styles.selectedBeastDetails}>
                    <Text style={styles.selectedBeastName}>{selectedBeast.name || "Unknown Beast"}</Text>
                    <View style={styles.selectedBeastStats}>
                      <View style={styles.statBadge}>
                        <Swords size={12} color="#EF4444" />
                        <Text style={styles.statText}>{selectedBeast.power || 0} Power</Text>
                      </View>
                      <View style={styles.statBadge}>
                        <Shield size={12} color="#3B82F6" />
                        <Text style={styles.statText}>{selectedBeast.element || "Unknown"}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <Text style={styles.noBeastText}>Select a Beast for Battle</Text>
              )}
              <TouchableOpacity style={styles.changeBeastButton} onPress={() => setShowBeastSelector(true)}>
                <Text style={styles.changeBeastText}>Change</Text>
              </TouchableOpacity>
            </BlurView>
          </TouchableOpacity>

          {/* Create Battle Room Section */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.roomCard}>
            <BlurView intensity={40} tint="dark" style={styles.cardContent}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.roomHeader}>
                <Swords size={24} color="#7C3AED" />
                <Text style={styles.roomTitle}>Create Battle Room</Text>
              </View>
              
              {createdRoomCode ? (
                <View style={styles.roomCodeDisplay}>
                  <Text style={styles.roomCodeLabel}>Your Room Code:</Text>
                  <View style={styles.roomCodeContainer}>
                    <Text style={styles.roomCodeText}>{createdRoomCode}</Text>
                    <TouchableOpacity onPress={handleCopyRoomCode} style={styles.copyButton}>
                      <Copy size={20} color="#7C3AED" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.roomCodeHint}>Share this code with your opponent</Text>
                  <View style={styles.waitingIndicatorContainer}>
                    <ActivityIndicator size="small" color="#7C3AED" />
                    <Text style={styles.waitingText}>Waiting for opponent to join...</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.createRoomButton,
                    (!selectedBeast || isCreatingRoom) && styles.createRoomButtonDisabled
                  ]}
                  onPress={handleCreateBattleRoom}
                  disabled={isCreatingRoom || !selectedBeast}
                >
                  {isCreatingRoom ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Plus size={20} color="#ffffff" />
                      <Text style={styles.createRoomButtonText}>
                        {!selectedBeast ? "Select a Beast First" : "Create Room"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </BlurView>
          </Animated.View>

          {/* Join Battle Room Section */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.roomCard}>
            <BlurView intensity={40} tint="dark" style={styles.cardContent}>
              <LinearGradient
                colors={["rgba(59, 130, 246, 0.2)", "rgba(0, 0, 0, 0)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.roomHeader}>
                <LogIn size={24} color="#3B82F6" />
                <Text style={styles.roomTitle}>Join Battle Room</Text>
              </View>
              
              <View style={styles.joinRoomContainer}>
                <TextInput
                  style={styles.roomCodeInput}
                  placeholder="Enter 6-character code"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={joinRoomCode}
                  onChangeText={(text) => setJoinRoomCode(text.toUpperCase())}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.joinRoomButton, (!joinRoomCode || joinRoomCode.length !== 6) && styles.joinRoomButtonDisabled]}
                  onPress={handleJoinBattleRoom}
                  disabled={isJoiningRoom || !selectedBeast || !joinRoomCode || joinRoomCode.length !== 6}
                >
                  {isJoiningRoom ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.joinRoomButtonText}>Join</Text>
                  )}
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>

          {/* Scanning Status */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.scanningCard}>
            <BlurView intensity={40} tint="dark" style={styles.cardContent}>
              <LinearGradient
                colors={["rgba(34, 197, 94, 0.2)", "rgba(0, 0, 0, 0)"]}
                style={StyleSheet.absoluteFill}
              />
              <Users size={24} color="#22C55E" />
              <Text style={styles.scanningText}>
                {scanning ? "Scanning for nearby players..." : "Or discover nearby players"}
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
                        <Image
                          source={{ uri: getImageUrl(player.selectedBeast.image_url) }}
                          style={styles.beastImage}
                          onError={(e) => console.log("Error loading player beast image:", e.nativeEvent.error)}
                        />
                        <View style={styles.beastDetails}>
                          <Text style={styles.beastName}>{player.selectedBeast.name || "Unknown Beast"}</Text>
                          <Text style={styles.beastElement}>{player.selectedBeast.element || "Unknown"} Element</Text>
                          <View style={styles.powerBadge}>
                            <Swords size={12} color="#EF4444" />
                            <Text style={styles.powerText}>{player.selectedBeast.power || 0} Power</Text>
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
                <LinearGradient
                  colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]}
                  style={StyleSheet.absoluteFill}
                />
                <Users size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyStateTitle}>Searching for nearby players...</Text>
                <Text style={styles.emptyStateSubtext}>Make sure Bluetooth is enabled</Text>
              </BlurView>
            )}

            {players.length === 0 && !scanning && (
              <BlurView intensity={40} tint="dark" style={styles.emptyState}>
                <LinearGradient
                  colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]}
                  style={StyleSheet.absoluteFill}
                />
                <Users size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyStateTitle}>No nearby players found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try creating a room code or start scanning for nearby players
                </Text>
              </BlurView>
            )}
          </ScrollView>
        </>
      )}

      {/* Beast Selector Modal */}
      <Modal
        visible={showBeastSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBeastSelector(false)}
      >
        <BlurView intensity={80} tint="dark" style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Beast</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowBeastSelector(false)}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Update the beast selector modal to handle empty beasts array better */}
            {userBeasts.length > 0 ? (
              <>
                <FlatList
                  data={userBeasts}
                  renderItem={renderBeastItem}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={styles.beastList}
                />
                <TouchableOpacity style={styles.createNewBeastButton} onPress={handleCreateBeast}>
                  <Plus size={20} color="#ffffff" />
                  <Text style={styles.createNewBeastText}>Create New Beast</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noBeasts}>
                <Text style={styles.noBeastsText}>You don't have any beasts yet. Create one to start battling!</Text>
                <TouchableOpacity
                  style={styles.createBeastButton}
                  onPress={() => {
                    setShowBeastSelector(false)
                    router.push("/beast-creation")
                  }}
                >
                  <Text style={styles.createBeastText}>Create a Beast</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </BlurView>
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
  selectedBeastBanner: {
    margin: 16,
    marginBottom: 8,
  },
  selectedBeastContent: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedBeastInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedBeastImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  selectedBeastDetails: {
    flex: 1,
  },
  selectedBeastName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  selectedBeastStats: {
    flexDirection: "row",
    gap: 8,
  },
  noBeastText: {
    color: "#ffffff",
    fontSize: 16,
    opacity: 0.7,
  },
  changeBeastButton: {
    backgroundColor: "rgba(124, 58, 237, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeBeastText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  roomCard: {
    margin: 16,
    marginTop: 8,
  },
  scanningCard: {
    margin: 16,
    marginTop: 8,
  },
  cardContent: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  roomTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  roomCodeDisplay: {
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  roomCodeLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  roomCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7C3AED",
    gap: 12,
  },
  roomCodeText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  copyButton: {
    padding: 8,
  },
  roomCodeHint: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    textAlign: "center",
  },
  waitingIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  waitingText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
  },
  createRoomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    minWidth: 200,
  },
  createRoomButtonDisabled: {
    backgroundColor: "rgba(124, 58, 237, 0.3)",
    opacity: 0.6,
  },
  createRoomButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  joinRoomContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  roomCodeInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 2,
    textAlign: "center",
  },
  joinRoomButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  joinRoomButtonDisabled: {
    backgroundColor: "rgba(59, 130, 246, 0.3)",
  },
  joinRoomButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  scanningText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  },
  scanButton: {
    backgroundColor: "#22C55E",
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
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  emptyStateTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  emptyStateSubtext: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
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
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "rgba(18, 18, 18, 0.95)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    height: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  beastList: {
    padding: 16,
    gap: 12,
  },
  beastSelectorItem: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  selectedBeastItem: {
    borderColor: "#7C3AED",
    backgroundColor: "rgba(124, 58, 237, 0.1)",
  },
  beastSelectorImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  beastSelectorInfo: {
    flex: 1,
  },
  beastSelectorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  beastSelectorElement: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 8,
  },
  selectedCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  noBeasts: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  noBeastsText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 24,
    textAlign: "center",
  },
  createBeastButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBeastText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  createNewBeastButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  createNewBeastText: {
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
    color: "#ffffff",
    fontSize: 18,
  },
})
