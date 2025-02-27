"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import {
  ArrowLeft,
  Swords,
  Crown,
  Shield,
  Sparkles,
  Trophy,
  Users,
  Briefcase,
  BarChart3,
  ShoppingBag,
} from "lucide-react-native"
import { router } from "expo-router"

export default function GameInfoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Game Info</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Champion Creation Section */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.sectionHeader}>
              <Crown size={24} color="#FFD700" />
              <Text style={styles.sectionTitle}>Champion Creation & NFT Integration</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Players use an AI image generator to create unique champions. Each champion is minted as an NFT with
              on-chain metadata ensuring true ownership and tradability.
            </Text>

            <View style={styles.tierContainer}>
              <View style={styles.tierCard}>
                <Shield size={20} color="#94A3B8" />
                <Text style={styles.tierTitle}>Tier 1 (Basic)</Text>
                <Text style={styles.tierDescription}>Accessible for all players, offering balanced stats.</Text>
              </View>

              <View style={styles.tierCard}>
                <Shield size={20} color="#3B82F6" />
                <Text style={styles.tierTitle}>Tier 2 (Advanced)</Text>
                <Text style={styles.tierDescription}>Mid-level option with slightly enhanced abilities.</Text>
              </View>

              <View style={styles.tierCard}>
                <Shield size={20} color="#7C3AED" />
                <Text style={styles.tierTitle}>Tier 3 (Elite)</Text>
                <Text style={styles.tierDescription}>
                  Rare, powerful champions requiring Campus Coins. Pay-to-mint without being pay-to-win.
                </Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Battle Arena Section */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
            <LinearGradient colors={["rgba(239, 68, 68, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.sectionHeader}>
              <Swords size={24} color="#EF4444" />
              <Text style={styles.sectionTitle}>Turn-Based Battle Arena</Text>
            </View>
            <Text style={styles.sectionDescription}>
              The core gameplay happens in a dedicated "Game" tab. Players find nearby opponents using the
              expo-nearby-connections module for peer-to-peer battles.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Sparkles size={20} color="#FFD700" />
                <Text style={styles.featureText}>Shared, deterministic game loop for turn management</Text>
              </View>
              <View style={styles.featureItem}>
                <Trophy size={20} color="#4ADE80" />
                <Text style={styles.featureText}>ELO-based matchmaking system</Text>
              </View>
              <View style={styles.featureItem}>
                <Users size={20} color="#3B82F6" />
                <Text style={styles.featureText}>Synchronized peer-to-peer combat</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Additional Features Section */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
            <LinearGradient colors={["rgba(74, 222, 128, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.sectionHeader}>
              <Sparkles size={24} color="#4ADE80" />
              <Text style={styles.sectionTitle}>Additional Features</Text>
            </View>

            <View style={styles.featureGrid}>
              <View style={styles.gridItem}>
                <Briefcase size={20} color="#ffffff" />
                <Text style={styles.gridItemTitle}>Inventory</Text>
                <Text style={styles.gridItemDescription}>Manage champions, items, and upgrades</Text>
              </View>

              <View style={styles.gridItem}>
                <BarChart3 size={20} color="#ffffff" />
                <Text style={styles.gridItemTitle}>Leaderboard</Text>
                <Text style={styles.gridItemDescription}>Track rankings and win streaks</Text>
              </View>

              <View style={styles.gridItem}>
                <ShoppingBag size={20} color="#ffffff" />
                <Text style={styles.gridItemTitle}>Marketplace</Text>
                <Text style={styles.gridItemDescription}>Trade using Campus Tokens</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Vision Section */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
            <LinearGradient colors={["rgba(59, 130, 246, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.sectionHeader}>
              <Crown size={24} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Overall Vision</Text>
            </View>
            <Text style={styles.sectionDescription}>
              AlgoQuest focuses on creating a fair, engaging, and strategic multiplayer experience that leverages
              blockchain technology for asset ownership. Its modular design—separating the gameplay from asset
              management—ensures a clean UI and a smooth, synchronized PvP combat experience.
            </Text>
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
  section: {
    marginBottom: 24,
  },
  sectionContent: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  sectionDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 24,
  },
  tierContainer: {
    marginTop: 20,
    gap: 16,
  },
  tierCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  tierDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  featuresList: {
    marginTop: 20,
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#ffffff",
    flex: 1,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 16,
  },
  gridItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  gridItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  gridItemDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
})

