"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert,
  FlatList,
} from "react-native"
import { BlurView } from "expo-blur"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  Check,
  Tag,
  User,
  X,
  Users,
  Search,
} from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import * as SecureStore from "expo-secure-store"
import { router } from "expo-router"
import MapView, { PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"

// Event categories
const eventCategories = [
  { id: "workshop", name: "Workshop", color: "#7C3AED" },
  { id: "meetup", name: "Meetup", color: "#3B82F6" },
  { id: "hackathon", name: "Hackathon", color: "#EF4444" },
  { id: "conference", name: "Conference", color: "#10B981" },
  { id: "other", name: "Other", color: "#F59E0B" },
]

// Sample locations for search (would be replaced with API in production)
const sampleLocations = [
  {
    name: "Hyderabad Central Mall",
    address: "Hyderabad Central Mall, Punjagutta, Hyderabad, India",
    latitude: 17.4256,
    longitude: 78.45,
  },
  {
    name: "Charminar",
    address: "Charminar, Hyderabad, Telangana, India",
    latitude: 17.3616,
    longitude: 78.4747,
  },
  {
    name: "Golconda Fort",
    address: "Golconda Fort, Hyderabad, Telangana, India",
    latitude: 17.3833,
    longitude: 78.4011,
  },
  {
    name: "Hussain Sagar Lake",
    address: "Hussain Sagar Lake, Hyderabad, Telangana, India",
    latitude: 17.4239,
    longitude: 78.4738,
  },
  {
    name: "Ramoji Film City",
    address: "Ramoji Film City, Hyderabad, Telangana, India",
    latitude: 17.2543,
    longitude: 78.68,
  },
  {
    name: "HITEC City",
    address: "HITEC City, Hyderabad, Telangana, India",
    latitude: 17.4435,
    longitude: 78.3772,
  },
]

// Dark mode map style
const mapStyle = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#212121",
      },
    ],
  },
  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#212121",
      },
    ],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#bdbdbd",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#181818",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#1b1b1b",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [
      {
        color: "#2c2c2c",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#8a8a8a",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [
      {
        color: "#373737",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#3c3c3c",
      },
    ],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [
      {
        color: "#4e4e4e",
      },
    ],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#000000",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#3d3d3d",
      },
    ],
  },
]

