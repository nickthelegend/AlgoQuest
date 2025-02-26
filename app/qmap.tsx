"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated as RNAnimated } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps"
import { Navigation, Trophy, Clock, MapPin, ChevronUp, ChevronDown, ArrowLeft } from "lucide-react-native"
import * as Location from "expo-location"
import { getDistance } from "geolib"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated"
import { router } from "expo-router"
import { Image } from 'expo-image';

const { width, height } = Dimensions.get("window")
const LIBRARY_LOCATION = {
  latitude: 17.495557881038195,
  longitude: 78.39155812153787,
}

const GEOFENCE_RADIUS = 50 // 50 meters radius

interface Quest {
  id: string
  title: string
  description: string
  reward: string
  status: "completed" | "upcoming" | "ongoing"
  location: {
    latitude: number
    longitude: number
  }
  distance?: number
  timeRemaining?: string
}

const DUMMY_QUEST: Quest = {
  id: "1",
  title: "Library Treasure Hunt",
  description: "Find the hidden NFT treasure in the library! Get close to the marked location to claim your reward.",
  reward: "Exclusive Library NFT",
  status: "ongoing",
  location: LIBRARY_LOCATION,
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
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [isWithinGeofence, setIsWithinGeofence] = useState(false)
  const [distance, setDistance] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
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
  const bottomSheetHeight = useSharedValue(120)
  const expandIconRotation = useSharedValue(0)
  const pulseAnim = useRef(new RNAnimated.Value(1)).current

  useEffect(() => {
    // Start pulsing animation for the distance indicator
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

    // Location permissions and tracking
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied")
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setLocation(location)
      updateDistance(location)

      // Start location updates
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
    })()
  }, [pulseAnim])

  const updateDistance = (userLocation: Location.LocationObject) => {
    const dist = getDistance(
      {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      },
      LIBRARY_LOCATION,
    )
    setDistance(dist)
  }

  const checkGeofence = (userLocation: Location.LocationObject) => {
    const dist = getDistance(
      {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      },
      LIBRARY_LOCATION,
    )

    setIsWithinGeofence(dist <= GEOFENCE_RADIUS)
  }

  const getStatusColor = (status: Quest["status"]) => {
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

  const renderQuestModal = () => {
    if (!selectedQuest) return null

    return (
      <Animated.View entering={FadeIn} style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.modalHeader}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: `${getStatusColor(selectedQuest.status)}20`,
                  borderColor: getStatusColor(selectedQuest.status),
                },
              ]}
            >
              <Text style={[styles.statusText, { color: getStatusColor(selectedQuest.status) }]}>
                {selectedQuest.status.charAt(0).toUpperCase() + selectedQuest.status.slice(1)}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedQuest(null)}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalTitle}>{selectedQuest.title}</Text>
          <Text style={styles.modalDescription}>{selectedQuest.description}</Text>

          <View style={styles.rewardContainer}>
            <Trophy size={20} color="#7C3AED" />
            <Text style={styles.rewardText}>{selectedQuest.reward}</Text>
          </View>

          {isWithinGeofence && selectedQuest.status === "ongoing" && (
            <TouchableOpacity style={styles.claimButton}>
              <Text style={styles.claimButtonText}>Claim Reward</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    )
  }

  const formatDistance = (meters: number | null) => {
    if (meters === null) return "Calculating..."
    if (meters < 1000) return `${meters.toFixed(0)} m`
    return `${(meters / 1000).toFixed(1)} km`
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE}
      >
        {/* Geofence Circle */}
        <Circle
          center={LIBRARY_LOCATION}
          radius={GEOFENCE_RADIUS}
          fillColor="rgba(124, 58, 237, 0.2)"
          strokeColor="rgba(124, 58, 237, 0.5)"
          strokeWidth={2}
        />

        {/* Quest Marker */}
        <Marker
          coordinate={DUMMY_QUEST.location}
          onPress={() => setSelectedQuest(DUMMY_QUEST)}
          tracksViewChanges={false}
        >
          <View
            // style={[
            //   styles.markerContainer,
            //   {
            //     backgroundColor: `${getStatusColor(DUMMY_QUEST.status)}20`,
            //     borderColor: getStatusColor(DUMMY_QUEST.status),
            //   },
            // ]}
          >
            <Image
              source="treasure-chest"
              style={styles.markerImage}
              // resizeMode="contain"
            />
          </View>
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
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            })
          }}
        >
          <View style={styles.centerButtonContent}>
            <LinearGradient colors={["#1F1F1F", "#000000"]} style={StyleSheet.absoluteFill} />
            <Navigation size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Quest Modal */}
      {renderQuestModal()}

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
              <Text style={styles.questTitle}>Library Treasure Hunt</Text>
              <View style={[styles.questStatusBadge, { backgroundColor: `${getStatusColor(DUMMY_QUEST.status)}20` }]}>
                <Text style={[styles.questStatusText, { color: getStatusColor(DUMMY_QUEST.status) }]}>
                  {DUMMY_QUEST.status.charAt(0).toUpperCase() + DUMMY_QUEST.status.slice(1)}
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
                <Text style={styles.questMetaText}>{DUMMY_QUEST.timeRemaining}</Text>
              </View>
            </View>
          </View>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              <Text style={styles.questDescription}>{DUMMY_QUEST.description}</Text>

              <View style={styles.rewardSection}>
                <View style={styles.rewardHeader}>
                  <Trophy size={18} color="#ffffff" />
                  <Text style={styles.rewardTitle}>Reward</Text>
                </View>
                <Text style={styles.rewardValue}>{DUMMY_QUEST.reward}</Text>
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
                        latitude: LIBRARY_LOCATION.latitude,
                        longitude: LIBRARY_LOCATION.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
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
})

