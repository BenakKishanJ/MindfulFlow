// app/(tabs)/posture.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Alert,
  Vibration,
  Animated,
  Easing,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ── CONFIG: Update these ──────────────────────
const THINGSPEAK_CHANNEL_ID = "3176397";
const THINGSPEAK_READ_API_KEY = "7I3OVWXXWBFB5Q96";
const POSTURE_THRESHOLD = 400; // Adjust based on your sensor calibration
const SLOUCH_THRESHOLD = 500; // Adjust based on your sensor calibration
// ──────────────────────────────────────────────

interface ThingSpeakData {
  created_at: string;
  field1?: string; // fsr1
  field2?: string; // fsr2
  field3?: string; // diff
}

export default function PostureTab() {
  const [posture, setPosture] = useState<'good' | 'lean-left' | 'lean-right' | 'slouched'>('good');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isWarning, setIsWarning] = useState(false);
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const [history, setHistory] = useState<ThingSpeakData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const historyAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for warning
  const pulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bubbleAnim, { toValue: 0, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  };

  useEffect(() => {
    if (isWarning) {
      pulse();
      Vibration.vibrate([0, 500, 300, 500]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      bubbleAnim.setValue(0);
      bubbleAnim.stopAnimation();
    }
  }, [isWarning]);

  // Fetch from ThingSpeak every 5 seconds
  useEffect(() => {
    const fetchPosture = async () => {
      try {
        const res = await fetch(
          `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=1`
        );
        const data = await res.json();
        const latest = data.feeds[0] as ThingSpeakData;

        if (!latest.field1 || !latest.field2 || !latest.field3) return;

        const fsr1 = parseFloat(latest.field1);
        const fsr2 = parseFloat(latest.field2);
        const diff = Math.abs(parseFloat(latest.field3));

        setLastUpdate(new Date(latest.created_at).toLocaleTimeString());

        // Determine posture
        if (fsr1 < SLOUCH_THRESHOLD && fsr2 < SLOUCH_THRESHOLD) {
          setPosture('slouched');
        } else if (diff > POSTURE_THRESHOLD) {
          setPosture(fsr1 > fsr2 ? 'lean-left' : 'lean-right');
          if (!isWarning) setIsWarning(true);
        } else {
          setPosture('good');
          setIsWarning(false);
        }
      } catch (err) {
        console.log("ThingSpeak fetch error:", err);
      }
    };

    fetchPosture();
    const interval = setInterval(fetchPosture, 5000);
    return () => clearInterval(interval);
  }, [isWarning]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=50`
        );
        const data = await res.json();
        setHistory(data.feeds.reverse()); // newest first → oldest
      } catch (err) {
        console.log("History fetch error:", err);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 30000); // update every 30s
    return () => clearInterval(interval);
  }, []);

  // Animation for expand/collapse
  useEffect(() => {
    Animated.timing(historyAnim, {
      toValue: showHistory ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showHistory]);

  const historyHeight = historyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.min(history.length * 64, 400)], // max 400px
  });

  const aiMessage = {
    good: "Great posture! Keep sitting tall — your spine thanks you!",
    'lean-left': "You're leaning left — gently shift your weight to the center.",
    'lean-right': "Leaning right — straighten up and balance both sides.",
    slouched: "Sit up straight! Your back needs support — roll shoulders back.",
  };

  const postureImages = {
    good: require('@/assets/images/posture-good.png'),
    'lean-left': require('@/assets/images/posture-lean-left.png'),
    'lean-right': require('@/assets/images/posture-lean-right.png'),
    slouched: require('@/assets/images/posture-slouched.png'),
  };

  return (
    <SafeAreaView className="flex-1 bg-lime-100">
      <ScrollView>
        <View className="flex-1 px-6 pt-8 pb-32">
          {/* Header */}
          <Text className="text-[#1A1A1A] text-3xl font-bold mb-2">Posture Coach</Text>
          <Text className="text-gray-600 text-base mb-8">Real-time spine alignment monitoring</Text>

          {/* Posture Avatar */}
          <View className="items-center mb-10">
            <View className="relative">
              <Image
                source={postureImages[posture]}
                style={{ width: 280, height: 380 }}
                resizeMode="contain"
              />
              {isWarning && (
                <Animated.View
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderRadius: 20,
                    transform: [{ scale: bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
                  }}
                />
              )}
            </View>
          </View>

          {/* AI Coach Bubble */}
          <View className="mx-4">
            <View className={`bg-[#A3E635] rounded-3xl px-6 py-5 ${isWarning ? 'shadow-lg' : 'shadow-md'}`}>
              <Text className="text-[#1A1A1A] text-lg font-semibold leading-6">
                {aiMessage[posture]}
              </Text>
              {isWarning && (
                <Text className="text-[#1A1A1A]/80 text-sm mt-2 font-medium">
                  Warning: Poor posture detected!
                </Text>
              )}
            </View>
            <View className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#A3E635] self-start ml-12 -mt-1" />
          </View>

          {/* Status Indicator */}
          <View className="mt-10 items-center">
            <View className={`flex-row items-center gap-3 px-6 py-4 rounded-2xl ${posture === 'good' ? 'bg-white' : 'bg-red-50'} border ${posture === 'good' ? 'border-gray-200' : 'border-red-300'}`}>
              <Ionicons
                name={posture === 'good' ? "checkmark-circle" : "warning"}
                size={28}
                color={posture === 'good' ? "#A3E635" : "#ef4444"}
              />
              <View>
                <Text className="font-bold text-[#1A1A1A]">
                  {posture === 'good' ? "Perfect Posture" : "Correction Needed"}
                </Text>
                <Text className="text-sm text-gray-600">
                  Last update: {lastUpdate || "Connecting..."}
                </Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View className="mt-8 bg-white rounded-2xl p-5 border border-gray-200">
            <Text className="text-[#1A1A1A] font-bold text-center mb-3">How It Works</Text>
            <Text className="text-gray-600 text-sm leading-6 text-center">
              Two sensors under your chair detect weight distribution.
              The AI coach helps you maintain perfect spinal alignment all day.
            </Text>
          </View>

          {/* === POSTURE HISTORY === */}
          <View className="mt-8">
            <TouchableOpacity
              onPress={() => setShowHistory(!showHistory)}
              className="bg-white rounded-2xl px-6 py-5 flex-row justify-between items-center border border-gray-200 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="time-outline" size={24} color="#A3E635" />
                <Text className="text-[#1A1A1A] font-bold text-lg">Posture History</Text>
                <View className="bg-[#A3E635]/10 px-3 py-1 rounded-full">
                  <Text className="text-[#1A1A1A] text-xs font-semibold">{history.length} records</Text>
                </View>
              </View>

              {/* This one uses only Ionicons – no extra library needed */}
              <Ionicons
                name={showHistory ? "chevron-up" : "chevron-down"}
                size={26}
                color="#6B7280"
              />
            </TouchableOpacity>
            <Animated.View style={{ height: historyHeight, overflow: 'hidden' }}>
              <View className="bg-white border border-gray-200 border-t-0 rounded-b-2xl">
                {history.length === 0 ? (
                  <View className="py-10 items-center">
                    <Text className="text-gray-500">No history yet</Text>
                  </View>
                ) : (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    style={{ maxHeight: 400 }}
                  >
                    {history.map((entry, index) => {
                      const fsr1 = entry.field1 ? parseFloat(entry.field1) : 0;
                      const fsr2 = entry.field2 ? parseFloat(entry.field2) : 0;
                      const diff = entry.field3 ? Math.abs(parseFloat(entry.field3)) : 0;
                      const isBad = diff > POSTURE_THRESHOLD;
                      const time = new Date(entry.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <View
                          key={index}
                          className={`px-6 py-4 flex-row justify-between items-center border-b border-gray-100 ${index === history.length - 1 ? 'border-b-0' : ''
                            }`}
                        >
                          <View className="flex-1">
                            <Text className="text-[#1A1A1A] font-medium">{time}</Text>
                            <Text className="text-xs text-gray-500">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </Text>
                          </View>

                          <View className="flex-row items-center gap-6">
                            <View className="items-center">
                              <Text className="text-xs text-gray-500">FSR-L</Text>
                              <Text className="font-semibold text-[#1A1A1A]">{fsr1.toFixed(0)}</Text>
                            </View>
                            <View className="items-center">
                              <Text className="text-xs text-gray-500">FSR-R</Text>
                              <Text className="font-semibold text-[#1A1A1A]">{fsr2.toFixed(0)}</Text>
                            </View>
                            <View className="items-center">
                              <Text className="text-xs text-gray-500">Diff</Text>
                              <Text
                                className={`font-bold ${isBad ? 'text-red-600' : 'text-[#A3E635]'}`}
                              >
                                {diff.toFixed(0)}
                              </Text>
                            </View>
                          </View>

                          <Ionicons
                            name={isBad ? "warning" : "checkmark-circle"}
                            size={20}
                            color={isBad ? "#ef4444" : "#A3E635"}
                          />
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </Animated.View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
