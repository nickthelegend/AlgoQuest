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
  Image
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps"
import { Navigation, Trophy, Clock, MapPin, ChevronUp, ChevronDown, ArrowLeft } from "lucide-react-native"
import * as Location from "expo-location"
import { getDistance } from "geolib"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated"
import { router, useLocalSearchParams } from "expo-router"
import { supabase } from "@/lib/supabase"
import treasureChest from "@/assets/icons/treasure_chest.png";

const { width, height } = Dimensions.get("window")
const LIBRARY_LOCATION = {
  latitude: 17.495557881038195,
  longitude: 78.39155812153787,
}

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
}

const DUMMY_QUEST: Quest = {
  quest_id: "1",
  quest_name: "Library Treasure Hunt",
  description: "Find the hidden NFT treasure in the library! Get close to the marked location to claim your reward.",
  rewards: {
    tokens: 100,
    nft: {
      name: "Exclusive Library NFT",
    },
  },
  quest_status: "ongoing",
  latitude: LIBRARY_LOCATION.latitude,
  longitude: LIBRARY_LOCATION.longitude,
  expiry_date: "2024-12-31T23:59:59+00:00",
  timeRemaining: "2 hours left",
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
  const mapRef = useRef<MapView>(null)

  // Default region
  const [region, setRegion] = useState({
    latitude: 17.493504,
    longitude: 78.391198,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  })

  // Animation values
  const bottomSheetHeight = useSharedValue(350)
  const expandIconRotation = useSharedValue(180)
  const pulseAnim = useRef(new RNAnimated.Value(1)).current

  useEffect(() => {
    fetchQuest()
    setupLocation()
    setupAnimations()
  }, [])

  const fetchQuest = async () => {
    if (!quest_id) return

    try {
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
      }
    } catch (err) {
      console.error("Error fetching quest:", err)
      setErrorMsg("Failed to load quest details")
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

  const setupLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") {
      setErrorMsg("Permission to access location was denied")
      return
    }

    const initialLocation = await Location.getCurrentPositionAsync({})
    setLocation(initialLocation)
    updateDistance(initialLocation)

    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (newLocation) => {
        setLocation(newLocation)
        updateDistance(newLocation)
        checkGeofence(newLocation)
      },
    )
  }

  const updateDistance = (userLocation: Location.LocationObject) => {
    if (!quest) return

    const dist = getDistance(
      {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      },
      {
        latitude: quest.latitude,
        longitude: quest.longitude,
      },
    )
    setDistance(dist)
  }

  const checkGeofence = (userLocation: Location.LocationObject) => {
    if (!quest) return

    const dist = getDistance(
      {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      },
      {
        latitude: quest.latitude,
        longitude: quest.longitude,
      },
    )

    setIsWithinGeofence(dist <= 50) // 50 meters radius
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
    bottomSheetHeight.value = withSpring(newValue ? 350 : 120, { damping: 15 })
    expandIconRotation.value = withTiming(newValue ? 180 : 0, { duration: 300 })
  }

  const handleOptIn = () => {
    setIsOptedIn(true)
    // Here you would typically call an API to opt in to the quest
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
      return `${days} days ${hours} hours`
    } else {
      return `${hours} hours ${minutes} minutes`
    }
  }

  const focusOnQuest = () => {
    // Expand the bottom sheet if it's not already expanded
    if (!isExpanded) {
      toggleExpand()
    }

    // Animate to the quest location with respect to zoom limits
    mapRef.current?.animateToRegion({
                        latitude: quest.latitude,
                        longitude: quest.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                      })
  }

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
        minZoomLevel={17} // Increased minimum zoom level to prevent zooming out too far
        maxZoomLevel={20}
        mapPadding={{ top: 20, right: 20, bottom: 20, left: 20 }}
        // onRegionChange={(newRegion) => {
        //   // Prevent zooming out beyond the maximum allowed delta
        //   if (newRegion.latitudeDelta > maxLatitudeDelta || newRegion.longitudeDelta > maxLongitudeDelta) {
        //     mapRef.current?.animateToRegion(
        //       {
        //         ...newRegion,
        //         latitudeDelta: maxLatitudeDelta,
        //         longitudeDelta: maxLongitudeDelta,
        //       },
        //       100,
        //     )
        //   }
        // }}
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
          radius={20}
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
  anchor={{ x: 0, y: 0 }} // Center the marker
>
  <Image
    source={treasureChest}
    style={{ width: 20, height: 20 }}
    resizeMode="contain"
  />
