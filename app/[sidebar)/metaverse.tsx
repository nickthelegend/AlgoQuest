"use client"
import { useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from "react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSpring } from "react-native-reanimated"
import { Globe, Rocket, Gamepad2, Users, Crown, ChevronRight, ArrowLeft, Sparkles, Zap } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")
const CARD_WIDTH = (width - 48) / 2

const features = [
  {
    icon: Gamepad2,
    title: "Virtual Campus",
    description: "Explore a digital twin of your campus",
    color: "#7C3AED",
  },
  {
    icon: Users,
    title: "Social Spaces",
    description: "Meet and interact with other students",
    color: "#4F46E5",
  },
  {
    icon: Crown,
    title: "Virtual Events",
    description: "Attend lectures and events in VR",
    color: "#EC4899",
  },
  {
    icon: Rocket,
    title: "Mini Games",
    description: "Play educational games with friends",
    color: "#8B5CF6",
  },
]

export default function MetaverseScreen() {
  const rotation = useSharedValue(0)
  const scale = useSharedValue(1)
  const sparkleOpacity = useSharedValue(0.5)

  // Continuous rotation animation
  useEffect(() => {
    rotation.value = withRepeat(withSpring(360, { duration: 20000 }), -1, false)
    scale.value = withRepeat(withSpring(1.1, { duration: 2000 }), -1, true)
    sparkleOpacity.value = withRepeat(withSpring(1, { duration: 1500 }), -1, true)
  }, [])

  const globeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }))

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }))

  const handleBack = () => {
    router.back()
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Campus Metaverse</Text>
          <Text style={styles.subtitle}>Coming Soon</Text>
        </View>
        <View style={styles.spacer} />
      </View>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.heroCard}>
          <LinearGradient
            colors={["rgba(124, 58, 237, 0.8)", "rgba(79, 70, 229, 0.6)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Animated.View style={[styles.sparkleContainer, sparkleStyle]}>
              <Sparkles size={20} color="#ffffff" style={styles.sparkle1} />
              <Sparkles size={16} color="#ffffff" style={styles.sparkle2} />
              <Sparkles size={24} color="#ffffff" style={styles.sparkle3} />
            </Animated.View>

            <Animated.View style={[styles.globeContainer, globeStyle]}>
              <View style={styles.globeInner}>
                <Globe size={80} color="#ffffff" />
              </View>
              <View style={styles.globeRing} />
            </Animated.View>

            <Text style={styles.heroTitle}>Experience Campus in VR</Text>
            <Text style={styles.heroDescription}>
              A revolutionary way to experience campus life in the metaverse. Connect, learn, and play in a virtual
              world.
            </Text>

            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Waitlist</Text>
              <ChevronRight size={20} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionTitleContainer}>
            <Zap size={20} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Upcoming Features</Text>
          </View>

          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <Animated.View
                key={feature.title}
                entering={FadeInDown.delay(400 + index * 100).springify()}
                style={styles.featureCardContainer}
              >
                <BlurView intensity={40} tint="dark" style={styles.featureCard}>
                  <LinearGradient
                    colors={[`${feature.color}30`, "rgba(0,0,0,0)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featureGradient}
                  />
                  <View style={[styles.iconContainer, { backgroundColor: `${feature.color}30` }]}>
                    <feature.icon size={28} color={feature.color} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </BlurView>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Beta Access Card */}
        <Animated.View entering={FadeInDown.delay(800).springify()}>
          <BlurView intensity={40} tint="dark" style={styles.betaCard}>
            <LinearGradient
              colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.betaIconContainer}>
              <Rocket size={32} color="#ffffff" />
            </View>
            <Text style={styles.betaTitle}>Get Early Access</Text>
            <Text style={styles.betaDescription}>
              Be among the first to experience the future of campus life. Sign up for beta access.
            </Text>
            <TouchableOpacity style={styles.notifyButton}>
              <Text style={styles.notifyButtonText}>Notify Me</Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  spacer: {
    width: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 14,
    color: "#7C3AED",
    fontWeight: "600",
  },
  heroCard: {
    marginTop: 16,
    marginBottom: 32,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  heroGradient: {
    padding: 24,
    alignItems: "center",
    borderRadius: 24,
  },
  sparkleContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  sparkle1: {
    position: "absolute",
    top: "20%",
    left: "15%",
  },
  sparkle2: {
    position: "absolute",
    top: "60%",
    right: "20%",
  },
  sparkle3: {
    position: "absolute",
    bottom: "25%",
    left: "30%",
  },
  globeContainer: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  globeInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(124, 58, 237, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  globeRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderStyle: "dashed",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  joinButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  featureCardContainer: {
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  featureCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    height: 180,
    overflow: "hidden",
  },
  featureGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 20,
  },
  betaCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 20,
  },
  betaIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  betaTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  betaDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  notifyButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  notifyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})
