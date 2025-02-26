"use client"

import { useState, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import Animated, { FadeIn } from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { ArrowRight, Wallet, Users, Map } from "lucide-react-native"
import { router } from "expo-router"
import * as SecureStore from "expo-secure-store"

// Import Lottie at the top of the file
import LottieView from "lottie-react-native"

const { width } = Dimensions.get("window")

// Replace the onboardingData array with this updated version that uses Lottie files
const onboardingData = [
  {
    id: "1",
    title: "Campus Crypto Wallet",
    description:
      "Manage your campus tokens, NFTs, and participate in the campus economy with your personal blockchain wallet.",
    lottieSource: require("../assets/lottie/wallet.json"),
    icon: Wallet,
  },
  {
    id: "2",
    title: "Connect with Peers",
    description:
      "Find and connect with other students on campus. Build your network and maintain streaks with your friends.",
    lottieSource: require("../assets/lottie/connect.json"),
    icon: Users,
  },
  {
    id: "3",
    title: "Campus Quest Map",
    description:
      "Discover AR quests around campus, earn tokens, and unlock exclusive rewards by completing challenges.",
    lottieSource: require("../assets/lottie/quest.json"),
    icon: Map,
  },
]

// Replace the renderItem function with this updated version that uses Lottie
const renderItem = ({ item, index }: { item: (typeof onboardingData)[0]; index: number }) => {
  const Icon = item.icon
  return (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <LottieView source={item.lottieSource} autoPlay loop style={styles.lottieAnimation} />
      </View>
      <BlurView intensity={40} tint="dark" style={styles.contentCard}>
        <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
        <View style={styles.iconContainer}>
          <Icon size={32} color="#7C3AED" />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </BlurView>
    </View>
  )
}

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1)
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
    } else {
      handleGetStarted()
    }
  }

  const handleGetStarted = async () => {
    // Mark onboarding as completed
    await SecureStore.setItemAsync("onboardingCompleted", "true")
    router.push("/create-wallet")
  }

  const handleSkip = () => {
    handleGetStarted()
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn} style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width)
          setCurrentIndex(index)
        }}
      />

      <Animated.View entering={FadeIn} style={styles.footer}>
        <View style={styles.paginationContainer}>
          {onboardingData.map((_, index) => (
            <View key={index} style={[styles.paginationDot, index === currentIndex && styles.paginationDotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"}
          </Text>
          <ArrowRight size={20} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  slide: {
    width,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  contentCard: {
    width: "100%",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    padding: 24,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#7C3AED",
    width: 24,
  },
  nextButton: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Add this to the styles object
  lottieAnimation: {
    width: "100%",
    height: "100%",
  },
})

