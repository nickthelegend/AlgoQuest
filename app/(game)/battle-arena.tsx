"use client"

import { useEffect, useState, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Vibration, StatusBar, Alert } from "react-native"
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
  X,
  AlertTriangle,
} from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import { createElement } from "react"
import * as SecureStore from "expo-secure-store"
import { supabase } from "@/lib/supabase"

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
  id: string | number
  name: string
  level: number
  health: number
  maxHealth: number
  energy: number
  maxEnergy: number
  power: number
  element: string
  image_url: string
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

// Helper function to get the full image URL
const getImageUrl = (imageUrl: string | undefined) => {
  if (!imageUrl) return undefined

  // If it's already a full URL, return it
  if (imageUrl.startsWith("http")) return imageUrl

  // If it's an IPFS hash, construct the full URL
  if (imageUrl.startsWith("Qm") || imageUrl.startsWith("baf")) {
    return `https://gateway.pinata.cloud/ipfs/${imageUrl}`
  }

  // Otherwise return as is
  return imageUrl
}

// Add this helper function at the top of the component, after the getImageUrl function
const truncateWalletAddress = (address: string) => {
  if (!address) return "Unknown"
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function BattleArenaScreen() {
  const [currentTurn, setCurrentTurn] = useState<"player1" | "player2">("player1")
  const [turnTime, setTurnTime] = useState(30)
  const [battleStarted, setBattleStarted] = useState(false)
  const [selectedMove, setSelectedMove] = useState<Move | null>(null)
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([])
  const [showBattleLog, setShowBattleLog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<"player1" | "player2" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { beastId } = useLocalSearchParams()
  const [player1Beast, setPlayer1Beast] = useState<Beast | null>(null)
  const [player2Beast, setPlayer2Beast] = useState<Beast | null>(null)
  const [player1Name, setPlayer1Name] = useState("You")
  const [player2Name, setPlayer2Name] = useState("Opponent")

  // Animation values
  const player1Health = useSharedValue(100)
  const player2Health = useSharedValue(100)
  const player1Energy = useSharedValue(100)
  const player2Energy = useSharedValue(100)
  const shakeValue = useSharedValue(0)
  const flashValue = useSharedValue(0)

  // Refs for beast images
  const player1BeastRef = useRef(null)
  const player2BeastRef = useRef(null)

  // Default moves for each element
  const defaultMoves: Record<string, Move[]> = {
    fire: [
      {
        id: "fire1",
        name: "Flame Strike",
        type: "physical",
        element: "fire",
        power: 80,
        accuracy: 95,
        energyCost: 25,
        description: "A powerful strike imbued with fire",
        icon: Flame,
      },
      {
        id: "fire2",
        name: "Inferno",
        type: "magical",
        element: "fire",
        power: 100,
        accuracy: 85,
        energyCost: 40,
        description: "Summons a raging inferno to engulf the opponent",
        icon: Flame,
      },
    ],
    water: [
      {
        id: "water1",
        name: "Tidal Wave",
        type: "magical",
        element: "water",
        power: 85,
        accuracy: 90,
        energyCost: 30,
        description: "Summons a powerful wave to crash into the opponent",
        icon: Cloud,
      },
      {
        id: "water2",
        name: "Ice Shard",
        type: "physical",
        element: "water",
        power: 70,
        accuracy: 100,
        energyCost: 20,
        description: "Launches sharp ice shards at the opponent",
        icon: Cloud,
      },
    ],
    earth: [
      {
        id: "earth1",
        name: "Stone Edge",
        type: "physical",
        element: "earth",
        power: 90,
        accuracy: 85,
        energyCost: 30,
        description: "Launches sharp stones at the opponent",
        icon: Mountain,
      },
      {
        id: "earth2",
        name: "Earthquake",
        type: "magical",
        element: "earth",
        power: 100,
        accuracy: 80,
        energyCost: 45,
        description: "Creates a powerful earthquake to damage the opponent",
        icon: Mountain,
      },
    ],
    wind: [
      {
        id: "wind1",
        name: "Gale Force",
        type: "magical",
        element: "wind",
        power: 75,
        accuracy: 100,
        energyCost: 25,
        description: "Summons a powerful gust of wind",
        icon: Wind,
      },
      {
        id: "wind2",
        name: "Tornado Slash",
        type: "physical",
        element: "wind",
        power: 85,
        accuracy: 90,
        energyCost: 30,
        description: "A slashing attack enhanced by wind energy",
        icon: Wind,
      },
    ],
    light: [
      {
        id: "light1",
        name: "Solar Flare",
        type: "magical",
        element: "light",
        power: 90,
        accuracy: 95,
        energyCost: 35,
        description: "Blinds the opponent with intense light",
        icon: Sun,
      },
      {
        id: "light2",
        name: "Divine Strike",
        type: "physical",
        element: "light",
        power: 80,
        accuracy: 100,
        energyCost: 30,
        description: "A powerful strike imbued with light energy",
        icon: Sun,
      },
      {
        id: "light3",
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
        id: "light4",
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
    dark: [
      {
        id: "dark1",
        name: "Shadow Strike",
        type: "physical",
        element: "dark",
        power: 85,
        accuracy: 95,
        energyCost: 30,
        description: "A quick strike from the shadows",
        icon: Moon,
      },
      {
        id: "dark2",
        name: "Void Blast",
        type: "magical",
        element: "dark",
        power: 95,
        accuracy: 85,
        energyCost: 40,
        description: "Channels void energy for a powerful blast",
        icon: Moon,
      },
    ],
  }

  // Add a default set of moves for unknown elements
  defaultMoves.default = [
    {
      id: "default1",
      name: "Basic Attack",
      type: "physical",
      element: "neutral",
      power: 60,
      accuracy: 100,
      energyCost: 15,
      description: "A basic physical attack",
      icon: Swords,
    },
    {
      id: "default2",
      name: "Energy Blast",
      type: "magical",
      element: "neutral",
      power: 70,
      accuracy: 90,
      energyCost: 25,
      description: "A blast of pure energy",
      icon: Sparkles,
    },
  ]

  useEffect(() => {
    // Hide status bar for immersive experience
    StatusBar.setHidden(true)
    return () => {
      StatusBar.setHidden(false)
    }
  }, [])

  // Battle timer
  useEffect(() => {
    if (battleStarted && turnTime > 0 && !gameOver) {
      const timer = setInterval(() => {
        setTurnTime((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(timer)
    } else if (battleStarted && turnTime === 0 && !gameOver) {
      // Time's up, switch turns
      handleTimeUp()
    }
  }, [battleStarted, turnTime, gameOver])

  const handleTimeUp = () => {
    // Add to battle log
    setBattleLogs((prev) => [
      {
        id: Date.now().toString(),
        message: `${currentTurn === "player1" ? player1Name : player2Name} ran out of time!`,
        type: "system",
        timestamp: Date.now(),
      },
      ...prev.slice(0, 4), // Keep only last 5 messages
    ])

    // Switch turns
    setCurrentTurn(currentTurn === "player1" ? "player2" : "player1")
    setTurnTime(30)

    // If it's now AI's turn, make them attack after a delay
    if (currentTurn === "player1") {
      setTimeout(() => {
        handleAIAttack()
      }, 1500)
    }
  }

  // Update the fetchBattleData function - replace the existing useEffect with this:
  useEffect(() => {
    // Fetch the selected beast data and opponent data
    const fetchBattleData = async () => {
      setIsLoading(true)
      try {
        // Get user ID and wallet address
        const userId = await SecureStore.getItemAsync("userId")
        const userWalletAddress = await SecureStore.getItemAsync("walletAddress")

        // Set player name as truncated wallet address
        if (userWalletAddress) {
          setPlayer1Name(truncateWalletAddress(userWalletAddress))
        }

        // Get selected beast ID
        const selectedBeastId = beastId || (await SecureStore.getItemAsync("selectedBeastId"))

        if (!selectedBeastId) {
          setError("No beast selected for battle. Please select a beast first.")
          setIsLoading(false)
          return
        }

        // Fetch player beast from database
        const { data: playerBeastData, error: playerBeastError } = await supabase
          .from("beasts")
          .select("*")
          .eq("id", selectedBeastId)
          .single()

        if (playerBeastError || !playerBeastData) {
          setError("Failed to load your beast data. Please try again.")
          setIsLoading(false)
          return
        }

        // Add health and energy properties to the beast
        const playerBeast = {
          ...playerBeastData,
          health: playerBeastData.power * 100,
          maxHealth: playerBeastData.power * 100,
          energy: 100,
          maxEnergy: 100,
          level: Math.floor(playerBeastData.power / 100) + 1,
        }
        setPlayer1Beast(playerBeast)

        // Fetch opponent beast - in a real app, this would be from matchmaking
        // For now, we'll fetch a random beast from the database that isn't owned by the user
        const { data: opponentBeastData, error: opponentBeastError } = await supabase
          .from("beasts")
          .select("*, users!inner(wallet_address)")
          .neq("owner_id", userId)
          .order("created_at", { ascending: false })
          .limit(10)

        if (opponentBeastError || !opponentBeastData || opponentBeastData.length === 0) {
          setError("Failed to find an opponent. Please try again later.")
          setIsLoading(false)
          return
        }

        // Select a random opponent beast from the results
        const randomOpponent = opponentBeastData[Math.floor(Math.random() * opponentBeastData.length)]

        // Set opponent name as truncated wallet address
        setPlayer2Name(truncateWalletAddress(randomOpponent.users?.wallet_address || ""))

        // Add health and energy properties to the opponent beast
        const opponentBeast = {
          ...randomOpponent,
          health: randomOpponent.power * 100,
          maxHealth: randomOpponent.power * 100,
          energy: 100,
          maxEnergy: 100,
          level: Math.floor(randomOpponent.power / 100) + 1,
        }
        setPlayer2Beast(opponentBeast)

        // Start battle after a short delay
        setTimeout(() => {
          setBattleStarted(true)
        }, 1000)
      } catch (error) {
        console.error("Error fetching battle data:", error)
        setError("An unexpected error occurred. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBattleData()
  }, [beastId])

  // Handle AI opponent's turn
  useEffect(() => {
    if (battleStarted && currentTurn === "player2" && !gameOver) {
      const aiAttackDelay = setTimeout(() => {
        handleAIAttack()
      }, 2000)

      return () => clearTimeout(aiAttackDelay)
    }
  }, [currentTurn, battleStarted, gameOver])

  const handleAIAttack = () => {
    if (!player2Beast || gameOver) return

    // Get AI moves based on element
    const element = player2Beast.element?.toLowerCase() || "default"

    const availableMoves = defaultMoves[element] || defaultMoves.default

    // Randomly select a move
    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)]

    // Execute the attack
    handleAttack(randomMove, "player2")
  }

  // Handle player attack
  const handleAttack = (move: Move, attacker: "player1" | "player2" = "player1") => {
    if (gameOver) return

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

    // Calculate damage (simplified)
    const attackerBeast = attacker === "player1" ? player1Beast : player2Beast
    const defenderBeast = attacker === "player1" ? player2Beast : player1Beast

    if (!attackerBeast || !defenderBeast) return

    // Base damage calculation
    let damage = move.power * (attackerBeast.stats.attack / defenderBeast.stats.defense) * 0.5

    // Add some randomness (±10%)
    damage = damage * (0.9 + Math.random() * 0.2)

    // Round to nearest integer
    damage = Math.round(damage)

    // Update health and energy
    if (attacker === "player1") {
      // Player 1 attacks Player 2
      const newHealth = Math.max(0, defenderBeast.health - damage)
      player2Health.value = withSpring((newHealth / defenderBeast.maxHealth) * 100)
      player1Energy.value = withSpring(
        Math.max(0, ((attackerBeast.energy - move.energyCost) / attackerBeast.maxEnergy) * 100),
      )

      // Update beast objects
      setPlayer2Beast({
        ...defenderBeast,
        health: newHealth,
      })

      setPlayer1Beast({
        ...attackerBeast,
        energy: Math.max(0, attackerBeast.energy - move.energyCost),
      })

      // Check if opponent is defeated
      if (newHealth <= 0) {
        handleGameOver("player1")
      }
    } else {
      // Player 2 attacks Player 1
      const newHealth = Math.max(0, defenderBeast.health - damage)
      player1Health.value = withSpring((newHealth / defenderBeast.maxHealth) * 100)
      player2Energy.value = withSpring(
        Math.max(0, ((attackerBeast.energy - move.energyCost) / attackerBeast.maxEnergy) * 100),
      )

      // Update beast objects
      setPlayer1Beast({
        ...defenderBeast,
        health: newHealth,
      })

      setPlayer2Beast({
        ...attackerBeast,
        energy: Math.max(0, attackerBeast.energy - move.energyCost),
      })

      // Check if player is defeated
      if (newHealth <= 0) {
        handleGameOver("player2")
      }
    }

    // Add to battle log
    setBattleLogs((prev) => [
      {
        id: Date.now().toString(),
        message: `${attacker === "player1" ? player1Name : player2Name} used ${move.name}! Dealt ${damage} damage!`,
        type: "attack",
        timestamp: Date.now(),
      },
      ...prev.slice(0, 4), // Keep only last 5 messages
    ])

    // If game is not over, switch turns
    if (!gameOver) {
      setCurrentTurn(attacker === "player1" ? "player2" : "player1")
      setTurnTime(30)
    }
  }

  const handleGameOver = (winningPlayer: "player1" | "player2") => {
    setGameOver(true)
    setWinner(winningPlayer)

    // Add to battle log
    setBattleLogs((prev) => [
      {
        id: Date.now().toString(),
        message: `${winningPlayer === "player1" ? player1Name : player2Name} is victorious!`,
        type: "system",
        timestamp: Date.now(),
      },
      ...prev.slice(0, 4),
    ])

    // Show battle log with results
    setShowBattleLog(true)

    // Record battle result in database
    recordBattleResult(winningPlayer).catch(console.error)
  }

  const recordBattleResult = async (winningPlayer: "player1" | "player2") => {
    try {
      const userId = await SecureStore.getItemAsync("userId")
      if (!userId || !player1Beast || !player2Beast) return

      // Record battle in database
      await supabase.from("battles").insert({
        user_id: userId,
        user_beast_id: player1Beast.id,
        opponent_beast_id: player2Beast.id,
        result: winningPlayer === "player1" ? "win" : "loss",
        battle_date: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to record battle result:", error)
      // Don't show error to user, this is a background operation
    }
  }

  const handleExitBattle = () => {
    Alert.alert("Leave Battle", "Are you sure you want to leave the battle?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => router.back(),
      },
    ])
  }

  // Animation styles
  const shakeAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeValue.value }],
  }))

  const flashAnimation = useAnimatedStyle(() => ({
    opacity: flashValue.value,
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

  // Helper functions for element icons and colors
  const getElementIcon = (element: string) => {
    switch (element?.toLowerCase()) {
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
    switch (element?.toLowerCase()) {
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

  // Error screen
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#000000", "#1a1c2c", "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Battle Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Return to Map</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Loading screen
  if (isLoading || !player1Beast || !player2Beast) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#000000", "#1a1c2c", "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <Animated.View entering={FadeIn}>
            <Swords size={48} color="#7C3AED" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(300)} style={styles.loadingText}>
            Preparing Battle...
          </Animated.Text>
        </View>
      </SafeAreaView>
    )
  }

  // Get player moves based on beast element
  const playerMoves = defaultMoves[player1Beast.element?.toLowerCase() || "default"] || defaultMoves.default

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
                <Text style={styles.playerName}>{player2Name}</Text>
                <View style={styles.rankBadge}>
                  <Crown size={12} color="#FFD700" />
                  <Text style={styles.rankText}>#1100</Text>
                </View>
              </View>
              <View style={styles.beastInfo}>
                <Text style={styles.beastName}>{player2Beast.name}</Text>
                <View style={styles.elementBadge}>
                  {createElement(getElementIcon(player2Beast.element), {
                    size: 12,
                    color: getElementColor(player2Beast.element),
                  })}
                  <Text style={[styles.elementText, { color: getElementColor(player2Beast.element) }]}>
                    {player2Beast.element}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Heart size={16} color="#EF4444" />
                <View style={styles.statBarContainer}>
                  <Animated.View style={[styles.statBar, player2HealthStyle, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.statText}>{Math.round(player2Beast.health)}</Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <Zap size={16} color="#7C3AED" />
                <View style={styles.statBarContainer}>
                  <Animated.View style={[styles.statBar, player2EnergyStyle, { backgroundColor: "#7C3AED" }]} />
                  <Text style={styles.statText}>{Math.round(player2Beast.energy)}</Text>
                </View>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Battle Scene */}
        <View style={styles.battleScene}>
          {/* Battle Timer */}
          {!gameOver && (
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
          )}

          {/* Enemy Beast */}
          <Animated.View
            ref={player2BeastRef}
            entering={SlideInRight.delay(300)}
            style={[styles.beastContainer, styles.enemyBeastContainer, currentTurn === "player1" && shakeAnimation]}
          >
            <LinearGradient
              colors={[`${getElementColor(player2Beast.element)}40`, "transparent"]}
              style={styles.beastGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <Image
              source={{ uri: getImageUrl(player2Beast.image_url) }}
              style={styles.beastImage}
              resizeMode="contain"
              onError={(e) => console.log("Error loading enemy beast image:", e.nativeEvent.error)}
            />
          </Animated.View>

          {/* Player Beast */}
          <Animated.View
            ref={player1BeastRef}
            entering={SlideInLeft.delay(300)}
            style={[styles.beastContainer, styles.playerBeastContainer, currentTurn === "player2" && shakeAnimation]}
          >
            <LinearGradient
              colors={[`${getElementColor(player1Beast.element)}40`, "transparent"]}
              style={styles.beastGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <Image
              source={{ uri: getImageUrl(player1Beast.image_url) }}
              style={styles.beastImage}
              resizeMode="contain"
              onError={(e) => console.log("Error loading player beast image:", e.nativeEvent.error)}
            />
          </Animated.View>

          {/* VS Badge (only shown at start) */}
          {!battleStarted && (
            <Animated.View entering={FadeIn.delay(500)} style={styles.vsBadge}>
              <BlurView intensity={60} tint="dark" style={styles.vsBadgeContent}>
                <LinearGradient
                  colors={["rgba(239, 68, 68, 0.4)", "rgba(124, 58, 237, 0.4)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.vsText}>VS</Text>
              </BlurView>
            </Animated.View>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <Animated.View entering={FadeIn} style={styles.gameOverOverlay}>
              <BlurView intensity={40} tint="dark" style={styles.gameOverCard}>
                <LinearGradient
                  colors={[
                    winner === "player1" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
                    "rgba(0, 0, 0, 0.3)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.gameOverTitle}>{winner === "player1" ? "Victory!" : "Defeat!"}</Text>
                <Text style={styles.gameOverText}>
                  {winner === "player1"
                    ? `Your ${player1Beast.name} has defeated the opponent's ${player2Beast.name}!`
                    : `Your ${player1Beast.name} has been defeated by the opponent's ${player2Beast.name}!`}
                </Text>
                <TouchableOpacity style={styles.exitButton} onPress={() => router.back()}>
                  <Text style={styles.exitButtonText}>Return to Map</Text>
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
          )}
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
                <Text style={styles.playerName}>{player1Name}</Text>
                <View style={styles.rankBadge}>
                  <Crown size={12} color="#FFD700" />
                  <Text style={styles.rankText}>#1234</Text>
                </View>
              </View>
              <View style={styles.beastInfo}>
                <Text style={styles.beastName}>{player1Beast.name}</Text>
                <View style={styles.elementBadge}>
                  {createElement(getElementIcon(player1Beast.element), {
                    size: 12,
                    color: getElementColor(player1Beast.element),
                  })}
                  <Text style={[styles.elementText, { color: getElementColor(player1Beast.element) }]}>
                    {player1Beast.element}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Heart size={16} color="#EF4444" />
                <View style={styles.statBarContainer}>
                  <Animated.View style={[styles.statBar, player1HealthStyle, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.statText}>{Math.round(player1Beast.health)}</Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <Zap size={16} color="#7C3AED" />
                <View style={styles.statBarContainer}>
                  <Animated.View style={[styles.statBar, player1EnergyStyle, { backgroundColor: "#7C3AED" }]} />
                  <Text style={styles.statText}>{Math.round(player1Beast.energy)}</Text>
                </View>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Battle Log */}
        {showBattleLog && (
          <Animated.View entering={SlideInLeft} style={styles.battleLog}>
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

        {/* Moves Panel - Only show when it's player's turn and game is not over */}
        {currentTurn === "player1" && !gameOver && (
          <Animated.View entering={FadeInUp} style={styles.movesPanel}>
            <BlurView intensity={40} tint="dark" style={styles.movesPanelContent}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.movesGrid}>
                {playerMoves.map((move) => (
                  <TouchableOpacity
                    key={move.id}
                    style={[
                      styles.moveCard,
                      { borderColor: getMoveTypeColor(move.type) },
                      player1Beast.energy < move.energyCost && styles.disabledMove,
                    ]}
                    onPress={() => player1Beast.energy >= move.energyCost && handleAttack(move)}
                    disabled={player1Beast.energy < move.energyCost}
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
        <TouchableOpacity style={styles.backButton} onPress={handleExitBattle}>
          <BlurView intensity={40} tint="dark" style={styles.backButtonContent}>
            <X size={24} color="#ffffff" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: "rgba(124, 58, 237, 0.8)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  errorButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  arenaContainer: {
    flex: 1,
    padding: 16,
  },
  enemyStats: {
    width: "100%",
    marginBottom: 10,
  },
  playerStats: {
    width: "100%",
    marginTop: 10,
  },
  statsCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  statsHeader: {
    marginBottom: 12,
  },
  playerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
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
    marginTop: 8,
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
    paddingVertical: 10,
  },
  battleTimer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    zIndex: 10,
  },
  timerCard: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  timerText: {
    fontSize: 20,
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
    width: 180,
    height: 180,
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
    marginTop: 10,
  },
  beastImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    borderRadius: 10,
  },
  battleLog: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -140 }, { translateY: -50 }],
    width: 280,
    zIndex: 20,
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
    bottom: 100,
    left: 16,
    right: 16,
    marginBottom: 8,
    zIndex: 50,
  },
  movesPanelContent: {
    padding: 12,
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
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  disabledMove: {
    opacity: 0.5,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
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
    top: 16,
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
  vsBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -40 }, { translateY: -40 }],
    zIndex: 30,
  },
  vsBadgeContent: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  vsText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
  },
  gameOverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  gameOverCard: {
    width: "80%",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  gameOverText: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 24,
  },
  exitButton: {
    backgroundColor: "rgba(124, 58, 237, 0.8)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  exitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
