"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from "react-native"
import { Vote, Clock, ArrowLeft, Plus, FileText, Hash } from "lucide-react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown } from "react-native-reanimated"
import ScreenLayout from "@/components/screen-layout"
import { router } from "expo-router"
import { supabase } from "@/lib/supabase"

interface DAO {
  id: number
  app_id: string
  app_address: string
  title: string
  description: string
  duration: number
  created_at: string
}

export default function DAOScreen() {
  const [daos, setDaos] = useState<DAO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDAOs()
  }, [])

  const fetchDAOs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('daos')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      if (data) {
        setDaos(data)
      }
    } catch (error) {
      console.error('Error fetching DAOs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeRemaining = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000)
    const timeLeft = timestamp - now
    
    if (timeLeft <= 0) return "Ended"
    
    const days = Math.floor(timeLeft / (24 * 60 * 60))
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60))
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`
    } else {
      const minutes = Math.floor((timeLeft % (60 * 60)) / 60)
      return `${hours}h ${minutes}m remaining`
    }
  }

  const handleDAOPress = (dao: DAO) => {
    router.push({
      pathname: "/vote-dao",
      params: { 
        id: dao.app_id,
        title: dao.title,
        description: dao.description,
        address: dao.app_address
      }
    })
  }

  const renderDAO = ({ item, index }: { item: DAO, index: number }) => {
    const isActive = item.duration > Math.floor(Date.now() / 1000)
    const timeRemaining = formatTimeRemaining(item.duration)
    
    return (
      <Animated.View entering={FadeInDown.delay(100 * index)}>
        <TouchableOpacity onPress={() => handleDAOPress(item)}>
          <BlurView intensity={40} tint="dark" style={styles.proposalCard}>
            <View style={styles.proposalHeader}>
              <Vote size={20} color="#7C3AED" />
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: isActive ? "#059669" : "#6B7280" },
                ]}
              >
                <Text style={styles.statusText}>{isActive ? "Active" : "Ended"}</Text>
              </View>
            </View>
            <Text style={styles.proposalTitle}>{item.title}</Text>
            <Text style={styles.proposalDescription} numberOfLines={2}>{item.description}</Text>
            
            <View style={styles.idContainer}>
              <Hash size={14} color="#94A3B8" />
              <Text style={styles.idText}>App ID: {item.app_id}</Text>
            </View>
            
            <View style={styles.proposalFooter}>
              <TouchableOpacity 
                style={styles.voteButton}
                onPress={() => handleDAOPress(item)}
                disabled={!isActive}
              >
                <Text style={styles.voteButtonText}>Vote Now</Text>
              </TouchableOpacity>
              <View style={styles.timeRemaining}>
                <Clock size={16} color="#94A3B8" />
                <Text style={styles.timeText}>{timeRemaining}</Text>
              </View>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DAO Proposals</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.infoButton} onPress={() => router.push("/what-is-dao")}>
            <Text style={styles.infoButtonText}>Info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton} onPress={() => router.push("/create-dao")}>
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <BlurView intensity={30} tint="dark" style={styles.statsCard}>
          <Text style={styles.statsNumber}>{daos.length}</Text>
          <Text style={styles.statsLabel}>Total Proposals</Text>
        </BlurView>
        <BlurView intensity={30} tint="dark" style={styles.statsCard}>
          <Text style={styles.statsNumber}>
            {daos.filter(dao => dao.duration > Math.floor(Date.now() / 1000)).length}
          </Text>
          <Text style={styles.statsLabel}>Active Proposals</Text>
        </BlurView>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading proposals...</Text>
        </View>
      ) : daos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={48} color="#6B7280" />
          <Text style={styles.emptyTitle}>No proposals yet</Text>
          <Text style={styles.emptyDescription}>
            Create a new proposal to get started with your DAO
          </Text>
          <TouchableOpacity 
            style={styles.createProposalButton}
            onPress={() => router.push("/create-dao")}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.createProposalText}>Create Proposal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={daos}
          renderItem={renderDAO}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.proposalsGrid}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>All Proposals ({daos.length})</Text>
          }
        />
      )}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: "#94A3B8",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  proposalsGrid: {
    gap: 16,
    paddingBottom: 100,
  },
  proposalCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    marginBottom: 16,
  },
  proposalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  proposalDescription: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 12,
  },
  idContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  idText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  proposalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voteButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  voteButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  timeRemaining: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  createProposalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createProposalText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})