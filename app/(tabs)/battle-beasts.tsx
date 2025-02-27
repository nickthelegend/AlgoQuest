"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Swords, Plus, Briefcase, ShoppingBag, Info, Users, Crown, Flame, Trophy } from "lucide-react-native"
import { router } from "expo-router"

const { width } = Dimensions.get("window")
const CARD_WIDTH = (width - 48) / 2

export default function BattleBeastsScreen() {
  const navigateToGameInfo = () => {
    router.push("/game-info")
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
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Battle Beasts</Text>
            <Text style={styles.subtitle}>Create, Battle, Trade</Text>
          </View>
          <TouchableOpacity style={styles.infoButton} onPress={navigateToGameInfo}>
            <Info size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Player Stats Card */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsCard}>
          <BlurView intensity={40} tint="dark" style={styles.cardContent}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Crown size={24} color="#FFD700" />
                <Text style={styles.statValue}>1,234</Text>
                <Text style={styles.statLabel}>Rank</Text>
              </View>
              <View style={styles.statItem}>
                <Flame size={24} color="#FF4444" />
                <Text style={styles.statValue}>7</Text>
                <Text style={styles.statLabel}>Win Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Trophy size={24} color="#4ADE80" />
                <Text style={styles.statValue}>23/12</Text>
                <Text style={styles.statLabel}>W/L</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Main Actions Grid */}
        <View style={styles.actionsGrid}>
          {/* Find Players Card */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.actionCard}>
            <TouchableOpacity style={styles.actionCardContent}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
                <LinearGradient
                  colors={["rgba(239, 68, 68, 0.2)", "rgba(0, 0, 0, 0)"]}
                  style={StyleSheet.absoluteFill}
                />
              </BlurView>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(239, 68, 68, 0.2)" }]}>
                <Users size={32} color="#EF4444" />
              </View>
              <Text style={styles.actionTitle}>Find Players</Text>
              <Text style={styles.actionDescription}>Battle nearby players</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Create Beast Card */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.actionCard}>
            <TouchableOpacity style={styles.actionCardContent} onPress={navigateToBeastCreation}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
                <LinearGradient
                  colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]}
                  style={StyleSheet.absoluteFill}
                />
              </BlurView>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(124, 58, 237, 0.2)" }]}>
                <Plus size={32} color="#7C3AED" />
              </View>
              <Text style={styles.actionTitle}>Create Beast</Text>
              <Text style={styles.actionDescription}>Mint new champions</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Inventory Card */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.actionCard}>
            <TouchableOpacity style={styles.actionCardContent} onPress={navigateToInventory}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
                <LinearGradient
                  colors={["rgba(74, 222, 128, 0.2)", "rgba(0, 0, 0, 0)"]}
                  style={StyleSheet.absoluteFill}
                />
              </BlurView>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(74, 222, 128, 0.2)" }]}>
                <Briefcase size={32} color="#4ADE80" />
              </View>
              <Text style={styles.actionTitle}>Inventory</Text>
              <Text style={styles.actionDescription}>Manage your beasts</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Marketplace Card */}
          <Animated.View entering={FadeInDown.delay(600)} style={styles.actionCard}>
            <TouchableOpacity style={styles.actionCardContent} onPress={navigateToMarketplace}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
                <LinearGradient
                  colors={["rgba(59, 130, 246, 0.2)", "rgba(0, 0, 0, 0)"]}
                  style={StyleSheet.absoluteFill}
                />
              </BlurView>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(59, 130, 246, 0.2)" }]}>
                <ShoppingBag size={32} color="#3B82F6" />
              </View>
              <Text style={styles.actionTitle}>Marketplace</Text>
              <Text style={styles.actionDescription}>Trade & buy beasts</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Recent Battles */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.recentBattles}>
          <Text style={styles.sectionTitle}>Recent Battles</Text>
          <BlurView intensity={40} tint="dark" style={styles.battlesList}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
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
                    <Swords size={16} color="#7C3AED" />
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
  },
  infoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsCard: {
    marginBottom: 24,
  },
  cardContent: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
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
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  actionCard: {
    width: CARD_WIDTH,
  },
  actionCardContent: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    height: 160,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  recentBattles: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  battlesList: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  battleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  battleParticipants: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    color: "rgba(255, 255, 255, 0.6)",
  },
})

