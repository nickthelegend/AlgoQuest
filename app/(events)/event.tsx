"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from "react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated"
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  Share2,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
} from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import ScreenLayout from "../../components/screen-layout"
import { useState, useEffect } from "react"
import { router, useLocalSearchParams } from "expo-router"
import * as SecureStore from "expo-secure-store"
import * as Clipboard from "expo-clipboard"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { StatusBar } from "expo-status-bar"

const { width, height } = Dimensions.get("window")
const MAP_HEIGHT = height * 0.35

// Mock event data - in a real app, you would fetch this based on the event ID
const getEventDetails = (id) => {
  return {
    id: Number.parseInt(id) || 1,
    title: "Blockchain Workshop",
    date: "May 17",
    time: "2:00 PM - 5:00 PM",
    location: "Tech Hub",
    coordinates: {
      latitude: 37.78825,
      longitude: -122.4324,
    },
    attendees: 45,
    category: "Workshop",
    description:
      "Learn the fundamentals of blockchain technology and build your first smart contract. This hands-on workshop will cover the basics of blockchain architecture, smart contract development, and decentralized applications. Bring your laptop and come ready to code!",
    organizer: "Web3 Foundation",
    organizerWallet: "0x7F9d1B1f8c7A1e1D1f8c7A1e1D1f8c7A1e1D1f8c",
    price: "0.05 ETH",
    maxParticipants: 50,
    participants: [
      "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
      "0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a",
      "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b",
      "0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c",
      "0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c4d",
      "0x6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c4d5e",
      "0x7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c4d5e6f",
      "0x8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c4d5e6f7g",
    ],
    requirements: ["Basic understanding of programming concepts", "Laptop with Node.js installed", "MetaMask wallet"],
    tags: ["Blockchain", "Smart Contracts", "Web3", "Ethereum"],
  }
}

