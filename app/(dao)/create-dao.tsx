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
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Vote, Clock } from "lucide-react-native"
import { router } from "expo-router"

export default function CreateDAOScreen() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [yesOption, setYesOption] = useState("Yes")
  const [noOption, setNoOption] = useState("No")
  const [duration, setDuration] = useState("7") // Default 7 days

  const handleCreateProposal = () => {
    // This would normally save to a database, but we're just showing the UI for now
    alert("Proposal created successfully!")
    router.back()
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Voting Options</Text>
                <View style={styles.optionsContainer}>
                  <View style={styles.optionInputContainer}>
                    <Text style={styles.optionLabel}>Yes Option:</Text>
                    <TextInput
                      style={styles.optionInput}
                      placeholder="Yes"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={yesOption}
                      onChangeText={setYesOption}
                    />
                  </View>
                  <View style={styles.optionInputContainer}>
                    <Text style={styles.optionLabel}>No Option:</Text>
                    <TextInput
                      style={styles.optionInput}
                      placeholder="No"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={noOption}
                      onChangeText={setNoOption}
                    />
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
                  />
                  <Text style={styles.durationText}>days</Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.createButtonContainer}>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateProposal}>
              <Vote size={20} color="#ffffff" />
              <Text style={styles.createButtonText}>Create Proposal</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
})

