"use client"

import { Tabs } from "expo-router"
import { StyleSheet } from "react-native"
import { Home, Map, Users, Wallet, User } from "lucide-react-native"
import { BlurView } from "expo-blur"
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

function TabBarIcon({ color, size, icon: Icon, focused }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(focused ? 1.15 : 1, {
          damping: 12,
          stiffness: 120,
        }),
      },
    ],
  }))

  return (
    <Animated.View style={[animatedStyle]}>
      
      <Icon size={28} color={color} fill={focused ? color : "transparent"} strokeWidth={focused ? 2 : 1.5} />
    </Animated.View>
  )
}

function FloatingTabBarIcon({ color, size, icon: Icon, focused }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(focused ? 1.15 : 1, {
          damping: 12,
          stiffness: 120,
        }),
      },
    ],
  }))

  return (
    <Animated.View style={[styles.floatingButton, animatedStyle]}>
      <BlurView intensity={30} tint="dark" style={styles.floatingButtonInner}>
        <Icon size={32} color={color} fill={focused ? color : "transparent"} strokeWidth={focused ? 2 : 1.5} />
      </BlurView>
    </Animated.View>
  )
}

export default function TabLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.5)",
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 80 + insets.bottom,
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          borderTopWidth: 0,
          elevation: 0,
          paddingBottom: insets.bottom,
        },
        tabBarBackground: () => <BlurView tint="dark" intensity={30} style={StyleSheet.absoluteFill} />,
        tabBarItemStyle: {
          paddingTop: 12,
          height: 80,
        },
        tabBarLabelStyle: {
          display: "none",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Home} color={color} size={28} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="quest-map"
        options={{
          title: "Quest Map",
          tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Map} color={color} size={28} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          title: "Connect",
          tabBarIcon: ({ color, focused }) => (
            <FloatingTabBarIcon icon={Users} color={color} size={28} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Wallet} color={color} size={28} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => <TabBarIcon icon={User} color={color} size={28} focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(124, 58, 237, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  floatingButtonInner: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
})

