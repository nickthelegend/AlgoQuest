"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, ChevronRight, Star } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import ScreenLayout from "../../components/screen-layout"

const upcomingEvents = [
  {
    id: 1,
    title: "Blockchain Workshop",
    date: "Mar 15",
    time: "2:00 PM",
    location: "Tech Hub",
    attendees: 45,
    category: "Workshop",
    isHighlighted: true,
  },
  {
    id: 2,
    title: "Web3 Meetup",
    date: "Mar 18",
    time: "5:30 PM",
    location: "Innovation Center",
    attendees: 32,
    category: "Networking",
    isHighlighted: false,
  },
  {
    id: 3,
    title: "DeFi Discussion",
    date: "Mar 20",
    time: "3:00 PM",
    location: "Virtual",
    attendees: 28,
    category: "Discussion",
    isHighlighted: false,
  },
]

const thisWeek = [
  {
    day: "MON",
    date: "13",
    hasEvent: false,
  },
  {
    day: "TUE",
    date: "14",
    hasEvent: false,
  },
  {
    day: "WED",
    date: "15",
    hasEvent: true,
    isToday: true,
  },
  {
    day: "THU",
    date: "16",
    hasEvent: false,
  },
  {
    day: "FRI",
    date: "17",
    hasEvent: false,
  },
  {
    day: "SAT",
    date: "18",
    hasEvent: true,
  },
  {
    day: "SUN",
    date: "19",
    hasEvent: false,
  },
]

export default function EventsScreen() {
  return (
    <ScreenLayout>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Events</Text>
          <Text style={styles.subtitle}>March 2024</Text>
        </View>
        <TouchableOpacity style={styles.hostButton}>
          <Plus size={20} color="#ffffff" />
          <Text style={styles.hostButtonText}>Host Event</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Strip */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.calendarStrip}>
        <BlurView intensity={40} tint="dark" style={styles.calendarContent}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysContainer}>
            {thisWeek.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.dayItem, day.isToday && styles.todayItem, day.hasEvent && styles.hasEventItem]}
              >
                <Text style={[styles.dayText, (day.isToday || day.hasEvent) && styles.activeText]}>{day.day}</Text>
                <Text style={[styles.dateText, (day.isToday || day.hasEvent) && styles.activeText]}>{day.date}</Text>
                {day.hasEvent && <View style={styles.eventDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BlurView>
      </Animated.View>

      {/* Featured Event */}
      <Animated.View entering={FadeInDown.delay(400)}>
        <BlurView intensity={40} tint="dark" style={styles.featuredEvent}>
          <LinearGradient
            colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.featuredHeader}>
            <Star size={20} color="#7C3AED" />
            <Text style={styles.featuredTag}>Featured Event</Text>
          </View>
          <Text style={styles.featuredTitle}>Campus Hackathon 2024</Text>
          <Text style={styles.featuredDescription}>
            Join us for a 24-hour hackathon focused on building decentralized applications.
          </Text>
          <View style={styles.featuredDetails}>
            <View style={styles.detailItem}>
              <CalendarIcon size={16} color="#94A3B8" />
              <Text style={styles.detailText}>March 25</Text>
            </View>
            <View style={styles.detailItem}>
              <Clock size={16} color="#94A3B8" />
              <Text style={styles.detailText}>9:00 AM</Text>
            </View>
            <View style={styles.detailItem}>
              <MapPin size={16} color="#94A3B8" />
              <Text style={styles.detailText}>Main Campus</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Register Now</Text>
            <ChevronRight size={20} color="#ffffff" />
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <View style={styles.eventsList}>
          {upcomingEvents.map((event, index) => (
            <Animated.View key={event.id} entering={FadeInDown.delay(600 + index * 100)}>
              <TouchableOpacity>
                <BlurView intensity={40} tint="dark" style={styles.eventCard}>
                  {event.isHighlighted && (
                    <LinearGradient
                      colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <View style={styles.eventHeader}>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventDetails}>
                        <View style={styles.detailItem}>
                          <CalendarIcon size={16} color="#94A3B8" />
                          <Text style={styles.detailText}>{event.date}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Clock size={16} color="#94A3B8" />
                          <Text style={styles.detailText}>{event.time}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.categoryTag, event.isHighlighted && styles.highlightedTag]}>
                      <Text style={[styles.categoryText, event.isHighlighted && styles.highlightedText]}>
                        {event.category}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.eventFooter}>
                    <View style={styles.detailItem}>
                      <MapPin size={16} color="#94A3B8" />
                      <Text style={styles.detailText}>{event.location}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Users size={16} color="#94A3B8" />
                      <Text style={styles.detailText}>{event.attendees} attending</Text>
                    </View>
                  </View>
                </BlurView>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
  },
  hostButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hostButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  calendarStrip: {
    marginBottom: 24,
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
    width: 48,
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  todayItem: {
    backgroundColor: "#7C3AED",
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
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  activeText: {
    color: "#ffffff",
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#7C3AED",
    marginTop: 4,
  },
  featuredEvent: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  featuredHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  featuredTag: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 16,
  },
  featuredDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
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
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
  },
  registerButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  eventDetails: {
    flexDirection: "row",
    gap: 12,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  highlightedTag: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
  },
  categoryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  highlightedText: {
    color: "#7C3AED",
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
})

