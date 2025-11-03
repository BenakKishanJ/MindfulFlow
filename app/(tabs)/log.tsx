// app/(tabs)/log.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { format, startOfDay } from "date-fns";

const TAGS = [
  "Social",
  "Games",
  "Work",
  "Study",
  "Essential",
  "Productive",
  "Entertainment",
  "Other",
] as const;

type Tag = (typeof TAGS)[number];

const TAG_COLORS: Record<Tag, string> = {
  Social: "bg-purple-100",
  Games: "bg-red-100",
  Work: "bg-blue-100",
  Study: "bg-indigo-100",
  Essential: "bg-gray-100",
  Productive: "bg-lime-100",
  Entertainment: "bg-pink-100",
  Other: "bg-zinc-100",
};

const TAG_TEXT_COLORS: Record<Tag, string> = {
  Social: "text-purple-700",
  Games: "text-red-700",
  Work: "text-blue-700",
  Study: "text-indigo-700",
  Essential: "text-gray-700",
  Productive: "text-lime-700",
  Entertainment: "text-pink-700",
  Other: "text-zinc-700",
};

const MOOD_OPTIONS = [
  { value: 1, label: "Drained", icon: "sad-outline", color: "#ef4444" },
  { value: 2, label: "Meh", icon: "remove-circle-outline", color: "#f97316" },
  { value: 3, label: "Okay", icon: "ellipse-outline", color: "#eab308" },
  { value: 4, label: "Good", icon: "happy-outline", color: "#84cc16" },
  { value: 5, label: "Energized", icon: "flash-outline", color: "#a855f7" },
];

interface AppLog {
  id?: string;
  appName: string;
  durationMinutes: number;
  mood: number;
  note?: string;
  tag: Tag;
  updatedAt?: any;
}

interface TrackedApp {
  name: string;
  tag: Tag;
}

const formatDuration = (mins: number): string => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

