// app/_layout.tsx
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import "../globals.css";

// This component handles the route protection logic
function InitialLayout() {
  const { currentUser, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (currentUser && inAuthGroup) {
      // User is signed in but in auth group, redirect to main app
      router.replace("/(tabs)" as never);
    } else if (!currentUser && !inAuthGroup) {
      // User is not signed in but not in auth group, redirect to login
      router.replace("/(auth)/login" as never);
    }
  }, [currentUser, loading, segments, router]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
