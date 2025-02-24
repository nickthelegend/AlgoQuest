"use client"

import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, ExternalLink, Copy, Check } from "lucide-react-native"
import { useState, useEffect } from "react"
import { router, useLocalSearchParams } from "expo-router"
import * as SecureStore from "expo-secure-store"
import * as Clipboard from "expo-clipboard"
import { LinearGradient } from "expo-linear-gradient"

interface Transaction {
  id: string
  "payment-transaction": {
    amount: number
    receiver: string
  }
  sender: string
  "round-time": number
  "confirmed-round": number
  fee: number
}

export default function TransactionDetailsScreen() {
  const { txId } = useLocalSearchParams()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [publicAddress, setPublicAddress] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadTransaction()
  }, [])

  const loadTransaction = async () => {
    try {
      const address = await SecureStore.getItemAsync("walletAddress")
      setPublicAddress(address || "")

      const response = await fetch(`https://testnet-idx.4160.nodely.dev/v2/transactions/${txId}`)
      const data = await response.json()
      setTransaction(data.transaction)
    } catch (error) {
      console.error("Error loading transaction:", error)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
  }

  const formatAmount = (microAlgos: number) => {
    return (microAlgos / 1000000).toFixed(6)
  }

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const viewOnExplorer = () => {
    Linking.openURL(`https://testnet.algoexplorer.io/tx/${txId}`)
  }

  if (!transaction) return null

  const isSender = transaction.sender === publicAddress

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction Details</Text>
      </View>

      <BlurView intensity={40} tint="dark" style={styles.content}>
        <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />

        <View style={styles.iconContainer}>
          {isSender ? <ArrowUpRight size={32} color="#EF4444" /> : <ArrowDownLeft size={32} color="#4ADE80" />}
        </View>

        <Text style={styles.amount}>
                      {/* {transaction.sender === publicAddress ? "-" : "+"} */}
                      {transaction["payment-transaction"]?.amount !== undefined
  ? `${transaction.sender === publicAddress ? "-" : "+"} ${formatAmount(transaction["payment-transaction"].amount)} ALGO`
  : "Asset Config"}
                    </Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Confirmed</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(transaction["round-time"])}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction Fee</Text>
            <Text style={styles.detailValue}>{formatAmount(transaction.fee)} ALGO</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Confirmed in Round</Text>
            <Text style={styles.detailValue}>{transaction["confirmed-round"]}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.address} numberOfLines={1}>
                {transaction.sender}
              </Text>
              <TouchableOpacity onPress={() => copyToClipboard(transaction.sender)}>
                {copied ? <Check size={16} color="#4ADE80" /> : <Copy size={16} color="#ffffff" />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>To</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.address} numberOfLines={1}>
              {transaction["payment-transaction"]?.receiver !== undefined
  ? transaction["payment-transaction"].receiver
  : "Asset Config"}
              </Text>
              <TouchableOpacity onPress={() => copyToClipboard(transaction["payment-transaction"].receiver)}>
                {copied ? <Check size={16} color="#4ADE80" /> : <Copy size={16} color="#ffffff" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.explorerButton} onPress={viewOnExplorer}>
          <Text style={styles.explorerButtonText}>View on Explorer</Text>
          <ExternalLink size={16} color="#7C3AED" />
        </TouchableOpacity>
      </BlurView>
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
    margin: 16,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    overflow: "hidden",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    alignSelf: "center",
  },
  amount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 24,
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
  detailValue: {
    fontSize: 16,
    color: "#ffffff",
  },
  statusBadge: {
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#4ADE80",
    fontSize: 14,
    fontWeight: "600",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: "#ffffff",
    fontFamily: "monospace",
  },
  explorerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    padding: 16,
    borderRadius: 12,
  },
  explorerButtonText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
  },
})

