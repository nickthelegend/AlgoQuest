"use client"

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Image } from "react-native"
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from "react-native-reanimated"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import {
  Coins,
  Users,
  Image as ImageIcon,
  BookOpen,
  Coffee,
  Calendar,
  Vote,
  TrendingUp,
  Target,
  ChevronRight,
  Plus,
  Sparkles,
  Gamepad2,
  Trophy,
  Zap,
} from "lucide-react-native"
import { useEffect } from "react"
import { router } from "expo-router"
import ScreenLayout from "@/components/screen-layout"

const { width, height } = Dimensions.get("window")
const CARD_WIDTH = (width - 48) / 2

export default function HomeScreen() {
  const pulseAnim = useSharedValue(1)
  const rotateAnim = useSharedValue(0)
  const sparkleAnim = useSharedValue(0)

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true,
    )
    rotateAnim.value = withRepeat(withTiming(360, { duration: 20000 }), -1, false)
    sparkleAnim.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 1500 })),
      -1,
      true,
    )
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }))

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }))

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleAnim.value,
    transform: [{ scale: interpolate(sparkleAnim.value, [0, 1], [0.8, 1.2]) }],
  }))

  const quests = [
    {
      title: "AR Treasure Hunt",
      location: "Library",
      reward: "100 $CAMP",
      icon: BookOpen,
      image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2940&auto=format&fit=crop",
      color: ["#7C3AED", "#4F46E5"],
    },
    {
      title: "Social Meetup",
      location: "Cafeteria",
      reward: "50 $CAMP",
      icon: Coffee,
      image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=2938&auto=format&fit=crop",
      color: ["#EC4899", "#8B5CF6"],
    },
    {
      title: "Study Group",
      location: "Lab",
      reward: "75 $CAMP",
      icon: Users,
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2942&auto=format&fit=crop",
      color: ["#10B981", "#3B82F6"],
    },
  ]

  const milestones = [
    { title: "Quests Completed", progress: 8, total: 10, color: "#7C3AED", icon: Trophy },
    { title: "Check-ins", progress: 5, total: 7, color: "#3B82F6", icon: Calendar },
    { title: "NFTs Collected", progress: 3, total: 5, color: "#10B981", icon: ImageIcon },
  ]

  const navigateToQuestMap = () => {
    router.push("/quest-map")
  }

  return (
    <ScreenLayout>
      <LinearGradient colors={["#0F0F0F", "#000000"]} style={StyleSheet.absoluteFillObject} />

      {/* Background decorative elements */}
      <Animated.View style={[styles.bgDecoration, rotateStyle]} />
      <Animated.View style={[styles.bgDecoration2]} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with welcome message */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.usernameText}>Crypto Explorer</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Image
              source={{
                uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7BC5DA1ABA-D239-47BF-86A4-7F62F953B61C%7D-oDh5OOGSt6RLj6h8lnARTFRGEVF7dC.png",
              }}
              style={styles.profileImage}
            />
            <Animated.View style={[styles.profileBadge, sparkleStyle]}>
              <Sparkles size={12} color="#ffffff" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Featured Quest */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.featuredCard}>
          <LinearGradient
            colors={["rgba(124, 58, 237, 0.8)", "rgba(79, 70, 229, 0.6)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featuredGradient}
          >
            <BlurView intensity={20} tint="dark" style={styles.featuredContent}>
              <View style={styles.featuredLeft}>
                <View style={styles.featuredIconContainer}>
                  <Gamepad2 size={24} color="#ffffff" />
                </View>
                <Text style={styles.featuredTitle}>Battle Arena</Text>
                <Text style={styles.featuredSubtitle}>New tournament starting soon!</Text>
                <TouchableOpacity style={styles.featuredButton}>
                  <Text style={styles.featuredButtonText}>Join Now</Text>
                  <ChevronRight size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <View style={styles.featuredRight}>
                <Animated.View style={pulseStyle}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=2069&auto=format&fit=crop",
                    }}
                    style={styles.featuredImage}
                  />
                </Animated.View>
              </View>
            </BlurView>
          </LinearGradient>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.statsCard}>
            <LinearGradient
              colors={["rgba(124, 58, 237, 0.2)", "rgba(124, 58, 237, 0.05)"]}
              style={styles.statsGradient}
            >
              <Coins size={24} color="#7C3AED" />
              <Text style={styles.statsValue}>1,250</Text>
              <Text style={styles.statsLabel}>$CAMP Earned</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.statsCard}>
            <LinearGradient
              colors={["rgba(59, 130, 246, 0.2)", "rgba(59, 130, 246, 0.05)"]}
              style={styles.statsGradient}
            >
              <Zap size={24} color="#3B82F6" />
              <Text style={styles.statsValue}>5</Text>
              <Text style={styles.statsLabel}>Active Streaks</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Trending Events */}
        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <TrendingUp size={18} color="#ffffff" />
              <Text style={styles.sectionTitle}>Trending Events</Text>
            </View>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.eventsContainer}>
            <TouchableOpacity style={styles.eventCard}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.2)", "rgba(124, 58, 237, 0.05)"]}
                style={styles.eventGradient}
              >
                <View style={styles.eventIconContainer}>
                  <Calendar size={20} color="#7C3AED" />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>Blockchain Workshop</Text>
                  <Text style={styles.eventDetails}>Tomorrow • 2:00 PM</Text>
                  <View style={styles.eventReward}>
                    <Coins size={12} color="#7C3AED" />
                    <Text style={styles.eventRewardText}>50 $CAMP</Text>
                  </View>
                </View>
                <ChevronRight size={18} color="rgba(255, 255, 255, 0.5)" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.eventCard}>
              <LinearGradient
                colors={["rgba(59, 130, 246, 0.2)", "rgba(59, 130, 246, 0.05)"]}
                style={styles.eventGradient}
              >
                <View style={[styles.eventIconContainer, { backgroundColor: "rgba(59, 130, 246, 0.2)" }]}>
                  <Vote size={20} color="#3B82F6" />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>New DAO Proposal</Text>
                  <Text style={styles.eventDetails}>Campus Food Court</Text>
                  <View style={styles.eventReward}>
                    <Users size={12} color="#3B82F6" />
                    <Text style={[styles.eventRewardText, { color: "#3B82F6" }]}>234 votes</Text>
                  </View>
                </View>
                <ChevronRight size={18} color="rgba(255, 255, 255, 0.5)" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Milestones */}
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Target size={18} color="#ffffff" />
              <Text style={styles.sectionTitle}>Your Progress</Text>
            </View>
          </View>

          <View style={styles.milestonesContainer}>
            {milestones.map((milestone, index) => (
              <View key={index} style={styles.milestoneCard}>
                <LinearGradient
                  colors={[`${milestone.color}20`, `${milestone.color}05`]}
                  style={styles.milestoneGradient}
                >
                  <View style={styles.milestoneHeader}>
                    <View style={[styles.milestoneIconContainer, { backgroundColor: `${milestone.color}30` }]}>
                      <milestone.icon size={16} color={milestone.color} />
                    </View>
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
                </LinearGradient>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Upcoming Quests */}
        <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <BookOpen size={18} color="#ffffff" />
              <Text style={styles.sectionTitle}>Upcoming Quests</Text>
            </View>
            <TouchableOpacity style={styles.seeAllButton} onPress={navigateToQuestMap}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.questsScroll}>
            {quests.map((quest, index) => (
              <Animated.View
                key={index}
                entering={FadeIn.delay(800 + index * 100).springify()}
                style={styles.questCard}
              >
                <TouchableOpacity activeOpacity={0.9}>
                  <LinearGradient
                    colors={quest.color}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.questGradient}
                  >
                    <Image source={{ uri: quest.image }} style={styles.questImage} />
                    <BlurView intensity={80} tint="dark" style={styles.questInfo}>
                      <quest.icon size={20} color="#ffffff" />
                      <Text style={styles.questTitle}>{quest.title}</Text>
                      <View style={styles.questDetails}>
                        <Text style={styles.questLocation}>{quest.location}</Text>
                        <View style={styles.questRewardContainer}>
                          <Coins size={12} color="#ffffff" />
                          <Text style={styles.questReward}>{quest.reward}</Text>
                        </View>
                      </View>
                    </BlurView>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient colors={["#7C3AED", "#4F46E5"]} style={styles.fabGradient}>
          <Plus size={24} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  bgDecoration: {
    position: "absolute",
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: "rgba(124, 58, 237, 0.03)",
    top: -width * 0.75,
    left: -width * 0.25,
  },
  bgDecoration2: {
    position: "absolute",
    width: width,
    height: width,
    borderRadius: width * 0.5,
    backgroundColor: "rgba(59, 130, 246, 0.02)",
    bottom: -width * 0.5,
    right: -width * 0.5,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  welcomeText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
  },
  usernameText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  profileButton: {
    position: "relative",
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  profileBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#7C3AED",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000000",
  },
  featuredCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  featuredGradient: {
    borderRadius: 24,
  },
  featuredContent: {
    flexDirection: "row",
    padding: 20,
    height: 180,
  },
  featuredLeft: {
    flex: 1,
    justifyContent: "center",
  },
  featuredIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featuredTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  featuredSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginBottom: 16,
  },
  featuredButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  featuredButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    marginRight: 4,
  },
  featuredRight: {
    width: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredImage: {
    width: 120,
    height: 120,
    borderRadius: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statsCard: {
    width: "48%",
    borderRadius: 20,
    overflow: "hidden",
  },
  statsGradient: {
    padding: 20,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statsValue: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 12,
  },
  statsLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  seeAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  seeAllText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  eventsContainer: {
    gap: 12,
  },
  eventCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  eventGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  eventDetails: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginBottom: 4,
  },
  eventReward: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventRewardText: {
    color: "#7C3AED",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  milestonesContainer: {
    gap: 12,
  },
  milestoneCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  milestoneGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  milestoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  milestoneIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  milestoneTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  milestoneCount: {
    color: "rgba(255, 255, 255, 0.7)",
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
  questsScroll: {
    paddingRight: 16,
    gap: 16,
  },
  questCard: {
    width: 220,
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 16,
  },
  questGradient: {
    borderRadius: 20,
    height: 220,
    overflow: "hidden",
  },
  questImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  questInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  questTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  questDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questLocation: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  questRewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questReward: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
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
