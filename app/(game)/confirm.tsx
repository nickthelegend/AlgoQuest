"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeIn, FadeInDown, SlideInUp } from "react-native-reanimated"
import {
  ArrowLeft,
  Swords,
  Check,
  Trophy,
  X,
  Flame,
  Wind,
  Cloud,
  Mountain,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { supabase } from "@/lib/supabase"
import algosdk from "algosdk"
import { createElement } from "react"
import { __DEV__ } from "react-native"

const { width: screenWidth } = Dimensions.get("window")

interface Beast {
  id: number
  name: string
  power: number
  element: string
  image_url: string
  owner_id: string
}

export default function ConfirmBattleScreen() {
  const { sender } = useLocalSearchParams()
  const [userBeasts, setUserBeasts] = useState<Beast[]>([])
  const [selectedBeast, setSelectedBeast] = useState<Beast | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [senderName, setSenderName] = useState<string>("Unknown Player")
  const [senderBeast, setSenderBeast] = useState<any>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [senderFullWallet, setSenderFullWallet] = useState<string>("")

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      try {
        // Decode the sender parameter if it's URL encoded
        let decodedSender = null

        if (sender) {
          try {
            decodedSender = decodeURIComponent(sender as string)
          } catch (decodeError) {
            console.error("Error decoding sender:", decodeError)
            decodedSender = sender as string
          }
        }

        console.log("=== CONFIRM SCREEN INITIALIZATION ===")
        console.log("Raw sender param:", sender)
        console.log("Sender type:", typeof sender)
        console.log("Sender length:", sender ? (sender as string).length : 0)
        console.log("Decoded sender:", decodedSender)
        console.log("Decoded sender length:", decodedSender ? decodedSender.length : 0)
        console.log("=====================================")

        // Load wallet address
        await loadWalletAddress()

        // Fetch user beasts
        await fetchUserBeasts()

        // Fetch sender info if we have a sender wallet address
        if (decodedSender) {
          await fetchSenderInfo(decodedSender)
        } else {
          console.error("No sender parameter found!")
          Alert.alert("Error", "No sender information found. Please try again.")
        }
      } catch (error) {
        console.error("Error initializing confirm screen:", error)
        Alert.alert("Error", "Failed to load battle information")
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [sender])

  const loadWalletAddress = async () => {
    try {
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (mnemonic) {
        const account = algosdk.mnemonicToSecretKey(mnemonic)
        const address = account.addr.toString()
        setWalletAddress(address)
        console.log("Wallet address loaded:", address)
      } else {
        console.log("No mnemonic found in secure storage")
      }
    } catch (error) {
      console.error("Error loading wallet address:", error)
    }
  }

  const fetchUserBeasts = async () => {
    try {
      // Get user ID from secure storage
      const userId = await SecureStore.getItemAsync("userId")
      if (!userId) {
        console.log("No user ID found")
        return
      }

      console.log("Fetching beasts for user ID:", userId)

      // Get beasts owned by user
      const { data: beastsData, error: beastsError } = await supabase
        .from("beasts")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })

      if (beastsError) {
        console.error("Error fetching beasts:", beastsError)
        return
      }

      if (beastsData && beastsData.length > 0) {
        console.log(`Found ${beastsData.length} beasts for user`)
        setUserBeasts(beastsData)
        setSelectedBeast(beastsData[0]) // Select first beast by default
      } else {
        console.log("No beasts found for user")
        setUserBeasts([])
      }
    } catch (error) {
      console.error("Error fetching user beasts:", error)
    }
  }

  const fetchSenderInfo = async (senderWalletAddress: string) => {
    try {
      console.log("Fetching sender info for wallet:", senderWalletAddress)
      console.log("Wallet address length:", senderWalletAddress.length)
      console.log("Wallet address type:", typeof senderWalletAddress)

      if (!senderWalletAddress || senderWalletAddress.length < 5) {
        console.error("Invalid wallet address provided:", senderWalletAddress)
        setSenderName("Unknown Player")
        return
      }

      // First, let's check if there are any users in the database
      const { data: allUsers, error: allUsersError } = await supabase
        .from("users")
        .select("id, wallet_address")
        .limit(5)

      console.log("Sample users in database:", allUsers)
      console.log("All users query error:", allUsersError)

      let userData = null
      let userError = null

      // If the wallet address is short (truncated), use partial matching
      if (senderWalletAddress.length < 20) {
        console.log("Using partial matching for short wallet address")

        // Try to find wallet that starts with the provided characters
        const { data: partialMatches, error: partialError } = await supabase
          .from("users")
          .select("id, wallet_address")
          .ilike("wallet_address", `${senderWalletAddress}%`)

        console.log("Partial match results:", partialMatches)
        console.log("Partial match error:", partialError)

        if (partialMatches && partialMatches.length > 0) {
          userData = partialMatches[0] // Take the first match
          console.log("Found partial match:", userData)
          setSenderFullWallet(userData.wallet_address) // Store the full wallet address
        } else {
          userError = { message: "No partial matches found" }
        }
      } else {
        // Full wallet address - use exact match
        console.log("Using exact matching for full wallet address")
        const result = await supabase
          .from("users")
          .select("id, wallet_address")
          .eq("wallet_address", senderWalletAddress)
          .single()

        userData = result.data
        userError = result.error

        if (userData) {
          setSenderFullWallet(userData.wallet_address)
        }
      }

      console.log("Final user query result:", { userData, userError })

      if (userError || !userData) {
        console.error("Error fetching sender info:", userError)
        setSenderName("Unknown Player")
        return
      }

      if (userData) {
        console.log("Found sender user data:", userData)

        // Truncate wallet address for display
        const truncatedAddress = userData.wallet_address
          ? `${userData.wallet_address.slice(0, 6)}...${userData.wallet_address.slice(-4)}`
          : "Unknown Player"
        setSenderName(truncatedAddress)

        // Fetch sender's selected beast
        const { data: beastData, error: beastError } = await supabase
          .from("beasts")
          .select("*")
          .eq("owner_id", userData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (beastError) {
          console.error("Error fetching sender beast:", beastError)
        } else if (beastData) {
          console.log("Found sender beast:", beastData)
          setSenderBeast(beastData)
        }
      }
    } catch (error) {
      console.error("Error fetching sender info:", error)
    }
  }

  const handleSelectBeast = (beast: Beast) => {
    setSelectedBeast(beast)
  }

  const handleAccept = async () => {
    if (!selectedBeast) {
      Alert.alert("Select Beast", "Please select a beast for battle")
      return
    }

    // Use the full wallet address if we found it, otherwise use the original
    const fullSenderWallet = senderFullWallet || (sender ? decodeURIComponent(sender as string) : null)

    if (!fullSenderWallet) {
      console.error("No sender wallet address available")
      Alert.alert("Error", "Missing sender information. Please try again.")
      return
    }

    console.log("Starting battle acceptance process...")
    console.log("Full sender wallet:", fullSenderWallet, "Selected Beast:", selectedBeast.id)
    setIsAccepting(true)

    try {
      // Store selected beast ID in secure storage for battle arena
      await SecureStore.setItemAsync("selectedBeastId", selectedBeast.id.toString())

      // Get current user ID to send notification
      const userId = await SecureStore.getItemAsync("userId")

      if (!userId) {
        console.error("No user ID found")
        Alert.alert("Error", "User ID not found. Please try logging in again.")
        setIsAccepting(false)
        return
      }

      console.log("Current user ID:", userId, "Full sender wallet:", fullSenderWallet)

      // Send notification to the battle creator that we're joining
      if (fullSenderWallet && userId) {
        try {
          // First, get the sender's user ID from their wallet address
          console.log("Looking up sender user ID for full wallet:", fullSenderWallet)

          const { data: senderUserData, error: senderError } = await supabase
            .from("users")
            .select("id")
            .eq("wallet_address", fullSenderWallet)
            .single()

          if (senderError || !senderUserData) {
            console.error("Error fetching sender user ID:", senderError)
            Alert.alert("Error", "Could not find the battle creator")
            setIsAccepting(false)
            return
          }

          console.log("Found sender user ID:", senderUserData.id)

          // Now find the battle created by the sender (using their user ID)
          console.log("Looking for battles created by sender user ID:", senderUserData.id)

          const { data: battles, error: findError } = await supabase
            .from("battles")
            .select("*")
            .eq("player1_id", senderUserData.id)
            .eq("status", "waiting")
            .order("created_at", { ascending: false })
            .limit(1)

          console.log("Battle search result:", { battles, findError })

          if (findError) {
            console.error("Error finding battle:", findError)
            Alert.alert("Error", `Database error: ${findError.message}`)
            setIsAccepting(false)
            return
          }

          if (!battles || battles.length === 0) {
            console.error("No waiting battles found for sender")
            Alert.alert("Error", "No active battle found. The battle may have expired or been cancelled.")
            setIsAccepting(false)
            return
          }

          const battle = battles[0]
          const battleId = battle.id

          console.log("Found battle:", battleId, "updating with player2:", userId)

          // Update the battle to add player 2 and set status to active
          const { data: updatedBattle, error: updateError } = await supabase
            .from("battles")
            .update({
              player2_id: userId,
              player2_beast_id: selectedBeast.id.toString(),
              status: "active",
            })
            .eq("id", battleId)
            .select()
            .single()

          console.log("Battle update result:", { updatedBattle, updateError })

          if (updateError) {
            console.error("Error updating battle:", updateError)
            Alert.alert("Error", `Failed to join the battle: ${updateError.message}`)
            setIsAccepting(false)
            return
          }

          console.log("Battle updated successfully, opponent joined")

          // Send real-time notification via Supabase channel
          try {
            const channel = supabase.channel(`battle:${battleId}`)

            // Send a broadcast message to notify the battle creator
            const broadcastResult = await channel.send({
              type: "broadcast",
              event: "opponent_joined",
              payload: {
                message: `${truncateWalletAddress(walletAddress)} has joined the battle!`,
                acceptingPlayerId: userId,
                battleId: battleId,
                timestamp: Date.now(),
              },
            })

            console.log("Broadcast result:", broadcastResult)
            console.log("Sent acceptance notification to battle creator")
          } catch (broadcastError) {
            console.error("Error sending broadcast:", broadcastError)
            // Don't fail the whole process if broadcast fails
          }

          // Navigate to battle arena with opponent information
          console.log("Navigating to battle arena...")

          // Small delay to ensure database update is processed
          setTimeout(() => {
            setIsAccepting(false)
            router.push({
              pathname: "/battle-arena",
              params: {
                beastId: selectedBeast.id.toString(),
                battleId: battleId,
                opponentId: fullSenderWallet, // Pass the full sender's wallet address as opponent ID
              },
            })
          }, 1000)
        } catch (notificationError) {
          console.error("Failed to process battle acceptance:", notificationError)
          Alert.alert("Error", `Failed to join the battle: ${notificationError.message || "Unknown error"}`)
          setIsAccepting(false)
        }
      } else {
        console.error("Missing sender or userId")
        Alert.alert("Error", "Missing required information to join battle")
        setIsAccepting(false)
      }
    } catch (error) {
      console.error("Error preparing for battle:", error)
      Alert.alert("Error", `Failed to prepare for battle: ${error.message || "Unknown error"}`)
      setIsAccepting(false)
    }
  }

  const handleDecline = () => {
    Alert.alert("Decline Battle", "Are you sure you want to decline this battle request?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Decline",
        style: "destructive",
        onPress: () => router.back(),
      },
    ])
  }

  const getElementIcon = (element: string | undefined) => {
    // Add null check for element
    if (!element) return Sparkles

    switch (element.toLowerCase()) {
      case "fire":
        return Flame
      case "water":
        return Cloud
      case "earth":
        return Mountain
      case "wind":
        return Wind
      case "light":
        return Sun
      case "dark":
        return Moon
      default:
        return Sparkles
    }
  }

  const getElementColor = (element: string | undefined) => {
    // Add null check for element
    if (!element) return "#94A3B8"

    switch (element.toLowerCase()) {
      case "fire":
        return "#EF4444"
      case "water":
        return "#3B82F6"
      case "earth":
        return "#92400E"
      case "wind":
        return "#10B981"
      case "light":
        return "#F59E0B"
      case "dark":
        return "#6B21A8"
      default:
        return "#94A3B8"
    }
  }

  // Function to get the full IPFS image URL
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

  const renderBeastItem = ({ item }: { item: Beast }) => (
    <TouchableOpacity
      style={[styles.beastItem, selectedBeast?.id === item.id && styles.selectedBeastItem]}
      onPress={() => handleSelectBeast(item)}
    >
      <Image
        source={{ uri: getImageUrl(item.image_url) }}
        style={styles.beastImage}
        onError={(e) => console.log("Error loading beast image:", e.nativeEvent.error)}
      />
      <View style={styles.beastInfo}>
        <Text style={styles.beastName}>{item.name || "Unknown Beast"}</Text>
        <View style={styles.elementBadge}>
          {createElement(getElementIcon(item.element), {
            size: 12,
            color: getElementColor(item.element),
          })}
          <Text style={[styles.elementText, { color: getElementColor(item.element) }]}>
            {item.element || "Unknown"}
          </Text>
        </View>
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading battle information...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Battle Challenge</Text>
      </Animated.View>

      {/* Battle Request Card */}
      <Animated.View entering={FadeIn.delay(200)} style={styles.requestCard}>
        <BlurView intensity={40} tint="dark" style={styles.cardContent}>
          <LinearGradient colors={["rgba(239, 68, 68, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.requestHeader}>
            <Trophy size={32} color="#F59E0B" />
            <Text style={styles.requestTitle}>Epic Battle Challenge</Text>
          </View>
          <Text style={styles.requestText}>
            <Text style={styles.highlightText}>{senderName}</Text> has challenged you to a beast battle! Prepare your
            strongest beast and enter the arena!
          </Text>

          {/* Debug Info */}
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>Debug: Sender param length: {sender ? (sender as string).length : 0}</Text>
              <Text style={styles.debugText}>Debug: Full wallet found: {senderFullWallet ? "Yes" : "No"}</Text>
              {senderFullWallet && (
                <Text style={styles.debugText}>Debug: Full wallet: {senderFullWallet.slice(0, 10)}...</Text>
              )}
            </View>
          )}

          {/* Challenger Beast Info */}
          {senderBeast && (
            <View style={styles.challengerBeast}>
              <Text style={styles.challengerTitle}>Challenger's Beast</Text>
              <BlurView intensity={30} tint="dark" style={styles.beastPreviewCard}>
                <LinearGradient
                  colors={[`${getElementColor(senderBeast.element)}20`, "rgba(0, 0, 0, 0)"]}
                  style={StyleSheet.absoluteFill}
                />
                <Image
                  source={{ uri: getImageUrl(senderBeast.image_url) }}
                  style={styles.challengerBeastImage}
                  onError={(e) => console.log("Error loading challenger beast image:", e.nativeEvent.error)}
                />
                <View style={styles.challengerBeastInfo}>
                  <Text style={styles.challengerBeastName}>{senderBeast.name || "Unknown Beast"}</Text>
                  <View style={styles.elementBadge}>
                    {createElement(getElementIcon(senderBeast.element), {
                      size: 12,
                      color: getElementColor(senderBeast.element),
                    })}
                    <Text style={[styles.elementText, { color: getElementColor(senderBeast.element) }]}>
                      {senderBeast.element || "Unknown"}
                    </Text>
                  </View>
                  <View style={styles.challengerPowerBadge}>
                    <Swords size={12} color="#EF4444" />
                    <Text style={styles.challengerPowerText}>{senderBeast.power || 0} Power</Text>
                  </View>
                </View>
              </BlurView>
            </View>
          )}
        </BlurView>
      </Animated.View>

      {/* Select Your Beast Section */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.selectBeastSection}>
        <Text style={styles.sectionTitle}>Select Your Beast</Text>

        {userBeasts.length > 0 ? (
          <FlatList
            data={userBeasts}
            renderItem={renderBeastItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.beastList}
            horizontal={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <BlurView intensity={30} tint="dark" style={styles.noBeastsContainer}>
            <Text style={styles.noBeastsText}>You don't have any beasts yet</Text>
            <TouchableOpacity style={styles.createBeastButton} onPress={() => router.push("/beast-creation")}>
              <Text style={styles.createBeastText}>Create a Beast</Text>
            </TouchableOpacity>
          </BlurView>
        )}
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View entering={SlideInUp.delay(400)} style={styles.actionButtons}>
        <TouchableOpacity style={styles.declineButton} onPress={handleDecline} disabled={isAccepting}>
          <X size={20} color="#ffffff" />
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptButton, (!selectedBeast || isAccepting) && styles.disabledButton]}
          onPress={handleAccept}
          disabled={!selectedBeast || isAccepting}
        >
          {isAccepting ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.acceptButtonText}>Joining Battle...</Text>
            </>
          ) : (
            <>
              <Swords size={20} color="#ffffff" />
              <Text style={styles.acceptButtonText}>Begin Battle</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

// Add helper function to truncate wallet address
const truncateWalletAddress = (address: string) => {
  if (!address) return "Unknown"
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    // paddingTop: 60,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  requestCard: {
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardContent: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  requestTitle: {
    color: "#F59E0B",
    fontSize: 22,
    fontWeight: "bold",
  },
  requestText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  highlightText: {
    color: "#7C3AED",
    fontWeight: "bold",
  },
  debugInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugText: {
    color: "#4ADE80",
    fontSize: 12,
    fontFamily: "monospace",
  },
  beastItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedBeastItem: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderColor: "#7C3AED",
  },
  beastImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  beastInfo: {
    marginLeft: 16,
    flex: 1,
  },
  beastName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  elementBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  elementText: {
    fontSize: 12,
    fontWeight: "600",
  },
  powerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  powerText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },
  selectedCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 16,
  },
  selectBeastSection: {
    marginHorizontal: 16,
    flex: 1,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  beastList: {
    paddingBottom: 100, // Extra padding for action buttons
  },
  challengerBeast: {
    marginTop: 16,
  },
  challengerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  beastPreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  challengerBeastImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  challengerBeastInfo: {
    marginLeft: 16,
  },
  challengerBeastName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  challengerBeastElement: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 8,
  },
  challengerPowerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  challengerPowerText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 12,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  declineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  declineButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  acceptButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
  noBeastsContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    height: 200,
  },
  noBeastsText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  createBeastButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBeastText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