// Truncate wallet address for display
const truncateAddress = (address) => {
  if (!address) return ""
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

export default function EventDetailScreen() {
  const params = useLocalSearchParams()
  const { id } = params
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userWallet, setUserWallet] = useState("")
  const [isParticipating, setIsParticipating] = useState(false)
  const [participateLoading, setParticipateLoading] = useState(false)
  const [showCopiedMessage, setShowCopiedMessage] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      // In a real app, fetch event data from API
      const eventData = getEventDetails(id)
      setEvent(eventData)

      // Load user wallet
      const walletAddress = await SecureStore.getItemAsync("walletAddress")
      setUserWallet(walletAddress || "")

      // Check if user is already participating
      if (walletAddress && eventData.participants.includes(walletAddress)) {
        setIsParticipating(true)
      }
    } catch (error) {
      console.error("Error loading event data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleParticipate = async () => {
    if (!userWallet) {
      // Redirect to wallet creation if no wallet
      router.push("/create-wallet")
      return
    }

    setParticipateLoading(true)
    try {
      // Simulate API call to register for event
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update local state
      if (!isParticipating) {
        setEvent((prev) => ({
          ...prev,
          participants: [...prev.participants, userWallet],
          attendees: prev.attendees + 1,
        }))
        setIsParticipating(true)
      }
    } catch (error) {
      console.error("Error participating in event:", error)
    } finally {
      setParticipateLoading(false)
    }
  }

  const copyAddressToClipboard = async (address) => {
    await Clipboard.setStringAsync(address)
    setShowCopiedMessage(true)
    setTimeout(() => setShowCopiedMessage(false), 2000)
  }

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      </ScreenLayout>
    )
  }

  if (!event) {
    return (
      <ScreenLayout>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#EF4444" />
          <Text style={styles.errorText}>Event not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    )
  }

  const participantsRemaining = event.maxParticipants - event.attendees

  return (
    <ScreenLayout>
      <StatusBar style="light" />

      {/* Full-width Map */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            latitude: event.coordinates.latitude,
            longitude: event.coordinates.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: event.coordinates.latitude,
              longitude: event.coordinates.longitude,
            }}
            title={event.location}
          />
        </MapView>

        {/* Map Overlay */}
        <LinearGradient colors={["rgba(0, 0, 0, 0.7)", "transparent"]} style={styles.mapGradient} />

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton}>
          <Share2 size={20} color="#ffffff" />
        </TouchableOpacity>

        {/* Location Badge */}
        <View style={styles.locationBadge}>
          <MapPin size={16} color="#ffffff" />
          <Text style={styles.locationText}>{event.location}</Text>
          <TouchableOpacity style={styles.directionsButton}>
            <ExternalLink size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          {/* Event Header */}
          <View style={styles.eventHeader}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{event.category}</Text>
            </View>
            <Text style={styles.eventTitle}>{event.title}</Text>

            <View style={styles.eventMeta}>
              <View style={styles.metaItem}>
                <CalendarIcon size={16} color="#94A3B8" />
                <Text style={styles.metaText}>{event.date}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={16} color="#94A3B8" />
                <Text style={styles.metaText}>{event.time}</Text>
              </View>
            </View>
          </View>

          {/* Participants Stats */}
          <BlurView intensity={40} tint="dark" style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{event.attendees}</Text>
                <Text style={styles.statLabel}>Participants</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{participantsRemaining}</Text>
                <Text style={styles.statLabel}>Spots Left</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{event.price}</Text>
                <Text style={styles.statLabel}>Entry Fee</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          {/* Event Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          {/* Requirements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <View style={styles.requirementsList}>
              {event.requirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          {/* Organizer */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organizer</Text>
            <BlurView intensity={40} tint="dark" style={styles.organizerCard}>
              <View style={styles.organizerInfo}>
                <View style={styles.organizerAvatar}>
                  <Text style={styles.organizerInitial}>{event.organizer.charAt(0)}</Text>
                </View>
                <View style={styles.organizerDetails}>
                  <Text style={styles.organizerName}>{event.organizer}</Text>
                  <View style={styles.walletRow}>
                    <Text style={styles.walletAddress}>{truncateAddress(event.organizerWallet)}</Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => copyAddressToClipboard(event.organizerWallet)}
                    >
                      <Copy size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </BlurView>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()}>
          {/* Participants */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Participants</Text>
              <View style={styles.participantsCount}>
                <Users size={14} color="#7C3AED" />
                <Text style={styles.participantsCountText}>
                  {event.attendees}/{event.maxParticipants}
                </Text>
              </View>
            </View>

            <BlurView intensity={40} tint="dark" style={styles.participantsCard}>
              {event.participants.map((address, index) => (
                <View key={index} style={styles.participantItem}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.participantInitial}>{index + 1}</Text>
                  </View>
                  <Text style={styles.participantAddress}>{truncateAddress(address)}</Text>
                  <TouchableOpacity style={styles.copyButton} onPress={() => copyAddressToClipboard(address)}>
                    <Copy size={14} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              ))}
            </BlurView>
          </View>
        </Animated.View>

        {/* Tags */}
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {event.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Participate Button */}
      <Animated.View entering={FadeIn.delay(700).springify()} style={styles.participateContainer}>
        <BlurView intensity={80} tint="dark" style={styles.participateBlur}>
          {showCopiedMessage && (
            <View style={styles.copiedMessage}>
              <CheckCircle size={14} color="#10B981" />
              <Text style={styles.copiedText}>Address copied!</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.participateButton,
              isParticipating && styles.participatingButton,
              participateLoading && styles.loadingButton,
            ]}
            onPress={handleParticipate}
            disabled={participateLoading || isParticipating}
          >
            {participateLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                {isParticipating ? (
                  <>
                    <CheckCircle size={20} color="#ffffff" />
                    <Text style={styles.participateButtonText}>Registered</Text>
                  </>
                ) : (
                  <>
                    <Users size={20} color="#ffffff" />
                    <Text style={styles.participateButtonText}>Participate</Text>
                  </>
                )}
              </>
            )}
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  mapContainer: {
    width: width,
    height: MAP_HEIGHT,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  shareButton: {
    position: "absolute",
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  locationBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: width - 32,
  },
  locationText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
    marginRight: 8,
  },
  directionsButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  eventHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  categoryText: {
    color: "#7C3AED",
    fontSize: 12,
    fontWeight: "600",
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
  statsCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginTop: 8,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#94A3B8",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255, 255, 255, 0.8)",
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7C3AED",
    marginRight: 10,
  },
  requirementText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  organizerCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
  },
  organizerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  organizerInitial: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  organizerDetails: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletAddress: {
    fontSize: 14,
    color: "#94A3B8",
  },
  copyButton: {
    padding: 4,
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  participantsCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  participantsCountText: {
    color: "#7C3AED",
    fontSize: 12,
    fontWeight: "600",
  },
  participantsCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    gap: 12,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  participantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  participantInitial: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  participantAddress: {
    flex: 1,
    fontSize: 14,
    color: "#ffffff",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  tagText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  participateContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  participateBlur: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  participateButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  participatingButton: {
    backgroundColor: "#10B981",
  },
  loadingButton: {
    opacity: 0.7,
  },
  participateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: "#ffffff",
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonText: {
    color: "#7C3AED",
    fontSize: 16,
    fontWeight: "600",
  },
  copiedMessage: {
    position: "absolute",
    top: -40,
    alignSelf: "center",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  copiedText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "500",
  },
})
