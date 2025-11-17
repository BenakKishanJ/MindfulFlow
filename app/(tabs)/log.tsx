// app/(tabs)/log.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  View as RNView,
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
  PanResponder,
  Dimensions,
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
import TimePicker from "@/components/TimePicker"; // Updated import

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
  Social: "bg-purple-100 border-purple-300",
  Games: "bg-red-100 border-red-300",
  Work: "bg-blue-100 border-blue-300",
  Study: "bg-indigo-100 border-indigo-300",
  Essential: "bg-gray-100 border-gray-300",
  Productive: "bg-lime-100 border-lime-300",
  Entertainment: "bg-pink-100 border-pink-300",
  Other: "bg-zinc-100 border-zinc-300",
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedAppForTime, setSelectedAppForTime] = useState<string | null>(null);

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

  // Update Duration with TimePicker
  const handleTimePickerConfirm = (hours: number, minutes: number) => {
    if (!selectedAppForTime) return;

    const totalMinutes = Math.min(Math.max(hours * 60 + minutes, 0), 1440);
    saveLog(selectedAppForTime, { durationMinutes: totalMinutes });

    setTodayLogs((prev) => ({
      ...prev,
      [selectedAppForTime]: {
        ...(prev[selectedAppForTime] || {
          appName: selectedAppForTime,
          durationMinutes: 0,
          mood: 3,
          note: "",
          tag: trackedApps.find(a => a.name === selectedAppForTime)?.tag || "Other",
        }),
        durationMinutes: totalMinutes,
      },
    }));

    setShowTimePicker(false);
    setSelectedAppForTime(null);
  };

  const handleTimePickerCancel = () => {
    setShowTimePicker(false);
    setSelectedAppForTime(null);
  };

  const openTimePicker = (appName: string) => {
    const log = todayLogs[appName];
    const currentDuration = log?.durationMinutes || 0;
    const currentHours = Math.floor(currentDuration / 60);
    const currentMinutes = currentDuration % 60;

    setSelectedAppForTime(appName);
    setShowTimePicker(true);
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
      <SafeAreaView className="flex-1 bg-lime-100 justify-center items-center">
        <ActivityIndicator size="large" color="#A3E635" />
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
    <SafeAreaView className="flex-1 bg-lime-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }} className="px-6 pt-8">
            {/* Header */}
            <Text className="text-[#1A1A1A] text-3xl font-bold mb-2">
              {greeting}!
            </Text>
            <Text className="text-gray-600 text-base mb-8">
              Track your digital wellness in seconds
            </Text>

            {/* Stats Cards */}
            <View className="flex-row gap-3 mb-8">
              <View className="flex-1 bg-white rounded-2xl p-5 items-center shadow-sm border border-gray-200">
                <View className="w-14 h-14 bg-[#A3E635]/10 rounded-2xl items-center justify-center mb-3">
                  <Ionicons name="flame" size={32} color="#A3E635" />
                </View>
                <Text className="text-[#1A1A1A] text-3xl font-bold">{streak}</Text>
                <Text className="text-gray-600 text-sm mt-1 uppercase tracking-wider">
                  Streak
                </Text>
              </View>
              <View className="flex-1 bg-white rounded-2xl p-5 items-center shadow-sm border border-gray-200">
                <View className="w-14 h-14 bg-[#A3E635]/10 rounded-2xl items-center justify-center mb-3">
                  <Ionicons name="time" size={32} color="#A3E635" />
                </View>
                <Text className="text-[#1A1A1A] text-3xl font-bold">
                  {formatDuration(totalTime)}
                </Text>
                <Text className="text-gray-600 text-sm mt-1 uppercase tracking-wider">
                  Total Time
                </Text>
              </View>
            </View>

            {/* Search & Sort */}
            <View className="mb-6">
              <View className="flex-row items-center bg-white rounded-2xl p-1 shadow-sm border border-gray-200 mb-4">
                <Ionicons name="search" size={20} color="#9CA3AF" className="ml-4 mr-2" />
                <TextInput
                  className="flex-1 py-3 text-base text-[#1A1A1A] font-medium"
                  placeholder="Search apps..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setSortBy("usage")}
                  className={`flex-1 bg-white rounded-2xl py-3 items-center shadow-sm border ${sortBy === "usage" ? 'border-[#A3E635]' : 'border-gray-200'}`}
                >
                  <Text className={`text-base font-medium ${sortBy === "usage" ? 'text-[#1A1A1A]' : 'text-gray-600'}`}>
                    By Usage
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSortBy("name")}
                  className={`flex-1 bg-white rounded-2xl py-3 items-center shadow-sm border ${sortBy === "name" ? 'border-[#A3E635]' : 'border-gray-200'}`}
                >
                  <Text className={`text-base font-medium ${sortBy === "name" ? 'text-[#1A1A1A]' : 'text-gray-600'}`}>
                    By Name
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowAddModal(true)}
                  className="flex-1 bg-[#A3E635] rounded-2xl py-3 items-center shadow-sm"
                >
                  <Text className="text-[#1A1A1A] text-base font-medium">
                    Add App
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* App List */}
            {filteredAndSortedApps.map((app) => {
              const log = todayLogs[app.name];
              const isExpanded = expandedApp === app.name;
              const currentHours = Math.floor((log?.durationMinutes || 0) / 60);
              const currentMinutes = (log?.durationMinutes || 0) % 60;

              return (
                <View key={app.name} className="mb-4">
                  <TouchableOpacity
                    onPress={() => setExpandedApp(isExpanded ? null : app.name)}
                    className="bg-white rounded-2xl p-5 flex-row items-center justify-between shadow-sm border border-gray-200"
                  >
                    <View>
                      <Text className="text-[#1A1A1A] text-lg font-bold">
                        {app.name}
                      </Text>
                      <Text className="text-gray-600 text-sm mt-1">
                        {formatDuration(log?.durationMinutes || 0)}
                      </Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={24}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View className="bg-white rounded-b-2xl p-5 border-t border-gray-200">
                      {/* Duration Picker */}
                      <View className="mb-6">
                        <Text className="text-[#1A1A1A] font-bold mb-3">
                          Time Spent
                        </Text>
                        <TouchableOpacity
                          onPress={() => openTimePicker(app.name)}
                          className="bg-white border border-gray-200 rounded-2xl p-4 flex-row items-center justify-between"
                        >
                          <View>
                            <Text className="text-[#1A1A1A] text-lg font-medium">
                              {formatDuration(log?.durationMinutes || 0)}
                            </Text>
                            <Text className="text-gray-600 text-sm mt-1">
                              Tap to set duration
                            </Text>
                          </View>
                          <Ionicons name="time-outline" size={24} color="#A3E635" />
                        </TouchableOpacity>
                      </View>

                      {/* Mood Selection */}
                      <View className="mb-6">
                        <Text className="text-[#1A1A1A] font-bold mb-3">
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
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              }}
                              className={`flex-1 mx-1 p-3 rounded-xl items-center shadow-sm border border-gray-200 ${log?.mood === mood.value ? "bg-[#A3E635]/10" : "bg-white"}`}
                            >
                              <Ionicons
                                name={mood.icon as any}
                                size={24}
                                color={log?.mood === mood.value ? mood.color : "#9CA3AF"}
                              />
                              <Text className={`text-xs font-medium mt-1 ${log?.mood === mood.value ? "text-[#1A1A1A]" : "text-gray-600"}`}>
                                {mood.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Note */}
                      <View className="mb-6">
                        <Text className="text-[#1A1A1A] font-bold mb-3">
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
                          className="bg-white border border-gray-200 px-4 py-3 rounded-2xl text-[#1A1A1A]"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>

                      {/* Category Tags */}
                      <View>
                        <Text className="text-[#1A1A1A] font-bold mb-3">
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
                                className={`px-4 py-2 rounded-xl border ${isSelected ? `${TAG_COLORS[tag]}` : "bg-white border-gray-200"}`}
                              >
                                <Text
                                  className={`text-sm font-medium ${isSelected ? TAG_TEXT_COLORS[tag] : "text-gray-600"}`}
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
            })}
          </Animated.View>
        </ScrollView>

        {/* Time Picker Modal */}
        <Modal
          visible={showTimePicker}
          transparent
          animationType="fade"
          onRequestClose={handleTimePickerCancel}
        >
          {selectedAppForTime && (
            <TimePicker
              initialHours={Math.floor((todayLogs[selectedAppForTime]?.durationMinutes || 0) / 60)}
              initialMinutes={(todayLogs[selectedAppForTime]?.durationMinutes || 0) % 60}
              onConfirm={handleTimePickerConfirm}
              onCancel={handleTimePickerCancel}
            />
          )}
        </Modal>

        {/* Add App Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View className="flex-1 bg-[#1A1A1A]/50 justify-center items-center px-6">
            <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-[#1A1A1A] text-xl font-bold">
                  Add New App
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                >
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Enter app name..."
                value={newAppName}
                onChangeText={setNewAppName}
                onSubmitEditing={handleAddApp}
                autoFocus
                className="bg-white border border-gray-200 px-4 py-3 rounded-2xl text-[#1A1A1A] mb-6"
                placeholderTextColor="#9CA3AF"
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 py-3 rounded-2xl items-center shadow-sm"
                >
                  <Text className="text-gray-700 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddApp}
                  disabled={!newAppName.trim()}
                  className={`flex-1 py-3 rounded-2xl items-center shadow-sm flex-row justify-center ${newAppName.trim() ? "bg-[#A3E635]" : "bg-gray-300"}`}
                >
                  <Ionicons
                    name="add-circle"
                    size={20}
                    color={newAppName.trim() ? "#1A1A1A" : "#9CA3AF"}
                  />
                  <Text
                    className={`font-medium ml-2 ${newAppName.trim() ? "text-[#1A1A1A]" : "text-gray-500"}`}
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
