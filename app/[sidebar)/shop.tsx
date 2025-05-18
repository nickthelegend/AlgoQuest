"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Pressable } from "react-native"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
} from "react-native-reanimated"
import { ArrowLeft, Tag, ChevronRight, Search, Star, Sparkles } from "lucide-react-native"
import { router, useNavigation } from "expo-router"
import { useState, useEffect, useRef } from "react"
import ScreenLayout from "../../components/screen-layout"

const { width, height } = Dimensions.get("window")
const ITEM_WIDTH = width - 32
const HEADER_HEIGHT = height * 0.32

// Helper function to get image source
const getImageSource = (id) => {
  // Static requires for each image
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

// Shop item categories and data
const shopCategories = [
  {
    id: "tshirts",
    name: "T-shirts",
    icon: "👕",
    color: "#7C3AED",
    items: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `AlgoQuest T-shirt ${i + 1}`,
      price: 500 + i * 50,
      imageId: i + 1,
      description: `Limited edition AlgoQuest T-shirt featuring unique blockchain-inspired design. Made from premium cotton for maximum comfort.`,
      category: "tshirts",
      inStock: true,
      popular: i < 3,
      rating: 4.5 - i * 0.1,
    })),
  },
  {
    id: "bottles",
    name: "Bottles",
    icon: "🍶",
    color: "#EC4899",
    items: Array.from({ length: 3 }, (_, i) => ({
      id: 11 + i,
      name: `AlgoQuest Bottle ${i + 1}`,
      price: 350 + i * 50,
      imageId: 11 + i,
      description: `Eco-friendly AlgoQuest water bottle. Keeps your drinks cold for 24 hours or hot for 12 hours. Perfect for on-the-go hydration.`,
      category: "bottles",
      inStock: true,
      popular: i === 0,
      rating: 4.7 - i * 0.2,
    })),
  },
  {
    id: "cups",
    name: "Coffee Cups",
    icon: "☕",
    color: "#F59E0B",
    items: Array.from({ length: 3 }, (_, i) => ({
      id: 14 + i,
      name: `AlgoQuest Coffee Cup ${i + 1}`,
      price: 250 + i * 40,
      imageId: 14 + i,
      description: `Premium ceramic coffee cup featuring AlgoQuest designs. Perfect for your morning coffee or afternoon tea.`,
      category: "cups",
      inStock: i !== 2,
      popular: i === 1,
      rating: 4.6 - i * 0.3,
    })),
  },
  {
    id: "bags",
    name: "Canvas Bags",
    icon: "👜",
    color: "#10B981",
    items: Array.from({ length: 3 }, (_, i) => ({
      id: 17 + i,
      name: `AlgoQuest Canvas Bag ${i + 1}`,
      price: 300 + i * 75,
      imageId: 17 + i,
      description: `Durable canvas bag with AlgoQuest artwork. Spacious interior with multiple pockets for all your essentials.`,
      category: "bags",
      inStock: true,
      popular: i === 2,
      rating: 4.8 - i * 0.1,
    })),
  },
]

// Flatten all items for the "All Items" category
const allItems = shopCategories.flatMap((category) => category.items)

// Featured collection
const featuredCollection = {
  title: "Crypto Adventurer",
  subtitle: "Limited Edition Collection",
  items: [1, 11, 17].map((id) => allItems.find((item) => item.id === id)),
}

