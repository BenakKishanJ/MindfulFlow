import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsiveActions } from '../contexts/ResponsiveActionsContext';

interface EyeCareModeProps {
  isActive: boolean;
  onToggle: () => void;
}

const EyeCareMode: React.FC<EyeCareModeProps> = ({ isActive, onToggle }) => {
  const { eyeCareConfig } = useResponsiveActions();

  useEffect(() => {
    if (isActive && eyeCareConfig) {
      // Apply eye care settings
      applyEyeCareSettings();
    } else {
      // Remove eye care settings
      removeEyeCareSettings();
    }
  }, [isActive, eyeCareConfig]);

  const applyEyeCareSettings = () => {
    // In a real implementation, this would:
    // 1. Apply blue light filter overlay
    // 2. Adjust screen brightness
    // 3. Modify color temperature
    console.log('Applying eye care settings:', eyeCareConfig);
  };

  const removeEyeCareSettings = () => {
    // Remove eye care settings
    console.log('Removing eye care settings');
  };

  if (!isActive) return null;

  return (
    <View className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-blue-900/20 to-transparent">
      {/* Status indicator */}
      <View className="flex-row items-center justify-center py-2 px-4">
        <View className="bg-blue-600 rounded-full px-3 py-1 flex-row items-center">
          <Ionicons name="eye-outline" size={14} color="white" />
          <Text className="text-white text-xs font-medium ml-1">
            Eye Care Active
          </Text>
          <TouchableOpacity
            onPress={onToggle}
            className="ml-2 bg-blue-700 rounded-full p-1"
          >
            <Ionicons name="close" size={10} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Blue light filter overlay */}
      <View className="absolute inset-0 bg-amber-100 opacity-10 pointer-events-none" />

      {/* Brightness reduction overlay */}
      <View className="absolute inset-0 bg-black opacity-5 pointer-events-none" />
    </View>
  );
};

export default EyeCareMode;