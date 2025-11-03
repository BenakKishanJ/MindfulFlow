// app/(tabs)/insights.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Share,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PieChart, BarChart } from "react-native-chart-kit";

// Import exercises data safely
const { exercisesData } = require("@/data/exercisesData");

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 220;

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);

// Tag colors from log.tsx
const TAG_COLORS: Record<string, string> = {
  Social: "#C4B5FD",
  Games: "#FCA5A5",
  Work: "#93C5FD",
  Study: "#A5B4FC",
  Essential: "#D1D5DB",
  Productive: "#BBF7D0",
  Entertainment: "#F9A8D4",
  Other: "#E5E7EB",
};

const MOOD_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#a855f7"];

interface DailyData {
  totalScreenTime: number;
  avgMood: number;
  totalExercises: number;
  tagBreakdown: Record<string, number>;
  moodDistribution: number[];
  exerciseByType: Record<string, number>;
  wellnessScore: number;
  aiReport?: {
    text: string;
    score: number;
    generatedAt: any;
  };
}

export default function Insights() {
  const { currentUser } = useAuth();
  const [selectedDate] = useState(new Date()); // For future date picker
  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const todayKey = format(selectedDate, "yyyy-MM-dd");

  // === ANIMATION ===
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // === FETCH DATA ===
  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const uid = currentUser.uid;

      // 1. App Logs
      const logsRef = collection(db, "users", uid, "logs", todayKey, "apps");
      const logsSnap = await getDocs(logsRef);
      const logs: any[] = logsSnap.docs.map((d) => d.data());

      // 2. Exercise Progress
      const progressRef = doc(db, "users", uid, "dailyProgress", todayKey);
      const progressSnap = await getDoc(progressRef);
      const progress = progressSnap.exists() ? progressSnap.data() : null;

      // === AGGREGATE DATA ===
      const totalScreenTime = logs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
      const validMoods = logs.filter((l) => l.mood).map((l) => l.mood);
      const avgMood = validMoods.length > 0 ? validMoods.reduce((a, b) => a + b, 0) / validMoods.length : 0;

      const tagBreakdown: Record<string, number> = {};
      logs.forEach((l) => {
        const tag = l.tag || "Other";
        tagBreakdown[tag] = (tagBreakdown[tag] || 0) + (l.durationMinutes || 0);
      });

      const moodDistribution = [0, 0, 0, 0, 0];
      logs.forEach((l) => {
        if (l.mood) moodDistribution[l.mood - 1]++;
      });

      const exerciseByType: Record<string, number> = {};
      if (progress?.exerciseCount) {
        Object.entries(progress.exerciseCount).forEach(([id, count]) => {
          const exercise = exercisesData.find((e: any) => e.id === id);
          const type = exercise?.type || "other";
          exerciseByType[type] = (exerciseByType[type] || 0) + (count as number);
        });
      }

      const totalExercises = progress?.totalCompletions || 0;
      const screenHours = totalScreenTime / 60;
      const breaksRatio = totalExercises > 0 ? Math.min(totalExercises / Math.max(screenHours, 1), 3) : 0;

      const wellnessScore = Math.min(
        100,
        Math.round(
          (totalExercises * 15) +
          (100 - screenHours * 8) +
          (avgMood * 12) +
          (breaksRatio * 15)
        )
      );

      const aiReport = progress?.aiReport;

      setData({
        totalScreenTime,
        avgMood: Number(avgMood.toFixed(1)),
        totalExercises,
        tagBreakdown,
        moodDistribution,
        exerciseByType,
        wellnessScore,
        aiReport,
      });
    } catch (err) {
      console.error("Fetch error:", err);
      Alert.alert("Error", "Failed to load insights.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, todayKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // === REFRESH ===
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // === GENERATE AI REPORT ===
  const generateReport = async () => {
    if (!data || !currentUser || generatingReport) return;

    setGeneratingReport(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const prompt = `
You are a calm, expert digital wellness coach. Analyze this user's daily data and generate a concise, encouraging report.

DATA:
- Total Screen Time: ${Math.floor(data.totalScreenTime / 60)}h ${data.totalScreenTime % 60}m
- Average Mood: ${data.avgMood}/5
- Total Exercises: ${data.totalExercises}
- Tag Breakdown: ${Object.entries(data.tagBreakdown)
          .map(([tag, mins]) => `${tag}: ${mins}m`)
          .join(", ")}
- Wellness Score: ${data.wellnessScore}/100

OUTPUT FORMAT (strict):
**Strengths**
• [2-3 bullet points]

**Improvements**
• [1-2 gentle gaps]

**Suggestions**
• [3 practical tips]

**Score**: ${data.wellnessScore}/100 – [one-word summary: Excellent/Good/Fair/Needs Work]
`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const reportText = result.response.text();

      const reportRef = doc(db, "users", currentUser.uid, "dailyProgress", todayKey);
      const reportData = {
        text: reportText,
        score: data.wellnessScore,
        generatedAt: serverTimestamp(),
      };

      const snap = await getDoc(reportRef);
      if (snap.exists()) {
        await updateDoc(reportRef, { aiReport: reportData });
      } else {
        await setDoc(reportRef, { aiReport: reportData }, { merge: true });
      }

      setData((prev) => prev ? { ...prev, aiReport: reportData } : null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert("AI Error", err.message || "Failed to generate report.");
    } finally {
      setGeneratingReport(false);
    }
  };

  // === SHARE REPORT ===
  const shareReport = async () => {
    if (!data?.aiReport) return;
    try {
      await Share.share({
        message: `My Daily Wellness Report – ${todayKey}\n\n${data.aiReport.text}`,
      });
    } catch (err) {
      Alert.alert("Share failed", "Could not share report.");
    }
  };

  // === NO DATA UI ===
  if (!currentUser) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <Text className="text-[#212121] font-bold text-lg text-center">
          Sign in to view your insights
        </Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#A3E635" />
        <Text className="text-gray-600 mt-4">Loading your insights...</Text>
      </SafeAreaView>
    );
  }

  const hasData = data && (data.totalScreenTime > 0 || data.totalExercises > 0);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        <Animated.View style={{ opacity: fadeAnim }} className="px-6 pt-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-[#212121] text-3xl font-bold">
              Insights
            </Text>
            <TouchableOpacity
              onPress={generateReport}
              disabled={generatingReport || !hasData}
              className={`w-12 h-12 rounded-full items-center justify-center shadow-md ${hasData ? "bg-lime-400" : "bg-gray-200"
                }`}
            >
              {generatingReport ? (
                <ActivityIndicator size="small" color="#212121" />
              ) : (
                <Ionicons name="refresh" size={24} color="#212121" />
              )}
            </TouchableOpacity>
          </View>

          {/* Date */}
          <Text className="text-gray-600 text-base mb-6">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </Text>

          {/* No Data */}
          {!hasData && (
            <View className="items-center py-16">
              <View className="bg-gray-100 w-24 h-24 rounded-full items-center justify-center mb-6">
                <Ionicons name="analytics-outline" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-gray-600 text-lg font-medium text-center">
                No activity yet today
              </Text>
              <Text className="text-gray-500 text-center mt-2 px-8">
                Log apps or complete exercises to see insights
              </Text>
            </View>
          )}

          {hasData && data && (
            <>
              {/* Summary Cards */}
              <View className="flex-row flex-wrap justify-between mb-8 gap-3">
                <View className="bg-white border border-gray-200 rounded-2xl p-4 flex-1 min-w-[48%] shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="time-outline" size={20} color="#A3E635" />
                    <Text className="text-gray-600 text-sm ml-2">Screen Time</Text>
                  </View>
                  <Text className="text-[#212121] text-2xl font-bold">
                    {Math.floor(data.totalScreenTime / 60)}h {data.totalScreenTime % 60}m
                  </Text>
                </View>

                <View className="bg-white border border-gray-200 rounded-2xl p-4 flex-1 min-w-[48%] shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="happy-outline" size={20} color="#A855F7" />
                    <Text className="text-gray-600 text-sm ml-2">Mood</Text>
                  </View>
                  <Text className="text-[#212121] text-2xl font-bold">
                    {data.avgMood}/5
                  </Text>
                </View>

                <View className="bg-white border border-gray-200 rounded-2xl p-4 flex-1 min-w-[48%] shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="leaf-outline" size={20} color="#84CC16" />
                    <Text className="text-gray-600 text-sm ml-2">Exercises</Text>
                  </View>
                  <Text className="text-[#212121] text-2xl font-bold">
                    {data.totalExercises}
                  </Text>
                </View>

                <View className="bg-white border border-gray-200 rounded-2xl p-4 flex-1 min-w-[48%] shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="star" size={20} color="#F59E0B" />
                    <Text className="text-gray-600 text-sm ml-2">Score</Text>
                  </View>
                  <Text className="text-[#212121] text-2xl font-bold">
                    {data.wellnessScore}
                  </Text>
                </View>
              </View>

              {/* Charts */}
              <View className="space-y-6 mb-8">
                {/* Tag Pie */}
                {Object.keys(data.tagBreakdown).length > 0 && (
                  <View className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <Text className="text-[#212121] font-bold text-lg mb-4">
                      Screen Time by Category
                    </Text>
                    <PieChart
                      data={Object.entries(data.tagBreakdown).map(([tag, mins]) => ({
                        name: tag,
                        value: mins,
                        color: TAG_COLORS[tag] || "#E5E7EB",
                        legendFontColor: "#374151",
                        legendFontSize: 12,
                      }))}
                      width={CHART_WIDTH}
                      height={CHART_HEIGHT}
                      chartConfig={{
                        color: () => "#000",
                      }}
                      accessor="value"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      absolute
                    />
                  </View>
                )}

                {/* Mood Bar */}
                {data.moodDistribution.some((v) => v > 0) && (
                  <View className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <Text className="text-[#212121] font-bold text-lg mb-4">
                      Mood Distribution
                    </Text>
                    <BarChart
                      data={{
                        labels: ["1", "2", "3", "4", "5"],
                        datasets: [{ data: data.moodDistribution }],
                      }}
                      width={CHART_WIDTH}
                      height={CHART_HEIGHT}
                      yAxisLabel=""
                      yAxisSuffix=""
                      chartConfig={{
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1, index = 0) => MOOD_COLORS[index] || "#ccc",
                        labelColor: () => "#374151",
                      }}
                      fromZero
                      showValuesOnTopOfBars
                    />
                  </View>
                )}
              </View>

              {/* AI Report */}
              {data.aiReport ? (
                <View className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 mb-8">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-purple-700 font-bold text-lg">
                      Your Daily Report
                    </Text>
                    <TouchableOpacity onPress={shareReport}>
                      <Ionicons name="share-outline" size={22} color="#9333EA" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-[#212121] leading-6 whitespace-pre-line">
                    {data.aiReport.text}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={generateReport}
                  className="bg-gradient-to-r from-lime-400 to-purple-500 p-6 rounded-2xl items-center shadow-lg mb-8"
                >
                  <Ionicons name="sparkles" size={28} color="#212121" />
                  <Text className="text-[#212121] font-bold text-lg mt-2">
                    Generate AI Report
                  </Text>
                  <Text className="text-[#212121]/80 text-sm mt-1">
                    Get personalized insights
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
