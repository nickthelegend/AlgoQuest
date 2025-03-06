"use client"

import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BarCodeScanner } from "expo-barcode-scanner"
import { useState, useEffect } from "react"
import { router } from "expo-router"
import { ArrowLeft } from "lucide-react-native"

const { width } = Dimensions.get("window")

export default function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === "granted")
    })()
  }, [])

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return
    setScanned(true)

    // Navigate back to send screen with the scanned address
    router.replace({
      pathname: "/send",
      params: { address: data },
    })
  }

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </SafeAreaView>
    )
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
      />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan QR Code</Text>
        </View>

        <View style={styles.scanFrameContainer}>
          <View style={styles.scanFrame} />
        </View>

        <Text style={styles.instructions}>Position the QR code within the frame to scan</Text>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  scanFrameContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: "#7C3AED",
    backgroundColor: "transparent",
    borderRadius: 16,
  },
  instructions: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  permissionText: {
    color: "#ffffff",
    fontSize: 18,
    textAlign: "center",
    padding: 40,
  },
  backButtonText: {
    color: "#7C3AED",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
  },
})

