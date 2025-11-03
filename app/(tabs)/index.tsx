// app/(tabs)/home.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { router } from "expo-router";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

interface DayActivity {
  date: Date;
  hasActivity: boolean;
}

export default function Home() {
  const { currentUser, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [monthDays, setMonthDays] = useState<DayActivity[]>([]);
  const [stats, setStats] = useState({
    streak: 0,
    totalExercises: 0,
    screenTime: "0h 0m",
  });
  const [dataLoading, setDataLoading] = useState(true);

  const todayKey = format(new Date(), "yyyy-MM-dd");

  // === LOAD DATA (useCallback BEFORE any early return) ===
  const loadData = useCallback(async () => {
    if (!currentUser?.uid) return;

    setDataLoading(true);
    try {
      const uid = currentUser.uid;

      // Load Tasks
      const tasksRef = collection(db, "users", uid, "tasks");
      const tasksSnap = await getDocs(tasksRef);
      const loadedTasks: Task[] = tasksSnap.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        completed: d.data().completed,
        createdAt: d.data().createdAt?.toDate() || new Date(),
      }));
      setTasks(loadedTasks.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)));

      // Load Calendar Activities
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

      const activities: DayActivity[] = await Promise.all(
        days.map(async (day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const progressRef = doc(db, "users", uid, "dailyProgress", dayKey);
          const logsRef = collection(db, "users", uid, "logs", dayKey, "apps");

          const [progressSnap, logsSnap] = await Promise.all([
            getDoc(progressRef),
            getDocs(logsRef),
          ]);
          const hasExercise = progressSnap.exists() && (progressSnap.data()?.totalCompletions || 0) > 0;
          const hasScreenTime = logsSnap.size > 0;

          return { date: day, hasActivity: hasExercise || hasScreenTime };
        })
      );
      setMonthDays(activities);

      // Load Stats
      let streakCount = 0;
      let checkDate = new Date();
      while (streakCount < 30) {
        const dayKey = format(checkDate, "yyyy-MM-dd");
        const progressSnap = await getDoc(doc(db, "users", uid, "dailyProgress", dayKey));
        if (!progressSnap.exists() || (progressSnap.data()?.totalCompletions || 0) === 0) break;
        streakCount++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      }

      const todayProgressSnap = await getDoc(doc(db, "users", uid, "dailyProgress", todayKey));
      const totalExercises = todayProgressSnap.data()?.totalCompletions || 0;

      const logsRef = collection(db, "users", uid, "logs", todayKey, "apps");
      const logsSnap = await getDocs(logsRef);
      const totalScreenTime = logsSnap.docs.reduce((sum, d) => sum + (d.data().durationMinutes || 0), 0);
      const screenHours = Math.floor(totalScreenTime / 60);
      const screenMins = totalScreenTime % 60;
      const screenTimeStr = `${screenHours}h ${screenMins}m`;

      setStats({ streak: streakCount, totalExercises, screenTime: screenTimeStr });
    } catch (err) {
      console.error("Load error:", err);
      Alert.alert("Error", "Failed to load data.");
    } finally {
      setDataLoading(false);
    }
  }, [currentUser?.uid, selectedDate, todayKey]);

  // === useEffect (AFTER useCallback, BEFORE any early return) ===
  useEffect(() => {
    if (currentUser?.uid) {
      loadData();
    }
  }, [loadData, currentUser?.uid]);

  // === EARLY RETURNS (AFTER ALL HOOKS) ===
  if (authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#2D2D2D] justify-center items-center">
        <ActivityIndicator size="large" color="#A3E635" />
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView className="flex-1 bg-[#2D2D2D] justify-center items-center px-6">
        <Ionicons name="flower" size={64} color="#A3E635" style={{ marginBottom: 20 }} />
        <Text className="text-white font-bold text-2xl text-center mb-2">
          Welcome to MindfulFlow
        </Text>
        <Text className="text-gray-400 text-center mb-6">
          Sign in to access your wellness hub
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
          className="bg-lime-400 px-8 py-4 rounded-full"
        >
          <Text className="text-[#2D2D2D] font-bold text-base">Get Started</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const name = currentUser.displayName || "User";
  const avatar =
    currentUser.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=BFFF00&color=2D2D2D&size=128&bold=true`;

  // === ADD TASK ===
  const addTask = async () => {
    if (!newTask.trim() || !currentUser.uid) return;

    try {
      const tasksRef = collection(db, "users", currentUser.uid, "tasks");
      const newDoc = await addDoc(tasksRef, {
        title: newTask.trim(),
        completed: false,
        createdAt: serverTimestamp(),
      });

      setTasks((prev) => [
        ...prev,
        {
          id: newDoc.id,
          title: newTask.trim(),
          completed: false,
          createdAt: new Date(),
        },
      ]);
      setNewTask("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert("Error", "Failed to add task.");
    }
  };

  // === TOGGLE TASK ===
  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!currentUser.uid) return;

    try {
      const taskRef = doc(db, "users", currentUser.uid, "tasks", taskId);
      await updateDoc(taskRef, { completed: !completed });

      setTasks((prev) =>
        prev
          .map((t) => (t.id === taskId ? { ...t, completed: !completed } : t))
          .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      Alert.alert("Error", "Failed to update task.");
    }
  };

  // === CALENDAR HELPERS ===
  const getWeekDays = () => ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  const getEmptyCells = () => {
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
    return Array(firstDay).fill(null);
  };

  // === RENDER ===
  if (dataLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#2D2D2D] justify-center items-center">
        <ActivityIndicator size="large" color="#A3E635" />
      </SafeAreaView>
    );
  }

  return (
    // <SafeAreaView className="flex-1 bg-[#2D2D2D]">
    <SafeAreaView className="flex-1 bg-[#212121]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section - Dark Background */}
        <View className="bg-[#212121] px-6 pt-4 pb-6">
          {/* Top Bar */}
          <View className="flex-row justify-between items-center mb-16">
            <View className="flex-row items-center">
              <Ionicons name="flower" size={28} color="#A3E635" />
              <Text className="text-white text-xl font-bold ml-2">MindfulFlow</Text>
            </View>
            <View className="flex-row items-center gap-4">
              {/* <TouchableOpacity> */}
              {/*   <Ionicons name="search" size={24} color="white" /> */}
              {/* </TouchableOpacity> */}
              <TouchableOpacity onPress={() => router.push("/(pages)/profile")}>
                {/* <Image */}
                {/*   source={{ uri: avatar }} */}
                {/*   className="w-10 h-10 rounded-full" */}
                {/*   style={{ borderWidth: 2, borderColor: '#A3E635' }} */}
                {/* /> */}
                <View className="w-10 h-10 rounded-full bg-lime-400 items-center justify-center">
                  <Ionicons name="person" size={24} color="#212121" />
                </View>
              </TouchableOpacity>

            </View>
          </View>

          {/* Greeting */}
          <View className="mb-6">
            <Text className="text-white text-4xl font-bold mb-2">
              Welcome back, {name}!
            </Text>
            <Text className="text-gray-400 text-xl">
              Your mindful day at a glance
            </Text>
          </View>

          {/* Date Info */}
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={20} color="#A3E635" />
            <Text className="text-white text-base font-medium ml-2">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </Text>
          </View>
        </View>

        {/* Calendar Section - Beige Background */}
        <View className="bg-lime-100 rounded-t-3xl px-6 pt-10 pb-8 z-10">
          {/* Month Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-[#212121] text-3xl font-bold">
                {format(selectedDate, "MMM").toUpperCase()}
              </Text>
              <Text className="text-gray-500 text-sm">
                {format(selectedDate, "yyyy")}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="p-2 bg-white rounded-full"
                onPress={() => {
                  const prevMonth = new Date(selectedDate);
                  prevMonth.setMonth(prevMonth.getMonth() - 1);
                  setSelectedDate(prevMonth);
                }}
              >
                <Ionicons name="chevron-back" size={20} color="#212121" />
              </TouchableOpacity>
              <TouchableOpacity
                className="p-2 bg-white rounded-full"
                onPress={() => {
                  const nextMonth = new Date(selectedDate);
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setSelectedDate(nextMonth);
                }}
              >
                <Ionicons name="chevron-forward" size={20} color="#212121" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Week Days */}
          <View className="flex-row justify-around mb-3">
            {getWeekDays().map((day) => (
              <Text key={day} className="text-gray-500 text-xs font-semibold w-[14.28%] text-center">
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="flex-row flex-wrap">
            {getEmptyCells().map((_, i) => (
              <View key={`empty-${i}`} className="w-[14.28%] aspect-square p-1" />
            ))}
            {monthDays.map((day) => (
              <TouchableOpacity
                key={day.date.toString()}
                className="w-[14.28%] aspect-square p-1 items-center justify-center"
                onPress={() => setSelectedDate(day.date)}
              >
                {day.hasActivity ? (
                  <View className="bg-lime-400 rounded-full w-10 h-10 items-center justify-center shadow-sm">
                    <Text className="text-[#2D2D2D] font-bold text-base">
                      {format(day.date, "d")}
                    </Text>
                  </View>
                ) : isToday(day.date) ? (
                  <View className="border-2 border-[#6B2D8C] rounded-full w-10 h-10 items-center justify-center">
                    <Text className="text-[#6B2D8C] font-bold text-base">
                      {format(day.date, "d")}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-gray-600 text-base">
                    {format(day.date, "d")}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Tasks - White Background */}
        <View className="bg-white px-6 py-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[#212121] text-2xl font-bold">Today&apos;s Tasks</Text>
            <View className="bg-lime-400 px-3 py-1 rounded-full">
              <Text className="text-[#2D2D2D] font-bold text-sm">
                {tasks.filter(t => !t.completed).length} pending
              </Text>
            </View>
          </View>

          {tasks.length === 0 ? (
            <View className="py-8 items-center">
              <Ionicons name="checkmark-circle-outline" size={48} color="#A3E635" />
              <Text className="text-gray-500 text-base mt-3">No tasks yet. Add one below!</Text>
            </View>
          ) : (
            tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                className="bg-white rounded-2xl mb-3 border-l-4 overflow-hidden"
                style={{
                  borderLeftColor: task.completed ? '#9CA3AF' : '#A3E635',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={() => toggleTask(task.id, task.completed)}
              >
                <View className="flex-row items-center p-4">
                  <View className="mr-3">
                    <Ionicons
                      name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                      size={28}
                      color={task.completed ? "#9CA3AF" : "#A3E635"}
                    />
                  </View>
                  <Text
                    className={`flex-1 text-base font-medium ${task.completed ? "text-gray-400 line-through" : "text-[#2D2D2D]"
                      }`}
                  >
                    {task.title}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={task.completed ? "#9CA3AF" : "#6B2D8C"}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* Add Task Input */}
          <KeyboardAvoidingView behavior="padding">
            <View className="flex-row items-center mt-4">
              <TextInput
                className="flex-1 bg-purple-100 border-purple-400 border-2 px-4 py-4 rounded-2xl text-[#2D2D2D] text-base"
                placeholder="Add a new task..."
                placeholderTextColor="#9CA3AF"
                value={newTask}
                onChangeText={setNewTask}
                onSubmitEditing={addTask}
              />
              <TouchableOpacity
                onPress={addTask}
                className="ml-3 bg-[#6B2D8C] p-4 rounded-2xl"
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* Stats Section - Beige Background */}
        <View className="bg-[#212121] px-6 py-8">
          <Text className="text-white text-2xl font-bold mb-4">Your Progress</Text>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-lime-100 rounded-2xl p-4 items-center shadow-sm">
              <Ionicons name="flame" size={32} color="#A3E635" />
              <Text className="text-[#2D2D2D] text-2xl font-bold mt-2">
                {stats.streak}
              </Text>
              <Text className="text-gray-600 text-sm mt-1">Day Streak</Text>
            </View>
            <View className="flex-1 bg-purple-300 rounded-2xl p-4 items-center shadow-sm">
              <Ionicons name="leaf" size={32} color="#6B2D8C" />
              <Text className="text-[#2D2D2D] text-2xl font-bold mt-2">
                {stats.totalExercises}
              </Text>
              <Text className="text-gray-600 text-sm mt-1">Exercises</Text>
            </View>
          </View>
          <View className="mt-3 bg-white rounded-2xl p-4 items-center shadow-sm">
            <Ionicons name="time" size={32} color="#A3E635" />
            <Text className="text-[#2D2D2D] text-2xl font-bold mt-2">
              {stats.screenTime}
            </Text>
            <Text className="text-gray-600 text-sm mt-1">Screen Time Today</Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
