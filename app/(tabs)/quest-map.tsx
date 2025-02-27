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
  TextInput,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Trophy, MapPin, Timer, Coins, Search, Filter, ArrowLeft } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import Animated, { SlideInUp } from "react-native-reanimated"
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
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchQuests()
  }, [])

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
    const query = searchQuery.toLowerCase()
    return quests.filter((quest) => {
      const questName = (quest.quest_name || "").toLowerCase()
      const locationTitle = (quest.location_title || "").toLowerCase()
      return questName.includes(query) || locationTitle.includes(query)
    })
  }, [quests, searchQuery])

  const QuestCard = React.memo(({ quest, index }: { quest: Quest; index: number }) => (
    <Animated.View entering={SlideInUp.delay(index * 100)} style={styles.questCard}>
      <TouchableOpacity style={styles.questCardContent} onPress={() => router.push(`/qmap?quest_id=${quest.quest_id}`)}>
        <BlurView intensity={40} tint="dark" style={styles.cardBlur}>
          <LinearGradient colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.questImageContainer}>
            <Image
              source={{ uri: quest.quest_image || "/placeholder.svg?height=150&width=150" }}
              style={styles.questImage}
            />
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(quest.quest_status)}20` }]}>
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
                <Timer size={14} color="#7C3AED" />
                <Text style={styles.metricText}>{getTimeRemaining(quest.expiry_date)}</Text>
              </View>
              <View style={styles.metric}>
                <Coins size={14} color="#7C3AED" />
                <Text style={styles.metricText}>{quest.rewards.tokens} $CAMP</Text>
              </View>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  ))

  const Stats = React.memo(() => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Trophy size={24} color="#7C3AED" />
        <Text style={styles.statValue}>{quests.filter((q) => q.quest_status === "active").length}</Text>
        <Text style={styles.statLabel}>Active Quests</Text>
      </View>
      <View style={styles.statCard}>
        <MapPin size={24} color="#3B82F6" />
        <Text style={styles.statValue}>{quests.filter((q) => q.quest_status === "completed").length}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
      <View style={styles.statCard}>
        <Timer size={24} color="#10B981" />
        <Text style={styles.statValue}>{quests.filter((q) => q.quest_status === "expired").length}</Text>
        <Text style={styles.statLabel}>Expired</Text>
      </View>
    </View>
  ))

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quest Map</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="rgba(255, 255, 255, 0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search quests..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <Stats />

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
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.questGrid}
          showsVerticalScrollIndicator={false}
        >
          {filteredQuests.map((quest, index) => (
            <QuestCard key={quest.quest_id} quest={quest} index={index} />
          ))}
        </ScrollView>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
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
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    marginLeft: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 12,
    minWidth: 100,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  questGrid: {
    padding: 16,
    gap: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  questCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  questCardContent: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardBlur: {
    overflow: "hidden",
  },
  questImageContainer: {
    height: 150,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  questImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
})

