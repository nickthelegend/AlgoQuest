"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, Search, UserPlus, Check, User } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { supabase } from "@/lib/supabase"
import * as SecureStore from "expo-secure-store"

interface UserProfile {
  id: string
  full_name: string
  roll_number: string
  branch: string
  wallet_address: string
  created_at: string
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUserWallet, setCurrentUserWallet] = useState<string | null>(null)
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({}) // Changed to string key

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const walletAddress = await SecureStore.getItemAsync("walletAddress")
      setCurrentUserWallet(walletAddress)
    } catch (error) {
      console.error("Error loading wallet address:", error)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim() || !currentUserWallet) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .or(`full_name.ilike.%${searchQuery}%,roll_number.ilike.%${searchQuery}%`)
        .neq("wallet_address", currentUserWallet)
        .limit(20)

      if (error) throw error

      // Check which users already have pending friend requests
      if (data && data.length > 0) {
        const userIds = data.map((user) => user.id)

        // Get current user's ID
        const { data: currentUserData, error: currentUserError } = await supabase
          .from("users")
          .select("id")
          .eq("wallet_address", currentUserWallet)
          .single()

        if (currentUserError) throw currentUserError

        // Check for existing friend requests
        const { data: requestsData, error: requestsError } = await supabase
          .from("friend_requests")
          .select("receiver_id")
          .eq("sender_id", currentUserData.id)
          .in("receiver_id", userIds)

        if (requestsError) throw requestsError

        // Create a map of sent requests
        const requestMap: Record<string, boolean> = {} // Changed to string key
        if (requestsData) {
          requestsData.forEach((request) => {
            requestMap[request.receiver_id] = true
          })
        }

        setSentRequests(requestMap)
      }

      setUsers(data || [])
    } catch (error) {
      console.error("Error searching users:", error)
      Alert.alert("Error", "Failed to search users")
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (receiverId: string) => { // Changed to string parameter
    try {
      if (!currentUserWallet) {
        Alert.alert("Error", "You need to be logged in to send friend requests")
        return
      }

      // Get current user's ID
      const { data: currentUserData, error: currentUserError } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", currentUserWallet)
        .single()

      if (currentUserError) throw currentUserError

      // Send friend request
      const { error } = await supabase.from("friend_requests").insert({
        sender_id: currentUserData.id,
        receiver_id: receiverId,
        status: "pending",
      })

      if (error) throw error

      // Update local state to show request was sent
      setSentRequests((prev) => ({
        ...prev,
        [receiverId]: true,
      }))

      Alert.alert("Success", "Friend request sent successfully")
    } catch (error) {
      console.error("Error sending friend request:", error)
      Alert.alert("Error", "Failed to send friend request")
    }
  }

  const viewUserProfile = (userId: string) => { // Changed to string parameter
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
        <Text style={styles.title}>Search Users</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="rgba(255, 255, 255, 0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or roll number..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchUsers}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={searchUsers}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id} // Removed toString() since id is already string
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <LinearGradient colors={["#1F1F1F", "#0F0F0F"]} style={StyleSheet.absoluteFill} />
              <TouchableOpacity style={styles.userInfo} onPress={() => viewUserProfile(item.id)}>
                <View style={styles.avatarContainer}>
                  <User size={24} color="#ffffff" />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{item.full_name}</Text>
                  <Text style={styles.userMeta}>
                    {item.roll_number} • {item.branch}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, sentRequests[item.id] && styles.actionButtonDisabled]}
                onPress={() => !sentRequests[item.id] && sendFriendRequest(item.id)}
                disabled={sentRequests[item.id]}
              >
                {sentRequests[item.id] ? <Check size={20} color="#ffffff" /> : <UserPlus size={20} color="#ffffff" />}
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            searchQuery.trim() ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    marginLeft: 8,
    height: 50,
  },
  searchButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: {
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
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  userInfo: {
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
  userDetails: {
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
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonDisabled: {
    backgroundColor: "rgba(124, 58, 237, 0.5)",
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

