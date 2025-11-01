import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Insights() {
  const [selectedTab, setSelectedTab] = useState("Summary");
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data for wellness summaries
  const dailySummary = {
    date: "Today, Dec 15",
    overallScore: 84,
    keyInsights: [
      "Your posture improved significantly during afternoon sessions",
      "Eye strain peaked around 3 PM - consider adjusting screen brightness",
      "You took 5 breaks today, meeting your daily goal"
    ],
    recommendations: [
      "Try the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds",
      "Set up your workspace to maintain neutral spine alignment",
      "Consider using blue light filters during evening screen time"
    ]
  };

  const weeklyTrends = [
    {
      metric: "Posture Score",
      trend: "improving",
      change: "+12%",
      description: "Your posture has been consistently better this week"
    },
    {
      metric: "Eye Strain",
      trend: "concerning",
      change: "+8%",
      description: "Slight increase in eye strain events, especially in the evenings"
    },
    {
      metric: "Break Frequency",
      trend: "excellent",
      change: "+25%",
      description: "Great job maintaining regular break intervals"
    }
  ];

  const aiInsights = [
    {
      type: "pattern",
      title: "Evening Screen Time Pattern",
      description: "You tend to have longer screen sessions after 7 PM with increased eye strain. Consider implementing a wind-down routine.",
      priority: "medium"
    },
    {
      type: "habit",
      title: "Posture Improvement",
      description: "Your posture scores are consistently higher during morning hours. Try to maintain this awareness throughout the day.",
      priority: "low"
    },
    {
      type: "alert",
      title: "Blink Rate Concern",
      description: "Your blink rate has been below average for 3 consecutive days. This may indicate digital eye strain.",
      priority: "high"
    }
  ];

  const generateNewSummary = () => {
    setIsGenerating(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsGenerating(false);
      Alert.alert("Summary Updated", "Your latest wellness summary has been generated using your recent activity data.");
    }, 2000);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return { name: "trending-up", color: "#10B981" };
      case "concerning":
        return { name: "trending-down", color: "#EF4444" };
      case "excellent":
        return { name: "checkmark-circle", color: "#10B981" };
      default:
        return { name: "remove", color: "#6B7280" };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50";
      case "medium":
        return "border-yellow-200 bg-yellow-50";
      case "low":
        return "border-green-200 bg-green-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getPriorityIconColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      case "low":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const tabs = ["Summary", "Trends", "AI Insights"];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-3xl font-ppmori-semibold text-gray-900 mb-2">
              Insights
            </Text>
            <Text className="text-gray-600">
              AI-powered wellness analysis
            </Text>
          </View>
          <TouchableOpacity
            onPress={generateNewSummary}
            disabled={isGenerating}
            className="bg-purple-600 px-4 py-2 rounded-full flex-row items-center"
          >
            <Ionicons
              name={isGenerating ? "sync" : "sparkles"}
              size={16}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white font-medium">
              {isGenerating ? "Generating..." : "Refresh"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row bg-gray-200 rounded-2xl p-1 mb-6">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              className={`flex-1 py-3 rounded-xl ${
                selectedTab === tab ? "bg-white shadow-sm" : ""
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  selectedTab === tab ? "text-purple-600" : "text-gray-600"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Tab */}
        {selectedTab === "Summary" && (
          <View className="space-y-6">
            {/* Daily Summary Card */}
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">
                  Daily Summary
                </Text>
                <Text className="text-sm text-gray-500">{dailySummary.date}</Text>
              </View>

              <View className="flex-row items-center mb-6">
                <View className="bg-purple-100 p-4 rounded-full mr-4">
                  <Text className="text-2xl font-ppmori-semibold text-purple-600">
                    {dailySummary.overallScore}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    Overall Wellness Score
                  </Text>
                  <Text className="text-gray-600">
                    {dailySummary.overallScore >= 80 ? "Excellent day!" : "Room for improvement"}
                  </Text>
                </View>
              </View>

              <Text className="font-semibold text-gray-900 mb-3">Key Insights</Text>
              <View className="space-y-2">
                {dailySummary.keyInsights.map((insight, index) => (
                  <View key={index} className="flex-row items-start">
                    <View className="bg-blue-100 p-1 rounded-full mr-3 mt-1">
                      <Ionicons name="bulb" size={12} color="#3B82F6" />
                    </View>
                    <Text className="text-gray-700 flex-1">{insight}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Recommendations */}
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Personalized Recommendations
              </Text>
              <View className="space-y-4">
                {dailySummary.recommendations.map((recommendation, index) => (
                  <View key={index} className="flex-row items-start">
                    <View className="bg-green-100 p-2 rounded-full mr-3">
                      <Ionicons name="checkmark" size={16} color="#10B981" />
                    </View>
                    <Text className="text-gray-700 flex-1">{recommendation}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Trends Tab */}
        {selectedTab === "Trends" && (
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Weekly Trends Analysis
            </Text>
            {weeklyTrends.map((trend, index) => (
              <View key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-semibold text-gray-900">
                    {trend.metric}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons
                      name={getTrendIcon(trend.trend).name as any}
                      size={20}
                      color={getTrendIcon(trend.trend).color}
                    />
                    <Text
                      className="ml-2 font-semibold"
                      style={{ color: getTrendIcon(trend.trend).color }}
                    >
                      {trend.change}
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-600">{trend.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Insights Tab */}
        {selectedTab === "AI Insights" && (
          <View className="space-y-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="sparkles" size={20} color="#8B5CF6" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">
                AI-Powered Insights
              </Text>
            </View>
            <Text className="text-gray-600 mb-4">
              Our AI analyzes your patterns to provide personalized insights
            </Text>

            {aiInsights.map((insight, index) => (
              <View
                key={index}
                className={`rounded-2xl p-6 border-2 ${getPriorityColor(insight.priority)}`}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <Ionicons
                      name={
                        insight.type === "pattern" ? "analytics" :
                        insight.type === "habit" ? "trending-up" : "warning"
                      }
                      size={20}
                      color={getPriorityIconColor(insight.priority)}
                    />
                    <Text className="text-lg font-semibold text-gray-900 ml-2 flex-1">
                      {insight.title}
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${
                    insight.priority === "high" ? "bg-red-100" :
                    insight.priority === "medium" ? "bg-yellow-100" : "bg-green-100"
                  }`}>
                    <Text className={`text-xs font-medium ${
                      insight.priority === "high" ? "text-red-600" :
                      insight.priority === "medium" ? "text-yellow-600" : "text-green-600"
                    }`}>
                      {insight.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-700">{insight.description}</Text>
              </View>
            ))}

            {/* AI Processing Info */}
            <View className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="information-circle" size={20} color="#8B5CF6" />
                <Text className="text-lg font-semibold text-purple-900 ml-2">
                  How It Works
                </Text>
              </View>
              <Text className="text-purple-800 leading-6">
                Our AI analyzes your behavior patterns, screen time habits, and wellness metrics to generate personalized insights. All processing happens locally on your device to ensure complete privacy.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
