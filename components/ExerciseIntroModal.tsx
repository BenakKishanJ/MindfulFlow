// components/ExerciseIntroModal.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Exercise } from "@/types/exercises";

interface ExerciseIntroModalProps {
  exercise: Exercise;
  onStart: () => void;
  onClose: () => void;
}

const ExerciseIntroModal: React.FC<ExerciseIntroModalProps> = ({
  exercise,
  onStart,
  onClose,
}) => {
  // -------------------------------------------------------------------------
  // Helper: Get first step image with fallback
  // -------------------------------------------------------------------------
  const getFirstStepImage = () => {
    const firstStepWithImage = exercise.steps.find((s) => s.image);
    return firstStepWithImage?.image || require("@/assets/images/exercises/placeholder.png");
  };

  // -------------------------------------------------------------------------
  // Helper: Calculate total duration
  // -------------------------------------------------------------------------
  const calculateTotalDuration = () => {
    const stepTime = exercise.steps.reduce((sum, s) => sum + s.duration, 0);
    const transitionCount = Math.max(0, exercise.steps.length - 1);
    const transitionTime = transitionCount * 5;
    return stepTime + transitionTime;
  };

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return mins > 0 ? `${mins} min${mins > 1 ? 's' : ''} ${secs}s` : `${secs}s`;
  };

  const totalDuration = calculateTotalDuration();
  const firstImage = getFirstStepImage();

  return (
    <SafeAreaView className="absolute inset-0 bg-white z-50 flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between p-5 border-b border-gray-200">
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="p-2"
        >
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text className="text-black text-lg font-bold flex-1 text-center mr-10">
          Exercise Details
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1">
        {/* Hero Image */}
        <View className="h-64 bg-gray-50 items-center justify-center overflow-hidden">
          <Image
            source={firstImage}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Content Padding */}
        <View className="p-6">

          {/* Title & Type */}
          <View className="flex-row items-center mb-3">
            <View className="bg-lime-400 p-2.5 rounded-xl border-2 border-black">
              <Ionicons
                name={
                  ({
                    eye: "eye-outline",
                    posture: "body-outline",
                    breathing: "leaf-outline",
                    break: "pause-outline",
                  }[exercise.type] || "fitness-outline") as keyof typeof Ionicons.glyphMap
                }
                size={20}
                color="black"
              />
            </View>
            <Text className="ml-3 text-black font-bold text-2xl flex-1">
              {exercise.title}
            </Text>
          </View>

          {/* Description */}
          <Text className="text-gray-600 text-base mb-6 leading-6">
            {exercise.description}
          </Text>

          {/* Duration & Steps */}
          <View className="flex-row justify-between mb-6">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={20} color="#6b7280" />
              <Text className="ml-2 text-gray-700 font-medium">
                {formatDuration(totalDuration)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="list-outline" size={20} color="#6b7280" />
              <Text className="ml-2 text-gray-700 font-medium">
                {exercise.steps.length} {exercise.steps.length === 1 ? "step" : "steps"}
              </Text>
            </View>
          </View>

          {/* Benefits Section */}
          <View className="mb-6">
            <Text className="text-black font-bold text-lg mb-3">Benefits</Text>
            <View className="space-y-2">
              {exercise.benefits.map((benefit, i) => (
                <View key={i} className="flex-row items-start">
                  <View className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5 mr-3" />
                  <Text className="text-gray-700 text-base flex-1 leading-5">
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions Section */}
          <View className="mb-8">
            <Text className="text-black font-bold text-lg mb-3">How to Do It</Text>
            <View className="space-y-3">
              {exercise.instructions.map((instruction, i) => (
                <View key={i} className="flex-row items-start">
                  <Text className="text-purple-600 font-bold text-lg mr-2">
                    {i + 1}.
                  </Text>
                  <Text className="text-gray-700 text-base flex-1 leading-5">
                    {instruction}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={onStart}
            className="bg-lime-400 py-4 rounded-full border-2 border-black shadow-md"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text className="text-black font-bold text-center text-lg">
              Start Exercise
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExerciseIntroModal;
