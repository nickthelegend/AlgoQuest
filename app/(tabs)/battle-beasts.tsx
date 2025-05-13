"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated"
import {
  Plus,
  Briefcase,
  ShoppingBag,
  Info,
  Users,
  Crown,
  Flame,
  Trophy,
  Sword,
  Award,
  Sparkles,
} from "lucide-react-native"
import { router } from "expo-router"
import { useState } from "react"

const { width } = Dimensions.get("window")
const CARD_WIDTH = (width - 72) / 2 // 2 columns with 24px padding and 24px gap

export default function BattleBeastsScreen() {
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = () => {
    setRefreshing(true)
    // Simulate a data refresh
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  const navigateToGameInfo = () => {
    router.push("/game-info")
  }

  const navigateToFindPlayers = () => {
    router.push("/(game)/find-players")
  }

  const navigateToMarketplace = () => {
    router.push("/(game)/marketplace")
  }

  const navigateToInventory = () => {
    router.push("/(game)/inventory")
  }

  const navigateToBeastCreation = () => {
    router.push("/(game)/beast-creation")
  }

  const navigateToBattleArena = () => {
    router.push("/(game)/battle-arena")
  }

  const navigateToBeastSale = () => {
    router.push("/(game)/beast-sale")
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
      >
        {/* Header */}
        <Animated.View entering={FadeIn} style={styles.header}>
          <View>
            <Text style={styles.title}>Battle Beasts</Text>
            <Text style={styles.subtitle}>Create, Battle, Trade</Text>
          </View>
          <TouchableOpacity style={styles.infoButton} onPress={navigateToGameInfo}>
            <Info size={24} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Hero Banner */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroBanner}>
          <Image
            source={{
              uri: "https://placeholder.svg?height=400&width=800&query=epic+fantasy+battle+arena+with+dragons+and+magical+creatures+fighting+in+a+dark+mystical+environment+with+purple+energy",
            }}
            style={styles.heroBackgroundImage}
          />
          <LinearGradient
            colors={["rgba(0, 0, 0, 0.7)", "rgba(0, 0, 0, 0.3)", "rgba(124, 58, 237, 0.5)"]}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Battle Arena</Text>
            <Text style={styles.heroSubtitle}>Challenge players and earn rewards</Text>
            <TouchableOpacity style={styles.heroButton} onPress={navigateToBattleArena}>
              <Sword size={20} color="#ffffff" />
              <Text style={styles.heroButtonText}>Enter Arena</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Player Stats Card */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsCard}>
          <BlurView intensity={40} tint="dark" style={styles.cardContent}>
            <LinearGradient
              colors={["rgba(124, 58, 237, 0.3)", "rgba(124, 58, 237, 0.1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.cardTitle}>Your Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: "rgba(255, 215, 0, 0.2)" }]}>
                  <Crown size={24} color="#FFD700" />
                </View>
                <Text style={styles.statValue}>1,234</Text>
                <Text style={styles.statLabel}>Rank</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: "rgba(239, 68, 68, 0.2)" }]}>
                  <Flame size={24} color="#FF4444" />
                </View>
                <Text style={styles.statValue}>7</Text>
                <Text style={styles.statLabel}>Win Streak</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: "rgba(74, 222, 128, 0.2)" }]}>
                  <Trophy size={24} color="#4ADE80" />
                </View>
                <Text style={styles.statValue}>23/12</Text>
                <Text style={styles.statLabel}>W/L</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {/* Find Players */}
            <TouchableOpacity style={styles.quickActionCard} onPress={navigateToFindPlayers}>
              <BlurView intensity={40} tint="dark" style={styles.quickActionContent}>
                <LinearGradient
                  colors={["rgba(239, 68, 68, 0.3)", "rgba(239, 68, 68, 0.1)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.quickActionIcon, { backgroundColor: "rgba(239, 68, 68, 0.3)" }]}>
                  <Users size={28} color="#EF4444" />
                </View>
                <Text style={styles.quickActionTitle}>Find Players</Text>
                <Text style={styles.quickActionDescription}>Battle nearby players</Text>
              </BlurView>
            </TouchableOpacity>

            {/* Marketplace */}
            <TouchableOpacity style={styles.quickActionCard} onPress={navigateToMarketplace}>
              <BlurView intensity={40} tint="dark" style={styles.quickActionContent}>
                <LinearGradient
                  colors={["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0.1)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.quickActionIcon, { backgroundColor: "rgba(59, 130, 246, 0.3)" }]}>
                  <ShoppingBag size={28} color="#3B82F6" />
                </View>
                <Text style={styles.quickActionTitle}>Marketplace</Text>
                <Text style={styles.quickActionDescription}>Trade & buy beasts</Text>
              </BlurView>
            </TouchableOpacity>

            {/* Inventory */}
            <TouchableOpacity style={styles.quickActionCard} onPress={navigateToInventory}>
              <BlurView intensity={40} tint="dark" style={styles.quickActionContent}>
                <LinearGradient
                  colors={["rgba(168, 85, 247, 0.3)", "rgba(168, 85, 247, 0.1)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.quickActionIcon, { backgroundColor: "rgba(168, 85, 247, 0.3)" }]}>
                  <Briefcase size={28} color="#A855F7" />
                </View>
                <Text style={styles.quickActionTitle}>Inventory</Text>
                <Text style={styles.quickActionDescription}>Manage your beasts</Text>
              </BlurView>
            </TouchableOpacity>

            {/* Create Beast */}
            <TouchableOpacity style={styles.quickActionCard} onPress={navigateToBeastCreation}>
              <BlurView intensity={40} tint="dark" style={styles.quickActionContent}>
                <LinearGradient
                  colors={["rgba(124, 58, 237, 0.3)", "rgba(124, 58, 237, 0.1)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.quickActionIcon, { backgroundColor: "rgba(124, 58, 237, 0.3)" }]}>
                  <Plus size={28} color="#7C3AED" />
                </View>
                <Text style={styles.quickActionTitle}>Create Beast</Text>
                <Text style={styles.quickActionDescription}>Mint new champions</Text>
              </BlurView>
            </TouchableOpacity>

            {/* Sell Beast */}
            <TouchableOpacity style={styles.quickActionCard} onPress={navigateToBeastSale}>
              <BlurView intensity={40} tint="dark" style={styles.quickActionContent}>
                <LinearGradient
                  colors={["rgba(245, 158, 11, 0.3)", "rgba(245, 158, 11, 0.1)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.quickActionIcon, { backgroundColor: "rgba(245, 158, 11, 0.3)" }]}>
                  <Award size={28} color="#F59E0B" />
                </View>
                <Text style={styles.quickActionTitle}>Sell Beast</Text>
                <Text style={styles.quickActionDescription}>List on marketplace</Text>
              </BlurView>
            </TouchableOpacity>

            {/* Leaderboard */}
            <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push("/[sidebar)/leaderboard")}>
              <BlurView intensity={40} tint="dark" style={styles.quickActionContent}>
                <LinearGradient
                  colors={["rgba(16, 185, 129, 0.3)", "rgba(16, 185, 129, 0.1)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.quickActionIcon, { backgroundColor: "rgba(16, 185, 129, 0.3)" }]}>
                  <Sparkles size={28} color="#10B981" />
                </View>
                <Text style={styles.quickActionTitle}>Leaderboard</Text>
                <Text style={styles.quickActionDescription}>Top players</Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Recent Battles */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.recentBattles}>
          <Text style={styles.sectionTitle}>Recent Battles</Text>
          <BlurView intensity={40} tint="dark" style={styles.battlesList}>
            <LinearGradient
              colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {[1, 2, 3].map((index) => (
              <View key={index} style={styles.battleItem}>
                <View style={styles.battleParticipants}>
                  <Image
                    source={{
                      uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7BC5DA1ABA-D239-47BF-86A4-7F62F953B61C%7D-oDh5OOGSt6RLj6h8lnARTFRGEVF7dC.png",
                    }}
                    style={styles.participantAvatar}
                  />
                  <View style={styles.versusContainer}>
                    <Sword size={16} color="#7C3AED" />
                  </View>
                  <Image
                    source={{
                      uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B2B6DD035-1075-4F47-B2F1-DABE23BB2ECB%7D-45Wli9AJqOF6pzxNlZ6Axi54cw1bDu.png",
                    }}
                    style={styles.participantAvatar}
                  />
                </View>
                <View style={styles.battleInfo}>
                  <Text style={styles.battleResult}>Victory</Text>
                  <Text style={styles.battleTime}>2 hours ago</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Battles</Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>

        {/* Upcoming Events */}
        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.upcomingEvents}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <BlurView intensity={40} tint="dark" style={styles.eventsCard}>
            <LinearGradient
              colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.eventItem}>
              <View style={styles.eventDateContainer}>
                <Text style={styles.eventDay}>15</Text>
                <Text style={styles.eventMonth}>MAY</Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>Grand Tournament</Text>
                <Text style={styles.eventDescription}>Compete for the championship title and exclusive rewards</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.eventItem}>
              <View style={styles.eventDateContainer}>
                <Text style={styles.eventDay}>22</Text>
                <Text style={styles.eventMonth}>MAY</Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>Beast Fusion Event</Text>
                <Text style={styles.eventDescription}>
                  Special event for creating hybrid beasts with unique abilities
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push("/[sidebar)/events")}>
              <Text style={styles.viewAllText}>View All Events</Text>
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
    backgroundColor: "#000000", // Changed back to black background
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100, // Extra padding at bottom for better scrolling
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#A098AE",
    letterSpacing: 0.5,
  },
  infoButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 12,
  },
  heroBanner: {
    height: 200,
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  heroBackgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  heroContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 16,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  statsCard: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  cardContent: {
    padding: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 14,
    color: "#A098AE",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  quickActionCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  quickActionContent: {
    padding: 20,
    height: 160,
    justifyContent: "space-between",
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 14,
    color: "#A098AE",
  },
  recentBattles: {
    marginBottom: 24,
  },
  battlesList: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    overflow: "hidden",
  },
  battleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  battleParticipants: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  versusContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  battleInfo: {
    alignItems: "flex-end",
  },
  battleResult: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4ADE80",
    marginBottom: 4,
  },
  battleTime: {
    fontSize: 12,
    color: "#A098AE",
  },
  viewAllButton: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  viewAllText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  upcomingEvents: {
    marginBottom: 24,
  },
  eventsCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    overflow: "hidden",
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  eventDateContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  eventDay: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  eventMonth: {
    fontSize: 12,
    color: "#A098AE",
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: "#A098AE",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 8,
  },
})
