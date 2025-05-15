"use client"

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native"
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
  Info,
} from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import ScreenLayout from "../../components/screen-layout"
import { useState, useEffect } from "react"
import { router, useLocalSearchParams } from "expo-router"
import * as SecureStore from "expo-secure-store"
import * as Clipboard from "expo-clipboard"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { StatusBar } from "expo-status-bar"
import algosdk from "algosdk"
import { Buffer } from "buffer"

const { width, height } = Dimensions.get("window")
const MAP_HEIGHT = height * 0.35

// Truncate wallet address for display
const truncateAddress = (address) => {
  if (!address) return ""
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

// Format date for display
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Format time for display
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

// Add the fetchAndDecodeAllBoxNames function after the formatTime function
const fetchAndDecodeAllBoxNames = async (appId: number): Promise<string[]> => {
  try {
    const indexer = new algosdk.Indexer("", "https://testnet-idx.algonode.cloud", "")
    const addressTupleABI = algosdk.ABIType.from("(address)")

    const resp = await indexer.searchForApplicationBoxes(appId).do()

    return resp.boxes
      .map((box) => {
        // Normalize to Buffer
        let rawNameBuf: Buffer
        if (typeof box.name === "string") {
          rawNameBuf = Buffer.from(box.name, "base64")
        } else {
          const u8 = box.name as Uint8Array
          rawNameBuf = Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength)
        }

        // Check for at least prefix + 32 bytes
        if (rawNameBuf.length < 33) {
          return "<invalid-key>"
        }

        // Strip prefix
        const addrBytes = rawNameBuf.slice(1, 33)

        try {
          // Decode
          const [decodedAddress] = addressTupleABI.decode(addrBytes) as [string]
          return decodedAddress
        } catch (error) {
          console.error("Error decoding address:", error)
          return "<decode-error>"
        }
      })
      .filter((addr) => addr !== "<invalid-key>" && addr !== "<decode-error>")
  } catch (error) {
    console.error("Error fetching box names:", error)
    return []
  }
}

