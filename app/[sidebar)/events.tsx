"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Image } from "react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated"
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Plus,
  ChevronRight,
  Filter,
  Search,
  Calendar,
  ChevronLeft,
  Loader,
  Tag,
} from "lucide-react-native"
import ScreenLayout from "../../components/screen-layout"
import { useState, useEffect, useCallback } from "react"
import { router, useNavigation } from "expo-router"
import * as SecureStore from "expo-secure-store"
import MapView, { Marker } from "react-native-maps"
import algosdk from "algosdk"
import { Buffer } from "buffer"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width - 32

// Get current month and year formatted
const getCurrentMonthYear = () => {
  const now = new Date()
  return now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

// Generate current month's calendar days
const generateCalendarDays = () => {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  // Get the current day of the month
  const currentDay = today.getDate()

  const days = []
  // Show current day and next 13 days (total 14 days)
  for (let i = 0; i < 14; i++) {
    const dayNumber = currentDay + i
    const date = new Date(currentYear, currentMonth, dayNumber)

    // If we've gone into the next month, adjust the date
    if (dayNumber > daysInMonth) {
      date.setMonth(currentMonth + 1)
      date.setDate(dayNumber - daysInMonth)
    }

    const dayName = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
    const isToday = i === 0

    // Assign events to specific dates - more realistic pattern
    // Events are more likely to be on weekends and spread throughout the month
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
    const hasEvent = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6 || [3, 7, 10].includes(i)

    days.push({
      day: dayName,
      date: date.getDate().toString(),
      hasEvent,
      isToday,
      fullDate: date, // Store the full date for easier reference
    })
  }

  return days
}

// Updated function to fetch and decode events from Algorand blockchain
async function fetchAlgorandEvents() {
  try {
    const indexer = new algosdk.Indexer("", "https://testnet-idx.algonode.cloud", "")
    const appId = 739603588 // Updated app ID

    // Updated ABI type with 10 fields
    const abiType = algosdk.ABIType.from("(uint64,string,string,address,uint64,string,uint64,uint64,uint64,uint64)")

    const boxesResp = await indexer.searchForApplicationBoxes(appId).do()
    const events = []

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
        .lookupApplicationBoxByIDandName(appId, new Uint8Array(nameBuf.buffer, nameBuf.byteOffset, nameBuf.byteLength))
        .do()

      // Normalize to Buffer
      let buf: Buffer
      if (typeof valResp.value === "string") {
        buf = Buffer.from(valResp.value, "base64")
      } else {
        const u8 = valResp.value as Uint8Array
        buf = Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength)
      }

      // ABI Decode with updated 10-field structure
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

      // Parse location string to get coordinates
      const locationStr = decodedTuple[5]
      let coordinates = null

      // Try to parse coordinates from location string (assuming format: "lat,lng")
      try {
        const [lat, lng] = locationStr.split(",").map((coord) => Number.parseFloat(coord.trim()))
        if (!isNaN(lat) && !isNaN(lng)) {
          coordinates = { latitude: lat, longitude: lng }
        }
      } catch (error) {
        console.log("Error parsing coordinates:", error)
      }

      // Convert timestamps to dates
      const startTime = new Date(Number(decodedTuple[6]) * 1000)
      const endTime = new Date(Number(decodedTuple[7]) * 1000)

      // Calculate days away
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const eventDate = new Date(startTime)
      eventDate.setHours(0, 0, 0, 0)
      const daysAway = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // Format date and time
      const eventMonth = startTime.toLocaleDateString("en-US", { month: "short" })
      const eventDay = startTime.getDate()
      const eventTime = startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })

      // Get category from the actual category field
      const category = decodedTuple[2]

      // Create a unique ID for the event
      const eventId = `${decodedTuple[0]}_${decodedTuple[6]}`

      // Create event object
      const event = {
        id: eventId, // Use the unique compound ID
        originalId: Number(decodedTuple[0]), // Keep the original ID for reference
        title: decodedTuple[1],
        date: `${eventMonth} ${eventDay}`,
        time: eventTime,
        location: locationStr,
        coordinates: coordinates,
        attendees: Number(decodedTuple[8]),
        maxParticipants: Number(decodedTuple[4]),
        category: category,
        description: `Event created by ${decodedTuple[3].substring(0, 8)}...`,
        daysAway: daysAway,
        creator: decodedTuple[3],
        startTime: startTime,
        endTime: endTime,
        eventAppId: Number(decodedTuple[9]),
        imageUrl: `https://picsum.photos/seed/${decodedTuple[0]}/300/200`,
        isPast: startTime < new Date(), // Add a flag to identify past events
      }

      events.push(event)
    }

    // Sort events: upcoming first (sorted by start time), then past events (sorted by start time)
    return events.sort((a, b) => {
      // If one is past and one is upcoming, upcoming comes first
      if (a.isPast && !b.isPast) return 1
      if (!a.isPast && b.isPast) return -1

      // Otherwise sort by start time
      return a.startTime.getTime() - b.startTime.getTime()
    })
  } catch (error) {
    console.error("Error fetching Algorand events:", error)
    return []
  }
}

