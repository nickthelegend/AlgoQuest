"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Alert } from "react-native"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeInRight } from "react-native-reanimated"
import { ArrowLeft, ShoppingBag, Tag, ChevronRight, Star, Info, Clock, Shield } from "lucide-react-native"
import { router, useLocalSearchParams, useNavigation } from "expo-router"
import { useState, useEffect } from "react"
import ScreenLayout from "../../components/screen-layout"
import * as SecureStore from "expo-secure-store"

const { width, height } = Dimensions.get("window")

// Shop item categories and data
const shopCategories = [
  {
    id: "tshirts",
    name: "AlgoQuest T-shirts",
    icon: "👕",
    items: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `AlgoQuest T-shirt ${i + 1}`,
      price: 500 + i * 50,
      imageId: i + 1,
      description: `Limited edition AlgoQuest T-shirt featuring unique blockchain-inspired design. Made from premium cotton for maximum comfort.`,
      category: "tshirts",
      inStock: true,
      popular: i < 3,
    })),
  },
  {
    id: "bottles",
    name: "AlgoQuest Bottles",
    icon: "🍶",
    items: Array.from({ length: 3 }, (_, i) => ({
      id: 11 + i,
      name: `AlgoQuest Bottle ${i + 1}`,
      price: 350 + i * 50,
      imageId: 11 + i,
      description: `Eco-friendly AlgoQuest water bottle. Keeps your drinks cold for 24 hours or hot for 12 hours. Perfect for on-the-go hydration.`,
      category: "bottles",
      inStock: true,
      popular: i === 0,
    })),
  },
  {
    id: "cups",
    name: "Coffee Cups",
    icon: "☕",
    items: Array.from({ length: 3 }, (_, i) => ({
      id: 14 + i,
      name: `AlgoQuest Coffee Cup ${i + 1}`,
      price: 250 + i * 40,
      imageId: 14 + i,
      description: `Premium ceramic coffee cup featuring AlgoQuest designs. Perfect for your morning coffee or afternoon tea.`,
      category: "cups",
      inStock: i !== 2,
      popular: i === 1,
    })),
  },
  {
    id: "bags",
    name: "Canvas Bags",
    icon: "👜",
    items: Array.from({ length: 3 }, (_, i) => ({
      id: 17 + i,
      name: `AlgoQuest Canvas Bag ${i + 1}`,
      price: 300 + i * 75,
      imageId: 17 + i,
      description: `Durable canvas bag with AlgoQuest artwork. Spacious interior with multiple pockets for all your essentials.`,
      category: "bags",
      inStock: true,
      popular: i === 2,
    })),
  },
]

// Helper function to get image source
const getImageSource = (imageId) => {
  // Static requires for each image
  const id = Number(imageId)
  switch (id) {
    case 1:
      return require("../../assets/shop/1.png")
    case 2:
      return require("../../assets/shop/2.png")
    case 3:
      return require("../../assets/shop/3.png")
    case 4:
      return require("../../assets/shop/4.png")
    case 5:
      return require("../../assets/shop/5.png")
    case 6:
      return require("../../assets/shop/6.png")
    case 7:
      return require("../../assets/shop/7.png")
    case 8:
      return require("../../assets/shop/8.png")
    case 9:
      return require("../../assets/shop/9.png")
    case 10:
      return require("../../assets/shop/10.png")
    case 11:
      return require("../../assets/shop/11.png")
    case 12:
      return require("../../assets/shop/12.png")
    case 13:
      return require("../../assets/shop/13.png")
    case 14:
      return require("../../assets/shop/14.png")
    case 15:
      return require("../../assets/shop/15.png")
    case 16:
      return require("../../assets/shop/16.png")
    case 17:
      return require("../../assets/shop/17.png")
    case 18:
      return require("../../assets/shop/18.png")
    case 19:
      return require("../../assets/shop/19.png")
    default:
      return require("../../assets/shop/1.png") // Default fallback
  }
}

// Related items based on category
const getRelatedItems = (category, currentId) => {
  // Find the category in shopCategories
  const categoryItems = shopCategories.find((cat) => cat.id === category)?.items || []

  // Filter out the current item and return up to 4 related items
  return categoryItems.filter((item) => item.id !== Number.parseInt(currentId)).slice(0, 4)
}

