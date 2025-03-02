"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated"
import {
  ArrowLeft,
  Shield,
  Crown,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Sword,
  Heart,
  Zap,
  Flame,
  Cloud,
  Mountain,
  Wind,
  Sun,
  Moon,
  Check,
  X,
  Upload,
} from "lucide-react-native"
import { router } from "expo-router"
import * as SecureStore from "expo-secure-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import algosdk from "algosdk"
import { supabase } from "@/lib/supabase"
import React from "react"

// Base prompt for beast generation
const BASE_PROMPT =
  "Create a high-detail pixel art dragon with no background. Render a perfect, symmetric side view of the entire dragon, showcasing its elongated body, detailed scales, and vibrant colors in crisp pixel style. The image should capture the dragon in full profile with clean lines and a balanced composition, emphasizing its majestic form without any additional elements."

const TIERS = [
  {
    id: 1,
    name: "Basic",
    description: "Standard point allocation, balanced stats, basic abilities",
    color: "#94A3B8",
    cost: "Free",
    icon: Shield,
    stats: {
      maxPoints: 280,
      maxPerStat: 80,
    },
  },
  {
    id: 2,
    name: "Advanced",
    description: "Slightly enhanced stats, access to moderate abilities",
    color: "#3B82F6",
    cost: "500 $CAMP",
    icon: Shield,
    stats: {
      maxPoints: 320,
      maxPerStat: 90,
    },
  },
  {
    id: 3,
    name: "Elite",
    description: "Higher total stat points with strict caps and powerful abilities",
    color: "#7C3AED",
    cost: "1000 $CAMP",
    icon: Crown,
    stats: {
      maxPoints: 360,
      maxPerStat: 100,
    },
  },
]

interface Ability {
  id: string
  name: string
  type: "attack" | "heal" | "buff" | "debuff"
  element: "fire" | "water" | "earth" | "wind" | "light" | "dark"
  power: number
  accuracy: number
  energy_cost: number
  cooldown: number
  description: string
  metadata: any
}

