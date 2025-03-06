"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"
import { ArrowLeft, Tag, AlertCircle, Shield, Sword, Heart, Zap } from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import { supabase } from "@/lib/supabase"
import * as SecureStore from "expo-secure-store"
import algosdk from "algosdk"

const METHODS = [
  new algosdk.ABIMethod({ name: "optIntoAsset", desc: "", args: [{ type: "uint64", name: "asset", desc: "" }], returns: { type: "void", desc: "" } }),
  new algosdk.ABIMethod({ name: "optIntoNFT", desc: "", args: [{ type: "uint64", name: "asset", desc: "" }], returns: { type: "void", desc: "" } }),

];


interface Beast {
  id: string
  name: string
  owner_id: string
  asset_id: string
  tier: number
  image_url: string
  ipfs_url: string
  allocated_stats: {
    attack: number
    defense: number
    speed: number
    health: number
  }
  metadata: any
}

export default function SellBeastScreen() {
  const { id } = useLocalSearchParams()
  const [beast, setBeast] = useState<Beast | null>(null)
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingBeast, setLoadingBeast] = useState(true)
  const [isAlreadyListed, setIsAlreadyListed] = useState(false)

  useEffect(() => {
    loadBeast()
  }, [])

  const loadBeast = async () => {
    try {
      setLoadingBeast(true)
      const { data, error } = await supabase.from("beasts").select("*").eq("id", id).single()

      if (error) throw error
      if (!data) throw new Error("Beast not found")

      setBeast(data)

      // Check if beast is already listed
      const { data: listingData, error: listingError } = await supabase
        .from("marketplace_listings")
        .select("id")
        .eq("beast_id", id)
        .eq("status", "active")
        .single()
        console.log(id)

      if (listingData) {
        setIsAlreadyListed(true)
      }
    } catch (err) {
      console.error("Error loading beast:", err)
      Alert.alert("Error", "Failed to load beast details")
      router.back()
    } finally {
      setLoadingBeast(false)
    }
  }

  const handleSell = async () => {
    if (!beast || !price || isNaN(Number(price))) {
      Alert.alert("Error", "Please enter a valid price")
      return
    }

    try {
      setLoading(true)

      // Get wallet address and mnemonic
      const walletAddress = await SecureStore.getItemAsync("walletAddress")
      const mnemonic = await SecureStore.getItemAsync("mnemonic")
      if (!mnemonic) throw new Error("No mnemonic found")

      const account = algosdk.mnemonicToSecretKey(mnemonic)

      if (!walletAddress || !mnemonic) {
        throw new Error("Wallet not found")
      }


      const payload = {
        seller: walletAddress,
        price
      };
  
      // Make the API request
      const response = await fetch('http://172.16.5.72:3000/api/createApp', {
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
      const questAssetID= 734399300;
      const beastAssetID= beast.asset_id;


      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")

//       // 5. Get suggested parameters
      const suggestedParams = await algodClient.getTransactionParams().do()


      const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: account.addr,
        receiver: appAddress,
        amount: 500000,
        suggestedParams,
    });
    
    const signedTxn = txn1.signTxn(account.sk)
      const { txid } = await algodClient.sendRawTransaction(signedTxn).do()
      
      await algosdk.waitForConfirmation(algodClient, txid, 4)




    const txn2 = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account.addr,
        appIndex: Number(appID),
        appArgs: [
            algosdk.getMethodByName(METHODS, 'optIntoAsset').getSelector(),
            algosdk.encodeUint64(questAssetID),
        ],
        foreignAssets: [questAssetID],
        suggestedParams: { ...suggestedParams, fee: Number(30) },
    });
    
    const txn3 = algosdk.makeApplicationNoOpTxnFromObject({
      sender: account.addr,
      appIndex: Number(appID),
      appArgs: [
          algosdk.getMethodByName(METHODS, 'optIntoNFT').getSelector(),
          algosdk.encodeUint64(Number(beastAssetID)),
      ],
      foreignAssets: [Number(beastAssetID)],
      suggestedParams: { ...suggestedParams, fee: Number(30) },
  });
  const nftTransfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: account.addr,
    receiver: appAddress,
    assetIndex: Number(beastAssetID),
    amount: 1,
    suggestedParams,
  })
    
    // Assign a group ID to both transactions
    const txns = [txn2, txn3,nftTransfer];
    const txGroup = algosdk.assignGroupID(txns);
    
    // Sign both transactions
    const signedTxns = txns.map(txn => txn.signTxn(account.sk));
    const txId = txn1.txID(); // Use the first transaction's txID

    // Send the signed transactions atomically
    await algodClient.sendRawTransaction(signedTxns).do();
    
await algosdk.waitForConfirmation(
  algodClient,
  txId.toString(),
  3
);
// const amount = 10; // 10,000,000 microAlgos
// const atc = new algosdk.AtomicTransactionComposer();

