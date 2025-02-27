"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Shield, Crown, Sparkles, ChevronRight, RefreshCw, Sword, Heart, Zap } from "lucide-react-native"
import { router } from "expo-router"

const TIERS = [
  {
    id: 1,
    name: "Basic",
    description: "Standard point allocation, balanced stats, basic abilities",
    color: "#94A3B8",
    cost: "Free",
    icon: Shield,
    stats: {
      maxPoints: 280,
      maxPerStat: 80,
    },
  },
  {
    id: 2,
    name: "Advanced",
    description: "Slightly enhanced stats, access to moderate abilities",
    color: "#3B82F6",
    cost: "500 $CAMP",
    icon: Shield,
    stats: {
      maxPoints: 320,
      maxPerStat: 90,
    },
  },
  {
    id: 3,
    name: "Elite",
    description: "Higher total stat points with strict caps and powerful abilities",
    color: "#7C3AED",
    cost: "1000 $CAMP",
    icon: Crown,
    stats: {
      maxPoints: 360,
      maxPerStat: 100,
    },
  },
]

export default function BeastCreationScreen() {
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [step, setStep] = useState<"tier" | "design" | "stats" | "preview">("tier")
  const [isGenerating, setIsGenerating] = useState(false)
  const [stats, setStats] = useState({
    attack: 50,
    defense: 50,
    speed: 50,
    health: 50,
  })

  const renderStatBar = (value: number, color: string, maxValue: number) => (
    <View style={styles.statBarContainer}>
      <View style={[styles.statBarFill, { width: `${(value / maxValue) * 100}%`, backgroundColor: color }]} />
    </View>
  )

  const renderTierSelection = () => (
    <View style={styles.tierSelection}>
      {TIERS.map((tier, index) => (
        <Animated.View key={tier.id} entering={FadeInDown.delay(200 * index)}>
          <TouchableOpacity
            style={[styles.tierCard, selectedTier === tier.id && styles.tierCardSelected]}
            onPress={() => setSelectedTier(tier.id)}
          >
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
              <LinearGradient colors={[`${tier.color}20`, "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            </BlurView>
            <View style={[styles.tierIcon, { backgroundColor: `${tier.color}40` }]}>
              <tier.icon size={24} color={tier.color} />
            </View>
            <View style={styles.tierInfo}>
              <Text style={styles.tierName}>{tier.name}</Text>
              <Text style={styles.tierDescription}>{tier.description}</Text>
            </View>
            <View style={[styles.tierCost, { backgroundColor: `${tier.color}20` }]}>
              <Text style={[styles.tierCostText, { color: tier.color }]}>{tier.cost}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  )

  const renderDesignStep = () => (
    <View style={styles.designStep}>
      <View style={styles.imagePreview}>
        <Image
          source={{ uri: "/placeholder.svg?height=300&width=300" }}
          style={styles.previewImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={() => setIsGenerating(true)}
          disabled={isGenerating}
        >
          <RefreshCw size={20} color="#ffffff" />
          <Text style={styles.generateButtonText}>Generate Design</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderStatsStep = () => (
    <View style={styles.statsStep}>
      <Text style={styles.statsTitle}>Allocate Stats</Text>
      <Text style={styles.statsSubtitle}>
        Total Points: {Object.values(stats).reduce((a, b) => a + b, 0)} /{" "}
        {selectedTier ? TIERS[selectedTier - 1].stats.maxPoints : 0}
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <View style={styles.statLabel}>
            <Sword size={20} color="#EF4444" />
            <Text style={styles.statText}>Attack</Text>
          </View>
          {renderStatBar(stats.attack, "#EF4444", 100)}
          <View style={styles.statControls}>
            <TouchableOpacity style={styles.statButton}>
              <Text style={styles.statButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.statValue}>{stats.attack}</Text>
            <TouchableOpacity style={styles.statButton}>
              <Text style={styles.statButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statLabel}>
            <Shield size={20} color="#3B82F6" />
            <Text style={styles.statText}>Defense</Text>
          </View>
          {renderStatBar(stats.defense, "#3B82F6", 100)}
          <View style={styles.statControls}>
            <TouchableOpacity style={styles.statButton}>
              <Text style={styles.statButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.statValue}>{stats.defense}</Text>
            <TouchableOpacity style={styles.statButton}>
              <Text style={styles.statButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statLabel}>
            <Zap size={20} color="#F59E0B" />
            <Text style={styles.statText}>Speed</Text>
          </View>
          {renderStatBar(stats.speed, "#F59E0B", 100)}
          <View style={styles.statControls}>
            <TouchableOpacity style={styles.statButton}>
              <Text style={styles.statButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.statValue}>{stats.speed}</Text>
            <TouchableOpacity style={styles.statButton}>
              <Text style={styles.statButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statLabel}>
            <Heart size={20} color="#10B981" />
            <Text style={styles.statText}>Health</Text>
          </View>
          {renderStatBar(stats.health, "#10B981", 100)}
          <View style={styles.statControls}>
            <TouchableOpacity style={styles.statButton}>
              <Text style={styles.statButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.statValue}>{stats.health}</Text>
            <TouchableOpacity style={styles.statButton}>
              <Text style={styles.statButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Beast</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Steps */}
        <View style={styles.progressSteps}>
          <View style={[styles.progressStep, step === "tier" && styles.progressStepActive]}>
            <Crown size={20} color={step === "tier" ? "#7C3AED" : "#ffffff"} />
            <Text style={[styles.progressText, step === "tier" && styles.progressTextActive]}>Select Tier</Text>
          </View>
          <View style={[styles.progressStep, step === "design" && styles.progressStepActive]}>
            <Sparkles size={20} color={step === "design" ? "#7C3AED" : "#ffffff"} />
            <Text style={[styles.progressText, step === "design" && styles.progressTextActive]}>Design</Text>
          </View>
          <View style={[styles.progressStep, step === "stats" && styles.progressStepActive]}>
            <Shield size={20} color={step === "stats" ? "#7C3AED" : "#ffffff"} />
            <Text style={[styles.progressText, step === "stats" && styles.progressTextActive]}>Stats</Text>
          </View>
        </View>

        {/* Step Content */}
        {step === "tier" && renderTierSelection()}
        {step === "design" && renderDesignStep()}
        {step === "stats" && renderStatsStep()}

        {/* Navigation Buttons */}
        <View style={styles.navigation}>
          {step !== "tier" && (
            <TouchableOpacity
              style={styles.backStepButton}
              onPress={() => {
                switch (step) {
                  case "design":
                    setStep("tier")
                    break
                  case "stats":
                    setStep("design")
                    break
                  case "preview":
                    setStep("stats")
                    break
                }
              }}
            >
              <Text style={styles.backStepButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextStepButton, !selectedTier && step === "tier" && styles.nextStepButtonDisabled]}
            onPress={() => {
              switch (step) {
                case "tier":
                  setStep("design")
                  break
                case "design":
                  setStep("stats")
                  break
                case "stats":
                  setStep("preview")
                  break
              }
            }}
            disabled={!selectedTier && step === "tier"}
          >
            <Text style={styles.nextStepButtonText}>{step === "stats" ? "Create Beast" : "Next Step"}</Text>
            <ChevronRight size={20} color="#ffffff" />
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
  },
  progressSteps: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  progressStep: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    marginHorizontal: 4,
  },
  progressStepActive: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
  },
  progressText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  progressTextActive: {
    color: "#7C3AED",
    fontWeight: "600",
  },
  tierSelection: {
    gap: 16,
  },
  tierCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  tierCardSelected: {
    borderColor: "#7C3AED",
  },
  tierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
  },
  tierInfo: {
    padding: 16,
    paddingTop: 0,
  },
  tierName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  tierDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
  },
  tierCost: {
    alignSelf: "flex-start",
    marginLeft: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierCostText: {
    fontSize: 14,
    fontWeight: "600",
  },
  designStep: {
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
    marginBottom: 16,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  generateButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  statsStep: {
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  statsSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 24,
  },
  statsContainer: {
    gap: 16,
  },
  statRow: {
    gap: 12,
  },
  statLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  statBarContainer: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  statControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  statValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    width: 32,
    textAlign: "center",
  },
  navigation: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  backStepButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  backStepButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  nextStepButton: {
    flex: 2,
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextStepButtonDisabled: {
    opacity: 0.5,
  },
  nextStepButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})

