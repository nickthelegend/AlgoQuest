"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated"
import { Gift, Calendar, AlertCircle, ChevronLeft, Loader, Clock, Coins, CheckCircle2, Info } from "lucide-react-native"
import { useState, useEffect } from "react"
import { router } from "expo-router"
import algosdk from "algosdk"
import { Buffer } from "buffer"
import * as Haptics from "expo-haptics"
import * as SecureStore from "expo-secure-store"

const { width } = Dimensions.get("window")

// Type definition for airdrop data
interface AirdropData {
  assetID: bigint
  creatorAddress: string
  tokenName: string
  amountRemaining: bigint
  numClaims: bigint
  maxClaims: bigint
  expiryDate: bigint
  amountToSend: bigint
  dropAppID: bigint
  id: string
  status: "active" | "expired"
  image: string
}

// Function to fetch and decode airdrops from Algorand blockchain
async function fetchAndDecodeDropConfigs(appId: number): Promise<AirdropData[]> {
  try {
    // Point to TestNet indexer
    const indexer = new algosdk.Indexer("", "https://testnet-idx.algonode.cloud", "")

    // ABI type for DropConfig
    const abiType = algosdk.ABIType.from("(uint64,address,string,uint64,uint64,uint64,uint64,uint64,uint64)")

    // Fetch all boxes for the application
    const boxesResp = await indexer.searchForApplicationBoxes(appId).do()
    const airdrops: AirdropData[] = []

    for (const box of boxesResp.boxes) {
      // Decode box name (base64 or Uint8Array)
      const nameBuf =
        typeof box.name === "string"
          ? Buffer.from(box.name, "base64")
          : Buffer.from(
              (box.name as Uint8Array).buffer,
              (box.name as Uint8Array).byteOffset,
              (box.name as Uint8Array).byteLength,
            )

      // Fetch the box value by name
      const valResp = await indexer
        .lookupApplicationBoxByIDandName(appId, new Uint8Array(nameBuf.buffer, nameBuf.byteOffset, nameBuf.byteLength))
        .do()

      // Normalize to Buffer
      let buf: Buffer
      if (typeof valResp.value === "string") {
        buf = Buffer.from(valResp.value, "base64")
      } else {
        const u8 = valResp.value as Uint8Array
        buf = Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength)
      }

      // ABI-decode into a 9-tuple
      const decodedTuple = abiType.decode(buf) as [
        bigint, // 0: assetID
        string, // 1: creatorAddress
        string, // 2: tokenName
        bigint, // 3: amountRemaining
        bigint, // 4: numClaims
        bigint, // 5: maxClaims
        bigint, // 6: expiryDate
        bigint, // 7: amountToSend
        bigint, // 8: dropAppID
      ]

      // Get box name as string for ID
      const boxName = new TextDecoder().decode(nameBuf)

      // Check if airdrop is expired
      const now = Math.floor(Date.now() / 1000)
      const expiryTimestamp = Number(decodedTuple[6])
      const isExpired = expiryTimestamp < now || Number(decodedTuple[3]) <= 0

      // Create airdrop object
      const airdrop: AirdropData = {
        assetID: decodedTuple[0],
        creatorAddress: decodedTuple[1],
        tokenName: decodedTuple[2],
        amountRemaining: decodedTuple[3],
        numClaims: decodedTuple[4],
        maxClaims: decodedTuple[5],
        expiryDate: decodedTuple[6],
        amountToSend: decodedTuple[7],
        dropAppID: decodedTuple[8],
        id: boxName,
        status: isExpired ? "expired" : "active",
        // Generate a unique image based on token name and asset ID
        image: `https://picsum.photos/seed/${decodedTuple[0]}_${decodedTuple[2]}/300/300`,
      }

      airdrops.push(airdrop)
    }

    return airdrops
  } catch (error) {
    console.error("Error fetching airdrops:", error)
    return []
  }
}

