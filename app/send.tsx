"use client"

import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import Animated, { FadeIn, SlideInRight, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"
import { ArrowLeft, Send, Check, Copy, ExternalLink } from "lucide-react-native"
import { useState } from "react"
import { router } from "expo-router"
import * as SecureStore from "expo-secure-store"
import algosdk from "algosdk"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width - 48

export default function SendScreen() {
  const [recipientAddress, setRecipientAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [transactionId, setTransactionId] = useState("")

  const amountScale = useSharedValue(1)
  const checkmarkScale = useSharedValue(0)

  const amountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: amountScale.value }],
  }))

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }))

  const handleAmountChange = (value: string) => {
    setAmount(value)
    amountScale.value = withSpring(1.05, { damping: 10 })
    setTimeout(() => {
      amountScale.value = withSpring(1, { damping: 12 })
    }, 100)
  }

  const handleSend = async () => {
    if (!recipientAddress || !amount) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    try {
      setSending(true)
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (!mnemonic) throw new Error("No mnemonic found")

      const account = algosdk.mnemonicToSecretKey(mnemonic)
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")

      const suggestedParams = await algodClient.getTransactionParams().do()
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: account.addr,
        receiver: recipientAddress,
        amount: Math.floor(Number(amount) * 1000000),
        suggestedParams,
      })

      const signedTxn = txn.signTxn(account.sk)
      const { txid } = await algodClient.sendRawTransaction(signedTxn).do()
      await algosdk.waitForConfirmation(algodClient, txid, 4)

      // Store transaction
      const storedTxns = await SecureStore.getItemAsync("transactions")
      const transactions = storedTxns ? JSON.parse(storedTxns) : []
      transactions.unshift({
        id: txid,
        amount: Number(amount),
        recipient: recipientAddress,
        timestamp: new Date().toISOString(),
        type: "send",
      })
      await SecureStore.setItemAsync("transactions", JSON.stringify(transactions))

      setTransactionId(txid)
      setSuccess(true)
      checkmarkScale.value = withSpring(1, { damping: 15 })
    } catch (error) {
      console.error("Error sending transaction:", error)
      Alert.alert("Error", "Failed to send transaction")
      setSending(false)
    }
  }

  const viewTransactionDetails = () => {
    router.push({
      pathname: "/transaction-details",
      params: { txId: transactionId },
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Send ALGO</Text>
      </View>

      {!success ? (
        <Animated.View entering={FadeIn} style={styles.content}>
          <BlurView intensity={40} tint="dark" style={styles.card}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <Animated.View style={[styles.amountContainer, amountStyle]}>
              <Text style={styles.currencySymbol}></Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={handleAmountChange}
              />
              <Text style={styles.currencyCode}>ALGO</Text>
            </Animated.View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Recipient Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Enter recipient's address"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={recipientAddress}
                  onChangeText={setRecipientAddress}
                />
                <TouchableOpacity style={styles.pasteButton}>
                  <Copy size={16} color="rgba(255, 255, 255, 0.5)" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendingButton]}
              onPress={handleSend}
              disabled={sending}
            >
              {sending ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingDot} />
                </View>
              ) : (
                <>
                  <Send size={20} color="#ffffff" />
                  <Text style={styles.sendButtonText}>Send {amount ? `${amount} ALGO` : ""}</Text>
                </>
              )}
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      ) : (
        <Animated.View entering={SlideInRight} style={styles.content}>
          <BlurView intensity={40} tint="dark" style={styles.card}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />
            <Animated.View style={[styles.checkmarkContainer, checkmarkStyle]}>
              <View style={styles.checkmarkCircle}>
                <Check size={32} color="#4ADE80" />
              </View>
            </Animated.View>

            <View style={styles.successContent}>
              <Text style={styles.successAmount}>{amount} ALGO</Text>
              <Text style={styles.successText}>sent successfully</Text>

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <View style={styles.txIdContainer}>
                    <Text style={styles.txId} numberOfLines={1}>
                      {transactionId}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.viewDetailsButton} onPress={viewTransactionDetails}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <ExternalLink size={16} color="#7C3AED" />
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      )}
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginLeft: 16,
  },
  content: {
    flex: 1,
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: CARD_WIDTH,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    overflow: "hidden",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 40,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    minWidth: 120,
  },
  currencyCode: {
    fontSize: 20,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    marginLeft: 8,
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  addressInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#ffffff",
  },
  pasteButton: {
    padding: 16,
  },
  sendButton: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendingButton: {
    opacity: 0.8,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 8,
  },
  loadingDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ffffff",
    borderTopColor: "transparent",
  },
  checkmarkContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  checkmarkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  successContent: {
    alignItems: "center",
  },
  successAmount: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#ffffff",
  },
  successText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 32,
  },
  detailsContainer: {
    width: "100%",
    gap: 16,
  },
  detailRow: {
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
  txIdContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  txId: {
    fontSize: 14,
    color: "#ffffff",
    fontFamily: "monospace",
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  viewDetailsText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
  },
})