</Marker>
        
      </MapView>

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

      {/* Bottom Quest Info Box */}
      <Animated.View style={[styles.bottomSheet, animatedBottomSheetStyle]}>
        <View style={styles.bottomSheetContent}>
          <LinearGradient colors={["#1F1F1F", "#000000"]} style={StyleSheet.absoluteFill} />

          {/* Handle for expanding/collapsing */}
          <TouchableOpacity style={styles.handleContainer} onPress={toggleExpand}>
            <View style={styles.handle} />
            <Animated.View style={animatedIconStyle}>
              {isExpanded ? <ChevronDown size={20} color="#ffffff" /> : <ChevronUp size={20} color="#ffffff" />}
            </Animated.View>
          </TouchableOpacity>

          {/* Quest Title and Status */}
          <View style={styles.questHeaderContainer}>
            <View style={styles.questTitleContainer}>
              <Text style={styles.questTitle}>{quest.quest_name}</Text>
              <View style={[styles.questStatusBadge, { backgroundColor: `${getStatusColor(quest.quest_status)}20` }]}>
                <Text style={[styles.questStatusText, { color: getStatusColor(quest.quest_status) }]}>
                  {quest.quest_status.charAt(0).toUpperCase() + quest.quest_status.slice(1)}
                </Text>
              </View>
            </View>

            {/* Distance and Time */}
            <View style={styles.questMetaContainer}>
              <View style={styles.questMetaItem}>
                <RNAnimated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <MapPin size={16} color="#ffffff" />
                </RNAnimated.View>
                <Text style={styles.questMetaText}>{formatDistance(distance)}</Text>
              </View>
              <View style={styles.questMetaItem}>
                <Clock size={16} color="#ffffff" />
                <Text style={styles.questMetaText}>{getTimeRemaining(quest.expiry_date)}</Text>
              </View>
            </View>
          </View>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              <Text style={styles.questDescription}>{quest.description}</Text>

              <View style={styles.rewardSection}>
                <View style={styles.rewardHeader}>
                  <Trophy size={18} color="#ffffff" />
                  <Text style={styles.rewardTitle}>Rewards</Text>
                </View>
                <Text style={styles.rewardValue}>{quest.rewards.tokens} $CAMP</Text>
                {quest.rewards.nft && <Text style={styles.rewardValue}>NFT: {quest.rewards.nft.name}</Text>}
              </View>

              <View style={styles.buttonContainer}>
                {!isOptedIn && (
                  <TouchableOpacity style={styles.optInButton} onPress={handleOptIn}>
                    <Text style={styles.actionButtonText}>OPT-IN</Text>
                  </TouchableOpacity>
                )}

                {isWithinGeofence ? (
                  <TouchableOpacity style={[styles.actionButton, isOptedIn ? styles.fullWidthButton : {}]}>
                    <Text style={styles.actionButtonText}>Claim Reward</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, isOptedIn ? styles.fullWidthButton : {}]}
                    onPress={() => {
                      mapRef.current?.animateToRegion({
                        latitude: quest.latitude,
                        longitude: quest.longitude,
                        latitudeDelta: 0.003,
                        longitudeDelta: 0.003,
                      })
                    }}
                  >
                    <Text style={styles.actionButtonText}>Navigate to Quest</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
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
  markerContainer: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  markerImage: {
    width: 30,
    height: 30,
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
    bottom: 140, // Adjusted to be above the bottom sheet
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
  modalContainer: {
    position: "absolute",
    bottom: 140, // Adjusted to be above the bottom sheet
    left: 16,
    right: 16,
  },
  modalContent: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
  },
  rewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  rewardText: {
    color: "#7C3AED",
    fontSize: 16,
    fontWeight: "600",
  },
  claimButton: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  claimButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Bottom Sheet Styles
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
    padding: 20,
    paddingTop: 10,
  },
  handleContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    marginBottom: 5,
  },
  questHeaderContainer: {
    marginBottom: 16,
  },
  questTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  questTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
  },
  questStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  questStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  questMetaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  questMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  questMetaText: {
    color: "#ffffff",
    fontSize: 14,
  },
  expandedContent: {
    marginTop: 16,
  },
  questDescription: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  rewardSection: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  rewardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  rewardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  rewardValue: {
    color: "#ffffff",
    fontSize: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  optInButton: {
    flex: 1,
    backgroundColor: "#4C1D95",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  fullWidthButton: {
    flex: 1,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
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
  markerGradient: {
    padding: 8,
    borderRadius: 12,
  },
})

