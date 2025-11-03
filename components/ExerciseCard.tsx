// components/ExerciseCard.tsx
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
  // -------------------------------------------------------------------------
  // Helper: Get first step image with fallback
  // -------------------------------------------------------------------------
  const getFirstStepImage = () => {
    const firstStepWithImage = exercise.steps.find((s) => s.image);
    return firstStepWithImage?.image || require("@/assets/images/exercises/placeholder.png");
  };

  // -------------------------------------------------------------------------
  // Helper: Calculate total duration including transitions
  // -------------------------------------------------------------------------
  const calculateTotalDuration = () => {
    const stepTime = exercise.steps.reduce((sum, s) => sum + s.duration, 0);
    const transitionCount = Math.max(0, exercise.steps.length - 1);
    const transitionTime = transitionCount * 5; // 5 sec purple transition
    return stepTime + transitionTime;
  };

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return mins > 0 ? `${mins} min${mins > 1 ? 's' : ''} ${secs}s` : `${secs}s`;
  };

  const totalDuration = calculateTotalDuration();
  const firstImage = getFirstStepImage();

  // -------------------------------------------------------------------------
  // Icon mapping
  // -------------------------------------------------------------------------
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
      className="mb-4"
      activeOpacity={0.85}
    >
      {/* Card Container */}
      <View
        className="bg-white rounded-2xl overflow-hidden"
        style={{
          borderWidth: 1.5,
          borderColor: "#d4d4d8", // subtle dark gray border
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        {/* Image Section */}
        <View className="h-48 bg-gray-50 items-center justify-center">
          <Image
            source={firstImage}
            className="w-full h-full"
            resizeMode="cover"
          />
          {isCompleted && (
            <View className="absolute top-3 right-3 bg-lime-400 rounded-full p-1.5 border-2 border-black">
              <Ionicons name="checkmark" size={16} color="black" />
            </View>
          )}
        </View>

        {/* Content Section */}
        <View className="p-5">
          {/* Header: Icon + Title */}
          <View className="flex-row items-center mb-2">
            <View className="flex-row items-center flex-1">
              <View className="bg-lime-400 p-2 rounded-xl border-2 border-black">
                <Ionicons name={getTypeIcon(exercise.type)} size={18} color="black" />
              </View>
              <Text className="ml-3 text-black font-bold text-lg flex-1">
                {exercise.title}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text className="text-gray-600 text-sm mb-4 line-clamp-2">
            {exercise.description}
          </Text>

          {/* Benefits List */}
          <View className="mb-4">
            {exercise.benefits.slice(0, 2).map((benefit, i) => (
              <View key={i} className="flex-row items-start mb-1">
                <View className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5 mr-2" />
                <Text className="text-gray-700 text-sm flex-1">{benefit}</Text>
              </View>
            ))}
            {exercise.benefits.length > 2 && (
              <Text className="text-gray-500 text-xs mt-1">
                +{exercise.benefits.length - 2} more
              </Text>
            )}
          </View>

          {/* Footer: Duration + CTA */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={16} color="#6b7280" />
              <Text className="ml-1 text-gray-600 text-xs">
                {formatDuration(totalDuration)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => onStart(exercise)}
              className="bg-lime-400 px-5 py-2.5 rounded-full border-2 border-black"
            >
              <Text className="text-black font-bold text-sm">Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ExerciseCard;
