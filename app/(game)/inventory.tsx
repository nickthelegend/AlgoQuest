"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Filter, Shield, Sword, Heart, Zap, Tag, ChevronDown, Crown, Star } from "lucide-react-native"
import { router } from "expo-router"

// Mock data for inventory beasts
const MOCK_BEASTS = [
  {
    id: "1",
    name: "Thunder Dragon",
    tier: 3,
    rarity: "Legendary",
    level: 15,
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
    tier: 2,
    rarity: "Rare",
    level: 10,
    image: "https://example.com/beast2.jpg",
    stats: {
      attack: 70,
      defense: 65,
      speed: 95,
      health: 60,
    },
  },
  // Add more mock beasts...
]

export default function InventoryScreen() {
  const [sortBy, setSortBy] = useState<"tier" | "rarity" | "level">("tier")
  const [selectedBeast, setSelectedBeast] = useState<string | null>(null)

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

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "legendary":
        return "#FFD700"
      case "rare":
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
              <Text style={styles.statValue}>{MOCK_BEASTS.length}</Text>
              <Text style={styles.statLabel}>Total Beasts</Text>
            </View>
            <View style={styles.statItem}>
              <Star size={24} color="#FFD700" />
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Legendary</Text>
            </View>
            <View style={styles.statItem}>
              <Tag size={24} color="#3B82F6" />
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>For Sale</Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* Beast Grid */}
        <View style={styles.beastGrid}>
          {MOCK_BEASTS.map((beast, index) => (
            <Animated.View key={beast.id} entering={FadeInDown.delay(400 + index * 100)} style={styles.beastCard}>
              <TouchableOpacity
                onPress={() => setSelectedBeast(selectedBeast === beast.id ? null : beast.id)}
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
                  <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(beast.rarity) }]}>
                    <Text style={styles.rarityText}>{beast.rarity}</Text>
                  </View>
                </View>

                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: "/placeholder.svg?height=200&width=200" }}
                    style={styles.beastImage}
                    resizeMode="cover"
                  />
                </View>

                <Text style={styles.beastName}>{beast.name}</Text>
                <Text style={styles.beastLevel}>Level {beast.level}</Text>

                {selectedBeast === beast.id && (
                  <Animated.View entering={FadeInDown} style={styles.statsContainer}>
                    <View style={styles.statRow}>
                      <Sword size={16} color="#EF4444" />
                      {renderStatBar(beast.stats.attack, "#EF4444")}
                    </View>
                    <View style={styles.statRow}>
                      <Shield size={16} color="#3B82F6" />
                      {renderStatBar(beast.stats.defense, "#3B82F6")}
                    </View>
                    <View style={styles.statRow}>
                      <Zap size={16} color="#F59E0B" />
                      {renderStatBar(beast.stats.speed, "#F59E0B")}
                    </View>
                    <View style={styles.statRow}>
                      <Heart size={16} color="#10B981" />
                      {renderStatBar(beast.stats.health, "#10B981")}
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#7C3AED" }]}>
                        <Text style={styles.actionButtonText}>List for Sale</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#EF4444" }]}>
                        <Text style={styles.actionButtonText}>Battle</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                )}
              </TouchableOpacity>
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
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
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
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
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
    padding: 12,
    paddingBottom: 4,
  },
  beastLevel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    padding: 12,
    paddingTop: 0,
  },
  statsContainer: {
    padding: 12,
    paddingTop: 0,
    gap: 8,
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
    marginTop: 12,
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

