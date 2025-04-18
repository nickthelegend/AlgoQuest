"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Tag, Shield, Sword, Heart, Zap, ExternalLink, AlertCircle } from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import { supabase } from "@/lib/supabase"
import * as SecureStore from "expo-secure-store"
import * as Linking from "expo-linking"
import algosdk from "algosdk"

interface Beast {
  id: string
  name: string
  owner_id: string
  asset_id: string
  tier: number
  image_url: string
  ipfs_url: string
  allocated_stats: {
    attack: number
    defense: number
    speed: number
    health: number
  }
  metadata: any
}

interface Listing {
  id: string
  beast_id: string
  seller_id: string
  asset_id: string
  price: number
  app_id: string
  app_address: string
  status: "active" | "sold" | "cancelled"
  created_at: string
  metadata: {
    name: string
    tier: number
    stats: {
      attack: number
      defense: number
      speed: number
      health: number
    }
    image_url: string
  }
  seller: {
    full_name: string
    wallet_address: string
  }
}

export default function BuyScreen() {
  const params = useLocalSearchParams()
  const { listingId, beastId, assetId, price, sellerId } = params

  const [listing, setListing] = useState<Listing | null>(null)
  const [beast, setBeast] = useState<Beast | null>(null)
  const [loading, setLoading] = useState(true)
  const [buyingInProgress, setBuyingInProgress] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    loadWalletAddress()
  }, [])

  const loadWalletAddress = async () => {
    const address = await SecureStore.getItemAsync("walletAddress")
    setWalletAddress(address)
  }

  const loadData = async () => {
    try {
      setLoading(true)

      if (!listingId || !beastId) {
        throw new Error("Missing required parameters")
      }

      console.log("Loading listing with ID:", listingId)
      console.log("Loading beast with ID:", beastId)

      // Load listing details with seller info
      const { data: listingData, error: listingError } = await supabase
        .from("marketplace_listings")
        .select(`
          *,
          seller:seller_id(full_name, wallet_address)
        `)
        .eq("id", listingId)
        .single()

      if (listingError) {
        console.error("Listing error:", listingError)
        throw listingError
      }

      if (!listingData) {
        throw new Error("Listing not found")
      }

      setListing(listingData)

      // Load beast details
      const { data: beastData, error: beastError } = await supabase
        .from("beasts")
        .select("*")
        .eq("id", beastId)
        .single()

      if (beastError) {
        console.error("Beast error:", beastError)
        throw beastError
      }

      if (!beastData) {
        throw new Error("Beast not found")
      }

      setBeast(beastData)
    } catch (err) {
      console.error("Error loading data:", err)
      Alert.alert("Error", "Failed to load listing details")
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async () => {
    if (!walletAddress) {
      Alert.alert("Error", "Please connect your wallet first")
      return
    }

    if (!listing || !beast) {
      Alert.alert("Error", "Listing or beast data is missing")
      return
    }

    try {
      setBuyingInProgress(true)

      // Get wallet mnemonic
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (!mnemonic) throw new Error("No mnemonic found")

      const account = algosdk.mnemonicToSecretKey(mnemonic)

      // Initialize Algorand client
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")

      // Get suggested parameters
      const suggestedParams = await algodClient.getTransactionParams().do()

      // Implement the buying logic here
      // This would include:
      // 1. Creating an Algorand transaction to the app
      // 2. Signing it with the user's wallet
      // 3. Updating the marketplace listing status
      // 4. Transferring the NFT
// const amount = 10; // 10,000,000 microAlgos
const atc = new algosdk.AtomicTransactionComposer();

// Create the AssetTransferTxn:
const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
  sender: walletAddress,              // the account sending the payment
  receiver:listing.app_address,            // the app's address, as expected by your contract
  assetIndex: 734399300,  // the asset ID you expect to be transferred
  amount: Number(listing.price),                        // the amount to transfer (10 algos in microAlgos)
  suggestedParams,               // obtained from algod
});

// If you are using an atomic transaction composer (ATC),
// you need to wrap it with its signer:
const assetTransferTxnWithSigner = {
  txn: assetTransferTxn,
  signer: algosdk.makeBasicAccountTransactionSigner(account),
};

// Then pass assetTransferTxnWithSigner as the argument for your ABI method call:
atc.addMethodCall({
  appID: Number(listing.app_id),
  method: new algosdk.ABIMethod({ name: "buyNFT", desc: "", args: [{ type: "axfer", name: "ebaTxn", desc: "" }], returns: { type: "void", desc: "" } }), // your ABI method (buyNFT)
  signer: algosdk.makeBasicAccountTransactionSigner(account),
  methodArgs: [assetTransferTxnWithSigner], 
  appForeignAssets:[Number(assetId)],
  sender: account.addr,
  suggestedParams: { ...suggestedParams, fee: Number(30) },
});
atc.addMethodCall({
    appID: Number(listing.app_id),
    method: new algosdk.ABIMethod({ name: "recieveNFT", desc: "", args: [{ type: "uint64", name: "asset", desc: "" }], returns: { type: "void", desc: "" } }), // your ABI method (buyNFT)
    signer: algosdk.makeBasicAccountTransactionSigner(account),
    methodArgs: [Number(assetId)], 
    sender: account.addr,
    suggestedParams: { ...suggestedParams, fee: Number(30) },
  });
  

const result = await atc.execute(algodClient, 4);
for (const mr of result.methodResults) {
  console.log(`${mr.returnValue}`);
}














      Alert.alert("Purchase Successful", "You have successfully purchased this beast!", [
        {
          text: "View in Inventory",
          onPress: () => router.push("/inventory"),
        },
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ])






      // For now, we'll just show a success message
      // In a real implementation, you would execute the blockchain transaction
      // and update the database after confirmation
    } catch (error) {
      console.error("Error buying NFT:", error)
      Alert.alert("Error", "Failed to complete purchase")
    } finally {
      setBuyingInProgress(false)
    }
  }

  const viewOnExplorer = (assetId: string) => {
    Linking.openURL(`https://testnet.explorer.perawallet.app/asset/${assetId}/`)
  }

  const renderStatBar = (value: number, color: string) => (
    <View style={styles.statBarContainer}>
      <View style={[styles.statBarFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  )

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 3:
        return "#7C3AED"
      case 2:
        return "#3B82F6"
      default:
        return "#94A3B8"
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading beast details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!listing || !beast) return null

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Buy Beast</Text>
        <TouchableOpacity style={styles.explorerButton} onPress={() => viewOnExplorer(assetId as string)}>
          <ExternalLink size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.content}>
          <BlurView intensity={40} tint="dark" style={styles.card}>
            <LinearGradient
              colors={[`${getTierColor(beast.tier)}20`, "rgba(0, 0, 0, 0)"]}
              style={StyleSheet.absoluteFill}
            />

            {/* Beast Preview */}
            <View style={styles.beastPreview}>
              <View style={styles.tierBadgeContainer}>
                <View style={[styles.tierBadge, { backgroundColor: getTierColor(beast.tier) }]}>
                  <Text style={styles.tierText}>Tier {beast.tier}</Text>
                </View>
              </View>

              <Image source={{ uri: beast.image_url }} style={styles.beastImage} />
              <Text style={styles.beastName}>{beast.name}</Text>
              <Text style={styles.sellerName}>Sold by {listing.seller.full_name}</Text>

              <View style={styles.statsContainer}>
                <View style={styles.statRow}>
                  <Sword size={16} color="#EF4444" />
                  <Text style={styles.statLabel}>Attack</Text>
                  {renderStatBar(beast.allocated_stats.attack, "#EF4444")}
                </View>
                <View style={styles.statRow}>
                  <Shield size={16} color="#3B82F6" />
                  <Text style={styles.statLabel}>Defense</Text>
                  {renderStatBar(beast.allocated_stats.defense, "#3B82F6")}
                </View>
                <View style={styles.statRow}>
                  <Zap size={16} color="#F59E0B" />
                  <Text style={styles.statLabel}>Speed</Text>
                  {renderStatBar(beast.allocated_stats.speed, "#F59E0B")}
                </View>
                <View style={styles.statRow}>
                  <Heart size={16} color="#10B981" />
                  <Text style={styles.statLabel}>Health</Text>
                  {renderStatBar(beast.allocated_stats.health, "#10B981")}
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Purchase Information</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Price</Text>
                <View style={styles.priceContainer}>
                  <Tag size={16} color="#7C3AED" />
                  <Text style={styles.priceText}>{price} $CAMP</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Asset ID</Text>
                <Text style={styles.infoValue}>{assetId}</Text>
              </View>

              <View style={styles.warningBox}>
                <AlertCircle size={20} color="#F59E0B" />
                <Text style={styles.warningText}>
                  Once purchased, this beast will be transferred to your wallet and you'll be able to use it in battles
                  and quests.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.buyButton, buyingInProgress && styles.buyButtonDisabled]}
              onPress={handleBuy}
              disabled={buyingInProgress}
            >
              <Text style={styles.buyButtonText}>
                {buyingInProgress ? "Processing Purchase..." : "Confirm Purchase"}
              </Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 20,
  },
  backButton: {
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
  },
  explorerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
  },
  content: {
    flex: 1,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  beastPreview: {
    alignItems: "center",
    marginBottom: 24,
  },
  tierBadgeContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tierText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  beastImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  beastName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 16,
  },
  statsContainer: {
    width: "100%",
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    width: 60,
    fontSize: 14,
    color: "#ffffff",
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 24,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
  },
  infoValue: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  warningText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
  },
  buyButton: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})

