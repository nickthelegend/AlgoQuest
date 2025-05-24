"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated"
import {
  ArrowLeft,
  Swords,
  Trophy,
  Clock,
  Users,
  Flame,
  Wind,
  Cloud,
  Mountain,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import { supabase } from "@/lib/supabase"
import { createElement } from "react"

interface Beast {
  id: number
  name: string
  power: number
  element: string
  image_url: string
  owner_id: string
}

export default function BattleLobbyScreen() {
  const { battleId, opponentName, beastId } = useLocalSearchParams()
  const [selectedBeast, setSelectedBeast] = useState<Beast | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [waitingTime, setWaitingTime] = useState(0)
  const [battleStatus, setBattleStatus] = useState<string>("waiting")

  // Animation for the waiting indicator
  const pulseAnimation = useSharedValue(1)
  const rotateAnimation = useSharedValue(0)

  useEffect(() => {
    // Start animations
    pulseAnimation.value = withRepeat(withTiming(1.2, { duration: 1000 }), -1, true)
    rotateAnimation.value = withRepeat(withTiming(360, { duration: 2000 }), -1, false)
  }, [])

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }))

  const animatedRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnimation.value}deg` }],
  }))

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (battleStatus === "waiting") {
      timer = setInterval(() => {
        setWaitingTime((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [battleStatus])

  const initialize = async () => {
    setIsLoading(true)
    try {
      console.log("Initializing battle lobby with battleId:", battleId, "beastId:", beastId)

      // Load the selected beast
      if (beastId) {
        await loadSelectedBeast(beastId as string)
      }

      // Set up real-time listener for battle updates
      if (battleId) {
        setupBattleListener(battleId as string)
      }

      // Set initial battle status to waiting to start timer
      setBattleStatus("waiting")
    } catch (error) {
      console.error("Error initializing battle lobby:", error)
      Alert.alert("Error", "Failed to initialize battle lobby")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const cleanup = initialize()

    // Return cleanup function
    return () => {
      if (cleanup && typeof cleanup === "function") {
        cleanup()
      }
    }
  }, [battleId, beastId])

  const loadSelectedBeast = async (beastId: string) => {
    try {
      const { data: beastData, error } = await supabase.from("beasts").select("*").eq("id", beastId).single()

      if (error) {
        console.error("Error loading beast:", error)
        return
      }

      if (beastData) {
        setSelectedBeast(beastData)
      }
    } catch (error) {
      console.error("Error loading selected beast:", error)
    }
  }

  const setupBattleListener = (battleId: string) => {
    console.log("Setting up battle listener for battle:", battleId)

    const channel = supabase.channel(`battle:${battleId}`)

    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "battles",
          filter: `id=eq.${battleId}`,
        },
        (payload) => {
          console.log("Battle database update received:", payload.new)
          const updatedBattle = payload.new as any

          setBattleStatus(updatedBattle.status)

          if (updatedBattle.status === "active" && updatedBattle.player2_id) {
            console.log("Opponent joined! Redirecting to battle arena...")

            // Show success message and redirect
            Alert.alert(
              "Opponent Joined!",
              "Your opponent has joined the battle. Get ready to fight!",
              [
                {
                  text: "Let's Battle!",
                  onPress: () => {
                    // Unsubscribe from this channel
                    channel.unsubscribe()

                    router.push({
                      pathname: "/battle-arena",
                      params: {
                        beastId: beastId,
                        battleId: battleId,
                      },
                    })
                  },
                },
              ],
              { cancelable: false },
            )
          } else if (updatedBattle.status === "abandoned" || updatedBattle.status === "cancelled") {
            // Battle was cancelled
            Alert.alert("Battle Cancelled", "The battle has been cancelled.", [
              {
                text: "OK",
                onPress: () => {
                  channel.unsubscribe()
                  router.back()
                },
              },
            ])
          }
        },
      )
      .on("broadcast", { event: "opponent_joined" }, (payload) => {
        console.log("Broadcast received - opponent joined:", payload)

        // Show success message and redirect immediately
        Alert.alert(
          "Opponent Joined!",
          payload.payload.message || "Your opponent has joined the battle. Get ready to fight!",
          [
            {
              text: "Let's Battle!",
              onPress: () => {
                // Unsubscribe from this channel
                channel.unsubscribe()

                router.push({
                  pathname: "/battle-arena",
                  params: {
                    beastId: beastId,
                    battleId: payload.payload.battleId,
                  },
                })
              },
            },
          ],
          { cancelable: false },
        )
      })
      .subscribe((status) => {
        console.log("Channel subscription status:", status)
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to battle channel")
        } else if (status === "CHANNEL_ERROR") {
          console.error("Error subscribing to battle channel")
        }
      })

    // Cleanup function
    return () => {
      console.log("Unsubscribing from battle channel")
      channel.unsubscribe()
    }
  }

  const handleCancelBattle = () => {
    Alert.alert("Cancel Battle", "Are you sure you want to cancel this battle challenge?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            // Update battle status to cancelled
            if (battleId) {
              const { error } = await supabase.from("battles").update({ status: "abandoned" }).eq("id", battleId)

              if (error) {
                console.error("Error cancelling battle:", error)
              } else {
                console.log("Battle cancelled successfully")
              }
            }

            router.back()
          } catch (error) {
            console.error("Error cancelling battle:", error)
            router.back()
          }
        },
      },
    ])
  }

  const getElementIcon = (element: string | undefined) => {
    if (!element) return Sparkles

    switch (element.toLowerCase()) {
      case "fire":
        return Flame
      case "water":
        return Cloud
      case "earth":
        return Mountain
      case "wind":
        return Wind
      case "light":
        return Sun
      case "dark":
        return Moon
      default:
        return Sparkles
    }
  }

  const getElementColor = (element: string | undefined) => {
    if (!element) return "#94A3B8"

    switch (element.toLowerCase()) {
      case "fire":
        return "#EF4444"
      case "water":
        return "#3B82F6"
      case "earth":
        return "#92400E"
      case "wind":
        return "#10B981"
      case "light":
        return "#F59E0B"
      case "dark":
        return "#6B21A8"
      default:
        return "#94A3B8"
    }
  }

  const getImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return "/placeholder.svg?height=100&width=100"

    if (imageUrl.startsWith("http")) return imageUrl

    if (imageUrl.startsWith("Qm") || imageUrl.startsWith("baf")) {
      return `https://gateway.pinata.cloud/ipfs/${imageUrl}`
    }

    return imageUrl
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Setting up battle lobby...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Battle Lobby</Text>
      </Animated.View>

      {/* Status Card */}
      <Animated.View entering={FadeIn.delay(200)} style={styles.statusCard}>
        <BlurView intensity={40} tint="dark" style={styles.cardContent}>
          <LinearGradient colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />

          <View style={styles.statusHeader}>
            <Animated.View style={animatedPulseStyle}>
              <Trophy size={32} color="#F59E0B" />
            </Animated.View>
            <Text style={styles.statusTitle}>Waiting for Opponent</Text>
          </View>

          <Text style={styles.statusText}>
            Challenge sent to <Text style={styles.highlightText}>{opponentName || "Unknown Player"}</Text>
          </Text>

          <View style={styles.waitingIndicator}>
            <Animated.View style={animatedRotateStyle}>
              <Users size={24} color="#7C3AED" />
            </Animated.View>
            <Text style={styles.waitingText}>Waiting for response...</Text>
          </View>

          <View style={styles.timerContainer}>
            <Clock size={16} color="#F59E0B" />
            <Text style={styles.timerText}>Waiting time: {formatTime(waitingTime)}</Text>
          </View>
        </BlurView>
      </Animated.View>

      {/* Your Beast Card */}
      {selectedBeast && (
        <Animated.View entering={FadeInDown.delay(300)} style={styles.beastCard}>
          <BlurView intensity={40} tint="dark" style={styles.cardContent}>
            <LinearGradient
              colors={[`${getElementColor(selectedBeast.element)}20`, "rgba(0, 0, 0, 0)"]}
              style={StyleSheet.absoluteFill}
            />

            <Text style={styles.beastCardTitle}>Your Beast</Text>

            <View style={styles.beastInfo}>
              <Image
                source={{ uri: getImageUrl(selectedBeast.image_url) }}
                style={styles.beastImage}
                onError={(e) => console.log("Error loading beast image:", e.nativeEvent.error)}
              />

              <View style={styles.beastDetails}>
                <Text style={styles.beastName}>{selectedBeast.name}</Text>

                <View style={styles.elementBadge}>
                  {createElement(getElementIcon(selectedBeast.element), {
                    size: 14,
                    color: getElementColor(selectedBeast.element),
                  })}
                  <Text style={[styles.elementText, { color: getElementColor(selectedBeast.element) }]}>
                    {selectedBeast.element} Element
                  </Text>
                </View>

                <View style={styles.powerBadge}>
                  <Swords size={14} color="#EF4444" />
                  <Text style={styles.powerText}>{selectedBeast.power} Power</Text>
                </View>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Battle Tips */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.tipsCard}>
        <BlurView intensity={30} tint="dark" style={styles.cardContent}>
          <Text style={styles.tipsTitle}>Battle Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Use elemental advantages to deal more damage</Text>
            <Text style={styles.tipItem}>• Time your special abilities carefully</Text>
            <Text style={styles.tipItem}>• Watch your opponent's patterns</Text>
            <Text style={styles.tipItem}>• Save powerful moves for critical moments</Text>
          </View>
        </BlurView>
      </Animated.View>

      {/* Cancel Button */}
      <Animated.View entering={SlideInUp.delay(500)} style={styles.actionContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBattle}>
          <Text style={styles.cancelButtonText}>Cancel Battle</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  statusCard: {
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardContent: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  statusTitle: {
    color: "#F59E0B",
    fontSize: 22,
    fontWeight: "bold",
  },
  statusText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  highlightText: {
    color: "#7C3AED",
    fontWeight: "bold",
  },
  waitingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  waitingText: {
    color: "#fff",
    fontSize: 16,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timerText: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "600",
  },
  beastCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    overflow: "hidden",
  },
  beastCardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  beastInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  beastImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  beastDetails: {
    flex: 1,
    gap: 8,
  },
  beastName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  elementBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  elementText: {
    fontSize: 14,
    fontWeight: "600",
  },
  powerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  powerText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  tipsCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    overflow: "hidden",
  },
  tipsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    lineHeight: 20,
  },
  actionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
