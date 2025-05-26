"use client"

import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { ArrowLeft, Search } from "lucide-react-native"
import { useState, useEffect } from "react"
import { router } from "expo-router"
import algosdk from "algosdk"
import { LinearGradient } from "expo-linear-gradient"

interface NFTAsset {
  index: number
  params: {
    name: string
    unitName: string
    total: number
    decimals: number
    url?: string
    creator: string
  }
}

export default function NFTsScreen() {
  const [nfts, setNfts] = useState<NFTAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadNFTs()
  }, [])

  const loadNFTs = async () => {
    try {
      setLoading(true)
      const indexerClient = new algosdk.Indexer("", "https://testnet-idx.algonode.cloud", "")

      // Search for NFTs (assets with total supply of 1 and 0 decimals)
      const response = await indexerClient.searchForAssets().limit(50).do()

      // Filter for NFTs (total supply = 1, decimals = 0)
      const nftAssets = response.assets.filter(
        (asset: any) =>
          asset.params.total === 1 && asset.params.decimals === 0 && asset.params.name && asset.params.name.length > 0,
      )

      setNfts(nftAssets)
    } catch (error) {
      console.error("Error loading NFTs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (url?: string) => {
    if (!url) return null
    if (url.startsWith("ipfs://")) {
      const ipfsHash = url.replace("ipfs://", "")
      return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
    }
    return url
  }

  const filteredNFTs = nfts.filter(
    (nft) =>
      nft.params.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.params.unitName?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const renderNFTItem = ({ item }: { item: NFTAsset }) => {
    const imageUrl = getImageUrl(item.params.url)

    return (
      <TouchableOpacity style={styles.nftCard} onPress={() => router.push(`/nft-details?assetId=${item.index}`)}>
        <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
          <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />

          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.nftImage} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
          </View>

          <View style={styles.nftInfo}>
            <Text style={styles.nftName} numberOfLines={1}>
              {item.params.name}
            </Text>
            <Text style={styles.nftUnit} numberOfLines={1}>
              {item.params.unitName || `#${item.index}`}
            </Text>
            <Text style={styles.assetId}>Asset ID: {item.index}</Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>NFT Collection</Text>
      </View>

      <View style={styles.searchContainer}>
        <BlurView intensity={40} tint="dark" style={styles.searchBlur}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.searchInput}>Search NFTs...</Text>
          </View>
        </BlurView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading NFTs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNFTs}
          renderItem={renderNFTItem}
          keyExtractor={(item) => item.index.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No NFTs found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or check back later</Text>
            </View>
          }
        />
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
  searchContainer: {
    margin: 16,
    marginTop: 0,
  },
  searchBlur: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  row: {
    justifyContent: "space-between",
  },
  nftCard: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardBlur: {
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    borderRadius: 16,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 150,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  nftImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  placeholderText: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 12,
  },
  nftInfo: {
    padding: 12,
    gap: 4,
  },
  nftName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  nftUnit: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  assetId: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
    fontFamily: "monospace",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
  },
})
