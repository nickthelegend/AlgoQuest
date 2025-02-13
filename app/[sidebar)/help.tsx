"use client"

import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { HelpCircle, BookOpen, Wallet, Map, ChevronRight } from "lucide-react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown } from "react-native-reanimated"
import ScreenLayout from "@/components/screen-layout"

const helpTopics = [
  {
    id: 1,
    title: "Getting Started",
    description: "Learn the basics of using the app",
    icon: BookOpen,
  },
  {
    id: 2,
    title: "Wallet & Tokens",
    description: "Managing your CAMP tokens and NFTs",
    icon: Wallet,
  },
  {
    id: 3,
    title: "AR Quests",
    description: "How to participate in AR treasure hunts",
    icon: Map,
  },
]

export default function HelpScreen() {
  return (
    <ScreenLayout>
      <Text style={styles.title}>Help & FAQ</Text>
      <View style={styles.topicsGrid}>
        {helpTopics.map((topic, index) => (
          <Animated.View key={topic.id} entering={FadeInDown.delay(200 * index)}>
            <TouchableOpacity>
              <BlurView intensity={40} tint="dark" style={styles.topicCard}>
                <View style={styles.topicHeader}>
                  <topic.icon size={24} color="#7C3AED" />
                  <ChevronRight size={20} color="#ffffff" />
                </View>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicDescription}>{topic.description}</Text>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <BlurView intensity={40} tint="dark" style={styles.supportCard}>
        <HelpCircle size={24} color="#7C3AED" />
        <Text style={styles.supportTitle}>Need More Help?</Text>
        <Text style={styles.supportText}>Contact our support team for personalized assistance</Text>
        <TouchableOpacity style={styles.supportButton}>
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </BlurView>
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
  topicsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  topicCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  topicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  topicDescription: {
    fontSize: 14,
    color: "#94A3B8",
  },
  supportCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    alignItems: "center",
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
    marginTop: 12,
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 16,
  },
  supportButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  supportButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})

