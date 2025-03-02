"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import {
  ArrowLeft,
  Shield,
  Sword,
  Heart,
  Zap,
  Tag,
  Crown,
  Star,
  Flame,
  Cloud,
  Mountain,
  Wind,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import { supabase } from "@/lib/supabase"

interface Ability {
  id: string
  name: string
  type: "attack" | "heal" | "buff" | "debuff"
  element: "fire" | "water" | "earth" | "wind" | "light" | "dark"
  power: number
  accuracy: number
  energy_cost: number
  cooldown: number
  description: string
}

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

export default function BeastDetailsScreen() {
  const { id } = useLocalSearchParams()
  const [beast, setBeast] = useState<Beast | null>(null)
  const [abilities, setAbilities] = useState<Ability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBeastDetails()
  }, [])

  const loadBeastDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch beast details
      const { data: beastData, error: beastError } = await supabase.from("beasts").select("*").eq("id", id).single()

      if (beastError) throw beastError
      if (!beastData) throw new Error("Beast not found")

      setBeast(beastData)

      // Fetch abilities
      if (beastData.metadata.abilities && beastData.metadata.abilities.length > 0) {
        const { data: abilitiesData, error: abilitiesError } = await supabase
          .from("beast_abilities")
          .select("*")
          .in("id", beastData.metadata.abilities)

        if (abilitiesError) throw abilitiesError
        setAbilities(abilitiesData || [])
      }
    } catch (err) {
      console.error("Error loading beast details:", err)
      setError("Failed to load beast details")
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

  const getElementIcon = (element: string) => {
    switch (element.toLowerCase()) {
      case "fire":
        return Flame
      case "water":
        return Cloud
      case "earth":
        return Mountain
      case "wind":
        return Wind
      case "light":
        return Sun
      case "dark":
        return Moon
      default:
        return Sparkles
    }
  }

  const getElementColor = (element: string) => {
    switch (element.toLowerCase()) {
      case "fire":
        return "#EF4444"
      case "water":
        return "#3B82F6"
      case "earth":
        return "#92400E"
      case "wind":
        return "#10B981"
      case "light":
        return "#F59E0B"
      case "dark":
        return "#6B21A8"
      default:
        return "#94A3B8"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "attack":
        return "#EF4444"
      case "heal":
        return "#10B981"
      case "buff":
        return "#7C3AED"
      case "debuff":
        return "#F59E0B"
      default:
        return "#94A3B8"
    }
  }

  const renderStatBar = (value: number, color: string) => (
    <View style={styles.statBarContainer}>
      <View style={[styles.statBarFill, { width: `${value}%`, backgroundColor: color }]} />
      <Text style={styles.statValue}>{value}</Text>
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

  if (error || !beast) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Beast not found"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBeastDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Beast Details</Text>
          {!beast.for_sale && (
            <TouchableOpacity
            style={styles.sellButton}
            onPress={() =>
              router.push({
                pathname: "/beast/[id]/sell",
                params: { id: beast.id },
              })
            }
          >
              <Tag size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Beast Card */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.beastCard}>
          <BlurView intensity={40} tint="dark" style={styles.cardContent}>
            <LinearGradient
              colors={[`${getTierColor(beast.tier)}20`, "rgba(0, 0, 0, 0)"]}
              style={StyleSheet.absoluteFill}
            />

            {/* Beast Header */}
            <View style={styles.beastHeader}>
              <View style={styles.beastInfo}>
                <Text style={styles.beastName}>{beast.name}</Text>
                <View style={[styles.tierBadge, { backgroundColor: getTierColor(beast.tier) }]}>
                  <Crown size={12} color="#ffffff" />
                  <Text style={styles.tierText}>Tier {beast.tier}</Text>
                </View>
              </View>
              {beast.for_sale && (
                <View style={styles.priceTag}>
                  <Tag size={16} color="#10B981" />
                  <Text style={styles.priceText}>{beast.price} $CAMP</Text>
                </View>
              )}
            </View>

            {/* Beast Image */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: beast.image_url }} style={styles.beastImage} resizeMode="cover" />
            </View>

            {/* Stats Section */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statRow}>
                  <View style={styles.statLabel}>
                    <Sword size={20} color="#EF4444" />
                    <Text style={styles.statText}>Attack</Text>
                  </View>
                  {renderStatBar(beast.allocated_stats.attack, "#EF4444")}
                </View>

                <View style={styles.statRow}>
                  <View style={styles.statLabel}>
                    <Shield size={20} color="#3B82F6" />
                    <Text style={styles.statText}>Defense</Text>
                  </View>
                  {renderStatBar(beast.allocated_stats.defense, "#3B82F6")}
                </View>

                <View style={styles.statRow}>
                  <View style={styles.statLabel}>
                    <Zap size={20} color="#F59E0B" />
                    <Text style={styles.statText}>Speed</Text>
                  </View>
                  {renderStatBar(beast.allocated_stats.speed, "#F59E0B")}
                </View>

                <View style={styles.statRow}>
                  <View style={styles.statLabel}>
                    <Heart size={20} color="#10B981" />
                    <Text style={styles.statText}>Health</Text>
                  </View>
                  {renderStatBar(beast.allocated_stats.health, "#10B981")}
                </View>
              </View>
            </View>

            {/* Abilities Section */}
            <View style={styles.abilitiesSection}>
              <Text style={styles.sectionTitle}>Abilities</Text>
              <View style={styles.abilitiesGrid}>
                {abilities.map((ability) => {
                  const ElementIcon = getElementIcon(ability.element)
                  return (
                    <View key={ability.id} style={[styles.abilityCard, { borderColor: getTypeColor(ability.type) }]}>
                      <LinearGradient
                        colors={[`${getTypeColor(ability.type)}20`, "rgba(0, 0, 0, 0)"]}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.abilityHeader}>
                        <View style={styles.abilityTypeContainer}>
                          <ElementIcon size={16} color={getElementColor(ability.element)} />
                          <Text style={[styles.abilityType, { color: getTypeColor(ability.type) }]}>
                            {ability.type}
                          </Text>
                        </View>
                        <View
                          style={[styles.elementBadge, { backgroundColor: `${getElementColor(ability.element)}20` }]}
                        >
                          <Text style={[styles.elementText, { color: getElementColor(ability.element) }]}>
                            {ability.element}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.abilityName}>{ability.name}</Text>
                      <Text style={styles.abilityDescription} numberOfLines={2}>
                        {ability.description}
                      </Text>
                      <View style={styles.abilityStats}>
                        {ability.power > 0 && (
                          <View style={styles.abilityStat}>
                            <Sword size={12} color="#ffffff" />
                            <Text style={styles.abilityStatText}>{ability.power}</Text>
                          </View>
                        )}
                        <View style={styles.abilityStat}>
                          <Star size={12} color="#ffffff" />
                          <Text style={styles.abilityStatText}>{ability.accuracy}%</Text>
                        </View>
                        <View style={styles.abilityStat}>
                          <Zap size={12} color="#ffffff" />
                          <Text style={styles.abilityStatText}>{ability.energy_cost}</Text>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {!beast.for_sale && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#7C3AED" }]}
                  onPress={() =>
                    router.push({
                      pathname: "/beast/[id]/sell",
                      params: { id: beast.id },
                    })
                  }
                >
                  <Tag size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>List for Sale</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
                onPress={() => router.push("/find-players")}
              >
                <Sword size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Battle</Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
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
  sellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
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
  beastCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  cardContent: {
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  beastHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  beastInfo: {
    gap: 8,
  },
  beastName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  tierText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  priceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "600",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
    marginBottom: 24,
  },
  beastImage: {
    width: "100%",
    height: "100%",
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  statsGrid: {
    gap: 16,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 100,
  },
  statText: {
    color: "#ffffff",
    fontSize: 16,
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
  statValue: {
    position: "absolute",
    right: 4,
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 8,
  },
  abilitiesSection: {
    marginBottom: 24,
  },
  abilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  abilityCard: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    position: "relative",
    overflow: "hidden",
  },
  abilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  abilityTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  abilityType: {
    fontSize: 12,
    fontWeight: "600",
  },
  elementBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  elementText: {
    fontSize: 10,
    fontWeight: "600",
  },
  abilityName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  abilityDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 8,
    height: 32,
  },
  abilityStats: {
    flexDirection: "row",
    gap: 12,
  },
  abilityStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  abilityStatText: {
    fontSize: 12,
    color: "#ffffff",
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
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})

