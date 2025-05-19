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

const { width: screenWidth } = Dimensions.get("window")

interface Beast {
  id: number
  name: string
  power: number
  element: string
  image: string
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

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      try {
        // Load wallet address
        await loadWalletAddress()

        // Fetch user beasts
        await fetchUserBeasts()

        // Fetch sender info if we have a sender wallet address
        if (sender) {
          await fetchSenderInfo(sender as string)
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
      // Fetch sender's user info from database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, username")
        .eq("wallet_address", senderWalletAddress)
        .single()

      if (userError) {
        console.error("Error fetching sender info:", userError)
        return
      }

      if (userData) {
        setSenderName(userData.username || "Player")

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

  const handleAccept = () => {
    if (!selectedBeast) {
      Alert.alert("Select Beast", "Please select a beast for battle")
      return
    }

    setIsAccepting(true)

    // Store selected beast ID in secure storage for battle arena
    SecureStore.setItemAsync("selectedBeastId", selectedBeast.id.toString())
      .then(() => {
        // Navigate to battle arena
        setTimeout(() => {
          router.push({
            pathname: "/battle-arena",
            params: { beastId: selectedBeast.id.toString() },
          })
        }, 500)
      })
      .catch((error) => {
        console.error("Error saving selected beast:", error)
        Alert.alert("Error", "Failed to prepare for battle")
        setIsAccepting(false)
      })
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

  const renderBeastItem = ({ item }: { item: Beast }) => (
    <TouchableOpacity
      style={[styles.beastItem, selectedBeast?.id === item.id && styles.selectedBeastItem]}
      onPress={() => handleSelectBeast(item)}
    >
      <Image source={{ uri: item.image || "/placeholder.svg?height=100&width=100" }} style={styles.beastImage} />
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
                  source={{ uri: senderBeast.image || "/placeholder.svg?height=80&width=80" }}
                  style={styles.challengerBeastImage}
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
        <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
          <X size={20} color="#ffffff" />
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptButton, (!selectedBeast || isAccepting) && styles.disabledButton]}
          onPress={handleAccept}
          disabled={!selectedBeast || isAccepting}
        >
          {isAccepting ? (
            <ActivityIndicator size="small" color="#ffffff" />
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
    paddingTop: 60,
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
