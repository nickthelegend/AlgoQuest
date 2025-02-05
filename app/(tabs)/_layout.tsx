import { Tabs } from "expo-router"
import { StyleSheet } from "react-native"
import { Home, Search, Clock, User } from "lucide-react-native"
import { BlurView } from "expo-blur"
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

function TabBarIcon({ color, size, icon: Icon, focused }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(focused ? 1.15 : 1, {
            damping: 12,
            stiffness: 120,
          }),
        },
      ],
    }
  })

  return (
    <Animated.View style={[animatedStyle, styles.iconContainer]}>
      <Icon
        size={28} // Increased icon size
        color={color}
        fill={focused ? color : "transparent"}
        strokeWidth={focused ? 2 : 1.5}
      />
    </Animated.View>
  )
}

export default function TabLayout() {
  const insets = useSafeAreaInsets()

  return (
    <>
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
            height: 80 + insets.bottom, // Increased height
            backgroundColor: "rgba(0, 0, 0, 0.95)", // More opaque black
            borderTopWidth: 0,
            elevation: 0,
            paddingBottom: insets.bottom,
          },
          tabBarBackground: () => (
            <BlurView tint="dark" intensity={30} style={[StyleSheet.absoluteFill, styles.background]} />
          ),
          tabBarItemStyle: {
            paddingTop: 12, // Increased padding
            height: 80, // Increased height
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
          name="explore"
          options={{
            title: "Search",
            tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Search} color={color} size={28} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="recent"
          options={{
            title: "Recent",
            tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Clock} color={color} size={28} focused={focused} />,
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
    </>
  )
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  iconContainer: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
})