// Item details descriptions based on category
const getItemDetails = (category) => {
  const details = {
    tshirts: [
      { icon: <Tag size={16} color="#7C3AED" />, label: "100% Premium Cotton" },
      { icon: <Info size={16} color="#7C3AED" />, label: "Unisex Fit" },
      { icon: <Shield size={16} color="#7C3AED" />, label: "Machine Washable" },
    ],
    bottles: [
      { icon: <Tag size={16} color="#7C3AED" />, label: "BPA-Free Material" },
      { icon: <Clock size={16} color="#7C3AED" />, label: "24h Cold / 12h Hot" },
      { icon: <Shield size={16} color="#7C3AED" />, label: "Leak-Proof Design" },
    ],
    cups: [
      { icon: <Tag size={16} color="#7C3AED" />, label: "Ceramic Material" },
      { icon: <Info size={16} color="#7C3AED" />, label: "Microwave Safe" },
      { icon: <Shield size={16} color="#7C3AED" />, label: "Dishwasher Safe" },
    ],
    bags: [
      { icon: <Tag size={16} color="#7C3AED" />, label: "Durable Canvas" },
      { icon: <Info size={16} color="#7C3AED" />, label: "Multiple Pockets" },
      { icon: <Shield size={16} color="#7C3AED" />, label: "Reinforced Handles" },
    ],
  }

  return details[category] || details.tshirts
}

