"use client"

import { useEffect, useState, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Vibration, StatusBar } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, {
  FadeIn,
  SlideInLeft,
  SlideInRight,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
  FadeInUp,
  FadeInDown,
} from "react-native-reanimated"
import {
  Shield,
  Swords,
  ArrowLeft,
  Crown,
  Flame,
  Wind,
  Cloud,
  Mountain,
  Sun,
  Moon,
  Sparkles,
  Heart,
  Zap,
  Star,
  Trophy,
} from "lucide-react-native"
import { router } from "expo-router"
import { createElement } from "react"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

interface Move {
  id: string
  name: string
  type: "physical" | "magical" | "status"
  element: "fire" | "water" | "earth" | "wind" | "light" | "dark"
  power: number
  accuracy: number
  energyCost: number
  description: string
  icon: any // Lucide icon component
}

interface Beast {
  name: string
  level: number
  health: number
  maxHealth: number
  energy: number
  maxEnergy: number
  power: number
  element: string
  image: string
  moves: Move[]
  stats: {
    attack: number
    defense: number
    speed: number
    magic: number
  }
  status?: {
    type: "burn" | "freeze" | "stun" | "poison"
    duration: number
  }
  buffs?: {
    type: "attack" | "defense" | "speed"
    value: number
    duration: number
  }[]
}

interface Player {
  name: string
  rank: number
  beast: Beast
}

interface BattleLog {
  id: string
  message: string
  type: "attack" | "heal" | "buff" | "status" | "system"
  timestamp: number
}

