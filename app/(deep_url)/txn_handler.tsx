"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, Check, X, AlertCircle, Copy } from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import * as Clipboard from "expo-clipboard"
import * as SecureStore from "expo-secure-store"
import algosdk from "algosdk"
import { createClient } from "@supabase/supabase-js"
import { LinearGradient } from "expo-linear-gradient"
import { Buffer } from "buffer"

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://tficheendnovlkzoqoop.supabase.co"
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmaWNoZWVuZG5vdmxrem9xb29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MTM5NjksImV4cCI6MjA1NDk4OTk2OX0.TNCHYkgbgFchghO2FGoC9c_hSm1x1ACtBdzLdFQSbPE"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface TransactionData {
  txnId: string
  txnB64: string
  sessionId: string
  timestamp: string
}

export default function TransactionHandlerScreen() {
  const params = useLocalSearchParams()
  const [txnData, setTxnData] = useState<TransactionData | null>(null)
  const [decodedTxn, setDecodedTxn] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      if (params.txnData) {
        const data = JSON.parse(params.txnData as string)
        setTxnData(data)
        decodeTxn(data.txnB64)
      } else if (params.txnId && params.txnB64 && params.sessionId) {
        const data = {
          txnId: params.txnId as string,
          txnB64: params.txnB64 as string,
          sessionId: params.sessionId as string,
          timestamp: (params.timestamp as string) || new Date().toISOString(),
        }
        setTxnData(data)
        decodeTxn(data.txnB64)
      } else {
        Alert.alert("Error", "No transaction data provided")
        router.back()
      }
    } catch (error) {
      console.error("Error parsing transaction data:", error)
      Alert.alert("Error", "Invalid transaction data format")
    } finally {
      setLoading(false)
    }
  }, [params])

  const decodeTxn = (txnB64: string) => {
    try {
      // Decode base64 transaction
      const txnBytes = Buffer.from(txnB64, "base64")
      const txn = algosdk.decodeObj(txnBytes)
      console.log("Decoded transaction:", txn)
      setDecodedTxn(txn)
    } catch (error) {
      console.error("Error decoding transaction:", error)
      Alert.alert("Error", "Failed to decode transaction data")
    }
  }

  const handleApprove = async () => {
    if (!txnData) return

    try {
      setSigning(true)

      // Get wallet mnemonic
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (!mnemonic) {
        Alert.alert("Error", "No wallet found. Please create a wallet first.")
        return
      }

      // Get account from mnemonic
      const account = algosdk.mnemonicToSecretKey(mnemonic)

      // Decode transaction
      const txnBytes = Buffer.from(txnData.txnB64, "base64")
      const decodedTxn = algosdk.decodeUnsignedTransaction(txnBytes)

      // Sign transaction
      const signedTxn = decodedTxn.signTxn(account.sk)
      const signedTxnB64 = Buffer.from(signedTxn).toString("base64")

      // Send signed transaction back through Supabase
      const channel = supabase.channel(`wallet_transaction:${account.addr}`)
      await channel.subscribe()

      await channel.send({
        type: "broadcast",
        event: "transaction_signed",
        payload: {
          txnId: txnData.txnId,
          signedTxnB64: signedTxnB64,
          status: "approved",
        },
      })

      // Unsubscribe from channel
      channel.unsubscribe()

      Alert.alert("Success", "Transaction signed and sent successfully")
      router.back()
    } catch (error) {
      console.error("Error signing transaction:", error)
      Alert.alert("Error", "Failed to sign transaction")
    } finally {
      setSigning(false)
    }
  }

  const handleReject = async () => {
    if (!txnData) return

    try {
      setSigning(true)

      // Get wallet address
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (!mnemonic) {
        Alert.alert("Error", "No wallet found")
        return
      }
      const account = algosdk.mnemonicToSecretKey(mnemonic)

      // Send rejection through Supabase
      const channel = supabase.channel(`wallet_transaction:${account.addr}`)
      await channel.subscribe()

      await channel.send({
        type: "broadcast",
        event: "transaction_rejected",
        payload: {
          txnId: txnData.txnId,
          status: "rejected",
          reason: "User rejected the transaction",
        },
      })

      // Unsubscribe from channel
      channel.unsubscribe()

      Alert.alert("Rejected", "Transaction has been rejected")
      router.back()
    } catch (error) {
      console.error("Error rejecting transaction:", error)
      Alert.alert("Error", "Failed to reject transaction")
    } finally {
      setSigning(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatAmount = (amount: number) => {
    return (amount / 1000000).toFixed(6)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading transaction data...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <LinearGradient
          colors={["#7C3AED", "#4F46E5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.txnHeader}
        >
          <AlertCircle size={32} color="#ffffff" />
          <Text style={styles.txnHeaderTitle}>Transaction Request</Text>
          <Text style={styles.txnHeaderSubtitle}>Review and approve or reject this transaction request</Text>
        </LinearGradient>

        <View style={styles.txnDetailsCard}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue} numberOfLines={1}>
                {txnData?.txnId}
              </Text>
              <TouchableOpacity onPress={() => txnData && copyToClipboard(txnData.txnId)}>
                {copied ? <Check size={16} color="#4ADE80" /> : <Copy size={16} color="#9CA3AF" />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Timestamp</Text>
            <Text style={styles.detailValue}>{txnData ? formatTimestamp(txnData.timestamp) : "N/A"}</Text>
          </View>

          {decodedTxn && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>{decodedTxn.type === "pay" ? "Payment" : decodedTxn.type}</Text>
              </View>

              {decodedTxn.amt !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>{formatAmount(decodedTxn.amt)} ALGO</Text>
                </View>
              )}

              {decodedTxn.fee !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fee</Text>
                  <Text style={styles.detailValue}>{formatAmount(decodedTxn.fee)} ALGO</Text>
                </View>
              )}

              {decodedTxn.rcv && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Recipient</Text>
                  <View style={styles.detailValueContainer}>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {decodedTxn.rcv}
                    </Text>
                    <TouchableOpacity onPress={() => copyToClipboard(decodedTxn.rcv)}>
                      <Copy size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {decodedTxn.note && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Note</Text>
                  <Text style={styles.detailValue}>{decodedTxn.note}</Text>
                </View>
              )}
            </>
          )}

          <View style={styles.rawDataContainer}>
            <Text style={styles.rawDataTitle}>Raw Transaction Data</Text>
            <TouchableOpacity style={styles.rawDataButton} onPress={() => txnData && copyToClipboard(txnData.txnB64)}>
              <Text style={styles.rawDataButtonText}>Copy Base64 Data</Text>
              <Copy size={16} color="#7C3AED" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.warningCard}>
          <AlertCircle size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            Always verify transaction details before approving. Once approved, transactions cannot be reversed.
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
            disabled={signing}
          >
            <X size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={handleApprove}
            disabled={signing}
          >
            {signing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Check size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Approve</Text>
              </>
            )}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  txnHeader: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  txnHeaderTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  txnHeaderSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    textAlign: "center",
  },
  txnDetailsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  detailLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  detailValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 2,
    justifyContent: "flex-end",
  },
  rawDataContainer: {
    marginTop: 16,
  },
  rawDataTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  rawDataButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  rawDataButtonText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  warningText: {
    color: "#F59E0B",
    fontSize: 14,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: "#10B981",
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    marginTop: 16,
  },
})