export default function ItemDetailScreen() {
  const params = useLocalSearchParams()
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [walletBalance, setWalletBalance] = useState(2000)
  const [relatedItems, setRelatedItems] = useState([])

  const { id, name, price, imageId, description, category, inStock = "true" } = params

  const isInStock = inStock === "true"
  const itemPrice = Number.parseInt(price as string)
  const totalPrice = itemPrice * quantity
  const canAfford = walletBalance >= totalPrice

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false)
      // Get related items
      setRelatedItems(getRelatedItems(category as string, id))
    }, 1000)

    // Simulate getting wallet balance
    const getBalance = async () => {
      try {
        const balance = await SecureStore.getItemAsync("questTokenBalance")
        if (balance) {
          setWalletBalance(Number.parseInt(balance))
        }
      } catch (error) {
        console.error("Error loading wallet balance:", error)
      }
    }

    getBalance()

    return () => clearTimeout(timer)
  }, [category, id])

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity)
    }
  }

  const handleBuyNow = () => {
    if (!isInStock) {
      Alert.alert("Out of Stock", "This item is currently unavailable. Please check back later.")
      return
    }

    if (!canAfford) {
      Alert.alert("Insufficient Balance", "You don't have enough $QUEST tokens to complete this purchase.")
      return
    }

    // Simulate purchase
    Alert.alert("Confirm Purchase", `Are you sure you want to buy ${quantity} ${name} for ${totalPrice} $QUEST?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Buy Now",
        onPress: () => {
          // Simulate successful purchase
          setTimeout(() => {
            Alert.alert("Purchase Successful!", "Your order has been placed. Check your inventory for details.", [
              {
                text: "OK",
                onPress: () => router.push("/(tabs)"),
              },
            ])
          }, 1000)
        },
      },
    ])
  }

  const navigateToItemDetail = (item) => {
    router.push({
      pathname: "/(shop)/item",
      params: {
        id: item.id,
        name: item.name,
        price: item.price,
        imageId: item.imageId,
        description: `Premium quality ${item.name} featuring unique AlgoQuest designs.`,
        category: item.category,
        inStock: "true",
      },
    })
  }

  const itemDetails = getItemDetails(category as string)

  return (
    <ScreenLayout>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack()
              } else {
                router.push("/(tabs)")
              }
            }}
          >
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Item Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Item Image */}
        <Animated.View entering={FadeIn.delay(200).springify()} style={styles.imageContainer}>
          <Image source={getImageSource(imageId)} style={styles.itemImage} resizeMode="cover" />
          {!isInStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </Animated.View>

        {/* Item Details */}
        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <BlurView intensity={40} tint="dark" style={styles.detailsContainer}>
            <LinearGradient colors={["rgba(124, 58, 237, 0.1)", "rgba(0, 0, 0, 0)"]} style={StyleSheet.absoluteFill} />

            {/* Item Name and Price */}
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>{price}</Text>
                <Text style={styles.priceCurrency}>$QUEST</Text>
              </View>
            </View>

            {/* Rating */}
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    color={star <= 4 ? "#7C3AED" : "rgba(255, 255, 255, 0.3)"}
                    fill={star <= 4 ? "#7C3AED" : "transparent"}
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>4.0 (24 reviews)</Text>
            </View>

            {/* Item Features */}
            <View style={styles.featuresContainer}>
              {itemDetails.map((detail, index) => (
                <View key={index} style={styles.featureItem}>
                  {detail.icon}
                  <Text style={styles.featureText}>{detail.label}</Text>
                </View>
              ))}
            </View>

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>
                {description ||
                  `Premium quality ${name} featuring unique AlgoQuest designs. Perfect for showing your love for blockchain gaming and the AlgoQuest community.`}
              </Text>
            </View>

            {/* Quantity Selector */}
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                  onPress={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={[styles.quantityButton, quantity >= 10 && styles.quantityButtonDisabled]}
                  onPress={() => handleQuantityChange(1)}
                  disabled={quantity >= 10}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Total Price */}
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Price</Text>
              <View style={styles.totalPrice}>
                <Text style={styles.totalAmount}>{totalPrice}</Text>
                <Text style={styles.totalCurrency}>$QUEST</Text>
              </View>
            </View>

            {/* Wallet Balance */}
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Your Balance:</Text>
              <View style={styles.balanceAmount}>
                <Text style={[styles.balanceValue, !canAfford && styles.insufficientBalance]}>{walletBalance}</Text>
                <Text style={styles.balanceCurrency}>$QUEST</Text>
              </View>
            </View>

            {/* Buy Button */}
            <TouchableOpacity
              style={[styles.buyButton, (!isInStock || !canAfford) && styles.buyButtonDisabled]}
              onPress={handleBuyNow}
              disabled={!isInStock || !canAfford}
            >
              <ShoppingBag size={20} color="#ffffff" />
              <Text style={styles.buyButtonText}>
                {!isInStock ? "Out of Stock" : !canAfford ? "Insufficient Balance" : "Buy Now"}
              </Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.relatedSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Tag size={18} color="#7C3AED" />
                <Text style={styles.sectionTitle}>You May Also Like</Text>
              </View>
              <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push("/[sidebar)/shop")}>
                <Text style={styles.viewAllText}>View All</Text>
                <ChevronRight size={16} color="#7C3AED" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedItemsContainer}
            >
              {relatedItems.map((item, index) => (
                <Animated.View key={item.id} entering={FadeInRight.delay(500 + index * 100).springify()}>
                  <TouchableOpacity
                    style={styles.relatedItemCard}
                    onPress={() => navigateToItemDetail(item)}
                    activeOpacity={0.7}
                  >
                    <BlurView intensity={40} tint="dark" style={styles.relatedItemContent}>
                      <View style={styles.relatedImageContainer}>
                        <Image
                          source={getImageSource(item.imageId)}
                          style={styles.relatedItemImage}
                          resizeMode="cover"
                        />
                      </View>
                      <View style={styles.relatedItemInfo}>
                        <Text style={styles.relatedItemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.relatedItemPrice}>
                          <Text style={styles.relatedPriceAmount}>{item.price}</Text>
                          <Text style={styles.relatedPriceCurrency}>$QUEST</Text>
                        </View>
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  imageContainer: {
    width: width,
    height: width * 0.8,
    marginBottom: 16,
    position: "relative",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  detailsContainer: {
    borderRadius: 24,
    marginHorizontal: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
    marginRight: 16,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  priceCurrency: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stars: {
    flexDirection: "row",
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderRadius: 12,
  },
  featureText: {
    fontSize: 12,
    color: "#ffffff",
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255, 255, 255, 0.8)",
  },
  quantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    color: "#ffffff",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    minWidth: 24,
    textAlign: "center",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  totalPrice: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  totalCurrency: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
  },
  balanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  balanceAmount: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  insufficientBalance: {
    color: "#EF4444",
  },
  balanceCurrency: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    borderRadius: 16,
  },
  buyButtonDisabled: {
    backgroundColor: "rgba(124, 58, 237, 0.4)",
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  relatedSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: "#7C3AED",
    fontWeight: "500",
  },
  relatedItemsContainer: {
    paddingVertical: 8,
    gap: 16,
  },
  relatedItemCard: {
    width: 160,
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  relatedItemContent: {
    flex: 1,
    padding: 8,
  },
  relatedImageContainer: {
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  relatedItemImage: {
    width: "100%",
    height: "100%",
  },
  relatedItemInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  relatedItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  relatedItemPrice: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  relatedPriceAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  relatedPriceCurrency: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
})
