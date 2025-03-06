"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator , ScrollView, Linking} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Shield, Sword, Heart, Zap, Tag, ExternalLink, AlertTriangle } from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import { supabase } from "@/lib/supabase"
import algosdk from "algosdk"
import * as SecureStore from "expo-secure-store"

const METHODS = [
    new algosdk.ABIMethod({ name: "cancelSell", desc: "", args: [], returns: { type: "void", desc: "" } }),
  
  ];
  
interface Beast {
  id: string
  name: string
  owner_id: string
  asset_id: string
  tier: number
  image_url: string
  allocated_stats: {
    attack: number
    defense: number
    speed: number
    health: number
  }
}

interface Listing {
  id: string
  beast_id: string
  seller_id: string
  asset_id: string
  price: number
  status: "active" | "sold" | "cancelled"
  created_at: string
  app_id: string
  app_address: string
}

export default function BeastSaleScreen() {
  const params = useLocalSearchParams()
  const { id, listingId } = params

  const [beast, setBeast] = useState<Beast | null>(null)
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [removingFromSale, setRemovingFromSale] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBeastAndListing()
  }, [id, listingId])

  const loadBeastAndListing = async () => {
    try {
      setLoading(true)

      // Load beast details
      const { data: beastData, error: beastError } = await supabase.from("beasts").select("*").eq("id", id).single()

      if (beastError) throw beastError

      // Load listing details
      const { data: listingData, error: listingError } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("id", listingId)
        .single()

      if (listingError) throw listingError

      setBeast(beastData)
      setListing(listingData)
    } catch (err) {
      console.error("Error loading beast details:", err)
      setError("Failed to load beast details")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromSale = async () => {
    try {
      setRemovingFromSale(true)

      // Confirm with user
    //   Alert.alert("Remove from Sale", "Are you sure you want to remove this beast from the marketplace?", [
    //     {
    //       text: "Cancel",
    //       style: "cancel",
    //       onPress: () => setRemovingFromSale(false),
    //     },
    //     {
    //       text: "Remove",
    //       style: "destructive",
    //       onPress: async () => {
    //         // Update listing status to cancelled
    //         const { error: updateError } = await supabase
    //           .from("marketplace_listings")
    //           .update({ status: "cancelled" })
    //           .eq("id", listingId)

    //         if (updateError) throw updateError

    //         // Update beast for_sale status
    //         const { error: beastUpdateError } = await supabase
    //           .from("beasts")
    //           .update({ for_sale: false, price: null })
    //           .eq("id", id)

    //         if (beastUpdateError) throw beastUpdateError

    //         Alert.alert("Success", "Beast removed from marketplace")
    //         router.replace("/inventory")
    //       },
    //     },
    //   ])
    const walletAddress = await SecureStore.getItemAsync("walletAddress")
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (!mnemonic) throw new Error("No mnemonic found")

      const account = algosdk.mnemonicToSecretKey(mnemonic)
    const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")

    //       // 5. Get suggested parameters
          const suggestedParams = await algodClient.getTransactionParams().do()
    
    const txn2 = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account.addr,
        appIndex: Number(listing?.app_id),
        appArgs: [
            algosdk.getMethodByName(METHODS, 'cancelSell').getSelector(),
        ],
        foreignAssets: [Number(listing?.asset_id)],

        suggestedParams: { ...suggestedParams, fee: Number(30) },
    });


    const signedTxn = txn2.signTxn(account.sk)
      const { txid } = await algodClient.sendRawTransaction(signedTxn).do()
      
      await algosdk.waitForConfirmation(algodClient, txid, 4)

    } catch (err) {
      console.error("Error removing from sale:", err)
      Alert.alert("Error", "Failed to remove beast from sale")
    } finally {
      setRemovingFromSale(false)
    }
  }

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

  const renderStatBar = (value: number, color: string) => (
    <View style={styles.statBarContainer}>
      <View style={[styles.statBarFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  )

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

  if (error || !beast || !listing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Beast or listing not found"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBeastAndListing}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Beast Listing</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.beastCard}>
          <BlurView intensity={40} tint="dark" style={styles.cardContent}>
            <LinearGradient
              colors={[`${getTierColor(beast.tier)}20`, "rgba(0, 0, 0, 0)"]}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.cardHeader}>
              <View style={[styles.tierBadge, { backgroundColor: getTierColor(beast.tier) }]}>
                <Text style={styles.tierText}>Tier {beast.tier}</Text>
              </View>
              <TouchableOpacity
                style={styles.explorerButton}
                onPress={() => Linking.openURL(`https://testnet.explorer.perawallet.app/asset/${beast.asset_id}/`)}
              >
                <ExternalLink size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
              <Image source={{ uri: beast.image_url }} style={styles.beastImage} resizeMode="cover" />
            </View>

            <Text style={styles.beastName}>{beast.name}</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Sword size={16} color="#EF4444" />
                {renderStatBar(beast.allocated_stats.attack, "#EF4444")}
              </View>
              <View style={styles.statRow}>
                <Shield size={16} color="#3B82F6" />
                {renderStatBar(beast.allocated_stats.defense, "#3B82F6")}
              </View>
              <View style={styles.statRow}>
                <Zap size={16} color="#F59E0B" />
                {renderStatBar(beast.allocated_stats.speed, "#F59E0B")}
              </View>
              <View style={styles.statRow}>
                <Heart size={16} color="#10B981" />
                {renderStatBar(beast.allocated_stats.health, "#10B981")}
              </View>
            </View>

            <View style={styles.priceContainer}>
              <Tag size={20} color="#7C3AED" />
              <Text style={styles.priceText}>{listing.price} $CAMP</Text>
            </View>

            <View style={styles.listingInfoContainer}>
              <Text style={styles.listingInfoLabel}>Listed on:</Text>
              <Text style={styles.listingInfoValue}>{new Date(listing.created_at).toLocaleDateString()}</Text>
            </View>

            <View style={styles.warningContainer}>
              <AlertTriangle size={20} color="#F59E0B" />
              <Text style={styles.warningText}>
                Removing this beast from sale will cancel the listing on the marketplace.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.removeButton, removingFromSale && styles.removeButtonDisabled]}
              onPress={handleRemoveFromSale}
              disabled={removingFromSale}
            >
              {removingFromSale ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.removeButtonText}>Remove from Sale</Text>
              )}
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  scrollContent: {
    padding: 16,
  },
  beastCard: {
    width: "100%",
    marginBottom: 16,
  },
  cardContent: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  explorerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  beastImage: {
    width: "100%",
    height: "100%",
  },
  beastName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
    textAlign: "center",
  },
  statsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    paddingVertical: 12,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  listingInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  listingInfoLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  listingInfoValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  removeButtonDisabled: {
    opacity: 0.5,
  },
  removeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})

