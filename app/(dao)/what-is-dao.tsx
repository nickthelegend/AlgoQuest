"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Vote, Users, Settings, Award } from "lucide-react-native"
import { router } from "expo-router"

export default function WhatIsDAOScreen() {
  const [expandedSection, setExpandedSection] = useState<string | null>("what")

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>What is a DAO?</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(100)}>
          <BlurView intensity={40} tint="dark" style={styles.introCard}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <Vote size={32} color="#7C3AED" style={styles.introIcon} />
            <Text style={styles.introTitle}>Decentralized Autonomous Organization</Text>
            <Text style={styles.introText}>
              A DAO is a community-led entity with no central authority. It's fully autonomous and transparent, with
              decisions governed by a community organized around a specific set of rules enforced on a blockchain.
            </Text>
          </BlurView>
        </Animated.View>

        <View style={styles.sectionsContainer}>
          <Animated.View entering={FadeInDown.delay(200)}>
            <TouchableOpacity
              style={[styles.sectionCard, expandedSection === "what" && styles.expandedCard]}
              onPress={() => toggleSection("what")}
            >
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.sectionHeader}>
                <Users size={24} color="#3B82F6" />
                <Text style={styles.sectionTitle}>How DAO Governance Works</Text>
              </View>
              {expandedSection === "what" && (
                <Text style={styles.sectionContent}>
                  In our Campus Blockchain app, the DAO allows students and faculty to collectively make decisions about
                  the platform's future. Each proposal is put to a vote, and all token holders can participate. The
                  voting power is proportional to the number of $CAMP tokens you hold, ensuring that those most invested
                  in the ecosystem have a stronger voice.
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)}>
            <TouchableOpacity
              style={[styles.sectionCard, expandedSection === "vote" && styles.expandedCard]}
              onPress={() => toggleSection("vote")}
            >
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.sectionHeader}>
                <Vote size={24} color="#10B981" />
                <Text style={styles.sectionTitle}>How to Participate in Voting</Text>
              </View>
              {expandedSection === "vote" && (
                <Text style={styles.sectionContent}>
                  To participate in DAO voting:
                  {"\n\n"}
                  1. Hold $CAMP tokens in your wallet
                  {"\n"}
                  2. Browse active proposals in the DAO section
                  {"\n"}
                  3. Review proposal details and community discussions
                  {"\n"}
                  4. Cast your vote before the deadline
                  {"\n"}
                  5. Once a proposal reaches quorum and majority approval, it will be implemented by the development
                  team
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)}>
            <TouchableOpacity
              style={[styles.sectionCard, expandedSection === "proposals" && styles.expandedCard]}
              onPress={() => toggleSection("proposals")}
            >
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.sectionHeader}>
                <Settings size={24} color="#F59E0B" />
                <Text style={styles.sectionTitle}>What You Can Vote On</Text>
              </View>
              {expandedSection === "proposals" && (
                <Text style={styles.sectionContent}>
                  The DAO can vote on various aspects of the Campus Blockchain ecosystem:
                  {"\n\n"}• Campus facilities and services improvements
                  {"\n"}• New features for the Battle Beasts game
                  {"\n"}• Balance changes and buffs for different beast types
                  {"\n"}• Tokenomics adjustments (rewards, staking rates)
                  {"\n"}• Community events and tournaments
                  {"\n"}• Allocation of treasury funds for development
                  {"\n"}• Partnerships with other campus organizations
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500)}>
            <TouchableOpacity
              style={[styles.sectionCard, expandedSection === "benefits" && styles.expandedCard]}
              onPress={() => toggleSection("benefits")}
            >
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.sectionHeader}>
                <Award size={24} color="#EF4444" />
                <Text style={styles.sectionTitle}>Benefits of DAO Governance</Text>
              </View>
              {expandedSection === "benefits" && (
                <Text style={styles.sectionContent}>
                  Participating in the DAO offers several benefits:
                  {"\n\n"}• Direct influence over the platform's development
                  {"\n"}• Transparent decision-making process
                  {"\n"}• Community ownership of the ecosystem
                  {"\n"}• Rewards for active participation
                  {"\n"}• Learning about blockchain governance
                  {"\n"}• Building a stronger campus community
                  {"\n"}• Ensuring the platform evolves to meet user needs
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.createProposalContainer}>
          <TouchableOpacity style={styles.createProposalButton} onPress={() => router.push("/create-dao")}>
            <Text style={styles.createProposalText}>Create a Proposal</Text>
          </TouchableOpacity>
        </Animated.View>
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
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  introCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 24,
    overflow: "hidden",
  },
  introIcon: {
    alignSelf: "center",
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 24,
    textAlign: "center",
  },
  sectionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    padding: 16,
  },
  expandedCard: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  sectionContent: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 24,
    marginTop: 16,
  },
  createProposalContainer: {
    alignItems: "center",
  },
  createProposalButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  createProposalText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})