// Format large numbers with commas
function formatNumber(num: bigint | number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Format timestamp to readable date
function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

// Calculate time remaining until expiry
function getTimeRemaining(timestamp: bigint): string {
  const now = Math.floor(Date.now() / 1000)
  const expiryTime = Number(timestamp)

  if (expiryTime <= now) {
    return "Expired"
  }

  const secondsRemaining = expiryTime - now
  const days = Math.floor(secondsRemaining / 86400)
  const hours = Math.floor((secondsRemaining % 86400) / 3600)
  const minutes = Math.floor((secondsRemaining % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h remaining`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`
  } else {
    return `${minutes}m remaining`
  }
}

// Calculate progress percentage
function calculateProgress(claimed: bigint, total: bigint): number {
  if (total === BigInt(0)) return 0
  return Number((claimed * BigInt(100)) / total)
}

export default function AirdropScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"active" | "expired">("active")
  const [airdrops, setAirdrops] = useState<AirdropData[]>([])
  const [loading, setLoading] = useState(true)
  const [walletAddress, setWalletAddress] = useState("")
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadWalletAddress()
    loadAirdrops()
  }, [])

  const loadWalletAddress = async () => {
    try {
      const address = await SecureStore.getItemAsync("walletAddress")
      if (address) {
        setWalletAddress(address)
      }
    } catch (error) {
      console.error("Error loading wallet address:", error)
    }
  }

  const loadAirdrops = async () => {
    setLoading(true)
    try {
      const airdropData = await fetchAndDecodeDropConfigs(739646442)
      setAirdrops(airdropData)
    } catch (error) {
      console.error("Error loading airdrops:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try {
      await loadAirdrops()
    } catch (error) {
      console.error("Error refreshing airdrops:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleClaimAirdrop = async (airdrop: AirdropData) => {
    if (!walletAddress) {
      router.push("/create-wallet")
      return
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setClaimingId(airdrop.id)

    // Simulate claiming process
    setTimeout(() => {
      setClaimingId(null)
      setClaimSuccess(airdrop.id)

      // Reset success state after 3 seconds
      setTimeout(() => {
        setClaimSuccess(null)
      }, 3000)
    }, 2000)
  }

  const navigateToAirdropDetail = (airdrop: AirdropData) => {
    router.push({
      pathname: "/(airdrops)/airdrop",
      params: {
        id: airdrop.id,
        assetID: airdrop.assetID.toString(),
        tokenName: airdrop.tokenName,
        creatorAddress: airdrop.creatorAddress,
        amountRemaining: airdrop.amountRemaining.toString(),
        numClaims: airdrop.numClaims.toString(),
        maxClaims: airdrop.maxClaims.toString(),
        expiryDate: airdrop.expiryDate.toString(),
        amountToSend: airdrop.amountToSend.toString(),
        dropAppID: airdrop.dropAppID.toString(),
        status: airdrop.status,
        image: airdrop.image,
      },
    })
  }

  const filteredAirdrops = airdrops.filter((airdrop) => airdrop.status === activeTab)

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Token Airdrops</Text>
        <TouchableOpacity style={styles.infoButton} onPress={() => router.push("/help")}>
          <Info size={20} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.activeTab]}
          onPress={() => {
            Haptics.selectionAsync()
            setActiveTab("active")
          }}
        >
          <Gift size={16} color={activeTab === "active" ? "#ffffff" : "#A098AE"} />
          <Text style={[styles.tabText, activeTab === "active" && styles.activeTabText]}>Available</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "expired" && styles.activeTab]}
          onPress={() => {
            Haptics.selectionAsync()
            setActiveTab("expired")
          }}
        >
          <Clock size={16} color={activeTab === "expired" ? "#ffffff" : "#A098AE"} />
          <Text style={[styles.tabText, activeTab === "expired" && styles.activeTabText]}>Expired</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Loader size={32} color="#7C3AED" />
            <Text style={styles.loadingText}>Loading airdrops from blockchain...</Text>
          </View>
        ) : filteredAirdrops.length > 0 ? (
          filteredAirdrops.map((airdrop, index) => (
            <Animated.View
              key={airdrop.id}
              entering={FadeInDown.delay(index * 100).springify()}
              style={styles.airdropCard}
            >
              <TouchableOpacity
                style={styles.cardTouchable}
                onPress={() => navigateToAirdropDetail(airdrop)}
                activeOpacity={0.9}
              >
                <BlurView intensity={40} tint="dark" style={styles.cardContent}>
                  <LinearGradient
                    colors={["rgba(124, 58, 237, 0.3)", "rgba(0, 0, 0, 0)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <Image source={{ uri: airdrop.image }} style={styles.airdropImage} />
                    <View style={styles.airdropInfo}>
                      <Text style={styles.airdropTitle}>{airdrop.tokenName}</Text>
                      <Text style={styles.airdropDescription}>
                        Asset ID: {airdrop.assetID.toString().substring(0, 8)}...
                      </Text>

                      {/* Time Remaining Badge */}
                      <View style={styles.timeRemainingBadge}>
                        <Clock size={12} color={airdrop.status === "active" ? "#7C3AED" : "#EF4444"} />
                        <Text
                          style={[styles.timeRemainingText, airdrop.status === "expired" && styles.expiredTimeText]}
                        >
                          {getTimeRemaining(airdrop.expiryDate)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${calculateProgress(airdrop.numClaims, airdrop.maxClaims)}%`,
                            backgroundColor: airdrop.status === "active" ? "#7C3AED" : "#94A3B8",
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.progressLabels}>
                      <Text style={styles.progressText}>
                        {formatNumber(airdrop.numClaims)} / {formatNumber(airdrop.maxClaims)} claimed
                      </Text>
                      <Text style={styles.progressPercentage}>
                        {calculateProgress(airdrop.numClaims, airdrop.maxClaims)}%
                      </Text>
                    </View>
                  </View>

                  {/* Reward Container */}
                  <View style={styles.rewardContainer}>
                    <View style={styles.rewardIconContainer}>
                      <Coins size={20} color="#7C3AED" />
                    </View>
                    <View style={styles.rewardTextContainer}>
                      <Text style={styles.rewardLabel}>Reward Amount</Text>
                      <Text style={styles.rewardText}>
                        {formatNumber(airdrop.amountToSend)} {airdrop.tokenName}
                      </Text>
                    </View>
                  </View>

                  {/* Expiry Container */}
                  <View style={styles.expiryContainer}>
                    <View style={styles.expiryIconContainer}>
                      <Calendar size={16} color="#A098AE" />
                    </View>
                    <View>
                      <Text style={styles.expiryLabel}>
                        {airdrop.status === "active" ? "Expires on" : "Expired on"}
                      </Text>
                      <Text style={styles.expiryText}>{formatDate(airdrop.expiryDate)}</Text>
                    </View>
                  </View>

                  {/* Claim Button or Expired Badge */}
                  {airdrop.status === "active" ? (
                    <TouchableOpacity
                      style={[
                        styles.claimButton,
                        claimingId === airdrop.id && styles.claimingButton,
                        claimSuccess === airdrop.id && styles.claimedButton,
                      ]}
                      onPress={() => handleClaimAirdrop(airdrop)}
                      disabled={claimingId !== null || claimSuccess !== null}
                    >
                      {claimingId === airdrop.id ? (
                        <View style={styles.claimingContainer}>
                          <Loader size={20} color="#ffffff" />
                          <Text style={styles.claimButtonText}>Claiming...</Text>
                        </View>
                      ) : claimSuccess === airdrop.id ? (
                        <View style={styles.claimingContainer}>
                          <CheckCircle2 size={20} color="#ffffff" />
                          <Text style={styles.claimButtonText}>Claimed!</Text>
                        </View>
                      ) : (
                        <Text style={styles.claimButtonText}>Claim Reward</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.expiredBadge}>
                      <AlertCircle size={16} color="#EF4444" />
                      <Text style={styles.expiredText}>Airdrop Ended</Text>
                    </View>
                  )}

                  {/* View Details Button */}
                  <TouchableOpacity style={styles.detailsButton} onPress={() => navigateToAirdropDetail(airdrop)}>
                    <Text style={styles.detailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                </BlurView>
              </TouchableOpacity>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Gift size={64} color="rgba(255, 255, 255, 0.2)" />
            <Text style={styles.emptyText}>No {activeTab} airdrops available</Text>
            <Text style={styles.emptySubtext}>Check back later for new token airdrops</Text>

            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: "#7C3AED",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A098AE",
  },
  activeTabText: {
    color: "#ffffff",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  airdropCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTouchable: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  airdropImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  airdropInfo: {
    flex: 1,
    justifyContent: "center",
  },
  airdropTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  airdropDescription: {
    fontSize: 14,
    color: "#A098AE",
    lineHeight: 20,
    marginBottom: 8,
  },
  timeRemainingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 4,
  },
  timeRemainingText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7C3AED",
  },
  expiredTimeText: {
    color: "#EF4444",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 12,
    color: "#A098AE",
  },
  progressPercentage: {
    fontSize: 12,
    color: "#A098AE",
    fontWeight: "bold",
  },
  rewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  rewardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rewardTextContainer: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 12,
    color: "#A098AE",
    marginBottom: 2,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  expiryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  expiryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  expiryLabel: {
    fontSize: 12,
    color: "#A098AE",
    marginBottom: 2,
  },
  expiryText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  claimButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  claimingButton: {
    backgroundColor: "#5B21B6",
  },
  claimedButton: {
    backgroundColor: "#10B981",
  },
  claimingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  expiredBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  expiredText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#EF4444",
    marginLeft: 8,
  },
  detailsButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#A098AE",
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7C3AED",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#ffffff",
  },
})
