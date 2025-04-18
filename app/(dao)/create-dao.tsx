"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Vote, Clock } from "lucide-react-native"
import { router } from "expo-router"
import algosdk from "algosdk"
import * as SecureStore from "expo-secure-store"
import { supabase } from "@/lib/supabase"


const METHODS = [
  new algosdk.ABIMethod({ name: "createVote", desc: "", args: [{ type: "string", name: "title", desc: "" },{ type: "string", name: "description", desc: "" },{ type: "uint64", name: "duration", desc: "" }], returns: { type: "void", desc: "" } }),
];

export default function CreateDAOScreen() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("7") // Default 7 days
  const [loading, setLoading] = useState(false)
  
  // Function to store DAO in Supabase
  const storeDAOInSupabase = async (daoData) => {
    try {
      const { data, error } = await supabase
        .from('daos')
        .insert([daoData])
        .select()
      
      if (error) {
        console.error('Error storing DAO in Supabase:', error)
        throw error
      }
      
      console.log('DAO stored in Supabase:', data)
      return data
    } catch (error) {
      console.error('Failed to store DAO in Supabase:', error)
      throw error
    }
  }
  
  const handleCreateProposal = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Please fill in all required fields")
      return
    }
    
    setLoading(true)
    
    try {
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (!mnemonic) throw new Error("No mnemonic found")
      const walletAddress = await SecureStore.getItemAsync("walletAddress")

      const account = algosdk.mnemonicToSecretKey(mnemonic)
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")
      const suggestedParams = await algodClient.getTransactionParams().do()

      // Calculate expiration timestamp (current time + days in seconds)
      const daysInSeconds = parseInt(duration) * 24 * 60 * 60
      const currentTimestamp = Math.floor(Date.now() / 1000) // Current time in seconds
      const expirationTimestamp = currentTimestamp + daysInSeconds

      // Create payload from form data
      const payload = {
        creatorAddress: walletAddress
        // Using expiration timestamp instead of days
      };
      
      // Make the API request
      const response = await fetch('http://172.16.3.203:3000/api/createDao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    
      // Check if the request was successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create application');
      }
    
      // Parse the response
      const data = await response.json();
      
      // Log the app details
      console.log('Application created successfully:');
      console.log('App ID:', data.appId);
      console.log('App Address:', data.appAddress);
      const appID = data.appId;
      const appAddress = data.appAddress;
      
      const atc = new algosdk.AtomicTransactionComposer();
      
      atc.addMethodCall({
        appID: Number(appID),
        method: METHODS[0], // your ABI method (createVote)
        signer: algosdk.makeBasicAccountTransactionSigner(account),
        methodArgs: [
          algosdk.coerceToBytes(title), 
          algosdk.coerceToBytes(description), 
          expirationTimestamp // Using expiration timestamp instead of days
        ], 
        sender: account.addr,
        suggestedParams: { ...suggestedParams, fee: Number(30) },
      });

      // Execute the transaction
      const result = await atc.execute(algodClient, 4);
      console.log("Transaction executed:", result);
      
      // Store DAO in Supabase
      const daoData = {
        app_id: appID,
        app_address: appAddress,
        title: title,
        description: description,
        creator_address: walletAddress,
        duration: expirationTimestamp,
        created_at: new Date().toISOString(),
      }
      
      await storeDAOInSupabase(daoData)

      // Show success message and navigate back
      alert("Proposal created successfully!")
      router.back()
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert("Failed to create proposal. Please try again.");
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={loading}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Create DAO Proposal</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeInDown.delay(100)}>
            <BlurView intensity={40} tint="dark" style={styles.formCard}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.2)", "rgba(0, 0, 0, 0)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Proposal Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter a clear, concise title"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={title}
                  onChangeText={setTitle}
                  editable={!loading}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Proposal Description</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Describe your proposal in detail..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                  editable={!loading}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Voting Options</Text>
                <View style={styles.optionsContainer}>
                  <View style={styles.optionInputContainer}>
                    <Text style={styles.optionLabel}>Yes Option:</Text>
                    <View style={styles.optionDisplay}>
                      <Text style={styles.optionDisplayText}>Yes</Text>
                    </View>
                  </View>
                  <View style={styles.optionInputContainer}>
                    <Text style={styles.optionLabel}>No Option:</Text>
                    <View style={styles.optionDisplay}>
                      <Text style={styles.optionDisplayText}>No</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Voting Duration</Text>
                <View style={styles.durationContainer}>
                  <Clock size={20} color="#7C3AED" />
                  <TextInput
                    style={styles.durationInput}
                    placeholder="7"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="number-pad"
                    value={duration}
                    onChangeText={setDuration}
                    editable={!loading}
                  />
                  <Text style={styles.durationText}>days</Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.createButtonContainer}>
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={handleCreateProposal}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Vote size={20} color="#ffffff" />
                  <Text style={styles.createButtonText}>Create Proposal</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Loading overlay with blur */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.loadingText}>Creating proposal...</Text>
            </View>
          </BlurView>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  keyboardAvoidingView: {
    flex: 1,
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
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    padding: 20,
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
    color: "#ffffff",
    fontSize: 16,
  },
  textArea: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
    color: "#ffffff",
    fontSize: 16,
    minHeight: 120,
  },
  optionsContainer: {
    gap: 12,
  },
  optionInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionLabel: {
    width: 100,
    fontSize: 16,
    color: "#ffffff",
  },
  optionInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
    color: "#ffffff",
    fontSize: 16,
  },
  optionDisplay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
  },
  optionDisplayText: {
    color: "#ffffff",
    fontSize: 16,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
  },
  durationInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    marginLeft: 8,
  },
  durationText: {
    color: "#ffffff",
    fontSize: 16,
    marginLeft: 8,
  },
  createButtonContainer: {
    marginTop: 8,
  },
  createButton: {
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
})