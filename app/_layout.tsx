"use client"

import "react-native-get-random-values"

import { Stack } from "expo-router"
import { useEffect, useState } from "react"
import { View, StyleSheet, Text, Image, Dimensions } from "react-native"
import * as SplashScreen from "expo-splash-screen"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { WalletProvider } from "../context/wallet-context"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import * as Font from "expo-font"

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

const { width, height } = Dimensions.get("window")

export default function RootLayout() {
  const [menuVisible, setMenuVisible] = useState(false)
  const [appIsReady, setAppIsReady] = useState(false)

  useEffect(() => {
    // Prepare app resources and data
    async function prepare() {
      try {
        // Load fonts
        await Font.loadAsync({
          Audiowide: require("../assets/fonts/Audiowide-Regular.ttf"),
        })

        // Simulate some loading time (replace with actual loading logic)
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (e) {
        console.warn(e)
      } finally {
        // Hide the native splash screen
        await SplashScreen.hideAsync()
        // Mark app as ready
        setAppIsReady(true)
      }
    }

    prepare()
  }, [])

  if (!appIsReady) {
    return (
      <Animated.View
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(500)}
        style={[styles.splashContainer, { backgroundColor: "#001529" }]}
      >
        <Image source={require("../assets/splash-image.png")} style={styles.splashImage} resizeMode="contain" />
        <Text style={styles.splashTitle}>AlgoQuest</Text>
      </Animated.View>
    )
  }

  return (
    <WalletProvider>
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.container}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#000000" },
            }}
          />
        </View>
      </GestureHandlerRootView>
    </WalletProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#001529",
  },
  splashImage: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: 30,
  },
  splashTitle: {
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: "Audiowide",
    color: "#ffffff",
    textAlign: "center",
  },
})
