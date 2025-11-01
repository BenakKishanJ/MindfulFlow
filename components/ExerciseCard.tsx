import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Exercise } from "@/types/exercises";

interface ExerciseCardProps {
  exercise: Exercise;
  onStart: (exercise: Exercise) => void;
  isCompleted: boolean;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onStart, isCompleted }) => {
  const getTypeIcon = (type: string) => {
    const map: Record<string, any> = {
      eye: "eye-outline",
      posture: "body-outline",
      breathing: "leaf-outline",
      break: "pause-outline",
    };
    return map[type] || "fitness-outline";
  };

  return (
    <TouchableOpacity
      onPress={() => onStart(exercise)}
      className="bg-white border border-gray-300 mb-4 overflow-hidden"
      activeOpacity={0.9}
    >
      {/* Image */}
      <View className="h-48 bg-gray-100 items-center justify-center">
        <Image
          source={require("@/assets/images/icon.png")}
          className="w-32 h-32"
          resizeMode="contain"
        />
      </View>

      {/* Content */}
      <View className="p-5">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Ionicons name={getTypeIcon(exercise.type)} size={20} color="#000" />
            <Text className="ml-2 text-black font-bold text-lg">{exercise.title}</Text>
          </View>
          {isCompleted && <Ionicons name="checkmark-circle" size={24} color="#A3E635" />}
        </View>

        <Text className="text-gray-600 text-sm mb-3">{exercise.description}</Text>

        {/* Steps Preview */}
        <View className="mb-3">
          <Text className="text-gray-500 text-xs font-medium mb-1">
            {exercise.instructions.length} Steps
          </Text>
          {exercise.instructions.slice(0, 2).map((step, i) => (
            <Text key={i} className="text-gray-700 text-sm">
              {i + 1}. {step}
            </Text>
          ))}
          {exercise.instructions.length > 2 && (
            <Text className="text-gray-500 text-xs mt-1">...and more</Text>
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={() => onStart(exercise)}
          className="bg-lime-400 py-3 items-center border border-lime-400"
        >
          <Text className="text-black font-bold">Start Exercise</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default ExerciseCard;
