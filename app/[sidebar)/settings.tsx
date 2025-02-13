"use client"

import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Bell, Moon, Shield, Fingerprint, Globe, HelpCircle, ChevronRight, Wallet, LogOut } from "lucide-react-native"
import { useState } from "react"
import ScreenLayout from "../../components/screen-layout"

const settingsSections = [
  {
    title: "Preferences",
    items: [
      {
        icon: Bell,
        label: "Notifications",
        type: "toggle",
      },
      {
        icon: Moon,
        label: "Dark Mode",
        type: "toggle",
      },
    ],
  },
  {
    title: "Security",
    items: [
      {
        icon: Shield,
        label: "Privacy Settings",
        type: "link",
      },
      {
        icon: Fingerprint,
        label: "Biometric Authentication",
        type: "toggle",
      },
      {
        icon: Wallet,
        label: "Backup Wallet",
        type: "link",
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        icon: Globe,
        label: "Language",
        value: "English",
        type: "link",
      },
      {
        icon: HelpCircle,
        label: "Help Center",
        type: "link",
      },
    ],
  },
]

export default function SettingsScreen() {
  const [toggleStates, setToggleStates] = useState({
    Notifications: true,
    "Dark Mode": true,
    "Biometric Authentication": false,
  })

  const handleToggle = (label: string) => {
    setToggleStates((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  return (
    <ScreenLayout>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.sections}>
        {settingsSections.map((section, sectionIndex) => (
          <Animated.View key={section.title} entering={FadeInDown.delay(200 * sectionIndex)}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.settingItem, itemIndex !== 0 && styles.borderTop]}
                  onPress={() => item.type === "toggle" && handleToggle(item.label)}
                >
                  <View style={styles.settingLeft}>
                    <item.icon size={20} color="#ffffff" />
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  {item.type === "toggle" ? (
                    <Switch
                      value={toggleStates[item.label]}
                      onValueChange={() => handleToggle(item.label)}
                      trackColor={{ false: "#374151", true: "#7C3AED" }}
                      thumbColor="#ffffff"
                    />
                  ) : (
                    <View style={styles.settingRight}>
                      {item.value && <Text style={styles.settingValue}>{item.value}</Text>}
                      <ChevronRight size={20} color="#94A3B8" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </BlurView>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(800)}>
          <TouchableOpacity style={styles.logoutButton}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
  sections: {
    gap: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "uppercase",
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: "#ffffff",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: "#94A3B8",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
})

