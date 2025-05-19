
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Swords, Check, Trophy } from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { supabase } from "@/lib/supabase"
import algosdk from "algosdk"

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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#111",
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  requestCard: {
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardContent: {
    padding: 16,
    borderRadius: 16,
  },
  beastItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  selectedBeastItem: {
    backgroundColor: "#444",
  },
  beastImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  beastInfo: {
    marginLeft: 16,
  },
  beastName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  beastElement: {
    color: "#aaa",
    fontSize: 14,
  },
  powerBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  powerText: {
    color: "#fff",
    marginLeft: 4,
  },
  selectedCheckmark: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  selectBeastSection: {
    margin: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  beastList: {
    backgroundColor: "#111",
  },
  challengerBeast: {
    marginTop: 16,
  },
  challengerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  beastPreview: {
    flexDirection: "row",
    alignItems: "center",
  },
  challengerBeastImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  challengerBeastInfo: {
    marginLeft: 16,
  },
  challengerBeastName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  challengerBeastElement: {
    color: "#aaa",
    fontSize: 14,
  },
  challengerPowerBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  challengerPowerText: {
    color: "#fff",
    marginLeft: 4,
  },
})

interface Beast {
  id: number
  name: string
  power: number
  element: string
  image: string
  owner_id: string
}

export default function ConfirmBattleScreen() {
  const { sender } = useLocalSearchParams()
  const [userBeasts, setUserBeasts] = useState<Beast[]>([])
  const [selectedBeast, setSelectedBeast] = useState<Beast | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [senderName, setSenderName] = useState<string>("Unknown Player")
  const [senderBeast, setSenderBeast] = useState<any>(null)

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      try {
        // Load wallet address
        await loadWalletAddress()

        // Fetch user beasts
        await fetchUserBeasts()

        // Fetch sender info if we have a sender wallet address
        if (sender) {
          await fetchSenderInfo(sender as string)
        }
      } catch (error) {
        console.error("Error initializing confirm screen:", error)
        Alert.alert("Error", "Failed to load battle information")
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [sender])

  const loadWalletAddress = async () => {
    try {
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (mnemonic) {
        const account = algosdk.mnemonicToSecretKey(mnemonic)
        const address = account.addr.toString()
        setWalletAddress(address)
        console.log("Wallet address loaded:", address)
      } else {
        console.log("No mnemonic found in secure storage")
      }
    } catch (error) {
      console.error("Error loading wallet address:", error)
    }
  }

  const fetchUserBeasts = async () => {
    try {
      // Get user ID from secure storage
      const userId = await SecureStore.getItemAsync("userId")
      if (!userId) {
        console.log("No user ID found")
        return
      }

      // Get beasts owned by user
      const { data: beastsData, error: beastsError } = await supabase
        .from("beasts")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })

      if (beastsError) {
        console.error("Error fetching beasts:", beastsError)
        return
      }

      if (beastsData && beastsData.length > 0) {
        console.log(`Found ${beastsData.length} beasts for user`)
        setUserBeasts(beastsData)
        setSelectedBeast(beastsData[0]) // Select first beast by default
      } else {
        console.log("No beasts found for user")
        setUserBeasts([])
      }
    } catch (error) {
      console.error("Error fetching user beasts:", error)
    }
  }

  const fetchSenderInfo = async (senderWalletAddress: string) => {
    try {
      // Fetch sender's user info from database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, username")
        .eq("wallet_address", senderWalletAddress)
        .single()

      if (userError) {
        console.error("Error fetching sender info:", userError)
        return
      }

      if (userData) {
        setSenderName(userData.username || "Player")

        // Fetch sender's selected beast
        const { data: beastData, error: beastError } = await supabase
          .from("beasts")
          .select("*")
          .eq("owner_id", userData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (beastError) {
          console.error("Error fetching sender beast:", beastError)
        } else if (beastData) {
          setSenderBeast(beastData)
        }
      }
    } catch (error) {
      console.error("Error fetching sender info:", error)
    }
  }

  const handleSelectBeast = (beast: Beast) => {
    setSelectedBeast(beast)
  }

  const handleAccept = () => {
    if (!selectedBeast) {
      Alert.alert("Select Beast", "Please select a beast for battle")
      return
    }

    // Store selected beast ID in secure storage for battle arena
    SecureStore.setItemAsync("selectedBeastId", selectedBeast.id.toString())
      .then(() => {
        // Navigate to battle arena
        router.push("/battle-arena")
      })
      .catch((error) => {
        console.error("Error saving selected beast:", error)
        Alert.alert("Error", "Failed to prepare for battle")
      })
  }

  const handleDecline = () => {
    Alert.alert("Decline Battle", "Are you sure you want to decline this battle request?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Decline",
        style: "destructive",
        onPress: () => router.back(),
      },
    ])
  }

  const renderBeastItem = ({ item }: { item: Beast }) => (
    <TouchableOpacity
      style={[styles.beastItem, selectedBeast?.id === item.id && styles.selectedBeastItem]}
      onPress={() => handleSelectBeast(item)}
    >
      <Image source={{ uri: item.image || "/placeholder.svg?height=100&width=100" }} style={styles.beastImage} />
      <View style={styles.beastInfo}>
        <Text style={styles.beastName}>{item.name}</Text>
        <Text style={styles.beastElement}>{item.element} Element</Text>
        <View style={styles.powerBadge}>
          <Swords size={12} color="#EF4444" />
          <Text style={styles.powerText}>{item.power} Power</Text>
        </View>
      </View>
      {selectedBeast?.id === item.id && (
        <View style={styles.selectedCheckmark}>
          <Check size={16} color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading battle information...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Battle Request</Text>
      </View>

      {/* Battle Request Card */}
      <Animated.View entering={FadeIn} style={styles.requestCard}>
        <BlurView intensity={40} tint="dark" style={styles.cardContent}>
          <LinearGradient colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
          <Trophy size={32} color="#F59E0B" />
          <Text style={styles.requestTitle}>Battle Challenge</Text>
          <Text style={styles.requestText}>{senderName} has challenged you to a battle!</Text>

          {/* Challenger Beast Info */}
          {senderBeast && (
            <View style={styles.challengerBeast}>
              <Text style={styles.challengerTitle}>Challenger's Beast</Text>
              <View style={styles.beastPreview}>
                <Image
                  source={{ uri: senderBeast.image || "/placeholder.svg?height=80&width=80" }}
                  style={styles.challengerBeastImage}
                />
                <View style={styles.challengerBeastInfo}>
                  <Text style={styles.challengerBeastName}>{senderBeast.name}</Text>
                  <Text style={styles.challengerBeastElement}>{senderBeast.element} Element</Text>
                  <View style={styles.challengerPowerBadge}>
                    <Swords size={12} color="#EF4444" />
                    <Text style={styles.challengerPowerText}>{senderBeast.power} Power</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </BlurView>
      </Animated.View>

      {/* Select Your Beast Section */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.selectBeastSection}>
        <Text style={styles.sectionTitle}>Select Your Beast</Text>

        {userBeasts.length > 0 ? (
          <FlatList
            data={userBeasts}
            renderItem={renderBeastItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.beastList}
          />
        ) : (
          <Text style={styles.beastName}>No beasts found</Text>
        )}
      </Animated.View>
    </SafeAreaView>
  )
}
