"use client"

import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, RefreshControl } from "react-native"
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
import { Copy, Send, Wallet, ArrowDown } from "lucide-react-native"
import { useState } from "react"

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
    // Add your refresh logic here
    setTimeout(() => setRefreshing(false), 2000)
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
              <Text style={styles.balanceLabel}>Total Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>2,450 CAMP</Text>
            <Text style={styles.balanceUsd}>≈ $245.00 USD</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.address} numberOfLines={1}>
                ALGO1234...ABCD
              </Text>
              <TouchableOpacity>
                <Copy size={16} color="#ffffff" />
              </TouchableOpacity>
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
                  <Image source={{ uri: nft.image }} style={styles.nftImage} />
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
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  address: {
    color: "#ffffff",
    flex: 1,
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
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
  },
  nftImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
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

