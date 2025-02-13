"use client"

import { View, Text, StyleSheet, Image } from "react-native"
import { Trophy, Flame, Star } from "lucide-react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown } from "react-native-reanimated"
import ScreenLayout from "@/components/screen-layout"

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
]

export default function LeaderboardScreen() {
  return (
    <ScreenLayout>
      <Text style={styles.title}>Leaderboard</Text>
      <View style={styles.leaderboardList}>
        {leaderboardData.map((user, index) => (
          <Animated.View key={user.id} entering={FadeInDown.delay(200 * index)}>
            <BlurView intensity={40} tint="dark" style={styles.userCard}>
              <View style={styles.rank}>
                <Trophy size={20} color={index === 0 ? "#FCD34D" : "#ffffff"} />
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
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
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 24,
  },
  leaderboardList: {
    gap: 16,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  rank: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 60,
  },
  rankText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
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

