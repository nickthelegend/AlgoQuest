"use client"

import { Stack } from "expo-router"
import { useEffect, useState } from "react"
import { View, StyleSheet } from "react-native"
import * as SplashScreen from "expo-splash-screen"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Header from "@/components/header"
import SideMenu from "@/components/side-menu"

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [menuVisible, setMenuVisible] = useState(false)

  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#000000" },
          }}
        />
        <Header onMenuPress={() => setMenuVisible(true)} />
        <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      </View>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