export default function EventDetailScreen() {
  const params = useLocalSearchParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userWallet, setUserWallet] = useState("")
  // Add a new state variable for participants after the existing state variables
  const [participants, setParticipants] = useState<string[]>([])
  const [isParticipating, setIsParticipating] = useState(false)
  const [participateLoading, setParticipateLoading] = useState(false)
  const [showCopiedMessage, setShowCopiedMessage] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  // Update the loadData function to fetch participants
  const loadData = async () => {
    setLoading(true)
    try {
      // First try to use the params passed from the events screen
      if (params.id) {
        // Check if we have all the necessary data in params
        if (params.title && params.location && params.startTime) {
          // Create event object from params
          const coordinates = parseCoordinates(params.location)

          const eventData = {
            id: Number(params.id),
            title: params.title,
            category: params.category || "Event",
            location: params.location,
            coordinates: coordinates,
            startTime: new Date(Number(params.startTime)),
            endTime: params.endTime ? new Date(Number(params.endTime)) : null,
            attendees: Number(params.attendees || 0),
            maxParticipants: Number(params.maxParticipants || 100),
            creator: params.creator || "",
            eventAppId: Number(params.eventAppId || 0),
            imageUrl: params.imageUrl || `https://picsum.photos/seed/${params.id}/300/200`,
          }

          setEvent(eventData)

          // Load user wallet
          const walletAddress = await SecureStore.getItemAsync("walletAddress")
          setUserWallet(walletAddress || "")

          // Fetch participants if we have an app ID
          if (eventData.eventAppId) {
            const participantAddresses = await fetchAndDecodeAllBoxNames(eventData.eventAppId)
            setParticipants(participantAddresses)

            // Check if user is already participating
            setIsParticipating(participantAddresses.includes(walletAddress))
          }

          setLoading(false)
          return
        }

        // If we don't have all the necessary data in params, fetch from blockchain
        await fetchEventFromBlockchain(Number(params.id))
      } else {
        // No ID provided
        console.error("No event ID provided")
        setLoading(false)
      }
    } catch (error) {
      console.error("Error loading event data:", error)
      setLoading(false)
    }
  }

  const parseCoordinates = (locationStr) => {
    if (!locationStr) return null

    try {
      const [lat, lng] = locationStr.split(",").map((coord) => Number.parseFloat(coord.trim()))
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng }
      }
    } catch (error) {
      console.log("Error parsing coordinates:", error)
    }

    return null
  }

  // Update the fetchEventFromBlockchain function to fetch participants
  const fetchEventFromBlockchain = async (eventId) => {
    try {
      const indexer = new algosdk.Indexer("", "https://testnet-idx.algonode.cloud", "")
      const appId = 739603588 // App ID

      // Updated ABI type with 10 fields
      const abiType = algosdk.ABIType.from("(uint64,string,string,address,uint64,string,uint64,uint64,uint64,uint64)")

      const boxesResp = await indexer.searchForApplicationBoxes(appId).do()

      for (const box of boxesResp.boxes) {
        // Decode box.name
        const nameBuf =
          typeof box.name === "string"
            ? Buffer.from(box.name, "base64")
            : Buffer.from(
                (box.name as Uint8Array).buffer,
                (box.name as Uint8Array).byteOffset,
                (box.name as Uint8Array).byteLength,
              )

        // Fetch box value
        const valResp = await indexer
          .lookupApplicationBoxByIDandName(
            appId,
            new Uint8Array(nameBuf.buffer, nameBuf.byteOffset, nameBuf.byteLength),
          )
          .do()

        // Normalize to Buffer
        let buf: Buffer
        if (typeof valResp.value === "string") {
          buf = Buffer.from(valResp.value, "base64")
        } else {
          const u8 = valResp.value as Uint8Array
          buf = Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength)
        }

        // ABI Decode
        const decodedTuple = abiType.decode(buf) as [
          bigint, // 0: eventID
          string, // 1: eventName
          string, // 2: category
          string, // 3: eventCreator (address)
          bigint, // 4: maxParticipants
          string, // 5: location
          bigint, // 6: startTime
          bigint, // 7: endTime
          bigint, // 8: registeredCount
          bigint, // 9: eventAppID
        ]

        // Check if this is the event we're looking for
        if (Number(decodedTuple[0]) === eventId) {
          // Parse location string to get coordinates
          const locationStr = decodedTuple[5]
          const coordinates = parseCoordinates(locationStr)

          // Convert timestamps to dates
          const startTime = new Date(Number(decodedTuple[6]) * 1000)
          const endTime = new Date(Number(decodedTuple[7]) * 1000)

          // Create event object
          const eventData = {
            id: Number(decodedTuple[0]),
            title: decodedTuple[1],
            category: decodedTuple[2],
            creator: decodedTuple[3],
            maxParticipants: Number(decodedTuple[4]),
            location: locationStr,
            coordinates: coordinates,
            startTime: startTime,
            endTime: endTime,
            attendees: Number(decodedTuple[8]),
            eventAppId: Number(decodedTuple[9]),
            imageUrl: `https://picsum.photos/seed/${decodedTuple[0]}/300/200`,
          }

          setEvent(eventData)

          // Load user wallet
          const walletAddress = await SecureStore.getItemAsync("walletAddress")
          setUserWallet(walletAddress || "")

          // Fetch participants if we have an app ID
          if (eventData.eventAppId) {
            const participantAddresses = await fetchAndDecodeAllBoxNames(eventData.eventAppId)
            setParticipants(participantAddresses)

            // Check if user is already participating
            setIsParticipating(participantAddresses.includes(walletAddress))
          }

          break
        }
      }
    } catch (error) {
      console.error("Error fetching event from blockchain:", error)
    } finally {
      setLoading(false)
    }
  }

  // Update the handleParticipate function to refresh participants after successful registration
  const handleParticipate = async () => {
    if (!userWallet) {
      // Redirect to wallet creation if no wallet
      router.push("/create-wallet")
      return
    }

    setParticipateLoading(true)
    try {
      // Get the user's account information
      const accountInfo = await SecureStore.getItemAsync("accountInfo")
      if (!accountInfo) {
        Alert.alert("Error", "Account information not found. Please recreate your wallet.", [{ text: "OK" }])
        setParticipateLoading(false)
        return
      }

      const account = JSON.parse(accountInfo)

      // Connect to Algorand client
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")

      // Get suggested parameters
      const suggestedParams = await algodClient.getTransactionParams().do()

      // Define ABI methods
      const METHODS = [
        new algosdk.ABIMethod({ name: "registerEvent", desc: "", args: [], returns: { type: "void", desc: "" } }),
      ]

      // Get the app ID from the event
      const appID = event.eventAppId

      // For this example, we'll use a placeholder for questAssetID
      // In a real app, this would come from the event data or another source
      const questAssetID = Number(params.questAssetID || 0)

      // Create the application transaction
      const txn2 = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account.addr,
        appIndex: Number(appID),
        appArgs: [algosdk.getMethodByName(METHODS, "registerEvent").getSelector(), algosdk.encodeUint64(questAssetID)],
        foreignAssets: [questAssetID],
        suggestedParams: { ...suggestedParams, fee: Number(30) },
      })

      const txns = [txn2]

      // Sign the transaction
      const signedTxns = txns.map((txn) => txn.signTxn(account.sk))
      const txId = txn2.txID()

      // Send the signed transaction
      await algodClient.sendRawTransaction(signedTxns).do()

      // Wait for confirmation
      await waitForConfirmation(algodClient, txId, 4)

      // Update UI state
      Alert.alert("Success!", "You have successfully registered for this event.", [{ text: "OK" }])
      setIsParticipating(true)

      // Update event in state with new participant
      if (event) {
        setEvent({
          ...event,
          attendees: (event.attendees || 0) + 1,
        })

        // Refresh participants list
        if (event.eventAppId) {
          const updatedParticipants = await fetchAndDecodeAllBoxNames(event.eventAppId)
          setParticipants(updatedParticipants)
        }
      }
    } catch (error) {
      console.error("Error participating in event:", error)
      Alert.alert("Error", `There was an error registering for this event: ${error.message}`, [{ text: "OK" }])
    } finally {
      setParticipateLoading(false)
    }
  }

  // Helper function to wait for transaction confirmation
  const waitForConfirmation = async (algodClient, txId, timeout) => {
    const status = await algodClient.status().do()
    let lastRound = status["last-round"]

    for (let i = 0; i < timeout; i++) {
      const pendingInfo = await algodClient.pendingTransactionInformation(txId).do()

      if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
        return pendingInfo
      }

      lastRound++
      await algodClient.statusAfterBlock(lastRound).do()
    }

    throw new Error(`Transaction not confirmed after ${timeout} rounds`)
  }

  const copyAddressToClipboard = async (address) => {
    await Clipboard.setStringAsync(address)
    setShowCopiedMessage(true)
    setTimeout(() => setShowCopiedMessage(false), 2000)
  }

  const handleMapError = () => {
    setMapError(true)
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

  const participantsRemaining = (event.maxParticipants || 100) - (event.attendees || 0)
  const isPastEvent = event.startTime < new Date()

  return (
    <ScreenLayout>
      <StatusBar style="light" />

      {/* Full-width Map or Image */}
      <View style={styles.mapContainer}>
        {event.coordinates && !mapError ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={{
              latitude: event.coordinates.latitude,
              longitude: event.coordinates.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onError={handleMapError}
          >
            <Marker
              coordinate={{
                latitude: event.coordinates.latitude,
                longitude: event.coordinates.longitude,
              }}
              title={event.title}
            />
          </MapView>
        ) : event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.map} resizeMode="cover" />
        ) : (
          <View style={[styles.map, styles.fallbackMapContainer]}>
            <MapPin size={48} color="#7C3AED" />
            <Text style={styles.fallbackMapText}>Location map unavailable</Text>
          </View>
        )}

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
          {event.coordinates && (
            <TouchableOpacity style={styles.directionsButton}>
              <ExternalLink size={14} color="#ffffff" />
            </TouchableOpacity>
          )}
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
                <Text style={styles.metaText}>{formatDate(event.startTime)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={16} color="#94A3B8" />
                <Text style={styles.metaText}>{formatTime(event.startTime)}</Text>
              </View>
            </View>
          </View>

          {/* Participants Stats */}
          <BlurView intensity={40} tint="dark" style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{event.attendees || 0}</Text>
                <Text style={styles.statLabel}>Participants</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{participantsRemaining}</Text>
                <Text style={styles.statLabel}>Spots Left</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>Free</Text>
                <Text style={styles.statLabel}>Entry</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          {/* Event Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.description}>
              {event.description ||
                `Join us for this exciting ${event.category} event! Connect with other blockchain enthusiasts and learn about the latest developments in the space.`}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          {/* Event Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Details</Text>
            <BlurView intensity={40} tint="dark" style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <CalendarIcon size={20} color="#7C3AED" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>{formatDate(event.startTime)}</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(event.startTime)} - {event.endTime ? formatTime(event.endTime) : "TBD"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <MapPin size={20} color="#7C3AED" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{event.location}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Info size={20} color="#7C3AED" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Event ID</Text>
                  <Text style={styles.detailValue}>#{event.id}</Text>
                  {event.eventAppId > 0 && <Text style={styles.detailValue}>App ID: {event.eventAppId}</Text>}
                </View>
              </View>
            </BlurView>
          </View>
        </Animated.View>

        {event.creator && (
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            {/* Organizer */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Organizer</Text>
              <BlurView intensity={40} tint="dark" style={styles.organizerCard}>
                <View style={styles.organizerInfo}>
                  <View style={styles.organizerAvatar}>
                    <Text style={styles.organizerInitial}>{event.creator.charAt(0)}</Text>
                  </View>
                  <View style={styles.organizerDetails}>
                    <Text style={styles.organizerName}>Event Creator</Text>
                    {event.creator && (
                      <View style={styles.walletRow}>
                        <Text style={styles.walletAddress}>{truncateAddress(event.creator)}</Text>
                        <TouchableOpacity
                          style={styles.copyButton}
                          onPress={() => copyAddressToClipboard(event.creator)}
                        >
                          <Copy size={14} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </BlurView>
            </View>
          </Animated.View>
        )}

        {participants.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            {/* Participants */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Participants</Text>
                <View style={styles.participantsCount}>
                  <Users size={14} color="#7C3AED" />
                  <Text style={styles.participantsCountText}>
                    {participants.length}/{event.maxParticipants || 100}
                  </Text>
                </View>
              </View>

              <BlurView intensity={40} tint="dark" style={styles.participantsCard}>
                {participants.slice(0, 10).map((address, index) => (
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

                {participants.length > 10 && (
                  <View style={styles.moreParticipants}>
                    <Text style={styles.moreParticipantsText}>+{participants.length - 10} more participants</Text>
                  </View>
                )}
              </BlurView>
            </View>
          </Animated.View>
        )}

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
              isPastEvent && styles.pastEventButton,
            ]}
            onPress={handleParticipate}
            disabled={participateLoading || isParticipating || isPastEvent}
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
                ) : isPastEvent ? (
                  <>
                    <AlertCircle size={20} color="#ffffff" />
                    <Text style={styles.participateButtonText}>Event Ended</Text>
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
  participantsCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
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
  moreParticipants: {
    paddingVertical: 12,
    alignItems: "center",
  },
  moreParticipantsText: {
    color: "#94A3B8",
    fontSize: 14,
    fontStyle: "italic",
  },
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
  detailsCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  detailRow: {
    flexDirection: "row",
    padding: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  detailDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginLeft: 56,
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
  pastEventButton: {
    backgroundColor: "#6B7280",
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
  fallbackMapContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackMapText: {
    color: "#ffffff",
    marginTop: 8,
    fontSize: 14,
  },
})
