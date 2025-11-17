// app/blink.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraFormat } from 'react-native-vision-camera';
import FaceDetection from '@react-native-ml-kit/face-detection';
import BlinkRateStats from '@/components/BlinkRateStats';

interface DetectedFace {
  leftEyeOpenProbability: number;
  rightEyeOpenProbability: number;
  frame?: any;
  bounds?: any;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  smilingProbability?: number;
  trackingID?: number;
}

export default function BlinkMonitor() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [blinkRate, setBlinkRate] = useState(0);
  const [totalBlinks, setTotalBlinks] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const device = useCameraDevice('front');
  const cameraRef = useRef<Camera>(null);

  const format = useCameraFormat(device, [
    { videoResolution: { width: 640, height: 480 } },
    { fps: 30 },
  ]);

  const blinkDataRef = useRef<{ timestamp: number }[]>([]);
  const lastBlinkStateRef = useRef<{ left: boolean; right: boolean }>({ left: true, right: true });
  const sessionStartRef = useRef<number>(0);
  const lastDetectionTimeRef = useRef<number>(0);

  // === Permission ===
  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // === Session Timer ===
  useEffect(() => {
    let interval: any = null;
    if (isMonitoring) {
      sessionStartRef.current = Date.now();
      interval = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }, 1000);
    }
    return () => interval && clearInterval(interval);
  }, [isMonitoring]);

  // === Blink Rate ===
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      blinkDataRef.current = blinkDataRef.current.filter(d => now - d.timestamp < 60000);
      setBlinkRate(blinkDataRef.current.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // === Blink Detection ===
  const processBlink = useCallback((face: DetectedFace) => {
    const EYE_OPEN_THRESHOLD = 0.3;
    const leftOpen = face.leftEyeOpenProbability > EYE_OPEN_THRESHOLD;
    const rightOpen = face.rightEyeOpenProbability > EYE_OPEN_THRESHOLD;
    const wasLeft = lastBlinkStateRef.current.left;
    const wasRight = lastBlinkStateRef.current.right;

    const leftBlink = !leftOpen && wasLeft;
    const rightBlink = !rightOpen && wasRight;

    const lastBlinkTime = blinkDataRef.current[blinkDataRef.current.length - 1]?.timestamp || 0;
    if ((leftBlink || rightBlink) && Date.now() - lastBlinkTime > 200) {
      setTotalBlinks(p => p + 1);
      blinkDataRef.current.push({ timestamp: Date.now() });
    }

    lastBlinkStateRef.current = { left: leftOpen, right: rightOpen };
  }, []);

  // === Face Detection ===
  const detectFaces = useCallback(async () => {
    if (!cameraRef.current || isProcessing || Date.now() - lastDetectionTimeRef.current < 300) return;

    setIsProcessing(true);
    lastDetectionTimeRef.current = Date.now();

    try {
      const photo = await cameraRef.current.takePhoto({});
      if (!photo.path) return;

      const options = {
        performanceMode: 'fast' as const,
        classificationMode: 'all' as const,
        minFaceSize: 0.1,
      };

      const detected = await FaceDetection.detect(`file://${photo.path}`, options);
      if (detected.length > 0) {
        const face = detected[0];
        const processed: DetectedFace = {
          leftEyeOpenProbability: face.leftEyeOpenProbability ?? 1,
          rightEyeOpenProbability: face.rightEyeOpenProbability ?? 1,
          smilingProbability: face.smilingProbability,
          trackingID: face.trackingID,
        };
        setFaces([processed]);
        processBlink(processed);
      } else {
        setFaces([]);
      }
    } catch (err) {
      console.log('Detection error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, processBlink]);

  // === Continuous Detection ===
  useEffect(() => {
    let interval: any = null;
    if (isMonitoring && hasPermission) {
      interval = setInterval(detectFaces, 500);
    }
    return () => interval && clearInterval(interval);
  }, [isMonitoring, hasPermission, detectFaces]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    setTotalBlinks(0);
    setBlinkRate(0);
    blinkDataRef.current = [];
    setSessionTime(0);
    setFaces([]);
  };

  const stopMonitoring = () => setIsMonitoring(false);
  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      Alert.alert(
        "Start Blink Monitor",
        "We'll track your blink rate using the front camera.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Start", onPress: startMonitoring },
        ]
      );
    }
  };

  // === Loading States ===
  if (hasPermission === null) {
    return (
      <SafeAreaView className="flex-1 bg-lime-100 justify-center items-center px-6">
        <Text className="text-[#1A1A1A] text-lg font-medium">Requesting camera access...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView className="flex-1 bg-lime-100 justify-center items-center px-6">
        <Text className="text-[#1A1A1A] text-xl font-bold mb-2">Camera Required</Text>
        <Text className="text-gray-600 text-base text-center">
          Please enable camera in Settings to use blink monitoring.
        </Text>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView className="flex-1 bg-lime-100 justify-center items-center px-6">
        <Text className="text-[#1A1A1A] text-lg font-medium">Front camera not found</Text>
      </SafeAreaView>
    );
  }

  // === Main UI ===
  return (
    <SafeAreaView className="flex-1 bg-lime-100">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-6 pt-8 pb-12">

        {/* Header */}
        <View className="mb-8">
          <Text className="text-[#1A1A1A] text-3xl font-bold tracking-tight">Blink Monitor</Text>
          <Text className="text-gray-600 text-base mt-1">Track eye health in real time</Text>
        </View>

        {/* Control Card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <View className="items-center">
            <View className={`
              w-20 h-20 rounded-2xl items-center justify-center mb-4
              ${isMonitoring ? 'bg-[#A3E635]/10' : 'bg-gray-100'}
            `}>
              <Ionicons
                name={isMonitoring ? "eye" : "eye-off"}
                size={36}
                color={isMonitoring ? "#A3E635" : "#6B7280"}
              />
            </View>

            <Text className="text-[#1A1A1A] text-xl font-bold">
              {isMonitoring ? "Monitoring" : "Ready to Start"}
            </Text>
            <Text className="text-gray-600 text-sm mt-1">
              {isMonitoring
                ? faces.length > 0 ? "Face detected" : "Looking for face..."
                : "Tap to begin"}
            </Text>

            <TouchableOpacity
              onPress={toggleMonitoring}
              className={`
                mt-5 px-8 py-3 rounded-xl font-medium
                ${isMonitoring ? 'bg-red-500' : 'bg-[#A3E635]'}
              `}
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-base">
                {isMonitoring ? "Stop" : "Start Monitoring"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Camera Preview (only when active) */}
        {isMonitoring && (
          <View className="mb-6">
            <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
              <View className="h-64 relative">
                <Camera
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  device={device}
                  format={format}
                  isActive={isMonitoring}
                  photo={true}
                  resizeMode="cover"
                />
                <View className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Text className="text-[#1A1A1A] text-xs font-medium">
                    {faces.length > 0 ? "Face Detected" : "Searching"}
                  </Text>
                </View>
              </View>
            </View>
            <Text className="text-gray-600 text-center text-sm mt-3">
              {isProcessing ? "Analyzing..." : "Face the camera in good light"}
            </Text>
          </View>
        )}

        {/* Live Stats */}
        {isMonitoring && (
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
            <BlinkRateStats
              blinkRate={blinkRate}
              totalBlinks={totalBlinks}
              sessionTime={sessionTime}
              isDetecting={faces.length > 0}
            />
          </View>
        )}

        {/* Info Cards */}
        <View className="space-y-4">
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <View className="flex-row items-start">
              <View className="w-10 h-10 bg-[#A3E635]/10 rounded-xl items-center justify-center mr-3">
                <Ionicons name="information-circle" size={20} color="#A3E635" />
              </View>
              <View className="flex-1">
                <Text className="text-[#1A1A1A] font-bold text-base">Healthy Rate</Text>
                <Text className="text-gray-600 text-sm mt-1">15–20 blinks per minute</Text>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <View className="flex-row items-start">
              <View className="w-10 h-10 bg-amber-100 rounded-xl items-center justify-center mr-3">
                <Ionicons name="warning" size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-[#1A1A1A] font-bold text-base">Low Rate</Text>
                <Text className="text-gray-600 text-sm mt-1">&lt;10 may mean eye strain</Text>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <View className="flex-row items-start">
              <View className="w-10 h-10 bg-[#A3E635]/10 rounded-xl items-center justify-center mr-3">
                <Ionicons name="eye" size={20} color="#A3E635" />
              </View>
              <View className="flex-1">
                <Text className="text-[#1A1A1A] font-bold text-base">Powered by ML Kit</Text>
                <Text className="text-gray-600 text-sm mt-1">Real-time eye tracking</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
