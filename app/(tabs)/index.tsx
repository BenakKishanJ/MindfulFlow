import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from 'expo-camera';
import FaceMeshOverlay from '@/components/FaceMeshOverlay';
import BlinkRateStats from '@/components/BlinkRateStats';
import { FaceDetectionResult } from '@/types/face-detection';

interface BlinkData {
  timestamp: number;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
}

// Mock face detection for development
const simulateFaceDetection = (): FaceDetectionResult => {
  const isBlinking = Math.random() > 0.8; // 20% chance of blink
  return {
    bounds: {
      origin: { x: 100, y: 150 },
      size: { width: 200, height: 250 }
    },
    landmarks: {
      leftEye: { x: 150, y: 200 },
      rightEye: { x: 250, y: 200 },
      noseBase: { x: 200, y: 250 },
      leftMouth: { x: 180, y: 300 },
      rightMouth: { x: 220, y: 300 }
    },
    leftEyeOpenProbability: isBlinking ? 0.2 : 0.8,
    rightEyeOpenProbability: isBlinking ? 0.2 : 0.8
  };
};

export default function Monitor() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [faces, setFaces] = useState<FaceDetectionResult[]>([]);
  const [blinkRate, setBlinkRate] = useState(0);
  const [totalBlinks, setTotalBlinks] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);

  const cameraRef = useRef<CameraView>(null);
  const blinkDataRef = useRef<BlinkData[]>([]);
  const lastBlinkStateRef = useRef<{ left: boolean; right: boolean }>({ left: true, right: true });
  const sessionStartRef = useRef<number>(Date.now());
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isMonitoring) {
      sessionStartRef.current = Date.now();
      interval = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }, 1000);
    } else {
      if (interval) {
        clearInterval(interval);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isMonitoring]);

  // Face detection simulation
  useEffect(() => {
    if (isMonitoring) {
      detectionIntervalRef.current = setInterval(() => {
        const mockFace = simulateFaceDetection();
        handleFaceDetected(mockFace);
      }, 200); // Detect every 200ms
    } else {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isMonitoring]);

  const handleFaceDetected = (face: FaceDetectionResult) => {
    setFaces([face]);

    // Use ML Kit's built-in eye open probability
    let leftEyeOpen = true;
    let rightEyeOpen = true;

    if (face.leftEyeOpenProbability !== undefined) {
      leftEyeOpen = face.leftEyeOpenProbability > 0.5;
    }

    if (face.rightEyeOpenProbability !== undefined) {
      rightEyeOpen = face.rightEyeOpenProbability > 0.5;
    }

    detectBlink(leftEyeOpen, rightEyeOpen);
  };

  const detectBlink = (leftEyeOpen: boolean, rightEyeOpen: boolean) => {
    const currentTime = Date.now();
    const wasLeftOpen = lastBlinkStateRef.current.left;
    const wasRightOpen = lastBlinkStateRef.current.right;

    // Detect blink: eye was open and now closed
    const leftBlink = !leftEyeOpen && wasLeftOpen;
    const rightBlink = !rightEyeOpen && wasRightOpen;

    if (leftBlink || rightBlink) {
      setTotalBlinks(prev => prev + 1);

      // Add blink data for rate calculation
      blinkDataRef.current.push({
        timestamp: currentTime,
        leftEyeOpen,
        rightEyeOpen
      });

      // Keep only last 60 seconds of data
      blinkDataRef.current = blinkDataRef.current.filter(
        data => currentTime - data.timestamp < 60000
      );

      // Calculate blinks per minute
      const blinksInLastMinute = blinkDataRef.current.length;
      setBlinkRate(blinksInLastMinute);
    }

    lastBlinkStateRef.current = { left: leftEyeOpen, right: rightEyeOpen };
  };

  const startMonitoring = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }

    setIsMonitoring(true);
    setTotalBlinks(0);
    setBlinkRate(0);
    blinkDataRef.current = [];
    sessionStartRef.current = Date.now();
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setFaces([]);
  };

  const toggleMonitoring = () => {
    if (!isMonitoring) {
      Alert.alert(
        "Start Blink Monitoring",
        "MindfulFlow will monitor your blink rate using your device's front camera.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Start", onPress: startMonitoring },
        ],
      );
    } else {
      stopMonitoring();
    }
  };

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-4">
        <Text className="text-lg text-center mb-4">
          Camera permission is required to monitor your blink rate
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-purple-600 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-ppmori-semibold text-gray-900 mb-2">
            Blink Rate Monitor
          </Text>
          <Text className="text-gray-600">
            Real-time tracking of your eye health through blink detection
          </Text>
        </View>

        {/* Blink Rate Monitoring Card */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm overflow-hidden">
          <View className="items-center mb-4">
            <View
              className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${isMonitoring ? "bg-purple-100" : "bg-gray-100"
                }`}
            >
              <Ionicons
                name={isMonitoring ? "eye" : "eye-off"}
                size={32}
                color={isMonitoring ? "#8B5CF6" : "#6B7280"}
              />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              {isMonitoring ? "Blink Monitoring Active" : "Blink Rate Monitor"}
            </Text>
            <Text className="text-gray-600 text-center mb-4">
              {isMonitoring
                ? "Tracking your blink rate in real-time"
                : "Monitor your eye health through blink detection"}
            </Text>

            <TouchableOpacity
              onPress={toggleMonitoring}
              className={`px-6 py-3 rounded-full mb-4 ${isMonitoring ? "bg-red-500" : "bg-purple-600"
                }`}
            >
              <Text className="text-white font-semibold">
                {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Camera Preview */}
          {isMonitoring && (
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2 text-center">
                Camera Preview {faces.length > 0 ? "(Face detected)" : "(Searching for face)"}
              </Text>
              <View style={styles.cameraContainer}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="front"
                >
                  <FaceMeshOverlay faces={faces} />
                </CameraView>
              </View>
              <Text className="text-xs text-gray-500 text-center mt-2">
                {faces.length > 0 ? "✓ Face detected with eye tracking" : "⏳ Looking for face..."}
              </Text>
            </View>
          )}

          {/* Blink Statistics */}
          {isMonitoring && (
            <BlinkRateStats
              blinkRate={blinkRate}
              totalBlinks={totalBlinks}
              sessionTime={sessionTime}
              isDetecting={isMonitoring}
            />
          )}
        </View>

        {/* Information Card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            About Blink Rate Monitoring
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#8B5CF6" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900">Normal Blink Rate</Text>
                <Text className="text-gray-600 text-sm">
                  15-20 blinks per minute is considered healthy
                </Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <Ionicons name="warning" size={20} color="#8B5CF6" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900">Low Blink Rate</Text>
                <Text className="text-gray-600 text-sm">
                  Less than 10 blinks/minute may indicate eye strain or digital fatigue
                </Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <Ionicons name="eye" size={20} color="#8B5CF6" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900">Why It Matters</Text>
                <Text className="text-gray-600 text-sm">
                  Blinking keeps your eyes moist and prevents digital eye strain
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  camera: {
    flex: 1,
  },
});
