import { Text, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, { FadeIn } from "react-native-reanimated"
import { User } from "lucide-react-native"

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
        <User size={48} color="#a78bfa" />
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Coming soon...</Text>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#f8fafc",
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
  },
})


