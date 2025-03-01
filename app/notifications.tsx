"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, User, Check, X } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { supabase } from "@/lib/supabase"
import * as SecureStore from "expo-secure-store"

interface FriendRequest {
  id: string
  sender_id: number
  receiver_id: number
  status: string
  created_at: string
  sender: {
    full_name: string
    roll_number: string
    branch: string
  }[]
}
export default function NotificationsScreen() {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const walletAddress = await SecureStore.getItemAsync("walletAddress")
      if (!walletAddress) {
        Alert.alert("Error", "You need to be logged in to view notifications")
        return
      }

      const { data, error } = await supabase.from("users").select("id").eq("wallet_address", walletAddress).single()

      if (error) throw error

      setCurrentUserId(data.id)
      fetchFriendRequests(data.id)
    } catch (error) {
      console.error("Error loading current user:", error)
      Alert.alert("Error", "Failed to load user data")
    }
  }

  const fetchFriendRequests = async (userId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("friend_requests")
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          sender:sender_id(full_name, roll_number, branch)
        `)
        .eq("receiver_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error

      setFriendRequests(data || [])
    } catch (error) {
      console.error("Error fetching friend requests:", error)
      Alert.alert("Error", "Failed to load friend requests")
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    if (!currentUserId) return

    try {
      // Update request status to accepted
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId)

      if (updateError) throw updateError

      // Add to friends table (both directions for easy querying)
      const { error: friendError1 } = await supabase.from("friends").insert({
        user_id: currentUserId,
        friend_id: senderId,
      })

      if (friendError1) throw friendError1

      const { error: friendError2 } = await supabase.from("friends").insert({
        user_id: senderId,
        friend_id: currentUserId,
      })

      if (friendError2) throw friendError2

      // Update local state
      setFriendRequests((prev) => prev.filter((request) => request.id !== requestId))

      Alert.alert("Success", "Friend request accepted")
    } catch (error) {
      console.error("Error accepting friend request:", error)
      Alert.alert("Error", "Failed to accept friend request")
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.from("friend_requests").delete().eq("id", requestId)

      if (error) throw error

      // Update local state
      setFriendRequests((prev) => prev.filter((request) => request.id !== requestId))

      Alert.alert("Success", "Friend request rejected")
    } catch (error) {
      console.error("Error rejecting friend request:", error)
      Alert.alert("Error", "Failed to reject friend request")
    }
  }

  const viewUserProfile = (userId: string) => {
    router.push({
      pathname: "/user-profile",
      params: { userId },
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friend Requests</Text>
            {friendRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{friendRequests.length}</Text>
              </View>
            )}
          </View>

          <FlatList
            data={friendRequests}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.requestCard}>
                <LinearGradient colors={["#1F1F1F", "#0F0F0F"]} style={StyleSheet.absoluteFill} />
                <TouchableOpacity style={styles.requestInfo} onPress={() => viewUserProfile(item.sender_id)}>
                  <View style={styles.avatarContainer}>
                    <User size={24} color="#ffffff" />
                  </View>
                  <View style={styles.requestDetails}>
                    <Text style={styles.userName}>{item.sender.full_name}</Text>
                    <Text style={styles.userMeta}>
                      {item.sender.roll_number} • {item.sender.branch}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAcceptRequest(item.id, item.sender_id)}
                  >
                    <Check size={20} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRejectRequest(item.id)}
                  >
                    <X size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No friend requests</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        </>
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
    padding: 16,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginLeft: 16,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  badge: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  requestInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  requestDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButton: {
    backgroundColor: "#4ADE80",
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
  },
})

