"use client"

import { useEffect, useState } from "react"
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, TextInput, Alert, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import { BlurView } from "expo-blur"
import { Search, Users, UserPlus, MessageCircle, Wifi, WifiOff } from "lucide-react-native"
import * as SecureStore from "expo-secure-store"
import algosdk from "algosdk"
import * as NearbyConnections from "expo-nearby-connections"
import {
  PERMISSIONS,
  RESULTS,
  checkMultiple,
  requestMultiple,
} from "react-native-permissions"

interface NearbyUser {
  peerId: string
  name: string
  university?: string
  distance?: string
  connected?: boolean
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

export default function ConnectScreen() {
  const [advertising, setAdvertising] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [myPeerId, setMyPeerId] = useState<string>("")
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [permissionsGranted, setPermissionsGranted] = useState(false)

  useEffect(() => {
    const initializePermissions = async () => {
      const granted = await checkAndRequestPermissions()
      setPermissionsGranted(granted)
      if (granted) {
        loadWalletAddress()
      } else {
        Alert.alert(
          "Permissions Required",
          "This feature requires Bluetooth and Location permissions to work properly.",
        )
      }
    }

    initializePermissions()

    return () => {
      if (advertising) {
        handleStopAdvertising()
      }
    }
  }, [])

  useEffect(() => {
    if (!permissionsGranted) return

    // Listen for discovered peers
    const onPeerFoundListener = NearbyConnections.onPeerFound((data) => {
      console.log("Peer found:", data)
      setNearbyUsers((prev) => {
        if (prev.some((user) => user.peerId === data.peerId)) return prev
        return [
          ...prev,
          {
            peerId: data.peerId,
            name: data.name,
            university: "Nearby User",
            distance: "Just found",
          },
        ]
      })
    })

    const onPeerLostListener = NearbyConnections.onPeerLost((data) => {
      console.log("Peer lost:", data)
      setNearbyUsers((prev) => prev.filter((user) => user.peerId !== data.peerId))
    })

    // Listen for connection requests
    const onInvitationListener = NearbyConnections.onInvitationReceived((data) => {
      Alert.alert(
        "Connection Request",
        `${data.name} wants to connect with you`,
        [
          {
            text: "Accept",
            onPress: () => handleAcceptConnection(data.peerId),
          },
          {
            text: "Reject",
            onPress: () => handleRejectConnection(data.peerId),
            style: "cancel",
          },
        ],
      )
    })

    // Listen for connection state changes
    const onConnectedListener = NearbyConnections.onConnected((data) => {
      console.log("Connected to:", data)
      setNearbyUsers((prev) =>
        prev.map((user) =>
          user.peerId === data.peerId ? { ...user, connected: true } : user,
        ),
      )
    })

    const onDisconnectedListener = NearbyConnections.onDisconnected((data) => {
      console.log("Disconnected from:", data)
      setNearbyUsers((prev) =>
        prev.map((user) =>
          user.peerId === data.peerId ? { ...user, connected: false } : user,
        ),
      )
    })

    return () => {
      onPeerFoundListener()
      onPeerLostListener()
      onInvitationListener()
      onConnectedListener()
      onDisconnectedListener()
    }
  }, [permissionsGranted])

  const loadWalletAddress = async () => {
    try {
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (mnemonic) {
        const account = algosdk.mnemonicToSecretKey(mnemonic)
        const address = account.addr.toString()
        setWalletAddress(address)
        console.log(mnemonic)
      }
    } catch (error) {
      console.error("Error loading wallet address:", error)
    }
  }

  const handleStartAdvertising = async () => {
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
      Alert.alert("Error", "Wallet address not found")
      return
    }

    try {
      // First stop any existing advertising/discovery
      await handleStopAdvertising()

      // Start advertising with a short delay
      setTimeout(async () => {
        try {
          const peerId = await NearbyConnections.startAdvertise(walletAddress)
          setMyPeerId(peerId)
          console.log("Started advertising with peerId:", peerId)

          // Start discovery after successful advertising
          const discoveryPeerId = await NearbyConnections.startDiscovery(walletAddress)
          console.log("Started discovery with peerId:", discoveryPeerId)
          
          setAdvertising(true)
        } catch (error) {
          console.error("Error in delayed start:", error)
          Alert.alert("Error", "Failed to start nearby connections. Please try again.")
        }
      }, 1000)
    } catch (error) {
      console.error("Error starting nearby connections:", error)
      Alert.alert(
        "Connection Error",
        "Failed to start nearby connections. Please check your device settings and try again.",
      )
    }
  }