export default function BeastCreationScreen() {

  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [step, setStep] = useState<"tier" | "abilities" | "design" | "stats" | "preview">("tier")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreatingAsset, setIsCreatingAsset] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [generatedImageUrl, setGeneratedImageUrl] = useState("")
  const [ipfsHash, setIpfsHash] = useState("")
  const [assetId, setAssetId] = useState("")
  const [beastName, setBeastName] = useState("")
  const [remainingRequests, setRemainingRequests] = useState(5)
  const [abilities, setAbilities] = useState<Ability[]>([])
  const [selectedAbilities, setSelectedAbilities] = useState<Ability[]>([])
  const [stats, setStats] = useState({
    attack: 50,
    defense: 50,
    speed: 50,
    health: 50,
  })
  const [error, setError] = useState<string | null>(null)
  const [base64Data, setBase64Data] = useState<string>("")

  const handleUploadToIPFS = async () => {
    if (!ipfsHash || !beastName) {
      setError("No image generated or beast name not set")
      return null
    }
    return ipfsHash
  }

  useEffect(() => {
    fetchAbilities()
    checkRemainingRequests()
  }, [])

  const checkRemainingRequests = async () => {
    try {
      const storedRequests = await AsyncStorage.getItem("remainingBeastRequests")
      if (storedRequests !== null) {
        setRemainingRequests(Number.parseInt(storedRequests))
      } else {
        // Initialize with 5 requests if not set
        await AsyncStorage.setItem("remainingBeastRequests", "5")
      }
    } catch (error) {
      console.error("Error checking remaining requests:", error)
    }
  }

  const fetchAbilities = async () => {
    try {
      const { data, error } = await supabase.from("beast_abilities").select("*")
      if (error) throw error

      if (data) {
        setAbilities(data)
      }
    } catch (err) {
      console.error("Error fetching abilities:", err)
      setError("Failed to load abilities")
    }
  }

  const handleSelectAbility = (ability: Ability) => {
    if (selectedAbilities.some((a) => a.id === ability.id)) {
      // Remove ability if already selected
      setSelectedAbilities(selectedAbilities.filter((a) => a.id !== ability.id))
    } else if (selectedAbilities.length < 4) {
      // Add ability if less than 4 are selected
      setSelectedAbilities([...selectedAbilities, ability])
    } else {
      // Alert user if trying to select more than 4 abilities
      Alert.alert("Maximum Abilities", "You can only select up to 4 abilities")
    }
  }

  const handleStatChange = (stat: keyof typeof stats, change: number) => {
    if (!selectedTier) return

    const tierInfo = TIERS[selectedTier - 1].stats
    const currentTotal = Object.values(stats).reduce((a, b) => a + b, 0)
    const newValue = stats[stat] + change

    // Check if the new value is within bounds
    if (newValue < 10 || newValue > tierInfo.maxPerStat) return

    // Check if adding this change would exceed max points
    if (currentTotal + change > tierInfo.maxPoints) return

    setStats({
      ...stats,
      [stat]: newValue,
    })
  }

  const generateBeastImage = async () => {
    if (remainingRequests <= 0) {
      Alert.alert("Limit Reached", "You've used all your beast generation requests")
      return
    }

    try {
      setIsGenerating(true)
      setError(null)

      // Combine base prompt with custom prompt
      const prompt = `${BASE_PROMPT} ${customPrompt}`

      // Call the IPFS generator API
      const response = await fetch("https://quest-rosy-kappa.vercel.app/api/prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
        }),
      })

      const json = await response.json()
      console.log("API Response:", json)

      if (json.success && json.ipfsUrl) {
        // Update remaining requests
        const newRemainingRequests = remainingRequests - 1
        setRemainingRequests(newRemainingRequests)
        await AsyncStorage.setItem("remainingBeastRequests", newRemainingRequests.toString())

        // Set the IPFS hash and preview URL
        const hash = json.ipfsUrl.replace("ipfs://", "")
        setIpfsHash(hash)
        setGeneratedImageUrl(`https://gateway.pinata.cloud/ipfs/${hash}`)
      } else {
        throw new Error("Failed to generate image")
      }
    } catch (error) {
      console.error("Error generating beast image:", error)
      setError("Failed to generate beast image. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const createBeast = async () => {
    if (!selectedTier || !beastName || selectedAbilities.length !== 4 || !generatedImageUrl) {
      setError("Please complete all steps before creating your beast")
      return
    }

    try {
      setIsCreatingAsset(true)
      setError(null)

      // 1. Upload image to IPFS if not already done
      const hash = ipfsHash
      if (!hash) {
        setError("No image generated")
        return
      }

      // 2. Get wallet address and mnemonic
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      const walletAddress = await SecureStore.getItemAsync("walletAddress")

      if (!mnemonic || !walletAddress) {
        throw new Error("Wallet not found")
      }

      // 3. Create Algorand account from mnemonic
      const account = algosdk.mnemonicToSecretKey(mnemonic)

      // 4. Initialize Algorand client
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")

      // 5. Get suggested parameters
      const suggestedParams = await algodClient.getTransactionParams().do()

      // 6. Prepare metadata
      const ipfsUrl = `ipfs://${hash}`
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${hash}`

      const metadata = {
        standard: "arc69",
        name: beastName,
        description: `A tier ${selectedTier} beast`,
        type: "Beast",
        tier: selectedTier,
        created_at: new Date().toISOString(),
        image_url: imageUrl,
        stats: stats,
        abilities: selectedAbilities.map((a) => a.id),
      }

      // 7. Create asset
      const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        sender: account.addr,
        total: 1,
        decimals: 0,
        assetName: beastName,
        unitName: "BEAST",
        assetURL: ipfsUrl,
        manager: account.addr,
        reserve: account.addr,
        freeze: account.addr,
        clawback: account.addr,
        defaultFrozen: false,
        suggestedParams,
        note: new TextEncoder().encode(JSON.stringify(metadata)),
      })

      // 8. Sign transaction
      const signedTxn = txn.signTxn(account.sk)

       // 9. Submit transaction
const { txid } = await algodClient.sendRawTransaction(signedTxn).do()

// 10. Wait for confirmation
const result = await algosdk.waitForConfirmation(algodClient, txid, 4)

// 11. Get asset ID
const assetID = String(result["assetIndex"])
      setAssetId(assetID)

      // 12. Store beast in database
      const { data: userData } = await supabase.from("users").select("id").eq("wallet_address", walletAddress).single()

      if (!userData) throw new Error("User not found")

      const { error: insertError } = await supabase.from("beasts").insert([
        {
          name: beastName,
          owner_id: userData.id,
          asset_id: assetID,
          tier: selectedTier,
          image_url: imageUrl,
          ipfs_url: ipfsUrl,
          allocated_stats: stats,
          metadata: metadata,
        },
      ])

      if (insertError) throw insertError

      // 13. Store ability assignments
      const abilityPromises = selectedAbilities.map((ability, index) => {
        return supabase.from("beast_ability_assignments").insert([
          {
            beast_id: assetID,
            ability_id: ability.id,
            slot_number: index + 1,
          },
        ])
      })

      await Promise.all(abilityPromises)

      // 14. Success! Navigate to success screen or show success message
      Alert.alert(
        "Beast Created!",
        `Your beast "${beastName}" has been created successfully with Asset ID: ${assetID}`,
        [
          {
            text: "View in Inventory",
            onPress: () => router.push("/inventory"),
          },
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      )
    } catch (error) {
      console.error("Error creating beast:", error)
      setError(`Failed to create beast: ${error || "Unknown error"}`)
    } finally {
      setIsCreatingAsset(false)
    }
  }

  const renderStatBar = (value: number, color: string, maxValue: number) => (
    <View style={styles.statBarContainer}>
      <View style={[styles.statBarFill, { width: `${(value / maxValue) * 100}%`, backgroundColor: color }]} />
    </View>
  )

  const getElementIcon = (element: string) => {
    switch (element.toLowerCase()) {
      case "fire":
        return <Flame size={16} />
      case "water":
        return <Cloud size={16} />
      case "earth":
        return <Mountain size={16} />
      case "wind":
        return <Wind size={16} />
      case "light":
        return <Sun size={16} />
      case "dark":
        return <Moon size={16} />
      default:
        return <Sparkles size={16} />
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "attack":
        return "#EF4444"
      case "heal":
        return "#10B981"
      case "buff":
        return "#7C3AED"
      case "debuff":
        return "#F59E0B"
      default:
        return "#94A3B8"
    }
  }

  const renderTierSelection = () => (
    <View style={styles.tierSelection}>
      {TIERS.map((tier, index) => (
        <Animated.View key={tier.id} entering={FadeInDown.delay(200 * index)}>
          <TouchableOpacity
            style={[styles.tierCard, selectedTier === tier.id && styles.tierCardSelected]}
            onPress={() => setSelectedTier(tier.id)}
          >
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
              <LinearGradient colors={[`${tier.color}20`, "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            </BlurView>
            <View style={[styles.tierIcon, { backgroundColor: `${tier.color}40` }]}>
              <tier.icon size={24} color={tier.color} />
            </View>
            <View style={styles.tierInfo}>
              <Text style={styles.tierName}>{tier.name}</Text>
              <Text style={styles.tierDescription}>{tier.description}</Text>
            </View>
            <View style={[styles.tierCost, { backgroundColor: `${tier.color}20` }]}>
              <Text style={[styles.tierCostText, { color: tier.color }]}>{tier.cost}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  )

  const renderAbilitiesSelection = () => (
    <View style={styles.abilitiesContainer}>
      <Text style={styles.sectionTitle}>Select 4 Abilities</Text>
      <Text style={styles.sectionSubtitle}>{selectedAbilities.length}/4 abilities selected</Text>

      {/* Selected Abilities */}
      {selectedAbilities.length > 0 && (
        <View style={styles.selectedAbilitiesContainer}>
          <Text style={styles.subsectionTitle}>Selected Abilities</Text>
          <View style={styles.selectedAbilitiesGrid}>
            {selectedAbilities.map((ability) => (
              <TouchableOpacity
                key={ability.id}
                style={[styles.abilityCard, { borderColor: getTypeColor(ability.type) }]}
                onPress={() => handleSelectAbility(ability)}
              >
                <LinearGradient
                  colors={[`${getTypeColor(ability.type)}20`, "rgba(0, 0, 0, 0)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.abilityHeader}>
                  <View style={styles.abilityTypeContainer}>
                    {React.cloneElement(getElementIcon(ability.element), {
                      color: getElementColor(ability.element),
                    })}
                    <Text style={[styles.abilityType, { color: getTypeColor(ability.type) }]}>{ability.type}</Text>
                  </View>
                  <View style={[styles.elementBadge, { backgroundColor: `${getElementColor(ability.element)}20` }]}>
                    <Text style={[styles.elementText, { color: getElementColor(ability.element) }]}>
                      {ability.element}
                    </Text>
                  </View>
                </View>
                <Text style={styles.abilityName}>{ability.name}</Text>
                <Text style={styles.abilityDescription} numberOfLines={2}>
                  {ability.description}
                </Text>
                <View style={styles.abilityStats}>
                  {ability.power > 0 && (
                    <View style={styles.abilityStat}>
                      <Sword size={12} color="#ffffff" />
                      <Text style={styles.abilityStatText}>{ability.power}</Text>
                    </View>
                  )}
                  <View style={styles.abilityStat}>
                    <Zap size={12} color="#ffffff" />
                    <Text style={styles.abilityStatText}>{ability.energy_cost}</Text>
                  </View>
                </View>
                <View style={styles.selectedOverlay}>
                  <Check size={24} color="#ffffff" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Available Abilities */}
      <Text style={styles.subsectionTitle}>Available Abilities</Text>
      <View style={styles.abilitiesGrid}>
        {abilities
          .filter((ability) => !selectedAbilities.some((a) => a.id === ability.id))
          .map((ability) => (
            <TouchableOpacity
              key={ability.id}
              style={[styles.abilityCard, { borderColor: getTypeColor(ability.type) }]}
              onPress={() => handleSelectAbility(ability)}
              disabled={selectedAbilities.length >= 4 && !selectedAbilities.some((a) => a.id === ability.id)}
            >
              <LinearGradient
                colors={[`${getTypeColor(ability.type)}20`, "rgba(0, 0, 0, 0)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.abilityHeader}>
                <View style={styles.abilityTypeContainer}>
                  {React.cloneElement(getElementIcon(ability.element), {
                    color: getElementColor(ability.element),
                  })}
                  <Text style={[styles.abilityType, { color: getTypeColor(ability.type) }]}>{ability.type}</Text>
                </View>
                <View style={[styles.elementBadge, { backgroundColor: `${getElementColor(ability.element)}20` }]}>
                  <Text style={[styles.elementText, { color: getElementColor(ability.element) }]}>
                    {ability.element}
                  </Text>
                </View>
              </View>
              <Text style={styles.abilityName}>{ability.name}</Text>
              <Text style={styles.abilityDescription} numberOfLines={2}>
                {ability.description}
              </Text>
              <View style={styles.abilityStats}>
                {ability.power > 0 && (
                  <View style={styles.abilityStat}>
                    <Sword size={12} color="#ffffff" />
                    <Text style={styles.abilityStatText}>{ability.power}</Text>
                  </View>
                )}
                <View style={styles.abilityStat}>
                  <Zap size={12} color="#ffffff" />
                  <Text style={styles.abilityStatText}>{ability.energy_cost}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
      </View>
    </View>
  )

  const renderDesignStep = () => (
    <View style={styles.designStep}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Beast Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a name for your beast"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={beastName}
          onChangeText={setBeastName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Custom Prompt</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your beast (e.g., 'a fierce fire dragon with golden scales')"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={customPrompt}
          onChangeText={setCustomPrompt}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.imagePreviewContainer}>
        <Text style={styles.label}>Beast Preview</Text>
        <View style={styles.imagePreview}>
          {generatedImageUrl ? (
            <Image source={{ uri: generatedImageUrl }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={styles.emptyPreview}>
              <Sparkles size={48} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.emptyPreviewText}>Generate your beast</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.generateButton, (isGenerating || remainingRequests <= 0) && styles.generateButtonDisabled]}
          onPress={generateBeastImage}
          disabled={isGenerating || remainingRequests <= 0 || !customPrompt}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <RefreshCw size={20} color="#ffffff" />
              <Text style={styles.generateButtonText}>{generatedImageUrl ? "Regenerate Beast" : "Generate Beast"}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.remainingText}>
          {remainingRequests} generation{remainingRequests !== 1 ? "s" : ""} remaining
        </Text>
      </View>

      {ipfsHash && (
        <View style={styles.ipfsContainer}>
          <Text style={styles.ipfsText}>Image uploaded to IPFS: {ipfsHash.substring(0, 10)}...</Text>
        </View>
      )}

      {!ipfsHash && generatedImageUrl && (
        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={handleUploadToIPFS}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Upload size={20} color="#ffffff" />
              <Text style={styles.uploadButtonText}>Upload to IPFS</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  )

  const renderStatsStep = () => (
    <View style={styles.statsStep}>
      <Text style={styles.statsTitle}>Allocate Stats</Text>
      <Text style={styles.statsSubtitle}>
        Total Points: {Object.values(stats).reduce((a, b) => a + b, 0)} /{" "}
        {selectedTier ? TIERS[selectedTier - 1].stats.maxPoints : 0}
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <View style={styles.statLabel}>
            <Sword size={20} color="#EF4444" />
            <Text style={styles.statText}>Attack</Text>
          </View>
          {renderStatBar(stats.attack, "#EF4444", 100)}
          <View style={styles.statControls}>
            <TouchableOpacity style={styles.statButton} onPress={() => handleStatChange("attack", -5)}>
              <Text style={styles.statButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.statValue}>{stats.attack}</Text>
            <TouchableOpacity style={styles.statButton} onPress={() => handleStatChange("attack", 5)}>
              <Text style={styles.statButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statLabel}>
            <Shield size={20} color="#3B82F6" />
            <Text style={styles.statText}>Defense</Text>
          </View>
          {renderStatBar(stats.defense, "#3B82F6", 100)}
          <View style={styles.statControls}>
            <TouchableOpacity style={styles.statButton} onPress={() => handleStatChange("defense", -5)}>
              <Text style={styles.statButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.statValue}>{stats.defense}</Text>
            <TouchableOpacity style={styles.statButton} onPress={() => handleStatChange("defense", 5)}>
              <Text style={styles.statButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statLabel}>
            <Zap size={20} color="#F59E0B" />
            <Text style={styles.statText}>Speed</Text>
          </View>
          {renderStatBar(stats.speed, "#F59E0B", 100)}
          <View style={styles.statControls}>
            <TouchableOpacity style={styles.statButton} onPress={() => handleStatChange("speed", -5)}>
              <Text style={styles.statButtonText}>-</Text>
              <Text style={styles.statButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.statValue}>{stats.speed}</Text>
            <TouchableOpacity style={styles.statButton} onPress={() => handleStatChange("speed", 5)}>
              <Text style={styles.statButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statLabel}>
            <Heart size={20} color="#10B981" />
            <Text style={styles.statText}>Health</Text>
          </View>
          {renderStatBar(stats.health, "#10B981", 100)}
          <View style={styles.statControls}>
            <TouchableOpacity style={styles.statButton} onPress={() => handleStatChange("health", -5)}>
              <Text style={styles.statButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.statValue}>{stats.health}</Text>
            <TouchableOpacity style={styles.statButton} onPress={() => handleStatChange("health", 5)}>
              <Text style={styles.statButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )

  const renderPreviewStep = () => (
    <View style={styles.previewStep}>
      <Text style={styles.previewTitle}>Beast Preview</Text>

      <View style={styles.previewCard}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={[`${selectedTier ? TIERS[selectedTier - 1].color : "#7C3AED"}20`, "rgba(0, 0, 0, 0)"]}
            style={StyleSheet.absoluteFill}
          />
        </BlurView>

        <View style={styles.previewHeader}>
          <Text style={styles.previewBeastName}>{beastName}</Text>
          <View
            style={[styles.tierBadge, { backgroundColor: selectedTier ? TIERS[selectedTier - 1].color : "#7C3AED" }]}
          >
            <Text style={styles.tierBadgeText}>Tier {selectedTier}</Text>
          </View>
        </View>

        <View style={styles.previewImageContainer}>
          <Image source={{ uri: generatedImageUrl }} style={styles.previewBeastImage} resizeMode="contain" />
        </View>

        <View style={styles.previewStatsContainer}>
          <Text style={styles.previewSectionTitle}>Stats</Text>
          <View style={styles.previewStatsGrid}>
            <View style={styles.previewStatItem}>
              <Sword size={16} color="#EF4444" />
              <Text style={styles.previewStatLabel}>Attack</Text>
              <Text style={styles.previewStatValue}>{stats.attack}</Text>
            </View>
            <View style={styles.previewStatItem}>
              <Shield size={16} color="#3B82F6" />
              <Text style={styles.previewStatLabel}>Defense</Text>
              <Text style={styles.previewStatValue}>{stats.defense}</Text>
            </View>
            <View style={styles.previewStatItem}>
              <Zap size={16} color="#F59E0B" />
              <Text style={styles.previewStatLabel}>Speed</Text>
              <Text style={styles.previewStatValue}>{stats.speed}</Text>
            </View>
            <View style={styles.previewStatItem}>
              <Heart size={16} color="#10B981" />
              <Text style={styles.previewStatLabel}>Health</Text>
              <Text style={styles.previewStatValue}>{stats.health}</Text>
            </View>
          </View>
        </View>

        <View style={styles.previewAbilitiesContainer}>
          <Text style={styles.previewSectionTitle}>Abilities</Text>
          <View style={styles.previewAbilitiesGrid}>
            {selectedAbilities.map((ability) => (
              <View key={ability.id} style={[styles.previewAbilityItem, { borderColor: getTypeColor(ability.type) }]}>
                <View style={styles.previewAbilityHeader}>
                  {React.cloneElement(getElementIcon(ability.element), {
                    color: getElementColor(ability.element),
                  })}
                  <Text style={styles.previewAbilityName}>{ability.name}</Text>
                </View>
                <Text style={styles.previewAbilityType}>
                  {ability.type} • {ability.element}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.createButton, isCreatingAsset && styles.createButtonDisabled]}
        onPress={createBeast}
        disabled={isCreatingAsset}
      >
        {isCreatingAsset ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.createButtonText}>Create Beast NFT</Text>
        )}
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Beast</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Error Message */}
        {error && (
          <Animated.View entering={FadeIn} style={styles.errorContainer}>
            <BlurView intensity={40} tint="dark" style={styles.errorContent}>
              <LinearGradient colors={["rgba(239, 68, 68, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
              <X size={20} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </BlurView>
          </Animated.View>
        )}

        {/* Progress Steps */}
        <View style={styles.progressSteps}>
          <View style={[styles.progressStep, step === "tier" && styles.progressStepActive]}>
            <Crown size={20} color={step === "tier" ? "#7C3AED" : "#ffffff"} />
            <Text style={[styles.progressText, step === "tier" && styles.progressTextActive]}>Tier</Text>
          </View>
          <View style={[styles.progressStep, step === "abilities" && styles.progressStepActive]}>
            <Sparkles size={20} color={step === "abilities" ? "#7C3AED" : "#ffffff"} />
            <Text style={[styles.progressText, step === "abilities" && styles.progressTextActive]}>Abilities</Text>
          </View>
          <View style={[styles.progressStep, step === "design" && styles.progressStepActive]}>
            <Sparkles size={20} color={step === "design" ? "#7C3AED" : "#ffffff"} />
            <Text style={[styles.progressText, step === "design" && styles.progressTextActive]}>Design</Text>
          </View>
          <View style={[styles.progressStep, step === "stats" && styles.progressStepActive]}>
            <Shield size={20} color={step === "stats" ? "#7C3AED" : "#ffffff"} />
            <Text style={[styles.progressText, step === "stats" && styles.progressTextActive]}>Stats</Text>
          </View>
          <View style={[styles.progressStep, step === "preview" && styles.progressStepActive]}>
            <Check size={20} color={step === "preview" ? "#7C3AED" : "#ffffff"} />
            <Text style={[styles.progressText, step === "preview" && styles.progressTextActive]}>Create</Text>
          </View>
        </View>

        {/* Step Content */}
        {step === "tier" && renderTierSelection()}
        {step === "abilities" && renderAbilitiesSelection()}
        {step === "design" && renderDesignStep()}
        {step === "stats" && renderStatsStep()}
        {step === "preview" && renderPreviewStep()}

        {/* Navigation Buttons */}
        <View style={styles.navigation}>
          {step !== "tier" && (
            <TouchableOpacity
              style={styles.backStepButton}
              onPress={() => {
                switch (step) {
                  case "abilities":
                    setStep("tier")
                    break
                  case "design":
                    setStep("abilities")
                    break
                  case "stats":
                    setStep("design")
                    break
                  case "preview":
                    setStep("stats")
                    break
                }
              }}
            >
              <Text style={styles.backStepButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {step !== "preview" && (
            <TouchableOpacity
              style={[
                styles.nextStepButton,
                ((step === "tier" && !selectedTier) ||
                  (step === "abilities" && selectedAbilities.length !== 4) ||
                  (step === "design" && (!generatedImageUrl || !beastName))) &&
                  styles.nextStepButtonDisabled,
              ]}
              onPress={() => {
                switch (step) {
                  case "tier":
                    setStep("abilities")
                    break
                  case "abilities":
                    setStep("design")
                    break
                  case "design":
                    setStep("stats")
                    break
                  case "stats":
                    setStep("preview")
                    break
                }
              }}
              disabled={
                (step === "tier" && !selectedTier) ||
                (step === "abilities" && selectedAbilities.length !== 4) ||
                (step === "design" && (!generatedImageUrl || !beastName))
              }
            >
              <Text style={styles.nextStepButtonText}>Next Step</Text>
              <ChevronRight size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    alignItems: "center",
    padding: 16,
    paddingTop: 20,
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    gap: 8,
  },
  errorText: {
    color: "#ffffff",
    fontSize: 14,
    flex: 1,
  },
  progressSteps: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  progressStep: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    marginHorizontal: 2,
  },
  progressStepActive: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
  },
  progressText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  progressTextActive: {
    color: "#7C3AED",
    fontWeight: "600",
  },
  tierSelection: {
    gap: 16,
  },
  tierCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  tierCardSelected: {
    borderColor: "#7C3AED",
  },
  tierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
  },
  tierInfo: {
    padding: 16,
    paddingTop: 0,
  },
  tierName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  tierDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
  },
  tierCost: {
    alignSelf: "flex-start",
    marginLeft: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierCostText: {
    fontSize: 14,
    fontWeight: "600",
  },
  abilitiesContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  selectedAbilitiesContainer: {
    marginBottom: 24,
  },
  selectedAbilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  abilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  abilityCard: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    position: "relative",
    overflow: "hidden",
  },
  abilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  abilityTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  abilityType: {
    fontSize: 12,
    fontWeight: "600",
  },
  elementBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  elementText: {
    fontSize: 10,
    fontWeight: "600",
  },
  abilityName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  abilityDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 8,
    height: 32,
  },
  abilityStats: {
    flexDirection: "row",
    gap: 12,
  },
  abilityStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  abilityStatText: {
    fontSize: 12,
    color: "#ffffff",
  },
  selectedOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "rgba(124, 58, 237, 0.8)",
    borderBottomLeftRadius: 12,
    padding: 4,
  },
  designStep: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    color: "#ffffff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  imagePreviewContainer: {
    gap: 8,
  },
  imagePreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
    marginBottom: 16,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  emptyPreview: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPreviewText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
    marginTop: 16,
  },
  generateButton: {
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  remainingText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  ipfsContainer: {
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  ipfsText: {
    color: "#ffffff",
    fontSize: 14,
  },
  uploadButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  statsStep: {
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  statsSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 24,
  },
  statsContainer: {
    gap: 16,
  },
  statRow: {
    gap: 12,
  },
  statLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  statBarContainer: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  statControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  statValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    width: 32,
    textAlign: "center",
  },
  previewStep: {
    gap: 16,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    padding: 16,
    gap: 16,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewBeastName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  previewImageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  previewBeastImage: {
    width: "100%",
    height: "100%",
  },
  previewStatsContainer: {
    gap: 12,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  previewStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  previewStatItem: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewStatLabel: {
    color: "#ffffff",
    fontSize: 14,
    flex: 1,
  },
  previewStatValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  previewAbilitiesContainer: {
    gap: 12,
  },
  previewAbilitiesGrid: {
    gap: 8,
  },
  previewAbilityItem: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
  },
  previewAbilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  previewAbilityName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  previewAbilityType: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  createButton: {
    backgroundColor: "#10B981",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  navigation: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  backStepButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  backStepButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  nextStepButton: {
    flex: 2,
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextStepButtonDisabled: {
    opacity: 0.5,
  },
  nextStepButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})

