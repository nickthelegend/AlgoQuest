"use client"

import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, {
  FadeIn,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  useSharedValue,
} from "react-native-reanimated"
import { BlurView } from "expo-blur"
import { BookOpen, Coffee, Users, Building2, TreePine, Dumbbell, Camera, Scan } from "lucide-react-native"
import { useEffect } from "react"

const { width } = Dimensions.get("window")
const ZONE_SIZE = (width - 64) / 3

const zones = [
  { id: 1, name: "Library", icon: BookOpen, active: true },
  { id: 2, name: "Cafeteria", icon: Coffee, active: false },
  { id: 3, name: "Lab", icon: Coffee, active: true },
  { id: 4, name: "Study Hall", icon: Users, active: false },
  { id: 5, name: "Main Hall", icon: Building2, active: true },
  { id: 6, name: "Park", icon: TreePine, active: false },
  { id: 7, name: "Gym", icon: Dumbbell, active: true },
  { id: 8, name: "Event Space", icon: Users, active: false },
  { id: 9, name: "Innovation Hub", icon: Users, active: true },
]

export default function QuestMapScreen() {
  const pulseAnim = useSharedValue(1)
  const scanAnim = useSharedValue(0)

  useEffect(() => {
    pulseAnim.value = withRepeat(withSequence(withSpring(1.1), withSpring(1)), -1, true)
    scanAnim.value = withRepeat(withSequence(withSpring(1), withSpring(0)), -1, true)
  }, [pulseAnim, scanAnim]) // Added pulseAnim and scanAnim to dependencies

  const scanStyle = useAnimatedStyle(() => ({
    opacity: scanAnim.value,
    transform: [{ scale: 1 + scanAnim.value * 0.5 }],
  }))

  return (
    <SafeAreaView style={styles.container}>
      {/* Current Quest Card */}
      <Animated.View entering={FadeIn.delay(200)} style={styles.questCard}>
        <BlurView intensity={40} tint="dark" style={styles.cardContent}>
          <Text style={styles.questTitle}>Current Quest</Text>
          <Text style={styles.questDescription}>Find 3 AR Markers → Earn 100 $CAMP</Text>
          <View style={styles.questProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "60%" }]} />
            </View>
            <Text style={styles.progressText}>2/3 Found</Text>
          </View>
        </BlurView>
      </Animated.View>

      {/* Campus Zones Grid */}
      <View style={styles.zonesGrid}>
        {zones.map((zone, index) => (
          <Animated.View key={zone.id} entering={FadeIn.delay(400 + index * 100)} style={styles.zoneWrapper}>
            <TouchableOpacity>
              <BlurView intensity={40} tint="dark" style={styles.zone}>
                <zone.icon size={24} color={zone.active ? "#7C3AED" : "#ffffff"} />
                {zone.active && (
                  <View style={styles.activeIndicator}>
                    <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim.value }] }]} />
                  </View>
                )}
                <Text style={styles.zoneName}>{zone.name}</Text>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* AR Camera Trigger */}
      <Animated.View entering={FadeIn.delay(1200)} style={styles.cameraButton}>
        <BlurView intensity={40} tint="dark" style={styles.cameraContent}>
          <TouchableOpacity style={styles.cameraTouch}>
            <Camera size={24} color="#ffffff" />
            <Text style={styles.cameraText}>Scan for AR Markers</Text>
          </TouchableOpacity>
          <Animated.View style={[styles.scanOverlay, scanStyle]}>
            <Scan size={24} color="#7C3AED" />
          </Animated.View>
        </BlurView>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    padding: 16,
  },
  questCard: {
    marginBottom: 24,
  },
  cardContent: {
    borderRadius: 20,
    padding: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  questTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  questDescription: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 16,
  },
  questProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 4,
  },
  progressText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  zonesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    marginBottom: 24,
  },
  zoneWrapper: {
    width: ZONE_SIZE,
  },
  zone: {
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  activeIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  pulseRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7C3AED",
  },
  zoneName: {
    color: "#ffffff",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  cameraButton: {
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 16,
  },
  cameraContent: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cameraTouch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  cameraText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  scanOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
})

