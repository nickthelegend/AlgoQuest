"use client"

import { useEffect, useState, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Vibration, StatusBar, Alert, ActivityIndicator } from "react-native"
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
  SlideInUp,
  SlideInDown,
  ZoomIn,
  BounceIn,
} from "react-native-reanimated"
import {
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
  Timer,
  Activity,
  Users,
  Wifi,
} from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import { createElement } from "react"
import * as SecureStore from "expo-secure-store"
import { supabase } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"
import vsImage from "../../assets/images/vs/vs.png"
import * as Notifications from "expo-notifications"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

interface BeastAbility {
  id: string
  name: string
  type: "attack" | "heal" | "buff" | "debuff" | "energy"
  element: "fire" | "water" | "earth" | "wind" | "light" | "dark"
  power: number
  accuracy: number
  energy_cost: number
  cooldown: number
  description: string
  metadata?: any
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
  abilities: BeastAbility[]
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

interface Battle {
  id: string
  player1_id: string
  player2_id: string
  player1_beast_id: string
  player2_beast_id: string
  winner_id?: string
  battle_data: {
    moves: Array<{
      id: string
      player_id: string
      ability: BeastAbility
      damage?: number
      healing?: number
      energyRestore?: number
      isCritical?: boolean
      effectiveness?: number
      targetHealth?: number
      targetEnergy?: number
      attackerHealth?: number
      attackerEnergy?: number
      timestamp: number
    }>
    player1_beast_state?: {
      health: number
      energy: number
      status?: any
    }
    player2_beast_state?: {
      health: number
      energy: number
      status?: any
    }
  }
  status: "waiting" | "active" | "completed" | "abandoned"
  current_turn: "player1" | "player2"
  turn_number: number
  turn_time_remaining: number
  created_at: string
  updated_at: string
  ended_at?: string
}

interface BattleLog {
  id: string
  message: string
  type: "attack" | "heal" | "buff" | "debuff" | "status" | "system"
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
  const [selectedMove, setSelectedMove] = useState<BeastAbility | null>(null)
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([])
  const [showBattleLog, setShowBattleLog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<"player1" | "player2" | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Add this after the other state declarations
  const [logCounter, setLogCounter] = useState(0)

  // Real-time multiplayer states
  const [battleId, setBattleId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [isPlayer1, setIsPlayer1] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [turnNumber, setTurnNumber] = useState(1)
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)

  const { beastId, opponentId, battleId: existingBattleId } = useLocalSearchParams()

  // Replace these lines:
  // const [player1Beast, setPlayer1Beast] = useState<Beast | null>(null)
  // const [player2Beast, setPlayer2Beast] = useState<Beast | null>(null)
  // const [player1Name, setPlayer1Name] = useState("You")
  // const [player2Name, setPlayer2Name] = useState("Opponent")

  // Animation values
  // const player1Health = useSharedValue(100)
  // const player2Health = useSharedValue(100)
  // const player1Energy = useSharedValue(100)
  // const player2Energy = useSharedValue(100)

  // With these perspective-based variables:
  const [myBeast, setMyBeast] = useState<Beast | null>(null)
  const [opponentBeast, setOpponentBeast] = useState<Beast | null>(null)
  const [myName, setMyName] = useState("You")
  const [opponentName, setOpponentName] = useState("Opponent")

  // Animation values (perspective-based)
  const myHealth = useSharedValue(100)
  const opponentHealth = useSharedValue(100)
  const myEnergy = useSharedValue(100)
  const opponentEnergy = useSharedValue(100)

  // Animation values
  const shakeValue = useSharedValue(0)
  const flashValue = useSharedValue(0)
  const battleFieldScale = useSharedValue(1)

  // Refs for beast images
  const player1BeastRef = useRef(null)
  const player2BeastRef = useRef(null)

  // Add elemental effectiveness chart
  const elementalChart: Record<string, Record<string, number>> = {
    fire: { water: 0.5, earth: 2.0, wind: 1.5, light: 1.0, dark: 1.0, fire: 0.5 },
    water: { fire: 2.0, earth: 0.5, wind: 1.0, light: 1.0, dark: 1.0, water: 0.5 },
    earth: { fire: 0.5, water: 2.0, wind: 0.5, light: 1.0, dark: 1.0, earth: 0.5 },
    wind: { fire: 0.5, water: 1.0, earth: 2.0, light: 1.0, dark: 1.0, wind: 0.5 },
    light: { dark: 2.0, fire: 1.0, water: 1.0, earth: 1.0, wind: 1.0, light: 0.5 },
    dark: { light: 2.0, fire: 1.0, water: 1.0, earth: 1.0, wind: 1.0, dark: 0.5 },
  }

  // Add status effect processing function
  const processStatusEffects = (beast: Beast, setBeast: (beast: Beast) => void, healthValue: any) => {
    if (!beast.status) return beast

    let newHealth = beast.health
    let statusMessage = ""

    switch (beast.status.type) {
      case "burn":
        const burnDamage = Math.floor(beast.maxHealth * 0.06) // 6% max health
        newHealth = Math.max(0, beast.health - burnDamage)
        statusMessage = `${beast.name} takes ${burnDamage} burn damage!`
        break
      case "poison":
        const poisonDamage = Math.floor(beast.maxHealth * 0.04) // 4% max health
        newHealth = Math.max(0, beast.health - poisonDamage)
        statusMessage = `${beast.name} takes ${poisonDamage} poison damage!`
        break
      case "freeze":
        statusMessage = `${beast.name} is frozen and cannot attack!`
        break
    }

    // Update health bar
    if (newHealth !== beast.health) {
      healthValue.value = withSpring((newHealth / beast.maxHealth) * 100)
    }

    // Reduce status duration
    const newStatus = beast.status.duration > 1 ? { ...beast.status, duration: beast.status.duration - 1 } : undefined

    const updatedBeast = {
      ...beast,
      health: newHealth,
      status: newStatus,
    }

    setBeast(updatedBeast)

    // Add status message to battle log
    if (statusMessage) {
      setLogCounter((prev) => prev + 1)
      setBattleLogs((prev) => [
        {
          id: `${Date.now()}_${logCounter}_status`,
          message: statusMessage,
          type: "status" as const,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 4),
      ])
    }

    return updatedBeast
  }

  useEffect(() => {
    // Hide status bar for immersive experience
    StatusBar.setHidden(true)
    return () => {
      StatusBar.setHidden(false)
    }
  }, [])

  // Initialize battle and real-time connection
  useEffect(() => {
    initializeBattle()

    return () => {
      // Cleanup real-time connection
      if (realtimeChannel) {
        console.log("Cleaning up real-time connection...")
        realtimeChannel.unsubscribe()
        setRealtimeChannel(null)
      }
    }
  }, [])

  // Separate effect to handle real-time channel cleanup when battleId changes
  useEffect(() => {
    return () => {
      if (realtimeChannel && battleId) {
        console.log(`Unsubscribing from battle:${battleId}`)
        realtimeChannel.unsubscribe()
      }
    }
  }, [battleId, realtimeChannel])

  // Battle timer
  useEffect(() => {
    if (battleStarted && turnTime > 0 && !gameOver && !waitingForOpponent) {
      const timer = setInterval(() => {
        setTurnTime((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(timer)
    } else if (battleStarted && turnTime === 0 && !gameOver && !waitingForOpponent) {
      // Time's up, switch turns
      handleTimeUp()
    }
  }, [battleStarted, turnTime, gameOver, waitingForOpponent])

  // Monitor connection status and show warning if disconnected
  useEffect(() => {
    if (connectionStatus === "disconnected" && battleStarted && !gameOver) {
      Alert.alert(
        "Connection Lost",
        "You've been disconnected from the battle. Attempting to reconnect...",
        [
          {
            text: "Retry Now",
            onPress: () => {
              if (battleId) {
                setupRealtimeConnection(battleId)
              }
            },
          },
          {
            text: "Exit Battle",
            onPress: () => router.back(),
            style: "destructive",
          },
        ]
      )
    }
  }, [connectionStatus, battleStarted, gameOver])

  // Replace the loadBattleData function with:
  const loadBattleData = async (battle: Battle, userId: string) => {
    try {
      // Load player 1 beast
      const { data: player1BeastData, error: p1Error } = await supabase
        .from("beasts")
        .select("*, users!inner(wallet_address)")
        .eq("id", battle.player1_beast_id)
        .single()

      if (p1Error) throw p1Error

      // Load player 2 beast (if exists)
      let player2BeastData = null
      if (battle.player2_beast_id) {
        const { data, error } = await supabase
          .from("beasts")
          .select("*, users!inner(wallet_address)")
          .eq("id", battle.player2_beast_id)
          .single()

        if (error) throw error
        player2BeastData = data
      }

      // Process beast data
      const player1Beast = await processBeastData(player1BeastData)
      const player2Beast = player2BeastData ? await processBeastData(player2BeastData) : null

      // Set beast data based on user perspective (always "my" beast at bottom, "opponent" at top)
      if (battle.player1_id === userId) {
        // I am player1, so my beast is player1Beast, opponent is player2Beast
        setMyBeast(player1Beast)
        setOpponentBeast(player2Beast)
        setMyName("You")
        setOpponentName(player2Beast ? truncateWalletAddress(player2BeastData.users.wallet_address) : "Waiting...")

        // Initialize health bars for my perspective
        if (player1Beast) {
          myHealth.value = withSpring((player1Beast.health / player1Beast.maxHealth) * 100)
          myEnergy.value = withSpring((player1Beast.energy / player1Beast.maxEnergy) * 100)
        }
        if (player2Beast) {
          opponentHealth.value = withSpring((player2Beast.health / player2Beast.maxHealth) * 100)
          opponentEnergy.value = withSpring((player2Beast.energy / player2Beast.maxEnergy) * 100)
        }
      } else {
        // I am player2, so my beast is player2Beast, opponent is player1Beast
        setMyBeast(player2Beast)
        setOpponentBeast(player1Beast)
        setMyName("You")
        setOpponentName(player1Beast ? truncateWalletAddress(player1BeastData.users.wallet_address) : "Waiting...")

        // Initialize health bars for my perspective
        if (player2Beast) {
          myHealth.value = withSpring((player2Beast.health / player2Beast.maxHealth) * 100)
          myEnergy.value = withSpring((player2Beast.energy / player2Beast.maxEnergy) * 100)
        }
        if (player1Beast) {
          opponentHealth.value = withSpring((player1Beast.health / player1Beast.maxHealth) * 100)
          opponentEnergy.value = withSpring((player1Beast.energy / player1Beast.maxEnergy) * 100)
        }
      }

      // Start battle if both players are ready
      if (battle.status === "active" && player1Beast && player2Beast) {
        setBattleStarted(true)
        setWaitingForOpponent(false)
        setCurrentTurn(battle.current_turn)
        setTurnNumber(battle.turn_number)
        setTurnTime(battle.turn_time_remaining)
      }
    } catch (error) {
      console.error("Error loading battle data:", error)
      throw error
    }
  }

  const initializeBattle = async () => {
    try {
      setIsLoading(true)

      // Get current user ID - try multiple sources
      let userId = await SecureStore.getItemAsync("userId")

      // If no userId in SecureStore, try to get from Supabase auth
      if (!userId) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          userId = user.id
          // Store it for future use
          await SecureStore.setItemAsync("userId", user.id)
        }
      }

      if (!userId) {
        setError("User not found. Please log in again.")
        return
      }

      console.log("User ID:", userId) // Debug log

      setCurrentUserId(userId)

      // Get selected beast ID
      const beastIdParam = Array.isArray(beastId) ? beastId[0] : beastId
      const selectedBeastId = beastIdParam || (await SecureStore.getItemAsync("selectedBeastId"))
      if (!selectedBeastId) {
        setError("No beast selected for battle. Please select a beast first.")
        return
      }

      console.log("Selected Beast ID:", selectedBeastId) // Debug log
      console.log("Params - existingBattleId:", existingBattleId, "opponentId:", opponentId)

      // Verify the beast exists and belongs to the user - use string ID directly
      const { data: beastCheck, error: beastError } = await supabase
        .from("beasts")
        .select("id, owner_id")
        .eq("id", selectedBeastId) // Use selectedBeastId directly as string
        .single()

      if (beastError || !beastCheck) {
        console.error("Beast verification error:", beastError)
        setError("Selected beast not found. Please select a valid beast.")
        return
      }

      if (beastCheck.owner_id !== userId) {
        setError("You don't own this beast. Please select one of your beasts.")
        return
      }

      console.log("Beast verified:", beastCheck) // Debug log

      // Create or join battle
      let battle: Battle

      if (existingBattleId) {
        // Join existing battle using battle ID (player 2 joining from confirm screen)
        const battleIdStr = Array.isArray(existingBattleId) ? existingBattleId[0] : existingBattleId
        console.log("Joining existing battle with ID:", battleIdStr)
        battle = await joinExistingBattle(userId, selectedBeastId, battleIdStr)
      } else if (opponentId) {
        // Join existing battle using battle code (player 2 joining via code)
        const opponentIdStr = Array.isArray(opponentId) ? opponentId[0] : opponentId
        console.log("Joining battle by code:", opponentIdStr)
        battle = await joinBattleByCode(userId, selectedBeastId, opponentIdStr)
      } else {
        // Create battle and wait for opponent (player 1 creating new battle)
        console.log("Creating new battle")
        battle = await createBattle(userId, selectedBeastId)
        setWaitingForOpponent(true)
      }

      console.log("Battle created/joined:", battle) // Debug log

      setBattleId(battle.id)
      setIsPlayer1(battle.player1_id === userId)

      // Load battle data
      await loadBattleData(battle, userId)

      // Set up real-time connection
      setupRealtimeConnection(battle.id)
    } catch (error) {
      console.error("Error initializing battle:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(`Failed to initialize battle: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const joinExistingBattle = async (userId: string, beastId: string, battleId: string): Promise<Battle> => {
    // Get the existing battle
    const { data: existingBattle, error: findError } = await supabase
      .from("battles")
      .select()
      .eq("id", battleId)
      .single()

    if (findError || !existingBattle) {
      throw new Error("Battle not found.")
    }

    // Check if this is the battle creator returning to their own battle
    if (existingBattle.player1_id === userId) {
      // This is the battle creator, just return the battle
      return existingBattle
    }

    // Check if this player is already player2 in an active battle
    if (existingBattle.player2_id === userId && existingBattle.status === "active") {
      // Player 2 is rejoining an active battle they're already part of
      return existingBattle
    }

    // This is player 2 joining the battle for the first time
    if (existingBattle.status === "waiting") {
      // Join the battle
      const { data, error } = await supabase
        .from("battles")
        .update({
          player2_id: userId,
          player2_beast_id: beastId,
          status: "active",
        })
        .eq("id", battleId)
        .select()
        .single()

      if (error) throw error
      return data
    } else if (existingBattle.status === "active" && !existingBattle.player2_id) {
      // Battle is active but missing player 2 (edge case)
      const { data, error } = await supabase
        .from("battles")
        .update({
          player2_id: userId,
          player2_beast_id: beastId,
        })
        .eq("id", battleId)
        .select()
        .single()

      if (error) throw error
      return data
    } else if (existingBattle.status === "completed") {
      throw new Error("This battle has already ended.")
    } else if (existingBattle.status === "abandoned") {
      throw new Error("This battle has been cancelled.")
    } else {
      // Battle is active and already has both players, or some other state
      return existingBattle
    }
  }

  const createBattle = async (userId: string, beastId: string): Promise<Battle> => {
    console.log("Creating battle with:", { userId, beastId }) // Debug log

    const battleData = {
      player1_id: userId,
      player1_beast_id: beastId, // Use string directly
      status: "waiting",
      current_turn: "player1",
      turn_number: 1,
      turn_time_remaining: 30,
      battle_data: {
        moves: [],
      },
    }

    console.log("Battle data to insert:", battleData) // Debug log

    const { data, error } = await supabase.from("battles").insert(battleData).select().single()

    if (error) {
      console.error("Error creating battle:", error)
      throw error
    }

    console.log("Battle created successfully:", data) // Debug log
    return data
  }

  const joinBattleByCode = async (userId: string, beastId: string, battleCode: string): Promise<Battle> => {
    // Find battle by the battle code
    const { data: battles, error: findError } = await supabase
      .from("battles")
      .select()
      .eq("status", "waiting")
      .limit(50)

    if (findError) {
      throw new Error(`Error finding battle: ${findError.message}`)
    }

    if (!battles || battles.length === 0) {
      throw new Error("No waiting battles found. Please check the battle code.")
    }

    console.log(`Found ${battles.length} waiting battles, searching for code: ${battleCode}`)

    // Find a battle with an ID that matches the code (case insensitive)
    const matchingBattle = battles.find((battle) => {
      const battleId = battle.id.toLowerCase()
      const code = battleCode.toLowerCase()
      return battleId.endsWith(code) || battleId.includes(code)
    })

    if (!matchingBattle) {
      throw new Error("Battle room not found. Please check the battle code.")
    }

    console.log("Found matching battle:", matchingBattle.id)

    // Join the battle
    const { data, error } = await supabase
      .from("battles")
      .update({
        player2_id: userId,
        player2_beast_id: beastId,
        status: "active",
      })
      .eq("id", matchingBattle.id)
      .select()
      .single()

    if (error) throw error

    // Send notification to the battle creator via real-time channel
    try {
      const channel = supabase.channel(`battle:${matchingBattle.id}`)
      await channel.send({
        type: "broadcast",
        event: "player_joined",
        payload: {
          message: "Opponent has joined the battle!",
          joinedPlayerId: userId,
          timestamp: Date.now(),
        },
      })
    } catch (notificationError) {
      console.log("Failed to send join notification:", notificationError)
    }

    return data
  }

  const processBeastData = async (beastData: any): Promise<Beast> => {
    const metadata = beastData.metadata
    const abilityIds = metadata.abilities || []
    const abilities = await fetchBeastAbilities(abilityIds)
    const allocatedStats = beastData.allocated_stats || { attack: 50, defense: 50, speed: 50, health: 50 }

    return {
      ...beastData,
      health: allocatedStats.health * 4,
      maxHealth: allocatedStats.health * 4,
      energy: 100,
      maxEnergy: 100,
      level: metadata.tier || 1,
      element: abilities[0]?.element || "fire",
      stats: {
        attack: allocatedStats.attack,
        defense: allocatedStats.defense,
        speed: allocatedStats.speed,
        magic: allocatedStats.attack,
      },
      abilities: [
        ...abilities,
        {
          id: "universal_energy_restore",
          name: "Energy Focus",
          type: "energy",
          element: "light",
          power: 45,
          accuracy: 100,
          energy_cost: 0,
          cooldown: 0,
          description: "Focus to restore 30-60 energy points",
        },
      ],
    }
  }

  const setupRealtimeConnection = (battleId: string) => {
    const channel = supabase
      .channel(`battle:${battleId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "battles",
          filter: `id=eq.${battleId}`,
        },
        (payload) => {
          console.log("Battle update received:", payload.new)
          handleBattleUpdate(payload.new as Battle)
        },
      )
      .on("broadcast", { event: "move" }, (payload) => {
        console.log("Move broadcast received:", payload)
        handleOpponentMove(payload.payload)
      })
      .on("broadcast", { event: "player_joined" }, (payload) => {
        console.log("Player joined broadcast received:", payload)
        if (payload.payload.joinedPlayerId !== currentUserId && waitingForOpponent) {
          // Show immediate notification that opponent joined
          Alert.alert("Opponent Joined!", "Your opponent has joined the battle. Get ready to fight!", [
            {
              text: "Ready!",
              onPress: () => {
                console.log("Battle starting soon...")
              },
            },
          ])
        }
      })
      .on("broadcast", { event: "turn_skipped" }, (payload) => {
        console.log("Turn skipped broadcast received:", payload)
        if (payload.payload.skippedBy !== currentUserId) {
          // Opponent's turn was skipped, update local state
          setCurrentTurn(payload.payload.newTurn)
          setTurnNumber(payload.payload.newTurnNumber)
          setTurnTime(30)
          
          setLogCounter((prev) => prev + 1)
          setBattleLogs((prev) => [
            {
              id: `${Date.now()}_${logCounter}`,
              message: "Opponent ran out of time!",
              type: "system",
              timestamp: Date.now(),
            },
            ...prev.slice(0, 4),
          ])
        }
      })
      .subscribe((status) => {
        console.log("Realtime connection status:", status)
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected")
        } else if (status === "CLOSED") {
          setConnectionStatus("disconnected")
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("disconnected")
          // Attempt to reconnect after a delay
          setTimeout(() => {
            console.log("Attempting to reconnect...")
            setupRealtimeConnection(battleId)
          }, 3000)
        }
      })

    setRealtimeChannel(channel)
  }

  const handleBattleUpdate = async (updatedBattle: Battle) => {
    if (updatedBattle.status === "active" && waitingForOpponent) {
      // Opponent joined, reload battle data
      await loadBattleData(updatedBattle, currentUserId)

      // Notify the battle initiator that opponent has joined
      if (isPlayer1) {
        // Show notification that opponent joined
        Alert.alert("Opponent Joined!", "Your opponent has joined the battle. Get ready to fight!", [
          {
            text: "Let's Battle!",
            onPress: () => {
              // Battle will start automatically after this
            },
          },
        ])

        // Optional: Send a local notification
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Battle Ready!",
              body: "Your opponent has joined the battle arena!",
              sound: true,
            },
            trigger: null, // Immediate notification
          })
        } catch (error) {
          console.log("Notification error:", error)
        }
      }
    } else if (updatedBattle.status === "completed") {
      // Battle ended
      setGameOver(true)
      setWinner(updatedBattle.winner_id === currentUserId ? "player1" : "player2")
    } else if (updatedBattle.battle_data?.moves) {
      // Process new moves
      const moves = updatedBattle.battle_data.moves
      const lastMove = moves[moves.length - 1]

      if (lastMove && lastMove.player_id !== currentUserId) {
        // Apply opponent's move
        applyMoveToGame(lastMove, false)

        // Update turn state
        setCurrentTurn(updatedBattle.current_turn as "player1" | "player2")
        setTurnTime(updatedBattle.turn_time_remaining)
        setTurnNumber(updatedBattle.turn_number)
      }
    }
  }

  const handleOpponentMove = (move: any) => {
    if (move.player_id === currentUserId) return // Ignore own moves

    console.log("Received opponent move:", move)
    console.log("Current user is player1:", isPlayer1)
    console.log("Move player_id:", move.player_id)
    console.log("Current user ID:", currentUserId)

    // Apply opponent's move
    applyMoveToGame(move, false)

    // Switch turns
    setCurrentTurn(isPlayer1 ? "player1" : "player2")
    setTurnTime(30)
    setTurnNumber((prev) => prev + 1)
  }

  // Replace the applyMoveToGame function with:
  const applyMoveToGame = (move: any, isOwnMove: boolean) => {
    const {
      ability,
      damage,
      healing,
      energyRestore,
      isCritical,
      effectiveness,
      targetHealth,
      targetEnergy,
      attackerHealth,
      attackerEnergy,
    } = move

    console.log(`[${isOwnMove ? "Own" : "Opponent"} Move] Applying move:`, {
      damage,
      targetHealth,
      attackerHealth,
      myBeastCurrentHealth: myBeast?.health,
      opponentBeastCurrentHealth: opponentBeast?.health,
    })

    // Enhanced animations (same as before)
    if (isCritical) {
      // Critical hit animation
      shakeValue.value = withSequence(
        withTiming(15, { duration: 80 }),
        withTiming(-15, { duration: 80 }),
        withTiming(10, { duration: 80 }),
        withTiming(-10, { duration: 80 }),
        withTiming(0, { duration: 80 }),
      )
      flashValue.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 150 }),
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 150 }),
      )
    } else {
      // Normal hit animation
      shakeValue.value = withSequence(
        withTiming(10, { duration: 100 }),
        withTiming(-10, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      )
      flashValue.value = withSequence(withTiming(1, { duration: 100 }), withTiming(0, { duration: 100 }))
    }

    battleFieldScale.value = withSequence(
      withTiming(1.02, { duration: 100 }),
      withTiming(0.98, { duration: 100 }),
      withTiming(1, { duration: 100 }),
    )

    // Update beast states and bars based on move
    if (isOwnMove) {
      // This is my move - I'm the attacker, opponent is the target

      // Update opponent's health if damage was dealt
      if (damage && targetHealth !== undefined && opponentBeast) {
        const opponentMaxHealth = opponentBeast.maxHealth
        setOpponentBeast((prev) => (prev ? { ...prev, health: targetHealth } : null))
        opponentHealth.value = withSpring((targetHealth / opponentMaxHealth) * 100)
        console.log(
          `[Own Move] Updated opponent health: ${targetHealth}/${opponentMaxHealth} = ${(targetHealth / opponentMaxHealth) * 100}%`,
        )
      }

      // Update my own beast's health and energy
      if (attackerHealth !== undefined && attackerEnergy !== undefined && myBeast) {
        const myMaxHealth = myBeast.maxHealth
        const myMaxEnergy = myBeast.maxEnergy
        setMyBeast((prev) => (prev ? { ...prev, health: attackerHealth, energy: attackerEnergy } : null))
        myHealth.value = withSpring((attackerHealth / myMaxHealth) * 100)
        myEnergy.value = withSpring((attackerEnergy / myMaxEnergy) * 100)
        console.log(
          `[Own Move] Updated my health: ${attackerHealth}/${myMaxHealth} = ${(attackerHealth / myMaxHealth) * 100}%`,
        )
      }
    } else {
      // This is opponent's move - opponent is the attacker, I'm the target

      // Update my health if I was damaged
      if (damage && targetHealth !== undefined && myBeast) {
        const myMaxHealth = myBeast.maxHealth
        setMyBeast((prev) => (prev ? { ...prev, health: targetHealth } : null))
        myHealth.value = withSpring((targetHealth / myMaxHealth) * 100)
        console.log(
          `[Opponent Move] Updated my health: ${targetHealth}/${myMaxHealth} = ${(targetHealth / myMaxHealth) * 100}%`,
        )
      }

      // Update opponent's health and energy (the attacker)
      if (attackerHealth !== undefined && attackerEnergy !== undefined && opponentBeast) {
        const opponentMaxHealth = opponentBeast.maxHealth
        const opponentMaxEnergy = opponentBeast.maxEnergy
        setOpponentBeast((prev) => (prev ? { ...prev, health: attackerHealth, energy: attackerEnergy } : null))
        opponentHealth.value = withSpring((attackerHealth / opponentMaxHealth) * 100)
        opponentEnergy.value = withSpring((attackerEnergy / opponentMaxEnergy) * 100)
        console.log(
          `[Opponent Move] Updated opponent health: ${attackerHealth}/${opponentMaxHealth} = ${(attackerHealth / opponentMaxHealth) * 100}%`,
        )
      }

      // Handle healing moves where I'm the target but getting healed
      if (healing && targetHealth !== undefined && myBeast) {
        const myMaxHealth = myBeast.maxHealth
        setMyBeast((prev) => (prev ? { ...prev, health: targetHealth } : null))
        myHealth.value = withSpring((targetHealth / myMaxHealth) * 100)
        console.log(
          `[Opponent Move - Healing] Updated my health: ${targetHealth}/${myMaxHealth} = ${(targetHealth / myMaxHealth) * 100}%`,
        )
      }

      // Handle energy restore moves where I'm the target
      if (energyRestore && targetEnergy !== undefined && myBeast) {
        const myMaxEnergy = myBeast.maxEnergy
        setMyBeast((prev) => (prev ? { ...prev, energy: targetEnergy } : null))
        myEnergy.value = withSpring((targetEnergy / myMaxEnergy) * 100)
        console.log(
          `[Opponent Move - Energy] Updated my energy: ${targetEnergy}/${myMaxEnergy} = ${(targetEnergy / myMaxEnergy) * 100}%`,
        )
      }
    }

    // Add to battle log
    let logMessage = ""
    const attackerName = isOwnMove ? myName : opponentName

    if (ability.type === "heal") {
      logMessage = `${attackerName} used ${ability.name}! Restored ${healing} health!`
    } else if (ability.type === "energy") {
      logMessage = `${attackerName} used ${ability.name}! Restored ${energyRestore} energy!`
    } else {
      logMessage = `${attackerName} used ${ability.name}!`
      if (isCritical) logMessage += " Critical hit!"
      if (damage) logMessage += ` Dealt ${damage} damage!`
      if (effectiveness && effectiveness > 1) logMessage += " It's super effective!"
      if (effectiveness && effectiveness < 1) logMessage += " It's not very effective..."
    }

    setLogCounter((prev) => prev + 1)
    setBattleLogs((prev) => [
      {
        id: `${Date.now()}_${logCounter}`,
        message: logMessage,
        type: isCritical ? "system" : ability.type === "heal" ? "heal" : "attack",
        timestamp: Date.now(),
      },
      ...prev.slice(0, 4),
    ])

    setShowBattleLog(true)
    setTimeout(() => setShowBattleLog(false), 3000)

    // Check for game over
    if (targetHealth !== undefined && targetHealth <= 0) {
      endBattle(isOwnMove ? currentUserId : opponentBeast?.id)
    }

    // Debug health bars after update
    setTimeout(() => {
      console.log(`[After Move] Current health bars:`, {
        myHealthValue: myHealth.value,
        opponentHealthValue: opponentHealth.value,
        myBeastHealth: myBeast?.health,
        opponentBeastHealth: opponentBeast?.health,
      })
    }, 100)
  }

  const broadcastMove = async (ability: BeastAbility, moveData: any) => {
    if (!battleId || !realtimeChannel) return

    try {
      const newMove = {
        id: Date.now().toString(),
        player_id: currentUserId,
        ability,
        ...moveData,
        timestamp: Date.now(),
      }

      // Broadcast move via real-time channel for immediate response
      await realtimeChannel.send({
        type: "broadcast",
        event: "move",
        payload: newMove,
      })

      // Also update database for persistence
      const { data: currentBattle, error: fetchError } = await supabase
        .from("battles")
        .select("battle_data, turn_number")
        .eq("id", battleId)
        .single()

      if (fetchError) throw fetchError

      const updatedBattleData = {
        ...currentBattle.battle_data,
        moves: [...(currentBattle.battle_data?.moves || []), newMove],
        player1_beast_state: isPlayer1
          ? {
              health: moveData.attackerHealth,
              energy: moveData.attackerEnergy,
            }
          : {
              health: moveData.targetHealth,
              energy: moveData.targetEnergy,
            },
        player2_beast_state: !isPlayer1
          ? {
              health: moveData.attackerHealth,
              energy: moveData.attackerEnergy,
            }
          : {
              health: moveData.targetHealth,
              energy: moveData.targetEnergy,
            },
      }

      // Update battle in database
      const { error } = await supabase
        .from("battles")
        .update({
          battle_data: updatedBattleData,
          current_turn: isPlayer1 ? "player2" : "player1",
          turn_number: currentBattle.turn_number + 1,
          turn_time_remaining: 30,
        })
        .eq("id", battleId)

      if (error) throw error

      // Apply move locally
      applyMoveToGame(newMove, true)

      // Switch turns locally
      setCurrentTurn(isPlayer1 ? "player2" : "player1")
      setTurnTime(30)
      setTurnNumber((prev) => prev + 1)
    } catch (error) {
      console.error("Error broadcasting move:", error)
      Alert.alert("Connection Error", "Failed to send move. Please check your connection.")
    }
  }

  const endBattle = async (winnerId: string) => {
    if (!battleId) return

    try {
      await supabase
        .from("battles")
        .update({
          status: "completed",
          winner_id: winnerId,
          ended_at: new Date().toISOString(),
        })
        .eq("id", battleId)

      setGameOver(true)
      setWinner(winnerId === currentUserId ? "player1" : "player2")

      // Cleanup real-time connection
      if (realtimeChannel) {
        realtimeChannel.unsubscribe()
      }
    } catch (error) {
      console.error("Error ending battle:", error)
    }
  }

  const handleTimeUp = async () => {
    if (!battleId) return

    setLogCounter((prev) => prev + 1)
    setBattleLogs((prev) => [
      {
        id: `${Date.now()}_${logCounter}`,
        message: `${isMyTurn() ? "You" : "Opponent"} ran out of time!`,
        type: "system",
        timestamp: Date.now(),
      },
      ...prev.slice(0, 4),
    ])

    // Determine new turn
    const newTurn = isMyTurn() ? (isPlayer1 ? "player2" : "player1") : isPlayer1 ? "player1" : "player2"
    const newTurnNumber = turnNumber + 1

    try {
      // Persist turn switch to database
      const { error } = await supabase
        .from("battles")
        .update({
          current_turn: newTurn,
          turn_number: newTurnNumber,
          turn_time_remaining: 30,
          updated_at: new Date().toISOString(),
        })
        .eq("id", battleId)

      if (error) {
        console.error("Error switching turn after timeout:", error)
      }

      // Update local state
      setCurrentTurn(newTurn)
      setTurnTime(30)
      setTurnNumber(newTurnNumber)

      // Broadcast turn skip via real-time channel
      if (realtimeChannel) {
        await realtimeChannel.send({
          type: "broadcast",
          event: "turn_skipped",
          payload: {
            skippedBy: currentUserId,
            newTurn,
            newTurnNumber,
            timestamp: Date.now(),
          },
        })
      }
    } catch (error) {
      console.error("Error handling time up:", error)
      Alert.alert("Connection Error", "Failed to switch turn. Please check your connection.")
    }
  }

  const isMyTurn = () => {
    return (isPlayer1 && currentTurn === "player1") || (!isPlayer1 && currentTurn === "player2")
  }

  // Fetch beast abilities from database
  const fetchBeastAbilities = async (abilityIds: string[]): Promise<BeastAbility[]> => {
    try {
      const { data: abilities, error } = await supabase.from("beast_abilities").select("*").in("id", abilityIds)

      if (error) {
        console.error("Error fetching beast abilities:", error)
        return []
      }

      return abilities || []
    } catch (error) {
      console.error("Error fetching beast abilities:", error)
      return []
    }
  }

  // Replace the handleAttack function with:
  const handleAttack = async (ability: BeastAbility) => {
    if (gameOver || !isMyTurn() || waitingForOpponent) return

    const attackerBeast = myBeast
    const defenderBeast = opponentBeast

    if (!attackerBeast || !defenderBeast) return

    // Check if attacker is frozen
    if (attackerBeast.status?.type === "freeze") {
      setLogCounter((prev) => prev + 1)
      setBattleLogs((prev) => [
        {
          id: `${Date.now()}_${logCounter}`,
          message: `${attackerBeast.name} is frozen and cannot attack!`,
          type: "status",
          timestamp: Date.now(),
        },
        ...prev.slice(0, 4),
      ])
      return
    }

    Vibration.vibrate(50)
    setSelectedMove(ability)

    // Calculate hit chance
    const hitRoll = Math.random() * 100
    const missChance = 100 - ability.accuracy

    if (hitRoll < missChance) {
      // Attack missed
      await broadcastMove(ability, {
        damage: 0,
        missed: true,
        attackerHealth: attackerBeast.health,
        attackerEnergy: Math.max(0, attackerBeast.energy - ability.energy_cost),
        targetHealth: defenderBeast.health,
        targetEnergy: defenderBeast.energy,
      })
      return
    }

    // Calculate critical hit chance
    const healthPercentage = attackerBeast.health / attackerBeast.maxHealth
    const baseCritChance = 10
    const lowHealthBonus = (1 - healthPercentage) * 20
    const critChance = baseCritChance + lowHealthBonus
    const critRoll = Math.random() * 100
    const isCritical = critRoll < critChance

    // Enhanced damage calculation based on ability type
    let damage = 0
    let healing = 0
    let energyRestore = 0
    let effectiveness = 1.0

    if (ability.type === "attack") {
      // Get elemental effectiveness
      const attackerElement = ability.element
      const defenderElement = defenderBeast.element

      if (elementalChart[attackerElement] && elementalChart[attackerElement][defenderElement]) {
        effectiveness = elementalChart[attackerElement][defenderElement]
      }

      // Base damage calculation
      const attackStat = attackerBeast.stats.attack
      const defenseStat = defenderBeast.stats.defense

      damage = ability.power * (attackStat / defenseStat) * 0.4 * effectiveness
      damage = damage * (0.75 + Math.random() * 0.5)

      if (isCritical) {
        damage *= 2
      }

      damage = Math.round(damage)
    } else if (ability.type === "heal") {
      healing = Math.round(ability.power * 0.8)
    } else if (ability.type === "energy") {
      energyRestore = 30 + Math.floor(Math.random() * 31)
    }

    // Calculate new health and energy values
    const newDefenderHealth = Math.max(0, defenderBeast.health - damage)
    const newAttackerHealth = Math.min(attackerBeast.maxHealth, attackerBeast.health + healing)
    const newAttackerEnergy = Math.min(
      attackerBeast.maxEnergy,
      Math.max(0, attackerBeast.energy - ability.energy_cost + energyRestore),
    )

    // Broadcast move
    await broadcastMove(ability, {
      damage,
      healing,
      energyRestore,
      isCritical,
      effectiveness,
      targetHealth: newDefenderHealth,
      targetEnergy: defenderBeast.energy,
      attackerHealth: newAttackerHealth,
      attackerEnergy: newAttackerEnergy,
    })
  }

  // Animation styles
  const myHealthStyle = useAnimatedStyle(() => ({
    width: `${myHealth.value}%`,
  }))

  const opponentHealthStyle = useAnimatedStyle(() => ({
    width: `${opponentHealth.value}%`,
  }))

  const myEnergyStyle = useAnimatedStyle(() => ({
    width: `${myEnergy.value}%`,
  }))

  const opponentEnergyStyle = useAnimatedStyle(() => ({
    width: `${opponentEnergy.value}%`,
  }))

  const shakeAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeValue.value }],
  }))

  const flashAnimation = useAnimatedStyle(() => ({
    opacity: flashValue.value,
  }))

  const battleFieldAnimation = useAnimatedStyle(() => ({
    transform: [{ scale: battleFieldScale.value }],
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

  const getAbilityTypeColor = (type: BeastAbility["type"]) => {
    switch (type) {
      case "attack":
        return "#EF4444"
      case "heal":
        return "#10B981"
      case "buff":
        return "#7C3AED"
      case "debuff":
        return "#F59E0B"
      case "energy":
        return "#06B6D4"
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
          colors={["#0F0F23", "#1E1B4B", "#312E81"]}
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
  if (isLoading || !myBeast || (waitingForOpponent && !opponentBeast)) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#0F0F23", "#1E1B4B", "#312E81"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <Animated.View entering={ZoomIn}>
            {waitingForOpponent ? <Users size={64} color="#7C3AED" /> : <Activity size={64} color="#7C3AED" />}
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(300)} style={styles.loadingText}>
            {waitingForOpponent ? "Waiting for Opponent..." : "Preparing Epic Battle..."}
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(600)} style={styles.loadingSubtext}>
            {waitingForOpponent ? "Share your battle code with a friend!" : "Loading beast abilities from database..."}
          </Animated.Text>

          {/* Connection Status */}
          <View style={styles.connectionStatus}>
            <Wifi size={16} color={connectionStatus === "connected" ? "#10B981" : "#EF4444"} />
            <Text style={[styles.connectionText, { color: connectionStatus === "connected" ? "#10B981" : "#EF4444" }]}>
              {connectionStatus === "connected" ? "Connected" : "Connecting..."}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // Battle code sharing screen
  if (waitingForOpponent && battleId) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#0F0F23", "#1E1B4B", "#312E81"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.battleCodeContainer}>
          <Animated.View entering={ZoomIn}>
            <Users size={64} color="#7C3AED" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(300)} style={styles.battleCodeTitle}>
            Battle Room Created!
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(600)} style={styles.battleCodeSubtext}>
            Share this code with your friend to join the battle:
          </Animated.Text>

          {/* Battle Code Display */}
          <Animated.View entering={SlideInUp.delay(900)} style={styles.battleCodeCard}>
            <BlurView intensity={60} tint="dark" style={styles.battleCodeCardContent}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.4)", "rgba(0, 0, 0, 0.8)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.battleCodeText}>{battleId.slice(-8).toUpperCase()}</Text>
              <TouchableOpacity
                style={styles.copyCodeButton}
                onPress={() => {
                  // Copy to clipboard functionality would go here
                  Alert.alert("Copied!", "Battle code copied to clipboard")
                }}
              >
                <Text style={styles.copyCodeButtonText}>Copy Code</Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>

          {/* Connection Status */}
          <View style={styles.connectionStatus}>
            <Wifi size={16} color={connectionStatus === "connected" ? "#10B981" : "#EF4444"} />
            <Text style={[styles.connectionText, { color: connectionStatus === "connected" ? "#10B981" : "#EF4444" }]}>
              {connectionStatus === "connected" ? "Connected" : "Connecting..."}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Background */}
      <LinearGradient
        colors={["#0F0F23", "#1E1B4B", "#312E81", "#1E1B4B", "#0F0F23"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated particles background */}
      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, i) => (
          <Animated.View
            key={i}
            entering={FadeIn.delay(i * 100)}
            style={[
              styles.particle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              },
            ]}
          />
        ))}
      </View>

      {/* Connection Status Banner */}
      {connectionStatus !== "connected" && !gameOver && (
        <Animated.View entering={SlideInDown} style={styles.connectionBanner}>
          <BlurView intensity={80} tint="dark" style={styles.connectionBannerContent}>
            <LinearGradient
              colors={[
                connectionStatus === "connecting" ? "rgba(245, 158, 11, 0.6)" : "rgba(239, 68, 68, 0.6)",
                "rgba(0, 0, 0, 0.8)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.connectionBannerText}>
              {connectionStatus === "connecting" ? "Connecting to battle..." : "Connection lost - Reconnecting..."}
            </Text>
          </BlurView>
        </Animated.View>
      )}

      {/* Battle Arena */}
      <Animated.View style={[styles.arenaContainer, battleFieldAnimation]}>
        {/* Replace the enemyStats section with: */}
        {/* Enhanced Opponent Stats (Top) */}
        <Animated.View entering={SlideInDown.delay(200)} style={styles.enemyStats}>
          <BlurView intensity={60} tint="dark" style={styles.modernStatsCard}>
            <LinearGradient
              colors={[`${getElementColor(opponentBeast.element)}40`, "rgba(0, 0, 0, 0.8)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.statsHeader}>
              <View style={styles.playerInfo}>
                <View style={styles.playerNameContainer}>
                  <Text style={styles.playerName}>{opponentName}</Text>
                  <View style={styles.modernRankBadge}>
                    <Crown size={14} color="#FFD700" />
                    <Text style={styles.rankText}>#{opponentBeast.level}</Text>
                  </View>
                </View>
                <View style={styles.beastInfo}>
                  <Text style={styles.beastName}>{opponentBeast.name}</Text>
                  <View style={styles.modernElementBadge}>
                    {createElement(getElementIcon(opponentBeast.element), {
                      size: 14,
                      color: getElementColor(opponentBeast.element),
                    })}
                    <Text style={[styles.elementText, { color: getElementColor(opponentBeast.element) }]}>
                      {opponentBeast.element}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.modernStatsGrid}>
              <View style={styles.modernStatItem}>
                <Heart size={18} color="#EF4444" />
                <View style={styles.modernStatBarContainer}>
                  <Animated.View style={[styles.modernStatBar, opponentHealthStyle, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.modernStatText}>{Math.round(opponentBeast.health) || 0}</Text>
                </View>
              </View>

              <View style={styles.modernStatItem}>
                <Zap size={18} color="#7C3AED" />
                <View style={styles.modernStatBarContainer}>
                  <Animated.View style={[styles.modernStatBar, opponentEnergyStyle, { backgroundColor: "#7C3AED" }]} />
                  <Text style={styles.modernStatText}>{Math.round(opponentBeast.energy)}</Text>
                </View>
              </View>
              {opponentBeast.status && (
                <View style={styles.statusEffectContainer}>
                  <Text style={styles.statusEffectText}>
                    {opponentBeast.status.type}: {opponentBeast.status.duration} turns
                  </Text>
                </View>
              )}
            </View>
          </BlurView>
        </Animated.View>

        {/* Enhanced Battle Scene */}
        <View style={styles.battleScene}>
          {/* Modern Battle Timer */}
          {!gameOver && (
            <Animated.View entering={BounceIn.delay(500)} style={styles.modernBattleTimer}>
              <BlurView intensity={80} tint="dark" style={styles.modernTimerCard}>
                <LinearGradient
                  colors={[
                    turnTime <= 10 ? "rgba(239, 68, 68, 0.6)" : "rgba(124, 58, 237, 0.4)",
                    "rgba(245, 158, 11, 0.4)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Timer size={20} color="#F59E0B" />
                <Text style={styles.modernTimerText}>{turnTime}</Text>
                <Text style={styles.modernTurnText}>{isMyTurn() ? "Your Turn" : "Enemy Turn"}</Text>
                {/* Connection Status Indicator */}
                <View style={styles.connectionIndicator}>
                  <Wifi 
                    size={14} 
                    color={connectionStatus === "connected" ? "#10B981" : connectionStatus === "connecting" ? "#F59E0B" : "#EF4444"} 
                  />
                </View>
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    left: -2,
                    right: -2,
                    bottom: -2,
                    borderRadius: 26,
                    borderWidth: 2,
                    borderColor: turnTime <= 10 ? "#EF4444" : "#7C3AED",
                    opacity: 0.6,
                  }}
                />
              </BlurView>
            </Animated.View>
          )}

          {/* Replace the enemy beast section with: */}
          {/* Enhanced Opponent Beast */}
          <Animated.View
            ref={player2BeastRef}
            entering={SlideInLeft.delay(400)}
            style={[styles.modernBeastContainer, styles.enemyBeastContainer]}
          >
            <LinearGradient
              colors={[`${getElementColor(opponentBeast.element)}60`, "transparent"]}
              style={styles.modernBeastGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.beastImageContainer}>
              <Image
                source={{ uri: getImageUrl(opponentBeast.image_url) }}
                style={styles.modernBeastImage}
                resizeMode="contain"
                onError={(e) => console.log("Error loading opponent beast image:", e.nativeEvent.error)}
              />
            </View>
            <View style={styles.beastShadow} />
          </Animated.View>

          {/* Replace the player beast section with: */}
          {/* Enhanced My Beast */}
          <Animated.View
            ref={player1BeastRef}
            entering={SlideInRight.delay(400)}
            style={[styles.modernBeastContainer, styles.playerBeastContainer]}
          >
            <LinearGradient
              colors={[`${getElementColor(myBeast.element)}60`, "transparent"]}
              style={styles.modernBeastGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.beastImageContainer}>
              <Image
                source={{ uri: getImageUrl(myBeast.image_url) }}
                style={styles.modernBeastImage}
                resizeMode="contain"
                onError={(e) => console.log("Error loading my beast image:", e.nativeEvent.error)}
              />
            </View>
            <View style={styles.beastShadow} />
          </Animated.View>

          {/* Enhanced VS Badge - Show during battle */}
          {battleStarted && !gameOver && (
            <Animated.View entering={ZoomIn.delay(600)} style={styles.modernVsBadge}>
              <BlurView intensity={80} tint="dark" style={styles.modernVsBadgeContent}>
                <LinearGradient
                  colors={["rgba(239, 68, 68, 0.6)", "rgba(124, 58, 237, 0.6)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Image source={vsImage} style={styles.vsImage} resizeMode="contain" />
                <View style={styles.vsGlow} />
              </BlurView>
            </Animated.View>
          )}

          {/* Enhanced Game Over Overlay */}
          {gameOver && (
            <Animated.View entering={ZoomIn} style={styles.gameOverOverlay}>
              <BlurView intensity={60} tint="dark" style={styles.modernGameOverCard}>
                <LinearGradient
                  colors={[
                    winner === "player1" ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)",
                    "rgba(0, 0, 0, 0.8)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.modernGameOverTitle}>{winner === "player1" ? "🏆 VICTORY!" : "💀 DEFEAT!"}</Text>
                <Text style={styles.modernGameOverText}>
                  {winner === "player1"
                    ? `Your ${myBeast?.name || "beast"} has triumphed over ${opponentBeast?.name || "opponent"}!`
                    : `Your ${myBeast?.name || "beast"} has fallen to ${opponentBeast?.name || "opponent"}!`}
                </Text>
                <View style={styles.gameOverStats}>
                  <Text style={styles.gameOverStatsText}>Battle Duration: {turnNumber} turns</Text>
                  <Text style={styles.gameOverStatsText}>
                    Final Health: {winner === "player1" ? Math.round(myBeast?.health || 0) : Math.round(opponentBeast?.health || 0)} HP
                  </Text>
                </View>
                <View style={styles.gameOverButtons}>
                  <TouchableOpacity 
                    style={[styles.modernExitButton, styles.secondaryButton]} 
                    onPress={() => {
                      // Navigate to battle beasts tab
                      router.replace("/(tabs)/battle-beasts")
                    }}
                  >
                    <Text style={styles.modernExitButtonText}>View Beasts</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modernExitButton} 
                    onPress={() => {
                      // Navigate back to find players
                      router.replace("/(game)/find-players")
                    }}
                  >
                    <Text style={styles.modernExitButtonText}>New Battle</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </Animated.View>
          )}
        </View>

        {/* Replace the playerStats section with: */}
        {/* Enhanced My Stats (Bottom) */}
        <Animated.View entering={SlideInUp.delay(200)} style={styles.playerStats}>
          <BlurView intensity={60} tint="dark" style={styles.modernStatsCard}>
            <LinearGradient
              colors={[`${getElementColor(myBeast.element)}40`, "rgba(0, 0, 0, 0.8)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.statsHeader}>
              <View style={styles.playerInfo}>
                <View style={styles.playerNameContainer}>
                  <Text style={styles.playerName}>{myName}</Text>
                  <View style={styles.modernRankBadge}>
                    <Crown size={14} color="#FFD700" />
                    <Text style={styles.rankText}>#{myBeast.level}</Text>
                  </View>
                </View>
                <View style={styles.beastInfo}>
                  <Text style={styles.beastName}>{myBeast.name}</Text>
                  <View style={styles.modernElementBadge}>
                    {createElement(getElementIcon(myBeast.element), {
                      size: 14,
                      color: getElementColor(myBeast.element),
                    })}
                    <Text style={[styles.elementText, { color: getElementColor(myBeast.element) }]}>
                      {myBeast.element}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.modernStatsGrid}>
              <View style={styles.modernStatItem}>
                <Heart size={18} color="#EF4444" />
                <View style={styles.modernStatBarContainer}>
                  <Animated.View style={[styles.modernStatBar, myHealthStyle, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.modernStatText}>{Math.round(myBeast.health) || 0}</Text>
                </View>
              </View>

              <View style={styles.modernStatItem}>
                <Zap size={18} color="#7C3AED" />
                <View style={styles.modernStatBarContainer}>
                  <Animated.View style={[styles.modernStatBar, myEnergyStyle, { backgroundColor: "#7C3AED" }]} />
                  <Text style={styles.modernStatText}>{Math.round(myBeast.energy)}</Text>
                </View>
              </View>
              {myBeast.status && (
                <View style={styles.statusEffectContainer}>
                  <Text style={styles.statusEffectText}>
                    {myBeast.status.type}: {myBeast.status.duration} turns
                  </Text>
                </View>
              )}
            </View>
          </BlurView>
        </Animated.View>

        {/* Enhanced Battle Log */}
        {showBattleLog && (
          <Animated.View entering={SlideInLeft} style={styles.modernBattleLog}>
            <BlurView intensity={60} tint="dark" style={styles.modernBattleLogCard}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0.8)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {battleLogs.map((log) => (
                <Text key={log.id} style={[styles.modernLogText, styles[`log${log.type}`]]}>
                  {log.message}
                </Text>
              ))}
            </BlurView>
          </Animated.View>
        )}

        {/* Replace the moves panel with: */}
        {/* Enhanced Moves Panel */}
        {isMyTurn() && !gameOver && (
          <Animated.View entering={SlideInUp.delay(300)} style={styles.modernMovesPanel}>
            <BlurView intensity={60} tint="dark" style={styles.modernMovesPanelContent}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0.8)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.modernMovesGrid}>
                {myBeast.abilities.map((ability) => {
                  const canUseAbility = myBeast.energy >= ability.energy_cost
                  return (
                    <TouchableOpacity
                      key={ability.id}
                      style={[
                        styles.modernMoveCard,
                        { borderColor: getAbilityTypeColor(ability.type) },
                        !canUseAbility && styles.disabledMove,
                      ]}
                      onPress={() => canUseAbility && handleAttack(ability)}
                      disabled={!canUseAbility}
                    >
                      <LinearGradient
                        colors={[`${getAbilityTypeColor(ability.type)}30`, "rgba(0, 0, 0, 0.8)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      {!canUseAbility && (
                        <View style={styles.disabledOverlay}>
                          <Text style={styles.disabledText}>Not Enough Energy</Text>
                        </View>
                      )}
                      <View style={styles.modernMoveHeader}>
                        {createElement(getElementIcon(ability.element), {
                          size: 28,
                          color: getElementColor(ability.element),
                        })}
                        <View
                          style={[styles.modernMoveType, { backgroundColor: `${getAbilityTypeColor(ability.type)}50` }]}
                        >
                          <Text style={[styles.modernMoveTypeText, { color: getAbilityTypeColor(ability.type) }]}>
                            {ability.type}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.modernMoveName}>{ability.name}</Text>
                      <View style={styles.modernMoveStats}>
                        <View style={styles.modernMoveStat}>
                          <Swords size={16} color={getAbilityTypeColor(ability.type)} />
                          <Text style={[styles.modernMoveStatText, { color: getAbilityTypeColor(ability.type) }]}>
                            {ability.power}
                          </Text>
                        </View>
                        <View style={styles.modernMoveStat}>
                          <Star size={16} color={getAbilityTypeColor(ability.type)} />
                          <Text style={[styles.modernMoveStatText, { color: getAbilityTypeColor(ability.type) }]}>
                            {ability.accuracy}%
                          </Text>
                        </View>
                        <View style={styles.modernMoveStat}>
                          <Zap size={16} color={getAbilityTypeColor(ability.type)} />
                          <Text style={[styles.modernMoveStatText, { color: getAbilityTypeColor(ability.type) }]}>
                            {ability.energy_cost}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </BlurView>
          </Animated.View>
        )}

        {/* Enhanced Back Button */}
        <TouchableOpacity style={styles.modernBackButton} onPress={() => router.back()}>
          <BlurView intensity={60} tint="dark" style={styles.modernBackButtonContent}>
            <X size={24} color="#ffffff" />
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  connectionBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  connectionBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  connectionBannerText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  particlesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    backgroundColor: "rgba(124, 58, 237, 0.3)",
    borderRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    zIndex: 2,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  loadingSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    textAlign: "center",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 2,
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
    zIndex: 2,
  },
  enemyStats: {
    width: "100%",
    marginBottom: 8,
  },
  playerStats: {
    width: "100%",
    marginTop: 8,
  },
  modernStatsCard: {
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statsHeader: {
    marginBottom: 12,
  },
  playerInfo: {
    gap: 8,
  },
  playerNameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  modernRankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 215, 0, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.5)",
  },
  rankText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "700",
  },
  beastInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  beastName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  modernElementBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  elementText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modernStatsGrid: {
    gap: 12,
  },
  modernStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modernStatBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  modernStatBar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 6,
  },
  modernStatText: {
    position: "absolute",
    right: 8,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 12,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  battleScene: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  modernBattleTimer: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
  },
  modernTimerCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    minWidth: 120,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  modernTimerText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#F59E0B",
    marginVertical: 1,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modernTurnText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  connectionIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modernBeastContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 220,
    height: 220,
    position: "relative",
  },
  modernBeastGlow: {
    position: "absolute",
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
    borderRadius: 20,
  },
  beastImageContainer: {
    width: 220,
    height: 220,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  modernBeastImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  beastShadow: {
    position: "absolute",
    bottom: -20,
    width: 120,
    height: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 60,
    transform: [{ scaleY: 0.3 }],
  },
  enemyBeastContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  playerBeastContainer: {
    marginTop: 40,
    alignSelf: "flex-start",
    transform: [{ scaleX: -1 }],
  },
  modernVsBadge: {
    position: "absolute",
    top: "45%",
    left: "40%",
    width: 100,
    height: 100,
    transform: [{ translateX: -50 }, { translateY: -50 }],
    zIndex: 30,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  modernVsBadgeContent: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.5)",
    overflow: "hidden",
  },
  modernVsText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
  },
  vsGlow: {
    position: "absolute",
    top: -10,
    left: -10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    zIndex: -1,
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
  modernGameOverCard: {
    width: "85%",
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
  },
  modernGameOverTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
    textAlign: "center",
  },
  modernGameOverText: {
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  gameOverStats: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    width: "100%",
  },
  gameOverStatsText: {
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
    marginVertical: 4,
  },
  gameOverButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  modernExitButton: {
    backgroundColor: "rgba(124, 58, 237, 0.9)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    flex: 1,
    maxWidth: 150,
  },
  secondaryButton: {
    backgroundColor: "rgba(59, 130, 246, 0.9)",
  },
  modernExitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  modernBattleLog: {
    position: "absolute",
    top: "80%",
    left: "40%",
    transform: [{ translateX: -150 }, { translateY: -60 }],
    width: 320,
    zIndex: 20,
  },
  modernBattleLogCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modernLogText: {
    fontSize: 14,
    marginBottom: 4,
    color: "#ffffff",
    fontWeight: "500",
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
  logdebuff: {
    color: "#F59E0B",
  },
  logstatus: {
    color: "#F59E0B",
  },
  logsystem: {
    color: "#94A3B8",
  },
  modernMovesPanel: {
    position: "absolute",
    bottom: 120,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  modernMovesPanelContent: {
    padding: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modernMovesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  modernMoveCard: {
    width: "48%",
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledMove: {
    opacity: 0.5,
  },
  disabledOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  disabledText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  modernMoveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modernMoveType: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernMoveTypeText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modernMoveName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  modernMoveStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modernMoveStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modernMoveStatText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  modernBackButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 100,
  },
  modernBackButtonContent: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  vsImage: {
    width: 60,
    height: 60,
  },
  statusEffectContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  statusEffectText: {
    color: "#fff",
    fontSize: 12,
  },
  battleCodeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  battleCodeTitle: {
    fontSize: 24,
    color: "#FFFFFF",
    marginTop: 20,
  },
  battleCodeSubtext: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 10,
  },
  battleCodeCard: {
    marginTop: 20,
    width: screenWidth * 0.8,
    height: screenHeight * 0.2,
    borderRadius: 10,
    overflow: "hidden",
  },
  battleCodeCardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  battleCodeText: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  copyCodeButton: {
    backgroundColor: "#10B981",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  copyCodeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
})
