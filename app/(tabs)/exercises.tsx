// app/(tabs)/exercises.tsx
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ExerciseCard from "@/components/ExerciseCard";
import ExerciseTimerModal from "@/components/ExerciseTimerModal";
import { exercisesData, exerciseCategories } from "@/data/exercisesData";
import { Exercise, ExerciseType } from "@/types/exercises";

export default function Exercises() {
  const [selectedCategory, setSelectedCategory] = useState<ExerciseType | "all">("all");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  const filteredExercises =
    selectedCategory === "all"
      ? exercisesData
      : exercisesData.filter((e) => e.type === selectedCategory);

  const handleStartExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const handleComplete = (id: string) => {
    setCompletedExercises((prev) => new Set([...prev, id]));
    setSelectedExercise(null);
  };

  const handleClose = () => {
    setSelectedExercise(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 py-6 border-b border-gray-300">
          <Text className="text-black text-3xl font-bold">Exercises</Text>
        </View>

        {/* Category Filter */}
        <View className="px-4 py-4 border-b border-gray-300">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {[{ id: "all", name: "All", icon: "apps-outline", color: "#000" }, ...exerciseCategories].map(
              (category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id as any)}
                  className={`px-4 py-2 mr-2 border ${selectedCategory === category.id
                      ? "bg-lime-400 border-lime-400"
                      : "border-gray-400 bg-white"
                    }`}
                >
                  <Text
                    className={`font-medium ${selectedCategory === category.id ? "text-black" : "text-gray-700"
                      }`}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </View>

        {/* Exercise List */}
        <View className="px-4 py-6">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onStart={handleStartExercise}
              isCompleted={completedExercises.has(exercise.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Timer Modal */}
      {selectedExercise && (
        <ExerciseTimerModal
          exercise={selectedExercise}
          onComplete={() => handleComplete(selectedExercise.id)}
          onClose={handleClose}
        />
      )}
    </SafeAreaView>
  );
}
