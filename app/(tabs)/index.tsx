import { View, Text, ScrollView, TouchableOpacity, useColorScheme, StyleSheet, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated"
import { ArrowRight, Shield, Zap, Lock } from "lucide-react-native"
import { Link } from "expo-router"

const { width } = Dimensions.get("window")

export default function LandingScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"

  const features = [
    {
      icon: Shield,
      title: "Secure Transactions",
      description: "End-to-end encrypted blockchain transactions",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant settlement and confirmation",
    },
    {
      icon: Lock,
      title: "Privacy First",
      description: "Your data stays private and secure",
    },
  ]

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={isDark ? ["#1e293b", "#0f172a"] : ["#ffffff", "#f8fafc"]} style={styles.gradient}>
          {/* Hero Section */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.heroContainer}>
            <Text style={[styles.title, isDark && styles.textLight]}>Blockchain Solutions</Text>
            <Text style={[styles.subtitle, isDark && styles.textLight]}>Secure, Fast, and Decentralized</Text>
            <Text style={[styles.description, isDark && styles.textMuted]}>
              Transform your business with our next-generation blockchain platform. Built for security, scalability, and
              ease of use.
            </Text>
            <Link href="/explore" asChild>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Get Started</Text>
                <ArrowRight size={20} color="#ffffff" />
              </TouchableOpacity>
            </Link>
          </Animated.View>

          {/* Features Section */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <Animated.View
                key={feature.title}
                entering={FadeInUp.delay(400 + index * 200).springify()}
                style={[styles.featureCard, isDark && styles.featureCardDark]}
              >
                <feature.icon size={24} color={isDark ? "#60a5fa" : "#2563eb"} style={styles.featureIcon} />
                <Text style={[styles.featureTitle, isDark && styles.textLight]}>{feature.title}</Text>
                <Text style={[styles.featureDescription, isDark && styles.textMuted]}>{feature.description}</Text>
              </Animated.View>
            ))}
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  containerDark: {
    backgroundColor: "#0f172a",
  },
  scrollContent: {
    flexGrow: 1,
  },
  gradient: {
    flex: 1,
    padding: 20,
  },
  heroContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    color: "#334155",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#64748b",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  featuresContainer: {
    gap: 16,
    marginTop: 40,
  },
  featureCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureCardDark: {
    backgroundColor: "#1e293b",
  },
  featureIcon: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  textLight: {
    color: "#f8fafc",
  },
  textMuted: {
    color: "#94a3b8",
  },
})

