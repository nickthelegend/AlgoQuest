"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, User, UserPlus, Check, Copy } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { router, useLocalSearchParams } from "expo-router"
import { supabase } from "@/lib/supabase"
import * as SecureStore from "expo-secure-store"
import * as Clipboard from "expo-clipboard"

interface UserProfile {
  id: number
  full_name: string
  roll_number: string
  branch: string
  wallet_address: string
  created_at: string
}

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [isFriend, setIsFriend] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (userId) {
      loadCurrentUser()
      fetchUserProfile(Number(userId))
    }
  }, [userId])

  const loadCurrentUser = async () => {
    try {
      const walletAddress = await SecureStore.getItemAsync("walletAddress")
      if (!walletAddress) return

      const { data, error } = await supabase.from("users").select("id").eq("wallet_address", walletAddress).single()

      if (error) throw error

      setCurrentUserId(data.id)
      checkFriendshipStatus(data.id, Number(userId))
    } catch (error) {
      console.error("Error loading current user:", error)
    }
  }

  const fetchUserProfile = async (id: number) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

      if (error) throw error

      setUserProfile(data)
    } catch (error) {
      console.error("Error fetching user profile:", error)
      Alert.alert("Error", "Failed to load user profile")
    } finally {
      setLoading(false)
    }
  }

  const checkFriendshipStatus = async (currentId: number, targetId: number) => {
    try {
      // Check if they are friends
      const { data: friendData, error: friendError } = await supabase
        .from("friends")
        .select("*")
        .eq("user_id", currentId)
        .eq("friend_id", targetId)
        .single()

      if (!friendError && friendData) {
        setIsFriend(true)
        return
      }

      // Check if friend request is pending
      const { data: requestData, error: requestError } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("sender_id", currentId)
        .eq("receiver_id", targetId)
        .eq("status", "pending")
        .single()

      if (!requestError && requestData) {
        setRequestSent(true)
      }
    } catch (error) {
      console.error("Error checking friendship status:", error)
    }
  }

  const sendFriendRequest = async () => {
    if (!currentUserId || !userProfile) return

    try {
      const { error } = await supabase.from("friend_requests").insert({
        sender_id: currentUserId,
        receiver_id: userProfile.id,
        status: "pending",
      })

      if (error) throw error

      setRequestSent(true)
      Alert.alert("Success", "Friend request sent successfully")
    } catch (error) {
      console.error("Error sending friend request:", error)
      Alert.alert("Error", "Failed to send friend request")
    }
  }

  const copyWalletAddress = async () => {
    if (!userProfile?.wallet_address) return

    await Clipboard.setStringAsync(userProfile.wallet_address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>User Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>User Profile</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>User Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <LinearGradient colors={["#1F1F1F", "#0F0F0F"]} style={StyleSheet.absoluteFill} />
          <View style={styles.avatarContainer}>
            <User size={40} color="#ffffff" />
          </View>
          <Text style={styles.userName}>{userProfile.full_name}</Text>
          <Text style={styles.userMeta}>
            {userProfile.roll_number} • {userProfile.branch}
          </Text>

          {currentUserId !== userProfile.id && (
            <View style={styles.actionContainer}>
              {isFriend ? (
                <View style={styles.friendBadge}>
                  <Check size={16} color="#ffffff" />
                  <Text style={styles.friendBadgeText}>Friends</Text>
                </View>
              ) : requestSent ? (
                <View style={styles.requestSentBadge}>
                  <Check size={16} color="#ffffff" />
                  <Text style={styles.requestSentText}>Request Sent</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.addFriendButton} onPress={sendFriendRequest}>
                  <UserPlus size={20} color="#ffffff" />
                  <Text style={styles.addFriendText}>Add Friend</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.detailsCard}>
          <LinearGradient colors={["#1F1F1F", "#0F0F0F"]} style={StyleSheet.absoluteFill} />
          <Text style={styles.detailsTitle}>Wallet Address</Text>
          <TouchableOpacity style={styles.walletAddressContainer} onPress={copyWalletAddress}>
            <Text style={styles.walletAddress} numberOfLines={1}>
              {userProfile.wallet_address}
            </Text>
            {copied ? <Check size={16} color="#4ADE80" /> : <Copy size={16} color="#ffffff" />}
          </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#ffffff",
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  userMeta: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 16,
  },
  actionContainer: {
    marginTop: 8,
  },
  addFriendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  addFriendText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  friendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4ADE80",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  friendBadgeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  requestSentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 58, 237, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  requestSentText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  detailsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  walletAddressContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  walletAddress: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "monospace",
  },
})

