"use client"

import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native"
import { BlurView } from "expo-blur"
import { Menu, Bell, Search } from "lucide-react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useState, useEffect } from "react"
import * as SecureStore from "expo-secure-store"

interface HeaderProps {
  onMenuPress: () => void
}

interface UserProfile {
  name: string
  branch: string
}

export default function Header({ onMenuPress }: HeaderProps) {
  const insets = useSafeAreaInsets()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [avatarImage, setAvatarImage] = useState<string | null>(null)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      // Load user profile from SecureStore
      const profileData = await SecureStore.getItemAsync("userProfile")
      if (profileData) {
        const profile = JSON.parse(profileData)
        setUserProfile({
          name: profile.name || "User",
          branch: profile.branch || "Student",
        })
      }

      // Load avatar image from SecureStore
      const avatarBase64 = await SecureStore.getItemAsync("avatarImage")
      if (avatarBase64) {
        setAvatarImage(`data:image/jpeg;base64,${avatarBase64}`)
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
  }

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
            <View style={styles.profile}>
              <View style={styles.avatarContainer}>
                {avatarImage ? (
                  <Image source={{ uri: avatarImage }} style={styles.avatar} />
                ) : (
                  <Image
                    source={{ uri: "https://forkast.news/wp-content/uploads/2022/03/NFT-Avatar.png" }}
                    style={styles.avatar}
                  />
                )}
              </View>
              <View>
                <Text style={styles.name}>{userProfile?.name || "User"}</Text>
                <Text style={styles.role}>{userProfile?.branch || "Student"}</Text>
              </View>
            </View>
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
    gap: 16,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#7C3AED",
    overflow: "hidden",
    backgroundColor: "rgba(124, 58, 237, 0.1)",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "System",
    letterSpacing: 0.2,
  },
  role: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "System",
    letterSpacing: 0.1,
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
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 16,
  },
})

