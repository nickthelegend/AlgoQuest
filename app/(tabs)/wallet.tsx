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
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, {
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated"
import { BlurView } from "expo-blur"
import { Copy, Send, Wallet, ArrowDown, Check, Coins, History } from "lucide-react-native"
import { useState, useEffect } from "react"
import * as Clipboard from "expo-clipboard"
import * as SecureStore from "expo-secure-store"
import algosdk from "algosdk"
import { QUEST_COIN_ASSET_ID } from "@/lib/algoClient"
import { router } from "expo-router"
import QRCode from "react-native-qrcode-svg"

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
  const scrollY = useSharedValue(0)
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

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(scrollY.value, [0, 100], [0, -50], "clamp"),
        },
      ],
      opacity: interpolate(scrollY.value, [0, 100], [1, 0], "clamp"),
    }
  })

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

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
      >
        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(200)} style={[styles.header, headerStyle]}>
          <BlurView intensity={40} tint="dark" style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Wallet size={24} color="#ffffff" />
              <Text style={styles.balanceLabel}>ALGO Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>{algoBalance.toFixed(3)} ALGO</Text>
            <Text style={styles.balanceUsd}>≈ ${(algoBalance * algoPrice).toFixed(2)} USD</Text>

            <TouchableOpacity
              style={styles.dispenserButton}
              onPress={() => Linking.openURL("https://bank.testnet.algorand.network/")}
            >
              <Text style={styles.dispenserText}>Want Algos?</Text>
              <Text style={styles.dispenserHighlight}>Head to Algorand Dispenser</Text>
            </TouchableOpacity>

            {/* QR Code */}
            {publicAddress && (
              <View style={styles.qrCodeContainer}>
                <QRCode value={publicAddress} size={150} color="#ffffff" backgroundColor="transparent" />
                <Text style={styles.qrCodeText}>Scan to get my wallet address</Text>
              </View>
            )}

            <View style={styles.addressSection}>
              <Text style={styles.addressLabel}>Wallet Address</Text>
              <View style={styles.addressContainer}>
                <Text style={styles.address} numberOfLines={1}>
                  {publicAddress}
                </Text>
                <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                  {copied ? <Check size={16} color="#4ADE80" /> : <Copy size={16} color="#ffffff" />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <ArrowDown size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Receive</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/send")}>
                <Send size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Send</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.transactionSection}>
              <View style={styles.transactionCount}>
                <Text style={styles.transactionLabel}>Total Transactions</Text>
                <Text style={styles.transactionNumber}>{transactionCount}</Text>
              </View>
              <TouchableOpacity style={styles.viewTransactionsButton} onPress={() => router.push("/transactions")}>
                <History size={20} color="#ffffff" />
                <Text style={styles.viewTransactionsText}>View Transactions</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>

        {/* Quest Coins Card */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.header}>
          <BlurView intensity={40} tint="dark" style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Coins size={24} color="#ffffff" />
              <Text style={styles.balanceLabel}>Quest Coins</Text>
            </View>

            {isOptedIn ? (
              <>
                <Text style={styles.balanceAmount}>{questCoinBalance} Q</Text>
                <Text style={styles.balanceUsd}>Quest Coins can be earned by completing quests</Text>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.optInButton, optInLoading && styles.optInButtonDisabled]}
                onPress={handleOptIn}
                disabled={optInLoading}
              >
                <Text style={styles.optInButtonText}>{optInLoading ? "Opting In..." : "Opt In to Quest Coins"}</Text>
              </TouchableOpacity>
            )}
          </BlurView>
        </Animated.View>

        {/* NFT Gallery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NFT Gallery</Text>
          <View style={styles.nftGrid}>
            {loading ? (
              <Text style={styles.loadingText}>Loading NFTs...</Text>
            ) : nfts.length > 0 ? (
              nfts.map((nft, index) => (
                <Animated.View key={nft.id} entering={FadeInUp.delay(400 + index * 200)} style={styles.nftCard}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/nft-details",
                        params: { assetId: nft.id },
                      })
                    }
                  >
                    <BlurView intensity={40} tint="dark" style={styles.nftCardContent}>
                      <View style={styles.nftImageContainer}>
                        {nft.image ? (
                          <Image source={{ uri: nft.image }} style={styles.nftImage} resizeMode="cover" />
                        ) : (
                          <View style={[styles.nftImage, styles.nftImagePlaceholder]}>
                            <Text style={styles.placeholderText}>No Image</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.nftInfo}>
                        <Text style={styles.nftName} numberOfLines={1}>
                          {nft.name}
                        </Text>
                        <Text style={styles.nftUnitName}>{nft.unitName}</Text>
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                </Animated.View>
              ))
            ) : (
              <Text style={styles.emptyText}>No NFTs found</Text>
            )}
          </View>
        </View>
      </Animated.ScrollView>
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
    paddingTop: 10,
  },
  header: {
    marginBottom: 24,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 4,
  },
  balanceUsd: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    marginBottom: 16,
  },
  qrCodeContainer: {
    alignItems: "center",
    marginVertical: 20,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  qrCodeText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    marginTop: 12,
  },
  addressSection: {
    marginBottom: 16,
  },
  addressLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  address: {
    color: "#ffffff",
    flex: 1,
    fontSize: 14,
  },
  copyButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  nftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  nftCard: {
    width: NFT_SIZE,
    borderRadius: 16,
    overflow: "hidden",
  },
  nftCardContent: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    overflow: "hidden",
  },
  nftImageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  nftImage: {
    width: "100%",
    height: "100%",
  },
  nftImagePlaceholder: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  placeholderText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
    textAlign: "center",
  },
  nftInfo: {
    padding: 12,
    gap: 4,
  },
  nftName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  nftUnitName: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    textAlign: "center",
    width: "100%",
    marginTop: 20,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    textAlign: "center",
    width: "100%",
    marginTop: 20,
  },
  dispenserButton: {
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  dispenserText: {
    color: "#ffffff",
    fontSize: 14,
    opacity: 0.8,
  },
  dispenserHighlight: {
    color: "#7C3AED",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  optInButton: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  optInButtonDisabled: {
    opacity: 0.6,
  },
  optInButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  transactionSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  transactionCount: {
    marginBottom: 12,
  },
  transactionLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  transactionNumber: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  viewTransactionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  viewTransactionsText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
})

