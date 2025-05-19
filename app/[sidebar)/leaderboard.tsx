"use client"

import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native"
import { Trophy, Flame, Star, ArrowLeft, Crown } from "lucide-react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated"
import ScreenLayout from "@/components/screen-layout"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"

const leaderboardData = [
  {
    id: 1,
    name: "Alex Johnson",
    avatar:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B2B6DD035-1075-4F47-B2F1-DABE23BB2ECB%7D-45Wli9AJqOF6pzxNlZ6Axi54cw1bDu.png",
    points: 2450,
    streak: 15,
  },
  {
    id: 2,
    name: "Sarah Kim",
    avatar:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B2B6DD035-1075-4F47-B2F1-DABE23BB2ECB%7D-45Wli9AJqOF6pzxNlZ6Axi54cw1bDu.png",
    points: 2100,
    streak: 12,
  },
  {
    id: 3,
    name: "Mike Chen",
    avatar:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B2B6DD035-1075-4F47-B2F1-DABE23BB2ECB%7D-45Wli9AJqOF6pzxNlZ6Axi54cw1bDu.png",
    points: 1950,
    streak: 10,
  },
  {
    id: 4,
    name: "Emma Wilson",
    avatar:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B2B6DD035-1075-4F47-B2F1-DABE23BB2ECB%7D-45Wli9AJqOF6pzxNlZ6Axi54cw1bDu.png",
    points: 1820,
    streak: 8,
  },
  {
    id: 5,
    name: "David Park",
    avatar:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B2B6DD035-1075-4F47-B2F1-DABE23BB2ECB%7D-45Wli9AJqOF6pzxNlZ6Axi54cw1bDu.png",
    points: 1750,
    streak: 7,
  },
]

export default function LeaderboardScreen() {
  const handleBack = () => {
    // Handle navigation back
    router.back()
    console.log("Navigate back")
    // You would typically use router.back() or navigation.goBack() depending on your navigation setup
  }

  const getPositionColor = (index) => {
    switch (index) {
      case 0:
        return ["#FFD700", "#FFA500"]
      case 1:
        return ["#C0C0C0", "#A9A9A9"]
      case 2:
        return ["#CD7F32", "#8B4513"]
      default:
        return ["rgba(124, 58, 237, 0.8)", "rgba(124, 58, 237, 0.4)"]
    }
  }

  const getPositionIcon = (index) => {
    if (index === 0) return <Crown size={24} color="#FFD700" />
    return <Trophy size={20} color={index < 3 ? "#ffffff" : "#94A3B8"} />
  }

  return (
    <ScreenLayout>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.statsCard}>
          <BlurView intensity={40} tint="dark" style={styles.statsCardInner}>
            <Text style={styles.statsTitle}>Your Ranking</Text>
            <View style={styles.yourStats}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>#24</Text>
              </View>
              <View style={styles.statDetails}>
                <View style={styles.statItem}>
                  <Star size={16} color="#7C3AED" />
                  <Text style={styles.statValue}>1,245</Text>
                  <Text style={styles.statLabel}>points</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Flame size={16} color="#7C3AED" />
                  <Text style={styles.statValue}>6</Text>
                  <Text style={styles.statLabel}>day streak</Text>
                </View>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        <Text style={styles.sectionTitle}>Top Players</Text>

        <View style={styles.leaderboardList}>
          {leaderboardData.map((user, index) => (
            <Animated.View
              key={user.id}
              entering={FadeInDown.delay(200 * index).duration(400)}
              style={styles.cardContainer}
            >
              <LinearGradient
                colors={getPositionColor(index)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rankIndicator}
              >
                {getPositionIcon(index)}
                <Text style={styles.rankText}>#{index + 1}</Text>
              </LinearGradient>

              <BlurView intensity={40} tint="dark" style={styles.userCard}>
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <View style={styles.stats}>
                    <View style={styles.stat}>
                      <Star size={16} color="#7C3AED" />
                      <Text style={styles.statText}>{user.points} pts</Text>
                    </View>
                    <View style={styles.stat}>
                      <Flame size={16} color="#7C3AED" />
                      <Text style={styles.statText}>{user.streak} days</Text>
                    </View>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
  },
  statsCardInner: {
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 12,
  },
  yourStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(124, 58, 237, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  rankBadgeText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  statDetails: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 4,
  },
  statLabel: {
    color: "#94A3B8",
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  leaderboardList: {
    gap: 16,
    marginBottom: 20,
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: -30,
    zIndex: 10,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  rankText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },
  userCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingLeft: 40,
    paddingRight: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  stats: {
    flexDirection: "row",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#94A3B8",
    fontSize: 14,
  },
})
