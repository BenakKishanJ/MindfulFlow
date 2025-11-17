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
  Image,
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

const { exercisesData } = require("@/data/exercisesData");
const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 80; // Padding-safe
const CHART_HEIGHT = 220;

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);

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
  const [selectedDate] = useState(new Date());
  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const todayKey = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const uid = currentUser.uid;

      const logsRef = collection(db, "users", uid, "logs", todayKey, "apps");
      const logsSnap = await getDocs(logsRef);
      const logs: any[] = logsSnap.docs.map((d) => d.data());

      const progressRef = doc(db, "users", uid, "dailyProgress", todayKey);
      const progressSnap = await getDoc(progressRef);
      const progress = progressSnap.exists() ? progressSnap.data() : null;

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

      const exerciseScore = Math.min(totalExercises / 5, 1);
      const screenScore = 1 - Math.min(screenHours / 5, 1);
      const moodScore = avgMood / 10;
      const breaksScore = Math.min(breaksRatio, 1);

      const score = Math.round(
        (exerciseScore * 35) +
        (screenScore * 30) +
        (moodScore * 20) +
        (breaksScore * 15)
      );

      const wellnessScore = Math.min(100, Math.max(0, score));
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

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

  // === NO USER ===
  if (!currentUser) {
    return (
      <SafeAreaView className="flex-1 bg-lime-100 justify-center items-center px-6">
        <Text className="text-[#1A1A1A] font-bold text-xl text-center">
          Sign in to view your insights
        </Text>
      </SafeAreaView>
    );
  }

  // === LOADING ===
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-lime-100 justify-center items-center">
        <ActivityIndicator size="large" color="#A3E635" />
        <Text className="text-[#1A1A1A] mt-4 text-base">Loading insights...</Text>
      </SafeAreaView>
    );
  }

  const hasData = data && (data.totalScreenTime > 0 || data.totalExercises > 0);

  return (
    <SafeAreaView className="flex-1 bg-lime-100">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pt-8 pb-12"
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-[#1A1A1A] text-3xl font-bold tracking-tight">
              Insights
            </Text>
            <TouchableOpacity
              onPress={generateReport}
              disabled={generatingReport || !hasData}
              className={`w-12 h-12 rounded-full items-center justify-center shadow-sm ${hasData ? "bg-[#A3E635]" : "bg-gray-200"
                }`}
            >
              {generatingReport ? (
                <ActivityIndicator size="small" color="#1A1A1A" />
              ) : (
                <Ionicons name="refresh" size={24} color="#1A1A1A" />
              )}
            </TouchableOpacity>
          </View>

          <Text className="text-gray-600 text-base mb-8">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </Text>

          {/* === EMPTY STATE === */}
          {!hasData && (
            <View className="items-center py-16">
              <View className="w-64 h-64 rounded-full overflow-hidden mb-6 shadow-lg">
                <Image
                  source={require("@/assets/images/ai_coach.png")}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <Text className="text-[#1A1A1A] text-xl font-bold text-center mb-2">
                No logs yet today
              </Text>
              <Text className="text-gray-600 text-center px-8 text-base">
                Log your screen time or complete exercises to unlock AI insights.
              </Text>
            </View>
          )}

          {/* === HAS DATA === */}
          {hasData && data && (
            <>
              {/* Summary Cards */}
              <View className="flex-row flex-wrap justify-between gap-3 mb-8">
                {[
                  { icon: "time-outline", label: "Screen Time", value: `${Math.floor(data.totalScreenTime / 60)}h ${data.totalScreenTime % 60}m` },
                  { icon: "happy-outline", label: "Mood", value: `${data.avgMood}/5` },
                  { icon: "leaf-outline", label: "Exercises", value: `${data.totalExercises}` },
                  { icon: "star", label: "Score", value: `${data.wellnessScore}` },
                ].map((item, i) => (
                  <View key={i} className="bg-white border border-gray-200 rounded-2xl p-5 flex-1 min-w-[48%] shadow-sm">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name={item.icon as any} size={20} color="#A3E635" />
                      <Text className="text-gray-600 text-sm ml-2">{item.label}</Text>
                    </View>
                    <Text className="text-[#1A1A1A] text-2xl font-bold">{item.value}</Text>
                  </View>
                ))}
              </View>

              {/* Charts */}
              <View className="space-y-6 mb-8">
                {Object.keys(data.tagBreakdown).length > 0 && (
                  <View className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <Text className="text-[#1A1A1A] font-bold text-lg mb-4">
                      Screen Time by Category
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <PieChart
                        data={Object.entries(data.tagBreakdown).map(([tag, mins]) => ({
                          name: tag,
                          value: mins,
                          color: TAG_COLORS[tag] || "#E5E7EB",
                          legendFontColor: "#374151",
                          legendFontSize: 12,
                        }))}
                        width={Math.max(CHART_WIDTH, Object.keys(data.tagBreakdown).length * 80)}
                        height={CHART_HEIGHT}
                        chartConfig={{ color: () => "#000" }}
                        accessor="value"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                      />
                    </ScrollView>
                  </View>
                )}

                {data.moodDistribution.some(v => v > 0) && (
                  <View className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <Text className="text-[#1A1A1A] font-bold text-lg mb-4">
                      Mood Distribution
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                        style={{ paddingRight: 20 }}
                      />
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* ====================== PREMIUM AI REPORT (FIXED) ====================== */}
              {data.aiReport ? (
                /* ——— REPORT DISPLAY ——— */
                <View className="relative rounded-3xl p-1 mb-8 shadow-xl">
                  {/* Animated Gradient Border */}
                  <View className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600 rounded-3xl animate-pulse" />

                  {/* Inner White Card */}
                  <View className="bg-white rounded-[22px] p-6 relative z-10">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-5">
                      <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-2xl  items-center justify-center mr-3">
                          <Ionicons name="sparkles" size={26} color="#9333ea" />
                        </View>
                        <View>
                          <Text className="text-[#1A1A1A] font-bold text-lg">Your AI Wellness Report</Text>
                          <Text className="text-gray-500 text-xs">Generated {format(new Date(), "h:mm a")}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={shareReport}
                        className="w-11 h-11 rounded-full bg-purple-100 items-center justify-center shadow-sm"
                        activeOpacity={0.8}
                      >
                        <Ionicons name="share-outline" size={20} color="#9333EA" />
                      </TouchableOpacity>
                    </View>

                    {/* Report Text */}
                    <Text className="text-[#1A1A1A] leading-7 text-base font-medium whitespace-pre-line">
                      {data.aiReport.text}
                    </Text>

                    {/* Regenerate Button */}
                    <TouchableOpacity
                      onPress={generateReport}
                      className="mt-5 bg-purple-50 border border-purple-200 rounded-2xl py-3 px-5 items-center flex-row justify-center"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh" size={18} color="#9333EA" className="mr-2" />
                      <Text className="text-purple-700 font-semibold">Regenerate Report</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* ——— GENERATE BUTTON ——— */
                <TouchableOpacity
                  onPress={generateReport}
                  className="relative rounded-3xl p-1 mb-8 shadow-xl"
                  activeOpacity={0.9}
                >
                  {/* Gradient Border */}
                  <View className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600 rounded-3xl" />

                  {/* Inner Card */}
                  <View className="bg-white rounded-[22px] p-6 items-center relative z-10">
                    {/* Glow Icon */}
                    <View className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 items-center justify-center shadow-lg mb-4 relative">
                      <View className="absolute inset-0 rounded-2xl bg-purple-400 blur-xl opacity-70" />
                      <Ionicons name="sparkles" size={36} color="white" />
                    </View>

                    <Text className="text-[#1A1A1A] font-bold text-xl text-center">Unlock AI Insights</Text>
                    <Text className="text-gray-600 text-sm mt-1 text-center">Personalized wellness report in seconds</Text>
                  </View>
                </TouchableOpacity>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
