"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown } from "react-native-reanimated"
import { EyeOff, Fingerprint, Shield, Copy, Key } from "lucide-react-native"
import * as LocalAuthentication from "expo-local-authentication"
import * as SecureStore from "expo-secure-store"
import * as Clipboard from "expo-clipboard"
import ScreenLayout from "../../components/screen-layout"

export default function WalletSettingsScreen() {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false)
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [mnemonic, setMnemonic] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkBiometricSupport()
  }, [])

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync()
    setIsBiometricSupported(compatible)
  }

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to view recovery phrase",
        disableDeviceFallback: false,
        cancelLabel: "Cancel",
      })

      if (result.success) {
        const storedMnemonic = await SecureStore.getItemAsync("mnemonic")
        if (storedMnemonic) {
          setMnemonic(storedMnemonic)
          setShowMnemonic(true)
        } else {
          Alert.alert("Error", "No recovery phrase found")
        }
      }
    } catch (error) {
      console.error("Biometric authentication error:", error)
      Alert.alert("Error", "Authentication failed")
    }
  }

  const copyToClipboard = async () => {
    if (mnemonic) {
      await Clipboard.setStringAsync(mnemonic)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <ScreenLayout>
      <Text style={styles.title}>Wallet Security</Text>

      <View style={styles.sections}>
        <Animated.View entering={FadeInDown.delay(200)}>
          <BlurView intensity={40} tint="dark" style={styles.securityCard}>
            <View style={styles.cardHeader}>
              <Shield size={24} color="#7C3AED" />
              <Text style={styles.cardTitle}>Recovery Phrase</Text>
            </View>
            <Text style={styles.cardDescription}>
              Your recovery phrase is the only way to restore your wallet if you lose access. Never share it with
              anyone.
            </Text>

            {!showMnemonic ? (
              <TouchableOpacity
                style={[styles.authButton, !isBiometricSupported && styles.authButtonDisabled]}
                onPress={handleBiometricAuth}
                disabled={!isBiometricSupported}
              >
                <Fingerprint size={24} color="#ffffff" />
                <Text style={styles.authButtonText}>
                  {isBiometricSupported ? "Authenticate to View" : "Biometrics Not Available"}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.mnemonicContainer}>
                <View style={styles.mnemonicHeader}>
                  <Key size={16} color="#7C3AED" />
                  <Text style={styles.mnemonicTitle}>Recovery Phrase</Text>
                  <TouchableOpacity onPress={() => setShowMnemonic(false)} style={styles.hideButton}>
                    <EyeOff size={16} color="#94A3B8" />
                    <Text style={styles.hideButtonText}>Hide</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.mnemonicContent}>
                  <Text style={styles.mnemonicText}>{mnemonic}</Text>
                </View>
                <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                  {copied ? (
                    <Text style={styles.copyButtonText}>Copied!</Text>
                  ) : (
                    <>
                      <Copy size={16} color="#ffffff" />
                      <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <BlurView intensity={40} tint="dark" style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Important Security Notice</Text>
            <Text style={styles.warningText}>
              • Never share your recovery phrase with anyone{"\n"}• Vercel will never ask for your recovery phrase{"\n"}
              • Store it in a secure location offline{"\n"}• If someone has your phrase, they have your funds
            </Text>
          </BlurView>
        </Animated.View>
      </View>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 24,
  },
  sections: {
    gap: 24,
  },
  securityCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  cardDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 24,
    lineHeight: 24,
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
  },
  authButtonDisabled: {
    opacity: 0.5,
  },
  authButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  mnemonicContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    overflow: "hidden",
  },
  mnemonicHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  mnemonicTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#7C3AED",
  },
  hideButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hideButtonText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  mnemonicContent: {
    padding: 16,
  },
  mnemonicText: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "monospace",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  copyButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  warningCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 24,
  },
})

