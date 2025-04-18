"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Vote, Clock, CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import * as Linking from "expo-linking"
import algosdk from "algosdk"
import * as SecureStore from "expo-secure-store"

export default function VoteDAOScreen() {
  const params = useLocalSearchParams()
  const { id, title, description, address } = params
  
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [daoData, setDaoData] = useState<any>(null)
  const [yesVotes, setYesVotes] = useState(0)
  const [noVotes, setNoVotes] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState("")
  const [hasEnded, setHasEnded] = useState(false)
  
  useEffect(() => {
    fetchDAOData()
  }, [id])
  
  const fetchDAOData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`https://testnet-idx.4160.nodely.dev/v2/applications/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch DAO data')
      }
      
      const data = await response.json()
      setDaoData(data)
      
      // Extract vote counts and end time
      const globalState = data.application.params["global-state"]
      
      // Find vote1 (yes votes)
      const vote1 = globalState.find((item: any) => item.key === "dm90ZTE=")
      if (vote1) {
        setYesVotes(vote1.value.uint || 0)
      }
      
      // Find vote2 (no votes)
      const vote2 = globalState.find((item: any) => item.key === "dm90ZTI=")
      if (vote2) {
        setNoVotes(vote2.value.uint || 0)
      }
      
      // Find voting end time
      const endTime = globalState.find((item: any) => item.key === "dm90aW5nRW5kVGltZQ==")
      if (endTime && endTime.value.uint) {
        const now = Math.floor(Date.now() / 1000)
        const timeLeft = endTime.value.uint - now
        
        setHasEnded(timeLeft <= 0)
        
        if (timeLeft > 0) {
          const days = Math.floor(timeLeft / (24 * 60 * 60))
          const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60))
          const minutes = Math.floor((timeLeft % (60 * 60)) / 60)
          
          if (days > 0) {
            setTimeRemaining(`${days}d ${hours}h remaining`)
          } else if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m remaining`)
          } else {
            setTimeRemaining(`${minutes}m remaining`)
          }
        } else {
          setTimeRemaining("Voting ended")
        }
      }
      
    } catch (error) {
      console.error('Error fetching DAO data:', error)
      Alert.alert('Error', 'Failed to load proposal data')
    } finally {
      setLoading(false)
    }
  }
  
  const handleVote = async (voteOption: 'yes' | 'no') => {
    try {
      setVoting(true)
      
      // In a real implementation, you would:
      // 1. Get the user's wallet from secure storage
      // 2. Create and sign a transaction to vote
      // 3. Submit the transaction to the blockchain
      
      // Simulate voting delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate successful vote
      if (voteOption === 'yes') {
        setYesVotes(prev => prev + 1)
      } else {
        setNoVotes(prev => prev + 1)
      }
      
      Alert.alert('Success', `You voted ${voteOption} on this proposal!`)
      
    } catch (error) {
      console.error('Error voting:', error)
      Alert.alert('Error', 'Failed to submit your vote')
    } finally {
      setVoting(false)
    }
  }
  
  const openExplorer = () => {
    Linking.openURL(`https://testnet.algoexplorer.io/application/${id}`)
  }
  
  const totalVotes = yesVotes + noVotes
  const yesPercentage = totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 0
  const noPercentage = totalVotes > 0 ? Math.round((noVotes / totalVotes) * 100) : 0
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Proposal Details</Text>
          <TouchableOpacity style={styles.explorerButton} onPress={openExplorer}>
            <ExternalLink size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading proposal details...</Text>
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(100)}>
              <BlurView intensity={40} tint="dark" style={styles.proposalCard}>
                <View style={styles.proposalHeader}>
                  <Vote size={24} color="#7C3AED" />
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: hasEnded ? "#6B7280" : "#059669" },
                    ]}
                  >
                    <Text style={styles.statusText}>{hasEnded ? "Ended" : "Active"}</Text>
                  </View>
                </View>
                
                <Text style={styles.proposalTitle}>{title}</Text>
                <Text style={styles.proposalDescription}>{description}</Text>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>App ID:</Text>
                  <Text style={styles.infoValue}>{id}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>App Address:</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{address}</Text>
                </View>
                
                <View style={styles.timeContainer}>
                  <Clock size={16} color="#94A3B8" />
                  <Text style={styles.timeText}>{timeRemaining}</Text>
                </View>
              </BlurView>
            </Animated.View>
            
            <Animated.View entering={FadeInDown.delay(200)}>
              <Text style={styles.sectionTitle}>Current Results</Text>
              <BlurView intensity={40} tint="dark" style={styles.resultsCard}>
                <View style={styles.voteStats}>
                  <Text style={styles.totalVotes}>{totalVotes} total votes</Text>
                </View>
                
                <View style={styles.voteOption}>
                  <View style={styles.voteOptionHeader}>
                    <CheckCircle2 size={20} color="#10B981" />
                    <Text style={styles.voteOptionText}>Yes</Text>
                    <Text style={styles.voteCount}>{yesVotes} votes</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        styles.yesBar, 
                        { width: `${yesPercentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.percentage}>{yesPercentage}%</Text>
                </View>
                
                <View style={styles.voteOption}>
                  <View style={styles.voteOptionHeader}>
                    <XCircle size={20} color="#EF4444" />
                    <Text style={styles.voteOptionText}>No</Text>
                    <Text style={styles.voteCount}>{noVotes} votes</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        styles.noBar, 
                        { width: `${noPercentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.percentage}>{noPercentage}%</Text>
                </View>
              </BlurView>
            </Animated.View>
            
            {!hasEnded && (
              <Animated.View entering={FadeInDown.delay(300)} style={styles.votingSection}>
                <Text style={styles.sectionTitle}>Cast Your Vote</Text>
                <BlurView intensity={40} tint="dark" style={styles.votingCard}>
                  <Text style={styles.votingPrompt}>
                    Vote on this proposal to help shape the future of the DAO
                  </Text>
                  
                  <View style={styles.votingButtons}>
                    <TouchableOpacity 
                      style={[styles.voteButton, styles.yesButton]}
                      onPress={() => handleVote('yes')}
                      disabled={voting}
                    >
                      {voting ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <CheckCircle2 size={20} color="#ffffff" />
                          <Text style={styles.voteButtonText}>Vote Yes</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.voteButton, styles.noButton]}
                      onPress={() => handleVote('no')}
                      disabled={voting}
                    >
                      {voting ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <XCircle size={20} color="#ffffff" />
                          <Text style={styles.voteButtonText}>Vote No</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.votingNote}>
                    <AlertCircle size={16} color="#94A3B8" />
                    <Text style={styles.votingNoteText}>
                      Your vote will be recorded on the blockchain and cannot be changed
                    </Text>
                  </View>
                </BlurView>
              </Animated.View>
            )}
          </>
        )}
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
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
  explorerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 16,
    fontSize: 16,
  },
  proposalCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    marginBottom: 24,
  },
  proposalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  proposalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  proposalDescription: {
    fontSize: 16,
    color: "#D1D5DB",
    marginBottom: 20,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: "#94A3B8",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: "#ffffff",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  timeText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  resultsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    marginBottom: 24,
  },
  voteStats: {
    alignItems: "center",
    marginBottom: 16,
  },
  totalVotes: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
  },
  voteOption: {
    marginBottom: 16,
  },
  voteOptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  voteOptionText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  voteCount: {
    fontSize: 14,
    color: "#94A3B8",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  yesBar: {
    backgroundColor: "#10B981",
  },
  noBar: {
    backgroundColor: "#EF4444",
  },
  percentage: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "right",
  },
  votingSection: {
    marginTop: 8,
  },
  votingCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  votingPrompt: {
    fontSize: 16,
    color: "#D1D5DB255,255,0.1)",
    overflow: "hidden",
  },
  votingPrompt: {
    fontSize: 16,
    color: "#D1D5DB",
    marginBottom: 20,
    textAlign: "center",
  },
  votingButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  voteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  yesButton: {
    backgroundColor: "#10B981",
  },
  noButton: {
    backgroundColor: "#EF4444",
  },
  voteButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  votingNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
  },
  votingNoteText: {
    flex: 1,
    fontSize: 14,
    color: "#94A3B8",
  },
})