export default function ShopScreen() {
  const navigation = useNavigation()
  const [selectedCategory, setSelectedCategory] = useState("tshirts")
  const [featuredItems, setFeaturedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollY = useSharedValue(0)
  const scrollRef = useRef(null)

  // Animation values for interactive elements
  const searchScale = useSharedValue(1)
  const categoryScrollX = useSharedValue(0)

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      // Get popular items for featured section
      const popular = allItems.filter((item) => item.popular)
      setFeaturedItems(popular.slice(0, 4))
      setLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId)

    // Scroll to items section with animation
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: HEADER_HEIGHT, animated: true })
    }
  }

  const navigateToItemDetail = (item) => {
    router.push({
      pathname: "/(shop)/item",
      params: {
        id: item.id,
        name: item.name,
        price: item.price,
        imageId: item.imageId,
        description: item.description,
        category: item.category,
        inStock: item.inStock ? "true" : "false",
      },
    })
  }

  // Filter items based on selected category
  const filteredItems = shopCategories.find((cat) => cat.id === selectedCategory)?.items || allItems

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, HEADER_HEIGHT / 2], [1, 0.9], Extrapolate.CLAMP),
      transform: [
        {
          translateY: interpolate(scrollY.value, [0, HEADER_HEIGHT], [0, -HEADER_HEIGHT / 4], Extrapolate.CLAMP),
        },
      ],
    }
  })

  const searchAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: searchScale.value }],
    }
  })

  const handleSearchPress = () => {
    searchScale.value = withSpring(0.95, {}, () => {
      searchScale.value = withSpring(1)
    })
  }

  return (
    <ScreenLayout>
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={styles.container}
        onScroll={(event) => {
          scrollY.value = event.nativeEvent.contentOffset.y
        }}
        scrollEventThrottle={16}
      >
        {/* Animated Header */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <LinearGradient
            colors={["rgba(124, 58, 237, 0.8)", "rgba(124, 58, 237, 0.2)", "transparent"]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Top Navigation */}
          <View style={styles.topNav}>
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
              <ArrowLeft size={22} color="#ffffff" />
            </TouchableOpacity>

            <Animated.View style={[styles.searchButton, searchAnimatedStyle]}>
              <TouchableOpacity style={styles.searchButtonInner} onPress={handleSearchPress} activeOpacity={0.7}>
                <Search size={18} color="#ffffff" />
                <Text style={styles.searchText}>Search items...</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Header Content */}
          <View style={styles.headerContent}>
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Text style={styles.title}>AlgoQuest Shop</Text>
              <Text style={styles.subtitle}>Exclusive Digital Merchandise</Text>
            </Animated.View>

            {/* Featured Collection Preview */}
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.featuredCollectionPreview}>
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.3)", "rgba(124, 58, 237, 0.1)"]}
                style={styles.featuredCollectionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />

              <View style={styles.featuredCollectionContent}>
                <View>
                  <View style={styles.featuredBadge}>
                    <Sparkles size={12} color="#7C3AED" />
                    <Text style={styles.featuredBadgeText}>Featured</Text>
                  </View>
                  <Text style={styles.featuredCollectionTitle}>{featuredCollection.title}</Text>
                  <Text style={styles.featuredCollectionSubtitle}>{featuredCollection.subtitle}</Text>
                </View>

                <TouchableOpacity style={styles.viewCollectionButton} onPress={() => handleCategorySelect("all")}>
                  <Text style={styles.viewCollectionText}>View</Text>
                  <ChevronRight size={14} color="#7C3AED" />
                </TouchableOpacity>
              </View>

              <View style={styles.featuredCollectionImages}>
                {featuredCollection.items.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeIn.delay(500 + index * 100).springify()}
                    style={[styles.featuredCollectionImage, { left: index * 30, zIndex: 3 - index }]}
                  >
                    <Image
                      source={getImageSource(item.imageId)}
                      style={styles.featuredItemPreviewImage}
                      resizeMode="cover"
                    />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Categories */}
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
            onScroll={(e) => {
              categoryScrollX.value = e.nativeEvent.contentOffset.x
            }}
            scrollEventThrottle={16}
          >
            {shopCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryButton, selectedCategory === category.id && styles.selectedCategoryButton]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                  <Text style={styles.categoryIconText}>{category.icon}</Text>
                </View>
                <Text style={[styles.categoryText, selectedCategory === category.id && styles.selectedCategoryText]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Shop Items Grid */}
        <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.itemsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Tag size={18} color="#7C3AED" />
              <Text style={styles.sectionTitle}>
                {shopCategories.find((cat) => cat.id === selectedCategory)?.name || "Shop Items"}
              </Text>
            </View>
            <Text style={styles.itemCount}>{filteredItems.length} items</Text>
          </View>

          <View style={styles.itemsGrid}>
            {filteredItems.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(800 + index * 50).springify()}
                style={styles.itemCardContainer}
              >
                <Pressable
                  style={({ pressed }) => [styles.itemCard, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}
                  onPress={() => navigateToItemDetail(item)}
                >
                  <BlurView intensity={30} tint="dark" style={styles.itemCardContent}>
                    <LinearGradient
                      colors={["rgba(124, 58, 237, 0.15)", "rgba(124, 58, 237, 0.05)"]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />

                    <View style={styles.itemImageContainer}>
                      <Image source={getImageSource(item.imageId)} style={styles.itemImage} resizeMode="cover" />
                      {!item.inStock && (
                        <View style={styles.outOfStockOverlay}>
                          <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                      )}
                      {item.popular && (
                        <View style={styles.popularTag}>
                          <Sparkles size={10} color="#7C3AED" />
                        </View>
                      )}
                    </View>

                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>

                      <View style={styles.itemRating}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                      </View>

                      <View style={styles.itemPriceRow}>
                        <View style={styles.itemPrice}>
                          <Text style={styles.priceAmount}>{item.price}</Text>
                          <Text style={styles.priceCurrency}>$QUEST</Text>
                        </View>
                      </View>
                    </View>
                  </BlurView>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    height: HEADER_HEIGHT,
    position: "relative",
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 16,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  searchButton: {
    flex: 1,
    marginLeft: 12,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  searchButtonInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  searchText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  headerContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 16,
  },
  featuredCollectionPreview: {
    height: 100,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    marginTop: 8,
  },
  featuredCollectionGradient: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
  },
  featuredCollectionContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: "flex-start",
    gap: 4,
  },
  featuredBadgeText: {
    color: "#7C3AED",
    fontSize: 10,
    fontWeight: "bold",
  },
  featuredCollectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  featuredCollectionSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  viewCollectionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  viewCollectionText: {
    color: "#7C3AED",
    fontSize: 12,
    fontWeight: "600",
  },
  featuredCollectionImages: {
    position: "absolute",
    bottom: -20,
    right: 16,
    flexDirection: "row",
    height: 60,
  },
  featuredCollectionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 2,
    borderColor: "rgba(124, 58, 237, 0.5)",
    overflow: "hidden",
    position: "absolute",
  },
  featuredItemPreviewImage: {
    width: "100%",
    height: "100%",
  },
  categoriesContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  categoriesContent: {
    gap: 12,
    paddingVertical: 4,
  },
  categoryButton: {
    alignItems: "center",
    gap: 8,
    marginRight: 16,
    width: 80,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  selectedCategoryText: {
    color: "#7C3AED",
    fontWeight: "600",
  },
  selectedCategoryButton: {
    transform: [{ scale: 1.05 }],
  },
  itemsSection: {
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
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  itemCount: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  itemsGrid: {
    flexDirection: "column",
    gap: 16,
  },
  itemCardContainer: {
    width: ITEM_WIDTH,
    marginBottom: 16,
  },
  itemCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    height: 240,
  },
  itemCardContent: {
    flex: 1,
    padding: 12,
  },
  itemImageContainer: {
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: "bold",
  },
  popularTag: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  itemInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  itemRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  itemPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPrice: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  priceCurrency: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
})
