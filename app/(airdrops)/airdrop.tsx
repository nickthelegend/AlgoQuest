"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Share, Linking } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated"
import {
  Gift,
  AlertCircle,
  ChevronLeft,
  Loader,
  Clock,
  Coins,
  CheckCircle2,
  Share2,
  ExternalLink,
  Copy,
} from "lucide-react-native"
import { useState, useEffect } from "react"
import { router, useLocalSearchParams } from "expo-router"
import * as Haptics from "expo-haptics"
import * as Clipboard from "expo-clipboard"
import * as SecureStore from "expo-secure-store"

const { width } = Dimensions.get("window")

// Format large numbers with commas
function formatNumber(num: string | number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Format timestamp to readable date
function formatDate(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

// Format timestamp to readable time
function formatTime(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

// Calculate time remaining until expiry
function getTimeRemaining(timestamp: string): string {
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
    return `${days} days, ${hours} hours remaining`
  } else if (hours > 0) {
    return `${hours} hours, ${minutes} minutes remaining`
  } else {
    return `${minutes} minutes remaining`
  }
}

// Calculate progress percentage
function calculateProgress(claimed: string, total: string): number {
  if (Number(total) === 0) return 0
  return Math.min(100, Math.floor((Number(claimed) / Number(total)) * 100))
}

// Truncate address for display
function truncateAddress(address: string): string {
  if (!address) return ""
  return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
}

export default function AirdropDetailScreen() {
  const params = useLocalSearchParams()
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  useEffect(() => {
    loadWalletAddress()
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

  const handleClaimAirdrop = async () => {
    if (!walletAddress) {
      router.push("/create-wallet")
      return
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setClaiming(true)

    // Simulate claiming process
    setTimeout(() => {
      setClaiming(false)
      setClaimed(true)
    }, 2000)
  }

  const handleCopyToClipboard = async (text: string, type: string) => {
    await Clipboard.setStringAsync(text)
    setCopySuccess(type)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    setTimeout(() => {
      setCopySuccess(null)
    }, 2000)
  }

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await Share.share({
        message: `Check out this ${params.tokenName} airdrop! Claim your tokens before ${formatDate(params.expiryDate as string)}. Asset ID: ${params.assetID}`,
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const openExplorer = () => {
    Linking.openURL(`https://testnet.algoexplorer.io/asset/${params.assetID}`)
  }

  const isExpired = params.status === "expired"

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Airdrop Details</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Share2 size={20} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroSection}>
          <Image source={{ uri: params.image as string }} style={styles.heroImage} />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.heroGradient} />
          <View style={styles.heroContent}>
            <Text style={styles.tokenName}>{params.tokenName}</Text>
            <View style={styles.assetIdContainer}>
              <Text style={styles.assetIdLabel}>Asset ID:</Text>
              <Text style={styles.assetId}>{params.assetID}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopyToClipboard(params.assetID as string, "assetID")}
              >
                {copySuccess === "assetID" ? (
                  <CheckCircle2 size={16} color="#10B981" />
                ) : (
                  <Copy size={16} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, isExpired ? styles.expiredBadge : styles.activeBadge]}>
            <Text style={[styles.statusText, isExpired ? styles.expiredStatusText : styles.activeStatusText]}>
              {isExpired ? "Expired" : "Active"}
            </Text>
          </View>
        </Animated.View>

        {/* Info Cards */}
        <View style={styles.infoCardsContainer}>
          {/* Time Remaining Card */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.infoCard}>
            <BlurView intensity={40} tint="dark" style={styles.infoCardContent}>
              <View style={styles.infoCardIconContainer}>
                <Clock size={24} color={isExpired ? "#EF4444" : "#7C3AED"} />
              </View>
              <View style={styles.infoCardTextContainer}>
                <Text style={styles.infoCardLabel}>{isExpired ? "Expired On" : "Time Remaining"}</Text>
                <Text style={[styles.infoCardValue, isExpired && styles.expiredInfoValue]}>
                  {isExpired ? formatDate(params.expiryDate as string) : getTimeRemaining(params.expiryDate as string)}
                </Text>
              </View>
            </BlurView>
          </Animated.View>

          {/* Reward Amount Card */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.infoCard}>
            <BlurView intensity={40} tint="dark" style={styles.infoCardContent}>
              <View style={styles.infoCardIconContainer}>
                <Coins size={24} color="#7C3AED" />
              </View>
              <View style={styles.infoCardTextContainer}>
                <Text style={styles.infoCardLabel}>Reward Amount</Text>
                <Text style={styles.infoCardValue}>
                  {formatNumber(params.amountToSend as string)} {params.tokenName}
                </Text>
              </View>
            </BlurView>
          </Animated.View>
        </View>

        {/* Progress Section */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Claim Progress</Text>
          <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${calculateProgress(params.numClaims as string, params.maxClaims as string)}%`,
                      backgroundColor: isExpired ? "#94A3B8" : "#7C3AED",
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressText}>
                  {formatNumber(params.numClaims as string)} / {formatNumber(params.maxClaims as string)} claimed
                </Text>
                <Text style={styles.progressPercentage}>
                  {calculateProgress(params.numClaims as string, params.maxClaims as string)}%
                </Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Remaining</Text>
                <Text style={styles.statValue}>{formatNumber(params.amountRemaining as string)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Claims</Text>
                <Text style={styles.statValue}>{formatNumber(params.numClaims as string)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Max Claims</Text>
                <Text style={styles.statValue}>{formatNumber(params.maxClaims as string)}</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Details Section */}
        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Airdrop Details</Text>
          <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Creator</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{truncateAddress(params.creatorAddress as string)}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopyToClipboard(params.creatorAddress as string, "creator")}
                >
                  {copySuccess === "creator" ? (
                    <CheckCircle2 size={16} color="#10B981" />
                  ) : (
                    <Copy size={16} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiry Date</Text>
              <Text style={styles.detailValue}>{formatDate(params.expiryDate as string)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiry Time</Text>
              <Text style={styles.detailValue}>{formatTime(params.expiryDate as string)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Drop App ID</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{params.dropAppID}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopyToClipboard(params.dropAppID as string, "appID")}
                >
                  {copySuccess === "appID" ? (
                    <CheckCircle2 size={16} color="#10B981" />
                  ) : (
                    <Copy size={16} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.actionsContainer}>
          {/* Claim Button or Expired Badge */}
          {!isExpired ? (
            <TouchableOpacity
              style={[styles.claimButton, claiming && styles.claimingButton, claimed && styles.claimedButton]}
              onPress={handleClaimAirdrop}
              disabled={claiming || claimed}
            >
              {claiming ? (
                <View style={styles.claimingContainer}>
                  <Loader size={20} color="#ffffff" />
                  <Text style={styles.claimButtonText}>Claiming...</Text>
                </View>
              ) : claimed ? (
                <View style={styles.claimingContainer}>
                  <CheckCircle2 size={20} color="#ffffff" />
                  <Text style={styles.claimButtonText}>Claimed Successfully!</Text>
                </View>
              ) : (
                <View style={styles.claimingContainer}>
                  <Gift size={20} color="#ffffff" />
                  <Text style={styles.claimButtonText}>Claim {params.tokenName}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.expiredBadge}>
              <AlertCircle size={20} color="#EF4444" />
              <Text style={styles.expiredText}>This airdrop has ended</Text>
            </View>
          )}

          {/* View on Explorer Button */}
          <TouchableOpacity style={styles.explorerButton} onPress={openExplorer}>
            <Text style={styles.explorerButtonText}>View on Algorand Explorer</Text>
            <ExternalLink size={16} color="#7C3AED" />
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
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
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  heroSection: {
    position: "relative",
    height: 200,
    marginBottom: 24,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  tokenName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  assetIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  assetIdLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginRight: 4,
  },
  assetId: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  expiredBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  activeStatusText: {
    color: "#10B981",
  },
  expiredStatusText: {
    color: "#EF4444",
  },
  infoCardsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  infoCardContent: {
    padding: 16,
  },
  infoCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  infoCardTextContainer: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  expiredInfoValue: {
    color: "#EF4444",
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
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
    color: "rgba(255, 255, 255, 0.6)",
  },
  progressPercentage: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  detailLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  detailValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailValue: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  actionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  claimButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
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
  explorerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    gap: 8,
  },
  explorerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7C3AED",
  },
})
