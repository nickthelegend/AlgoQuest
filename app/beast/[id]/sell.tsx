"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Tag, AlertCircle } from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"

export default function SellBeastScreen() {
  const { id } = useLocalSearchParams()
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSell = async () => {
    // Implement sell functionality here
    Alert.alert("Coming Soon", "Selling functionality will be implemented soon!")
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>List for Sale</Text>
      </View>

      <Animated.View entering={FadeInDown.delay(200)} style={styles.content}>
        <BlurView intensity={40} tint="dark" style={styles.card}>
          <LinearGradient colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />

          <View style={styles.warningBox}>
            <AlertCircle size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Once listed, your beast will be available for purchase by other players. You can cancel the listing at any
              time.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price in $CAMP</Text>
            <View style={styles.priceInputContainer}>
              <Tag size={20} color="rgba(255, 255, 255, 0.6)" />
              <TextInput
                style={styles.priceInput}
                placeholder="Enter price..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.listButton, (!price || loading) && styles.listButtonDisabled]}
            onPress={handleSell}
            disabled={!price || loading}
          >
            <Text style={styles.listButtonText}>List Beast for Sale</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
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
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  content: {
    padding: 16,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  priceInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  listButton: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  listButtonDisabled: {
    opacity: 0.5,
  },
  listButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})

