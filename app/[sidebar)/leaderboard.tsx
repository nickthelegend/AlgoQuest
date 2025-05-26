"use client"

import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl } from "react-native"
import { Trophy, Flame, ArrowLeft, Crown, Wallet, Users, TrendingUp } from "lucide-react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated"
import ScreenLayout from "@/components/screen-layout"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface LeaderboardUser {
  id: string
  wallet_address: string
  avatar_url?: string
  wins: number
  total_battles: number
  win_rate: number
  current_streak: number
}

interface UserStats {
  rank: number
  wins: number
  total_battles: number
  win_rate: number
  current_streak: number
}

export default function LeaderboardScreen() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUserWallet, setCurrentUserWallet] = useState<string | null>(null)

  const handleBack = () => {
    router.back()
  }

  const truncateWallet = (wallet: string) => {
    if (!wallet) return "Unknown"
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
  }

  const fetchLeaderboardData = async () => {
    try {
      console.log("Fetching leaderboard data...")

      // Get current user's wallet
      const wallet = await AsyncStorage.getItem("walletAddress")
      setCurrentUserWallet(wallet)

      // First, get all users
      const { data: users, error: usersError } = await supabase.from("users").select("id, wallet_address, avatar_url")

      if (usersError) {
        console.error("Users query error:", usersError)
        return
      }

      // Then, get all completed battles
      const { data: battles, error: battlesError } = await supabase
        .from("battles")
        .select("player1_id, player2_id, winner_id, status")
        .eq("status", "completed")

      if (battlesError) {
        console.error("Battles query error:", battlesError)
        return
      }

      console.log("Users:", users)
      console.log("Battles:", battles)

      // Process the data to calculate wins and stats
      const processedData: LeaderboardUser[] = users.map((user) => {
        // Find all battles this user participated in
        const userBattles = battles.filter((battle) => battle.player1_id === user.id || battle.player2_id === user.id)

        // Count wins
        const wins = userBattles.filter((battle) => battle.winner_id === user.id).length
        const total_battles = userBattles.length
        const win_rate = total_battles > 0 ? (wins / total_battles) * 100 : 0

        // Calculate current streak (simplified)
        const current_streak = wins > 0 ? Math.min(wins, 10) : 0

        return {
          id: user.id,
          wallet_address: user.wallet_address,
          avatar_url: user.avatar_url,
          wins,
          total_battles,
          win_rate,
          current_streak,
        }
      })

      // Sort by wins (descending), then by win rate
      const sortedData = processedData
        .filter((user) => user.total_battles > 0) // Only show users who have played
        .sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins
          return b.win_rate - a.win_rate
        })
        .slice(0, 20) // Top 20 players

      setLeaderboardData(sortedData)

      // Find current user's stats
      if (wallet) {
        const currentUser = processedData.find((user) => user.wallet_address?.toLowerCase() === wallet.toLowerCase())

        if (currentUser) {
          const rank = sortedData.findIndex((user) => user.id === currentUser.id) + 1
          setUserStats({
            rank: rank || processedData.length + 1,
            wins: currentUser.wins,
            total_battles: currentUser.total_battles,
            win_rate: currentUser.win_rate,
            current_streak: currentUser.current_streak,
          })
        }
      }

      console.log("Processed leaderboard:", sortedData)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLeaderboardData()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchLeaderboardData()
  }

  const getPositionColor = (index: number) => {
    switch (index) {
      case 0:
        return ["#FFD700", "#FFA500"] // Gold
      case 1:
        return ["#C0C0C0", "#A9A9A9"] // Silver
      case 2:
        return ["#CD7F32", "#8B4513"] // Bronze
      default:
        return ["rgba(124, 58, 237, 0.8)", "rgba(124, 58, 237, 0.4)"]
    }
  }

  const getPositionIcon = (index: number) => {
    if (index === 0) return <Crown size={24} color="#FFD700" />
    return <Trophy size={20} color={index < 3 ? "#ffffff" : "#94A3B8"} />
  }

  const getDefaultAvatar = (wallet: string) => {
    // Generate a consistent avatar based on wallet address
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"]
    const colorIndex = wallet ? wallet.charCodeAt(0) % colors.length : 0
    return colors[colorIndex]
  }

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </ScreenLayout>
    )
  }

  return (
    <ScreenLayout>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.headerStats}>
          <Users size={20} color="#7C3AED" />
          <Text style={styles.headerStatsText}>{leaderboardData.length}</Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
      >
        {userStats && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.statsCard}>
            <BlurView intensity={40} tint="dark" style={styles.statsCardInner}>
              <Text style={styles.statsTitle}>Your Ranking</Text>
              <View style={styles.yourStats}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>#{userStats.rank}</Text>
                </View>
                <View style={styles.statDetails}>
                  <View style={styles.statItem}>
                    <Trophy size={16} color="#7C3AED" />
                    <Text style={styles.statValue}>{userStats.wins}</Text>
                    <Text style={styles.statLabel}>wins</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <TrendingUp size={16} color="#7C3AED" />
                    <Text style={styles.statValue}>{userStats.win_rate.toFixed(0)}%</Text>
                    <Text style={styles.statLabel}>win rate</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Flame size={16} color="#7C3AED" />
                    <Text style={styles.statValue}>{userStats.current_streak}</Text>
                    <Text style={styles.statLabel}>streak</Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        )}

        <Text style={styles.sectionTitle}>Top Warriors</Text>

        {leaderboardData.length === 0 ? (
          <View style={styles.emptyState}>
            <Trophy size={48} color="#94A3B8" />
            <Text style={styles.emptyStateText}>No battles yet!</Text>
            <Text style={styles.emptyStateSubtext}>Be the first to compete and claim the top spot</Text>
          </View>
        ) : (
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
                  <View style={styles.avatarContainer}>
                    {user.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, { backgroundColor: getDefaultAvatar(user.wallet_address) }]}>
                        <Wallet size={24} color="#ffffff" />
                      </View>
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{truncateWallet(user.wallet_address)}</Text>
                    <View style={styles.stats}>
                      <View style={styles.stat}>
                        <Trophy size={16} color="#7C3AED" />
                        <Text style={styles.statText}>{user.wins} wins</Text>
                      </View>
                      <View style={styles.stat}>
                        <TrendingUp size={16} color="#4ADE80" />
                        <Text style={styles.statText}>{user.win_rate.toFixed(0)}%</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.battleStats}>
                    <Text style={styles.battleCount}>{user.total_battles}</Text>
                    <Text style={styles.battleLabel}>battles</Text>
                  </View>
                </BlurView>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
    marginLeft: 12,
  },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  headerStatsText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
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
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
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
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
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
  battleStats: {
    alignItems: "center",
  },
  battleCount: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  battleLabel: {
    color: "#94A3B8",
    fontSize: 12,
  },
})
