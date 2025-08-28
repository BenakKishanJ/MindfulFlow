// types/expo-router.d.ts
import { RelativePathString } from 'expo-router';

declare module 'expo-router' {
  interface RelativePathString {
    // Add your custom path types here
    '/(auth)/login': never;
    '/(auth)/register': never;
    '/(tabs)': never;
    '/(tabs)/dashboard': never;
    '/(tabs)/insights': never;
    '/(tabs)/profile': never;
    '/(tabs)/settings': never;
  }
}
