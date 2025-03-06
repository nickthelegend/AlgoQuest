"use client"

import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Vote, Clock, ArrowLeft, Plus } from "lucide-react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown } from "react-native-reanimated"
import ScreenLayout from "@/components/screen-layout"
import { router } from "expo-router"

const proposals = [
  {
    id: 1,
    title: "Campus Food Court Expansion",
    status: "Active",
    votes: 234,
    endDate: "2d 5h remaining",
  },
  {
    id: 2,
    title: "New Study Space Hours",
    status: "Active",
    votes: 156,
    endDate: "5d remaining",
  },
  {
    id: 3,
    title: "Blockchain Workshop Series",
    status: "Ended",
    votes: 489,
    endDate: "Passed",
  },
]

export default function DAOScreen() {
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
      <View style={styles.proposalsGrid}>
        {proposals.map((proposal, index) => (
          <Animated.View key={proposal.id} entering={FadeInDown.delay(200 * index)}>
            <BlurView intensity={40} tint="dark" style={styles.proposalCard}>
              <View style={styles.proposalHeader}>
                <Vote size={20} color="#7C3AED" />
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: proposal.status === "Active" ? "#059669" : "#6B7280" },
                  ]}
                >
                  <Text style={styles.statusText}>{proposal.status}</Text>
                </View>
              </View>
              <Text style={styles.proposalTitle}>{proposal.title}</Text>
              <View style={styles.proposalFooter}>
                <Text style={styles.voteCount}>{proposal.votes} votes</Text>
                <View style={styles.timeRemaining}>
                  <Clock size={16} color="#94A3B8" />
                  <Text style={styles.timeText}>{proposal.endDate}</Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        ))}
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
  proposalsGrid: {
    gap: 16,
  },
  proposalCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
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
    marginBottom: 16,
  },
  proposalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voteCount: {
    color: "#94A3B8",
    fontSize: 14,
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
})

