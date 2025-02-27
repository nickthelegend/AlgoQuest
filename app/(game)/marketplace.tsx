"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Search, Filter, Shield, Zap, Heart, Sword, Crown, ChevronDown, Tag } from "lucide-react-native"
import { router } from "expo-router"

// Mock data for marketplace listings
const MOCK_LISTINGS = [
  {
    id: "1",
    name: "Thunder Dragon",
    seller: "Alex.eth",
    price: "1500",
    tier: 3,
    status: "active",
    image: "https://example.com/beast1.jpg",
    stats: {
      attack: 85,
      defense: 70,
      speed: 90,
      health: 75,
    },
  },
  {
    id: "2",
    name: "Shadow Wolf",
    seller: "Sarah.eth",
    price: "800",
    tier: 2,
    status: "active",
    image: "https://example.com/beast2.jpg",
    stats: {
      attack: 70,
      defense: 65,
      speed: 95,
      health: 60,
    },
  },
  // Add more mock listings...
]

export default function MarketplaceScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<"price" | "tier" | "recent">("recent")

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Marketplace</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search and Filter */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="rgba(255, 255, 255, 0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search beasts..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Filter Pills */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.filterPills}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
            <TouchableOpacity
              style={[styles.pill, selectedTier === 3 && styles.pillSelected]}
              onPress={() => setSelectedTier(3)}
            >
              <Crown size={16} color={selectedTier === 3 ? "#7C3AED" : "#ffffff"} />
              <Text style={[styles.pillText, selectedTier === 3 && styles.pillTextSelected]}>Tier 3</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, selectedTier === 2 && styles.pillSelected]}
              onPress={() => setSelectedTier(2)}
            >
              <Shield size={16} color={selectedTier === 2 ? "#3B82F6" : "#ffffff"} />
              <Text style={[styles.pillText, selectedTier === 2 && styles.pillTextSelected]}>Tier 2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, selectedTier === 1 && styles.pillSelected]}
              onPress={() => setSelectedTier(1)}
            >
              <Shield size={16} color={selectedTier === 1 ? "#94A3B8" : "#ffffff"} />
              <Text style={[styles.pillText, selectedTier === 1 && styles.pillTextSelected]}>Tier 1</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Sort Dropdown */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.sortContainer}>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortButtonText}>Sort by: {sortBy}</Text>
            <ChevronDown size={16} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Listings */}
        <View style={styles.listingsGrid}>
          {MOCK_LISTINGS.map((listing, index) => (
            <Animated.View key={listing.id} entering={FadeInDown.delay(500 + index * 100)} style={styles.listingCard}>
              <BlurView intensity={40} tint="dark" style={styles.cardContent}>
                <LinearGradient
                  colors={[`${getTierColor(listing.tier)}20`, "rgba(0, 0, 0, 0)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardHeader}>
                  <View style={[styles.tierBadge, { backgroundColor: getTierColor(listing.tier) }]}>
                    <Text style={styles.tierText}>Tier {listing.tier}</Text>
                  </View>
                  <TouchableOpacity style={styles.favoriteButton}>
                    <Heart size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: "/placeholder.svg?height=200&width=200" }}
                    style={styles.beastImage}
                    resizeMode="cover"
                  />
                </View>

                <Text style={styles.beastName}>{listing.name}</Text>
                <Text style={styles.sellerName}>{listing.seller}</Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statRow}>
                    <Sword size={16} color="#EF4444" />
                    {renderStatBar(listing.stats.attack, "#EF4444")}
                  </View>
                  <View style={styles.statRow}>
                    <Shield size={16} color="#3B82F6" />
                    {renderStatBar(listing.stats.defense, "#3B82F6")}
                  </View>
                  <View style={styles.statRow}>
                    <Zap size={16} color="#F59E0B" />
                    {renderStatBar(listing.stats.speed, "#F59E0B")}
                  </View>
                  <View style={styles.statRow}>
                    <Heart size={16} color="#10B981" />
                    {renderStatBar(listing.stats.health, "#10B981")}
                  </View>
                </View>

                <View style={styles.priceContainer}>
                  <Tag size={16} color="#7C3AED" />
                  <Text style={styles.priceText}>{listing.price} $CAMP</Text>
                </View>

                <TouchableOpacity style={styles.buyButton}>
                  <Text style={styles.buyButtonText}>Buy Now</Text>
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
          ))}
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
  searchContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterPills: {
    marginBottom: 16,
  },
  pillsContainer: {
    paddingHorizontal: 4,
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pillSelected: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
  },
  pillText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  pillTextSelected: {
    color: "#7C3AED",
    fontWeight: "600",
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
  favoriteButton: {
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
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
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
  buyButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  buyButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
})

