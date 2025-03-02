"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Filter, Shield, Sword, Heart, Zap, Tag, ChevronDown, Crown, Star } from "lucide-react-native"
import { router } from "expo-router"
import { supabase } from "@/lib/supabase"
import * as SecureStore from "expo-secure-store"

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
  metadata: {
    name: string
    tier: number
    type: string
    stats: {
      attack: number
      defense: number
      speed: number
      health: number
    }
    abilities: string[]
    image_url: string
    created_at: string
    description: string
  }
  created_at: string
  for_sale?: boolean
  price?: number
}

export default function InventoryScreen() {
  const [sortBy, setSortBy] = useState<"tier" | "created" | "price">("tier")
  const [selectedBeast, setSelectedBeast] = useState<string | null>(null)
  const [beasts, setBeasts] = useState<Beast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBeasts()
  }, [])

  const loadBeasts = async () => {
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

      // Get beasts owned by user
      const { data: beastsData, error: beastsError } = await supabase
        .from("beasts")
        .select("*")
        .eq("owner_id", userData.id)
        .order("created_at", { ascending: false })

      if (beastsError) throw beastsError

      setBeasts(beastsData || [])
    } catch (err) {
      console.error("Error loading beasts:", err)
      setError("Failed to load beasts")
    } finally {
      setLoading(false)
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

  const getLegendaryCount = () => {
    return beasts.filter((beast) => beast.tier === 3).length
  }

  const getForSaleCount = () => {
    return beasts.filter((beast) => beast.for_sale).length
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading your beasts...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBeasts}>
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
        <Text style={styles.title}>My Beasts</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sort Controls */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.sortContainer}>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortButtonText}>Sort by: {sortBy}</Text>
            <ChevronDown size={16} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Overview */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsOverview}>
          <BlurView intensity={40} tint="dark" style={styles.statsCard}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.statItem}>
              <Crown size={24} color="#7C3AED" />
              <Text style={styles.statValue}>{beasts.length}</Text>
              <Text style={styles.statLabel}>Total Beasts</Text>
            </View>
            <View style={styles.statItem}>
              <Star size={24} color="#FFD700" />
              <Text style={styles.statValue}>{getLegendaryCount()}</Text>
              <Text style={styles.statLabel}>Legendary</Text>
            </View>
            <View style={styles.statItem}>
              <Tag size={24} color="#3B82F6" />
              <Text style={styles.statValue}>{getForSaleCount()}</Text>
              <Text style={styles.statLabel}>For Sale</Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* Beast Grid */}
        <View style={styles.beastGrid}>
          {beasts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No beasts found</Text>
              <TouchableOpacity style={styles.createButton} onPress={() => router.push("/beast-creation")}>
                <Text style={styles.createButtonText}>Create Your First Beast</Text>
              </TouchableOpacity>
            </View>
          ) : (
            beasts.map((beast, index) => (
              <Animated.View key={beast.id} entering={FadeInDown.delay(400 + index * 100)} style={styles.beastCard}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/beast/[id]",
                      params: { id: beast.id },
                    })
                  }
                  style={styles.beastCardContent}
                >
                  <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
                    <LinearGradient
                      colors={[`${getTierColor(beast.tier)}20`, "rgba(0, 0, 0, 0)"]}
                      style={StyleSheet.absoluteFill}
                    />
                  </BlurView>

                  <View style={styles.cardHeader}>
                    <View style={[styles.tierBadge, { backgroundColor: getTierColor(beast.tier) }]}>
                      <Text style={styles.tierText}>Tier {beast.tier}</Text>
                    </View>
                    {beast.for_sale && (
                      <View style={styles.forSaleBadge}>
                        <Tag size={12} color="#10B981" />
                        <Text style={styles.forSaleText}>{beast.price} $CAMP</Text>
                      </View>
                    )}
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

                  <View style={styles.actionButtons}>
                    {!beast.for_sale && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: "#7C3AED" }]}
                        onPress={() => router.push({
                          pathname: "/beast/[id]/sell",
                          params: { id: beast.id },
                        })}
                      >
                        <Text style={styles.actionButtonText}>List for Sale</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
                      onPress={() => router.push("/find-players")}
                    >
                      <Text style={styles.actionButtonText}>Battle</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </View>
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
    justifyContent: "space-between",
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  filterButton: {
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
  sortContainer: {
    marginBottom: 16,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  sortButtonText: {
    color: "#ffffff",
    fontSize: 14,
  },
  statsOverview: {
    marginBottom: 24,
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  statItem: {
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
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
  beastGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  beastCard: {
    width: "48%",
    marginBottom: 16,
  },
  beastCardContent: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  forSaleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  forSaleText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
    marginBottom: 12,
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
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
})

