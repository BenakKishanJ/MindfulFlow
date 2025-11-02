// app/(tabs)/exercises.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { auth, db } from "@/firebase"; // Ensure you have this setup
import { doc, setDoc, getDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import ExerciseCard from "@/components/ExerciseCard";
import ExerciseIntroModal from "@/components/ExerciseIntroModal";
import ExerciseTimerModal from "@/components/ExerciseTimerModal";
import { exercisesData, exerciseCategories } from "@/data/exercisesData";
import { Exercise, ExerciseType } from "@/types/exercises";

export default function Exercises() {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [selectedCategory, setSelectedCategory] = useState<ExerciseType | "all">("all");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Auth Listener
  // -------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid || null);
      if (user?.uid) {
        loadCompletedExercises(user.uid);
      } else {
        setCompletedExercises(new Set());
      }
    });
    return () => unsubscribe();
  }, []);

  // -------------------------------------------------------------------------
  // Load Completed Exercises from Firestore
  // -------------------------------------------------------------------------
  const loadCompletedExercises = async (uid: string) => {
    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const userDocRef = doc(db, "users", uid, "dailyProgress", today);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const completed = new Set<string>(data.completedExercises || []);
        setCompletedExercises(completed);
      }
    } catch (error) {
      console.error("Failed to load completed exercises:", error);
    }
  };

  // -------------------------------------------------------------------------
  // Save Completion to Firestore
  // -------------------------------------------------------------------------
  const handleComplete = async (exerciseId: string) => {
    if (!userId) return;

    const today = new Date().toISOString().split("T")[0];
    const userDocRef = doc(db, "users", userId, "dailyProgress", today);

    try {
      const docSnap = await getDoc(userDocRef);
      const timestamp = new Date().toISOString();

      if (docSnap.exists()) {
        // Update existing doc
        await updateDoc(userDocRef, {
          completedExercises: arrayUnion(exerciseId),
          [`exerciseCount.${exerciseId}`]: increment(1),
          lastUpdated: timestamp,
        });
      } else {
        // Create new daily doc
        await setDoc(userDocRef, {
          date: today,
          completedExercises: [exerciseId],
          exerciseCount: { [exerciseId]: 1 },
          totalCompletions: 1,
          lastUpdated: timestamp,
        });
      }

      // Update local state
      setCompletedExercises((prev) => new Set([...prev, exerciseId]));
    } catch (error) {
      console.error("Failed to save completion:", error);
    }

    // Close modals
    setShowTimer(false);
    setSelectedExercise(null);
  };

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleCardPress = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowIntro(true);
  };

  const handleStartExercise = () => {
    setShowIntro(false);
    setShowTimer(true);
  };

  const handleClose = () => {
    setShowIntro(false);
    setShowTimer(false);
    setSelectedExercise(null);
  };

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------
  const filteredExercises =
    selectedCategory === "all"
      ? exercisesData
      : exercisesData.filter((e) => e.type === selectedCategory);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-8 border-b border-gray-200">
          <Text className="text-black text-3xl font-bold">Exercises</Text>
          <Text className="text-gray-600 text-base mt-1">
            Take a break and recharge
          </Text>
        </View>

        {/* Category Filter */}
        <View className="px-6 py-5 border-b border-gray-200">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {[{ id: "all", name: "All", icon: "apps-outline", color: "#000" }, ...exerciseCategories].map(
              (category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id as any)}
                  className={`px-5 py-3 mr-3 rounded-full border-2 ${selectedCategory === category.id
                      ? "bg-lime-400 border-black"
                      : "bg-white border-gray-300"
                    }`}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: selectedCategory === category.id ? 0.15 : 0.05,
                    shadowRadius: 4,
                    elevation: selectedCategory === category.id ? 4 : 1,
                  }}
                >
                  <Text
                    className={`font-semibold text-sm ${selectedCategory === category.id ? "text-black" : "text-gray-700"
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
        <View className="px-6 py-6">
          {filteredExercises.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-gray-500 text-base">No exercises in this category</Text>
            </View>
          ) : (
            filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onStart={handleCardPress}
                isCompleted={completedExercises.has(exercise.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Intro Modal */}
      {showIntro && selectedExercise && (
        <ExerciseIntroModal
          exercise={selectedExercise}
          onStart={handleStartExercise}
          onClose={handleClose}
        />
      )}

      {/* Timer Modal */}
      {showTimer && selectedExercise && (
        <ExerciseTimerModal
          exercise={selectedExercise}
          onComplete={() => handleComplete(selectedExercise.id)}
          onClose={handleClose}
        />
      )}
    </SafeAreaView>
  );
}
