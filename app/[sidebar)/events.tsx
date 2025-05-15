"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Dimensions } from "react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown } from "react-native-reanimated"
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
  Menu,
} from "lucide-react-native"
import ScreenLayout from "../../components/screen-layout"
import { useState, useEffect } from "react"
import { router } from "expo-router"
import * as SecureStore from "expo-secure-store"
import MapView, { Marker } from "react-native-maps"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width - 32

const eventCategories = [
  { id: "all", name: "All" },
  { id: "workshop", name: "Workshops" },
  { id: "meetup", name: "Meetups" },
  { id: "hackathon", name: "Hackathons" },
  { id: "conference", name: "Conferences" },
]

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

// Generate upcoming events with location coordinates
const generateUpcomingEvents = () => {
  // Get current month and day for event dates
  const now = new Date()
  const currentMonth = now.toLocaleDateString("en-US", { month: "short" })

  const events = [
    {
      id: 1,
      title: "Blockchain Workshop",
      date: `${currentMonth} ${now.getDate() + 2}`,
      time: "2:00 PM",
      location: "Tech Hub",
      coordinates: {
        latitude: 37.78825,
        longitude: -122.4324,
      },
      attendees: 45,
      category: "Workshop",
      description: "Learn the fundamentals of blockchain technology and build your first smart contract.",
      daysAway: 2,
    },
    {
      id: 2,
      title: "Web3 Meetup",
      date: `${currentMonth} ${now.getDate() + 5}`,
      time: "5:30 PM",
      location: "Innovation Center",
      coordinates: {
        latitude: 37.77925,
        longitude: -122.4194,
      },
      attendees: 32,
      category: "Networking",
      description: "Connect with other Web3 enthusiasts and discuss the latest trends in decentralized applications.",
      daysAway: 5,
    },
    {
      id: 3,
      title: "DeFi Discussion",
      date: `${currentMonth} ${now.getDate() + 7}`,
      time: "3:00 PM",
      location: "Virtual",
      // Virtual events still need coordinates for the map
      coordinates: {
        latitude: 37.76025,
        longitude: -122.4094,
      },
      attendees: 28,
      category: "Discussion",
      description: "Deep dive into decentralized finance protocols and investment strategies.",
      daysAway: 7,
      isVirtual: true,
    },
    {
      id: 4,
      title: "NFT Art Exhibition",
      date: `${currentMonth} ${now.getDate() + 9}`,
      time: "7:00 PM",
      location: "Digital Gallery",
      coordinates: {
        latitude: 37.79925,
        longitude: -122.4424,
      },
      attendees: 120,
      category: "Exhibition",
      description: "Explore cutting-edge digital art and meet the creators behind popular NFT collections.",
      daysAway: 9,
    },
    {
      id: 5,
      title: "DAO Governance Workshop",
      date: `${currentMonth} ${now.getDate() + 12}`,
      time: "1:00 PM",
      location: "Community Center",
      coordinates: {
        latitude: 37.80825,
        longitude: -122.4524,
      },
      attendees: 40,
      category: "Workshop",
      description: "Learn how to participate in and contribute to decentralized autonomous organizations.",
      daysAway: 12,
    },
  ]

  // Sort events by how soon they are happening
  return events.sort((a, b) => a.daysAway - b.daysAway)
}

export default function EventsScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [calendarDays, setCalendarDays] = useState(generateCalendarDays())
  const [selectedDay, setSelectedDay] = useState(0) // Index of selected day
  const [publicAddress, setPublicAddress] = useState("")
  const [upcomingEvents, setUpcomingEvents] = useState(generateUpcomingEvents())
  const [currentMonthYear, setCurrentMonthYear] = useState(getCurrentMonthYear())

  useEffect(() => {
    loadWalletAddress()
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

  const onRefresh = () => {
    setRefreshing(true)
    // Simulate data refresh
    setTimeout(() => {
      setCalendarDays(generateCalendarDays())
      setCurrentMonthYear(getCurrentMonthYear())
      setUpcomingEvents(generateUpcomingEvents())
      setRefreshing(false)
    }, 1000)
  }

  const handleHostEvent = () => {
    router.push("/events/create")
  }

  const filteredEvents =
    selectedCategory === "all"
      ? upcomingEvents
      : upcomingEvents.filter((event) => event.category.toLowerCase() === selectedCategory)

  return (
    <ScreenLayout>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.menuButton} onPress={() => router.push("/(drawer)")}>
              <Menu size={24} color="#ffffff" />
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
              <Text style={styles.hostButtonText}>Host Event</Text>
            </TouchableOpacity>
          </View>
        </View>

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
            {eventCategories.map((category) => (
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

        {/* Upcoming Events */}
        <View style={styles.section}>
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

          <View style={styles.eventsList}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, index) => (
                <Animated.View key={event.id} entering={FadeInDown.delay(500 + index * 100).springify()}>
                  <TouchableOpacity>
                    {/* Event Card */}
                    <BlurView intensity={40} tint="dark" style={styles.eventCard}>
                      <View style={styles.eventImageContainer}>
                        {event.coordinates ? (
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
                              title={event.location}
                            />
                          </MapView>
                        ) : (
                          <View style={[styles.eventImage, styles.fallbackMapContainer]}>
                            <MapPin size={32} color="#7C3AED" />
                            <Text style={styles.fallbackMapText}>Location map unavailable</Text>
                          </View>
                        )}
                        <View style={styles.locationOverlay}>
                          <MapPin size={16} color="#ffffff" />
                          <Text style={styles.locationOverlayText}>
                            {event.isVirtual ? "Virtual Event" : event.location}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.eventContent}>
                        <View style={styles.eventHeader}>
                          <View style={styles.eventInfo}>
                            <Text style={styles.eventTitle}>{event.title}</Text>
                            <Text style={styles.eventDescription} numberOfLines={2}>
                              {event.description}
                            </Text>
                          </View>
                          <View style={styles.categoryTag}>
                            <Text style={styles.categoryTagText}>{event.category}</Text>
                          </View>
                        </View>

                        <View style={styles.eventDetailsRow}>
                          <View style={styles.detailItem}>
                            <CalendarIcon size={16} color="#94A3B8" />
                            <Text style={styles.detailText}>{event.date}</Text>
                          </View>
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
                                  : `In ${event.daysAway} days`}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.eventFooter}>
                          <View style={styles.attendeesContainer}>
                            <Users size={16} color="#94A3B8" />
                            <Text style={styles.attendeesText}>{event.attendees} attending</Text>
                          </View>
                          <TouchableOpacity style={styles.viewDetailsButton}>
                            <Text style={styles.viewDetailsText}>View Details</Text>
                            <ChevronRight size={16} color="#7C3AED" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                </Animated.View>
              ))
            ) : (
              <BlurView intensity={40} tint="dark" style={styles.noEventsContainer}>
                <Text style={styles.noEventsText}>No events found in this category</Text>
                <TouchableOpacity style={styles.resetFilterButton} onPress={() => setSelectedCategory("all")}>
                  <Text style={styles.resetFilterText}>Show all events</Text>
                </TouchableOpacity>
              </BlurView>
            )}
          </View>
        </View>

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
  eventCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  eventImage: {
    width: "100%",
    height: 120,
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
    gap: 12,
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
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  eventImageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
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
  },
  locationOverlayText: {
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
})
