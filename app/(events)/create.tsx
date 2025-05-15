"use client"

import { useState, useEffect } from "react"
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
} from "react-native"
import { BlurView } from "expo-blur"
import { SafeAreaView } from "react-native-safe-area-context"
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, Check, Tag, User, X, Users } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import DateTimePicker from "@react-native-community/datetimepicker"
import * as SecureStore from "expo-secure-store"
import { router } from "expo-router"
import MapView, { Marker } from "react-native-maps"

// Event categories
const eventCategories = [
  { id: "workshop", name: "Workshop", color: "#7C3AED" },
  { id: "meetup", name: "Meetup", color: "#3B82F6" },
  { id: "hackathon", name: "Hackathon", color: "#EF4444" },
  { id: "conference", name: "Conference", color: "#10B981" },
  { id: "other", name: "Other", color: "#F59E0B" },
]

export default function CreateEventScreen() {
  // Form state
  const [eventName, setEventName] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventCreator, setEventCreator] = useState("")
  const [location, setLocation] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [capacity, setCapacity] = useState("")

  // Date and time state
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000)) // 2 hours from now
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)

  // Map state
  const [showMap, setShowMap] = useState(false)
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })
  const [selectedLocation, setSelectedLocation] = useState(null)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    loadWalletAddress()
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

  const handleStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate
    setShowStartDatePicker(false)
    setStartDate(currentDate)

    // If end date is before start date, update end date
    if (endDate < currentDate) {
      setEndDate(new Date(currentDate.getTime() + 2 * 60 * 60 * 1000))
    }
  }

  const handleStartTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || startDate
    setShowStartTimePicker(false)
    setStartDate(currentTime)

    // If end time is before start time on the same day, update end time
    if (
      endDate < currentTime &&
      endDate.getDate() === currentTime.getDate() &&
      endDate.getMonth() === currentTime.getMonth() &&
      endDate.getFullYear() === currentTime.getFullYear()
    ) {
      setEndDate(new Date(currentTime.getTime() + 2 * 60 * 60 * 1000))
    }
  }

  const handleEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate
    setShowEndDatePicker(false)
    setEndDate(currentDate)
  }

  const handleEndTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || endDate
    setShowEndTimePicker(false)
    setEndDate(currentTime)
  }

  const handleMapPress = (e) => {
    setSelectedLocation(e.nativeEvent.coordinate)
    setMapRegion({
      ...mapRegion,
      latitude: e.nativeEvent.coordinate.latitude,
      longitude: e.nativeEvent.coordinate.longitude,
    })
  }

  const confirmLocation = () => {
    if (selectedLocation) {
      setLocation(`${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`)
    }
    setShowMap(false)
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
      // Generate a unique event ID
      const eventId = `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`

      // Convert dates to Unix timestamps
      const startTimestamp = Math.floor(startDate.getTime() / 1000)
      const endTimestamp = Math.floor(endDate.getTime() / 1000)

      // Create event object
      const eventData = {
        id: eventId,
        name: eventName,
        description: eventDescription,
        creator: eventCreator,
        location: location,
        startTime: startTimestamp,
        endTime: endTimestamp,
        category: selectedCategory,
        capacity: Number.parseInt(capacity),
        attendees: [],
        createdAt: Math.floor(Date.now() / 1000),
      }

      // In a real app, you would save this to your backend
      console.log("Event created:", eventData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Show success and navigate back
      alert("Event created successfully!")
      router.back()
    } catch (error) {
      console.error("Error creating event:", error)
      alert("Failed to create event. Please try again.")
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
                    <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowStartDatePicker(true)}>
                      <CalendarIcon size={18} color="#94A3B8" />
                      <Text style={styles.dateTimeButtonText}>{formatDate(startDate)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowStartTimePicker(true)}>
                      <Clock size={18} color="#94A3B8" />
                      <Text style={styles.dateTimeButtonText}>{formatTime(startDate)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* End Date/Time */}
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.dateTimeLabel}>Ends</Text>
                  <View style={styles.dateTimeControls}>
                    <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowEndDatePicker(true)}>
                      <CalendarIcon size={18} color="#94A3B8" />
                      <Text style={styles.dateTimeButtonText}>{formatDate(endDate)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowEndTimePicker(true)}>
                      <Clock size={18} color="#94A3B8" />
                      <Text style={styles.dateTimeButtonText}>{formatTime(endDate)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {formErrors.dates && <Text style={styles.errorText}>{formErrors.dates}</Text>}

                {/* Date/Time Pickers (iOS) */}
                {Platform.OS === "ios" && (
                  <>
                    {showStartDatePicker && (
                      <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="spinner"
                        onChange={handleStartDateChange}
                      />
                    )}
                    {showStartTimePicker && (
                      <DateTimePicker
                        value={startDate}
                        mode="time"
                        display="spinner"
                        onChange={handleStartTimeChange}
                      />
                    )}
                    {showEndDatePicker && (
                      <DateTimePicker
                        value={endDate}
                        mode="date"
                        display="spinner"
                        onChange={handleEndDateChange}
                        minimumDate={startDate}
                      />
                    )}
                    {showEndTimePicker && (
                      <DateTimePicker value={endDate} mode="time" display="spinner" onChange={handleEndTimeChange} />
                    )}
                  </>
                )}

                {/* Date/Time Pickers (Android) */}
                {Platform.OS === "android" && (
                  <>
                    {showStartDatePicker && (
                      <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="default"
                        onChange={handleStartDateChange}
                      />
                    )}
                    {showStartTimePicker && (
                      <DateTimePicker
                        value={startDate}
                        mode="time"
                        display="default"
                        onChange={handleStartTimeChange}
                      />
                    )}
                    {showEndDatePicker && (
                      <DateTimePicker
                        value={endDate}
                        mode="date"
                        display="default"
                        onChange={handleEndDateChange}
                        minimumDate={startDate}
                      />
                    )}
                    {showEndTimePicker && (
                      <DateTimePicker value={endDate} mode="time" display="default" onChange={handleEndTimeChange} />
                    )}
                  </>
                )}
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

          <MapView style={styles.map} region={mapRegion} onPress={handleMapPress}>
            {selectedLocation && <Marker coordinate={selectedLocation} title="Event Location" />}
          </MapView>

          <View style={styles.mapFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowMap(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]}
              onPress={confirmLocation}
              disabled={!selectedLocation}
            >
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
  map: {
    flex: 1,
  },
  mapFooter: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingVertical: 16,
  },
  cancelButtonText: {
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
})
