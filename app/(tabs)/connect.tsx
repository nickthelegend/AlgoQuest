"use client"

import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import { BlurView } from "expo-blur"
import { Search, Users, UserPlus, MessageCircle } from "lucide-react-native"

export default function ConnectScreen() {
  const nearbyUsers = [
    { id: 1, name: "Sarah Kim", university: "Stanford", distance: "5m away" },
    { id: 2, name: "Mike Chen", university: "Stanford", distance: "10m away" },
    { id: 3, name: "Emma Watson", university: "Stanford", distance: "15m away" },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.searchContainer}>
          <BlurView intensity={40} tint="dark" style={styles.searchBar}>
            <Search size={20} color="rgba(255, 255, 255, 0.6)" />
            <TextInput
              placeholder="Search nearby students..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              style={styles.searchInput}
            />
          </BlurView>
        </Animated.View>

        {/* Nearby Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#ffffff" />
            <Text style={styles.sectionTitle}>Nearby Students</Text>
          </View>
          <View style={styles.usersList}>
            {nearbyUsers.map((user, index) => (
              <Animated.View key={user.id} entering={FadeIn.delay(400 + index * 200)}>
                <BlurView intensity={40} tint="dark" style={styles.userCard}>
                  <Image
                    source={{
                      uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7BC5DA1ABA-D239-47BF-86A4-7F62F953B61C%7D-oDh5OOGSt6RLj6h8lnARTFRGEVF7dC.png",
                    }}
                    style={styles.userAvatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userUniversity}>{user.university}</Text>
                    <Text style={styles.userDistance}>{user.distance}</Text>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <UserPlus size={20} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <MessageCircle size={20} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    padding: 16,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    padding: 0,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  userUniversity: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  userDistance: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 4,
  },
  userActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
})