export default function CreateEventScreen() {
  // Form state
  const [eventName, setEventName] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventCreator, setEventCreator] = useState("")
  const [location, setLocation] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [capacity, setCapacity] = useState("")
  const [locationCoordinates, setLocationCoordinates] = useState({
    latitude: 17.493151222175904,
    longitude: 78.39227845034713,
  })

  const [locationName, setLocationName] = useState("")

  // Map ref
  const mapRef = useRef(null)

  // Date and time state
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000)) // 2 hours from now
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false)
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false)
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false)
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false)

  // Map state
  const [showMap, setShowMap] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // UI state
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadWalletAddress()
    requestLocationPermission()
    // Get location name for default coordinates
    getLocationNameFromCoordinates(locationCoordinates.latitude, locationCoordinates.longitude)
  }, [])

  const loadWalletAddress = async () => {
    try {
      const address = await SecureStore.getItemAsync("walletAddress")
      if (address) {
        setEventCreator(address)
      }
    } catch (error) {
      console.error("Error loading wallet address:", error)
    }
  }

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === "granted") {
        setLocationPermissionGranted(true)
      } else {
        Alert.alert(
          "Location Permission",
          "Location permission is required to use the map feature. You can still enter a location manually.",
          [{ text: "OK" }],
        )
      }
    } catch (error) {
      console.error("Error requesting location permission:", error)
    }
  }

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const { latitude, longitude } = location.coords

      // Update coordinates
      setLocationCoordinates({
        latitude,
        longitude,
      })

      // Animate map to new location
      if (mapRef.current) {
        mapRef.current.animateCamera(
          {
            center: {
              latitude,
              longitude,
            },
          },
          { duration: 300 },
        )
      }

      // Get location name for current coordinates
      getLocationNameFromCoordinates(latitude, longitude)

      setIsLoadingLocation(false)
    } catch (error) {
      console.error("Error getting current location:", error)
      setIsLoadingLocation(false)
      Alert.alert("Error", "Could not get your current location. Please try again or select manually.")
    }
  }

  const getLocationNameFromCoordinates = async (latitude, longitude) => {
    try {
      setIsLoadingLocation(true)
      console.log("Getting location name for:", latitude, longitude)

      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      })

      console.log("Geocode result:", result)

      if (result && result.length > 0) {
        const address = result[0]
        const formattedAddress = formatAddress(address)
        console.log("Setting location name:", formattedAddress)
        // Store the location name for display
        setLocationName(formattedAddress)
        // Store only coordinates in the location field
        setLocation(`${latitude.toFixed(6)},${longitude.toFixed(6)}`)
      } else {
        console.log("No geocode results, using coordinates")
        setLocationName("")
        setLocation(`${latitude.toFixed(6)},${longitude.toFixed(6)}`)
      }
      setIsLoadingLocation(false)
    } catch (error) {
      console.error("Error getting location name:", error)
      setLocationName("")
      setLocation(`${latitude.toFixed(6)},${longitude.toFixed(6)}`)
      setIsLoadingLocation(false)
    }
  }

  const handleCameraMove = (region) => {
    // Update coordinates based on the center of the map
    setLocationCoordinates({
      latitude: region.latitude,
      longitude: region.longitude,
    })

    // Get location name for the new coordinates
    getLocationNameFromCoordinates(region.latitude, region.longitude)
  }

  const searchLocations = () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setShowSearchResults(true)

    // Filter sample locations based on search query
    const results = sampleLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    setSearchResults(results)
    setIsSearching(false)
  }

  const selectSearchResult = (result) => {
    // Update coordinates
    setLocationCoordinates({
      latitude: result.latitude,
      longitude: result.longitude,
    })

    // Animate map to new location
    if (mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: result.latitude,
            longitude: result.longitude,
          },
        },
        { duration: 300 },
      )
    }

    // Set location name for display
    setLocationName(result.address)
    // Set only coordinates in the location field
    setLocation(`${result.latitude.toFixed(6)},${result.longitude.toFixed(6)}`)

    // Hide search results
    setShowSearchResults(false)
    setSearchQuery("")
  }

  const formatAddress = (address) => {
    const components = []

    if (address.name) components.push(address.name)
    if (address.street) components.push(address.street)
    if (address.city) components.push(address.city)
    if (address.region) components.push(address.region)
    if (address.country) components.push(address.country)

    // If we have a detailed address, use it
    if (components.length > 1) {
      return components.join(", ")
    }

    // Fallback to a simpler format
    return [address.name, address.street, [address.city, address.region].filter(Boolean).join(", "), address.country]
      .filter(Boolean)
      .join(", ")
  }

  const confirmLocation = () => {
    setShowMap(false)
  }

  // Start date picker handlers
  const showStartDatePicker = () => {
    setStartDatePickerVisible(true)
  }

  const hideStartDatePicker = () => {
    setStartDatePickerVisible(false)
  }

  const handleStartDateConfirm = (date) => {
    // Keep the time from the current startDate
    const newDate = new Date(date)
    newDate.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0)

    setStartDate(newDate)
    hideStartDatePicker()

    // If end date is before start date, update end date
    if (endDate < newDate) {
      const updatedEndDate = new Date(newDate)
      updatedEndDate.setHours(newDate.getHours() + 2) // Add 2 hours
      setEndDate(updatedEndDate)
    }
  }

  // Start time picker handlers
  const showStartTimePicker = () => {
    setStartTimePickerVisible(true)
  }

  const hideStartTimePicker = () => {
    setStartTimePickerVisible(false)
  }

  const handleStartTimeConfirm = (time) => {
    // Keep the date from the current startDate
    const newTime = new Date(startDate)
    newTime.setHours(time.getHours(), time.getMinutes(), 0, 0)

    setStartDate(newTime)
    hideStartTimePicker()

    // If end time is before start time on the same day, update end time
    if (
      endDate < newTime &&
      endDate.getDate() === newTime.getDate() &&
      endDate.getMonth() === newTime.getMonth() &&
      endDate.getFullYear() === newTime.getFullYear()
    ) {
      const updatedEndTime = new Date(newTime)
      updatedEndTime.setHours(newTime.getHours() + 2) // Add 2 hours
      setEndDate(updatedEndTime)
    }
  }

  // End date picker handlers
  const showEndDatePicker = () => {
    setEndDatePickerVisible(true)
  }

  const hideEndDatePicker = () => {
    setEndDatePickerVisible(false)
  }

  const handleEndDateConfirm = (date) => {
    // Keep the time from the current endDate
    const newDate = new Date(date)
    newDate.setHours(endDate.getHours(), endDate.getMinutes(), 0, 0)

    setEndDate(newDate)
    hideEndDatePicker()
  }

  // End time picker handlers
  const showEndTimePicker = () => {
    setEndTimePickerVisible(true)
  }

  const hideEndTimePicker = () => {
    setEndTimePickerVisible(false)
  }

  const handleEndTimeConfirm = (time) => {
    // Keep the date from the current endDate
    const newTime = new Date(endDate)
    newTime.setHours(time.getHours(), time.getMinutes(), 0, 0)

    setEndDate(newTime)
    hideEndTimePicker()
  }

  const validateForm = () => {
    const errors = {}

    if (!eventName.trim()) errors.eventName = "Event name is required"
    if (!eventDescription.trim()) errors.eventDescription = "Description is required"
    if (!selectedCategory) errors.category = "Category is required"
    if (!location.trim()) errors.location = "Location is required"
    if (!capacity || isNaN(Number.parseInt(capacity))) errors.capacity = "Valid capacity is required"

    // Validate dates
    if (endDate <= startDate) errors.dates = "End time must be after start time"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Generate a unique event ID (numeric)
      const eventId = Math.floor(Date.now() % 1000000) + Math.floor(Math.random() * 1000)

      // Convert dates to Unix timestamps
      const startTimestamp = Math.floor(startDate.getTime() / 1000)
      const endTimestamp = Math.floor(endDate.getTime() / 1000)

      // Format data according to API requirements
      const eventData = {
        eventName: eventName,
        location: location,
        startTime: startTimestamp,
        endTime: endTimestamp,
        registeredCount: 0,
        eventId: eventId,
        maxParticipants: Number.parseInt(capacity),
        eventCreator: eventCreator,
        // Additional fields that might be useful for the app
        description: eventDescription,
        category: selectedCategory,
        coordinates: locationCoordinates
          ? {
              latitude: locationCoordinates.latitude,
              longitude: locationCoordinates.longitude,
            }
          : null,
      }

      console.log("Submitting event data:", eventData)

      // Make the API call to the updated endpoint
      const response = await fetch("https://quest-generator-two.vercel.app/api/createEvent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      // Check if the request was successful
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error("API error:", errorData || response.statusText)
        throw new Error(errorData?.message || `Server responded with ${response.status}`)
      }

      const result = await response.json()
      console.log("Event created successfully:", result)

      // Show success message
      Alert.alert("Success", "Event created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ])
    } catch (error) {
      console.error("Error creating event:", error)
      Alert.alert("Error", `Failed to create event: ${error.message || "Unknown error"}`, [{ text: "OK" }])
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Form Container */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <BlurView intensity={40} tint="dark" style={styles.formContainer}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Event Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Event Name</Text>
                <View style={[styles.inputContainer, formErrors.eventName && styles.inputError]}>
                  <Tag size={20} color="#94A3B8" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter event name"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={eventName}
                    onChangeText={setEventName}
                  />
                </View>
                {formErrors.eventName && <Text style={styles.errorText}>{formErrors.eventName}</Text>}
              </View>

              {/* Event Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <View style={[styles.textareaContainer, formErrors.eventDescription && styles.inputError]}>
                  <TextInput
                    style={styles.textarea}
                    placeholder="Describe your event"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    multiline
                    numberOfLines={4}
                    value={eventDescription}
                    onChangeText={setEventDescription}
                  />
                </View>
                {formErrors.eventDescription && <Text style={styles.errorText}>{formErrors.eventDescription}</Text>}
              </View>

              {/* Event Creator */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Event Creator</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color="#94A3B8" />
                  <TextInput
                    style={styles.input}
                    placeholder="Your wallet address"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={eventCreator}
                    onChangeText={setEventCreator}
                    editable={false}
                  />
                </View>
                <Text style={styles.helperText}>Using your connected wallet address</Text>
              </View>

              {/* Category Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryContainer}>
                  {eventCategories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        selectedCategory === category.id && {
                          backgroundColor: `${category.color}30`,
                          borderColor: category.color,
                        },
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          selectedCategory === category.id && {
                            color: category.color,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {formErrors.category && <Text style={styles.errorText}>{formErrors.category}</Text>}
              </View>

              {/* Location */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Location</Text>
                <View style={[styles.inputContainer, formErrors.location && styles.inputError]}>
                  <MapPin size={20} color="#94A3B8" />
                  <TextInput
                    style={styles.input}
                    placeholder="Event location"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={location}
                    onChangeText={setLocation}
                  />
                  <TouchableOpacity style={styles.mapButton} onPress={() => setShowMap(true)}>
                    <Text style={styles.mapButtonText}>Map</Text>
                  </TouchableOpacity>
                </View>
                {formErrors.location && <Text style={styles.errorText}>{formErrors.location}</Text>}
              </View>

              {/* Date and Time Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date & Time</Text>

                {/* Start Date/Time */}
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.dateTimeLabel}>Starts</Text>
                  <View style={styles.dateTimeControls}>
                    <TouchableOpacity style={styles.dateTimeButton} onPress={showStartDatePicker}>
                      <CalendarIcon size={18} color="#94A3B8" />
                      <Text style={styles.dateTimeButtonText}>{formatDate(startDate)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dateTimeButton} onPress={showStartTimePicker}>
                      <Clock size={18} color="#94A3B8" />
                      <Text style={styles.dateTimeButtonText}>{formatTime(startDate)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* End Date/Time */}
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.dateTimeLabel}>Ends</Text>
                  <View style={styles.dateTimeControls}>
                    <TouchableOpacity style={styles.dateTimeButton} onPress={showEndDatePicker}>
                      <CalendarIcon size={18} color="#94A3B8" />
                      <Text style={styles.dateTimeButtonText}>{formatDate(endDate)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dateTimeButton} onPress={showEndTimePicker}>
                      <Clock size={18} color="#94A3B8" />
                      <Text style={styles.dateTimeButtonText}>{formatTime(endDate)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {formErrors.dates && <Text style={styles.errorText}>{formErrors.dates}</Text>}

                {/* Modal Date/Time Pickers */}
                <DateTimePickerModal
                  isVisible={isStartDatePickerVisible}
                  mode="date"
                  onConfirm={handleStartDateConfirm}
                  onCancel={hideStartDatePicker}
                  date={startDate}
                  minimumDate={new Date()}
                  themeVariant="dark"
                  buttonTextColorIOS="#7C3AED"
                />

                <DateTimePickerModal
                  isVisible={isStartTimePickerVisible}
                  mode="time"
                  onConfirm={handleStartTimeConfirm}
                  onCancel={hideStartTimePicker}
                  date={startDate}
                  themeVariant="dark"
                  buttonTextColorIOS="#7C3AED"
                />

                <DateTimePickerModal
                  isVisible={isEndDatePickerVisible}
                  mode="date"
                  onConfirm={handleEndDateConfirm}
                  onCancel={hideEndDatePicker}
                  date={endDate}
                  minimumDate={startDate}
                  themeVariant="dark"
                  buttonTextColorIOS="#7C3AED"
                />

                <DateTimePickerModal
                  isVisible={isEndTimePickerVisible}
                  mode="time"
                  onConfirm={handleEndTimeConfirm}
                  onCancel={hideEndTimePicker}
                  date={endDate}
                  themeVariant="dark"
                  buttonTextColorIOS="#7C3AED"
                />
              </View>

              {/* Capacity */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Capacity</Text>
                <View style={[styles.inputContainer, formErrors.capacity && styles.inputError]}>
                  <Users size={20} color="#94A3B8" />
                  <TextInput
                    style={styles.input}
                    placeholder="Maximum number of attendees"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={capacity}
                    onChangeText={setCapacity}
                    keyboardType="number-pad"
                  />
                </View>
                {formErrors.capacity && <Text style={styles.errorText}>{formErrors.capacity}</Text>}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Check size={20} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Create Event</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                By creating this event, you agree to our Terms of Service and Community Guidelines.
              </Text>
            </BlurView>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Map Modal */}
      {showMap && (
        <View style={styles.mapModal}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Select Location</Text>
            <TouchableOpacity onPress={() => setShowMap(false)}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a location"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchLocations}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={searchLocations}
              disabled={isSearching || searchQuery.length === 0}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => `location-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.searchResultItem} onPress={() => selectSearchResult(item)}>
                    <MapPin size={16} color="#7C3AED" />
                    <Text style={styles.searchResultText} numberOfLines={2}>
                      {item.address}
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.searchResultSeparator} />}
              />
            </View>
          )}

          {isLoadingLocation ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.loadingText}>Getting location...</Text>
            </View>
          ) : (
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialCamera={{
                  center: {
                    latitude: locationCoordinates.latitude,
                    longitude: locationCoordinates.longitude,
                  },
                  pitch: 0,
                  heading: 0,
                  altitude: 1000,
                  zoom: 17,
                }}
                provider={PROVIDER_GOOGLE}
                showsUserLocation={locationPermissionGranted}
                showsMyLocationButton={false}
                customMapStyle={mapStyle}
                onRegionChangeComplete={handleCameraMove}
                rotateEnabled={false}
                pitchEnabled={false}
                scrollEnabled={true}
                zoomEnabled={true}
                toolbarEnabled={false}
              />

              {/* Fixed center marker */}
              <View style={styles.markerFixed} pointerEvents="none">
                <MapPin size={36} color="#7C3AED" />
              </View>

              {/* Location info overlay */}
              <View style={styles.locationInfo}>
                <Text style={styles.locationText} numberOfLines={2}>
                  {isLoadingLocation ? "Getting location..." : locationName || "Move map to select location"}
                </Text>
                <Text style={styles.coordinatesText}>
                  {isLoadingLocation
                    ? ""
                    : `${locationCoordinates.latitude.toFixed(6)},${locationCoordinates.longitude.toFixed(6)}`}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.mapFooter}>
            <TouchableOpacity
              style={styles.mapActionButton}
              onPress={getCurrentLocation}
              disabled={!locationPermissionGranted || isLoadingLocation}
            >
              <MapPin size={20} color="#ffffff" />
              <Text style={styles.mapActionButtonText}>My Location</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={confirmLocation} disabled={isLoadingLocation}>
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formContainer: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    marginLeft: 12,
  },
  textareaContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  textarea: {
    color: "#ffffff",
    fontSize: 16,
    textAlignVertical: "top",
    height: 100,
  },
  helperText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 4,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 4,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 8,
  },
  categoryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  mapButton: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapButtonText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "500",
  },
  dateTimeContainer: {
    marginBottom: 12,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 8,
  },
  dateTimeControls: {
    flexDirection: "row",
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dateTimeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    marginTop: 16,
  },
  mapModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
    zIndex: 1000,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  searchResultsContainer: {
    maxHeight: 200,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  searchResultText: {
    color: "#ffffff",
    fontSize: 14,
    flex: 1,
  },
  searchResultSeparator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginLeft: 36,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerFixed: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -18,
    marginTop: -36,
    zIndex: 2,
  },
  locationInfo: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.5)",
  },
  locationText: {
    color: "#ffffff",
    fontSize: 14,
    textAlign: "center",
  },
  mapFooter: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  mapActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  mapActionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 16,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#121212",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 12,
    fontSize: 16,
  },
  coordinatesText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
})