export default function BattleArenaScreen() {
  const [currentTurn, setCurrentTurn] = useState<"player1" | "player2">("player1")
  const [turnTime, setTurnTime] = useState(30)
  const [battleStarted, setBattleStarted] = useState(false)
  const [selectedMove, setSelectedMove] = useState<Move | null>(null)
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([])
  const [showMoves, setShowMoves] = useState(false)
  const [dimensions, setDimensions] = useState({
    width: screenWidth,
    height: screenHeight,
  })

  // Animation values
  const player1Health = useSharedValue(100)
  const player2Health = useSharedValue(100)
  const player1Energy = useSharedValue(100)
  const player2Energy = useSharedValue(100)
  const shakeValue = useSharedValue(0)
  const flashValue = useSharedValue(0)
  const movesPanelHeight = useSharedValue(0)

  // Refs for beast images
  const player1BeastRef = useRef(null)
  const player2BeastRef = useRef(null)

  // New animation values for enhanced effects
  const glowOpacity = useSharedValue(1)
  const movesPanelTranslateY = useSharedValue(0)
  const battleLogTranslateX = useSharedValue(-300)
  const statusEffectScale = useSharedValue(1)

  // Add a new state for battle log visibility
  const [showBattleLog, setShowBattleLog] = useState(false)

  useEffect(() => {
    // Animate glow effect
    glowOpacity.value = withSequence(withTiming(0.5, { duration: 1000 }), withTiming(1, { duration: 1000 }))

    // Show moves panel
    movesPanelTranslateY.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
    })

    // Show battle log
    battleLogTranslateX.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
    })

    // Hide status bar
    StatusBar.setHidden(true)
    return () => {
      StatusBar.setHidden(false)
    }
  }, [glowOpacity, movesPanelTranslateY, battleLogTranslateX])

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      })
    })

    return () => subscription?.remove()
  }, [])

  // Battle timer
  useEffect(() => {
    if (battleStarted && turnTime > 0) {
      const timer = setInterval(() => {
        setTurnTime((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [battleStarted, turnTime])

  // Mock player data with enhanced moves
  const player1: Player = {
    name: "Supreme",
    rank: 1234,
    beast: {
      name: "Golden Dragon",
      level: 70,
      health: 630781,
      maxHealth: 630781,
      energy: 100,
      maxEnergy: 100,
      power: 9500,
      element: "Light",
      image: "/placeholder.svg?height=200&width=200",
      stats: {
        attack: 85,
        defense: 70,
        speed: 75,
        magic: 90,
      },
      moves: [
        {
          id: "1",
          name: "Solar Flare",
          type: "magical",
          element: "light",
          power: 90,
          accuracy: 100,
          energyCost: 30,
          description: "Blinds the opponent with intense light, dealing massive damage",
          icon: Sun,
        },
        {
          id: "2",
          name: "Divine Shield",
          type: "status",
          element: "light",
          power: 0,
          accuracy: 100,
          energyCost: 20,
          description: "Creates a protective barrier that boosts defense",
          icon: Shield,
        },
        {
          id: "3",
          name: "Holy Strike",
          type: "physical",
          element: "light",
          power: 75,
          accuracy: 95,
          energyCost: 25,
          description: "A powerful physical attack imbued with light energy",
          icon: Swords,
        },
        {
          id: "4",
          name: "Celestial Surge",
          type: "magical",
          element: "light",
          power: 120,
          accuracy: 85,
          energyCost: 50,
          description: "Channels celestial energy for a devastating attack",
          icon: Sparkles,
        },
      ],
    },
  }

  const player2: Player = {
    name: "Huynh Tan Vui",
    rank: 1100,
    beast: {
      name: "Dark Phoenix",
      level: 70,
      health: 422034,
      maxHealth: 422034,
      energy: 100,
      maxEnergy: 100,
      power: 8900,
      element: "Dark",
      image: "/placeholder.svg?height=200&width=200",
      stats: {
        attack: 80,
        defense: 65,
        speed: 95,
        magic: 85,
      },
      moves: [
        {
          id: "1",
          name: "Shadow Strike",
          type: "physical",
          element: "dark",
          power: 85,
          accuracy: 100,
          energyCost: 25,
          description: "A quick strike from the shadows",
          icon: Moon,
        },
      ],
    },
  }

  // Modify the handleAttack function to show the battle log
  const handleAttack = (move: Move) => {
    Vibration.vibrate(50)
    setSelectedMove(move)
    setShowBattleLog(true) // Show battle log after attack

    // Hide battle log after 3 seconds
    setTimeout(() => {
      setShowBattleLog(false)
    }, 3000)

    // Animate attack sequence
    shakeValue.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(0, { duration: 100 }),
    )

    // Flash effect
    flashValue.value = withSequence(withTiming(1, { duration: 100 }), withTiming(0, { duration: 100 }))

    // Update health (mock damage calculation)
    if (currentTurn === "player1") {
      player2Health.value = withSpring(Math.max(0, player2Health.value - 15))
      player1Energy.value = withSpring(Math.max(0, player1Energy.value - move.energyCost))
    } else {
      player1Health.value = withSpring(Math.max(0, player1Health.value - 15))
      player2Energy.value = withSpring(Math.max(0, player2Energy.value - move.energyCost))
    }

    // Add to battle log
    setBattleLogs((prev) => [
      {
        id: Date.now().toString(),
        message: `${currentTurn === "player1" ? player1.name : player2.name} used ${move.name}!`,
        type: "attack",
        timestamp: Date.now(),
      },
      ...prev.slice(0, 4), // Keep only last 5 messages
    ])

    // Switch turns
    setCurrentTurn(currentTurn === "player1" ? "player2" : "player1")
    setTurnTime(30)
    setShowMoves(false)
  }

  const shakeAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeValue.value }],
  }))

  const flashAnimation = useAnimatedStyle(() => ({
    opacity: flashValue.value,
  }))

  const movesPanelAnimation = useAnimatedStyle(() => ({
    height: movesPanelHeight.value,
  }))

  const player1HealthStyle = useAnimatedStyle(() => ({
    width: `${player1Health.value}%`,
  }))

  const player2HealthStyle = useAnimatedStyle(() => ({
    width: `${player2Health.value}%`,
  }))

  const player1EnergyStyle = useAnimatedStyle(() => ({
    width: `${player1Energy.value}%`,
  }))

  const player2EnergyStyle = useAnimatedStyle(() => ({
    width: `${player2Energy.value}%`,
  }))

  const getElementIcon = (element: string) => {
    switch (element.toLowerCase()) {
      case "fire":
        return Flame // Changed from Fire
      case "water":
        return Cloud // Changed from Droplets
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

  const getMoveTypeColor = (type: Move["type"]) => {
    switch (type) {
      case "physical":
        return "#EF4444"
      case "magical":
        return "#7C3AED"
      case "status":
        return "#10B981"
    }
  }

  const getElementColor = (element: string) => {
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Rich Background */}
      <LinearGradient
        colors={["#000000", "#1a1c2c", "#000000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Battle Arena */}
      <View style={styles.arenaContainer}>
        {/* Enemy Stats (Top) */}
        <Animated.View entering={FadeInDown} style={styles.enemyStats}>
          <BlurView intensity={40} tint="dark" style={styles.statsCard}>
            <LinearGradient
              colors={["rgba(239, 68, 68, 0.2)", "rgba(0, 0, 0, 0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.statsHeader}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player2.name}</Text>
                <View style={styles.rankBadge}>
                  <Crown size={12} color="#FFD700" />
                  <Text style={styles.rankText}>#{player2.rank}</Text>
                </View>
              </View>
              <View style={styles.beastInfo}>
                <Text style={styles.beastName}>{player2.beast.name}</Text>
                <View style={styles.elementBadge}>
                  {createElement(getElementIcon(player2.beast.element), {
                    size: 12,
                    color: getElementColor(player2.beast.element),
                  })}
                  <Text style={[styles.elementText, { color: getElementColor(player2.beast.element) }]}>
                    {player2.beast.element}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Heart size={16} color="#EF4444" />
                <View style={styles.statBarContainer}>
                  <Animated.View style={[styles.statBar, player2HealthStyle, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.statText}>
                    {Math.round((player2Health.value / 100) * player2.beast.maxHealth)}
                  </Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <Zap size={16} color="#7C3AED" />
                <View style={styles.statBarContainer}>
                  <Animated.View style={[styles.statBar, player2EnergyStyle, { backgroundColor: "#7C3AED" }]} />
                  <Text style={styles.statText}>
                    {Math.round((player2Energy.value / 100) * player2.beast.maxEnergy)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Enemy Profile */}
            <View style={styles.profileSection}>
              <LinearGradient
                colors={["rgba(239, 68, 68, 0.1)", "rgba(0, 0, 0, 0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.profileCard, StyleSheet.absoluteFill]}
              />
              <Image source={{ uri: "/placeholder.svg?height=40&width=40" }} style={styles.profileAvatar} />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Lv.{player2.beast.level} Trainer</Text>
                <Text style={styles.profileRank}>Elite Challenger</Text>
              </View>
              <View style={styles.profileStats}>
                <View style={styles.profileStatItem}>
                  <Trophy size={14} color="#FFD700" />
                  <Text style={styles.profileStatText}>127 Wins</Text>
                </View>
                <View style={styles.profileStatItem}>
                  <Star size={14} color="#F59E0B" />
                  <Text style={styles.profileStatText}>92% Rate</Text>
                </View>
              </View>
            </View>

            {/* Status Effects */}
            <View style={styles.statusEffects}>
              {player2.beast.status && (
                <Animated.View
                  style={[styles.statusBadge, { backgroundColor: getElementColor(player2.beast.status.type) }]}
                >
                  <Text style={styles.statusText}>{player2.beast.status.type}</Text>
                </Animated.View>
              )}
            </View>
          </BlurView>
        </Animated.View>

        {/* Battle Scene */}
        <View style={styles.battleScene}>
          {/* Battle Timer */}
          <Animated.View entering={FadeIn} style={styles.battleTimer}>
            <BlurView intensity={40} tint="dark" style={styles.timerCard}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.timerText}>{turnTime}s</Text>
              <Text style={styles.turnText}>{currentTurn === "player1" ? "Your" : "Opponent's"} Turn</Text>
            </BlurView>
          </Animated.View>

          {/* Enemy Beast */}
          <Animated.View
            ref={player2BeastRef}
            entering={SlideInRight.delay(300)}
            style={[styles.beastContainer, styles.enemyBeastContainer]}
          >
            <LinearGradient
              colors={["rgba(239, 68, 68, 0.2)", "transparent"]}
              style={styles.beastGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <Image source={{ uri: player2.beast.image }} style={styles.beastImage} />
          </Animated.View>

          {/* Player Beast */}
          <Animated.View
            ref={player1BeastRef}
            entering={SlideInLeft.delay(300)}
            style={[styles.beastContainer, styles.playerBeastContainer, shakeAnimation]}
          >
            <LinearGradient
              colors={["rgba(124, 58, 237, 0.2)", "transparent"]}
              style={styles.beastGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <Image source={{ uri: player1.beast.image }} style={styles.beastImage} />
          </Animated.View>
        </View>

        {/* Player Stats (Bottom) */}
        <Animated.View entering={FadeInUp} style={styles.playerStats}>
          <BlurView intensity={40} tint="dark" style={styles.statsCard}>
            <LinearGradient
              colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.statsHeader}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player1.name}</Text>
                <View style={styles.rankBadge}>
                  <Crown size={12} color="#FFD700" />
                  <Text style={styles.rankText}>#{player1.rank}</Text>
                </View>
              </View>
              <View style={styles.beastInfo}>
                <Text style={styles.beastName}>{player1.beast.name}</Text>
                <View style={styles.elementBadge}>
                  {createElement(getElementIcon(player1.beast.element), {
                    size: 12,
                    color: getElementColor(player1.beast.element),
                  })}
                  <Text style={[styles.elementText, { color: getElementColor(player1.beast.element) }]}>
                    {player1.beast.element}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Heart size={16} color="#EF4444" />
                <View style={styles.statBarContainer}>
                  <Animated.View style={[styles.statBar, player1HealthStyle, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.statText}>
                    {Math.round((player1Health.value / 100) * player1.beast.maxHealth)}
                  </Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <Zap size={16} color="#7C3AED" />
                <View style={styles.statBarContainer}>
                  <Animated.View style={[styles.statBar, player1EnergyStyle, { backgroundColor: "#7C3AED" }]} />
                  <Text style={styles.statText}>
                    {Math.round((player1Energy.value / 100) * player1.beast.maxEnergy)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Status Effects */}
            <View style={styles.statusEffects}>
              {player1.beast.status && (
                <Animated.View
                  style={[styles.statusBadge, { backgroundColor: getElementColor(player1.beast.status.type) }]}
                >
                  <Text style={styles.statusText}>{player1.beast.status.type}</Text>
                </Animated.View>
              )}
            </View>
          </BlurView>
        </Animated.View>

        {/* Battle Log */}
        {showBattleLog && (
          <Animated.View entering={SlideInLeft} style={[styles.battleLog, { opacity: showBattleLog ? 1 : 0 }]}>
            <BlurView intensity={40} tint="dark" style={styles.battleLogCard}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {battleLogs.map((log) => (
                <Text key={log.id} style={[styles.logText, styles[`log${log.type}`]]}>
                  {log.message}
                </Text>
              ))}
            </BlurView>
          </Animated.View>
        )}

        {/* Moves Panel */}
        {currentTurn === "player1" && (
          <Animated.View entering={FadeInUp} style={styles.movesPanel}>
            <BlurView intensity={40} tint="dark" style={styles.movesPanelContent}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.movesGrid}>
                {player1.beast.moves.map((move) => (
                  <TouchableOpacity
                    key={move.id}
                    style={[styles.moveCard, { borderColor: getMoveTypeColor(move.type) }]}
                    onPress={() => handleAttack(move)}
                  >
                    <LinearGradient
                      colors={[`${getMoveTypeColor(move.type)}20`, "rgba(0, 0, 0, 0)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.moveHeader}>
                      <move.icon size={24} color={getMoveTypeColor(move.type)} />
                      <View style={[styles.moveType, { backgroundColor: `${getMoveTypeColor(move.type)}40` }]}>
                        <Text style={[styles.moveTypeText, { color: getMoveTypeColor(move.type) }]}>{move.type}</Text>
                      </View>
                    </View>
                    <Text style={styles.moveName}>{move.name}</Text>
                    <View style={styles.moveStats}>
                      <View style={styles.moveStat}>
                        <Swords size={14} color={getMoveTypeColor(move.type)} />
                        <Text style={[styles.moveStatText, { color: getMoveTypeColor(move.type) }]}>{move.power}</Text>
                      </View>
                      <View style={styles.moveStat}>
                        <Star size={14} color={getMoveTypeColor(move.type)} />
                        <Text style={[styles.moveStatText, { color: getMoveTypeColor(move.type) }]}>
                          {move.accuracy}%
                        </Text>
                      </View>
                      <View style={styles.moveStat}>
                        <Zap size={14} color={getMoveTypeColor(move.type)} />
                        <Text style={[styles.moveStatText, { color: getMoveTypeColor(move.type) }]}>
                          {move.energyCost}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          </Animated.View>
        )}

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <BlurView intensity={40} tint="dark" style={styles.backButtonContent}>
            <ArrowLeft size={24} color="#ffffff" />
          </BlurView>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  arenaContainer: {
    flex: 1,
    padding: 16,
  },
  enemyStats: {
    width: "100%",
    marginBottom: 20,
  },
  playerStats: {
    width: "100%",
    marginTop: 20,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  statsHeader: {
    marginBottom: 16,
  },
  playerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
  },
  beastInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  beastName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  elementBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  elementText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsGrid: {
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  statBar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
  },
  statText: {
    position: "absolute",
    right: 4,
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 8,
  },
  statusEffects: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  battleScene: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  battleTimer: {
    position: "absolute",
    top: "50%", // Center vertically
    left: "50%", // Center horizontally
    transform: [{ translateX: -50 }, { translateY: -50 }],
    zIndex: 10,
  },
  timerCard: {
    paddingHorizontal: 12, // Reduced from 16
    paddingVertical: 6, // Reduced from 8
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  timerText: {
    fontSize: 20, // Reduced from 24
    fontWeight: "bold",
    color: "#F59E0B",
  },
  turnText: {
    fontSize: 12,
    color: "#ffffff",
  },
  beastContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 200,
    height: 200,
    position: "relative",
  },
  beastGlow: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 100,
  },
  enemyBeastContainer: {
    transform: [{ scaleX: -1 }],
  },
  playerBeastContainer: {
    marginTop: 10, // Decrease from 40 to 20
  },
  beastImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  battleLog: {
    position: "absolute",
    top: "50%", // Center vertically
    left: "50%", // Center horizontally
    transform: [{ translateX: -140 }, { translateY: -50 }], // Half of width (280/2)
    width: 280,
  },
  battleLogCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  logText: {
    fontSize: 14,
    marginBottom: 4,
    color: "#ffffff",
  },
  logattack: {
    color: "#EF4444",
  },
  logheal: {
    color: "#10B981",
  },
  logbuff: {
    color: "#7C3AED",
  },
  logstatus: {
    color: "#F59E0B",
  },
  logsystem: {
    color: "#94A3B8",
  },
  movesPanel: {
    position: "absolute",
    bottom: 120, // Reduced from 280 to position just above player stats
    left: 16,
    right: 16,
    marginBottom: 8, // Reduced from 16
    zIndex: 50,
  },
  movesPanelContent: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  movesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  moveCard: {
    flex: 1,
    minWidth: "48%",
    padding: 8, // Reduced from 12
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  moveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  moveType: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  moveTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  moveName: {
    fontSize: 14, // Reduced from 16
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4, // Reduced from 8
  },
  moveStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  moveStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  moveStatText: {
    fontSize: 12,
    fontWeight: "500",
  },
  backButton: {
    position: "absolute",
    top: 80, // Increase from 16 to 80 to avoid overlap
    left: 16,
    zIndex: 100,
  },
  backButtonContent: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  profileSection: {
    marginTop: 8, // Reduced from 16
    padding: 8, // Reduced from 12
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  profileCard: {
    borderRadius: 12,
  },
  profileAvatar: {
    width: 32, // Reduced from 40
    height: 32, // Reduced from 40
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    color: "#ffffff",
    fontSize: 12, // Reduced from 14
    fontWeight: "600",
  },
  profileRank: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10, // Reduced from 12
  },
  profileStats: {
    flexDirection: "row",
    gap: 12,
  },
  profileStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  profileStatText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
})

