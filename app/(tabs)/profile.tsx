"use client"

import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import { BlurView } from "expo-blur"
import { Settings, Trophy, Star, Award, ChevronRight } from "lucide-react-native"

export default function ProfileScreen() {
  const stats = [
    { icon: Trophy, label: "Rank", value: "#42" },
    { icon: Star, label: "Level", value: "15" },
    { icon: Award, label: "Badges", value: "8" },
  ]

  const menuItems = [
    { title: "Achievement History", icon: Trophy },
    { title: "Leaderboard Position", icon: Star },
    { title: "Settings", icon: Settings },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
          <BlurView intensity={40} tint="dark" style={styles.profileCard}>
            <Image
              source={{
                uri: "https://forkast.news/wp-content/uploads/2022/03/NFT-Avatar.png",
              }}
              style={styles.avatar}
            />
            <Text style={styles.name}>Alex Johnson</Text>
            <Text style={styles.university}>Stanford University</Text>
            <View style={styles.statsContainer}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <stat.icon size={20} color="#ffffff" />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </Animated.View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <Animated.View key={index} entering={FadeIn.delay(400 + index * 200)}>
              <TouchableOpacity>
                <BlurView intensity={40} tint="dark" style={styles.menuItem}>
                  <View style={styles.menuItemLeft}>
                    <item.icon size={20} color="#ffffff" />
                    <Text style={styles.menuItemText}>{item.title}</Text>
                  </View>
                  <ChevronRight size={20} color="#ffffff" />
                </BlurView>
              </TouchableOpacity>
            </Animated.View>
          ))}
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
  header: {
    marginBottom: 24,
  },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  university: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 24,
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
})

