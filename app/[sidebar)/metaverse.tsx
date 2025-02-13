"use client"
import {useEffect} from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSpring } from "react-native-reanimated"
import { Globe, Rocket, Gamepad2, Users, Crown, ChevronRight } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import ScreenLayout from "../../components/screen-layout"

const { width } = Dimensions.get("window")
const CARD_WIDTH = (width - 48) / 2

const features = [
  {
    icon: Gamepad2,
    title: "Virtual Campus",
    description: "Explore a digital twin of your campus",
  },
  {
    icon: Users,
    title: "Social Spaces",
    description: "Meet and interact with other students",
  },
  {
    icon: Crown,
    title: "Virtual Events",
    description: "Attend lectures and events in VR",
  },
  {
    icon: Rocket,
    title: "Mini Games",
    description: "Play educational games with friends",
  },
]

export default function MetaverseScreen() {
  const rotation = useSharedValue(0)
  const scale = useSharedValue(1)

  // Continuous rotation animation
  useEffect(() => {
    rotation.value = withRepeat(withSpring(360, { duration: 20000 }), -1, false)
    scale.value = withRepeat(withSpring(1.1, { duration: 2000 }), -1, true)
  }, [])

  const globeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }))

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <Text style={styles.title}>Campus Metaverse</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
      </View>

      {/* Hero Section */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.heroCard}>
        <BlurView intensity={40} tint="dark" style={styles.heroContent}>
          <LinearGradient
            colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={[styles.globeContainer, globeStyle]}>
            <Globe size={80} color="#7C3AED" />
          </Animated.View>
          <Text style={styles.heroTitle}>Experience Campus in VR</Text>
          <Text style={styles.heroDescription}>
            A revolutionary way to experience campus life in the metaverse. Connect, learn, and play in a virtual world.
          </Text>
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join Waitlist</Text>
            <ChevronRight size={20} color="#ffffff" />
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      {/* Features Grid */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Upcoming Features</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Animated.View key={feature.title} entering={FadeInDown.delay(400 + index * 100)}>
              <BlurView intensity={40} tint="dark" style={styles.featureCard}>
                <feature.icon size={32} color="#7C3AED" />
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </BlurView>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Beta Access Card */}
      <Animated.View entering={FadeInDown.delay(800)}>
        <BlurView intensity={40} tint="dark" style={styles.betaCard}>
          <LinearGradient
            colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Rocket size={32} color="#7C3AED" />
          <Text style={styles.betaTitle}>Get Early Access</Text>
          <Text style={styles.betaDescription}>
            Be among the first to experience the future of campus life. Sign up for beta access.
          </Text>
          <TouchableOpacity style={styles.notifyButton}>
            <Text style={styles.notifyButtonText}>Notify Me</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 16,
    color: "#7C3AED",
    fontWeight: "600",
  },
  heroCard: {
    marginBottom: 32,
  },
  heroContent: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  globeContainer: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  joinButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  featureCard: {
    width: CARD_WIDTH,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
  betaCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  betaTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 12,
    marginBottom: 8,
  },
  betaDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  notifyButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  notifyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})

