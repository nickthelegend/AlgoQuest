"use client"

import { useEffect, useState, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Vibration, StatusBar, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, {
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  SlideInUp,
  ZoomIn,
} from "react-native-reanimated"
import {
  Flame,
  Wind,
  Cloud,
  Mountain,
  Sun,
  Moon,
  Sparkles,
  AlertTriangle,
  Activity,
  Users,
  Wifi,
} from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
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
  player1_beast_id: string // Changed from number to string
  player2_beast_id: string // Changed from number to string
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

const arenaStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 24,
    color: "#FFFFFF",
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 10,
  },
  errorButton: {
    backgroundColor: "#7C3AED",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  errorButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 24,
    color: "#FFFFFF",
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 10,
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
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  connectionText: {
    fontSize: 16,
    marginLeft: 5,
  },
})

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

  // Real-time multiplayer states
  const [battleId, setBattleId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [isPlayer1, setIsPlayer1] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [turnNumber, setTurnNumber] = useState(1)
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)

  const { beastId, opponentId } = useLocalSearchParams()
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
        realtimeChannel.unsubscribe()
      }
    }
  }, [])

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
      const selectedBeastId = beastId || (await SecureStore.getItemAsync("selectedBeastId"))
      if (!selectedBeastId) {
        setError("No beast selected for battle. Please select a beast first.")
        return
      }

      console.log("Selected Beast ID:", selectedBeastId) // Debug log

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
      if (opponentId) {
        // Join existing battle using battle code
        battle = await joinBattleByCode(userId, selectedBeastId, opponentId as string)
      } else {
        // Create battle and wait for opponent
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
      setError(`Failed to initialize battle: ${error.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
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

  const createOrJoinBattle = async (userId: string, beastId: string, opponentId: string): Promise<Battle> => {
    // First, try to find an existing waiting battle with the opponent
    const { data: existingBattle, error: findError } = await supabase
      .from("battles")
      .select()
      .eq("player1_id", opponentId)
      .eq("status", "waiting")
      .single()

    if (existingBattle && !findError) {
      // Join existing battle
      const { data, error } = await supabase
        .from("battles")
        .update({
          player2_id: userId,
          player2_beast_id: beastId, // Use string directly
          status: "active",
        })
        .eq("id", existingBattle.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new battle
      const { data, error } = await supabase
        .from("battles")
        .insert({
          player1_id: userId,
          player2_id: opponentId,
          player1_beast_id: beastId, // Use string directly
          status: "waiting",
          current_turn: "player1",
          turn_number: 1,
          turn_time_remaining: 30,
          battle_data: {
            moves: [],
          },
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  }

  const joinBattleByCode = async (userId: string, beastId: string, battleCode: string): Promise<Battle> => {
    // Find battle by the last 8 characters of the battle ID
    const { data: battles, error: findError } = await supabase
      .from("battles")
      .select()
      .eq("status", "waiting")
      .ilike("id", `%${battleCode.toLowerCase()}`)

    if (findError || !battles || battles.length === 0) {
      throw new Error("Battle room not found. Please check the battle code.")
    }

    const existingBattle = battles[0]

    // Join the battle
    const { data, error } = await supabase
      .from("battles")
      .update({
        player2_id: userId,
        player2_beast_id: beastId,
        status: "active",
      })
      .eq("id", existingBattle.id)
      .select()
      .single()

    if (error) throw error

    // Send notification to the battle creator via real-time channel
    try {
      const channel = supabase.channel(`battle:${existingBattle.id}`)
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

      // Set beast data based on user position
      if (battle.player1_id === userId) {
        setPlayer1Beast(player1Beast)
        setPlayer2Beast(player2Beast)
        setPlayer1Name("You")
        setPlayer2Name(player2Beast ? truncateWalletAddress(player2BeastData.users.wallet_address) : "Waiting...")
      } else {
        setPlayer1Beast(player2Beast)
        setPlayer2Beast(player1Beast)
        setPlayer1Name(player1Beast ? truncateWalletAddress(player1BeastData.users.wallet_address) : "Waiting...")
        setPlayer2Name("You")
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
      .subscribe((status) => {
        console.log("Realtime connection status:", status)
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected")
        } else if (status === "CLOSED") {
          setConnectionStatus("disconnected")
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

    // Apply opponent's move
    applyMoveToGame(move, false)

    // Switch turns
    setCurrentTurn(isPlayer1 ? "player1" : "player2")
    setTurnTime(30)
    setTurnNumber((prev) => prev + 1)
  }

  const applyMoveToGame = (move: any, isOwnMove: boolean) => {
    const { ability, damage, healing, energyRestore, targetHealth, targetEnergy, attackerHealth, attackerEnergy } = move

    // Update beast states based on move
    if (isOwnMove) {
      // Update opponent's beast (target)
      if (damage && targetHealth !== undefined) {
        if (isPlayer1) {
          setPlayer2Beast((prev) => (prev ? { ...prev, health: targetHealth } : null))
          player2Health.value = withSpring((targetHealth / (player2Beast?.maxHealth || 1)) * 100)
        } else {
          setPlayer1Beast((prev) => (prev ? { ...prev, health: targetHealth } : null))
          player1Health.value = withSpring((targetHealth / (player1Beast?.maxHealth || 1)) * 100)
        }
      }

      // Update own beast (attacker)
      if (attackerHealth !== undefined && attackerEnergy !== undefined) {
        if (isPlayer1) {
          setPlayer1Beast((prev) => (prev ? { ...prev, health: attackerHealth, energy: attackerEnergy } : null))
          player1Health.value = withSpring((attackerHealth / (player1Beast?.maxHealth || 1)) * 100)
          player1Energy.value = withSpring((attackerEnergy / (player1Beast?.maxEnergy || 1)) * 100)
        } else {
          setPlayer2Beast((prev) => (prev ? { ...prev, health: attackerHealth, energy: attackerEnergy } : null))
          player2Health.value = withSpring((attackerHealth / (player2Beast?.maxHealth || 1)) * 100)
          player2Energy.value = withSpring((attackerEnergy / (player2Beast?.maxEnergy || 1)) * 100)
        }
      }
    } else {
      // Apply opponent's move (reverse perspective)
      if (damage && targetHealth !== undefined) {
        if (isPlayer1) {
          setPlayer1Beast((prev) => (prev ? { ...prev, health: targetHealth } : null))
          player1Health.value = withSpring((targetHealth / (player1Beast?.maxHealth || 1)) * 100)
        } else {
          setPlayer2Beast((prev) => (prev ? { ...prev, health: targetHealth } : null))
          player2Health.value = withSpring((targetHealth / (player2Beast?.maxHealth || 1)) * 100)
        }
      }

      if (attackerHealth !== undefined && attackerEnergy !== undefined) {
        if (isPlayer1) {
          setPlayer2Beast((prev) => (prev ? { ...prev, health: attackerHealth, energy: attackerEnergy } : null))
          player2Health.value = withSpring((attackerHealth / (player2Beast?.maxHealth || 1)) * 100)
          player2Energy.value = withSpring((attackerEnergy / (player2Beast?.maxEnergy || 1)) * 100)
        } else {
          setPlayer1Beast((prev) => (prev ? { ...prev, health: attackerHealth, energy: attackerEnergy } : null))
          player1Health.value = withSpring((attackerHealth / (player1Beast?.maxHealth || 1)) * 100)
          player1Energy.value = withSpring((attackerEnergy / (player1Beast?.maxEnergy || 1)) * 100)
        }
      }
    }

    // Add to battle log
    let logMessage = ""
    const attackerName = isOwnMove ? (isPlayer1 ? player1Name : player2Name) : isPlayer1 ? player2Name : player1Name

    if (ability.type === "heal") {
      logMessage = `${attackerName} used ${ability.name}! Restored ${healing} health!`
    } else if (ability.type === "energy") {
      logMessage = `${attackerName} used ${ability.name}! Restored ${energyRestore} energy!`
    } else {
      logMessage = `${attackerName} used ${ability.name}!`
      if (move.isCritical) logMessage += " Critical hit!"
      if (damage) logMessage += ` Dealt ${damage} damage!`
      if (move.effectiveness && move.effectiveness > 1) logMessage += " It's super effective!"
      if (move.effectiveness && move.effectiveness < 1) logMessage += " It's not very effective..."
    }

    setBattleLogs((prev) => [
      {
        id: Date.now().toString(),
        message: logMessage,
        type: move.isCritical ? "system" : ability.type === "heal" ? "heal" : "attack",
        timestamp: Date.now(),
      },
      ...prev.slice(0, 4),
    ])

    setShowBattleLog(true)
    setTimeout(() => setShowBattleLog(false), 3000)

    // Check for game over
    if (targetHealth !== undefined && targetHealth <= 0) {
      endBattle(isOwnMove ? currentUserId : isPlayer1 ? player2Beast?.id : player1Beast?.id)
    }
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

  const handleTimeUp = () => {
    setBattleLogs((prev) => [
      {
        id: Date.now().toString(),
        message: `${isMyTurn() ? "You" : "Opponent"} ran out of time!`,
        type: "system",
        timestamp: Date.now(),
      },
      ...prev.slice(0, 4),
    ])

    // Switch turns
    setCurrentTurn(isMyTurn() ? (isPlayer1 ? "player2" : "player1") : isPlayer1 ? "player1" : "player2")
    setTurnTime(30)
    setTurnNumber((prev) => prev + 1)
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

  const handleAttack = async (ability: BeastAbility) => {
    if (gameOver || !isMyTurn() || waitingForOpponent) return

    const attackerBeast = isPlayer1 ? player1Beast : player2Beast
    const defenderBeast = isPlayer1 ? player2Beast : player1Beast

    if (!attackerBeast || !defenderBeast) return

    // Check if attacker is frozen
    if (attackerBeast.status?.type === "freeze") {
      setBattleLogs((prev) => [
        {
          id: Date.now().toString(),
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
  const shakeAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeValue.value }],
  }))

  const flashAnimation = useAnimatedStyle(() => ({
    opacity: flashValue.value,
  }))

  const battleFieldAnimation = useAnimatedStyle(() => ({
    transform: [{ scale: battleFieldScale.value }],
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
      <SafeAreaView style={arenaStyles.container}>
        <LinearGradient
          colors={["#0F0F23", "#1E1B4B", "#312E81"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={arenaStyles.errorContainer}>
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={arenaStyles.errorTitle}>Battle Error</Text>
          <Text style={arenaStyles.errorText}>{error}</Text>
          <TouchableOpacity style={arenaStyles.errorButton} onPress={() => router.back()}>
            <Text style={arenaStyles.errorButtonText}>Return to Map</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Loading screen
  if (isLoading || !player1Beast || (waitingForOpponent && !player2Beast)) {
    return (
      <SafeAreaView style={arenaStyles.container}>
        <LinearGradient
          colors={["#0F0F23", "#1E1B4B", "#312E81"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={arenaStyles.loadingContainer}>
          <Animated.View entering={ZoomIn}>
            {waitingForOpponent ? <Users size={64} color="#7C3AED" /> : <Activity size={64} color="#7C3AED" />}
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(300)} style={arenaStyles.loadingText}>
            {waitingForOpponent ? "Waiting for Opponent..." : "Preparing Epic Battle..."}
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(600)} style={arenaStyles.loadingSubtext}>
            {waitingForOpponent ? "Share your battle code with a friend!" : "Loading beast abilities from database..."}
          </Animated.Text>

          {/* Connection Status */}
          <View style={arenaStyles.connectionStatus}>
            <Wifi size={16} color={connectionStatus === "connected" ? "#10B981" : "#EF4444"} />
            <Text
              style={[arenaStyles.connectionText, { color: connectionStatus === "connected" ? "#10B981" : "#EF4444" }]}
            >
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
      <SafeAreaView style={arenaStyles.container}>
        <LinearGradient
          colors={["#0F0F23", "#1E1B4B", "#312E81"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={arenaStyles.battleCodeContainer}>
          <Animated.View entering={ZoomIn}>
            <Users size={64} color="#7C3AED" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(300)} style={arenaStyles.battleCodeTitle}>
            Battle Room Created!
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(600)} style={arenaStyles.battleCodeSubtext}>
            Share this code with your friend to join the battle:
          </Animated.Text>

          {/* Battle Code Display */}
          <Animated.View entering={SlideInUp.delay(900)} style={arenaStyles.battleCodeCard}>
            <BlurView intensity={60} tint="dark" style={arenaStyles.battleCodeCardContent}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.4)", "rgba(0, 0, 0, 0.8)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={arenaStyles.battleCodeText}>{battleId.slice(-8).toUpperCase()}</Text>
              <TouchableOpacity
                style={arenaStyles.copyCodeButton}
                onPress={() => {
                  // Copy to clipboard functionality would go here
                  Alert.alert("Copied!", "Battle code copied to clipboard")
                }}
              >
                <Text style={arenaStyles.copyCodeButtonText}>Copy Code</Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>

          {/* Connection Status */}
          <View style={arenaStyles.connectionStatus}>
            <Wifi size={16} color={connectionStatus === "connected" ? "#10B981" : "#EF4444"} />
            <Text
              style={[arenaStyles.connectionText, { color: connectionStatus === "connected" ? "#10B981" : "#EF4444" }]}
            >
              {connectionStatus === "connected" ? "Connected" : "Connecting..."}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // Main battle screen
  return (
    <SafeAreaView style={arenaStyles.container}>
      <LinearGradient
        colors={["#0F0F23", "#1E1B4B", "#312E81"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Battle Field */}
      <Animated.View style={[battleStyles.battleField, battleFieldAnimation]}>
        <Image source={vsImage} style={battleStyles.vsImage} />
        {/* Player 1 Beast */}
        <Animated.View style={[battleStyles.playerBeastContainer, battleStyles.player1BeastContainer]}>
          <Image source={{ uri: getImageUrl(player1Beast?.image_url) }} style={battleStyles.beastImage} />
          <View style={battleStyles.beastStatsContainer}>
            <Text style={battleStyles.beastName}>{player1Name}</Text>
            <View style={battleStyles.healthBarContainer}>
              <Text style={battleStyles.healthText}>Health: {player1Beast?.health}</Text>
              <Animated.View style={[battleStyles.healthBar, player1HealthStyle]} />
            </View>
            <View style={battleStyles.energyBarContainer}>
              <Text style={battleStyles.energyText}>Energy: {player1Beast?.energy}</Text>
              <Animated.View style={[battleStyles.energyBar, player1EnergyStyle]} />
            </View>
          </View>
        </Animated.View>
        {/* Player 2 Beast */}
        <Animated.View style={[battleStyles.playerBeastContainer, battleStyles.player2BeastContainer]}>
          <Image source={{ uri: getImageUrl(player2Beast?.image_url) }} style={battleStyles.beastImage} />
          <View style={battleStyles.beastStatsContainer}>
            <Text style={battleStyles.beastName}>{player2Name}</Text>
            <View style={battleStyles.healthBarContainer}>
              <Text style={battleStyles.healthText}>Health: {player2Beast?.health}</Text>
              <Animated.View style={[battleStyles.healthBar, player2HealthStyle]} />
            </View>
            <View style={battleStyles.energyBarContainer}>
              <Text style={battleStyles.energyText}>Energy: {player2Beast?.energy}</Text>
              <Animated.View style={[battleStyles.energyBar, player2EnergyStyle]} />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
      {/* Abilities */}
      <View style={battleStyles.abilitiesContainer}>
        {player1Beast?.abilities.map((ability) => (
          <TouchableOpacity
            key={ability.id}
            style={[battleStyles.abilityButton, { backgroundColor: getAbilityTypeColor(ability.type) }]}
            onPress={() => handleAttack(ability)}
            disabled={!isMyTurn() || selectedMove !== null}
          >
            <Text style={battleStyles.abilityText}>{ability.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Battle Log */}
      {showBattleLog && (
        <View style={battleStyles.battleLogContainer}>
          {battleLogs.map((log) => (
            <Text key={log.id} style={[battleStyles.battleLogText, { color: getAbilityTypeColor(log.type) }]}>
              {log.message}
            </Text>
          ))}
        </View>
      )}
    </SafeAreaView>
  )
}

const battleStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
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
  connectionIndicator: {
    position: "absolute",
    top: 20,
    right: 80,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 100,
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
    marginBottom: 24,
    lineHeight: 24,
  },
  modernExitButton: {
    backgroundColor: "rgba(124, 58, 237, 0.9)",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  modernExitButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
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
  battleField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
  },
  playerBeastContainer: {
    alignItems: "center",
  },
  beastImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  beastStatsContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  healthBarContainer: {
    width: 150,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 5,
  },
  healthBar: {
    height: 10,
    backgroundColor: "#10B981",
    width: "100%",
  },
  energyBarContainer: {
    width: 150,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 5,
  },
  energyBar: {
    height: 10,
    backgroundColor: "#F59E0B",
    width: "100%",
  },
  healthText: {
    color: "#fff",
    fontSize: 12,
    position: "absolute",
    top: -15,
  },
  energyText: {
    color: "#fff",
    fontSize: 12,
    position: "absolute",
    top: -15,
  },
  abilitiesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  abilityButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  abilityText: {
    color: "#fff",
    fontSize: 16,
  },
  battleLogContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  battleLogText: {
    color: "#fff",
    fontSize: 14,
  },
})