export default function EventsScreen() {
  const navigation = useNavigation()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [calendarDays, setCalendarDays] = useState(generateCalendarDays())
  const [selectedDay, setSelectedDay] = useState(0) // Index of selected day
  const [publicAddress, setPublicAddress] = useState("")
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [pastEvents, setPastEvents] = useState([])
  const [currentMonthYear, setCurrentMonthYear] = useState(getCurrentMonthYear())
  const [loading, setLoading] = useState(true)
  const [showPastEvents, setShowPastEvents] = useState(false)

  useEffect(() => {
    loadWalletAddress()
    loadEvents()
  }, [])

  const loadWalletAddress = async () => {
    try {
      const address = await SecureStore.getItemAsync("walletAddress")
      if (address) {
        setPublicAddress(address)
      }
    } catch (error) {
      console.error("Error loading wallet address:", error)
    }
  }

  const loadEvents = async () => {
    setLoading(true)
    try {
      const events = await fetchAlgorandEvents()

      // Separate upcoming and past events
      const upcoming = events.filter((event) => !event.isPast)
      const past = events.filter((event) => event.isPast)

      setUpcomingEvents(upcoming)
      setPastEvents(past)
    } catch (error) {
      console.error("Error loading events:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await loadEvents()
      setCalendarDays(generateCalendarDays())
      setCurrentMonthYear(getCurrentMonthYear())
    } catch (error) {
      console.error("Error refreshing events:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleHostEvent = () => {
    router.push("/(events)/create")
  }

  const handleGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      router.push("/(tabs)")
    }
  }, [navigation])

  const navigateToEventDetail = (event) => {
    // Pass all necessary parameters to the event detail screen
    router.push({
      pathname: "/(events)/event",
      params: {
        id: event.originalId,
        title: event.title,
        category: event.category,
        location: event.location,
        startTime: event.startTime.getTime(),
        endTime: event.endTime.getTime(),
        attendees: event.attendees,
        maxParticipants: event.maxParticipants,
        creator: event.creator,
        eventAppId: event.eventAppId,
        imageUrl: event.imageUrl,
      },
    })
  }

  // Filter events by category
  const filteredUpcomingEvents = upcomingEvents.filter((event) => {
    return selectedCategory === "all" || event.category.toLowerCase() === selectedCategory.toLowerCase()
  })

  const filteredPastEvents = pastEvents.filter((event) => {
    return selectedCategory === "all" || event.category.toLowerCase() === selectedCategory.toLowerCase()
  })

  // Update category buttons based on actual categories from events
  const allEvents = [...upcomingEvents, ...pastEvents]
  const uniqueCategories = [...new Set(allEvents.map((event) => event.category))]
  const dynamicCategories = [
    { id: "all", name: "All" },
    ...uniqueCategories.map((category) => ({
      id: category.toLowerCase(),
      name: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
    })),
  ]

  const renderEventCard = (event, index, isPast = false) => (
    <Animated.View
      key={event.id}
      entering={FadeInDown.delay(300 + index * 100).springify()}
      style={[styles.eventCardContainer, isPast && styles.pastEventCardContainer]}
    >
      <TouchableOpacity
        style={styles.eventCardTouchable}
        onPress={() => navigateToEventDetail(event)}
        activeOpacity={0.8}
      >
        <BlurView intensity={40} tint="dark" style={styles.eventCard}>
          {/* Event Image */}
          <View style={styles.eventImageContainer}>
            {event.imageUrl ? (
              <Image source={{ uri: event.imageUrl }} style={styles.eventImage} resizeMode="cover" />
            ) : event.coordinates ? (
              <MapView
                style={styles.eventImage}
                region={{
                  latitude: event.coordinates.latitude,
                  longitude: event.coordinates.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: event.coordinates.latitude,
                    longitude: event.coordinates.longitude,
                  }}
                  title={event.title}
                />
              </MapView>
            ) : (
              <View style={[styles.eventImage, styles.fallbackMapContainer]}>
                <MapPin size={32} color="#7C3AED" />
                <Text style={styles.fallbackMapText}>Location map unavailable</Text>
              </View>
            )}

            {/* Gradient overlay for better text visibility */}
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.imageGradient} />

            {/* Location badge */}
            <View style={styles.locationOverlay}>
              <MapPin size={16} color="#ffffff" />
              <Text style={styles.locationOverlayText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>

            {/* Category badge */}
            <View style={styles.categoryBadge}>
              <Tag size={12} color="#ffffff" />
              <Text style={styles.categoryBadgeText}>{event.category}</Text>
            </View>

            {/* Date badge */}
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeDay}>{event.date.split(" ")[1]}</Text>
              <Text style={styles.dateBadgeMonth}>{event.date.split(" ")[0]}</Text>
            </View>

            {/* Past event overlay */}
            {isPast && (
              <View style={styles.pastEventOverlay}>
                <Text style={styles.pastEventText}>Past Event</Text>
              </View>
            )}
          </View>

          <View style={styles.eventContent}>
            {/* Event Title and Rating */}
            <View style={styles.eventHeader}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {event.title}
                </Text>
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {event.description}
                </Text>
              </View>
            </View>

            {/* Event Details */}
            <View style={styles.eventDetailsRow}>
              <View style={styles.detailItem}>
                <Clock size={16} color="#94A3B8" />
                <Text style={styles.detailText}>{event.time}</Text>
              </View>

              <View style={styles.daysAwayTag}>
                <Text style={styles.daysAwayText}>
                  {event.daysAway === 0
                    ? "Today"
                    : event.daysAway === 1
                      ? "Tomorrow"
                      : event.daysAway < 0
                        ? `${Math.abs(event.daysAway)} days ago`
                        : `In ${event.daysAway} days`}
                </Text>
              </View>
            </View>

            {/* Event Footer */}
            <View style={styles.eventFooter}>
              <View style={styles.attendeesContainer}>
                <Users size={16} color="#94A3B8" />
                <Text style={styles.attendeesText}>
                  {event.attendees} / {event.maxParticipants}
                </Text>
              </View>
              <TouchableOpacity style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>Details</Text>
                <ChevronRight size={16} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  )

  return (
    <ScreenLayout>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ChevronLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Events</Text>
              <Text style={styles.subtitle}>Discover & Connect</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Search size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.hostButton} onPress={handleHostEvent}>
              <Plus size={20} color="#ffffff" />
              <Text style={styles.hostButtonText}>Host</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Calendar Strip */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.calendarSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Calendar size={18} color="#7C3AED" />
              <Text style={styles.sectionTitle}>{currentMonthYear}</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>Full Calendar</Text>
              <ChevronRight size={16} color="#7C3AED" />
            </TouchableOpacity>
          </View>

          <BlurView intensity={40} tint="dark" style={styles.calendarContent}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysContainer}
              decelerationRate="fast"
              snapToInterval={56}
            >
              {calendarDays.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayItem,
                    selectedDay === index && styles.selectedDayItem,
                    day.isToday && styles.todayItem,
                    day.hasEvent && styles.hasEventItem,
                  ]}
                  onPress={() => setSelectedDay(index)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      (selectedDay === index || day.isToday || day.hasEvent) && styles.activeText,
                    ]}
                  >
                    {day.day}
                  </Text>
                  <Text
                    style={[
                      styles.dateText,
                      (selectedDay === index || day.isToday || day.hasEvent) && styles.activeText,
                    ]}
                  >
                    {day.date}
                  </Text>
                  {day.hasEvent && <View style={styles.eventDot} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </BlurView>
        </Animated.View>

        {/* Categories */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {dynamicCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryButton, selectedCategory === category.id && styles.selectedCategoryButton]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[styles.categoryText, selectedCategory === category.id && styles.selectedCategoryText]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Upcoming Events Section */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <CalendarIcon size={18} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={16} color="#ffffff" />
              <Text style={styles.filterText}>Filter</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <BlurView intensity={40} tint="dark" style={styles.loadingContainer}>
              <Loader size={32} color="#7C3AED" />
              <Text style={styles.loadingText}>Loading events from blockchain...</Text>
            </BlurView>
          ) : (
            <View style={styles.eventsList}>
              {filteredUpcomingEvents.length > 0 ? (
                filteredUpcomingEvents.map((event, index) => renderEventCard(event, index))
              ) : (
                <BlurView intensity={40} tint="dark" style={styles.noEventsContainer}>
                  <Text style={styles.noEventsText}>
                    {selectedCategory !== "all"
                      ? `No upcoming events in the "${selectedCategory}" category`
                      : `No upcoming events found`}
                  </Text>
                  <TouchableOpacity style={styles.resetFilterButton} onPress={() => setSelectedCategory("all")}>
                    <Text style={styles.resetFilterText}>Show all events</Text>
                  </TouchableOpacity>
                </BlurView>
              )}
            </View>
          )}
        </Animated.View>

        {/* Past Events Section */}
        {filteredPastEvents.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
            <TouchableOpacity style={styles.pastEventsSectionHeader} onPress={() => setShowPastEvents(!showPastEvents)}>
              <View style={styles.sectionTitleContainer}>
                <CalendarIcon size={18} color="#94A3B8" />
                <Text style={styles.pastEventsSectionTitle}>Past Events</Text>
              </View>
              <ChevronRight
                size={20}
                color="#94A3B8"
                style={[styles.pastEventsChevron, showPastEvents && styles.pastEventsChevronExpanded]}
              />
            </TouchableOpacity>

            {showPastEvents && (
              <View style={styles.eventsList}>
                {filteredPastEvents.map((event, index) => renderEventCard(event, index, true))}
              </View>
            )}
          </Animated.View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  hostButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  hostButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  calendarSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: "#7C3AED",
    fontWeight: "500",
  },
  calendarContent: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  daysContainer: {
    padding: 12,
    gap: 8,
  },
  dayItem: {
    width: 56,
    height: 72,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedDayItem: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  todayItem: {
    borderColor: "#7C3AED",
  },
  hasEventItem: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
  },
  dayText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "500",
  },
  dateText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
  activeText: {
    color: "#ffffff",
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7C3AED",
    marginTop: 4,
  },
  categoriesContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  categoriesContent: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedCategoryButton: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderColor: "#7C3AED",
  },
  categoryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedCategoryText: {
    color: "#7C3AED",
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterText: {
    color: "#ffffff",
    fontSize: 14,
  },
  eventsList: {
    gap: 16,
  },
  eventCardContainer: {
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pastEventCardContainer: {
    opacity: 0.8,
  },
  eventCardTouchable: {
    borderRadius: 16,
    overflow: "hidden",
  },
  eventCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  eventImage: {
    width: "100%",
    height: 150,
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 8,
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignSelf: "flex-start",
  },
  categoryTagText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  eventDetailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewDetailsText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "500",
  },
  noEventsContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  noEventsText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  resetFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderRadius: 12,
  },
  resetFilterText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "500",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  eventImageContainer: {
    width: "100%",
    height: 150,
    position: "relative",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  locationOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    maxWidth: "60%",
  },
  locationOverlayText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 58, 237, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  dateBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "center",
  },
  dateBadgeDay: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  dateBadgeMonth: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  daysAwayTag: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysAwayText: {
    color: "#7C3AED",
    fontSize: 12,
    fontWeight: "500",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  attendeesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendeesText: {
    color: "#94A3B8",
    fontSize: 14,
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
  loadingContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 16,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
  },
  pastEventsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 16,
  },
  pastEventsSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#94A3B8",
  },
  pastEventsChevron: {
    transform: [{ rotate: "0deg" }],
  },
  pastEventsChevronExpanded: {
    transform: [{ rotate: "90deg" }],
  },
  pastEventOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  pastEventText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
})
