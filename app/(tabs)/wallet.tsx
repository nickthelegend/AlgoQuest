"use client"

import "react-native-get-random-values"
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import {
  Copy,
  Send,
  Wallet as WalletIcon,
  ArrowDown,
  Check,
  Coins,
  History,
  Shield,
  Zap,
  Gift,
} from "lucide-react-native"
import { useState, useEffect } from "react"
import * as Clipboard from "expo-clipboard"
import * as SecureStore from "expo-secure-store"
import algosdk from "algosdk"
import { QUEST_COIN_ASSET_ID } from "@/lib/algoClient"
import { router } from "expo-router"
import QRCodeStyled from "react-native-qrcode-styled"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width * 0.9
const NFT_SIZE = (width - 48) / 2 // 2 columns with 16px padding and gap

interface NFTAsset {
  id: number
  name: string
  image: string
  unitName: string
}

export default function WalletScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [publicAddress, setPublicAddress] = useState<string>("")
  const [algoBalance, setAlgoBalance] = useState<number>(0)
  const [algoPrice, setAlgoPrice] = useState<number>(0)
  const [questCoinBalance, setQuestCoinBalance] = useState<number>(0)
  const [isOptedIn, setIsOptedIn] = useState(false)
  const [optInLoading, setOptInLoading] = useState(false)
  const [transactionCount, setTransactionCount] = useState(0)
  const [nfts, setNfts] = useState<NFTAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    loadWalletAddress()
  }, [])

  useEffect(() => {
    fetchAlgoPrice()
    const interval = setInterval(fetchAlgoPrice, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const loadWalletAddress = async () => {
    try {
      const mnemonic = await SecureStore.getItemAsync("mnemonic")

      if (!mnemonic) {
        Alert.alert("No Mnemonic", "No mnemonic found in secure storage.")
        return
      }

      try {
        const account = algosdk.mnemonicToSecretKey(mnemonic)
        if (account && account.addr) {
          const address = account.addr.toString()
          setPublicAddress(address)
          getAlgoBalance(address)
          fetchAlgoPrice()
        } else {
          throw new Error("Invalid account data")
        }
      } catch (error) {
        console.error("Error converting mnemonic:", error)
        Alert.alert("Error", "Failed to convert mnemonic to address")
      }
    } catch (error) {
      console.error("Error loading wallet address:", error)
      Alert.alert("Error", "Failed to load wallet address")
    }
  }

  const fetchAlgoPrice = async () => {
    try {
      const response = await fetch("https://mainnet.analytics.tinyman.org/api/v1/assets/0/")
      const data = await response.json()
      setAlgoPrice(Number(data.price_in_usd))
    } catch (error) {
      console.error("Error fetching ALGO price:", error)
    }
  }

  const getAlgoBalance = async (address: string) => {
    try {
      setLoading(true)
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")
      const accountInfo = await algodClient.accountInformation(address).do()

      // Set ALGO balance
      setAlgoBalance(Number(accountInfo.amount.toString()) / 1000000)

      // Check Quest Coin opt-in status
      await checkOptInStatus(accountInfo)

      // Process NFTs
      const assets = accountInfo.assets || []
      const nftPromises = assets.map(async (asset: any) => {
        try {
          const assetInfo = await algodClient.getAssetByID(Number(asset.assetId)).do()

          // Check if it's an NFT (total supply of 1 and unit name is "NFT")
          if (assetInfo.params.total === 1n && assetInfo.params.unitName === "NFT") {
            let imageUrl = ""
            if (assetInfo.params.url) {
              const workingUrl = await tryLoadImage(assetInfo.params.url)
              if (workingUrl) {
                imageUrl = workingUrl
              }
            }

            return {
              id: asset.assetId,
              name: assetInfo.params.name,
              image: imageUrl,
              unitName: assetInfo.params.unitName,
            }
          }
          return null
        } catch (error) {
          console.error(`Error fetching asset ${asset.assetId}:`, error)
          return null
        }
      })

      const nftResults = await Promise.all(nftPromises)
      const validNfts = nftResults.filter((nft): nft is NFTAsset => nft !== null)
      setNfts(validNfts)
    } catch (error) {
      console.error("Error fetching account information:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOptIn = async () => {
    try {
      setOptInLoading(true)
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (!mnemonic) {
        Alert.alert("Error", "No mnemonic found")
        return
      }

      const account = algosdk.mnemonicToSecretKey(mnemonic)
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")

      const suggestedParams = await algodClient.getTransactionParams().do()
      const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account.addr,
        receiver: account.addr,
        assetIndex: Number(QUEST_COIN_ASSET_ID),
        amount: 0,
        suggestedParams,
      })

      const signedTxn = optInTxn.signTxn(account.sk)
      const { txid } = await algodClient.sendRawTransaction(signedTxn).do()

      await algosdk.waitForConfirmation(algodClient, txid, 4)

      await getAlgoBalance(publicAddress)
      Alert.alert("Success", "Successfully opted in to Quest Coins!")
      setIsOptedIn(true)
    } catch (error) {
      console.error("Error opting in:", error)
      Alert.alert("Error", "Failed to opt in to Quest Coins")
    } finally {
      setOptInLoading(false)
    }
  }

  const checkOptInStatus = async (accountInfo: any) => {
    try {
      const assets = accountInfo["assets"] || []

      const isOptedIn = assets.some((asset: any) => {
        const assetIdString = asset["assetId"].toString()
        return assetIdString === QUEST_COIN_ASSET_ID
      })
      setIsOptedIn(isOptedIn)

      if (isOptedIn) {
        const questAsset = assets.find((asset: any) => {
          const assetIdString = asset["assetId"].toString()
          return assetIdString === QUEST_COIN_ASSET_ID
        })
        setQuestCoinBalance(questAsset ? Number(questAsset.amount.toString()) : 0)
      }
    } catch (error) {
      console.error("Error checking opt-in status:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadWalletAddress()
    setRefreshing(false)
  }

  const copyToClipboard = async () => {
    if (publicAddress) {
      await Clipboard.setStringAsync(publicAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  useEffect(() => {
    if (publicAddress) {
      fetchTransactionCount()
    }
  }, [publicAddress])

  const fetchTransactionCount = async () => {
    if (!publicAddress) return
    try {
      const response = await fetch(`https://testnet-idx.4160.nodely.dev/v2/accounts/${publicAddress}/transactions`)
      const data = await response.json()
      setTransactionCount(data.transactions?.length || 0)
    } catch (error) {
      console.error("Error fetching transaction count:", error)
    }
  }

  const tryLoadImage = async (url: string): Promise<string | null> => {
    try {
      if (url.startsWith("ipfs://")) {
        const ipfsHash = url.replace("ipfs://", "")
        const imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`
        const response = await fetch(imageUrl)
        if (response.ok) {
          return imageUrl
        }
      } else {
        const response = await fetch(url)
        if (response.ok) {
          return url
        }
      }
      return null
    } catch (error) {
      console.error("Error trying to load image:", error)
      return null
    }
  }

  const toggleQRCode = () => {
    setShowQR(!showQR)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
      >
        {/* Main Balance Card */}
        <LinearGradient
          colors={["#7C3AED", "#4F46E5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mainBalanceCard}
        >
          <View style={styles.balanceHeader}>
            <WalletIcon size={24} color="#ffffff" />
            <Text style={styles.balanceLabel}>ALGO Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>{algoBalance.toFixed(3)} ALGO</Text>
          <Text style={styles.balanceUsd}>≈ ${(algoBalance * algoPrice).toFixed(2)} USD</Text>

          {/* Quest Coins Section */}
          <View style={styles.questCoinsSection}>
            <View style={styles.questCoinsHeader}>
              <Coins size={20} color="#ffffff" />
              <Text style={styles.questCoinsLabel}>Quest Coins</Text>
            </View>

            {isOptedIn ? (
              <Text style={styles.questCoinsBalance}>{questCoinBalance} Q</Text>
            ) : (
              <TouchableOpacity style={styles.questOptInButton} onPress={handleOptIn} disabled={optInLoading}>
                {optInLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.questOptInText}>Opt In to Quest Coins</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionButtonCircle} onPress={toggleQRCode}>
              <ArrowDown size={22} color="#ffffff" />
              <Text style={styles.actionButtonText}>Receive</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonCircle} onPress={() => router.push("/send")}>
              <Send size={22} color="#ffffff" />
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonCircle}
              onPress={() => Linking.openURL("https://bank.testnet.algorand.network/")}
            >
              <Gift size={22} color="#ffffff" />
              <Text style={styles.actionButtonText}>Get ALGO</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* QR Code Modal */}
        {showQR && publicAddress && (
          <BlurView intensity={40} tint="dark" style={styles.qrCodeModal}>
            <View style={styles.qrCodeHeader}>
              <Text style={styles.qrCodeTitle}>Your Wallet Address</Text>
              <TouchableOpacity onPress={toggleQRCode} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.qrCodeWrapper}>
              <QRCodeStyled
                data={publicAddress}
                pieceSize={8}
                pieceBorderRadius={2}
                isPiecesGlued
                padding={16}
                color="#7C3AED"
                outerEyesOptions={{
                  topLeft: { borderRadius: 12 },
                  topRight: { borderRadius: 12 },
                  bottomLeft: { borderRadius: 12 },
                }}
                innerEyesOptions={{ borderRadius: 6 }}
                logo={{
                  href: require("@/assets/sad.jpg"),
                  padding: 4,
                  scale: 2,
                  hidePieces: false,
                  borderRadius: 12,
                }}
                style={{ backgroundColor: "white" }}
              />
            </View>
            <View style={styles.addressContainer}>
              <Text style={styles.address} numberOfLines={1}>
                {publicAddress}
              </Text>
              <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                {copied ? <Check size={16} color="#4ADE80" /> : <Copy size={16} color="#ffffff" />}
              </TouchableOpacity>
            </View>
          </BlurView>
        )}

        {/* Assets Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Assets</Text>
        </View>

        {/* No Assets Message */}
        {!loading && (!isOptedIn || questCoinBalance === 0) && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No assets to show</Text>
            <Text style={styles.emptyStateSubtext}>Assets you receive will appear here</Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push("/transactions")}>
            <View style={[styles.quickActionIcon, { backgroundColor: "rgba(124, 58, 237, 0.1)" }]}>
              <History size={24} color="#7C3AED" />
            </View>
            <Text style={styles.quickActionTitle}>Transaction History</Text>
            <Text style={styles.quickActionSubtitle}>{transactionCount} transactions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push("/wallet-backup")}>
            <View style={[styles.quickActionIcon, { backgroundColor: "rgba(79, 70, 229, 0.1)" }]}>
              <Shield size={24} color="#4F46E5" />
            </View>
            <Text style={styles.quickActionTitle}>Backup Wallet</Text>
            <Text style={styles.quickActionSubtitle}>Secure your funds</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push("/[sidebar)/wallet-settings")}>
            <View style={[styles.quickActionIcon, { backgroundColor: "rgba(236, 72, 153, 0.1)" }]}>
              <Zap size={24} color="#EC4899" />
            </View>
            <Text style={styles.quickActionTitle}>Wallet Settings</Text>
            <Text style={styles.quickActionSubtitle}>Customize options</Text>
          </TouchableOpacity>
        </View>

        {/* NFT Gallery */}
        {nfts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>NFT Collection</Text>
              {nfts.length > 2 && (
                <TouchableOpacity onPress={() => router.push("/nfts")}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.nftGrid}>
              {nfts.slice(0, 4).map((nft) => (
                <TouchableOpacity
                  key={nft.id}
                  style={styles.nftCard}
                  onPress={() =>
                    router.push({
                      pathname: "/nft-details",
                      params: { id: nft.id.toString() },
                    })
                  }
                >
                  <View style={styles.nftCardContent}>
                    <View style={styles.nftImageContainer}>
                      {nft.image ? (
                        <Image source={{ uri: nft.image }} style={styles.nftImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.nftImageContainer, styles.nftImagePlaceholder]}>
                          <Text style={styles.placeholderText}>{nft.name.substring(0, 1)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.nftInfo}>
                      <Text style={styles.nftName} numberOfLines={1}>
                        {nft.name}
                      </Text>
                      <Text style={styles.nftUnitName}>{nft.unitName}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {loading && nfts.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading assets...</Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  mainBalanceCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  balanceLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  balanceAmount: {
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 4,
  },
  balanceUsd: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginBottom: 16,
  },
  questCoinsSection: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  questCoinsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  questCoinsLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  questCoinsBalance: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  questOptInButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  questOptInText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButtonCircle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 12,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  qrCodeModal: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  qrCodeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  qrCodeTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 20,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 12,
    width: "100%",
  },
  address: {
    color: "#ffffff",
    flex: 1,
    fontSize: 14,
  },
  copyButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  viewAllText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
  },
  assetCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  assetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  assetBalance: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  assetNotOptedIn: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  optInBadge: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  optInBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  quickActionCard: {
    width: (width - 48) / 3,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickActionTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  quickActionSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    textAlign: "center",
  },
  nftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  nftCard: {
    width: (width - 40) / 2,
    marginBottom: 16,
  },
  nftCardContent: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  nftImageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  nftImage: {
    width: "100%",
    height: "100%",
  },
  nftImagePlaceholder: {
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#7C3AED",
    fontSize: 32,
    fontWeight: "bold",
  },
  nftInfo: {
    padding: 12,
  },
  nftName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  nftUnitName: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    marginTop: 16,
  },
  emptyStateContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyStateText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    textAlign: "center",
  },
})