// Custom Slider Component
const CustomSlider = ({
  value,
  onValueChange,
  onSlidingComplete,
  minimumValue = 0,
  maximumValue = 480,
}: {
  value: number;
  onValueChange: (value: number) => void;
  onSlidingComplete: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
}) => {
  const percentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

  return (
    <View className="w-full py-2">
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full bg-lime-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
};

export default function LogScreen() {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "usage">("usage");
  const [showGuide, setShowGuide] = useState(false);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [trackedApps, setTrackedApps] = useState<TrackedApp[]>([]);
  const [todayLogs, setTodayLogs] = useState<Record<string, AppLog>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));

  const today = startOfDay(new Date());
  const todayKey = format(today, "yyyy-MM-dd");
  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Load data
  useEffect(() => {
    if (!currentUser) {
      // If there's no user, stop loading so UI doesn't hang on the spinner
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load tracked apps
        const appsRef = collection(db, "users", currentUser.uid, "trackedApps");
        const appsSnap = await getDocs(appsRef);
        const apps: TrackedApp[] = appsSnap.docs.map((d) => ({
          name: d.id,
          tag: d.data().tag || "Other",
        }));

        if (cancelled) return;
        setTrackedApps(apps);

        // Load today's logs
        const logsRef = collection(db, "users", currentUser.uid, "logs", todayKey, "apps");
        const logsSnap = await getDocs(logsRef);
        const logs: Record<string, AppLog> = {};
        logsSnap.docs.forEach((d) => {
          logs[d.id] = { id: d.id, ...d.data() } as AppLog;
        });
        setTodayLogs(logs);

        // Calculate streak
        let streakCount = 0;
        let checkDate = new Date(today);
        for (let i = 0; i < 30; i++) {
          const dateKey = format(checkDate, "yyyy-MM-dd");
          const dayRef = collection(db, "users", currentUser.uid, "logs", dateKey, "apps");
          const daySnap = await getDocs(dayRef);
          if (daySnap.empty) break;
          streakCount++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        }

        if (cancelled) return;
        setStreak(streakCount);
      } catch (err: any) {
        console.error("Load error:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [currentUser, todayKey]);
  const totalTime = useMemo(() => {
    return Object.values(todayLogs).reduce((sum, log) => sum + log.durationMinutes, 0);
  }, [todayLogs]);

  // Filter & Sort
  const filteredAndSortedApps = useMemo(() => {
    let apps = [...trackedApps];

    if (searchQuery) {
      apps = apps.filter((app) =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return apps.sort((a, b) => {
      const logA = todayLogs[a.name];
      const logB = todayLogs[b.name];

      if (sortBy === "name") return a.name.localeCompare(b.name);
      return (logB?.durationMinutes || 0) - (logA?.durationMinutes || 0);
    });
  }, [trackedApps, todayLogs, searchQuery, sortBy]);

  // === SAVE LOG ===
  const saveLog = async (appName: string, data: Partial<AppLog>) => {
    if (!currentUser) return;

    try {
      const logData = { ...data, updatedAt: serverTimestamp() };
      const logRef = doc(db, "users", currentUser.uid, "logs", todayKey, "apps", appName);

      const logSnap = await getDocs(
        query(collection(db, "users", currentUser.uid, "logs", todayKey, "apps"), where("__name__", "==", appName))
      );

      if (logSnap.empty) {
        await setDoc(logRef, {
          appName,
          durationMinutes: 0,
          mood: 3,
          note: "",
          tag: trackedApps.find(a => a.name === appName)?.tag || "Other",
          ...logData,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(logRef, logData);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error("Save error:", err);
      Alert.alert("Error", err.message || "Failed to save.");
    }
  };
  // Update Duration
  const updateDuration = (appName: string, hours: number, minutes: number) => {
    const totalMinutes = Math.min(Math.max(hours * 60 + minutes, 0), 1440);
    saveLog(appName, { durationMinutes: totalMinutes });

    setTodayLogs((prev) => ({
      ...prev,
      [appName]: {
        ...(prev[appName] || {
          appName,
          durationMinutes: 0,
          mood: 3,
          note: "",
          tag: trackedApps.find(a => a.name === appName)?.tag || "Other",
        }),
        durationMinutes: totalMinutes,
      },
    }));
  };
  // Add New App
  const handleAddApp = async () => {
    const name = newAppName.trim();
    if (!name || !currentUser) return;

    if (trackedApps.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert("Already tracking", `${name} is already in your list.`);
      return;
    }

    try {
      const appDoc = doc(db, "users", currentUser.uid, "trackedApps", name);
      await setDoc(appDoc, { tag: "Other" });

      setTrackedApps(prev => [...prev, { name, tag: "Other" }]);
      setExpandedApp(name);
      setShowAddModal(false);
      setNewAppName("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not add app.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#84cc16" />
      </SafeAreaView>
    );
  }

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }} className="px-5 py-6">
            {/* Header */}
            <Text className="text-[#212121] text-4xl font-bold mb-2">
              {greeting}!
            </Text>
            <Text className="text-gray-600 text-lg mb-6">
              Track your digital wellness in seconds
            </Text>

            {/* Stats Cards */}
            <View className="mb-6">
              <View className="flex-row gap-3 mb-3">
                {/* Total Time */}
                <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <Ionicons name="time-outline" size={24} color="#84cc16" />
                    <Text className="text-2xl font-bold text-[#212121]">
                      {formatDuration(totalTime)}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-xs">Total Today</Text>
                </View>

                {/* Apps Logged */}
                <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <Ionicons name="apps-outline" size={24} color="#a855f7" />
                    <Text className="text-2xl font-bold text-[#212121]">
                      {Object.keys(todayLogs).length}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-xs">Apps Logged</Text>
                </View>
              </View>

              {/* Streak Card */}
              {streak > 0 && (
                <View className="bg-lime-400 rounded-2xl p-4 shadow-sm">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons name="flame" size={24} color="white" />
                      <Text className="text-white text-xl font-bold ml-2">
                        {streak} day{streak !== 1 ? "s" : ""} streak!
                      </Text>
                    </View>
                    <Text className="text-white text-2xl">Fire</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Guide Toggle */}
            <TouchableOpacity
              onPress={() => {
                setShowGuide(!showGuide);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 flex-row items-center justify-between"
            >
              <Text className="text-[#212121] font-semibold">
                How to find your screen time
              </Text>
              <Ionicons
                name={showGuide ? "chevron-up" : "chevron-down"}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>

            {showGuide && (
              <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
                <View className="mb-4">
                  <View className="bg-lime-100 px-3 py-1.5 rounded-lg self-start mb-2">
                    <Text className="text-lime-700 font-semibold text-xs">
                      ANDROID
                    </Text>
                  </View>
                  <Text className="text-gray-700 text-sm leading-6">
                    Settings → Digital Wellbeing & parental controls → Dashboard
                    → Tap any app
                  </Text>
                </View>
                <View>
                  <View className="bg-purple-100 px-3 py-1.5 rounded-lg self-start mb-2">
                    <Text className="text-purple-700 font-semibold text-xs">
                      iOS
                    </Text>
                  </View>
                  <Text className="text-gray-700 text-sm leading-6">
                    Settings → Screen Time → See All Activity → Scroll to app
                  </Text>
                </View>
              </View>
            )}

            {/* Search & Sort */}
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1 relative">
                <Ionicons
                  name="search"
                  size={20}
                  color="#9ca3af"
                  style={{ position: "absolute", left: 16, top: 14, zIndex: 1 }}
                />
                <TextInput
                  placeholder="Search apps..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="bg-white border border-gray-200 pl-12 pr-4 py-3.5 rounded-2xl text-[#212121]"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSortBy(sortBy === "usage" ? "name" : "usage");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className="bg-white border border-gray-200 px-5 py-3.5 rounded-2xl items-center justify-center"
              >
                <Text className="font-semibold text-gray-700">
                  {sortBy === "usage" ? "Chart" : "Alphabet"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Add New App Button */}
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              className="bg-lime-400 rounded-2xl p-5 mb-6 shadow-sm flex-row items-center justify-center"
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text className="text-white font-bold text-lg ml-3">
                Add New App
              </Text>
            </TouchableOpacity>

            {/* App Cards */}
            {filteredAndSortedApps.length === 0 ? (
              <View className="bg-white rounded-2xl p-12 items-center shadow-sm border border-gray-100">
                <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-500 mt-4">
                  No apps found. Add one to get started!
                </Text>
              </View>
            ) : (
              filteredAndSortedApps.map((app) => {
                const log = todayLogs[app.name];
                const isExpanded = expandedApp === app.name;
                const hours = log ? Math.floor(log.durationMinutes / 60) : 0;
                const minutes = log ? log.durationMinutes % 60 : 0;

                return (
                  <View key={app.name} className="mb-3">
                    {/* Collapsed Card */}
                    <TouchableOpacity
                      onPress={() => {
                        setExpandedApp(isExpanded ? null : app.name);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-3">
                          <Text className="text-[#212121] text-lg font-bold mb-1">
                            {app.name}
                          </Text>
                          <View className="flex-row items-center">
                            <View
                              className={`px-3 py-1 rounded-lg ${TAG_COLORS[app.tag]}`}
                            >
                              <Text
                                className={`text-xs font-semibold ${TAG_TEXT_COLORS[app.tag]}`}
                              >
                                {app.tag}
                              </Text>
                            </View>
                            {log && (
                              <>
                                <Text className="text-gray-400 mx-2">•</Text>
                                <Text className="text-gray-700 font-bold">
                                  {formatDuration(log.durationMinutes)}
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                        <View className="flex-row items-center">
                          {log && (
                            <Ionicons
                              name={
                                MOOD_OPTIONS.find((m) => m.value === log.mood)
                                  ?.icon as any
                              }
                              size={24}
                              color={
                                MOOD_OPTIONS.find((m) => m.value === log.mood)
                                  ?.color
                              }
                              style={{ marginRight: 8 }}
                            />
                          )}
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#9ca3af"
                          />
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Card */}
                    {isExpanded && (
                      <View className="bg-white rounded-2xl p-5 mt-2 shadow-sm border border-gray-100">
                        {/* Duration Input */}
                        <View className="mb-6">
                          <Text className="text-[#212121] font-bold mb-3">
                            Time Spent Today
                          </Text>
                          <View className="flex-row gap-3 mb-4">
                            <View className="flex-1">
                              <TextInput
                                placeholder="0"
                                value={hours > 0 ? String(hours) : ""}
                                onChangeText={(text) => {
                                  const h = Math.min(
                                    Math.max(parseInt(text) || 0, 0),
                                    24
                                  );
                                  updateDuration(app.name, h, minutes);
                                }}
                                keyboardType="number-pad"
                                className="bg-gray-50 border border-gray-200 px-4 py-4 rounded-xl text-[#212121] font-bold text-xl text-center"
                                maxLength={2}
                              />
                              <Text className="text-gray-500 text-xs text-center mt-1">
                                hours
                              </Text>
                            </View>
                            <View className="flex-1">
                              <TextInput
                                placeholder="0"
                                value={minutes > 0 ? String(minutes) : ""}
                                onChangeText={(text) => {
                                  const m = Math.min(
                                    Math.max(parseInt(text) || 0, 0),
                                    59
                                  );
                                  updateDuration(app.name, hours, m);
                                }}
                                keyboardType="number-pad"
                                className="bg-gray-50 border border-gray-200 px-4 py-4 rounded-xl text-[#212121] font-bold text-xl text-center"
                                maxLength={2}
                              />
                              <Text className="text-gray-500 text-xs text-center mt-1">
                                minutes
                              </Text>
                            </View>
                          </View>

                          {/* Custom Slider */}
                          <View className="mt-2">
                            <CustomSlider
                              value={log?.durationMinutes || 0}
                              onValueChange={(val: number) => {
                                setTodayLogs((prev) => ({
                                  ...prev,
                                  [app.name]: {
                                    ...prev[app.name],
                                    appName: app.name,
                                    durationMinutes: val,
                                    mood: prev[app.name]?.mood || 3,
                                    tag: app.tag,
                                  },
                                }));
                              }}
                              onSlidingComplete={(val: number) => {
                                saveLog(app.name, { durationMinutes: val });
                                Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light
                                );
                              }}
                              minimumValue={0}
                              maximumValue={480}
                            />
                            <View className="flex-row justify-between px-1">
                              <Text className="text-gray-500 text-xs">0m</Text>
                              <Text className="text-gray-500 text-xs">8h</Text>
                            </View>
                          </View>
                        </View>

                        {/* Mood Selection */}
                        <View className="mb-6">
                          <Text className="text-[#212121] font-bold mb-3">
                            How did it make you feel?
                          </Text>
                          <View className="flex-row justify-between">
                            {MOOD_OPTIONS.map((mood) => (
                              <TouchableOpacity
                                key={mood.value}
                                onPress={() => {
                                  saveLog(app.name, { mood: mood.value });
                                  setTodayLogs((prev) => ({
                                    ...prev,
                                    [app.name]: {
                                      ...prev[app.name],
                                      mood: mood.value,
                                    },
                                  }));
                                  Haptics.impactAsync(
                                    Haptics.ImpactFeedbackStyle.Medium
                                  );
                                }}
                                className={`flex-1 mx-1 p-3 rounded-xl border-2 items-center ${log?.mood === mood.value
                                  ? "border-purple-500 bg-purple-50"
                                  : "border-gray-200 bg-white"
                                  }`}
                              >
                                <Ionicons
                                  name={mood.icon as any}
                                  size={24}
                                  color={
                                    log?.mood === mood.value
                                      ? mood.color
                                      : "#9ca3af"
                                  }
                                />
                                <Text
                                  className={`text-xs font-semibold mt-1 ${log?.mood === mood.value
                                    ? "text-[#212121]"
                                    : "text-gray-500"
                                    }`}
                                >
                                  {mood.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* Note */}
                        <View className="mb-6">
                          <Text className="text-[#212121] font-bold mb-3">
                            Add a note (optional)
                          </Text>
                          <TextInput
                            placeholder="e.g., Productive work session..."
                            value={log?.note || ""}
                            onChangeText={(text) => {
                              setTodayLogs((prev) => ({
                                ...prev,
                                [app.name]: {
                                  ...prev[app.name],
                                  note: text,
                                },
                              }));
                            }}
                            onBlur={() => {
                              const note = (log?.note || "").trim();
                              if (note !== (todayLogs[app.name]?.note || "").trim()) {
                                saveLog(app.name, { note });
                              }
                            }}
                            multiline
                            numberOfLines={3}
                            className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-[#212121]"
                            placeholderTextColor="#9ca3af"
                          />
                        </View>

                        {/* Category Tags */}
                        <View>
                          <Text className="text-[#212121] font-bold mb-3">
                            Category
                          </Text>
                          <View className="flex-row flex-wrap gap-2">
                            {TAGS.map((tag) => {
                              const isSelected = app.tag === tag;
                              return (
                                <TouchableOpacity
                                  key={tag}
                                  onPress={async () => {
                                    const appDoc = doc(
                                      db,
                                      "users",
                                      currentUser!.uid,
                                      "trackedApps",
                                      app.name
                                    );
                                    await updateDoc(appDoc, { tag });

                                    if (todayLogs[app.name]) {
                                      saveLog(app.name, { tag });
                                    }

                                    setTrackedApps((prev) =>
                                      prev.map((a) =>
                                        a.name === app.name ? { ...a, tag } : a
                                      )
                                    );
                                    Haptics.impactAsync(
                                      Haptics.ImpactFeedbackStyle.Light
                                    );
                                  }}
                                  className={`px-4 py-2 rounded-xl border-2 ${isSelected
                                    ? `${TAG_COLORS[tag]} border-gray-300`
                                    : "bg-white border-gray-200"
                                    }`}
                                >
                                  <Text
                                    className={`text-sm font-semibold ${isSelected
                                      ? TAG_TEXT_COLORS[tag]
                                      : "text-gray-600"
                                      }`}
                                  >
                                    {tag}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </Animated.View>
        </ScrollView>

        {/* Add App Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View className="flex-1 bg-[#212121]/50 justify-center items-center px-5">
            <View className="bg-white rounded-3xl p-6 w-full max-w-md">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-[#212121] text-2xl font-bold">
                  Add New App
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  className="p-2"
                >
                  <Ionicons name="close" size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Enter app name..."
                value={newAppName}
                onChangeText={setNewAppName}
                onSubmitEditing={handleAddApp}
                autoFocus
                className="bg-gray-50 border border-gray-200 px-4 py-4 rounded-xl text-[#212121] mb-4"
                placeholderTextColor="#9ca3af"
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 py-4 rounded-xl items-center"
                >
                  <Text className="font-bold text-gray-700">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddApp}
                  disabled={!newAppName.trim()}
                  className={`flex-1 py-4 rounded-xl items-center flex-row justify-center ${newAppName.trim() ? "bg-lime-400" : "bg-gray-300"
                    }`}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={newAppName.trim() ? "#212121" : "#9ca3af"}
                  />
                  <Text
                    className={`font-bold ml-2 ${newAppName.trim() ? "text-[#212121]" : "text-gray-500"
                      }`}
                  >
                    Add App
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
