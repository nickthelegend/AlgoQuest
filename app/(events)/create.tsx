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
import DateTimePickerModal from "react-native-modal-datetime-picker"
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
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false)
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false)
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false)
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false)

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
      }

      console.log("Submitting event data:", eventData)

      // Make the API call
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
      alert("Event created successfully!")

      // Navigate back to events list
      router.back()
    } catch (error) {
      console.error("Error creating event:", error)
      alert(`Failed to create event: ${error.message || "Unknown error"}`)
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