// // Create the AssetTransferTxn:
// const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
//   sender: walletAddress,              // the account sending the payment
//   receiver: "5XKN6WRT27HGNTGMYI7TLIG6RPFMZQR7R7TSL4RYM4ZFDHFELS7L3OOHHY",            // the app's address, as expected by your contract
//   assetIndex: 734399300,        // the asset ID you expect to be transferred
//   amount,                        // the amount to transfer (10 algos in microAlgos)
//   suggestedParams,               // obtained from algod
// });

// // If you are using an atomic transaction composer (ATC),
// // you need to wrap it with its signer:
// const assetTransferTxnWithSigner = {
//   txn: assetTransferTxn,
//   signer: algosdk.makeBasicAccountTransactionSigner(account),
// };

// // Then pass assetTransferTxnWithSigner as the argument for your ABI method call:
// atc.addMethodCall({
//   appID: 735051464,
//   method: new algosdk.ABIMethod({ name: "buyNFT", desc: "", args: [{ type: "axfer", name: "ebaTxn", desc: "" }], returns: { type: "void", desc: "" } }), // your ABI method (buyNFT)
//   signer: algosdk.makeBasicAccountTransactionSigner(account),
//   methodArgs: [assetTransferTxnWithSigner], 
//   sender: "3FRGAL3WV46LP5H45L267DMCSSUWKQQLT4XFDYKSRIJBOJE6H5XEJMLK3Y",
//   suggestedParams,
// });


// const result = await atc.execute(algodClient, 4);
// for (const mr of result.methodResults) {
//   console.log(`${mr.returnValue}`);
// }







      // Get user ID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", walletAddress)
        .single()

      if (userError) throw userError
      if (!userData) throw new Error("User not found")

      // Create marketplace listing
      const { data: listing, error: listingError } = await supabase.from("marketplace_listings").insert({
        beast_id: beast.id,
        seller_id: userData.id,
        asset_id: beast.asset_id,
        price: Number(price),
        status: "active",
        metadata: beast.metadata,
        ipfs_url: beast.ipfs_url,
      })

      if (listingError) throw listingError

      // Update the listing with app details
      const { error: updateError } = await supabase
        .from("marketplace_listings")
        .update({
          app_id: appID,
          app_address: appAddress,
        })
        .eq("beast_id", beast.id)
        .eq("status", "active")

      if (updateError) throw updateError

      Alert.alert("Success", "Your beast has been listed for sale!", [
        {
          text: "View Marketplace",
          onPress: () => router.push("/marketplace"),
        },
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ])
    } catch (error) {
      console.error("Error listing beast:", error)
      Alert.alert("Error", "Failed to list beast for sale")
    } finally {
      setLoading(false)
    }
  }

  const renderStatBar = (value: number, color: string) => (
    <View style={styles.statBarContainer}>
      <View style={[styles.statBarFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  )

  if (loadingBeast) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading beast details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!beast) return null

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

          {/* Beast Preview */}
          <View style={styles.beastPreview}>
            <Image source={{ uri: beast.image_url }} style={styles.beastImage} />
            <Text style={styles.beastName}>{beast.name}</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Sword size={16} color="#EF4444" />
                {renderStatBar(beast.allocated_stats.attack, "#EF4444")}
              </View>
              <View style={styles.statRow}>
                <Shield size={16} color="#3B82F6" />
                {renderStatBar(beast.allocated_stats.defense, "#3B82F6")}
              </View>
              <View style={styles.statRow}>
                <Zap size={16} color="#F59E0B" />
                {renderStatBar(beast.allocated_stats.speed, "#F59E0B")}
              </View>
              <View style={styles.statRow}>
                <Heart size={16} color="#10B981" />
                {renderStatBar(beast.allocated_stats.health, "#10B981")}
              </View>
            </View>
          </View>

          {isAlreadyListed ? (
            <View style={styles.alreadyListedContainer}>
              <AlertCircle size={24} color="#EF4444" />
              <Text style={styles.alreadyListedText}>This beast is already listed on the marketplace.</Text>
              <TouchableOpacity style={styles.viewListingButton} onPress={() => router.push("/marketplace")}>
                <Text style={styles.viewListingButtonText}>View Marketplace</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
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
                <Text style={styles.listButtonText}>{loading ? "Listing Beast..." : "List Beast for Sale"}</Text>
              </TouchableOpacity>
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 16,
    fontSize: 16,
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
  beastPreview: {
    alignItems: "center",
    marginBottom: 24,
  },
  beastImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  beastName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  statsContainer: {
    width: "100%",
    gap: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 2,
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
  alreadyListedContainer: {
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  alreadyListedText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 12,
  },
  viewListingButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  viewListingButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
})

