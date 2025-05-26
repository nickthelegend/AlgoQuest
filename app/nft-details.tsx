"use client"

import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, ScrollView, Alert, Share } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { ArrowLeft, ExternalLink, Copy, Share2, RefreshCw, Calendar, User, Hash, Layers } from "lucide-react-native"
import { useState, useEffect } from "react"
import { router, useLocalSearchParams } from "expo-router"
import algosdk from "algosdk"
import { LinearGradient } from "expo-linear-gradient"
import * as Clipboard from "expo-clipboard"

interface AssetDetails {
  index: number
  params: {
    name: string
    unitName: string
    total: number | bigint
    decimals: number
    url?: string
    creator: string
    manager?: string
    reserve?: string
    freeze?: string
    clawback?: string
    defaultFrozen?: boolean
  }
  createdAtRound?: number
  deletedAtRound?: number
}

interface NFTMetadata {
  name?: string
  description?: string
  image?: string
  external_url?: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

export default function NFTDetailsScreen() {
  const { id } = useLocalSearchParams()
  const [assetDetails, setAssetDetails] = useState<AssetDetails | null>(null)
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    loadAssetDetails()
  }, [])

  const loadAssetDetails = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "")
      const asset = await algodClient.getAssetByID(Number(id)).do()

      const convertedAsset: AssetDetails = {
        index: Number(asset.index),
        params: {
          name: asset.params.name || "Unnamed NFT",
          unitName: asset.params.unitName || "",
          total: Number(asset.params.total),
          decimals: asset.params.decimals,
          url: asset.params.url,
          creator: asset.params.creator,
          manager: asset.params.manager,
          reserve: asset.params.reserve,
          freeze: asset.params.freeze,
          clawback: asset.params.clawback,
          defaultFrozen: asset.params.defaultFrozen,
        },
        createdAtRound: asset.createdAtRound,
        deletedAtRound: asset.deletedAtRound,
      }

      setAssetDetails(convertedAsset)

      // Handle image and metadata
      if (asset.params.url) {
        await loadImageAndMetadata(asset.params.url)
      }
    } catch (error) {
      console.error("Error loading asset details:", error)
      Alert.alert("Error", "Failed to load NFT details. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadImageAndMetadata = async (url: string) => {
    try {
      if (url.startsWith("ipfs://")) {
        const ipfsHash = url.replace("ipfs://", "")
        const gateways = [
          `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
          `https://ipfs.io/ipfs/${ipfsHash}`,
          `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
        ]

        // Try to load metadata first
        for (const gateway of gateways) {
          try {
            const response = await fetch(gateway)
            if (response.ok) {
              const contentType = response.headers.get("content-type")

              if (contentType?.includes("application/json")) {
                const metadataJson = await response.json()
                setMetadata(metadataJson)

                // If metadata has image, use it
                if (metadataJson.image) {
                  let imageUrl = metadataJson.image
                  if (imageUrl.startsWith("ipfs://")) {
                    const imageHash = imageUrl.replace("ipfs://", "")
                    imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`
                  }
                  setImageUrl(imageUrl)
                } else {
                  setImageUrl(gateway)
                }
                break
              } else {
                // Direct image URL
                setImageUrl(gateway)
                break
              }
            }
          } catch (error) {
            console.log(`Failed to load from ${gateway}:`, error)
            continue
          }
        }
      } else {
        setImageUrl(url)
      }
    } catch (error) {
      console.error("Error loading image/metadata:", error)
      setImageError(true)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text)
    Alert.alert("Copied", `${label} copied to clipboard`)
  }

  const shareNFT = async () => {
    try {
      await Share.share({
        message: `Check out this NFT: ${assetDetails?.params.name}\nAsset ID: ${id}\nhttps://testnet.algoexplorer.io/asset/${id}`,
        title: assetDetails?.params.name || "NFT",
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const viewOnExplorer = () => {
    Linking.openURL(`https://testnet.algoexplorer.io/asset/${id}`)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>NFT Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading NFT details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!assetDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>NFT Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load NFT details</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadAssetDetails()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
        <Text style={styles.title}>NFT Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => loadAssetDetails(true)}
            style={[styles.actionButton, refreshing && styles.actionButtonDisabled]}
            disabled={refreshing}
          >
            <RefreshCw size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={shareNFT} style={styles.actionButton}>
            <Share2 size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <BlurView intensity={40} tint="dark" style={styles.content}>
          <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />

          {/* Image Section */}
          <View style={styles.imageContainer}>
            {imageUrl && !imageError ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="contain"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Layers size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.placeholderText}>No image available</Text>
              </View>
            )}
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <Text style={styles.imageLoadingText}>Loading image...</Text>
              </View>
            )}
          </View>

          {/* NFT Name and Description */}
          <View style={styles.nameSection}>
            <Text style={styles.nftName}>{metadata?.name || assetDetails.params.name}</Text>
            {metadata?.description && <Text style={styles.nftDescription}>{metadata.description}</Text>}
          </View>

          {/* Basic Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asset Information</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <Hash size={16} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.detailLabel}>Asset ID</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyableValue}
                  onPress={() => copyToClipboard(assetDetails.index.toString(), "Asset ID")}
                >
                  <Text style={styles.detailValue}>#{assetDetails.index}</Text>
                  <Copy size={14} color="rgba(255, 255, 255, 0.5)" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <Text style={styles.detailLabel}>Unit Name</Text>
                </View>
                <Text style={styles.detailValue}>{assetDetails.params.unitName || "N/A"}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <Layers size={16} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.detailLabel}>Supply</Text>
                </View>
                <Text style={styles.detailValue}>{assetDetails.params.total.toString()}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <Text style={styles.detailLabel}>Decimals</Text>
                </View>
                <Text style={styles.detailValue}>{assetDetails.params.decimals}</Text>
              </View>
            </View>
          </View>

          {/* Creator Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Creator Information</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <User size={16} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.detailLabel}>Creator</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyableValue}
                  onPress={() => copyToClipboard(assetDetails.params.creator, "Creator Address")}
                >
                  <Text style={styles.detailValue}>{formatAddress(assetDetails.params.creator)}</Text>
                  <Copy size={14} color="rgba(255, 255, 255, 0.5)" />
                </TouchableOpacity>
              </View>

              {assetDetails.params.manager && assetDetails.params.manager !== assetDetails.params.creator && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <Text style={styles.detailLabel}>Manager</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyableValue}
                    onPress={() => copyToClipboard(assetDetails.params.manager!, "Manager Address")}
                  >
                    <Text style={styles.detailValue}>{formatAddress(assetDetails.params.manager)}</Text>
                    <Copy size={14} color="rgba(255, 255, 255, 0.5)" />
                  </TouchableOpacity>
                </View>
              )}

              {assetDetails.createdAtRound && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelContainer}>
                    <Calendar size={16} color="rgba(255, 255, 255, 0.5)" />
                    <Text style={styles.detailLabel}>Created at Round</Text>
                  </View>
                  <Text style={styles.detailValue}>{assetDetails.createdAtRound}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Attributes */}
          {metadata?.attributes && metadata.attributes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attributes</Text>
              <View style={styles.attributesContainer}>
                {metadata.attributes.map((attr, index) => (
                  <View key={index} style={styles.attributeCard}>
                    <Text style={styles.attributeType}>{attr.trait_type}</Text>
                    <Text style={styles.attributeValue}>{attr.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* IPFS URL */}
          {assetDetails.params.url && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Metadata</Text>
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>IPFS URL</Text>
                  <TouchableOpacity
                    style={styles.copyableValue}
                    onPress={() => copyToClipboard(assetDetails.params.url!, "IPFS URL")}
                  >
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {assetDetails.params.url.length > 30
                        ? `${assetDetails.params.url.slice(0, 30)}...`
                        : assetDetails.params.url}
                    </Text>
                    <Copy size={14} color="rgba(255, 255, 255, 0.5)" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* External Link */}
          {metadata?.external_url && (
            <TouchableOpacity style={styles.externalLinkButton} onPress={() => Linking.openURL(metadata.external_url!)}>
              <Text style={styles.externalLinkText}>View External Link</Text>
              <ExternalLink size={16} color="#7C3AED" />
            </TouchableOpacity>
          )}

          {/* Explorer Button */}
          <TouchableOpacity style={styles.explorerButton} onPress={viewOnExplorer}>
            <Text style={styles.explorerButtonText}>View on AlgoExplorer</Text>
            <ExternalLink size={16} color="#7C3AED" />
          </TouchableOpacity>
        </BlurView>
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
    flex: 1,
    marginLeft: 16,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
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
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  placeholderText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageLoadingText: {
    color: "#ffffff",
    fontSize: 14,
  },
  nameSection: {
    marginBottom: 24,
  },
  nftName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  nftDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  copyableValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  attributesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  attributeCard: {
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    minWidth: 100,
  },
  attributeType: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: 4,
  },
  attributeValue: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
  },
  externalLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  externalLinkText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
  },
  explorerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  explorerButtonText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
  },
})
