"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Gift, Calendar, AlertCircle, X } from "lucide-react-native"
import { useState } from "react"
import { router } from "expo-router"

const { width } = Dimensions.get("window")

// Dummy airdrop data
const airdrops = [
  {
    id: 1,
    title: "Genesis Beast NFT",
    description: "Claim your exclusive Genesis Beast NFT for early adopters",
    reward: "1 Genesis Beast NFT",
    expiryDate: "May 30, 2025",
    status: "active",
    image: "https://placeholder.svg?height=200&width=200&query=mythical+dragon+beast+nft+purple+glowing",
  },
  {
    id: 2,
    title: "Quest Coin Bonus",
    description: "Special bonus for completing your first 5 quests",
    reward: "500 Quest Coins",
    expiryDate: "June 15, 2025",
    status: "active",
    image: "https://placeholder.svg?height=200&width=200&query=gold+coins+treasure+chest+glowing",
  },
  {
    id: 3,
    title: "Battle Pass Season 1",
    description: "Free Battle Pass for Season 1 participants",
    reward: "Battle Pass + 3 Rare Items",
    expiryDate: "May 10, 2025",
    status: "expired",
    image: "https://placeholder.svg?height=200&width=200&query=battle+pass+ticket+fantasy+game+item",
  },
  {
    id: 4,
    title: "Community Event Reward",
    description: "Special reward for participating in our first community event",
    reward: "Limited Edition Beast Skin",
    expiryDate: "April 25, 2025",
    status: "expired",
    image: "https://placeholder.svg?height=200&width=200&query=fantasy+creature+skin+armor+glowing",
  },
  {
    id: 5,
    title: "Referral Bonus",
    description: "Bonus for referring 3 friends to the game",
    reward: "250 Quest Coins + Mystery Box",
    expiryDate: "July 1, 2025",
    status: "active",
    image: "https://placeholder.svg?height=200&width=200&query=mystery+box+gift+magical+glowing",
  },
]

export default function AirdropScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("active") // "active" or "expired"

  const onRefresh = () => {
    setRefreshing(true)
    // Simulate a data refresh
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  const filteredAirdrops = airdrops.filter((airdrop) => airdrop.status === activeTab)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <X size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Airdrops</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.activeTab]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.activeTabText]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "expired" && styles.activeTab]}
          onPress={() => setActiveTab("expired")}
        >
          <Text style={[styles.tabText, activeTab === "expired" && styles.activeTabText]}>Expired</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
      >
        {filteredAirdrops.length > 0 ? (
          filteredAirdrops.map((airdrop, index) => (
            <Animated.View
              key={airdrop.id}
              entering={FadeInDown.delay(index * 100).springify()}
              style={styles.airdropCard}
            >
              <BlurView intensity={40} tint="dark" style={styles.cardContent}>
                <LinearGradient
                  colors={["rgba(124, 58, 237, 0.3)", "rgba(0, 0, 0, 0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardHeader}>
                  <Image source={{ uri: airdrop.image }} style={styles.airdropImage} />
                  <View style={styles.airdropInfo}>
                    <Text style={styles.airdropTitle}>{airdrop.title}</Text>
                    <Text style={styles.airdropDescription}>{airdrop.description}</Text>
                  </View>
                </View>

                <View style={styles.rewardContainer}>
                  <View style={styles.rewardIconContainer}>
                    <Gift size={20} color="#7C3AED" />
                  </View>
                  <Text style={styles.rewardText}>{airdrop.reward}</Text>
                </View>

                <View style={styles.expiryContainer}>
                  <View style={styles.expiryIconContainer}>
                    <Calendar size={16} color="#A098AE" />
                  </View>
                  <Text style={styles.expiryText}>
                    {activeTab === "active" ? "Expires on: " : "Expired on: "}
                    {airdrop.expiryDate}
                  </Text>
                </View>

                {activeTab === "active" ? (
                  <TouchableOpacity style={styles.claimButton}>
                    <Text style={styles.claimButtonText}>Claim Reward</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.expiredBadge}>
                    <AlertCircle size={16} color="#EF4444" />
                    <Text style={styles.expiredText}>Expired</Text>
                  </View>
                )}
              </BlurView>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Gift size={64} color="rgba(255, 255, 255, 0.2)" />
            <Text style={styles.emptyText}>No {activeTab} airdrops available</Text>
            <Text style={styles.emptySubtext}>Check back later for new rewards</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
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
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#7C3AED",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A098AE",
  },
  activeTabText: {
    color: "#ffffff",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  airdropCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  airdropImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  airdropInfo: {
    flex: 1,
    justifyContent: "center",
  },
  airdropTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  airdropDescription: {
    fontSize: 14,
    color: "#A098AE",
    lineHeight: 20,
  },
  rewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  rewardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  expiryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  expiryIconContainer: {
    marginRight: 8,
  },
  expiryText: {
    fontSize: 14,
    color: "#A098AE",
  },
  claimButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  expiredBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingVertical: 14,
    borderRadius: 12,
  },
  expiredText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#EF4444",
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#A098AE",
    marginTop: 8,
  },
})
