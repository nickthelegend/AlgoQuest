"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Modal, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { ArrowLeft, Flame, Search, Filter, Plus, Users, Info, X, AlertCircle, ShieldAlert } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { router } from "expo-router"
import { supabase } from "@/lib/supabase"
import * as SecureStore from "expo-secure-store"

interface Friend {
  id: string
  full_name: string
  roll_number: string
  branch: string
  streak_days: number
  avatar_url: string | null
}

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [freezeModalVisible, setFreezeModalVisible] = useState(false)
  const [freezeReason, setFreezeReason] = useState("")
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const walletAddress = await SecureStore.getItemAsync("walletAddress")
      if (!walletAddress) return

      const { data, error } = await supabase.from("users").select("id").eq("wallet_address", walletAddress).single()

      if (error) throw error

      setCurrentUserId(data.id)
      fetchFriends(data.id)
    } catch (error) {
      console.error("Error loading current user:", error)
    }
  }
  const fetchFriends = async (userId: string) => {
    try {
      setLoading(true)

      // Fetch friends from the friends table
      const { data: friendsData, error: friendsError } = await supabase
        .from("friends")
        .select(`
          friend_id,
          friend:friend_id(
            id,
            full_name,
            roll_number,
            branch
          )
        `)
        .eq("user_id", userId)

      if (friendsError) throw friendsError

      if (friendsData && friendsData.length > 0) {
        // Transform the data to match our Friend interface
        const formattedFriends: Friend[] = friendsData.map((item: any) => ({
          id: item.friend.id,
          full_name: item.friend.full_name,
          roll_number: item.friend.roll_number,
          branch: item.friend.branch,
          streak_days: Math.floor(Math.random() * 10) + 1,
          avatar_url: null,
        }))

        // Update mock avatars for a nice UI
        if (formattedFriends.length > 0) {
          formattedFriends[0].avatar_url =
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7BC5DA1ABA-D239-47BF-86A4-7F62F953B61C%7D-oDh5OOGSt6RLj6h8lnARTFRGEVF7dC.png"
        }
        if (formattedFriends.length > 1) {
          formattedFriends[1].avatar_url =
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B2B6DD035-1075-4F47-B2F1-DABE23BB2ECB%7D-45Wli9AJqOF6pzxNlZ6Axi54cw1bDu.png"
        }
        if (formattedFriends.length > 2) {
          formattedFriends[2].avatar_url = "https://forkast.news/wp-content/uploads/2022/03/NFT-Avatar.png"
        }

        setFriends(formattedFriends)
      } else {
        // If no friends exist, fallback to mock data for demo
        const mockFriends: Friend[] = [
          {
            id: "1", // Changed to string UUID
            full_name: "Alex Johnson",
            roll_number: "CS21B001",
            branch: "Computer Science",
            streak_days: 7,
            avatar_url:
              "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7BC5DA1ABA-D239-47BF-86A4-7F62F953B61C%7D-oDh5OOGSt6RLj6h8lnARTFRGEVF7dC.png",
          },
          {
            id: "2", // Changed to string UUID
            full_name: "Sarah Kim",
            roll_number: "CS21B045",
            branch: "Computer Science",
            streak_days: 5,
            avatar_url:
              "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B2B6DD035-1075-4F47-B2F1-DABE23BB2ECB%7D-45Wli9AJqOF6pzxNlZ6Axi54cw1bDu.png",
          },
          {
            id: "3", // Changed to string UUID
            full_name: "Mike Chen",
            roll_number: "EE21B032",
            branch: "Electrical Engineering",
            streak_days: 3,
            avatar_url: "https://forkast.news/wp-content/uploads/2022/03/NFT-Avatar.png",
          },
        ]

        setFriends(mockFriends)
      }
    } catch (error) {
      console.error("Error loading friends:", error)
    } finally {
      setLoading(false)
    }
  }

  const navigateToStreakInfo = () => {
    router.push("/streak-info")
  }

  const handleFreezeStreak = () => {
    if (freezeReason.trim().length > 0) {
      // Here you would call an API to freeze the streak
      // For now we just close the modal
      setFreezeModalVisible(false)
      setFreezeReason("")
    }
  }

  const filteredFriends = searchQuery
    ? friends.filter(
        (friend) =>
          friend.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          friend.roll_number.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : friends

  const renderFriendItem = ({ item, index }: { item: Friend; index: number }) => (
    <Animated.View entering={FadeInDown.delay(100 * index)}>
      <BlurView intensity={40} tint="dark" style={styles.friendCard}>
        <LinearGradient colors={["#1F1F1F", "#0F0F0F"]} style={StyleSheet.absoluteFill} />
        <View style={styles.friendInfo}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {item.full_name
                  .split(" ")
                  .map((name) => name[0])
                  .join("")}
              </Text>
            </View>
          )}
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{item.full_name}</Text>
            <Text style={styles.friendMeta}>
              {item.roll_number} • {item.branch}
            </Text>
          </View>
        </View>
        <View style={styles.streakContainer}>
          <View style={styles.streakBadge}>
            <Flame size={14} color="#FF5757" />
            <Text style={styles.streakText}>{item.streak_days} days</Text>
          </View>
          <TouchableOpacity style={styles.sendStreakButton}>
            <Plus size={16} color="#ffffff" />
            <Text style={styles.sendStreakText}>Send Streak</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Streak Squad</Text>
        <TouchableOpacity onPress={navigateToStreakInfo} style={styles.infoButton}>
          <Info size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="rgba(255, 255, 255, 0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <BlurView intensity={40} tint="dark" style={styles.statsCard}>
          <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.statItem}>
            <Flame size={20} color="#FF5757" />
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Users size={20} color="#7C3AED" />
            <Text style={styles.statValue}>{friends.length}</Text>
            <Text style={styles.statLabel}>Squad Members</Text>
          </View>
        </BlurView>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity onPress={() => setFreezeModalVisible(true)} style={styles.freezeButton}>
          <ShieldAlert size={18} color="#ffffff" />
          <Text style={styles.freezeButtonText}>Freeze Streak</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredFriends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No friends found</Text>
          </View>
        }
      />

      {/* Freeze Streak Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={freezeModalVisible}
        onRequestClose={() => setFreezeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={styles.modalContainer}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Freeze Streak</Text>
              <TouchableOpacity onPress={() => setFreezeModalVisible(false)} style={styles.closeButton}>
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.freezeInfo}>
              <AlertCircle size={20} color="#FF5757" />
              <Text style={styles.freezeInfoText}>You have 3 streak freezes left</Text>
            </View>

            <Text style={styles.modalLabel}>Why do you want to freeze your streak?</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={freezeReason}
              onChangeText={setFreezeReason}
              multiline={true}
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.confirmFreezeButton, { opacity: freezeReason.trim().length > 0 ? 1 : 0.5 }]}
              disabled={freezeReason.trim().length === 0}
              onPress={handleFreezeStreak}
            >
              <Text style={styles.confirmButtonText}>Confirm Freeze</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
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
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    paddingHorizontal: 12,
  },
  filterButton: {
    padding: 8,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsCard: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    gap: 4,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  freezeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 87, 87, 0.3)",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 87, 87, 0.5)",
  },
  freezeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarInitials: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  friendMeta: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  streakContainer: {
    alignItems: "flex-end",
    gap: 8,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 87, 87, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakText: {
    color: "#FF5757",
    fontSize: 12,
    fontWeight: "600",
  },
  sendStreakButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  sendStreakText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  freezeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 87, 87, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  freezeInfoText: {
    color: "#ffffff",
    fontSize: 14,
  },
  modalLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  reasonInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    color: "#ffffff",
    fontSize: 16,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  confirmFreezeButton: {
    backgroundColor: "#FF5757",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})

