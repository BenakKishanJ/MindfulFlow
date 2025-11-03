import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsiveActions } from '../contexts/ResponsiveActionsContext';

interface GreyscaleModeProps {
  isActive: boolean;
  onToggle: () => void;
}

const GreyscaleMode: React.FC<GreyscaleModeProps> = ({ isActive, onToggle }) => {
  const { greyscaleConfig } = useResponsiveActions();

  useEffect(() => {
    if (isActive && greyscaleConfig) {
      applyGreyscaleFilter();
    } else {
      removeGreyscaleFilter();
    }
  }, [isActive, greyscaleConfig]);

  const applyGreyscaleFilter = () => {
    // In a real implementation, this would apply CSS filters or native filters
    console.log('Applying greyscale filter:', greyscaleConfig);
  };

  const removeGreyscaleFilter = () => {
    console.log('Removing greyscale filter');
  };

  if (!isActive) return null;

  return (
    <>
      {/* Status indicator */}
      <View className="absolute top-12 left-4 z-40">
        <View className="bg-gray-800 rounded-full px-3 py-1 flex-row items-center">
          <Ionicons name="contrast-outline" size={14} color="white" />
          <Text className="text-white text-xs font-medium ml-1">
            Greyscale Active
          </Text>
          <TouchableOpacity
            onPress={onToggle}
            className="ml-2 bg-gray-700 rounded-full p-1"
          >
            <Ionicons name="close" size={10} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Greyscale overlay */}
      <View
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          backgroundColor: 'rgba(128, 128, 128, 0.1)',
          filter: 'grayscale(50%)',
        }}
      />
    </>
  );
};

export default GreyscaleMode;