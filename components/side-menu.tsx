"use client"

import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from "react-native-reanimated"
import { Settings, LogOut, Vote, Trophy, Calendar, Globe, HelpCircle, KeyRound } from "lucide-react-native"
import { Link, type LinkProps } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")
const MENU_WIDTH = width * 0.75

interface SideMenuProps {
  visible: boolean
  onClose: () => void
}

type AppRoute = LinkProps["href"]

const menuItems: Array<{
  icon: any
  label: string
  href: AppRoute
  section?: string
}> = [
  // Main Navigation
  { icon: Vote, label: "DAO Proposals", href: "/[sidebar)/dao", section: "Campus" },
  { icon: Trophy, label: "Leaderboard", href: "/[sidebar)/leaderboard", section: "Campus" },
  { icon: Calendar, label: "Events Calendar", href: "/[sidebar)/events", section: "Campus" },
  { icon: Globe, label: "Campus Metaverse", href: "/[sidebar)/metaverse", section: "Campus" },

  // Help & Settings
  { icon: HelpCircle, label: "Help/FAQ", href: "/[sidebar)/help", section: "Support" },
  { icon: Settings, label: "Settings", href: "/[sidebar)/settings", section: "Support" },
  { icon: KeyRound, label: "Wallet Settings", href: "/[sidebar)/wallet-settings", section: "Support" },
]

export default function SideMenu({ visible, onClose }: SideMenuProps) {
  if (!visible) return null

  const sections = menuItems.reduce(
    (acc, item) => {
      if (!acc[item.section!]) {
        acc[item.section!] = []
      }
      acc[item.section!].push(item)
      return acc
    },
    {} as Record<string, typeof menuItems>,
  )

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <Animated.View entering={SlideInLeft} exiting={SlideOutLeft} style={styles.menuContainer}>
        <BlurView intensity={80} tint="dark" style={styles.menu}>
          <LinearGradient colors={["rgba(0,0,0,0.9)", "rgba(0,0,0,0.95)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.header}>
            <Text style={styles.title}>Menu</Text>
          </View>
          <View style={styles.content}>
            {Object.entries(sections).map(([section, items]) => (
              <View key={section} style={styles.section}>
                <Text style={styles.sectionTitle}>{section}</Text>
                {items.map((item) => (
                  <Link key={item.href.toString()} href={item.href} asChild onPress={onClose}>
                    <TouchableOpacity style={styles.menuItem}>
                      <item.icon size={24} color="#ffffff" />
                      <Text style={styles.menuItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.logoutButton}>
            <LogOut size={24} color="#ffffff" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuContainer: {
    width: MENU_WIDTH,
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.95)",
  },
  menu: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.1)",
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "uppercase",
    marginBottom: 12,
    paddingLeft: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
  },
})