  const handleStopAdvertising = async () => {
    try {
      await NearbyConnections.stopAdvertise()
      await NearbyConnections.stopDiscovery()
      setAdvertising(false)
      setNearbyUsers([])
    } catch (error) {
      console.error("Error stopping nearby connections:", error)
    }
  }

  const handleRequestConnection = async (peerId: string) => {
    try {
      await NearbyConnections.requestConnection(peerId)
    } catch (error) {
      console.error("Error requesting connection:", error)
      Alert.alert("Error", "Failed to request connection")
    }
  }

  const handleAcceptConnection = async (peerId: string) => {
    try {
      await NearbyConnections.acceptConnection(peerId)
    } catch (error) {
      console.error("Error accepting connection:", error)
      Alert.alert("Error", "Failed to accept connection")
    }
  }

  const handleRejectConnection = async (peerId: string) => {
    try {
      await NearbyConnections.rejectConnection(peerId)
    } catch (error) {
      console.error("Error rejecting connection:", error)
    }
  }

  const handleDisconnect = async (peerId: string) => {
    try {
      await NearbyConnections.disconnect(peerId)
    } catch (error) {
      console.error("Error disconnecting:", error)
    }
  }

  const filteredUsers = nearbyUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Advertising Control */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <Text style={styles.title}>Connect</Text>
          <TouchableOpacity
            style={[styles.advertiseButton, advertising && styles.advertisingButton]}
            onPress={advertising ? handleStopAdvertising : handleStartAdvertising}
          >
            {advertising ? <WifiOff size={20} color="#ffffff" /> : <Wifi size={20} color="#ffffff" />}
            <Text style={styles.advertiseButtonText}>
              {advertising ? "Stop Advertising" : "Start Advertising"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.searchContainer}>
          <BlurView intensity={40} tint="dark" style={styles.searchBar}>
            <Search size={20} color="rgba(255, 255, 255, 0.6)" />
            <TextInput
              placeholder="Search nearby students..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </BlurView>
        </Animated.View>

        {/* Nearby Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#ffffff" />
            <Text style={styles.sectionTitle}>Nearby Students</Text>
          </View>
          <View style={styles.usersList}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <Animated.View key={user.peerId} entering={FadeIn.delay(400 + index * 200)}>
                  <BlurView intensity={40} tint="dark" style={styles.userCard}>
                    <Image
                      source={{
                        uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7BC5DA1ABA-D239-47BF-86A4-7F62F953B61C%7D-oDh5OOGSt6RLj6h8lnARTFRGEVF7dC.png",
                      }}
                      style={styles.userAvatar}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userUniversity}>{user.university}</Text>
                      <Text style={styles.userDistance}>{user.distance}</Text>
                    </View>
                    <View style={styles.userActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, user.connected && styles.actionButtonConnected]}
                        onPress={() =>
                          user.connected
                            ? handleDisconnect(user.peerId)
                            : handleRequestConnection(user.peerId)
                        }
                      >
                        <UserPlus size={20} color="#ffffff" />
                      </TouchableOpacity>
                      {user.connected && (
                        <TouchableOpacity style={styles.actionButton}>
                          <MessageCircle size={20} color="#ffffff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </BlurView>
                </Animated.View>
              ))
            ) : (
              <BlurView intensity={40} tint="dark" style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {advertising
                    ? "Searching for nearby students..."
                    : "Start advertising to discover nearby students"}
                </Text>
              </BlurView>
            )}
          </View>
        </View>
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
    padding: 16,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  advertiseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  advertiseButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  advertisingButton: {
    backgroundColor: "#EF4444",
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    padding: 0,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  userUniversity: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  userDistance: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 4,
  },
  userActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  actionButtonConnected: {
    backgroundColor: "#7C3AED",
  },
  emptyState: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
})