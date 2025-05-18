"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated as RNAnimated,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps"
import {
  Navigation,
  Trophy,
  Clock,
  MapPin,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Award,
  Coins,
  ExternalLink,
} from "lucide-react-native"
import * as Location from "expo-location"
import { getDistance } from "geolib"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated"
import { router, useLocalSearchParams } from "expo-router"
import { supabase } from "@/lib/supabase"
import { isMockingLocation, MockLocationDetectorErrorCode } from "react-native-turbo-mock-location-detector"
import treasureChest from "@/assets/icons/treasure_chest.png"
import * as SecureStore from "expo-secure-store"
import algosdk from "algosdk"

const { width, height } = Dimensions.get("window")
const GEOFENCE_RADIUS = 50 // 50 meters radius

const northEast = { latitude: 17.49617, longitude: 78.39486 }
const southWest = { latitude: 17.490222, longitude: 78.386944 }
const maxLatitudeDelta = 0.008
const maxLongitudeDelta = 0.008

interface Quest {
  quest_id: string
  quest_name: string
  description: string
  rewards: {
    tokens: number
    nft: {
      name: string
    } | null
  }
  quest_status: "completed" | "upcoming" | "ongoing"
  latitude: number
  longitude: number
  expiry_date: string
  distance?: number
  timeRemaining?: string
  application_id?: number
}

interface ApplicationDetails {
  rewardAssetId?: number
  winners: {
    winner1: string
    winner2: string
    winner3: string
  }
  expiryDate?: number
  questTitle?: string
  questLocation?: string
}

