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
} from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import { createElement } from "react"
import * as SecureStore from "expo-secure-store"
import { supabase } from "@/lib/supabase"
import vsImage from "../../assets/images/vs/vs.png"

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
  const [selectedMove, setSelectedMove] = useState<BeastAbility | null>(null)
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
      setBattleLogs((prev) => [
        {
          id: Date.now().toString() + "_status",
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

  // Update the fetchBattleData function
  useEffect(() => {
    const fetchBattleData = async () => {
      setIsLoading(true)
      try {
        // Get user ID
        const userId = await SecureStore.getItemAsync("userId")

        setPlayer1Name("You")
        setPlayer2Name("Opponent")

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

        // Parse metadata and get abilities
        const playerMetadata = playerBeastData.metadata
        const playerAbilityIds = playerMetadata.abilities || []
        const playerAbilities = await fetchBeastAbilities(playerAbilityIds)

        // Use allocated_stats instead of metadata stats
        const allocatedStats = playerBeastData.allocated_stats || { attack: 50, defense: 50, speed: 50, health: 50 }

        // Create player beast object
        const playerBeast: Beast = {
          ...playerBeastData,
          health: allocatedStats.health * 4, // Use allocated health * 4 for max 200 HP
          maxHealth: allocatedStats.health * 4,
          energy: 100,
          maxEnergy: 100,
          level: playerMetadata.tier || 1,
          element: playerAbilities[0]?.element || "fire", // Use first ability's element
          stats: {
            attack: allocatedStats.attack,
            defense: allocatedStats.defense,
            speed: allocatedStats.speed,
            magic: allocatedStats.attack, // Use attack for magic
          },
          abilities: [
            ...playerAbilities,
            // Universal energy restoration ability
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
        setPlayer1Beast(playerBeast)

        // Fetch opponent beast
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

        // Select random opponent
        const randomOpponent = opponentBeastData[Math.floor(Math.random() * opponentBeastData.length)]
        const opponentMetadata = randomOpponent.metadata
        const opponentAbilityIds = opponentMetadata.abilities || []
        const opponentAbilities = await fetchBeastAbilities(opponentAbilityIds)

        // Set opponent name to truncated wallet address
        const opponentWalletAddress = randomOpponent.users?.wallet_address || "Unknown"
        setPlayer2Name(truncateWalletAddress(opponentWalletAddress))

        // Use allocated_stats for opponent too
        const opponentAllocatedStats = randomOpponent.allocated_stats || {
          attack: 50,
          defense: 50,
          speed: 50,
          health: 50,
        }

        // Create opponent beast object
        const opponentBeast: Beast = {
          ...randomOpponent,
          health: opponentAllocatedStats.health * 4,
          maxHealth: opponentAllocatedStats.health * 4,
          energy: 100,
          maxEnergy: 100,
          level: opponentMetadata.tier || 1,
          element: opponentAbilities[0]?.element || "water",
          stats: {
            attack: opponentAllocatedStats.attack,
            defense: opponentAllocatedStats.defense,
            speed: opponentAllocatedStats.speed,
            magic: opponentAllocatedStats.attack,
          },
          abilities: [
            ...opponentAbilities,
            // Universal energy restoration ability
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
    if (!player2Beast || gameOver || !player2Beast.abilities.length) return

    // Filter available moves (enough energy)
    const availableMoves = player2Beast.abilities.filter((ability) => player2Beast.energy >= ability.energy_cost)

    if (availableMoves.length === 0) {
      // No moves available, skip turn
      setTimeout(() => {
        regenerateEnergy("player2")
        processEndOfTurn("player2")
      }, 1000)
      return
    }

    // Randomly select a move
    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)]

    // Execute the attack
    handleAttack(randomMove, "player2")
  }

  // Replace the handleAttack function completely
  const handleAttack = (ability: BeastAbility, attacker: "player1" | "player2" = "player1") => {
    if (gameOver) return

    const attackerBeast = attacker === "player1" ? player1Beast : player2Beast
    const defenderBeast = attacker === "player1" ? player2Beast : player1Beast

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

      // Skip turn but still regenerate energy and process status effects
      setTimeout(() => {
        regenerateEnergy(attacker)
        processEndOfTurn(attacker)
      }, 1000)
      return
    }

    Vibration.vibrate(50)
    setSelectedMove(ability)

    // Calculate hit chance
    const hitRoll = Math.random() * 100
    const missChance = 100 - ability.accuracy

    if (hitRoll < missChance) {
      // Attack missed - add shake animation for the attacker
      shakeValue.value = withSequence(
        withTiming(5, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      )

      setBattleLogs((prev) => [
        {
          id: Date.now().toString(),
          message: `${attackerBeast.name}'s ${ability.name} missed!`,
          type: "system",
          timestamp: Date.now(),
        },
        ...prev.slice(0, 4),
      ])

      setShowBattleLog(true)
      setTimeout(() => setShowBattleLog(false), 2000)

      // Still consume energy and end turn
      setTimeout(() => {
        regenerateEnergy(attacker)
        processEndOfTurn(attacker)
      }, 1000)
      return
    }

    // Calculate critical hit chance (base 10%, +5% for every 25% health lost)
    const healthPercentage = attackerBeast.health / attackerBeast.maxHealth
    const baseCritChance = 10
    const lowHealthBonus = (1 - healthPercentage) * 20 // Up to 20% bonus when near death
    const critChance = baseCritChance + lowHealthBonus
    const critRoll = Math.random() * 100
    const isCritical = critRoll < critChance

    // Enhanced damage calculation based on ability type
    let damage = 0
    let healing = 0
    let effectiveness = 1.0

    if (ability.type === "attack") {
      // Get elemental effectiveness
      const attackerElement = ability.element
      const defenderElement = defenderBeast.element

      if (elementalChart[attackerElement] && elementalChart[attackerElement][defenderElement]) {
        effectiveness = elementalChart[attackerElement][defenderElement]
      }

      // Base damage calculation using ability power and beast stats
      const attackStat = attackerBeast.stats.attack
      const defenseStat = defenderBeast.stats.defense

      damage = ability.power * (attackStat / defenseStat) * 0.4 * effectiveness

      // Add larger damage variance (±25%)
      damage = damage * (0.75 + Math.random() * 0.5)

      // Apply critical hit
      if (isCritical) {
        damage *= 2
        // Critical hits restore some energy
        const energyRestore = Math.min(15, attackerBeast.maxEnergy - attackerBeast.energy)
        if (attacker === "player1") {
          setPlayer1Beast((prev) => ({ ...prev, energy: prev.energy + energyRestore }))
        } else {
          setPlayer2Beast((prev) => ({ ...prev, energy: prev.energy + energyRestore }))
        }
      }

      // Round damage
      damage = Math.round(damage)
    } else if (ability.type === "heal") {
      // Healing ability
      healing = Math.round(ability.power * 0.8) // Heal for 80% of power value
      const newHealth = Math.min(attackerBeast.maxHealth, attackerBeast.health + healing)

      if (attacker === "player1") {
        setPlayer1Beast((prev) => ({ ...prev, health: newHealth }))
        player1Health.value = withSpring((newHealth / attackerBeast.maxHealth) * 100)
      } else {
        setPlayer2Beast((prev) => ({ ...prev, health: newHealth }))
        player2Health.value = withSpring((newHealth / attackerBeast.maxHealth) * 100)
      }
    } else if (ability.type === "energy") {
      // Energy restoration ability
      const energyRestore = 30 + Math.floor(Math.random() * 31) // Random 30-60 energy
      const newEnergy = Math.min(attackerBeast.maxEnergy, attackerBeast.energy + energyRestore)

      if (attacker === "player1") {
        setPlayer1Beast((prev) => ({ ...prev, energy: newEnergy }))
        player1Energy.value = withSpring((newEnergy / attackerBeast.maxEnergy) * 100)
      } else {
        setPlayer2Beast((prev) => ({ ...prev, energy: newEnergy }))
        player2Energy.value = withSpring((newEnergy / attackerBeast.maxEnergy) * 100)
      }

      // Add energy restore to battle log
      setBattleLogs((prev) => [
        {
          id: Date.now().toString() + "_energy_restore",
          message: `${attackerBeast.name} restored ${energyRestore} energy!`,
          type: "system",
          timestamp: Date.now(),
        },
        ...prev.slice(0, 4),
      ])
    } else if (ability.type === "buff" || ability.type === "debuff") {
      // Status effects and buffs/debuffs
      applyStatusEffect(ability, ability.type === "buff" ? attackerBeast : defenderBeast, attacker)
    }

    // Enhanced animations
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

    // Apply damage and update health
    if (damage > 0) {
      if (attacker === "player1") {
        const newHealth = Math.max(0, defenderBeast.health - damage)
        player2Health.value = withSpring((newHealth / defenderBeast.maxHealth) * 100)
        setPlayer2Beast((prev) => ({ ...prev, health: newHealth }))

        if (newHealth <= 0) {
          handleGameOver("player1")
          return
        }
      } else {
        const newHealth = Math.max(0, defenderBeast.health - damage)
        player1Health.value = withSpring((newHealth / defenderBeast.maxHealth) * 100)
        setPlayer1Beast((prev) => ({ ...prev, health: newHealth }))

        if (newHealth <= 0) {
          handleGameOver("player2")
          return
        }
      }
    }

    // Update energy
    if (attacker === "player1") {
      const newEnergy = Math.max(0, attackerBeast.energy - ability.energy_cost)
      player1Energy.value = withSpring((newEnergy / attackerBeast.maxEnergy) * 100)
      setPlayer1Beast((prev) => ({ ...prev, energy: newEnergy }))
    } else {
      const newEnergy = Math.max(0, attackerBeast.energy - ability.energy_cost)
      player2Energy.value = withSpring((newEnergy / attackerBeast.maxEnergy) * 100)
      setPlayer2Beast((prev) => ({ ...prev, energy: newEnergy }))
    }

    // Create battle log message
    let logMessage = ""
    if (ability.type === "heal") {
      logMessage = `${attackerBeast.name} used ${ability.name}! Restored ${healing} health!`
    } else if (ability.type === "energy") {
      // Energy restore message is already added above
      logMessage = `${attackerBeast.name} used ${ability.name}!`
    } else if (ability.type === "buff" || ability.type === "debuff") {
      logMessage = `${attackerBeast.name} used ${ability.name}!`
    } else {
      logMessage = `${attackerBeast.name} used ${ability.name}!`
      if (isCritical) logMessage += " Critical hit!"
      if (damage > 0) logMessage += ` Dealt ${damage} damage!`
      if (effectiveness > 1) logMessage += " It's super effective!"
      if (effectiveness < 1) logMessage += " It's not very effective..."
    }

    setBattleLogs((prev) => [
      {
        id: Date.now().toString(),
        message: logMessage,
        type: isCritical ? "system" : ability.type === "heal" ? "heal" : "attack",
        timestamp: Date.now(),
      },
      ...prev.slice(0, 4),
    ])

    setShowBattleLog(true)
    setTimeout(() => setShowBattleLog(false), 3000)

    // Process end of turn after a delay
    setTimeout(() => {
      regenerateEnergy(attacker)
      processEndOfTurn(attacker)
    }, 1500)
  }

  // Add new helper functions
  const regenerateEnergy = (attacker: "player1" | "player2") => {
    // Random energy regeneration (3-8 points)
    const energyGain = 3 + Math.floor(Math.random() * 6)

    if (attacker === "player1") {
      setPlayer1Beast((prev) => {
        const newEnergy = Math.min(prev.maxEnergy, prev.energy + energyGain)
        player1Energy.value = withSpring((newEnergy / prev.maxEnergy) * 100)
        return { ...prev, energy: newEnergy }
      })
    } else {
      setPlayer2Beast((prev) => {
        const newEnergy = Math.min(prev.maxEnergy, prev.energy + energyGain)
        player2Energy.value = withSpring((newEnergy / prev.maxEnergy) * 100)
        return { ...prev, energy: newEnergy }
      })
    }

    setBattleLogs((prev) => [
      {
        id: Date.now().toString() + "_energy",
        message: `${attacker === "player1" ? player1Name : player2Name} regenerated ${energyGain} energy!`,
        type: "system",
        timestamp: Date.now(),
      },
      ...prev.slice(0, 4),
    ])
  }

  const applyStatusEffect = (ability: BeastAbility, target: Beast, attacker: "player1" | "player2") => {
    let statusType: "burn" | "freeze" | "poison" | undefined
    let duration = 3

    // Determine status effect based on ability element
    if (ability.element === "fire") {
      statusType = "burn"
    } else if (ability.element === "water") {
      statusType = "freeze"
      duration = 2 // Freeze is shorter but more impactful
    } else if (ability.element === "dark") {
      statusType = "poison"
    }

    if (statusType) {
      const newStatus = { type: statusType, duration }

      if (attacker === "player1") {
        setPlayer2Beast((prev) => ({ ...prev, status: newStatus }))
      } else {
        setPlayer1Beast((prev) => ({ ...prev, status: newStatus }))
      }

      setBattleLogs((prev) => [
        {
          id: Date.now().toString() + "_status_apply",
          message: `${target.name} is now ${statusType}ed!`,
          type: "status",
          timestamp: Date.now(),
        },
        ...prev.slice(0, 4),
      ])
    }
  }

  const processEndOfTurn = (attacker: "player1" | "player2") => {
    // Process status effects for both beasts
    if (player1Beast) {
      processStatusEffects(player1Beast, setPlayer1Beast, player1Health)
    }
    if (player2Beast) {
      processStatusEffects(player2Beast, setPlayer2Beast, player2Health)
    }

    // Switch turns if game is not over
    if (!gameOver) {
      setCurrentTurn(attacker === "player1" ? "player2" : "player1")
      setTurnTime(30)
    }
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
  if (isLoading || !player1Beast || !player2Beast) {
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
            <Activity size={64} color="#7C3AED" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(300)} style={styles.loadingText}>
            Preparing Epic Battle...
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(600)} style={styles.loadingSubtext}>
            Loading beast abilities from database...
          </Animated.Text>
        </View>
      </SafeAreaView>
    )
  }

  const handleGameOver = (winner: "player1" | "player2") => {
    setGameOver(true)
    setWinner(winner)
  }

  const handleExitBattle = () => {
    router.back()
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

      {/* Battle Arena */}
      <Animated.View style={[styles.arenaContainer, battleFieldAnimation]}>
        {/* Enhanced Enemy Stats (Top) */}
        <Animated.View entering={SlideInDown.delay(200)} style={styles.enemyStats}>
          <BlurView intensity={60} tint="dark" style={styles.modernStatsCard}>
            <LinearGradient
              colors={[`${getElementColor(player2Beast.element)}40`, "rgba(0, 0, 0, 0.8)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.statsHeader}>
              <View style={styles.playerInfo}>
                <View style={styles.playerNameContainer}>
                  <Text style={styles.playerName}>{player2Name}</Text>
                  <View style={styles.modernRankBadge}>
                    <Crown size={14} color="#FFD700" />
                    <Text style={styles.rankText}>#{player2Beast.level}</Text>
                  </View>
                </View>
                <View style={styles.beastInfo}>
                  <Text style={styles.beastName}>{player2Beast.name}</Text>
                  <View style={styles.modernElementBadge}>
                    {createElement(getElementIcon(player2Beast.element), {
                      size: 14,
                      color: getElementColor(player2Beast.element),
                    })}
                    <Text style={[styles.elementText, { color: getElementColor(player2Beast.element) }]}>
                      {player2Beast.element}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.modernStatsGrid}>
              <View style={styles.modernStatItem}>
                <Heart size={18} color="#EF4444" />
                <View style={styles.modernStatBarContainer}>
                  <Animated.View style={[styles.modernStatBar, player2HealthStyle, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.modernStatText}>{Math.round(player2Beast.health) || 0}</Text>
                </View>
              </View>

              <View style={styles.modernStatItem}>
                <Zap size={18} color="#7C3AED" />
                <View style={styles.modernStatBarContainer}>
                  <Animated.View style={[styles.modernStatBar, player2EnergyStyle, { backgroundColor: "#7C3AED" }]} />
                  <Text style={styles.modernStatText}>{Math.round(player2Beast.energy)}</Text>
                </View>
              </View>
              {player2Beast.status && (
                <View style={styles.statusEffectContainer}>
                  <Text style={styles.statusEffectText}>
                    {player2Beast.status.type}: {player2Beast.status.duration} turns
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
                <Text style={styles.modernTurnText}>{currentTurn === "player1" ? "Your Turn" : "Enemy Turn"}</Text>
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

          {/* Enhanced Enemy Beast */}
          <Animated.View
            ref={player2BeastRef}
            entering={SlideInLeft.delay(400)}
            style={[styles.modernBeastContainer, styles.enemyBeastContainer]}
          >
            <LinearGradient
              colors={[`${getElementColor(player2Beast.element)}60`, "transparent"]}
              style={styles.modernBeastGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.beastImageContainer}>
              <Image
                source={{ uri: getImageUrl(player2Beast.image_url) }}
                style={styles.modernBeastImage}
                resizeMode="contain"
                onError={(e) => console.log("Error loading enemy beast image:", e.nativeEvent.error)}
              />
            </View>
            <View style={styles.beastShadow} />
          </Animated.View>

          {/* Enhanced Player Beast */}
          <Animated.View
            ref={player1BeastRef}
            entering={SlideInRight.delay(400)}
            style={[styles.modernBeastContainer, styles.playerBeastContainer]}
          >
            <LinearGradient
              colors={[`${getElementColor(player1Beast.element)}60`, "transparent"]}
              style={styles.modernBeastGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.beastImageContainer}>
              <Image
                source={{ uri: getImageUrl(player1Beast.image_url) }}
                style={styles.modernBeastImage}
                resizeMode="contain"
                onError={(e) => console.log("Error loading player beast image:", e.nativeEvent.error)}
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
                    ? `Your ${player1Beast.name} has triumphed over ${player2Beast.name}!`
                    : `Your ${player1Beast.name} has fallen to ${player2Beast.name}!`}
                </Text>
                <TouchableOpacity style={styles.modernExitButton} onPress={() => router.back()}>
                  <Text style={styles.modernExitButtonText}>Return to Map</Text>
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
          )}
        </View>

        {/* Enhanced Player Stats (Bottom) */}
        <Animated.View entering={SlideInUp.delay(200)} style={styles.playerStats}>
          <BlurView intensity={60} tint="dark" style={styles.modernStatsCard}>
            <LinearGradient
              colors={[`${getElementColor(player1Beast.element)}40`, "rgba(0, 0, 0, 0.8)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.statsHeader}>
              <View style={styles.playerInfo}>
                <View style={styles.playerNameContainer}>
                  <Text style={styles.playerName}>{player1Name}</Text>
                  <View style={styles.modernRankBadge}>
                    <Crown size={14} color="#FFD700" />
                    <Text style={styles.rankText}>#{player1Beast.level}</Text>
                  </View>
                </View>
                <View style={styles.beastInfo}>
                  <Text style={styles.beastName}>{player1Beast.name}</Text>
                  <View style={styles.modernElementBadge}>
                    {createElement(getElementIcon(player1Beast.element), {
                      size: 14,
                      color: getElementColor(player1Beast.element),
                    })}
                    <Text style={[styles.elementText, { color: getElementColor(player1Beast.element) }]}>
                      {player1Beast.element}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.modernStatsGrid}>
              <View style={styles.modernStatItem}>
                <Heart size={18} color="#EF4444" />
                <View style={styles.modernStatBarContainer}>
                  <Animated.View style={[styles.modernStatBar, player1HealthStyle, { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.modernStatText}>{Math.round(player1Beast.health) || 0}</Text>
                </View>
              </View>

              <View style={styles.modernStatItem}>
                <Zap size={18} color="#7C3AED" />
                <View style={styles.modernStatBarContainer}>
                  <Animated.View style={[styles.modernStatBar, player1EnergyStyle, { backgroundColor: "#7C3AED" }]} />
                  <Text style={styles.modernStatText}>{Math.round(player1Beast.energy)}</Text>
                </View>
              </View>
              {player1Beast.status && (
                <View style={styles.statusEffectContainer}>
                  <Text style={styles.statusEffectText}>
                    {player1Beast.status.type}: {player1Beast.status.duration} turns
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

        {/* Enhanced Moves Panel */}
        {currentTurn === "player1" && !gameOver && (
          <Animated.View entering={SlideInUp.delay(300)} style={styles.modernMovesPanel}>
            <BlurView intensity={60} tint="dark" style={styles.modernMovesPanelContent}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0.8)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.modernMovesGrid}>
                {player1Beast.abilities.map((ability) => (
                  <TouchableOpacity
                    key={ability.id}
                    style={[
                      styles.modernMoveCard,
                      { borderColor: getAbilityTypeColor(ability.type) },
                      player1Beast.energy < ability.energy_cost && styles.disabledMove,
                    ]}
                    onPress={() => player1Beast.energy >= ability.energy_cost && handleAttack(ability)}
                    disabled={player1Beast.energy < ability.energy_cost}
                  >
                    <LinearGradient
                      colors={[`${getAbilityTypeColor(ability.type)}30`, "rgba(0, 0, 0, 0.8)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
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
                ))}
              </View>
            </BlurView>
          </Animated.View>
        )}

        {/* Enhanced Back Button */}
        <TouchableOpacity style={styles.modernBackButton} onPress={handleExitBattle}>
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
    overflow: "hidden", // Add this to ensure the image respects the container's border radius
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
    width: 400,
    zIndex: 20,
  },
  modernBattleLogCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modernLogText: {
    fontSize: 16,
    marginBottom: 6,
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
    bottom: 140,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  modernMovesPanelContent: {
    padding: 16,
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
    padding: 12,
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
})
