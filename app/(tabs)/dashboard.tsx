import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("Today");
  const [weeklyData] = useState({
    eyeStrain: [12, 8, 15, 6, 18, 22, 14],
    postureScore: [85, 78, 92, 88, 76, 82, 89],
    breaksTaken: [3, 5, 2, 7, 4, 6, 5],
    sessionTime: [6.5, 8.2, 4.3, 9.1, 7.8, 5.9, 7.2],
  });

  const todayStats = {
    totalScreenTime: "7h 24m",
    eyeStrainEvents: 14,
    postureScore: 89,
    breaksTaken: 5,
    wellnessScore: 84,
  };

  const weeklyAverage = {
    screenTime: "6h 52m",
    eyeStrain: 13.6,
    posture: 84.3,
    breaks: 4.6,
    wellness: 82,
  };

  const periods = ["Today", "This Week", "This Month"];

  const getWellnessColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getWellnessBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const StatCard = ({ title, value, subtitle, icon, trend }: any) => (
    <View className="bg-white rounded-2xl p-6 shadow-sm flex-1 mx-1">
      <View className="flex-row items-center justify-between mb-3">
        <Ionicons name={icon} size={24} color="#8B5CF6" />
        {trend && (
          <View
            className={`flex-row items-center px-2 py-1 rounded-full ${
              trend.direction === "up" ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <Ionicons
              name={trend.direction === "up" ? "trending-up" : "trending-down"}
              size={12}
              color={trend.direction === "up" ? "#10B981" : "#EF4444"}
            />
            <Text
              className={`text-xs ml-1 ${
                trend.direction === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
      <Text className="text-gray-600 text-sm">{title}</Text>
      {subtitle && (
        <Text className="text-gray-500 text-xs mt-1">{subtitle}</Text>
      )}
    </View>
  );

  const MiniChart = ({ data, color, height = 40 }: any) => (
    <View className="flex-row items-end space-x-1" style={{ height }}>
      {data.map((value: number, index: number) => (
        <View
          key={index}
          className={`${color} rounded-t-sm flex-1`}
          style={{
            height: (value / Math.max(...data)) * height,
            minHeight: 2,
          }}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard
            </Text>
            <Text className="text-gray-600">
              Your wellness insights and trends
            </Text>
          </View>
          <TouchableOpacity className="bg-purple-100 p-3 rounded-full">
            <Ionicons name="calendar-outline" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View className="flex-row bg-gray-200 rounded-2xl p-1 mb-6">
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period)}
              className={`flex-1 py-3 rounded-xl ${
                selectedPeriod === period ? "bg-white shadow-sm" : ""
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  selectedPeriod === period
                    ? "text-purple-600"
                    : "text-gray-600"
                }`}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wellness Score */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">
              Overall Wellness Score
            </Text>
            <View
              className={`px-3 py-1 rounded-full ${getWellnessBg(todayStats.wellnessScore)}`}
            >
              <Text
                className={`font-semibold ${getWellnessColor(todayStats.wellnessScore)}`}
              >
                {todayStats.wellnessScore}/100
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="flex-1">
              <View className="bg-gray-200 h-4 rounded-full">
                <View
                  className={`h-4 rounded-full ${
                    todayStats.wellnessScore >= 80
                      ? "bg-green-500"
                      : todayStats.wellnessScore >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${todayStats.wellnessScore}%` }}
                />
              </View>
            </View>
            <Text className="ml-4 text-sm text-gray-600">
              {todayStats.wellnessScore >= 80
                ? "Excellent"
                : todayStats.wellnessScore >= 60
                  ? "Good"
                  : "Needs Attention"}
            </Text>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            {selectedPeriod} Overview
          </Text>
          <View className="flex-row mb-4">
            <StatCard
              title="Screen Time"
              value={
                selectedPeriod === "Today"
                  ? todayStats.totalScreenTime
                  : weeklyAverage.screenTime
              }
              subtitle={selectedPeriod === "Today" ? "Today" : "Daily Average"}
              icon="time-outline"
              trend={{ direction: "down", value: 8 }}
            />
            <StatCard
              title="Eye Strain Events"
              value={
                selectedPeriod === "Today"
                  ? todayStats.eyeStrainEvents
                  : Math.round(weeklyAverage.eyeStrain)
              }
              subtitle={selectedPeriod === "Today" ? "Today" : "Daily Average"}
              icon="eye-outline"
              trend={{ direction: "up", value: 12 }}
            />
          </View>
          <View className="flex-row">
            <StatCard
              title="Posture Score"
              value={`${selectedPeriod === "Today" ? todayStats.postureScore : Math.round(weeklyAverage.posture)}%`}
              subtitle={selectedPeriod === "Today" ? "Current" : "Average"}
              icon="body-outline"
              trend={{ direction: "up", value: 5 }}
            />
            <StatCard
              title="Breaks Taken"
              value={
                selectedPeriod === "Today"
                  ? todayStats.breaksTaken
                  : Math.round(weeklyAverage.breaks)
              }
              subtitle={selectedPeriod === "Today" ? "Today" : "Daily Average"}
              icon="pause-outline"
              trend={{ direction: "up", value: 15 }}
            />
          </View>
        </View>

        {/* Weekly Trends */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            7-Day Trends
          </Text>
          <View className="space-y-6">
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700 font-medium">
                  Eye Strain Events
                </Text>
                <Text className="text-sm text-gray-500">Per day</Text>
              </View>
              <MiniChart data={weeklyData.eyeStrain} color="bg-red-400" />
            </View>
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700 font-medium">Posture Score</Text>
                <Text className="text-sm text-gray-500">Percentage</Text>
              </View>
              <MiniChart data={weeklyData.postureScore} color="bg-blue-400" />
            </View>
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700 font-medium">Breaks Taken</Text>
                <Text className="text-sm text-gray-500">Per day</Text>
              </View>
              <MiniChart data={weeklyData.breaksTaken} color="bg-green-400" />
            </View>
          </View>
        </View>

        {/* Health Insights */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Health Insights
          </Text>
          <View className="space-y-4">
            <View className="flex-row items-start">
              <View className="bg-green-100 p-2 rounded-full mr-3">
                <Ionicons name="checkmark" size={16} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-900">
                  Great posture today!
                </Text>
                <Text className="text-gray-600 text-sm">
                  Your posture score improved by 12% compared to yesterday.
                </Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <View className="bg-yellow-100 p-2 rounded-full mr-3">
                <Ionicons name="warning" size={16} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-900">
                  Eye strain detected
                </Text>
                <Text className="text-gray-600 text-sm">
                  Consider taking more frequent breaks. Your blink rate is below
                  normal.
                </Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <View className="bg-blue-100 p-2 rounded-full mr-3">
                <Ionicons name="information" size={16} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-900">
                  Break reminder
                </Text>
                <Text className="text-gray-600 text-sm">
                  You have been active for 2 hours. Time for a short break!
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Goals Progress */}
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Daily Goals
          </Text>
          <View className="space-y-4">
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700">
                  Limit screen time to 8 hours
                </Text>
                <Text className="text-sm text-purple-600 font-medium">92%</Text>
              </View>
              <View className="bg-gray-200 h-2 rounded-full">
                <View
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: "92%" }}
                />
              </View>
            </View>
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700">Take 6 breaks</Text>
                <Text className="text-sm text-green-600 font-medium">83%</Text>
              </View>
              <View className="bg-gray-200 h-2 rounded-full">
                <View
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: "83%" }}
                />
              </View>
            </View>
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700">Maintain good posture</Text>
                <Text className="text-sm text-blue-600 font-medium">89%</Text>
              </View>
              <View className="bg-gray-200 h-2 rounded-full">
                <View
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "89%" }}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
