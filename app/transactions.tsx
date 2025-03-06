"use client"

import { View, Text, StyleSheet, TouchableOpacity, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react-native"
import { useState, useEffect } from "react"
import { router } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { ScrollView } from "react-native-gesture-handler"

interface Transaction {
  id: string
  "payment-transaction": {
    amount: number
    receiver: string
  }
  sender: string
  "round-time": number
}

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [publicAddress, setPublicAddress] = useState("")

  useEffect(() => {
    loadWalletAddress()
  }, [])

  const loadWalletAddress = async () => {
    try {
      const address = await SecureStore.getItemAsync("walletAddress")
      if (address) {
        setPublicAddress(address)
        fetchTransactions(address)
      }
    } catch (error) {
      console.error("Error loading wallet address:", error)
    }
  }

  const fetchTransactions = async (address: string) => {
    try {
      setLoading(true)
      const response = await fetch(`https://testnet-idx.4160.nodely.dev/v2/accounts/${address}/transactions`)
      const data = await response.json()

      // Sort transactions by timestamp in descending order
      const sortedTransactions = data.transactions.sort(
        (a: Transaction, b: Transaction) => b["round-time"] - a["round-time"],
      )

      setTransactions(sortedTransactions)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchTransactions(publicAddress)
    setRefreshing(false)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
  }

  const formatAmount = (microAlgos: number) => {
    return (microAlgos / 1000000).toFixed(3)
  }

  const viewTransactionDetails = (transaction: Transaction) => {
    router.push({
      pathname: "/transaction-details",
      params: { txId: transaction.id },
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
      >
        {transactions.map((transaction, index) => (
          <Animated.View key={transaction.id} entering={FadeInDown.delay(index * 100)}>
            <TouchableOpacity onPress={() => viewTransactionDetails(transaction)}>
              <BlurView intensity={40} tint="dark" style={styles.transactionCard}>
                <View style={styles.iconContainer}>
                  {transaction.sender === publicAddress ? (
                    <ArrowUpRight size={20} color="#EF4444" />
                  ) : (
                    <ArrowDownLeft size={20} color="#4ADE80" />
                  )}
                </View>
                <View style={styles.transactionInfo}>
                  <View style={styles.row}>
                    <Text style={styles.amount}>
                      {/* {transaction.sender === publicAddress ? "-" : "+"} */}
                      {transaction["payment-transaction"]?.amount !== undefined
  ? `${transaction.sender === publicAddress ? "-" : "+"} ${formatAmount(transaction["payment-transaction"].amount)} ALGO`
  : "Asset Config"}
                    </Text>
                    <View style={styles.timeContainer}>
                      <Clock size={12} color="rgba(255, 255, 255, 0.5)" />
                      <Text style={styles.time}>{formatDate(transaction["round-time"])}</Text>
                    </View>
                  </View>
                  <Text style={styles.transactionId} numberOfLines={1}>
                    ID: {transaction.id}
                  </Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {loading && (
          <BlurView intensity={40} tint="dark" style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </BlurView>
        )}

        {!loading && transactions.length === 0 && (
          <BlurView intensity={40} tint="dark" style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No transactions yet</Text>
          </BlurView>
        )}
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
  },
  transactionId: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    fontFamily: "monospace",
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  loadingText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.5)",
  },
  emptyState: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyStateText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.5)",
  },
})

