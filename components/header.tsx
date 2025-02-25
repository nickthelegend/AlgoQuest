'use client';

import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from "react-native"
import { BlurView } from "expo-blur"
import { Menu, Bell, Search } from "lucide-react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import AnimatedGradientBorder from "./animated-gradient-border"
import { router } from "expo-router"

interface HeaderProps {
  onMenuPress: () => void;
}



export default function Header({ onMenuPress }: HeaderProps) {
  const insets = useSafeAreaInsets()

  const navigateToSearch = () => {
    router.push("/search")
  }

  const navigateToNotifications = () => {
    router.push("/notifications")
  }

  return (
    <Animated.View 
      entering={FadeIn}
      style={[
        styles.container,
        { paddingTop: insets.top }
      ]}
    >
      <BlurView intensity={40} tint="dark" style={styles.content}>
        <View style={styles.row}>
          <View style={styles.leftSection}>
            <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
              <Menu size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.profile}>
              <AnimatedGradientBorder size={40}>
                <Image 
                  source={{ uri: "https://forkast.news/wp-content/uploads/2022/03/NFT-Avatar.png" }}
                  style={styles.avatar}
                />
              </AnimatedGradientBorder>
              <View>
                <Text style={styles.name}>Nick</Text>
                <Text style={styles.role}>Computer Science</Text>
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
        {/* <Text style={styles.greeting}>Hello, Nick!</Text> */}
      </BlurView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 100, // Set a fixed height for the header
  },
  content: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  role: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#000000',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
  },
})
