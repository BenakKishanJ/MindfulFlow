import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface TwentyTwentyTimerProps {
  isVisible: boolean;
  onComplete: () => void;
  onClose: () => void;
}

const TwentyTwentyTimer: React.FC<TwentyTwentyTimerProps> = ({
  isVisible,
  onComplete,
  onClose
}) => {
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'looking' | 'completed'>('ready');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isVisible && !isActive) {
      setTimeRemaining(20);
      setPhase('ready');
    }
  }, [isVisible]);

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  const handleTimerComplete = async () => {
    setIsActive(false);
    setPhase('completed');

    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show completion alert
    Alert.alert(
      'Great job!',
      'You&apos;ve completed the 20-20-20 rule. Your eyes thank you!',
      [
        {
          text: 'Do it again',
          onPress: resetTimer,
        },
        {
          text: 'Done',
          onPress: () => {
            onComplete();
            onClose();
          },
        },
      ]
    );
  };

  const startTimer = async () => {
    setIsActive(true);
    setPhase('looking');

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const resetTimer = () => {
    setTimeRemaining(20);
    setIsActive(false);
    setPhase('ready');
  };

  const formatTime = (seconds: number): string => {
    return seconds.toString().padStart(2, '0');
  };

  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 bg-black/50 z-50 flex-1 justify-center items-center p-6">
      <View className="bg-white rounded-3xl p-8 w-full max-w-sm items-center shadow-2xl">
        {/* Header */}
        <View className="items-center mb-6">
          <View className="bg-blue-100 p-4 rounded-full mb-4">
            <Ionicons name="eye-outline" size={32} color="#3b82f6" />
          </View>
          <Text className="text-2xl font-ppmori-semibold text-gray-900 mb-2">
            20-20-20 Rule
          </Text>
          <Text className="text-gray-600 text-center leading-5">
            Look at something 20 feet away for 20 seconds every 20 minutes
          </Text>
        </View>

        {/* Timer Display */}
        <View className="mb-8">
          {phase === 'ready' && (
            <View className="items-center">
              <Text className="text-6xl font-ppmori-semibold text-gray-900 mb-2">20</Text>
              <Text className="text-gray-600">seconds</Text>
            </View>
          )}

          {phase === 'looking' && (
            <View className="items-center">
              <Text className="text-6xl font-ppmori-semibold text-blue-600 mb-2">
                {formatTime(timeRemaining)}
              </Text>
              <Text className="text-blue-600 font-medium">Focus on distance</Text>
              <Text className="text-gray-500 text-sm mt-1">Don&apos;t blink if possible</Text>
            </View>
          )}

          {phase === 'completed' && (
            <View className="items-center">
              <View className="bg-green-100 p-4 rounded-full mb-4">
                <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              </View>
              <Text className="text-xl font-ppmori-semibold text-green-600 mb-2">
                Completed!
              </Text>
              <Text className="text-gray-600 text-center">
                Your eyes are now refreshed
              </Text>
            </View>
          )}
        </View>

        {/* Instructions */}
        {phase === 'ready' && (
          <View className="bg-blue-50 rounded-2xl p-4 mb-6 w-full">
            <Text className="text-sm font-semibold text-blue-900 mb-2">
              How to do it:
            </Text>
            <View className="space-y-1">
              <Text className="text-sm text-blue-800">• Find an object 20 feet away</Text>
              <Text className="text-sm text-blue-800">• Focus on it without blinking</Text>
              <Text className="text-sm text-blue-800">• Relax and breathe normally</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="w-full space-y-3">
          {phase === 'ready' && (
            <TouchableOpacity
              onPress={startTimer}
              className="bg-blue-600 rounded-2xl py-4 items-center"
            >
              <Text className="text-white text-lg font-semibold">
                Start 20-Second Timer
              </Text>
            </TouchableOpacity>
          )}

          {phase === 'looking' && (
            <TouchableOpacity
              onPress={resetTimer}
              className="bg-gray-200 rounded-2xl py-4 items-center"
            >
              <Text className="text-gray-700 text-lg font-semibold">
                Cancel Timer
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onClose}
            className="bg-gray-100 rounded-2xl py-3 items-center"
          >
            <Text className="text-gray-600 text-base">
              {phase === 'completed' ? 'Close' : 'Maybe Later'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress indicator */}
        {phase === 'looking' && (
          <View className="mt-6 w-full">
            <View className="bg-gray-200 h-2 rounded-full overflow-hidden">
              <View
                className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                style={{ width: `${((20 - timeRemaining) / 20) * 100}%` }}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default TwentyTwentyTimer;