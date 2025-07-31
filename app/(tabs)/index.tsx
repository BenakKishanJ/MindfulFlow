import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Monitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [blinkRate, setBlinkRate] = useState(18);
  const [postureScore, setPostureScore] = useState(85);
  const [emotionalState] = useState("Neutral");
  const [sessionTime, setSessionTime] = useState(0);

  // Mock timer for session tracking
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isMonitoring) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
        // Mock data updates
        setBlinkRate(Math.floor(Math.random() * (25 - 12) + 12));
        setPostureScore(Math.floor(Math.random() * (100 - 60) + 60));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getPostureStatus = (score: number) => {
    if (score >= 80) return { status: "Good", color: "text-green-600" };
    if (score >= 60) return { status: "Fair", color: "text-yellow-600" };
    return { status: "Poor", color: "text-red-600" };
  };

  const getBlinkStatus = (rate: number) => {
    if (rate >= 15 && rate <= 20)
      return { status: "Normal", color: "text-green-600" };
    if (rate < 10) return { status: "Low - Eye Strain", color: "text-red-600" };
    return { status: "High", color: "text-yellow-600" };
  };

  const toggleMonitoring = () => {
    if (!isMonitoring) {
      Alert.alert(
        "Start Monitoring",
        "MindfulFlow will monitor your eye movements, posture, and emotional state using your device's camera and sensors.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Start", onPress: () => setIsMonitoring(true) },
        ],
      );
    } else {
      setIsMonitoring(false);
      setSessionTime(0);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Wellness Monitor
          </Text>
          <Text className="text-gray-600">
            Real-time tracking of your digital wellness
          </Text>
        </View>

        {/* Monitoring Controls */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <View className="items-center mb-6">
            <View
              className={`w-24 h-24 rounded-full items-center justify-center mb-4 ${
                isMonitoring ? "bg-purple-100" : "bg-gray-100"
              }`}
            >
              <Ionicons
                name={isMonitoring ? "eye" : "eye-off"}
                size={40}
                color={isMonitoring ? "#8B5CF6" : "#6B7280"}
              />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              {isMonitoring ? "Monitoring Active" : "Start Monitoring"}
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              {isMonitoring
                ? "Tracking your wellness metrics in real-time"
                : "Tap to begin monitoring your digital wellness"}
            </Text>
            <TouchableOpacity
              onPress={toggleMonitoring}
              className={`px-8 py-3 rounded-full ${
                isMonitoring ? "bg-red-500" : "bg-purple-600"
              }`}
            >
              <Text className="text-white font-semibold">
                {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
              </Text>
            </TouchableOpacity>
          </View>

          {isMonitoring && (
            <View className="border-t border-gray-200 pt-4">
              <Text className="text-center text-gray-600">
                Session Time:{" "}
                <Text className="font-mono font-bold">
                  {formatTime(sessionTime)}
                </Text>
              </Text>
            </View>
          )}
        </View>

        {/* Live Metrics */}
        {isMonitoring && (
          <View className="space-y-4">
            {/* Eye Health Card */}
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <View className="flex-row items-center mb-4">
                <Ionicons name="eye" size={24} color="#8B5CF6" />
                <Text className="text-lg font-semibold text-gray-900 ml-3">
                  Eye Health
                </Text>
              </View>
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Blink Rate</Text>
                  <View className="items-end">
                    <Text className="text-xl font-bold text-gray-900">
                      {blinkRate}/min
                    </Text>
                    <Text
                      className={`text-sm ${getBlinkStatus(blinkRate).color}`}
                    >
                      {getBlinkStatus(blinkRate).status}
                    </Text>
                  </View>
                </View>
                <View className="bg-gray-200 h-2 rounded-full">
                  <View
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((blinkRate / 25) * 100, 100)}%`,
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Posture Card */}
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <View className="flex-row items-center mb-4">
                <Ionicons name="body" size={24} color="#8B5CF6" />
                <Text className="text-lg font-semibold text-gray-900 ml-3">
                  Posture
                </Text>
              </View>
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Posture Score</Text>
                  <View className="items-end">
                    <Text className="text-xl font-bold text-gray-900">
                      {postureScore}%
                    </Text>
                    <Text
                      className={`text-sm ${getPostureStatus(postureScore).color}`}
                    >
                      {getPostureStatus(postureScore).status}
                    </Text>
                  </View>
                </View>
                <View className="bg-gray-200 h-2 rounded-full">
                  <View
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${postureScore}%` }}
                  />
                </View>
              </View>
            </View>

            {/* Emotional State Card */}
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <View className="flex-row items-center mb-4">
                <Ionicons name="happy" size={24} color="#8B5CF6" />
                <Text className="text-lg font-semibold text-gray-900 ml-3">
                  Emotional State
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Current State</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {emotionalState}
                </Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </Text>
              <View className="flex-row justify-between">
                <TouchableOpacity className="flex-1 bg-blue-50 rounded-xl p-4 mr-2 items-center">
                  <Ionicons name="pause" size={24} color="#3B82F6" />
                  <Text className="text-blue-600 font-medium mt-2">
                    Take Break
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-green-50 rounded-xl p-4 ml-2 items-center">
                  <Ionicons name="fitness" size={24} color="#10B981" />
                  <Text className="text-green-600 font-medium mt-2">
                    Stretch
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* When not monitoring */}
        {!isMonitoring && (
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              What We Track
            </Text>
            <View className="space-y-4">
              <View className="flex-row items-start">
                <Ionicons name="eye" size={20} color="#8B5CF6" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">Eye Strain</Text>
                  <Text className="text-gray-600 text-sm">
                    Monitor blink rate and detect eye fatigue
                  </Text>
                </View>
              </View>
              <View className="flex-row items-start">
                <Ionicons name="body" size={20} color="#8B5CF6" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">Posture</Text>
                  <Text className="text-gray-600 text-sm">
                    Track slouching and head position
                  </Text>
                </View>
              </View>
              <View className="flex-row items-start">
                <Ionicons name="happy" size={20} color="#8B5CF6" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">
                    Emotional Well-being
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Recognize emotional states and stress levels
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
