"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated"
import {
  HelpCircle,
  BookOpen,
  Gift,
  Coins,
  Users,
  Shield,
  ArrowLeft,
  ChevronDown,
  Star,
  Zap,
  Target,
} from "lucide-react-native"
import { useState } from "react"
import { router } from "expo-router"

interface HelpSection {
  id: string
  title: string
  icon: any
  content: string[]
  expanded: boolean
}

export default function HelpScreen() {
  const [sections, setSections] = useState<HelpSection[]>([
    {
      id: "getting-started",
      title: "Getting Started",
      icon: BookOpen,
      expanded: false,
      content: [
        "Welcome to AlgoQuest! This app allows you to participate in blockchain-based airdrops and create AlgoBeasts.",
        "First, create or import your Algorand wallet to start receiving airdrops.",
        "Make sure to keep your wallet secure and never share your private keys.",
        "Explore the app to discover available airdrops and claim your rewards.",
      ],
    },
    {
      id: "airdrops-guide",
      title: "What are Airdrops?",
      icon: Gift,
      expanded: false,
      content: [
        "Airdrops are free token distributions on the Algorand blockchain.",
        "The AlgoQuest system frequently drops airdrops to fund people to make AlgoBeasts.",
        "Each airdrop has a limited number of claims and an expiry date.",
        "You can claim airdrops directly from the app with just one tap.",
        "Claimed tokens can be used to create powerful AlgoBeasts for battles and quests.",
      ],
    },
    {
      id: "how-to-claim",
      title: "How to Claim Airdrops",
      icon: Target,
      expanded: false,
      content: [
        "1. Navigate to the Airdrops section from the main menu.",
        "2. Browse available airdrops in the 'Available' tab.",
        "3. Tap on any airdrop card to view detailed information.",
        "4. Click the 'Claim Reward' button to initiate the claim process.",
        "5. Confirm the transaction in your wallet.",
        "6. Wait for blockchain confirmation (usually takes a few seconds).",
        "7. Your tokens will appear in your wallet balance.",
      ],
    },
    {
      id: "algoquest-system",
      title: "AlgoQuest Funding System",
      icon: Zap,
      expanded: false,
      content: [
        "AlgoQuest operates a community-driven airdrop system.",
        "Regular airdrops are distributed to help users fund their AlgoBeast creations.",
        "The more active you are in the community, the more airdrops you may receive.",
        "Airdrops are designed to make AlgoBeasts accessible to everyone.",
        "Use your airdrop tokens strategically to create the strongest AlgoBeasts.",
      ],
    },
    {
      id: "algobeasts",
      title: "Creating AlgoBeasts",
      icon: Star,
      expanded: false,
      content: [
        "AlgoBeasts are unique NFT creatures that you can create, battle, and trade.",
        "Use tokens from airdrops to fund the creation of your AlgoBeasts.",
        "Each AlgoBeast has unique attributes and abilities.",
        "Battle other players' AlgoBeasts to earn rewards and climb leaderboards.",
        "Trade your AlgoBeasts on the marketplace for other tokens or AlgoBeasts.",
      ],
    },
    {
      id: "wallet-security",
      title: "Wallet & Security",
      icon: Shield,
      expanded: false,
      content: [
        "Your wallet is secured using industry-standard encryption.",
        "Always backup your wallet mnemonic phrase in a safe place.",
        "Never share your private keys or mnemonic with anyone.",
        "Enable biometric authentication for additional security.",
        "Regularly check your transaction history for any unauthorized activity.",
      ],
    },
    {
      id: "tips-tricks",
      title: "Tips & Best Practices",
      icon: Coins,
      expanded: false,
      content: [
        "Check the app regularly for new airdrops - they have limited claims!",
        "Join our community channels to get notified about special airdrops.",
        "Claim airdrops as soon as possible before they expire.",
        "Save some tokens for creating multiple AlgoBeasts with different strategies.",
        "Participate in community events for exclusive airdrop opportunities.",
      ],
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: HelpCircle,
      expanded: false,
      content: [
        "If an airdrop claim fails, check your internet connection and try again.",
        "Make sure you have enough ALGO for transaction fees (usually very small).",
        "If you can't see your claimed tokens, wait a few minutes for blockchain confirmation.",
        "For wallet issues, try refreshing the app or restarting it.",
        "Contact support if you experience persistent issues.",
      ],
    },
  ])

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        expanded: section.id === id ? !section.expanded : section.expanded,
      })),
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Guide</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Hero Section */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroSection}>
        <BlurView intensity={20} tint="dark" style={styles.heroBlur}>
          <LinearGradient colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0.1)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <Gift size={32} color="#7C3AED" />
            </View>
            <Text style={styles.heroTitle}>Welcome to AlgoQuest</Text>
            <Text style={styles.heroSubtitle}>
              Learn how to claim airdrops and create powerful AlgoBeasts on the Algorand blockchain
            </Text>
          </View>
        </BlurView>
      </Animated.View>

      {/* Help Sections */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionsContainer}>
          {sections.map((section, index) => (
            <Animated.View
              key={section.id}
              entering={FadeInDown.delay(200 + index * 50).springify()}
              style={styles.sectionCard}
            >
              <BlurView intensity={40} tint="dark" style={styles.sectionBlur}>
                <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(section.id)}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={styles.sectionIcon}>
                      <section.icon size={20} color="#7C3AED" />
                    </View>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  </View>
                  <Animated.View
                    style={[
                      styles.chevronContainer,
                      {
                        transform: [{ rotate: section.expanded ? "180deg" : "0deg" }],
                      },
                    ]}
                  >
                    <ChevronDown size={20} color="#64748B" />
                  </Animated.View>
                </TouchableOpacity>

                {section.expanded && (
                  <Animated.View entering={FadeInDown.duration(300)} style={styles.sectionContent}>
                    {section.content.map((paragraph, pIndex) => (
                      <Text key={pIndex} style={styles.contentText}>
                        {paragraph}
                      </Text>
                    ))}
                  </Animated.View>
                )}
              </BlurView>
            </Animated.View>
          ))}
        </View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(800).springify()} style={styles.statsSection}>
          <Text style={styles.statsTitle}>AlgoQuest by the Numbers</Text>
          <View style={styles.statsGrid}>
            <BlurView intensity={20} tint="dark" style={styles.statCard}>
              <Users size={24} color="#7C3AED" />
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </BlurView>
            <BlurView intensity={20} tint="dark" style={styles.statCard}>
              <Gift size={24} color="#10B981" />
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Airdrops Distributed</Text>
            </BlurView>
            <BlurView intensity={20} tint="dark" style={styles.statCard}>
              <Star size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>2K+</Text>
              <Text style={styles.statLabel}>AlgoBeasts Created</Text>
            </BlurView>
          </View>
        </Animated.View>

        {/* Support Section */}
        <Animated.View entering={FadeInDown.delay(900).springify()} style={styles.supportSection}>
          <BlurView intensity={40} tint="dark" style={styles.supportBlur}>
            <LinearGradient
              colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0.2)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.supportContent}>
              <View style={styles.supportIcon}>
                <HelpCircle size={28} color="#7C3AED" />
              </View>
              <Text style={styles.supportTitle}>Still Need Help?</Text>
              <Text style={styles.supportSubtitle}>
                Our community is here to help you succeed in your AlgoQuest journey
              </Text>
              <View style={styles.supportButtons}>
                <TouchableOpacity style={styles.supportButton}>
                  <Text style={styles.supportButtonText}>Join Discord</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.supportButtonSecondary}>
                  <Text style={styles.supportButtonSecondaryText}>Contact Support</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>

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
    justifyContent: "space-between",
    paddingHorizontal: 20,
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
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  placeholder: {
    width: 40,
  },
  heroSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
  },
  heroBlur: {
    padding: 24,
  },
  heroContent: {
    alignItems: "center",
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  sectionsContainer: {
    paddingHorizontal: 20,
  },
  sectionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  sectionBlur: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
  },
  chevronContainer: {
    padding: 4,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  contentText: {
    fontSize: 14,
    color: "#94A3B8",
    lineHeight: 20,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 16,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  supportSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
  },
  supportBlur: {
    padding: 24,
  },
  supportContent: {
    alignItems: "center",
  },
  supportIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  supportSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  supportButtons: {
    flexDirection: "row",
    gap: 12,
  },
  supportButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  supportButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  supportButtonSecondary: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  supportButtonSecondaryText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 100,
  },
})
