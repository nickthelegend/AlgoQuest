"use client"

import "react-native-get-random-values"
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, RefreshControl, Alert } from "react-native"
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
import { Copy, Send, Wallet, ArrowDown, Check } from "lucide-react-native"
import { useState, useEffect } from "react"
import * as Clipboard from "expo-clipboard"
import * as SecureStore from "expo-secure-store"
import algosdk from "algosdk"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width * 0.9

// Mock data - replace with real data from Algorand SDK
const mockNFTs = [
  {
    id: 1,
    name: "Campus Pioneer",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7BC5DA1ABA-D239-47BF-86A4-7F62F953B61C%7D-oDh5OOGSt6RLj6h8lnARTFRGEVF7dC.png",
    rarity: "Rare",
  },
  {
    id: 2,
    name: "Quest Master",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7BC5DA1ABA-D239-47BF-86A4-7F62F953B61C%7D-oDh5OOGSt6RLj6h8lnARTFRGEVF7dC.png",
    rarity: "Epic",
  },
  {
    id: 3,
    name: "Social Butterfly",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7BC5DA1ABA-D239-47BF-86A4-7F62F953B61C%7D-oDh5OOGSt6RLj6h8lnARTFRGEVF7dC.png",
    rarity: "Common",
  },
]

export default function WalletScreen() {
  const scrollY = useSharedValue(0)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [publicAddress, setPublicAddress] = useState<string>("")
  const [algoBalance, setAlgoBalance] = useState<number>(0)
  const [algoPrice, setAlgoPrice] = useState<number>(0)

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
        // Convert mnemonic to secret key and get address
        const account = algosdk.mnemonicToSecretKey(mnemonic)
        // Ensure we're getting the address as a string
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
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")
      const accountInfo = await algodClient.accountInformation(address).do()
      // Convert microAlgos to Algos (1 Algo = 1,000,000 microAlgos)
      console.log(accountInfo.amount.toString())
      setAlgoBalance(accountInfo.amount.toString() / 1000000)
    } catch (error) {
      console.error("Error fetching ALGO balance:", error)
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

  // Format address for display
  // const formatAddress = (address: string) => {
  //   if (!address) return "Loading..."
  //   if (address.length <= 12) return address
  //   return `${address.slice(0, 6)}...${address.slice(-6)}`
  // }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
      >
        {/* Balance Cards */}
        <Animated.View entering={FadeInDown.delay(200)} style={[styles.header, headerStyle]}>
          <BlurView intensity={40} tint="dark" style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Wallet size={24} color="#ffffff" />
              <Text style={styles.balanceLabel}>ALGO Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>{algoBalance.toFixed(3)} ALGO</Text>
            <Text style={styles.balanceUsd}>≈ ${(algoBalance * algoPrice).toFixed(2)} USD</Text>

            <View style={styles.addressSection}>
              <Text style={styles.addressLabel}>Wallet Address</Text>
              <View style={styles.addressContainer}>
                <Text style={styles.address} numberOfLines={1}>
                  {(publicAddress)}
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
              <TouchableOpacity style={styles.actionButton}>
                <Send size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>

        {/* NFT Gallery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NFT Gallery</Text>
          <View style={styles.nftGrid}>
            {mockNFTs.map((nft, index) => (
              <Animated.View key={nft.id} entering={FadeInUp.delay(400 + index * 200)} style={styles.nftCard}>
                <BlurView intensity={40} tint="dark" style={styles.nftCardContent}>
                  <View style={styles.nftInfo}>
                    <Text style={styles.nftName}>{nft.name}</Text>
                    <Text style={styles.nftRarity}>{nft.rarity}</Text>
                  </View>
                </BlurView>
              </Animated.View>
            ))}
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
    gap: 16,
  },
  nftCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  nftCardContent: {
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
  },
  nftInfo: {
    gap: 4,
  },
  nftName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  nftRarity: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
})

