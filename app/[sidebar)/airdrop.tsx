"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated"
import {
  Gift,
  Calendar,
  AlertCircle,
  ChevronLeft,
  Loader,
  Clock,
  Coins,
  CheckCircle2,
  Info,
  Users,
  TrendingUp,
} from "lucide-react-native"
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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

// Calculate progress percentage
function calculateProgress(claimed: bigint, total: bigint): number {
  if (total === BigInt(0)) return 0
  return Number((claimed * BigInt(100)) / total)
}

// Get token icon based on name
function getTokenIcon(tokenName: string) {
  const firstLetter = tokenName.charAt(0).toUpperCase()
  return firstLetter
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

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setClaimingId(airdrop.id)

      // Get wallet account from secure storage
      const mnemonic = await SecureStore.getItemAsync("walletMnemonic")
      if (!mnemonic) {
        throw new Error("Wallet not found")
      }

      const account = algosdk.mnemonicToSecretKey(mnemonic)
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")

      // Get suggested params
      const suggestedParams = await algodClient.getTransactionParams().do()

      // App ID and Beast Asset ID
      const appID = airdrop.dropAppID.toString()
      const beastAssetID = airdrop.assetID.toString()

      // Method selector for claimDrop
      const METHODS = [
        {
          name: "claimDrop",
          args: [{ type: "uint64" }],
          returns: { type: "void" },
        },
      ]

      const claimTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account.addr,
        appIndex: Number(appID),
        appArgs: [
          algosdk.getMethodByName(METHODS, "claimDrop").getSelector(),
          algosdk.encodeUint64(Number(beastAssetID)),
        ],
        foreignAssets: [Number(beastAssetID)],
        suggestedParams: { ...suggestedParams, fee: Number(30) },
        boxes: [{ appIndex: 0, name: algosdk.decodeAddress(account.addr.toString()).publicKey }],
      })

      const txns = [claimTxn]

      // Sign the transaction
      const signedTxns = txns.map((txn) => txn.signTxn(account.sk))
      const txId = claimTxn.txID()

      // Send the signed transaction
      await algodClient.sendRawTransaction(signedTxns).do()

      setClaimingId(null)
      setClaimSuccess(airdrop.id)

      // Reset success state after 3 seconds
      setTimeout(() => {
        setClaimSuccess(null)
        loadAirdrops() // Refresh the data
      }, 3000)
    } catch (error) {
      console.error("Error claiming airdrop:", error)
      setClaimingId(null)
      // You might want to show an error message to the user here
    }
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
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Token Airdrops</Text>
        <TouchableOpacity style={styles.infoButton} onPress={() => router.push("/(airdrops)/help")}>
          <Info size={20} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Stats Bar */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsContainer}>
        <BlurView intensity={20} tint="dark" style={styles.statsBlur}>
          <View style={styles.statItem}>
            <Gift size={16} color="#7C3AED" />
            <Text style={styles.statNumber}>{airdrops.filter((a) => a.status === "active").length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Clock size={16} color="#EF4444" />
            <Text style={styles.statNumber}>{airdrops.filter((a) => a.status === "expired").length}</Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <TrendingUp size={16} color="#10B981" />
            <Text style={styles.statNumber}>{airdrops.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </BlurView>
      </Animated.View>

      {/* Tabs */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.activeTab]}
          onPress={() => {
            Haptics.selectionAsync()
            setActiveTab("active")
          }}
        >
          <Gift size={16} color={activeTab === "active" ? "#ffffff" : "#64748B"} />
          <Text style={[styles.tabText, activeTab === "active" && styles.activeTabText]}>Available</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "expired" && styles.activeTab]}
          onPress={() => {
            Haptics.selectionAsync()
            setActiveTab("expired")
          }}
        >
          <Clock size={16} color={activeTab === "expired" ? "#ffffff" : "#64748B"} />
          <Text style={[styles.tabText, activeTab === "expired" && styles.activeTabText]}>Expired</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Loader size={32} color="#7C3AED" />
            <Text style={styles.loadingText}>Loading airdrops...</Text>
          </View>
        ) : filteredAirdrops.length > 0 ? (
          filteredAirdrops.map((airdrop, index) => (
            <Animated.View
              key={airdrop.id}
              entering={FadeInDown.delay(index * 100).springify()}
              style={styles.airdropCard}
            >
              <BlurView intensity={40} tint="dark" style={styles.cardBlur}>
                <LinearGradient
                  colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0.3)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.tokenIconContainer}>
                    <Text style={styles.tokenIcon}>{getTokenIcon(airdrop.tokenName)}</Text>
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.tokenName}>{airdrop.tokenName}</Text>
                    <Text style={styles.assetId}>#{airdrop.assetID.toString().slice(-6)}</Text>
                  </View>
                  <View style={[styles.statusBadge, airdrop.status === "expired" && styles.expiredStatusBadge]}>
                    <Text style={[styles.statusText, airdrop.status === "expired" && styles.expiredStatusText]}>
                      {airdrop.status === "active" ? "LIVE" : "ENDED"}
                    </Text>
                  </View>
                </View>

                {/* Reward Section */}
                <View style={styles.rewardSection}>
                  <View style={styles.rewardHeader}>
                    <Coins size={18} color="#7C3AED" />
                    <Text style={styles.rewardLabel}>Reward Amount</Text>
                  </View>
                  <Text style={styles.rewardAmount}>
                    {formatNumber(airdrop.amountToSend)} {airdrop.tokenName}
                  </Text>
                </View>

                {/* Progress Section */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Users size={16} color="#64748B" />
                    <Text style={styles.progressLabel}>Claimed Progress</Text>
                    <Text style={styles.progressPercentage}>
                      {calculateProgress(airdrop.numClaims, airdrop.maxClaims)}%
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${calculateProgress(airdrop.numClaims, airdrop.maxClaims)}%`,
                            backgroundColor: airdrop.status === "active" ? "#7C3AED" : "#64748B",
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.progressText}>
                    {formatNumber(airdrop.numClaims)} / {formatNumber(airdrop.maxClaims)} claimed
                  </Text>
                </View>

                {/* Time Section */}
                <View style={styles.timeSection}>
                  <Calendar size={16} color="#64748B" />
                  <View style={styles.timeInfo}>
                    <Text style={styles.timeLabel}>{airdrop.status === "active" ? "Expires" : "Expired"}</Text>
                    <Text style={styles.timeValue}>{formatDate(airdrop.expiryDate)}</Text>
                  </View>
                  <View style={styles.timeRemaining}>
                    <Text style={[styles.timeRemainingText, airdrop.status === "expired" && styles.expiredTimeText]}>
                      {getTimeRemaining(airdrop.expiryDate)}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionSection}>
                  {airdrop.status === "active" ? (
                    <TouchableOpacity
                      style={[
                        styles.claimButton,
                        claimingId === airdrop.id && styles.claimingButton,
                        claimSuccess === airdrop.id && styles.successButton,
                      ]}
                      onPress={() => handleClaimAirdrop(airdrop)}
                      disabled={claimingId !== null || claimSuccess !== null}
                    >
                      <LinearGradient
                        colors={
                          claimSuccess === airdrop.id
                            ? ["#10B981", "#059669"]
                            : claimingId === airdrop.id
                              ? ["#5B21B6", "#4C1D95"]
                              : ["#7C3AED", "#5B21B6"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.claimGradient}
                      >
                        {claimingId === airdrop.id ? (
                          <View style={styles.claimContent}>
                            <Loader size={18} color="#ffffff" />
                            <Text style={styles.claimText}>Claiming...</Text>
                          </View>
                        ) : claimSuccess === airdrop.id ? (
                          <View style={styles.claimContent}>
                            <CheckCircle2 size={18} color="#ffffff" />
                            <Text style={styles.claimText}>Claimed!</Text>
                          </View>
                        ) : (
                          <Text style={styles.claimText}>Claim Reward</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.expiredButton}>
                      <AlertCircle size={16} color="#EF4444" />
                      <Text style={styles.expiredButtonText}>Airdrop Ended</Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.detailsButton} onPress={() => navigateToAirdropDetail(airdrop)}>
                    <Text style={styles.detailsText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </Animated.View>
          ))
        ) : (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Gift size={48} color="#7C3AED" />
            </View>
            <Text style={styles.emptyTitle}>No {activeTab} airdrops</Text>
            <Text style={styles.emptySubtitle}>Check back later for new token airdrops</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </Animated.View>
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
    paddingHorizontal: 20,
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
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  statsBlur: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#7C3AED",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  activeTabText: {
    color: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  airdropCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  cardBlur: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  tokenIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tokenIcon: {
    fontSize: 20,
    fontWeight: "700",
    color: "#7C3AED",
  },
  headerInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
  },
  assetId: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
  },
  expiredStatusBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7C3AED",
  },
  expiredStatusText: {
    color: "#EF4444",
  },
  rewardSection: {
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  rewardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  rewardLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  rewardAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  progressLabel: {
    flex: 1,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  progressPercentage: {
    fontSize: 12,
    color: "#7C3AED",
    fontWeight: "700",
  },
  progressBarContainer: {
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: "#64748B",
  },
  timeSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  timeInfo: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
  },
  timeRemaining: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
  },
  timeRemainingText: {
    fontSize: 11,
    color: "#7C3AED",
    fontWeight: "600",
  },
  expiredTimeText: {
    color: "#EF4444",
  },
  actionSection: {
    gap: 12,
  },
  claimButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  claimingButton: {
    opacity: 0.8,
  },
  successButton: {
    opacity: 1,
  },
  claimGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  claimContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  claimText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  expiredButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    gap: 8,
  },
  expiredButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  detailsButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  detailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  refreshText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7C3AED",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
  },
})
