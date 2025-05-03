"use client"

import "react-native-get-random-values"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown } from "react-native-reanimated"
import { router } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { LinearGradient } from "expo-linear-gradient"
import { ArrowRight, Wallet, ChevronRight, RefreshCw, Check, X, Mail } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"
import algosdk from "algosdk"
import * as FileSystem from "expo-file-system"

const supabase = createClient(
  "https://tficheendnovlkzoqoop.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmaWNoZWVuZG5vdmxrem9xb29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MTM5NjksImV4cCI6MjA1NDk4OTk2OX0.TNCHYkgbgFchghO2FGoC9c_hSm1x1ACtBdzLdFQSbPE",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
)

// Base prompt for NFT avatar generation
const BASE_PROMPT = "a nft art cartoon illustration in a simple, cartoon-like style with vibrant colors"

// Predefined interests for selection
const INTERESTS = [
  "Technology",
  "Art",
  "Music",
  "Sports",
  "Gaming",
  "Reading",
  "Travel",
  "Cooking",
  "Photography",
  "Fashion",
  "Science",
  "Movies",
  "Fitness",
  "Nature",
  "Coding",
]

interface FormData {
  name: string
  email: string
  rollNumber: string
  branch: string
  gender: "male" | "female" | ""
  interests: string[]
  avatarUrl: string
  avatarPrompt: string
}

