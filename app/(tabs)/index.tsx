// app/(tabs)/index.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';

// Import our custom components and services
import FaceMeshOverlay from '@/components/FaceMeshOverlay';
import BlinkRateStats from '@/components/BlinkRateStats';
import { FaceDetectionService, BlinkDetectionService } from '@/services/faceDetectionService';
import { FaceDetectionResult } from '@/types/face-detection';

const { width: screenWidth } = Dimensions.get('window');
const CAMERA_WIDTH = screenWidth - 32;
const CAMERA_HEIGHT = (CAMERA_WIDTH * 4) / 3; // 4:3 aspect ratio

export default function Monitor() {
  // Camera and permissions
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // Detection state
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [faces, setFaces] = useState<FaceDetectionResult[]>([]);
  const [detectionConfidence, setDetectionConfidence] = useState(0);

  // Blink statistics
  const [blinkRate, setBlinkRate] = useState(0);
  const [totalBlinks, setTotalBlinks] = useState(0);
  const [leftEyeBlinks, setLeftEyeBlinks] = useState(0);
  const [rightEyeBlinks, setRightEyeBlinks] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);

  // Services
  const faceDetectionService = useRef<FaceDetectionService>(new FaceDetectionService());
  const blinkDetectionService = useRef<BlinkDetectionService>(new BlinkDetectionService());

  // Timers
  const sessionStartRef = useRef<number>(Date.now());
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize TensorFlow and face detection
  useEffect(() => {
    const service = faceDetectionService.current;

    const initializeTensorFlow = async () => {
      try {
        setIsInitializing(true);

        // Initialize TensorFlow.js
        await tf.ready();
        console.log('TensorFlow.js initialized');

        // Initialize face detection service
        const initialized = await service?.initialize();
        if (!initialized) {
          Alert.alert('Error', 'Failed to initialize face detection');
        }
      } catch (error) {
        console.error('TensorFlow initialization error:', error);
        Alert.alert('Error', 'Failed to initialize AI models');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeTensorFlow();

    return () => {
      service?.dispose();
    };
  }, []);

  // Session timer
  useEffect(() => {
    if (isMonitoring) {
      sessionStartRef.current = Date.now();
      sessionIntervalRef.current = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }, 1000);
    } else {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
    }

    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
    };
  }, [isMonitoring]);

  // Face detection loop
  const startFaceDetection = useCallback(async () => {
    if (!cameraRef.current || !isMonitoring) return;

    try {
      // Take picture from camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        skipProcessing: true,
      });

      if (photo && photo.uri) {
        // Convert image to tensor
        const imageTensor = await faceDetectionService.current.processImageTensor(
          photo.uri,
          CAMERA_WIDTH,
          CAMERA_HEIGHT
        );

        // Detect faces
        const detectedFaces = await faceDetectionService.current.detectFaces(imageTensor);

        // Clean up tensor
        imageTensor.dispose();

        if (detectedFaces.length > 0) {
          const face = detectedFaces[0]; // Use the first detected face
          setFaces([face]);
          setDetectionConfidence(face.probability);

          // Process blink detection
          if (face.leftEyeOpenProbability !== undefined && face.rightEyeOpenProbability !== undefined) {
            const blinkResult = blinkDetectionService.current.detectBlink(
              face.leftEyeOpenProbability,
              face.rightEyeOpenProbability
            );

            if (blinkResult.anyBlink) {
              setTotalBlinks(prev => prev + 1);

              if (blinkResult.leftBlink) {
                setLeftEyeBlinks(prev => prev + 1);
              }
              if (blinkResult.rightBlink) {
                setRightEyeBlinks(prev => prev + 1);
              }
            }

            // Update blink rate
            const currentRate = blinkDetectionService.current.calculateBlinkRate();
            setBlinkRate(currentRate);
          }
        } else {
          setFaces([]);
          setDetectionConfidence(0);
        }
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }
  }, [isMonitoring]);

  // Detection interval management
  useEffect(() => {
    if (isMonitoring) {
      detectionIntervalRef.current = setInterval(startFaceDetection, 500); // Every 500ms
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
  }, [isMonitoring, startFaceDetection]);

  const startMonitoring = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required for blink monitoring');
        return;
      }
    }

    if (isInitializing) {
      Alert.alert('Please Wait', 'AI models are still loading. Please try again in a moment.');
      return;
    }

    // Reset all counters
    setIsMonitoring(true);
    setTotalBlinks(0);
    setLeftEyeBlinks(0);
    setRightEyeBlinks(0);
    setBlinkRate(0);
    setSessionTime(0);
    blinkDetectionService.current.reset();
    sessionStartRef.current = Date.now();
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setFaces([]);
    setDetectionConfidence(0);
  };

  const toggleMonitoring = () => {
    if (!isMonitoring) {
      Alert.alert(
        "Start Blink Monitoring",
        "MindfulFlow will analyze your blink rate using advanced AI face detection. Ensure good lighting and keep your face visible to the camera.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Start", onPress: startMonitoring },
        ],
      );
    } else {
      Alert.alert(
        "Stop Monitoring",
        "Are you sure you want to stop the blink rate monitoring session?",
        [
          { text: "Continue", style: "cancel" },
          { text: "Stop", onPress: stopMonitoring, style: "destructive" },
        ],
      );
    }
  };

  // Loading state
  if (isInitializing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-4">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-lg font-semibold text-gray-900 mt-4 text-center">
          Loading AI Models
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          Preparing face detection and blink analysis...
        </Text>
      </SafeAreaView>
    );
  }

  // Permission states
  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-lg mt-4">Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-4">
        <View className="items-center">
          <View className="w-24 h-24 bg-purple-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="camera" size={40} color="#8B5CF6" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Camera Access Required
          </Text>
          <Text className="text-gray-600 text-center mb-8 leading-6">
            MindfulFlow needs camera access to monitor your blink rate and help maintain your eye health during screen time.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            className="bg-purple-600 px-8 py-4 rounded-full shadow-lg"
          >
            <Text className="text-white font-semibold text-lg">Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            AI Blink Monitor
          </Text>
          <Text className="text-gray-600">
            Advanced real-time eye health tracking with TensorFlow.js
          </Text>
        </View>

        {/* Main Monitoring Card */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
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
              {isMonitoring ? "AI Monitoring Active" : "Blink Rate Monitor"}
            </Text>

            <Text className="text-gray-600 text-center mb-4">
              {isMonitoring
                ? "Analyzing your blink patterns with AI"
                : "Start monitoring to track your eye health"}
            </Text>

            <TouchableOpacity
              onPress={toggleMonitoring}
              className={`px-8 py-4 rounded-full shadow-lg ${isMonitoring ? "bg-red-500" : "bg-purple-600"
                }`}
              disabled={isInitializing}
            >
              <Text className="text-white font-semibold text-lg">
                {isMonitoring ? "Stop Monitoring" : "Start AI Monitoring"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Camera Preview */}
          {isMonitoring && (
            <View className="mb-4">
              <View className="flex-row items-center justify-center mb-3">
                <View className={`w-3 h-3 rounded-full mr-2 ${faces.length > 0 ? "bg-green-500" : "bg-yellow-500"
                  }`} />
                <Text className="text-sm font-medium text-gray-700">
                  {faces.length > 0
                    ? `Face Detected (${(detectionConfidence * 100).toFixed(0)}% confidence)`
                    : "Searching for face..."
                  }
                </Text>
              </View>

              <View style={styles.cameraContainer}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="front"
                >
                  <FaceMeshOverlay
                    faces={faces}
                    showLandmarks={true}
                    showBoundingBox={true}
                    showEyeStatus={true}
                  />
                </CameraView>
              </View>

              <Text className="text-xs text-gray-500 text-center mt-2">
                {faces.length > 0
                  ? "✓ Face tracking active with eye detection"
                  : "⏳ Position your face in the frame"
                }
              </Text>
            </View>
          )}
        </View>

        {/* Statistics */}
        {isMonitoring && (
          <BlinkRateStats
            blinkRate={blinkRate}
            totalBlinks={totalBlinks}
            sessionTime={sessionTime}
            isDetecting={isMonitoring}
            leftEyeBlinks={leftEyeBlinks}
            rightEyeBlinks={rightEyeBlinks}
            confidence={detectionConfidence}
          />
        )}

        {/* Information Cards */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            AI-Powered Eye Health
          </Text>
          <View className="space-y-4">
            <View className="flex-row items-start">
              <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="analytics" size={20} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900 mb-1">TensorFlow.js Detection</Text>
                <Text className="text-gray-600 text-sm leading-5">
                  Uses BlazeFace model for accurate real-time face detection and landmark tracking
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="pulse" size={20} color="#22c55e" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900 mb-1">Blink Rate Analysis</Text>
                <Text className="text-gray-600 text-sm leading-5">
                  Normal: 12-25 blinks/min • Low: &lt;12 may indicate eye strain
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900 mb-1">Privacy Protected</Text>
                <Text className="text-gray-600 text-sm leading-5">
                  All processing happens locally on your device. No data is sent to servers
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tips for better detection */}
        <View className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Optimization Tips
          </Text>
          <View className="space-y-2">
            <Text className="text-gray-700 text-sm">• Ensure bright, even lighting on your face</Text>
            <Text className="text-gray-700 text-sm">• Keep your face centered and 30-60cm from camera</Text>
            <Text className="text-gray-700 text-sm">• Remove glasses if they create glare or reflections</Text>
            <Text className="text-gray-700 text-sm">• Sit still for more accurate detection</Text>
            <Text className="text-gray-700 text-sm">• Clean your camera lens for better clarity</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    width: CAMERA_WIDTH,
    height: CAMERA_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  camera: {
    flex: 1,
  },
});
