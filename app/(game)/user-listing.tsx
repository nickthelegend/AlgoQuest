"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Linking } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Shield, Sword, Heart, Zap, Tag, ExternalLink } from "lucide-react-native"
import { router } from "expo-router"
import { supabase } from "@/lib/supabase"
import * as SecureStore from "expo-secure-store"

interface Listing {
  id: string
  beast_id: string
  seller_id: string
  asset_id: string
  price: number
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
}

export default function UserListingsScreen() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadListings()
  }, [])

  const loadListings = async () => {
    try {
      setLoading(true)
      const walletAddress = await SecureStore.getItemAsync("walletAddress")
      if (!walletAddress) throw new Error("No wallet address found")

      // Get user ID from wallet address
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", walletAddress)
        .single()

      if (userError) throw userError
      if (!userData) throw new Error("User not found")

      // Get listings by user
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("seller_id", userData.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (error) throw error

      setListings(data || [])
    } catch (err) {
      console.error("Error loading listings:", err)
      setError("Failed to load your listings")
    } finally {
      setLoading(false)
    }
  }

  const viewOnExplorer = (assetId: string) => {
    if (assetId) {
      // Open in Algorand explorer
      // For testnet:
      const url = `https://testnet.explorer.perawallet.app/asset/${assetId}/`
      Linking.openURL(url)
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
          <Text style={styles.loadingText}>Loading your listings...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadListings}>
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
        <Text style={styles.title}>My Beasts on Sale</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {listings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You don't have any beasts listed for sale</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => router.push("/inventory")}>
              <Text style={styles.createButtonText}>Go to Inventory</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listingsGrid}>
            {listings.map((listing, index) => (
              <Animated.View key={listing.id} entering={FadeInDown.delay(200 + index * 100)} style={styles.listingCard}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/beast-sale",
                      params: {
                        id: listing.beast_id,
                        listingId: listing.id,
                      },
                    })
                  }
                  style={styles.cardContent}
                >
                  <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
                    <LinearGradient
                      colors={[`${getTierColor(listing.metadata.tier)}20`, "rgba(0, 0, 0, 0)"]}
                      style={StyleSheet.absoluteFill}
                    />
                  </BlurView>

                  <View style={styles.cardHeader}>
                    <View style={[styles.tierBadge, { backgroundColor: getTierColor(listing.metadata.tier) }]}>
                      <Text style={styles.tierText}>Tier {listing.metadata.tier}</Text>
                    </View>
                    <TouchableOpacity style={styles.explorerButton} onPress={() => viewOnExplorer(listing.asset_id)}>
                      <ExternalLink size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.imageContainer}>
                    <Image source={{ uri: listing.metadata.image_url }} style={styles.beastImage} resizeMode="cover" />
                  </View>

                  <Text style={styles.beastName}>{listing.metadata.name}</Text>

                  <View style={styles.statsContainer}>
                    <View style={styles.statRow}>
                      <Sword size={16} color="#EF4444" />
                      {renderStatBar(listing.metadata.stats.attack, "#EF4444")}
                    </View>
                    <View style={styles.statRow}>
                      <Shield size={16} color="#3B82F6" />
                      {renderStatBar(listing.metadata.stats.defense, "#3B82F6")}
                    </View>
                    <View style={styles.statRow}>
                      <Zap size={16} color="#F59E0B" />
                      {renderStatBar(listing.metadata.stats.speed, "#F59E0B")}
                    </View>
                    <View style={styles.statRow}>
                      <Heart size={16} color="#10B981" />
                      {renderStatBar(listing.metadata.stats.health, "#10B981")}
                    </View>
                  </View>

                  <View style={styles.priceContainer}>
                    <Tag size={16} color="#7C3AED" />
                    <Text style={styles.priceText}>{listing.price} $CAMP</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() =>
                      router.push({
                        pathname: "/beast-sale",
                        params: {
                          id: listing.beast_id,
                          listingId: listing.id,
                        },
                      })
                    }
                  >
                    <Text style={styles.manageButtonText}>Manage Listing</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            ))}
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
    paddingTop: 20,
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  listingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  listingCard: {
    width: "48%",
    marginBottom: 16,
  },
  cardContent: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  beastImage: {
    width: "100%",
    height: "100%",
  },
  beastName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  statsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  manageButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  manageButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
})