export default function CreateWalletScreen() {
  const [step, setStep] = useState<"form" | "interests" | "avatar" | "mnemonic">("form")
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    rollNumber: "",
    branch: "",
    gender: "",
    interests: [],
    avatarUrl: "",
    avatarPrompt: "",
  })
  const [mnemonic, setMnemonic] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false)
  const [remainingRequests, setRemainingRequests] = useState(5)
  const [showInterestModal, setShowInterestModal] = useState(false)
  const [selectedInterest, setSelectedInterest] = useState("")
  const [avatarImageBase64, setAvatarImageBase64] = useState("")

  useEffect(() => {
    // Check remaining avatar generation requests
    const checkRemainingRequests = async () => {
      try {
        const storedRequests = await AsyncStorage.getItem("remainingAvatarRequests")
        if (storedRequests !== null) {
          setRemainingRequests(Number.parseInt(storedRequests))
        } else {
          // Initialize with 5 requests if not set
          await AsyncStorage.setItem("remainingAvatarRequests", "5")
        }
      } catch (error) {
        console.error("Error checking remaining requests:", error)
      }
    }

    checkRemainingRequests()
  }, [])

  const handleNextStep = () => {
    if (step === "form") {
      if (!formData.name || !formData.email || !formData.rollNumber || !formData.branch || !formData.gender) {
        Alert.alert("Missing Information", "Please fill in all fields")
        return
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        Alert.alert("Invalid Email", "Please enter a valid email address")
        return
      }

      setStep("interests")
    } else if (step === "interests") {
      if (formData.interests.length < 3) {
        Alert.alert("Select Interests", "Please select at least 3 interests")
        return
      }
      setStep("avatar")
    }
  }

  const handlePreviousStep = () => {
    if (step === "interests") {
      setStep("form")
    } else if (step === "avatar") {
      setStep("interests")
    }
  }

  const toggleInterest = (interest: string) => {
    setFormData((prev) => {
      const interests = [...prev.interests]
      const index = interests.indexOf(interest)

      if (index === -1) {
        // Add interest if not already selected and limit to 5
        if (interests.length < 5) {
          interests.push(interest)
        } else {
          Alert.alert("Maximum Interests", "You can select up to 5 interests")
        }
      } else {
        // Remove interest
        interests.splice(index, 1)
      }

      return { ...prev, interests }
    })
  }

  const generateAvatarPrompt = () => {
    if (remainingRequests <= 0) {
      Alert.alert("Limit Reached", "You've used all your avatar generation requests")
      return
    }

    setIsGeneratingAvatar(true)

    // Construct a prompt based on gender and interests
    const genderTerm = formData.gender === "male" ? "male character" : "female character"
    const interestsText =
      formData.interests.length > 0 ? `interested in ${formData.interests.slice(0, 3).join(", ")}` : ""

    const customPrompt = formData.avatarPrompt.trim()
    const prompt = `${BASE_PROMPT} of a ${genderTerm} ${customPrompt} ${interestsText}`

    // Call the Together.xyz API
    fetch("https://api.together.xyz/v1/images/generations", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: "Bearer af0955d8aa9129a65af2bea8a3a06fb34ba3670d61409a2a21b0eedff2bc41ce",
      },
      body: JSON.stringify({
        model: "black-forest-labs/FLUX.1-schnell-Free",
        steps: 4,
        n: 1,
        height: 1024,
        width: 1024,
        guidance: 3.5,
        output_format: "jpeg",
        prompt: prompt,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.data && json.data.length > 0 && json.data[0].url) {
          // Update remaining requests
          const newRemainingRequests = remainingRequests - 1
          setRemainingRequests(newRemainingRequests)
          AsyncStorage.setItem("remainingAvatarRequests", newRemainingRequests.toString())

          // Set the avatar URL
          setFormData((prev) => ({
            ...prev,
            avatarUrl: json.data[0].url,
          }))

          // Download and convert the image to base64
          downloadImageAsBase64(json.data[0].url)
        } else {
          Alert.alert("Error", "Failed to generate avatar")
        }
        setIsGeneratingAvatar(false)
      })
      .catch((err) => {
        console.error("Error generating avatar:", err)
        Alert.alert("Error", "Failed to generate avatar")
        setIsGeneratingAvatar(false)
      })
  }

  const downloadImageAsBase64 = async (url: string) => {
    try {
      // Download the image to a temporary file
      const fileUri = FileSystem.cacheDirectory + "temp_avatar.jpg"
      const downloadResult = await FileSystem.downloadAsync(url, fileUri)

      if (downloadResult.status === 200) {
        // Read the file as base64
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        })
        setAvatarImageBase64(base64)
      } else {
        console.error("Failed to download image:", downloadResult)
      }
    } catch (error) {
      console.error("Error downloading image:", error)
    }
  }

  const handleCreateAccount = async () => {
    try {
      setIsLoading(true)
      console.log("handleCreateAccount: Starting account generation")

      // Call your Node.js server to generate the account data
      const response = await fetch("https://algorand-generate-account.vercel.app/generateaccount")
      if (!response.ok) {
        console.error("handleCreateAccount: Error fetching account data", response.status)
        Alert.alert("Error", "Failed to generate account")
        return
      }
      const jsonResponse = await response.json()
      console.log("handleCreateAccount: Received response", jsonResponse)

      // Destructure mnemonic and address from the response.
      const { mnemonic, address: addrObj } = jsonResponse
      console.log("handleCreateAccount: Extracted mnemonic", mnemonic)

      // Extract the publicKey from the address object for debugging.
      const publicKey = addrObj.publicKey
      console.log("handleCreateAccount: Extracted publicKey", publicKey)

      // Use the mnemonic to generate the account.
      const account = algosdk.mnemonicToSecretKey(mnemonic)
      console.log("handleCreateAccount: Account generated from mnemonic", account)

      // Get the generated wallet address from the account.
      const generatedAddress = account.addr.toString()
      console.log("handleCreateAccount: Generated address", generatedAddress)

      // Create a user profile object with all the data
      const userProfile = {
        name: formData.name,
        email: formData.email,
        rollNumber: formData.rollNumber,
        branch: formData.branch,
        gender: formData.gender,
        interests: formData.interests,
        avatarPrompt: formData.avatarPrompt,
      }

      // Store mnemonic, wallet address, and user profile securely.
      await SecureStore.setItemAsync("mnemonic", mnemonic)
      await SecureStore.setItemAsync("walletAddress", generatedAddress)
      await SecureStore.setItemAsync("userProfile", JSON.stringify(userProfile))

      // Store the avatar image separately as base64
      if (avatarImageBase64) {
        await SecureStore.setItemAsync("avatarImage", avatarImageBase64)
      }

      console.log("handleCreateAccount: Data stored in SecureStore")

      // Save user details and wallet address in Supabase.
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            full_name: formData.name,
            email: formData.email,
            roll_number: formData.rollNumber,
            branch: formData.branch,
            wallet_address: generatedAddress,
            created_at: new Date().toISOString(),
            gender: formData.gender,
            interests: formData.interests,
            avatar_url: formData.avatarUrl,
            avatar_prompt: formData.avatarPrompt,
            profile_created: true,
          },
        ])
        .select()

      if (error) {
        console.error("handleCreateAccount: Error storing user data in Supabase", error)
        Alert.alert("Error", "Failed to store user data")
        return
      }
      console.log("handleCreateAccount: User data stored in Supabase", data)

      setMnemonic(mnemonic)
      setAddress(generatedAddress)
      setStep("mnemonic")
    } catch (error) {
      console.error("handleCreateAccount: Error creating wallet", error)
      Alert.alert("Error", "Failed to create wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    console.log("handleSkip: Navigating to home")
    router.push("/(tabs)")
  }

  const renderFormStep = () => (
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
        <Text style={styles.label}>Email</Text>
        <View style={styles.emailInputContainer}>
          <Mail size={20} color="rgba(255, 255, 255, 0.5)" style={styles.emailIcon} />
          <TextInput
            style={styles.emailInput}
            placeholder="Enter your email address"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={formData.email}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
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

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderButton, formData.gender === "male" && styles.genderButtonSelected]}
            onPress={() => setFormData((prev) => ({ ...prev, gender: "male" }))}
          >
            <Text style={[styles.genderButtonText, formData.gender === "male" && styles.genderButtonTextSelected]}>
              Male
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, formData.gender === "female" && styles.genderButtonSelected]}
            onPress={() => setFormData((prev) => ({ ...prev, gender: "female" }))}
          >
            <Text style={[styles.genderButtonText, formData.gender === "female" && styles.genderButtonTextSelected]}>
              Female
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!formData.name || !formData.email || !formData.rollNumber || !formData.branch || !formData.gender) &&
            styles.buttonDisabled,
        ]}
        onPress={handleNextStep}
        disabled={!formData.name || !formData.email || !formData.rollNumber || !formData.branch || !formData.gender}
      >
        <Text style={styles.buttonText}>Next</Text>
        <ChevronRight size={20} color="#ffffff" />
      </TouchableOpacity>
    </BlurView>
  )

  const renderInterestsStep = () => (
    <BlurView intensity={40} tint="dark" style={styles.formCard}>
      <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
      <Text style={styles.title}>Select Your Interests</Text>
      <Text style={styles.subtitle}>Choose up to 5 interests that define you (minimum 3)</Text>

      <View style={styles.interestsContainer}>
        {INTERESTS.map((interest) => (
          <TouchableOpacity
            key={interest}
            style={[styles.interestChip, formData.interests.includes(interest) && styles.interestChipSelected]}
            onPress={() => toggleInterest(interest)}
          >
            <Text
              style={[
                styles.interestChipText,
                formData.interests.includes(interest) && styles.interestChipTextSelected,
              ]}
            >
              {interest}
            </Text>
            {formData.interests.includes(interest) && <Check size={16} color="#ffffff" />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.customInterestContainer}>
        <TouchableOpacity style={styles.customInterestButton} onPress={() => setShowInterestModal(true)}>
          <Text style={styles.customInterestButtonText}>+ Add Custom Interest</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.backButton} onPress={handlePreviousStep}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, formData.interests.length < 3 && styles.buttonDisabled]}
          onPress={handleNextStep}
          disabled={formData.interests.length < 3}
        >
          <Text style={styles.buttonText}>Next</Text>
          <ChevronRight size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </BlurView>
  )

  const renderAvatarStep = () => (
    <BlurView intensity={40} tint="dark" style={styles.formCard}>
      <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
      <Text style={styles.title}>Create Your Avatar</Text>
      <Text style={styles.subtitle}>Customize your NFT avatar ({remainingRequests} generations left)</Text>

      <View style={styles.avatarPreviewContainer}>
        {formData.avatarUrl ? (
          <Image source={{ uri: formData.avatarUrl }} style={styles.avatarPreview} resizeMode="cover" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>Generate your avatar</Text>
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Customize Your Avatar</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe additional details for your avatar..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={formData.avatarPrompt}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, avatarPrompt: text }))}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={[styles.generateButton, (isGeneratingAvatar || remainingRequests <= 0) && styles.buttonDisabled]}
        onPress={generateAvatarPrompt}
        disabled={isGeneratingAvatar || remainingRequests <= 0}
      >
        {isGeneratingAvatar ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <RefreshCw size={20} color="#ffffff" />
            <Text style={styles.buttonText}>{formData.avatarUrl ? "Regenerate Avatar" : "Generate Avatar"}</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.backButton} onPress={handlePreviousStep}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, !formData.avatarUrl && styles.buttonDisabled]}
          onPress={handleCreateAccount}
          disabled={!formData.avatarUrl || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Create Wallet</Text>
              <ArrowRight size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </BlurView>
  )

  const renderMnemonicStep = () => (
    <>
      <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400)} style={styles.content}>
        <BlurView intensity={40} tint="dark" style={styles.mnemonicCard}>
          <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
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
    </>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.content}>
          {step === "form" && renderFormStep()}
          {step === "interests" && renderInterestsStep()}
          {step === "avatar" && renderAvatarStep()}
          {step === "mnemonic" && renderMnemonicStep()}
        </Animated.View>
        {/* Already have a wallet section */}
        <View style={styles.existingWalletContainer}>
          <Text style={styles.existingWalletText}>Already have a wallet?</Text>
          <TouchableOpacity onPress={() => router.push("/wallet-backup")}>
            <Text style={styles.existingWalletLink}>Restore from recovery phrase</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Interest Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showInterestModal}
        onRequestClose={() => setShowInterestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Interest</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowInterestModal(false)}>
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter your interest..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={selectedInterest}
              onChangeText={setSelectedInterest}
            />

            <TouchableOpacity
              style={[styles.modalButton, !selectedInterest.trim() && styles.buttonDisabled]}
              disabled={!selectedInterest.trim()}
              onPress={() => {
                if (selectedInterest.trim()) {
                  toggleInterest(selectedInterest.trim())
                  setSelectedInterest("")
                  setShowInterestModal(false)
                }
              }}
            >
              <Text style={styles.modalButtonText}>Add Interest</Text>
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
    textAlignVertical: "top",
  },
  emailInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
  },
  emailIcon: {
    marginRight: 8,
  },
  emailInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#ffffff",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  genderButtonSelected: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderColor: "#7C3AED",
  },
  genderButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  genderButtonTextSelected: {
    fontWeight: "600",
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
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  interestChip: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  interestChipSelected: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderColor: "#7C3AED",
  },
  interestChipText: {
    color: "#ffffff",
    fontSize: 14,
  },
  interestChipTextSelected: {
    fontWeight: "600",
  },
  customInterestContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  customInterestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  customInterestButtonText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  avatarPreviewContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  avatarPreview: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  avatarPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  generateButton: {
    backgroundColor: "#10B981",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
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
    fontSize: 18,
    fontWeight: "bold",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  existingWalletContainer: {
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  existingWalletText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  existingWalletLink: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
  },
})
