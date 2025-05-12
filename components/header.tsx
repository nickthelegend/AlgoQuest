"use client"

import { View, TouchableOpacity, Image, StyleSheet } from "react-native"
import { BlurView } from "expo-blur"
import { Menu, Bell, Search } from "lucide-react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { router } from "expo-router"

interface HeaderProps {
  onMenuPress: () => void
  userProfile?: { name: string; branch: string } | null
  avatarImage?: string | null
}

export default function Header({ onMenuPress, userProfile, avatarImage }: HeaderProps) {
  const insets = useSafeAreaInsets()

  const navigateToSearch = () => {
    router.push("/search")
  }

  const navigateToNotifications = () => {
    router.push("/notifications")
  }

  return (
    <Animated.View entering={FadeIn} style={[styles.container, { paddingTop: insets.top }]}>
      <BlurView intensity={40} tint="dark" style={styles.content}>
        <View style={styles.row}>
          <View style={styles.leftSection}>
            <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
              <Menu size={24} color="#ffffff" />
            </TouchableOpacity>
            <Image source={require("../assets/images/logoname.png")} style={styles.logoImage} resizeMode="contain" />
          </View>

          <View style={styles.rightSection}>
            <TouchableOpacity style={styles.iconButton} onPress={navigateToNotifications}>
              <Bell size={24} color="#ffffff" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={navigateToSearch}>
              <Search size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  content: {
    padding: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  logoImage: {
    width: 120,
    height: 40,
    marginLeft: 8,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#000000",
  },
})
