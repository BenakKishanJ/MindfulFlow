import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsiveActions } from '../contexts/ResponsiveActionsContext';

interface AppBlockerProps {
  isVisible: boolean;
  onUnlock: () => void;
}

const AppBlocker: React.FC<AppBlockerProps> = ({ isVisible, onUnlock }) => {
  const { appBlockConfig } = useResponsiveActions();
  const [emergencyCode, setEmergencyCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showEmergencyInput, setShowEmergencyInput] = useState(false);

  useEffect(() => {
    if (isVisible && appBlockConfig?.blockDuration) {
      setTimeRemaining(appBlockConfig.blockDuration * 60); // Convert to seconds

      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            onUnlock(); // Auto-unlock when time is up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isVisible, appBlockConfig?.blockDuration, onUnlock]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEmergencyUnlock = () => {
    if (emergencyCode === appBlockConfig?.emergencyCode) {
      onUnlock();
    } else {
      Alert.alert('Invalid Code', 'The emergency code you entered is incorrect.');
      setEmergencyCode('');
    }
  };

  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 bg-black z-50 flex-1 justify-center items-center p-6">
      {/* Background overlay */}
      <View className="absolute inset-0 bg-black opacity-95" />

      {/* Content */}
      <View className="bg-white rounded-3xl p-8 w-full max-w-sm items-center shadow-2xl">
        {/* Lock icon */}
        <View className="bg-red-100 p-4 rounded-full mb-6">
          <Ionicons name="lock-closed" size={48} color="#ef4444" />
        </View>

        {/* Title */}
        <Text className="text-2xl font-ppmori-semibold text-gray-900 text-center mb-2">
          Break Time!
        </Text>

        {/* Description */}
        <Text className="text-gray-600 text-center mb-6 leading-5">
          You&apos;ve been using your device for too long. Time to take a well-deserved break for your eyes and mind.
        </Text>

        {/* Timer */}
        <View className="bg-gray-100 rounded-2xl p-4 mb-6 w-full items-center">
          <Text className="text-sm text-gray-600 mb-1">Time Remaining</Text>
          <Text className="text-3xl font-ppmori-semibold text-gray-900">
            {formatTime(timeRemaining)}
          </Text>
        </View>

        {/* Break suggestions */}
        <View className="bg-blue-50 rounded-2xl p-4 mb-6 w-full">
          <Text className="text-sm font-semibold text-blue-900 mb-2">
            While you wait, try:
          </Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <Ionicons name="eye-outline" size={16} color="#1e40af" />
              <Text className="text-sm text-blue-800 ml-2">20-20-20 rule</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="walk-outline" size={16} color="#1e40af" />
              <Text className="text-sm text-blue-800 ml-2">Stand up and stretch</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="water-outline" size={16} color="#1e40af" />
              <Text className="text-sm text-blue-800 ml-2">Drink some water</Text>
            </View>
          </View>
        </View>

        {/* Emergency access button */}
        {appBlockConfig?.allowEmergencyAccess && (
          <TouchableOpacity
            onPress={() => setShowEmergencyInput(!showEmergencyInput)}
            className="mb-4"
          >
            <Text className="text-sm text-gray-500 underline">
              Emergency Access
            </Text>
          </TouchableOpacity>
        )}

        {/* Emergency code input */}
        {showEmergencyInput && (
          <View className="w-full mb-4">
            <Text className="text-sm text-gray-600 mb-2 text-center">
              Enter emergency code:
            </Text>
            <TextInput
              value={emergencyCode}
              onChangeText={setEmergencyCode}
              placeholder="Enter code"
              secureTextEntry
              className="border border-gray-300 rounded-lg px-4 py-3 text-center"
              keyboardType="numeric"
            />
            <TouchableOpacity
              onPress={handleEmergencyUnlock}
              className="bg-red-500 rounded-lg py-3 mt-2"
            >
              <Text className="text-white text-center font-semibold">
                Unlock
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Motivational message */}
        <Text className="text-xs text-gray-500 text-center">
          Taking breaks helps maintain your eye health and productivity
        </Text>
      </View>
    </View>
  );
};

export default AppBlocker;