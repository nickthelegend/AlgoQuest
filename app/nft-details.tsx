"use client"

import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { ArrowLeft, ExternalLink } from "lucide-react-native"
import { useState, useEffect } from "react"
import { router, useLocalSearchParams } from "expo-router"
import algosdk from "algosdk"
import { LinearGradient } from "expo-linear-gradient"

interface AssetDetails {
  index: number
  params: {
    name: string
    unitName: string
    total: number | bigint
    decimals: number
    url?: string
    creator: string
  }
}

export default function NFTDetailsScreen() {
  const { assetId } = useLocalSearchParams()
  const [assetDetails, setAssetDetails] = useState<AssetDetails | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")

  useEffect(() => {
    loadAssetDetails()
  }, [])

  const loadAssetDetails = async () => {
    try {
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")
      const asset = await algodClient.getAssetByID(Number(assetId)).do()

      // Convert the asset to match our AssetDetails interface
      const convertedAsset: AssetDetails = {
        index: Number(asset.index),
        params: {
          name: asset.params.name,
          unitName: asset.params.unitName,
          total: Number(asset.params.total),
          decimals: asset.params.decimals,
          url: asset.params.url,
          creator: asset.params.creator,
        },
      }

      setAssetDetails(convertedAsset)

      // Handle IPFS URL
      if (asset.params.url && typeof asset.params.url === "string" && asset.params.url.startsWith("ipfs://")) {
        const ipfsHash = asset.params.url.replace("ipfs://", "")
        // Use a more reliable IPFS gateway
        setImageUrl(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`)
      }
    } catch (error) {
      console.error("Error loading asset details:", error)
    }
  }

  const viewOnExplorer = () => {
    Linking.openURL(`https://testnet.algoexplorer.io/asset/${assetId}`)
  }

  if (!assetDetails) return null

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>NFT Details</Text>
      </View>

      <BlurView intensity={40} tint="dark" style={styles.content}>
        <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />

        {imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
          </View>
        ) : (
          <View style={[styles.imageContainer, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>Image not available</Text>
          </View>
        )}

        <Text style={styles.nftName}>{assetDetails.params.name}</Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Asset ID</Text>
            <Text style={styles.detailValue}>#{assetDetails.index}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Unit Name</Text>
            <Text style={styles.detailValue}>{assetDetails.params.unitName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Supply</Text>
            <Text style={styles.detailValue}>{assetDetails.params.total.toString()}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Creator</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {assetDetails.params.creator}
            </Text>
          </View>

          {assetDetails.params.url && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>IPFS URL</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {assetDetails.params.url}
              </Text>
            </View>
          )}
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
    margin: 16,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 250, // Reduced height
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
  },
  nftName: {
    fontSize: 24,
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

