"use client"

import 'react-native-get-random-values';
import { useState } from "react"
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown } from "react-native-reanimated"
import { router } from "expo-router"
import algosdk from "algosdk"
import * as SecureStore from "expo-secure-store"
import { LinearGradient } from "expo-linear-gradient"
import { ArrowRight, Wallet } from "lucide-react-native"

interface FormData {
  name: string
  rollNumber: string
  branch: string
}

export default function CreateWalletScreen() {
  const [step, setStep] = useState<"form" | "mnemonic">("form")
  const [formData, setFormData] = useState<FormData>({
    name: "",
    rollNumber: "",
    branch: "",
  })
  const [mnemonic, setMnemonic] = useState("")

  const handleCreateAccount = async () => {
    try {
      // Ensure crypto is available
      if (typeof crypto === 'undefined') {
        throw new Error('crypto not available');
      }
      const account = algosdk.generateAccount();
      const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
      setMnemonic(mnemonic);
      await SecureStore.setItemAsync("mnemonic", mnemonic);
      await SecureStore.setItemAsync("userProfile", JSON.stringify(formData));
      setStep("mnemonic");
    } catch (error) {
      console.error("Error creating wallet:", error);
      // You might want to show an error message to the user here
    }
  }

  const handleSkip = () => {
    router.push("/")
  }

  if (step === "mnemonic") {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)} style={styles.content}>
            <BlurView intensity={40} tint="dark" style={styles.mnemonicCard}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]}
                style={StyleSheet.absoluteFill}
              />
              <Wallet size={32} color="#7C3AED" />
              <Text style={styles.title}>Your Recovery Phrase</Text>
              <Text style={styles.subtitle}>
                Write down these 25 words in order and keep them safe. You'll need them to recover your wallet.
              </Text>
              <View style={styles.mnemonicContainer}>
                {mnemonic.split(" ").map((word, index) => (
                  <View key={index} style={styles.wordContainer}>
                    <Text style={styles.wordNumber}>{index + 1}.</Text>
                    <Text style={styles.word}>{word}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.button} onPress={handleSkip}>
                <Text style={styles.buttonText}>I've Saved My Recovery Phrase</Text>
                <ArrowRight size={20} color="#ffffff" />
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.content}>
          <BlurView intensity={40} tint="dark" style={styles.formCard}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <Wallet size={32} color="#7C3AED" />
            <Text style={styles.title}>Create Your Wallet</Text>
            <Text style={styles.subtitle}>Enter your details to get started with your campus wallet.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={formData.name}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Roll Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your roll number"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={formData.rollNumber}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, rollNumber: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Branch</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your branch"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={formData.branch}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, branch: text }))}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, !formData.name && styles.buttonDisabled]}
              onPress={handleCreateAccount}
              disabled={!formData.name}
            >
              <Text style={styles.buttonText}>Create Wallet</Text>
              <ArrowRight size={20} color="#ffffff" />
            </TouchableOpacity>
          </BlurView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 32,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  formCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    gap: 24,
  },
  mnemonicCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  button: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  mnemonicContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  wordContainer: {
    flexDirection: "row",
    gap: 8,
  },
  wordNumber: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 14,
    width: 24,
  },
  word: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
})