"use client"

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { ArrowLeft, Flame, ShieldAlert, Zap, Gift, Users, Trophy, CalendarClock } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { router } from "expo-router"

export default function StreakInfoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Streak Squad Info</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Introduction Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
          <BlurView intensity={40} tint="dark" style={styles.cardContent}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.cardHeader}>
              <Flame size={24} color="#FF5757" />
              <Text style={styles.cardTitle}>What is Streak Squad?</Text>
            </View>
            <Text style={styles.cardText}>
              Streak Squad is a social feature that helps you maintain engagement with your campus community. Each day
              you complete campus activities, your streak count increases - bringing you bonuses and rewards!
            </Text>
            <Text style={styles.cardText}>
              Invite friends to join your squad, send them streaks, and earn bonuses together. The longer your streak,
              the more $CAMP tokens you'll earn for each activity.
            </Text>
          </BlurView>
        </Animated.View>

        {/* Streak Freeze Card */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
          <BlurView intensity={40} tint="dark" style={styles.cardContent}>
            <LinearGradient colors={["rgba(255, 87, 87, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.cardHeader}>
              <ShieldAlert size={24} color="#FF5757" />
              <Text style={styles.cardTitle}>Streak Freeze</Text>
            </View>
            <Text style={styles.cardText}>
              Can't complete your daily activity? Use a Streak Freeze to protect your streak! Each student gets 3 streak
              freezes per month.
            </Text>
            <Text style={styles.cardText}>
              When you activate a freeze, your streak count will remain intact even if you miss a day. Use them wisely
              for exams or other busy days!
            </Text>
            <View style={styles.infoBox}>
              <CalendarClock size={18} color="#ffffff" />
              <Text style={styles.infoText}>A freeze lasts for 24 hours from activation.</Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* Benefits Card */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
          <BlurView intensity={40} tint="dark" style={styles.cardContent}>
            <LinearGradient colors={["rgba(16, 185, 129, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.cardHeader}>
              <Zap size={24} color="#10B981" />
              <Text style={styles.cardTitle}>Streak Benefits</Text>
            </View>

            <View style={styles.benefitItem}>
              <Gift size={18} color="#10B981" />
              <View style={styles.benefitInfo}>
                <Text style={styles.benefitTitle}>$CAMP Token Bonus</Text>
                <Text style={styles.benefitDescription}>
                  Earn up to +100% bonus $CAMP tokens based on your streak length
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Users size={18} color="#10B981" />
              <View style={styles.benefitInfo}>
                <Text style={styles.benefitTitle}>Squad Multiplier</Text>
                <Text style={styles.benefitDescription}>
                  Active friends in your squad provide an additional +5% bonus each
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Trophy size={18} color="#10B981" />
              <View style={styles.benefitInfo}>
                <Text style={styles.benefitTitle}>Exclusive Rewards</Text>
                <Text style={styles.benefitDescription}>
                  Unlock special NFTs and campus perks at streak milestones (7, 30, 100 days)
                </Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* How Streaks Work Card */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.card}>
          <BlurView intensity={40} tint="dark" style={styles.cardContent}>
            <LinearGradient colors={["rgba(59, 130, 246, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.cardHeader}>
              <CalendarClock size={24} color="#3B82F6" />
              <Text style={styles.cardTitle}>How Streaks Work</Text>
            </View>

            <View style={styles.streakLevelItem}>
              <View style={[styles.streakBadge, { backgroundColor: "rgba(124, 58, 237, 0.2)" }]}>
                <Text style={styles.streakBadgeText}>1-6 days</Text>
              </View>
              <Text style={styles.streakLevelDescription}>+10% $CAMP bonus on all activities</Text>
            </View>

            <View style={styles.streakLevelItem}>
              <View style={[styles.streakBadge, { backgroundColor: "rgba(59, 130, 246, 0.2)" }]}>
                <Text style={styles.streakBadgeText}>7-29 days</Text>
              </View>
              <Text style={styles.streakLevelDescription}>+25% $CAMP bonus, access to special quests</Text>
            </View>

            <View style={styles.streakLevelItem}>
              <View style={[styles.streakBadge, { backgroundColor: "rgba(16, 185, 129, 0.2)" }]}>
                <Text style={styles.streakBadgeText}>30-99 days</Text>
              </View>
              <Text style={styles.streakLevelDescription}>+50% $CAMP bonus, unique NFT badges</Text>
            </View>

            <View style={styles.streakLevelItem}>
              <View style={[styles.streakBadge, { backgroundColor: "rgba(245, 158, 11, 0.2)" }]}>
                <Text style={styles.streakBadgeText}>100+ days</Text>
              </View>
              <Text style={styles.streakLevelDescription}>+100% $CAMP bonus, legendary status, campus recognition</Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
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
  card: {
    marginBottom: 20,
  },
  cardContent: {
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  cardText: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 10,
  },
  infoText: {
    color: "#ffffff",
    fontSize: 14,
    flex: 1,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  benefitInfo: {
    flex: 1,
  },
  benefitTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  benefitDescription: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    lineHeight: 20,
  },
  streakLevelItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  streakBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  streakBadgeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  streakLevelDescription: {
    color: "#ffffff",
    fontSize: 14,
    flex: 1,
  },
  bottomPadding: {
    height: 40,
  },
})

