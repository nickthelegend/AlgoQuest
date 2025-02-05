import { Tabs } from "expo-router"
import { useColorScheme } from "react-native"
import { Home, Search } from "lucide-react-native"

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: colorScheme === "dark" ? "#94a3b8" : "#64748b",
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#1e293b" : "#ffffff",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
    </Tabs>
  )
}

