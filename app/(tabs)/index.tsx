// Enhanced Monitor Component with Real Face Detection (Expo Compatible)
import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import FaceMeshOverlay from '@/components/FaceMeshOverlay';
import BlinkRateStats from '@/components/BlinkRateStats';
import { FaceDetectionResult } from '@/types/face-detection';

const { width: screenWidth } = Dimensions.get('window');
const CAMERA_HEIGHT = 300;

interface BlinkData {
  timestamp: number;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
  duration: number;
}

interface BlinkState {
  leftEyePreviouslyOpen: boolean;
  rightEyePreviouslyOpen: boolean;
  leftEyeCloseTime: number;
  rightEyeCloseTime: number;
}

interface ExpoFace {
  bounds: {
    origin: {
      x: number;
      y: number;
    };
    size: {
      width: number;
      height: number;
    };
  };
  faces?: ExpoFace[];
  rollAngle?: number;
  yawAngle?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  smilingProbability?: number;
  faceID?: number;
}

type IconName =
  | "eye-off"
  | "search"
  | "refresh"
  | "checkmark-circle"
  | "eye"
  | "analytics"
  | "shield-checkmark"
  | "camera-outline";

export default function Monitor() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [faces, setFaces] = useState<FaceDetectionResult[]>([]);
  const [blinkRate, setBlinkRate] = useState(0);
  const [totalBlinks, setTotalBlinks] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [hasFace, setHasFace] = useState(false);
  const [faceTrackingStable, setFaceTrackingStable] = useState(false);

  const cameraRef = useRef<Camera>(null);
  const blinkDataRef = useRef<BlinkData[]>([]);
  const blinkStateRef = useRef<BlinkState>({
    leftEyePreviouslyOpen: true,
    rightEyePreviouslyOpen: true,
    leftEyeCloseTime: 0,
    rightEyeCloseTime: 0,
  });
  const sessionStartRef = useRef<number>(Date.now());
  const faceDetectionStabilityRef = useRef<{ count: number; lastDetected: number }>({
    count: 0,
    lastDetected: 0
  });

  // Constants for blink detection
  const EYE_CLOSE_THRESHOLD = 0.3;
  const MIN_BLINK_DURATION = 80;
  const MAX_BLINK_DURATION = 500;
  const FACE_STABILITY_THRESHOLD = 5;

  // Request camera permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    requestPermissions();
  }, []);

  // Session timer
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

  // Convert Expo face data to our format
  const convertFaceData = (expoFace: ExpoFace): FaceDetectionResult => {
    return {
      bounds: {
        origin: {
          x: expoFace.bounds.origin.x,
          y: expoFace.bounds.origin.y
        },
        size: {
          width: expoFace.bounds.size.width,
          height: expoFace.bounds.size.height
        }
      },
      landmarks: {
        leftEye: { x: 0, y: 0 },
        rightEye: { x: 0, y: 0 },
        noseBase: { x: 0, y: 0 },
        leftMouth: { x: 0, y: 0 },
        rightMouth: { x: 0, y: 0 },
        leftEar: { x: 0, y: 0 },
        rightEar: { x: 0, y: 0 },
        leftCheek: { x: 0, y: 0 },
        rightCheek: { x: 0, y: 0 },
      },
      leftEyeOpenProbability: expoFace.leftEyeOpenProbability,
      rightEyeOpenProbability: expoFace.rightEyeOpenProbability,
      smilingProbability: expoFace.smilingProbability,
      headEulerAngleX: expoFace.rollAngle,
      headEulerAngleY: expoFace.yawAngle,
      headEulerAngleZ: 0, // Expo doesn't provide pitch angle
      trackingID: expoFace.faceID || Math.random()
    };
  };

  // Enhanced blink detection with proper timing
  const detectBlink = useCallback((leftEyeProb: number, rightEyeProb: number) => {
    const currentTime = Date.now();
    const leftEyeOpen = (leftEyeProb || 0) > EYE_CLOSE_THRESHOLD;
    const rightEyeOpen = (rightEyeProb || 0) > EYE_CLOSE_THRESHOLD;

    const state = blinkStateRef.current;
    let blinkDetected = false;

    // Left eye blink detection
    if (!leftEyeOpen && state.leftEyePreviouslyOpen) {
      state.leftEyeCloseTime = currentTime;
    } else if (leftEyeOpen && !state.leftEyePreviouslyOpen && state.leftEyeCloseTime > 0) {
      const blinkDuration = currentTime - state.leftEyeCloseTime;
      if (blinkDuration >= MIN_BLINK_DURATION && blinkDuration <= MAX_BLINK_DURATION) {
        blinkDetected = true;
      }
      state.leftEyeCloseTime = 0;
    }

    // Right eye blink detection
    if (!rightEyeOpen && state.rightEyePreviouslyOpen) {
      state.rightEyeCloseTime = currentTime;
    } else if (rightEyeOpen && !state.rightEyePreviouslyOpen && state.rightEyeCloseTime > 0) {
      const blinkDuration = currentTime - state.rightEyeCloseTime;
      if (blinkDuration >= MIN_BLINK_DURATION && blinkDuration <= MAX_BLINK_DURATION) {
        if (blinkDetected || Math.abs(state.leftEyeCloseTime - state.rightEyeCloseTime) < 100) {
          blinkDetected = true;
        }
      }
      state.rightEyeCloseTime = 0;
    }

    // Update previous states
    state.leftEyePreviouslyOpen = leftEyeOpen;
    state.rightEyePreviouslyOpen = rightEyeOpen;

    if (blinkDetected) {
      const blinkData: BlinkData = {
        timestamp: currentTime,
        leftEyeOpen,
        rightEyeOpen,
        duration: Math.max(
          currentTime - state.leftEyeCloseTime,
          currentTime - state.rightEyeCloseTime
        )
      };

      // Add to history
      blinkDataRef.current.push(blinkData);

      // Keep only last 60 seconds of data
      const oneMinuteAgo = currentTime - 60000;
      blinkDataRef.current = blinkDataRef.current.filter(
        data => data.timestamp > oneMinuteAgo
      );

      // Update counters
      setTotalBlinks(prev => prev + 1);
      setBlinkRate(blinkDataRef.current.length);
    }
  }, []);

  // Handle face detection
  const handleFacesDetected = useCallback(({ faces: detectedFaces }: { faces: ExpoFace[] }) => {
    const currentTime = Date.now();

    if (detectedFaces && detectedFaces.length > 0) {
      // Update face stability tracking
      faceDetectionStabilityRef.current.count += 1;
      faceDetectionStabilityRef.current.lastDetected = currentTime;

      // Convert faces to our format
      const convertedFaces = detectedFaces.map(convertFaceData);
      setFaces(convertedFaces);
      setHasFace(true);

      // Check for stable tracking
      if (faceDetectionStabilityRef.current.count >= FACE_STABILITY_THRESHOLD) {
        setFaceTrackingStable(true);

        // Process blinks for the primary face
        const primaryFace = convertedFaces[0];
        if (primaryFace.leftEyeOpenProbability !== undefined &&
          primaryFace.rightEyeOpenProbability !== undefined) {
          detectBlink(
            primaryFace.leftEyeOpenProbability,
            primaryFace.rightEyeOpenProbability
          );
        }
      }
    } else {
      // No faces detected - reset stability counter
      if (currentTime - faceDetectionStabilityRef.current.lastDetected > 1000) {
        faceDetectionStabilityRef.current.count = 0;
        setFaces([]);
        setHasFace(false);
        setFaceTrackingStable(false);

        // Reset blink state when no face is detected for a while
        blinkStateRef.current = {
          leftEyePreviouslyOpen: true,
          rightEyePreviouslyOpen: true,
          leftEyeCloseTime: 0,
          rightEyeCloseTime: 0,
        };
      }
    }
  }, [detectBlink]);

  const startMonitoring = async () => {
    if (!hasPermission) {
      Alert.alert(
        "Camera Permission Required",
        "Please grant camera permission to use face detection.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsMonitoring(true);
    setTotalBlinks(0);
    setBlinkRate(0);
    setSessionTime(0);
    blinkDataRef.current = [];
    faceDetectionStabilityRef.current = { count: 0, lastDetected: 0 };
    sessionStartRef.current = Date.now();

    // Reset blink detection state
    blinkStateRef.current = {
      leftEyePreviouslyOpen: true,
      rightEyePreviouslyOpen: true,
      leftEyeCloseTime: 0,
      rightEyeCloseTime: 0,
    };
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setFaces([]);
    setHasFace(false);
    setFaceTrackingStable(false);
    faceDetectionStabilityRef.current = { count: 0, lastDetected: 0 };
  };

  const toggleMonitoring = () => {
    if (!isMonitoring) {
      Alert.alert(
        "Start Blink Monitoring",
        "MindfulFlow will monitor your blink rate using your device's front camera. Make sure you're in good lighting and position your face clearly in the camera view.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Start", onPress: startMonitoring },
        ],
      );
    } else {
      stopMonitoring();
    }
  };

  // Handle camera permission states
  if (hasPermission === null) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-4">
        <Ionicons name="camera-outline" size={48} color="#6B7280" />
        <Text className="text-lg text-center mb-4 mt-4">
          Camera permission is required to monitor your blink rate
        </Text>
        <TouchableOpacity
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
          className="bg-purple-600 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const getTrackingStatus = (): { text: string; color: string; icon: IconName } => {
    if (!isMonitoring) return { text: "Not monitoring", color: "#6B7280", icon: "eye-off" };
    if (!hasFace) return { text: "Searching for face", color: "#F59E0B", icon: "search" };
    if (!faceTrackingStable) return { text: "Stabilizing tracking", color: "#F59E0B", icon: "refresh" };
    return { text: "Face tracking stable", color: "#22C55E", icon: "checkmark-circle" };
  };

  const trackingStatus = getTrackingStatus();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Blink Rate Monitor
          </Text>
          <Text className="text-gray-600">
            AI-powered real-time eye health tracking through advanced face detection
          </Text>
        </View>

        {/* Main Monitoring Card */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm overflow-hidden">
          <View className="items-center mb-4">
            <View
              className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${isMonitoring ? "bg-purple-100" : "bg-gray-100"
                }`}
            >
              <Ionicons
                name={trackingStatus.icon}
                size={32}
                color={trackingStatus.color}
              />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              {isMonitoring ? "Monitoring Active" : "Blink Rate Monitor"}
            </Text>
            <Text className="text-gray-600 text-center mb-2">
              {trackingStatus.text}
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

          {/* Camera Preview with Enhanced Overlay */}
          {isMonitoring && (
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2 text-center">
                Real-time Face Detection
              </Text>
              <View style={styles.cameraContainer}>
                <Camera
                  ref={cameraRef}
                  style={styles.camera}
                  type={Camera.Constants.Type.front}
                  onFacesDetected={handleFacesDetected}
                  faceDetectorSettings={{
                    mode: FaceDetector.FaceDetectorMode.fast,
                    detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                    runClassifications: FaceDetector.FaceDetectorClassifications.all,
                    minDetectionInterval: 100,
                    tracking: true,
                  }}
                />
                <View style={styles.overlayContainer}>
                  <FaceMeshOverlay
                    faces={faces}
                    containerWidth={screenWidth - 32 - 48}
                    containerHeight={CAMERA_HEIGHT}
                  />
                </View>
              </View>
              <View className="flex-row items-center justify-center mt-2">
                <View className={`w-2 h-2 rounded-full mr-2 ${faceTrackingStable ? 'bg-green-500' : hasFace ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                <Text className="text-xs text-gray-500 text-center">
                  {faceTrackingStable
                    ? "Tracking stable - blink naturally"
                    : hasFace
                      ? "Face detected - stabilizing..."
                      : "Position your face in the center of the frame"
                  }
                </Text>
              </View>
            </View>
          )}

          {/* Enhanced Statistics */}
          {isMonitoring && (
            <BlinkRateStats
              blinkRate={blinkRate}
              totalBlinks={totalBlinks}
              sessionTime={sessionTime}
              isDetecting={faceTrackingStable}
            />
          )}
        </View>

        {/* Technical Information Card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            How It Works
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-start">
              <Ionicons name="eye" size={20} color="#8B5CF6" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900">ML-Powered Detection</Text>
                <Text className="text-gray-600 text-sm">
                  Uses Expo Face Detector API for precise eye tracking
                </Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <Ionicons name="analytics" size={20} color="#8B5CF6" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900">Real-time Analysis</Text>
                <Text className="text-gray-600 text-sm">
                  Processes frames in real-time for accurate blink detection
                </Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900">Privacy First</Text>
                <Text className="text-gray-600 text-sm">
                  All processing happens on-device - no data leaves your phone
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Health Guidelines */}
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Blink Rate Health Guide
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-start">
              <View className="w-3 h-3 rounded-full bg-green-500 mt-2 mr-3" />
              <View className="flex-1">
                <Text className="font-medium text-gray-900">15-20 blinks/min</Text>
                <Text className="text-gray-600 text-sm">Optimal range for eye health</Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <View className="w-3 h-3 rounded-full bg-yellow-500 mt-2 mr-3" />
              <View className="flex-1">
                <Text className="font-medium text-gray-900">10-15 blinks/min</Text>
                <Text className="text-gray-600 text-sm">Slightly low - consider taking breaks</Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <View className="w-3 h-3 rounded-full bg-red-500 mt-2 mr-3" />
              <View className="flex-1">
                <Text className="font-medium text-gray-900">Under 10 blinks/min</Text>
                <Text className="text-gray-600 text-sm">Concerning - may indicate digital eye strain</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    height: CAMERA_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
  },
});
