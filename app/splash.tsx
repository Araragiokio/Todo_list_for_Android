import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashProps) {
  const checklistOpacity = useRef(new Animated.Value(0)).current;
  const checklistScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([

      // Step 1 — checklist fades + scales in
      Animated.parallel([
        Animated.timing(checklistOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(checklistScale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),

      // Step 2 — hold checklist
      Animated.delay(400),  // was 600

      // Step 3 — checklist fades out
      Animated.timing(checklistOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),

      // Step 4 — app name scales in
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),

      // Step 5 — confetti bursts
      Animated.timing(confettiOpacity, {
        toValue: 1,
        duration: 100,  // changed from 200 to 100 — appears instantly
        useNativeDriver: true,
      }),

      // Step 6 — tagline appears
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),

      // Step 7 — hold
      Animated.delay(1000),

      // Step 8 — everything fades out
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),

    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>

      {/* Checklist animation */}
      <Animated.View style={[
        styles.lottieContainer,
        {
          opacity: checklistOpacity,
          transform: [{ scale: checklistScale }]
        }
      ]}>
        <LottieView
          source={require('@/assets/animations/document-checklist.json')}
          autoPlay
          loop={false}
          style={styles.lottie}
        />
      </Animated.View>

      {/* Confetti — starts playing immediately but invisible */}
      <Animated.View
        style={[styles.fullScreen, { opacity: confettiOpacity }]}
        pointerEvents='none'
      >
        <LottieView
          source={require('@/assets/animations/confetti.json')}
          autoPlay
          loop={false}
          style={styles.fullScreen}
          speed={0.8}
        />
      </Animated.View>

      {/* App name */}
      <Animated.View style={[
        styles.textContainer,
        {
          opacity: logoOpacity,
          transform: [{ scale: logoScale }]
        }
      ]}>
        <Text style={styles.appName}>TodoApp</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineContainer, { opacity: taglineOpacity }]}>
        <Text style={styles.tagline}>Crafted by Araragi</Text>
      </Animated.View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: '#FAF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
  },
  lottieContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 280,
    height: 280,
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1A1A2E',
    letterSpacing: 4,
  },
  taglineContainer: {
    position: 'absolute',
    bottom: height * 0.25,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 14,
    color: '#8B7355',
    letterSpacing: 2,
  },
});