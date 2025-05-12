"use client"

import React from "react"

import { useState, useEffect, useMemo } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  ActivityIndicator,
  FlatList,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Trophy, MapPin, Timer, Coins, Filter, Plus, Map, Sparkles } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import Animated, {
  SlideInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import { router } from "expo-router"
import { supabase } from "@/lib/supabase"

const { width } = Dimensions.get("window")
const CARD_WIDTH = (width - 48) / 2

interface Quest {
  quest_id: string
  quest_image: string | null
  assets: string[]
  quest_name: string | null
  description: string | null
  application_id?: string
  quest_status: "active" | "completed" | "expired"
  rewards: {
    tokens: number
    nft?: {
      name: string
      image: string
    }
  }
  wallet_addresses: string[]
  created_at: string
  expiry_date: string
  location_title: string | null
  location_shortcut: string | null
  location_description: string | null
  latitude: number
  longitude: number
}

export default function QuestMapScreen() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "completed" | "expired">("all")

  const sparkleAnim = useSharedValue(0)

  useEffect(() => {
    fetchQuests()

    // Start sparkle animation
    sparkleAnim.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 1500 })),
      -1,
      true,
    )
  }, [])

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleAnim.value,
  }))

  const fetchQuests = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("quests").select("*").order("created_at", { ascending: false })

      if (error) throw error

      if (data) {
        // Ensure all required fields have default values
        const sanitizedQuests = data.map((quest) => ({
          ...quest,
          quest_name: quest.quest_name || "Untitled Quest",
          location_title: quest.location_title || "Unknown Location",
          description: quest.description || "No description available",
        }))
        setQuests(sanitizedQuests)
      }
    } catch (err) {
      console.error("Error fetching quests:", err)
      setError("Failed to load quests")
    } finally {
      setLoading(false)
    }
  }

  const getTimeRemaining = (expiryDate: string) => {
    try {
      const now = new Date()
      const expiry = new Date(expiryDate)
      const diff = expiry.getTime() - now.getTime()

      if (diff <= 0) return "Expired"

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      if (days > 0) return `${days}d ${hours}h`
      return `${hours}h`
    } catch (error) {
      return "Invalid date"
    }
  }

  const getStatusColor = (status: Quest["quest_status"]) => {
    switch (status) {
      case "completed":
        return "#4ADE80"
      case "active":
        return "#7C3AED"
      case "expired":
        return "#94A3B8"
      default:
        return "#94A3B8"
    }
  }

  // Memoize filtered quests to prevent unnecessary recalculations
  const filteredQuests = useMemo(() => {
    if (activeFilter === "all") return quests
    return quests.filter((quest) => quest.quest_status === activeFilter)
  }, [quests, activeFilter])

  const QuestCard = React.memo(({ quest, index }: { quest: Quest; index: number }) => (
    <Animated.View entering={SlideInUp.delay(index * 100).springify()} style={styles.questCard}>
      <TouchableOpacity
        style={styles.questCardContent}
        onPress={() => router.push(`/qmap?quest_id=${quest.quest_id}`)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[`${getStatusColor(quest.quest_status)}20`, "rgba(0, 0, 0, 0.5)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.questImageContainer}>
          <Image
            source={{
              uri:
                quest.quest_image ||
                "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2940&auto=format&fit=crop",
            }}
            style={styles.questImage}
          />
          <LinearGradient colors={["transparent", "rgba(0, 0, 0, 0.7)"]} style={styles.questImageOverlay} />
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(quest.quest_status)}30` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(quest.quest_status) }]}>
              {quest.quest_status.charAt(0).toUpperCase() + quest.quest_status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.questInfo}>
          <Text style={styles.questName} numberOfLines={1}>
            {quest.quest_name || "Untitled Quest"}
          </Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {quest.location_title || "Unknown Location"}
          </Text>

          <View style={styles.questMetrics}>
            <View style={styles.metric}>
              <Timer size={14} color="#ffffff" />
              <Text style={styles.metricText}>{getTimeRemaining(quest.expiry_date)}</Text>
            </View>
            <View style={styles.metric}>
              <Coins size={14} color="#ffffff" />
              <Text style={styles.metricText}>{quest.rewards.tokens} $CAMP</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  ))

  const Stats = React.memo(() => (
    <Animated.View entering={FadeIn.delay(200).springify()} style={styles.statsContainer}>
      <LinearGradient
        colors={["rgba(124, 58, 237, 0.2)", "rgba(124, 58, 237, 0.05)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsGradient}
      >
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: "rgba(124, 58, 237, 0.3)" }]}>
            <Trophy size={20} color="#7C3AED" />
          </View>
          <View>
            <Text style={styles.statValue}>{quests.filter((q) => q.quest_status === "active").length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: "rgba(59, 130, 246, 0.3)" }]}>
            <MapPin size={20} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.statValue}>{quests.filter((q) => q.quest_status === "completed").length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: "rgba(16, 185, 129, 0.3)" }]}>
            <Timer size={20} color="#10B981" />
          </View>
          <View>
            <Text style={styles.statValue}>{quests.filter((q) => q.quest_status === "expired").length}</Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  ))

  const FilterTabs = React.memo(() => (
    <Animated.View entering={FadeIn.delay(300).springify()} style={styles.filterTabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "all" && styles.filterTabActive]}
          onPress={() => setActiveFilter("all")}
        >
          <Text style={[styles.filterTabText, activeFilter === "all" && styles.filterTabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "active" && styles.filterTabActive]}
          onPress={() => setActiveFilter("active")}
        >
          <Text style={[styles.filterTabText, activeFilter === "active" && styles.filterTabTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "completed" && styles.filterTabActive]}
          onPress={() => setActiveFilter("completed")}
        >
          <Text style={[styles.filterTabText, activeFilter === "completed" && styles.filterTabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "expired" && styles.filterTabActive]}
          onPress={() => setActiveFilter("expired")}
        >
          <Text style={[styles.filterTabText, activeFilter === "expired" && styles.filterTabTextActive]}>Expired</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.filterButton}>
        <Filter size={20} color="#ffffff" />
      </TouchableOpacity>
    </Animated.View>
  ))

  const EmptyState = React.memo(() => (
    <Animated.View entering={FadeIn.delay(400).springify()} style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Map size={40} color="#7C3AED" />
        <Animated.View style={[styles.emptySparkle, sparkleStyle]}>
          <Sparkles size={20} color="#7C3AED" />
        </Animated.View>
      </View>
      <Text style={styles.emptyTitle}>No quests found</Text>
      <Text style={styles.emptyText}>
        {activeFilter === "all" ? "Start by creating your first quest" : `No ${activeFilter} quests available`}
      </Text>
      <TouchableOpacity style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>Create Quest</Text>
      </TouchableOpacity>
    </Animated.View>
  ))

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#0F0F0F", "#000000"]} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Animated.View entering={FadeIn.delay(100)} style={styles.mapIconContainer}>
            <Map size={24} color="#7C3AED" />
            <Animated.View style={[styles.mapSparkle, sparkleStyle]}>
              <Sparkles size={12} color="#7C3AED" />
            </Animated.View>
          </Animated.View>
        </View>
      </View>

      <Stats />

      <FilterTabs />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading quests...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQuests}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredQuests.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={filteredQuests}
          keyExtractor={(item) => item.quest_id}
          numColumns={2}
          columnWrapperStyle={styles.questGrid}
          contentContainerStyle={styles.questList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => <QuestCard quest={item} index={index} />}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient colors={["#7C3AED", "#4F46E5"]} style={styles.fabGradient}>
          <Plus size={24} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mapIconContainer: {
    position: "relative",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapSparkle: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  statsGradient: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 8,
  },
  filterTabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterTabs: {
    flexDirection: "row",
    flex: 1,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  filterTabActive: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
  },
  filterTabText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  filterTabTextActive: {
    color: "#7C3AED",
    fontWeight: "600",
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  questList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  questGrid: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  questCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  questCardContent: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(30, 30, 30, 0.5)",
  },
  questImageContainer: {
    height: 120,
    position: "relative",
  },
  questImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  questImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  questInfo: {
    padding: 12,
  },
  questName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 8,
  },
  questMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricText: {
    color: "#ffffff",
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 12,
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  emptySparkle: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
})
