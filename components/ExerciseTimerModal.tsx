// components/ExerciseTimerModal.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  Animated,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Exercise } from "@/types/exercises";

interface ExerciseTimerModalProps {
  exercise: Exercise;
  onComplete: () => void;
  onClose: () => void;
}

type TimerPhase = "step" | "transition";

const ExerciseTimerModal: React.FC<ExerciseTimerModalProps> = ({
  exercise,
  onComplete,
  onClose,
}) => {
  // -------------------------------------------------------------------------
  // ALL HOOKS AT TOP
  // -------------------------------------------------------------------------
  const [phase, setPhase] = useState<TimerPhase>("step");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const totalDurationRef = useRef(0);
  const elapsedRef = useRef(0);

  const hasNoSteps = useMemo(
    () => !exercise?.steps || exercise.steps.length === 0,
    [exercise?.steps]
  );

  // -------------------------------------------------------------------------
  // Safe Image
  // -------------------------------------------------------------------------
  const getCurrentImage = useCallback((): any => {
    if (!exercise.steps?.length || currentStepIndex < 0) {
      return require("@/assets/images/exercises/placeholder.png");
    }
    for (let i = currentStepIndex; i >= 0; i--) {
      if (exercise.steps[i]?.image) return exercise.steps[i].image;
    }
    return require("@/assets/images/exercises/placeholder.png");
  }, [exercise.steps, currentStepIndex]);

  // -------------------------------------------------------------------------
  // Haptics
  // -------------------------------------------------------------------------
  const hapticStepEnd = useCallback(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), []);
  const hapticTransitionStart = useCallback(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), []);
  const hapticStepStart = useCallback(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), []);

  // -------------------------------------------------------------------------
  // Timer Core
  // -------------------------------------------------------------------------
  const startTimer = useCallback(
    (duration: number, onEnd: () => void) => {
      totalDurationRef.current = duration;
      elapsedRef.current = 0;
      setTimeLeft(duration);
      setIsRunning(true);

      // Reset animation
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration * 1000,
        useNativeDriver: false,
      }).start();

      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedSec = Math.floor((now - startTime) / 1000);
        const remaining = duration - elapsedSec;

        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setTimeLeft(0);
          onEnd();
        } else {
          setTimeLeft(remaining);
          elapsedRef.current = elapsedSec;
        }
      }, 100);
    },
    [progressAnim]
  );

  const pauseTimer = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    progressAnim.stopAnimation();
  }, [isRunning, progressAnim]);

  const resumeTimer = useCallback(
    (onEnd: () => void) => {
      const remaining = totalDurationRef.current - elapsedRef.current;
      if (remaining <= 0) {
        onEnd();
        return;
      }
      startTimer(remaining, onEnd);
    },
    [startTimer]
  );

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    progressAnim.stopAnimation();
  }, [progressAnim]);

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------
  const finishExercise = useCallback(() => {
    stopTimer();
    setIsCompleted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [stopTimer]);

  const goToNextStep = useCallback(() => {
    if (currentStepIndex >= exercise.steps.length - 1) {
      finishExercise();
    } else {
      setPhase("transition");
      hapticTransitionStart();
      startTimer(5, () => {
        setCurrentStepIndex((prev) => prev + 1);
        setPhase("step");
        hapticStepStart();
      });
    }
  }, [currentStepIndex, exercise.steps.length, finishExercise, hapticTransitionStart, hapticStepStart, startTimer]);

  // -------------------------------------------------------------------------
  // Auto-Start Step
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (phase === "step" && !isRunning && !isCompleted && exercise.steps[currentStepIndex]) {
      const step = exercise.steps[currentStepIndex];
      startTimer(step.duration, () => {
        hapticStepEnd();
        goToNextStep();
      });
    }
  }, [phase, currentStepIndex, exercise.steps, isRunning, isCompleted, startTimer, goToNextStep, hapticStepEnd]);

  // No Steps Guard
  useEffect(() => {
    if (hasNoSteps) {
      onComplete();
    }
  }, [hasNoSteps, onComplete]);

  // App State
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current === "active" && nextState.match(/inactive|background/)) {
        if (isRunning) pauseTimer();
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [isRunning, pauseTimer]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Close Handler
  // -------------------------------------------------------------------------
  const handleClose = useCallback(() => {
    stopTimer();
    onClose();
  }, [stopTimer, onClose]);

  // -------------------------------------------------------------------------
  // Early Return
  // -------------------------------------------------------------------------
  if (hasNoSteps) return null;

  const currentStep = exercise.steps[currentStepIndex];
  const isLastStep = currentStepIndex >= exercise.steps.length - 1;
  const isTransition = phase === "transition";
  const nextStep = isTransition && currentStepIndex + 1 < exercise.steps.length ? exercise.steps[currentStepIndex + 1] : null;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <View className="absolute inset-0 bg-white z-50 flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between p-5 border-b border-gray-200">
        <TouchableOpacity onPress={handleClose} hitSlop={10} className="p-2">
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text className="text-black text-lg font-bold flex-1 text-center mr-10">
          {exercise.title}
        </Text>
        <View className="w-10" />
      </View>

      {/* Image */}
      <View className="h-64 bg-gray-50 items-center justify-center overflow-hidden">
        <Image source={getCurrentImage()} className="w-full h-full" resizeMode="cover" />
      </View>

      {/* Progress */}
      <View className="px-6 pt-6">
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-gray-500">
            {isTransition
              ? "Transition"
              : `Step ${currentStepIndex + 1} of ${exercise.steps.length}`}
          </Text>
          <Text className="text-sm text-gray-500">{timeLeft}s</Text>
        </View>
        <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <Animated.View
            className="h-full rounded-full"
            style={{
              backgroundColor: isTransition ? "#9333EA" : "#A3E635", // Purple or Lime
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </View>
      </View>

      {/* Step Content */}
      <View className="flex-1 px-6 pt-6 pb-8">
        <View className="bg-gray-50 border border-gray-300 p-6 rounded-2xl flex-1 justify-center">
          <Text className="text-black text-xl font-bold mb-3 text-center">
            {isTransition && nextStep ? nextStep.title : currentStep.title}
          </Text>
          {isTransition && (
            <Text className="text-purple-600 text-center text-lg font-medium">
              Get ready...
            </Text>
          )}
        </View>
      </View>

      {/* Pause / Resume */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={() => {
            if (isRunning) {
              pauseTimer();
            } else if (timeLeft > 0) {
              const onEnd = isTransition
                ? () => {
                  setCurrentStepIndex((prev) => prev + 1);
                  setPhase("step");
                  hapticStepStart();
                }
                : () => {
                  hapticStepEnd();
                  goToNextStep();
                };
              resumeTimer(onEnd);
            }
          }}
          className="bg-white py-4 rounded-full border-3 border-black shadow-md"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text className="text-black font-bold text-center text-lg">
            {isRunning ? "Pause" : timeLeft > 0 ? "Resume" : "Done"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Completion Overlay */}
      {isCompleted && (
        <View className="absolute inset-0 bg-white/95 z-10 flex-1 justify-center items-center p-6">
          <View className="items-center max-w-sm">
            <View className="bg-lime-400 w-28 h-28 rounded-full items-center justify-center mb-6 border-3 border-black">
              <Ionicons name="checkmark" size={56} color="black" />
            </View>
            <Text className="text-black text-3xl font-bold mb-2">Great Job!</Text>
            <Text className="text-gray-600 text-center mb-8 text-lg">
              You completed &quot;{exercise.title}&quot;
            </Text>
            <TouchableOpacity
              onPress={onComplete}
              className="bg-lime-400 py-4 px-10 rounded-full border-3 border-black shadow-lg"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              <Text className="text-black font-bold text-lg">Back to Exercises</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default ExerciseTimerModal;
