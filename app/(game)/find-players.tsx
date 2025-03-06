"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Shield, Swords, Crown, Star, Users } from "lucide-react-native"
import { router } from "expo-router"
import * as NearbyConnections from "expo-nearby-connections"

interface Player {
  id: string
  name: string
  rank: number
  level: number
  winRate: string
  avatar: string
  status: "online" | "in-game" | "offline"
  selectedBeast?: {
    name: string
    power: number
    element: string
    image: string
  }
}

// Dummy player for debugging
const DUMMY_PLAYER: Player = {
  id: "dummy-1",
  name: "Supreme Dragon",
  rank: 1234,
  level: 70,
  winRate: "76%",
  avatar:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7BC5DA1ABA-D239-47BF-86A4-7F62F953B61C%7D-oDh5OOGSt6RLj6h8lnARTFRGEVF7dC.png",
  status: "online",
  selectedBeast: {
    name: "Golden Dragon",
    power: 9500,
    element: "Light",
    image: "/placeholder.svg?height=100&width=100",
  },
}

export default function FindPlayersScreen() {
  const [players, setPlayers] = useState<Player[]>([DUMMY_PLAYER])
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    startScanning()
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    try {
      setScanning(true)
      // Start discovering nearby players
      await NearbyConnections.startDiscovery("battle-beasts")
    } catch (error) {
      console.error("Error starting discovery:", error)
      Alert.alert("Error", "Failed to start scanning for players")
    }
  }

  const stopScanning = async () => {
    try {
      await NearbyConnections.stopDiscovery()
      setScanning(false)
    } catch (error) {
      console.error("Error stopping discovery:", error)
    }
  }

  const handleChallenge = (player: Player) => {
    Alert.alert("Challenge Player", `Do you want to challenge ${player.name}?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Challenge",
        onPress: () => {
          // Here you would typically send the challenge request
          // For now, we'll just navigate to the battle arena
          router.push("/battle-arena")
        },
      },
    ])
  }

  const getStatusColor = (status: Player["status"]) => {
    switch (status) {
      case "online":
        return "#4ADE80"
      case "in-game":
        return "#F59E0B"
      case "offline":
        return "#94A3B8"
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Find Players</Text>
      </View>

      {/* Scanning Status */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.scanningCard}>
        <BlurView intensity={40} tint="dark" style={styles.cardContent}>
          <LinearGradient colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
          <Users size={24} color="#7C3AED" />
          <Text style={styles.scanningText}>
            {scanning ? "Scanning for nearby players..." : "Start scanning for players"}
          </Text>
          <TouchableOpacity
            style={[styles.scanButton, scanning && styles.stopButton]}
            onPress={scanning ? stopScanning : startScanning}
          >
            <Text style={styles.scanButtonText}>{scanning ? "Stop Scanning" : "Start Scanning"}</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      {/* Players List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {players.map((player, index) => (
          <Animated.View key={player.id} entering={FadeInDown.delay(300 + index * 100)}>
            <BlurView intensity={40} tint="dark" style={styles.playerCard}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]}
                style={StyleSheet.absoluteFill}
              />

              {/* Player Info Section */}
              <View style={styles.playerInfo}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: player.avatar }} style={styles.avatar} />
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(player.status) }]} />
                </View>

                <View style={styles.playerDetails}>
                  <Text style={styles.playerName}>{player.name}</Text>

                  <View style={styles.statsRow}>
                    <View style={styles.statBadge}>
                      <Crown size={12} color="#FFD700" />
                      <Text style={styles.statText}>Rank #{player.rank}</Text>
                    </View>

                    <View style={styles.statBadge}>
                      <Star size={12} color="#F59E0B" />
                      <Text style={styles.statText}>Level {player.level}</Text>
                    </View>

                    <View style={styles.statBadge}>
                      <Shield size={12} color="#3B82F6" />
                      <Text style={styles.statText}>Win Rate {player.winRate}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Selected Beast Section */}
              {player.selectedBeast && (
                <View style={styles.beastSection}>
                  <View style={styles.beastInfo}>
                    <Image source={{ uri: player.selectedBeast.image }} style={styles.beastImage} />
                    <View style={styles.beastDetails}>
                      <Text style={styles.beastName}>{player.selectedBeast.name}</Text>
                      <Text style={styles.beastElement}>{player.selectedBeast.element} Element</Text>
                      <View style={styles.powerBadge}>
                        <Swords size={12} color="#EF4444" />
                        <Text style={styles.powerText}>{player.selectedBeast.power} Power</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.challengeButton} onPress={() => handleChallenge(player)}>
                    <Swords size={20} color="#ffffff" />
                    <Text style={styles.challengeButtonText}>Challenge</Text>
                  </TouchableOpacity>
                </View>
              )}
            </BlurView>
          </Animated.View>
        ))}
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
  scanningCard: {
    margin: 16,
    marginTop: 0,
  },
  cardContent: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  scanningText: {
    color: "#ffffff",
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  stopButton: {
    backgroundColor: "#EF4444",
  },
  scanButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  playerCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  playerInfo: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#000000",
  },
  playerDetails: {
    flex: 1,
    gap: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  beastSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
  },
  beastInfo: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  beastImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  beastDetails: {
    flex: 1,
    gap: 4,
  },
  beastName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  beastElement: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  powerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  powerText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },
  challengeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    padding: 12,
    borderRadius: 12,
  },
  challengeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})

