"use client"

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
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
  MapPin,
  Coins,
  Users,
  Image as ImageIcon,
  ChevronRight,
  Bell,
  Trophy,
  BookOpen,
  Coffee,
} from "lucide-react-native"
import { useEffect } from "react"
import Svg, { Circle, G } from "react-native-svg"

const { width } = Dimensions.get("window")
const CARD_WIDTH = (width - 48) / 2

export default function HomeScreen() {
  const pulseAnim = useSharedValue(1)
  const progressAnim = useSharedValue(0)

  useEffect(() => {
    pulseAnim.value = withRepeat(withSequence(withSpring(1.2), withSpring(1)), -1, true)
    progressAnim.value = withSpring(0.7, { damping: 15 })
  }, [progressAnim]) // Added progressAnim to dependencies

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Attendance Status */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.attendanceCard}>
          <BlurView intensity={40} tint="dark" style={styles.cardContent}>
            <View style={styles.progressRing}>
              <Svg width={120} height={120}>
                <G rotation="-90" origin="60, 60">
                  <Circle cx="60" cy="60" r="54" stroke="#2A2A2A" strokeWidth="12" />
                  <Circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="#7C3AED"
                    strokeWidth="12"
                    strokeDasharray={339.292}
                    strokeDashoffset={339.292 * 0.3}
                  />
                </G>
              </Svg>
              <View style={styles.progressContent}>
                <Text style={styles.progressDay}>Day</Text>
                <Text style={styles.progressText}>5/7</Text>
              </View>
            </View>
            <Animated.View style={[styles.checkInButton, pulseStyle]}>
              <TouchableOpacity style={styles.checkInTouchable}>
                <MapPin size={24} color="#ffffff" />
                <Text style={styles.checkInText}>Check-In Now</Text>
              </TouchableOpacity>
            </Animated.View>
          </BlurView>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <Animated.View entering={FadeInDown.delay(400)} style={styles.statsCard}>
            <BlurView intensity={40} tint="dark" style={styles.cardContent}>
              <Coins size={24} color="#7C3AED" />
              <Text style={styles.statsValue}>1,250</Text>
              <Text style={styles.statsLabel}>$CAMP Earned</Text>
            </BlurView>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(600)} style={styles.statsCard}>
            <BlurView intensity={40} tint="dark" style={styles.cardContent}>
              <Users size={24} color="#7C3AED" />
              <Text style={styles.statsValue}>3 → 5</Text>
              <Text style={styles.statsLabel}>Active Streaks</Text>
            </BlurView>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(800)} style={styles.statsCard}>
            <BlurView intensity={40} tint="dark" style={styles.cardContent}>
              <ImageIcon size={24} color="#7C3AED" />
              <Text style={styles.statsValue}>Latest</Text>
              <Text style={styles.statsLabel}>NFT Earned</Text>
            </BlurView>
          </Animated.View>
        </View>

        {/* Notifications */}
        <Animated.View entering={FadeInDown.delay(1000)} style={styles.notificationCard}>
          <BlurView intensity={40} tint="dark" style={styles.cardContent}>
            <View style={styles.notificationHeader}>
              <Bell size={20} color="#ffffff" />
              <Text style={styles.notificationTitle}>Notifications</Text>
            </View>
            <View style={styles.notification}>
              <Trophy size={20} color="#7C3AED" />
              <Text style={styles.notificationText}>Alex invited you to a Streak Squad!</Text>
              <ChevronRight size={20} color="#ffffff" />
            </View>
          </BlurView>
        </Animated.View>

        {/* Upcoming Quests */}
        <View style={styles.questsSection}>
          <Text style={styles.sectionTitle}>Upcoming Quests</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.questsScroll}>
            {quests.map((quest, index) => (
              <Animated.View key={index} entering={FadeInDown.delay(1200 + index * 200)} style={styles.questCard}>
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
  attendanceCard: {
    marginBottom: 24,
  },
  cardContent: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  progressRing: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  progressContent: {
    position: "absolute",
    alignItems: "center",
  },
  progressDay: {
    color: "#ffffff",
    fontSize: 14,
    opacity: 0.8,
  },
  progressText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  checkInButton: {
    width: "100%",
  },
  checkInTouchable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkInText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  statsCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  statsValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
  },
  statsLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  notificationCard: {
    marginBottom: 24,
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
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
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

