// app/_layout.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ScreenTimeProvider } from '@/contexts/ScreenTimeContext';
import { ResponsiveActionsProvider, useResponsiveActions } from '@/contexts/ResponsiveActionsContext';
import AppBlocker from '@/components/AppBlocker';
import EyeCareMode from '@/components/EyeCareMode';
import GreyscaleMode from '@/components/GreyscaleMode';
import '../globals.css';

// This component handles the route protection logic and responsive actions
function InitialLayout() {
  const { currentUser, loading } = useAuth();
  const { activeActions, deactivateAction } = useResponsiveActions();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    const inAuthGroup = segments[0] === "(auth)";
    // const inTabsGroup = segments[0] === '(tabs)';

    if (currentUser && inAuthGroup) {
      // User is signed in but in auth group, redirect to main app
      router.replace("/(tabs)" as never);
    } else if (!currentUser && !inAuthGroup) {
      // User is not signed in but not in auth group, redirect to login
      router.replace("/(auth)/login" as never);
    }
  }, [currentUser, loading, segments, router]);

  // Check for active actions
  const appBlockAction = activeActions.find(action => action.type === 'app_block');
  const eyeCareAction = activeActions.find(action => action.type === 'eye_care_mode');
  const greyscaleAction = activeActions.find(action => action.type === 'greyscale_mode');

  const handleAppBlockUnlock = () => {
    if (appBlockAction) {
      deactivateAction(appBlockAction.id);
    }
  };

  const handleEyeCareToggle = () => {
    if (eyeCareAction) {
      deactivateAction(eyeCareAction.id);
    }
  };

  const handleGreyscaleToggle = () => {
    if (greyscaleAction) {
      deactivateAction(greyscaleAction.id);
    }
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <>
      <Slot />

      {/* Responsive Action Overlays */}
      <AppBlocker
        isVisible={!!appBlockAction}
        onUnlock={handleAppBlockUnlock}
      />
      <EyeCareMode
        isActive={!!eyeCareAction}
        onToggle={handleEyeCareToggle}
      />
      <GreyscaleMode
        isActive={!!greyscaleAction}
        onToggle={handleGreyscaleToggle}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'PPMori-Extralight': require('../assets/fonts/PPMori-Extralight.otf'),
    'PPMori-ExtralightItalic': require('../assets/fonts/PPMori-ExtralightItalic.otf'),
    'PPMori-Regular': require('../assets/fonts/PPMori-Regular.otf'),
    'PPMori-RegularItalic': require('../assets/fonts/PPMori-RegularItalic.otf'),
    'PPMori-SemiBold': require('../assets/fonts/PPMori-SemiBold.otf'),
    'PPMori-SemiBoldItalic': require('../assets/fonts/PPMori-SemiBoldItalic.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <ScreenTimeProvider>
        <ResponsiveActionsProvider>
          <InitialLayout />
        </ResponsiveActionsProvider>
      </ScreenTimeProvider>
    </AuthProvider>
  );
}