// Custom map style
const MAP_STYLE = [
  {
    featureType: "all",
    elementType: "all",
    stylers: [
      {
        invert_lightness: true,
      },
      {
        saturation: "-9",
      },
      {
        lightness: "0",
      },
      {
        visibility: "simplified",
      },
    ],
  },
  {
    featureType: "landscape.man_made",
    elementType: "all",
    stylers: [
      {
        weight: "1.00",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "all",
    stylers: [
      {
        weight: "0.49",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "labels",
    stylers: [
      {
        visibility: "on",
      },
      {
        weight: "0.01",
      },
      {
        lightness: "-7",
      },
      {
        saturation: "-35",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text",
    stylers: [
      {
        visibility: "on",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.stroke",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "on",
      },
    ],
  },
]

export default function QMapScreen() {
  const { quest_id } = useLocalSearchParams()
  const [quest, setQuest] = useState<Quest | null>(null)
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isWithinGeofence, setIsWithinGeofence] = useState(false)
  const [distance, setDistance] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isOptedIn, setIsOptedIn] = useState(false)
  const [optInLoading, setOptInLoading] = useState(false)
  const [appDetails, setAppDetails] = useState<ApplicationDetails | null>(null)
  const [isLoadingAppDetails, setIsLoadingAppDetails] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isWinner, setIsWinner] = useState<boolean>(false)
  const [claimLoading, setClaimLoading] = useState(false)
  const mapRef = useRef<MapView>(null)
  const [isMockLocation, setIsMockLocation] = useState(false)

  // Default region
  const [region, setRegion] = useState({
    latitude: 17.493504,
    longitude: 78.391198,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  })

  // Animation values - Increased default height to ensure buttons are visible
  const bottomSheetHeight = useSharedValue(400)
  const expandIconRotation = useSharedValue(180)
  const pulseAnim = useRef(new RNAnimated.Value(1)).current

  useEffect(() => {
    fetchQuest()
    setupLocation()
    setupAnimations()
    loadWalletAddress()
  }, [])

  // Load wallet address from secure storage
  const loadWalletAddress = async () => {
    try {
      const address = await SecureStore.getItemAsync("walletAddress")
      if (address) {
        setWalletAddress(address)
      }
    } catch (error) {
      console.error("Error loading wallet address:", error)
    }
  }

  // Fetch quest details from Supabase
  const fetchQuest = async () => {
    if (!quest_id) return

    try {
      // Get quest details including application_id
      const { data, error } = await supabase.from("quests").select("*").eq("quest_id", quest_id).single()

      if (error) throw error
      if (data) {
        setQuest(data)

        // Center map on quest location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: data.latitude,
            longitude: data.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          })
        }

        // If we have an application_id, fetch application details
        if (data.application_id) {
          fetchApplicationDetails(data.application_id)
        }
      }
    } catch (err) {
      console.error("Error fetching quest:", err)
      setErrorMsg("Failed to load quest details")
    }
  }

  // Fetch application details from Algorand indexer
  const fetchApplicationDetails = async (appId: number) => {
    setIsLoadingAppDetails(true)
    try {
      // Fetch application details from Algorand indexer
      const response = await fetch(`https://testnet-idx.4160.nodely.dev/v2/applications/${appId}`)
      const data = await response.json()

      if (data && data.application && data.application.params && data.application.params["global-state"]) {
        const globalState = data.application.params["global-state"]

        // Extract reward asset ID
        const rewardKey = globalState.find((item) => item.key === "cmV3YXJkMQ==")
        const rewardAssetId = rewardKey?.value?.uint

        // Extract winners
        const winner1Key = globalState.find((item) => item.key === "d2lubmVyMQ==")
        const winner2Key = globalState.find((item) => item.key === "d2lubmVyMg==")
        const winner3Key = globalState.find((item) => item.key === "d2lubmVyMw==")

        // Extract other details
        const expiryDateKey = globalState.find((item) => item.key === "ZXhwaXJ5RGF0ZQ==")
        const questTitleKey = globalState.find((item) => item.key === "cXVlc3RUaXRsZQ==")
        const questLocationKey = globalState.find((item) => item.key === "cXVlc3RMb2NhdGlvbg==")

        // Create application details object
        const details: ApplicationDetails = {
          rewardAssetId: rewardAssetId,
          winners: {
            winner1: winner1Key?.value?.bytes || "",
            winner2: winner2Key?.value?.bytes || "",
            winner3: winner3Key?.value?.bytes || "",
          },
          expiryDate: expiryDateKey?.value?.uint,
          questTitle: questTitleKey?.value?.bytes,
          questLocation: questLocationKey?.value?.bytes,
        }

        setAppDetails(details)

        // Check if current user is a winner
        if (walletAddress) {
          // This is a simplified check - in reality you'd need to decode the base64 address
          const isUserWinner =
            (winner1Key?.value?.bytes !== "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" &&
              winner1Key?.value?.bytes.includes(walletAddress.substring(0, 8))) ||
            (winner2Key?.value?.bytes !== "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" &&
              winner2Key?.value?.bytes.includes(walletAddress.substring(0, 8))) ||
            (winner3Key?.value?.bytes !== "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" &&
              winner3Key?.value?.bytes.includes(walletAddress.substring(0, 8)))

          setIsWinner(isUserWinner)
        }

        // If we have a reward asset ID, check if user has opted in
        if (rewardAssetId && walletAddress) {
          checkAssetOptIn(rewardAssetId, walletAddress)
        }
      }
    } catch (error) {
      console.error("Error fetching application details:", error)
      setErrorMsg("Failed to load quest rewards")
    } finally {
      setIsLoadingAppDetails(false)
    }
  }

  // Check if user has opted in to the reward asset
  const checkAssetOptIn = async (assetId: number, address: string) => {
    try {
      const indexer = new algosdk.Indexer("", "https://testnet-idx.algonode.cloud", "")
      const accountInfo = await indexer.lookupAccountAssets(address).assetId(assetId).do()

      // If the asset is in the account's assets, they've opted in
      setIsOptedIn(accountInfo.assets && accountInfo.assets.length > 0)
    } catch (error) {
      console.error("Error checking asset opt-in:", error)
      setIsOptedIn(false)
    }
  }

  const setupAnimations = () => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }

  // Update location watching configuration for more frequent updates
  const setupLocation = async () => {
    try {
      // Check for mock location first
      const { isLocationMocked } = await isMockingLocation()
      setIsMockLocation(isLocationMocked)
      if (isLocationMocked) {
        setErrorMsg("Mock location detected. Please disable mock location to participate in quests.")
        return
      }

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied")
        return
      }

      // Get initial location with high accuracy
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      })
      setLocation(initialLocation)

      // If we have quest data, update distance
      if (quest && initialLocation) {
        updateDistance(initialLocation)
      }

      // Watch location with more frequent updates and higher accuracy
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 500, // Update every 500ms
          distanceInterval: 0.5, // Update every 0.5 meters
        },
        (newLocation) => {
          setLocation(newLocation)
          if (quest) {
            updateDistance(newLocation)
          }
        },
      )

      // Clean up subscription when component unmounts
      return () => {
        locationSubscription.remove()
      }
    } catch (error: any) {
      // Error handling remains the same
      if (error?.code) {
        switch (error.code) {
          case MockLocationDetectorErrorCode.GPSNotEnabled:
            setErrorMsg("Please enable GPS to participate in quests")
            break
          case MockLocationDetectorErrorCode.NoLocationPermissionEnabled:
            setErrorMsg("Location permission required to participate in quests")
            break
          case MockLocationDetectorErrorCode.CantDetermine:
            console.warn("Could not determine if location is mocked")
            break
          default:
            console.error("Error setting up location:", error)
            setErrorMsg("Failed to setup location services")
        }
      } else {
        console.error("Error setting up location:", error)
        setErrorMsg("Failed to setup location services")
      }
    }
  }

  // Update the distance between user and quest location
  const updateDistance = (userLocation: Location.LocationObject) => {
    if (!quest) return

    // Use quest location from the database
    const questLocation = {
      latitude: quest.latitude,
      longitude: quest.longitude,
    }

    const newDistance = getDistance(
      {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      },
      questLocation,
    )

    setDistance(newDistance)

    // Update geofence status whenever distance is updated
    const withinGeofence = newDistance <= GEOFENCE_RADIUS
    setIsWithinGeofence(withinGeofence)
  }

  const getStatusColor = (status: Quest["quest_status"]) => {
    switch (status) {
      case "completed":
        return "#4ADE80"
      case "ongoing":
        return "#7C3AED"
      case "upcoming":
        return "#94A3B8"
      default:
        return "#94A3B8"
    }
  }

  const toggleExpand = () => {
    const newValue = !isExpanded
    setIsExpanded(newValue)
    // Adjust height to ensure buttons are visible even when collapsed
    bottomSheetHeight.value = withSpring(newValue ? 400 : 200, { damping: 15 })
    expandIconRotation.value = withTiming(newValue ? 180 : 0, { duration: 300 })
  }

  // Handle opt-in to the reward asset
  const handleOptIn = async () => {
    if (!appDetails?.rewardAssetId) {
      Alert.alert("Error", "No asset ID found for this quest")
      return
    }

    try {
      setOptInLoading(true)
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (!mnemonic) {
        Alert.alert("Error", "No mnemonic found")
        return
      }

      const account = algosdk.mnemonicToSecretKey(mnemonic)
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")

      const suggestedParams = await algodClient.getTransactionParams().do()
      const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account.addr,
        receiver: account.addr,
        assetIndex: Number(appDetails.rewardAssetId),
        amount: 0,
        suggestedParams,
      })

      const signedTxn = optInTxn.signTxn(account.sk)
      const { txid } = await algodClient.sendRawTransaction(signedTxn).do()

      await algosdk.waitForConfirmation(algodClient, txid, 4)

      Alert.alert("Success", "Successfully opted in to Quest Coins!")
      setIsOptedIn(true)
    } catch (error) {
      console.error("Error opting in:", error)
      Alert.alert("Error", "Failed to opt in to Quest Coins")
    } finally {
      setOptInLoading(false)
    }
  }

  const animatedBottomSheetStyle = useAnimatedStyle(() => {
    return {
      height: bottomSheetHeight.value,
    }
  })

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${expandIconRotation.value}deg` }],
    }
  })

  const formatDistance = (meters: number | null) => {
    if (meters === null) return "Calculating..."
    if (meters < 1000) return `${meters.toFixed(0)} m`
    return `${(meters / 1000).toFixed(1)} km`
  }

  const getTimeRemaining = (expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diff = expiry.getTime() - now.getTime()

    if (diff <= 0) {
      return "Quest expired"
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  // Focus on quest location
  const focusOnQuest = () => {
    if (!quest) return

    // Expand the bottom sheet if it's not already expanded
    if (!isExpanded) {
      toggleExpand()
    }

    // Animate to the quest location with respect to zoom limits
    mapRef.current?.animateToRegion({
      latitude: quest.latitude,
      longitude: quest.longitude,
      latitudeDelta: Math.min(0.005, maxLatitudeDelta),
      longitudeDelta: Math.min(0.005, maxLongitudeDelta),
    })
  }

  // Handle claim reward
  const handleClaimReward = async () => {
    if (!location || !quest) {
      Alert.alert(
        "Location Error",
        "Unable to determine your location. Please ensure location services are enabled.",
        [{ text: "OK", style: "cancel" }],
        { cancelable: true },
      )
      return
    }

    try {
      setClaimLoading(true)

      // Check mock location
      const { isLocationMocked } = await isMockingLocation()
      if (isLocationMocked) {
        Alert.alert(
          "⚠️ Mock Location Detected",
          "Please disable mock location services to participate in quests.",
          [{ text: "OK", style: "cancel" }],
          { cancelable: true },
        )
        return
      }

      // Calculate distance on demand
      const currentDistance = getDistance(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        {
          latitude: quest.latitude,
          longitude: quest.longitude,
        },
      )

      // Update state variables
      setDistance(currentDistance)
      const withinGeofence = currentDistance <= GEOFENCE_RADIUS
      setIsWithinGeofence(withinGeofence)

      if (withinGeofence) {
        // Here you would implement the actual claim logic
        // For now, just show success message
        Alert.alert(
          "🎉 Quest Complete!",
          `Congratulations! You've earned:\n\n• ${quest.rewards.tokens} $CAMP tokens${quest.rewards.nft ? `\n• ${quest.rewards.nft.name}` : ""}`,
          [
            {
              text: "Claim Rewards",
              style: "default",
              onPress: () => {
                // Here you would typically call your API to process the reward
                Alert.alert("💫 Success", "Your rewards have been credited to your wallet!", [{ text: "OK" }], {
                  cancelable: false,
                })
              },
            },
            { text: "Cancel", style: "cancel" },
          ],
          { cancelable: true },
        )
      } else {
        Alert.alert(
          "📍 Too Far",
          `Get closer to the quest location!\n\nYou're ${currentDistance.toFixed(0)}m away.\nNeed to be within ${GEOFENCE_RADIUS}m to claim.`,
          [
            {
              text: "Navigate",
              onPress: () => {
                mapRef.current?.animateToRegion({
                  latitude: quest.latitude,
                  longitude: quest.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                })
              },
            },
            { text: "OK", style: "cancel" },
          ],
          { cancelable: true },
        )
      }
    } catch (error) {
      Alert.alert("❌ Error", "Failed to verify location. Please try again.", [{ text: "OK", style: "cancel" }], {
        cancelable: true,
      })
    } finally {
      setClaimLoading(false)
    }
  }

  // Render loading state
  if (!quest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading quest details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE}
        minZoomLevel={17}
        maxZoomLevel={20}
        mapPadding={{ top: 20, right: 20, bottom: 20, left: 20 }}
        onRegionChangeComplete={(newRegion) => {
          // Enforce boundaries
          const restrictedRegion = { ...newRegion }
          let needsAdjustment = false

          // Restrict latitude
          if (newRegion.latitude > northEast.latitude) {
            restrictedRegion.latitude = northEast.latitude
            needsAdjustment = true
          } else if (newRegion.latitude < southWest.latitude) {
            restrictedRegion.latitude = southWest.latitude
            needsAdjustment = true
          }

          // Restrict longitude
          if (newRegion.longitude > northEast.longitude) {
            restrictedRegion.longitude = northEast.longitude
            needsAdjustment = true
          } else if (newRegion.longitude < southWest.longitude) {
            restrictedRegion.longitude = southWest.longitude
            needsAdjustment = true
          }

          // Strictly enforce zoom level
          if (newRegion.latitudeDelta > maxLatitudeDelta) {
            restrictedRegion.latitudeDelta = maxLatitudeDelta
            restrictedRegion.longitudeDelta = maxLongitudeDelta
            needsAdjustment = true
          }

          // Apply restrictions if needed
          if (needsAdjustment) {
            mapRef.current?.animateToRegion(restrictedRegion, 100)
          }
        }}
      >
        {/* Geofence Circle */}
        <Circle
          center={{
            latitude: quest.latitude,
            longitude: quest.longitude,
          }}
          radius={GEOFENCE_RADIUS}
          fillColor="rgba(124, 58, 237, 0.2)"
          strokeColor="rgba(124, 58, 237, 0.5)"
          strokeWidth={2}
        />

        {/* Quest Marker */}
        <Marker
          coordinate={{
            latitude: quest.latitude,
            longitude: quest.longitude,
          }}
          onPress={focusOnQuest}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <Image source={treasureChest} style={{ width: 30, height: 30 }} resizeMode="contain" />
        </Marker>
      </MapView>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <View style={styles.backButtonContent}>
          <LinearGradient colors={["#1F1F1F", "#000000"]} style={StyleSheet.absoluteFill} />
          <ArrowLeft size={24} color="#ffffff" />
        </View>
      </TouchableOpacity>

      {/* Location Error Message */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <LinearGradient colors={["#EF4444", "#B91C1C"]} style={StyleSheet.absoluteFill} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Center on User Button */}
      {location && (
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => {
            mapRef.current?.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: Math.min(0.005, maxLatitudeDelta),
              longitudeDelta: Math.min(0.005, maxLongitudeDelta),
            })
          }}
        >
          <View style={styles.centerButtonContent}>
            <LinearGradient colors={["#1F1F1F", "#000000"]} style={StyleSheet.absoluteFill} />
            <Navigation size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Bottom Quest Info Box - REDESIGNED */}
      <Animated.View style={[styles.bottomSheet, animatedBottomSheetStyle]}>
        <View style={styles.bottomSheetContent}>
          <LinearGradient
            colors={["rgba(20, 20, 30, 0.95)", "rgba(10, 10, 15, 0.98)"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Handle for expanding/collapsing */}
          <TouchableOpacity style={styles.handleContainer} onPress={toggleExpand}>
            <View style={styles.handle} />
            <Animated.View style={animatedIconStyle}>
              {isExpanded ? <ChevronDown size={20} color="#ffffff" /> : <ChevronUp size={20} color="#ffffff" />}
            </Animated.View>
          </TouchableOpacity>

          {/* Quest Header */}
          <View style={styles.questHeader}>
            <View style={styles.questTitleRow}>
              <Text style={styles.questTitle} numberOfLines={1}>
                {quest.quest_name}
              </Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>

            {/* Quest Meta Info */}
            <View style={styles.questMetaRow}>
              <View style={styles.metaItem}>
                <MapPin size={16} color="#94A3B8" />
                <Text style={styles.metaText}>{formatDistance(distance)}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Clock size={16} color="#94A3B8" />
                <Text style={styles.metaText}>{getTimeRemaining(quest.expiry_date)}</Text>
              </View>
            </View>
          </View>

          {/* Quest Description - Only show if expanded */}
          {isExpanded && (
            <View style={styles.questContent}>
              <Text style={styles.questDescription} numberOfLines={2}>
                {quest.description}
              </Text>

              {/* Rewards Card */}
              <View style={styles.rewardsCard}>
                <View style={styles.rewardsHeader}>
                  <Trophy size={18} color="#F59E0B" />
                  <Text style={styles.rewardsTitle}>Rewards</Text>
                </View>

                <View style={styles.rewardItem}>
                  <Coins size={16} color="#7C3AED" />
                  <Text style={styles.rewardValue}>{quest.rewards.tokens} $CAMP</Text>
                </View>

                {quest.rewards.nft && (
                  <View style={styles.rewardItem}>
                    <Award size={16} color="#7C3AED" />
                    <Text style={styles.rewardValue}>{quest.rewards.nft.name}</Text>
                  </View>
                )}

                {appDetails?.rewardAssetId && (
                  <TouchableOpacity
                    style={styles.assetIdRow}
                    onPress={() => Linking.openURL(`https://testnet.algoexplorer.io/asset/${appDetails.rewardAssetId}`)}
                  >
                    <Text style={styles.assetIdLabel}>Asset ID: </Text>
                    <Text style={styles.assetIdValue}>{appDetails.rewardAssetId}</Text>
                    <ExternalLink size={14} color="#7C3AED" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons - ALWAYS VISIBLE */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.optInButton,
                optInLoading && styles.loadingButton,
                (!appDetails?.rewardAssetId || isOptedIn) && styles.disabledButton,
              ]}
              onPress={handleOptIn}
              disabled={optInLoading || !appDetails?.rewardAssetId || isOptedIn}
            >
              {optInLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Award size={18} color="#ffffff" />
                  <Text style={styles.buttonText}>OPT-IN</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.claimButton,
                claimLoading && styles.loadingButton,
                (isWinner || (appDetails?.rewardAssetId && !isOptedIn)) && styles.disabledButton,
              ]}
              disabled={isWinner || claimLoading || (appDetails?.rewardAssetId && !isOptedIn)}
              onPress={handleClaimReward}
            >
              {claimLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Trophy size={18} color="#ffffff" />
                  <Text style={styles.buttonText}>{isWinner ? "CLAIMED" : "CLAIM REWARD"}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
  },
  backButtonContent: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  errorContainer: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EF4444",
    overflow: "hidden",
  },
  errorText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  centerButton: {
    position: "absolute",
    bottom: 140,
    right: 16,
  },
  centerButtonContent: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#ffffff",
  },

  // Bottom Sheet Styles - REDESIGNED
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 16,
  },
  handleContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    marginBottom: 5,
  },

  // Quest Header
  questHeader: {
    marginBottom: 16,
  },
  questTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  questTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  statusText: {
    color: "#7C3AED",
    fontSize: 12,
    fontWeight: "600",
  },
  questMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 12,
  },

  // Quest Content
  questContent: {
    flex: 1,
    marginBottom: 16,
  },
  questDescription: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },

  // Rewards Card
  rewardsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  rewardsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  rewardsTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  rewardValue: {
    color: "#ffffff",
    fontSize: 16,
  },
  assetIdRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  assetIdLabel: {
    color: "#94A3B8",
    fontSize: 14,
  },
  assetIdValue: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "500",
  },

  // Winners Card
  winnersCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  winnersHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  winnersTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  winnerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  winnerBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  winnerNumber: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  winnerAddress: {
    color: "#ffffff",
    fontSize: 14,
  },

  // Action Buttons - FIXED POSITION AT BOTTOM
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto", // Push to bottom
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  optInButton: {
    flex: 1,
    backgroundColor: "#4C1D95",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  claimButton: {
    flex: 1,
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  disabledButton: {
    backgroundColor: "#4A5568",
    opacity: 0.7,
  },
  loadingButton: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})
