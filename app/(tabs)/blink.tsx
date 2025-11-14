// app/blink.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraFormat } from 'react-native-vision-camera';
import FaceDetection from '@react-native-ml-kit/face-detection';
import BlinkRateStats from '@/components/BlinkRateStats';

// Let's check what the actual Face type looks like by logging it
// For now, let's create a more flexible interface
interface DetectedFace {
  leftEyeOpenProbability: number;
  rightEyeOpenProbability: number;
  // ML Kit might use different property names for bounds
  frame?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  bounds?: {
    origin: {
      x: number;
      y: number;
    };
    size: {
      width: number;
      height: number;
    };
  };
  // Or it might have direct position properties
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

  // Optimize camera format for faster processing
  const format = useCameraFormat(device, [
    { videoResolution: { width: 640, height: 480 } },
    { fps: 30 },
  ]);

  // Refs for tracking data
  const blinkDataRef = useRef<{ timestamp: number }[]>([]);
  const lastBlinkStateRef = useRef<{ left: boolean; right: boolean }>({ left: true, right: true });
  const sessionStartRef = useRef<number>(0);
  const lastDetectionTimeRef = useRef<number>(0);

  // 1. Permission handling
  useEffect(() => {
    const requestCameraPermission = async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    };
    requestCameraPermission();
  }, []);

  // 2. Session timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isMonitoring) {
      sessionStartRef.current = Date.now();
      interval = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring]);

  // 3. Blink rate calculation
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      blinkDataRef.current = blinkDataRef.current.filter(
        (data) => currentTime - data.timestamp < 60000
      );
      setBlinkRate(blinkDataRef.current.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // 4. Blink detection logic
  const processBlink = useCallback((face: DetectedFace) => {
    const currentTime = Date.now();

    const EYE_OPEN_THRESHOLD = 0.3;
    const leftEyeOpen = face.leftEyeOpenProbability > EYE_OPEN_THRESHOLD;
    const rightEyeOpen = face.rightEyeOpenProbability > EYE_OPEN_THRESHOLD;

    const wasLeftOpen = lastBlinkStateRef.current.left;
    const wasRightOpen = lastBlinkStateRef.current.right;

    const leftBlink = !leftEyeOpen && wasLeftOpen;
    const rightBlink = !rightEyeOpen && wasRightOpen;

    const timeSinceLastBlink = blinkDataRef.current.length > 0
      ? currentTime - blinkDataRef.current[blinkDataRef.current.length - 1].timestamp
      : 1000;

    if ((leftBlink || rightBlink) && timeSinceLastBlink > 200) {
      setTotalBlinks(prev => prev + 1);
      blinkDataRef.current.push({ timestamp: currentTime });
    }

    lastBlinkStateRef.current = { left: leftEyeOpen, right: rightEyeOpen };
  }, []);

  // 5. Face detection handler
  const detectFaces = useCallback(async () => {
    if (!cameraRef.current || isProcessing) return;

    const currentTime = Date.now();
    if (currentTime - lastDetectionTimeRef.current < 300) {
      return;
    }

    setIsProcessing(true);
    lastDetectionTimeRef.current = currentTime;

    try {
      // Capture photo for face detection
      const photo = await cameraRef.current.takePhoto({});

      if (!photo.path) {
        throw new Error('Photo path not available');
      }

      // Configure face detection options
      const options = {
        performanceMode: 'fast' as const,
        landmarkMode: 'all' as const,
        contourMode: 'none' as const,
        classificationMode: 'all' as const,
        minFaceSize: 0.1,
      };

      // Detect faces in the captured photo
      const detectedFaces = await FaceDetection.detect(`file://${photo.path}`, options);

      // Log the actual face structure to debug
      if (detectedFaces.length > 0) {
        console.log('Face structure:', JSON.stringify(detectedFaces[0], null, 2));
      }

      if (detectedFaces.length > 0) {
        const primaryFace = detectedFaces[0];

        // Create a processed face with the properties we actually need for blink detection
        // We only need eye probabilities for blink detection
        const processedFace: DetectedFace = {
          leftEyeOpenProbability: primaryFace.leftEyeOpenProbability ?? 1,
          rightEyeOpenProbability: primaryFace.rightEyeOpenProbability ?? 1,
          smilingProbability: primaryFace.smilingProbability,
          trackingID: primaryFace.trackingID,
          // Add any bounds properties that might exist for debugging
          frame: (primaryFace as any).frame,
          bounds: (primaryFace as any).bounds,
          left: (primaryFace as any).left,
          top: (primaryFace as any).top,
          width: (primaryFace as any).width,
          height: (primaryFace as any).height,
        };

        setFaces([processedFace]);
        processBlink(processedFace);
      } else {
        setFaces([]);
      }
    } catch (error) {
      console.log('Face detection error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, processBlink]);

  // 6. Continuous face detection when monitoring
  useEffect(() => {
    let detectionInterval: ReturnType<typeof setInterval> | null = null;

    if (isMonitoring && hasPermission) {
      detectionInterval = setInterval(() => {
        detectFaces();
      }, 500);
    }

    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, [isMonitoring, hasPermission, detectFaces]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    setTotalBlinks(0);
    setBlinkRate(0);
    blinkDataRef.current = [];
    setSessionTime(0);
    setFaces([]);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setFaces([]);
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      Alert.alert(
        "Start Blink Monitoring",
        "MindfulFlow will monitor your blink rate using your device's front camera.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Start", onPress: startMonitoring },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.permissionText}>Camera permission required</Text>
          <Text style={styles.permissionSubtext}>Please enable camera permissions in your device settings</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Front camera not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Blink Rate Monitor</Text>
          <Text style={styles.subtitle}>Real-time eye health tracking through blink detection</Text>
        </View>

        {/* Monitoring Card */}
        <View style={styles.card}>
          <View style={styles.monitoringHeader}>
            <View style={[styles.iconContainer, isMonitoring && styles.iconContainerActive]}>
              <Ionicons
                name={isMonitoring ? "eye" : "eye-off"}
                size={32}
                color={isMonitoring ? "#a3e635" : "#6b7280"}
              />
            </View>
            <Text style={styles.monitoringTitle}>
              {isMonitoring ? "Monitoring Active" : "Blink Monitor"}
            </Text>
            <Text style={styles.monitoringSubtitle}>
              {isMonitoring
                ? `Tracking your blink rate • ${faces.length > 0 ? 'Face detected' : 'Searching...'}`
                : "Start monitoring to begin detection"}
            </Text>

            <TouchableOpacity
              onPress={toggleMonitoring}
              style={[styles.monitoringButton, isMonitoring && styles.stopButton]}
            >
              <Text style={styles.buttonText}>
                {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Camera Preview */}
          {isMonitoring && (
            <View style={styles.cameraSection}>
              <Text style={styles.cameraLabel}>
                {faces.length > 0 ? "✅ Face detected - Blink detection active" : "⏳ Searching for face..."}
              </Text>
              <View style={styles.cameraContainer}>
                <Camera
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  device={device}
                  format={format}
                  isActive={isMonitoring}
                  photo={true}
                  video={false}
                  audio={false}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.cameraHint}>
                {isProcessing ? "Processing..." : "Ensure good lighting and face the camera directly"}
              </Text>
            </View>
          )}

          {/* Statistics */}
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
        <View style={styles.card}>
          <Text style={styles.infoTitle}>About Blink Rate Monitoring</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle" size={20} color="#a3e635" />
              <View style={styles.infoText}>
                <Text style={styles.infoItemTitle}>Normal Blink Rate</Text>
                <Text style={styles.infoItemDescription}>
                  15-20 blinks per minute is considered healthy
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="warning" size={20} color="#f59e0b" />
              <View style={styles.infoText}>
                <Text style={styles.infoItemTitle}>Low Blink Rate</Text>
                <Text style={styles.infoItemDescription}>
                  Less than 10 blinks/minute may indicate eye strain
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="eye" size={20} color="#a3e635" />
              <View style={styles.infoText}>
                <Text style={styles.infoItemTitle}>Detection Technology</Text>
                <Text style={styles.infoItemDescription}>
                  Powered by Google ML Kit for accurate eye tracking
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Your styles remain exactly the same...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    color: '#ffffff',
    fontWeight: '600',
  },
  permissionSubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#a3e635',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a3e635',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  monitoringHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#374151',
  },
  iconContainerActive: {
    backgroundColor: '#1a2a1a',
    borderColor: '#a3e635',
  },
  monitoringTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  monitoringSubtitle: {
    fontSize: 14,
    color: '#a3e635',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  monitoringButton: {
    backgroundColor: '#a3e635',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 160,
    shadowColor: '#a3e635',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stopButton: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cameraSection: {
    marginBottom: 16,
  },
  cameraLabel: {
    fontSize: 14,
    color: '#a3e635',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  cameraContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#374151',
  },
  cameraHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  infoItemDescription: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 18,
  },
});
