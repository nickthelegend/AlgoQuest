"use client"

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Image } from "react-native"
import Animated, {
  FadeInDown,
  withSpring,
  withRepeat,
  useAnimatedStyle,
  withSequence,
  useSharedValue,
} from "react-native-reanimated"
import { BlurView } from "expo-blur"
import {
  Coins,
  Users,
  Image as ImageIcon,
  ChevronRight,
  Bell,
  Trophy,
  BookOpen,
  Coffee,
  Flame,
  Calendar,
  Vote,
  TrendingUp,
  Target,
  Info,
} from "lucide-react-native"
import { useEffect } from "react"
import { router } from "expo-router"
import ScreenLayout from "@/components/screen-layout"

const { width } = Dimensions.get("window")
const CARD_WIDTH = (width - 48) / 3 // Changed to divide by 3 for horizontal alignment

export default function HomeScreen() {
  const pulseAnim = useSharedValue(1)
  const progressAnim = useSharedValue(0)

  useEffect(() => {
    pulseAnim.value = withRepeat(withSequence(withSpring(1.2), withSpring(1)), -1, true)
    progressAnim.value = withSpring(0.7, { damping: 15 })
  }, [pulseAnim, progressAnim])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }))

  const quests = [
    {
      title: "AR Treasure Hunt",
      location: "Library",
      reward: "100 $CAMP",
      icon: BookOpen,
    },
    {
      title: "Social Meetup",
      location: "Cafeteria",
      reward: "50 $CAMP",
      icon: Coffee,
    },
    {
      title: "Study Group",
      location: "Lab",
      reward: "75 $CAMP",
      icon: Users,
    },
  ]

  const milestones = [
    { title: "Quests Completed", progress: 8, total: 10, color: "#7C3AED" },
    { title: "Check-ins", progress: 5, total: 7, color: "#3B82F6" },
    { title: "NFTs Collected", progress: 3, total: 5, color: "#10B981" },
  ]

  const navigateToFriends = () => {
    router.push("/friends")
  }

  const navigateToStreakInfo = () => {
    router.push("/streak-info")
  }

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Streak Squad Card */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.streakSquadCard}>
          <BlurView intensity={40} tint="dark" style={styles.cardContent}>
            <View style={styles.streakHeaderWithInfo}>
              <TouchableOpacity style={styles.streakTitleContainer} onPress={navigateToFriends}>
                <Flame size={24} color="#FF5757" />
                <Text style={styles.streakTitle}>Streak Squad</Text>
                <ChevronRight size={20} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={navigateToStreakInfo} style={styles.infoButton}>
                <Info size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={navigateToFriends} style={styles.streakContent}>
              <View style={styles.avatarGroup}>
                <Image
                  source={{
                    uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7BC5DA1ABA-D239-47BF-86A4-7F62F953B61C%7D-oDh5OOGSt6RLj6h8lnARTFRGEVF7dC.png",
                  }}
                  style={[styles.avatar, { zIndex: 4 }]}
                />
                <Image
                  source={{
                    uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B2B6DD035-1075-4F47-B2F1-DABE23BB2ECB%7D-45Wli9AJqOF6pzxNlZ6Axi54cw1bDu.png",
                  }}
                  style={[styles.avatar, { marginLeft: -15, zIndex: 3 }]}
                />
                <Image
                  source={{ uri: "https://forkast.news/wp-content/uploads/2022/03/NFT-Avatar.png" }}
                  style={[styles.avatar, { marginLeft: -15, zIndex: 2 }]}
                />
                <View style={[styles.avatarMore, { marginLeft: -15, zIndex: 1 }]}>
                  <Text style={styles.avatarMoreText}>+2</Text>
                </View>
              </View>
              <View style={styles.streakInfo}>
                <Text style={styles.streakCount}>5 Day Streak</Text>
                <Text style={styles.streakBonus}>+20% $CAMP Bonus</Text>
              </View>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <Animated.View entering={FadeInDown.delay(400)} style={styles.statsCard}>
            <BlurView intensity={40} tint="dark" style={styles.statsCardContent}>
              <Coins size={24} color="#7C3AED" />
              <Text style={styles.statsValue}>1,250</Text>
              <Text style={styles.statsLabel}>$CAMP Earned</Text>
            </BlurView>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(500)} style={styles.statsCard}>
            <BlurView intensity={40} tint="dark" style={styles.statsCardContent}>
              <Users size={24} color="#7C3AED" />
              <Text style={styles.statsValue}>3 → 5</Text>
              <Text style={styles.statsLabel}>Active Streaks</Text>
            </BlurView>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(600)} style={styles.statsCard}>
            <BlurView intensity={40} tint="dark" style={styles.statsCardContent}>
              <ImageIcon size={24} color="#7C3AED" />
              <Text style={styles.statsValue}>NFT</Text>
              <Text style={styles.statsLabel}>Latest Earned</Text>
            </BlurView>
          </Animated.View>
        </View>

        {/* Trending Events */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.trendingSection}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color="#ffffff" />
            <Text style={styles.sectionTitle}>Trending Events</Text>
          </View>
          <BlurView intensity={40} tint="dark" style={styles.trendingCard}>
            <View style={styles.trendingEvent}>
              <Calendar size={20} color="#7C3AED" />
              <View style={styles.trendingEventInfo}>
                <Text style={styles.trendingEventTitle}>Blockchain Workshop</Text>
                <Text style={styles.trendingEventDetails}>Tomorrow • 2:00 PM • 50 $CAMP</Text>
              </View>
              <TouchableOpacity style={styles.trendingEventButton}>
                <Text style={styles.trendingEventButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <View style={styles.trendingEvent}>
              <Vote size={20} color="#7C3AED" />
              <View style={styles.trendingEventInfo}>
                <Text style={styles.trendingEventTitle}>New DAO Proposal</Text>
                <Text style={styles.trendingEventDetails}>Campus Food Court • 234 votes</Text>
              </View>
              <TouchableOpacity style={styles.trendingEventButton}>
                <Text style={styles.trendingEventButtonText}>Vote</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>

        {/* Milestones */}
        <Animated.View entering={FadeInDown.delay(800)} style={styles.milestonesSection}>
          <View style={styles.sectionHeader}>
            <Target size={20} color="#ffffff" />
            <Text style={styles.sectionTitle}>Your Progress</Text>
          </View>
          <BlurView intensity={40} tint="dark" style={styles.milestonesCard}>
            {milestones.map((milestone, index) => (
              <View key={index} style={index !== 0 ? { marginTop: 16 } : {}}>
                <View style={styles.milestoneHeader}>
                  <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                  <Text style={styles.milestoneCount}>
                    {milestone.progress}/{milestone.total}
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${(milestone.progress / milestone.total) * 100}%`,
                        backgroundColor: milestone.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </BlurView>
        </Animated.View>

        {/* Notifications */}
        <Animated.View entering={FadeInDown.delay(900)} style={styles.notificationCard}>
          <BlurView intensity={40} tint="dark" style={styles.cardContent}>
            <View style={styles.notificationHeader}>
              <Bell size={20} color="#ffffff" />
              <Text style={styles.notificationTitle}>Notifications</Text>
            </View>
            <TouchableOpacity style={styles.notification} onPress={navigateToFriends}>
              <Trophy size={20} color="#7C3AED" />
              <Text style={styles.notificationText}>Alex invited you to a Streak Squad!</Text>
              <ChevronRight size={20} color="#ffffff" />
            </TouchableOpacity>
          </BlurView>
        </Animated.View>

        {/* Upcoming Quests */}
        <View style={styles.questsSection}>
          <Text style={styles.sectionTitle}>Upcoming Quests</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.questsScroll}>
            {quests.map((quest, index) => (
              <Animated.View key={index} entering={FadeInDown.delay(1000 + index * 100)} style={styles.questCard}>
                <BlurView intensity={40} tint="dark" style={styles.cardContent}>
                  <quest.icon size={24} color="#7C3AED" />
                  <Text style={styles.questTitle}>{quest.title}</Text>
                  <Text style={styles.questLocation}>{quest.location}</Text>
                  <Text style={styles.questReward}>{quest.reward}</Text>
                </BlurView>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    padding: 16,
    paddingTop: 16, // Reduced top padding to fix spacing issue
  },
  streakSquadCard: {
    marginBottom: 20,
  },
  cardContent: {
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  streakHeaderWithInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  streakTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  streakTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 4,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  streakContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#000000",
  },
  avatarMore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderWidth: 2,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMoreText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  streakInfo: {
    alignItems: "flex-end",
  },
  streakCount: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  streakBonus: {
    color: "#FF5757",
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row", // Keep row, but ensure all 3 cards fit horizontally
    flexWrap: "nowrap", // Prevent wrapping
    justifyContent: "space-between", // Distribute space evenly
    marginBottom: 20,
  },
  statsCard: {
    width: CARD_WIDTH,
    height: 110, // Fixed height for all cards
  },
  statsCardContent: {
    padding: 16,
    height: "100%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  statsLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  trendingSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  trendingCard: {
    borderRadius: 20,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  trendingEvent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  trendingEventInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trendingEventTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  trendingEventDetails: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  trendingEventButton: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trendingEventButtonText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 8,
  },
  milestonesSection: {
    marginBottom: 20,
  },
  milestonesCard: {
    borderRadius: 20,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  milestoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  milestoneTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  milestoneCount: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  notificationCard: {
    marginBottom: 20,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  notificationTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  notificationText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
  },
  questsSection: {
    marginBottom: 24,
  },
  questsScroll: {
    paddingRight: 16,
    gap: 16,
  },
  questCard: {
    width: 200,
  },
  questTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  questLocation: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    marginTop: 4,
  },
  questReward: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
})

