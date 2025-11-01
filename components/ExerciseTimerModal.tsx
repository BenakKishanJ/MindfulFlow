// components/ExerciseTimerModal.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Exercise } from "@/types/exercises";

interface ExerciseTimerModalProps {
  exercise: Exercise;
  onComplete: () => void;
  onClose: () => void;
}

const ExerciseTimerModal: React.FC<ExerciseTimerModalProps> = ({
  exercise,
  onComplete,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const timeElapsedRef = useRef(0);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const stepDuration = Math.floor(exercise.duration / exercise.instructions.length);
  const totalSteps = exercise.instructions.length;

  // Memoized functions to avoid dependency issues
  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    progressAnim.stopAnimation();
  }, [progressAnim]);

  const finishExercise = useCallback(() => {
    setIsCompleted(true);
    setIsRunning(false);
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      setTimeLeft(stepDuration);
      timeElapsedRef.current = 0;
      progressAnim.setValue(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      finishExercise();
    }
  }, [currentStep, totalSteps, stepDuration, progressAnim, finishExercise]);

  const startTimer = useCallback(() => {
    setIsRunning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: (stepDuration - timeElapsedRef.current) * 1000,
      useNativeDriver: false,
    }).start();
  }, [progressAnim, stepDuration]);

  const handleAppStateChange = useCallback(
    (nextState: AppStateStatus) => {
      if (appStateRef.current === "active" && nextState.match(/inactive|background/)) {
        if (isRunning) pauseTimer();
      }
      appStateRef.current = nextState;
    },
    [isRunning, pauseTimer]
  );

  // Reset on exercise change
  useEffect(() => {
    setTimeLeft(stepDuration);
    setCurrentStep(0);
    setIsRunning(false);
    setIsCompleted(false);
    timeElapsedRef.current = 0;
    progressAnim.setValue(0);
  }, [exercise, stepDuration, progressAnim]);

  // App State listener
  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const id = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Trigger next step
            setTimeout(() => nextStep(), 0);
            return 0;
          }
          timeElapsedRef.current += 1;
          return prev - 1;
        });
      }, 1000);
      intervalRef.current = id;

      return () => {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else if (isRunning && timeLeft === 0) {
      // Step completed
      pauseTimer();
    }
  }, [isRunning, timeLeft, nextStep, pauseTimer]);

  // Restart animation when resuming
  useEffect(() => {
    if (isRunning && stepDuration > 0) {
      const remainingTime = (stepDuration - timeElapsedRef.current) * 1000;
      const progress = timeElapsedRef.current / stepDuration;

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: remainingTime,
        useNativeDriver: false,
      }).start();
    }
  }, [isRunning, currentStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Completion screen
  if (isCompleted) {
    return (
      <SafeAreaView className="absolute inset-0 bg-white z-50 flex-1">
        <View className="flex-1 justify-center items-center p-6">
          <View className="items-center max-w-sm">
            <View className="bg-lime-400 w-24 h-24 rounded-full items-center justify-center mb-6 border-2 border-black">
              <Ionicons name="checkmark" size={48} color="black" />
            </View>
            <Text className="text-black text-3xl font-bold mb-2">Great Job!</Text>
            <Text className="text-gray-600 text-center mb-8">
              You completed &quot;{exercise.title}&quot;
            </Text>
            <TouchableOpacity
              onPress={onComplete}
              className="bg-lime-400 py-4 px-8 border-2 border-lime-400"
            >
              <Text className="text-black font-bold">Back to Exercises</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="absolute inset-0 bg-white z-50 flex-1">
      <View className="flex-1 p-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-black text-2xl font-bold flex-1 pr-4">
            {exercise.title}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-2"
          >
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View className="mb-6">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-500">
              Step {currentStep + 1} of {totalSteps}
            </Text>
            <Text className="text-xs text-gray-500">{timeLeft}s</Text>
          </View>
          <View className="h-2 bg-gray-300 rounded-full overflow-hidden">
            <Animated.View
              className="h-full bg-lime-400"
              style={{
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          </View>
        </View>

        {/* Current Step */}
        <View className="bg-gray-50 border border-gray-300 p-6 mb-6 rounded-lg">
          <Text className="text-black text-lg font-bold mb-2">
            Step {currentStep + 1}
          </Text>
          <Text className="text-gray-700 text-base">
            {exercise.instructions[currentStep]}
          </Text>
        </View>

        {/* Controls */}
        <View className="flex-row justify-center gap-4">
          {!isRunning ? (
            <TouchableOpacity
              onPress={startTimer}
              className="bg-lime-400 py-4 px-8 border-2 border-lime-400 rounded"
            >
              <Text className="text-black font-bold">Start</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={pauseTimer}
              className="bg-white py-4 px-8 border-2 border-black rounded"
            >
              <Text className="text-black font-bold">Pause</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ExerciseTimerModal;
