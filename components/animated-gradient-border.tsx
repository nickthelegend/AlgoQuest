'use client';

import { StyleSheet } from "react-native"
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  Easing
} from "react-native-reanimated"
import { useEffect, ReactNode } from "react"
import { LinearGradient } from "expo-linear-gradient"

interface AnimatedGradientBorderProps {
  size: number;
  borderWidth?: number;
  children: ReactNode;
}

export default function AnimatedGradientBorder({ 
  size, 
  borderWidth = 2,
  children 
}: AnimatedGradientBorderProps) {
  const rotation = useSharedValue(0)

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false
    )
  }, [rotation]) // Added rotation to dependencies

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, animatedStyle]}>
      <LinearGradient
        colors={['#7C3AED', '#2563EB', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          StyleSheet.absoluteFill,
          styles.gradient,
          { borderRadius: size / 2 }
        ]}
      />
      <Animated.View 
        style={[
          styles.content,
          {
            borderRadius: size / 2,
            margin: borderWidth,
          }
        ]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
  },
  content: {
    backgroundColor: '#000000',
    overflow: 'hidden',
    flex: 1,
    width: '100%',
  },
})
