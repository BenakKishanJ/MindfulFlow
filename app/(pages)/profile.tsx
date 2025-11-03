// app/(tabs)/profile.tsx
import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";

export default function Profile() {
  const { currentUser, userProfile, loading, logout } = useAuth();

  // === TIMEOUT: Force logout if loading > 8s ===
  useEffect(() => {
    if (!loading) return;

    const timeout = setTimeout(() => {
      Alert.alert(
        "Session Timeout",
        "We couldn't load your profile. You may be signed in with a deleted or invalid account.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign Out",
            style: "destructive",
            onPress: async () => {
              try {
                await logout();
                router.replace("/(auth)/login");
              } catch (err) {
                Alert.alert("Error", "Failed to sign out.");
              }
            },
          },
        ]
      );
    }, 8000); // 8 seconds

    return () => clearTimeout(timeout);
  }, [loading, logout]);

  // === LOADING WITH FALLBACK UI ===
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <ActivityIndicator size="large" color="#A3E635" />
        <Text className="text-[#212121] font-medium text-lg mt-6 text-center">
          Loading your profile...
        </Text>
        <Text className="text-gray-500 text-sm mt-2 text-center">
          This should only take a moment
        </Text>
        <TouchableOpacity
          onPress={async () => {
            try {
              await logout();
              router.replace("/(auth)/login");
            } catch (err) {
              Alert.alert("Error", "Failed to sign out.");
            }
          }}
          className="mt-8 px-6 py-3 bg-red-500 rounded-full"
        >
          <Text className="text-white font-bold">Force Sign Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // === NO USER OR PROFILE (DELETED ACCOUNT?) ===
  if (!currentUser || !userProfile) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <View className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 max-w-sm">
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text className="text-[#212121] text-xl font-bold mt-4 text-center">
            Profile Not Found
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            This account may have been deleted or is corrupted.
          </Text>
          <TouchableOpacity
            onPress={async () => {
              try {
                await logout();
                router.replace("/(auth)/login");
              } catch (err) {
                Alert.alert("Error", "Failed to sign out.");
              }
            }}
            className="mt-6 bg-red-500 py-3 px-6 rounded-full"
          >
            <Text className="text-white font-bold text-center">Sign Out & Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // === USER DATA ===
  const name = currentUser?.displayName || userProfile.displayName || "User";
  const email = currentUser?.email || userProfile.email;
  const joinDate = userProfile.createdAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const avatar =
    currentUser?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000000&color=ffffff&size=128&bold=true`;
  const isPremium = false; // TODO: Fetch from Firestore

  // === MOCK STATS (replace with real data later) ===
  const stats = {
    totalSessions: 156,
    totalScreenTime: "247h 32m",
    wellnessStreak: 12,
    averageScore: 84,
  };

  // === HANDLERS ===
  const handleSignOut = async () => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const handleExportData = () => {
    Alert.alert("Export Data", "Your wellness data will be exported to a CSV file.", [
      { text: "Cancel", style: "cancel" },
      { text: "Export", onPress: () => console.log("Exporting data...") },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This action cannot be undone and all your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => console.log("Account deleted"),
        },
      ]
    );
  };

  // === NO-OP HANDLERS FOR NAVIGATION ===
  const handleNavigate = (screen: string) => {
    Alert.alert("Coming Soon", `${screen} screen is under development.`);
  };

  // === COMPONENTS ===
  const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: keyof typeof Ionicons.glyphMap }) => (
    <View className="flex-1 min-w-[48%] bg-lime-50 border border-lime-200 p-4 rounded-2xl shadow-sm items-center">
      <View className="p-3 bg-lime-400 rounded-full">
        <Ionicons name={icon} size={24} color="#212121" />
      </View>
      <Text className="text-[#212121] text-xl font-bold mt-2">{value}</Text>
      <Text className="text-gray-600 text-xs mt-1 text-center">{title}</Text>
    </View>
  );

  const MenuSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-5">
      <Text className="text-[#212121] text-lg font-bold mb-3 px-1">{title}</Text>
      <View className="bg-white border border-gray-300 rounded-2xl shadow-sm overflow-hidden">
        {children}
      </View>
    </View>
  );

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    iconColor = "#374151",
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    iconColor?: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center p-4 border-b border-gray-200 last:border-b-0 active:bg-gray-50"
    >
      <View className="w-10 h-10 items-center justify-center mr-4">
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-[#212121] font-medium text-base">{title}</Text>
        {subtitle && <Text className="text-gray-500 text-sm mt-0.5">{subtitle}</Text>}
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
    </TouchableOpacity>
  );

  // === MAIN RENDER ===
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1 px-5 py-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* === HEADER === */}
        <Text className="text-[#212121] text-3xl font-bold mb-8 text-center">
          Profile
        </Text>

        {/* === USER CARD === */}
        <View className="bg-white border border-gray-300 p-6 rounded-2xl shadow-sm mb-6">
          <View className="flex-row items-center">
            <View className="relative mr-4">
              <Image
                source={{ uri: avatar }}
                className="w-20 h-20 rounded-full border-4 border-[#212121]"
              />
              {isPremium && (
                <View className="absolute -top-1 -right-1 bg-lime-400 w-7 h-7 rounded-full items-center justify-center border-2 border-[#212121] shadow-md">
                  <Ionicons name="star" size={15} color="#212121" />
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-[#212121] text-2xl font-bold">{name}</Text>
              <Text className="text-gray-600 text-base mt-1">{email}</Text>
              <Text className="text-gray-500 text-sm mt-1">Joined {joinDate}</Text>
            </View>
          </View>
        </View>

        {/* === WELLNESS STATS === */}
        <View className="mb-6">
          <Text className="text-[#212121] text-lg font-bold mb-4 px-1">Wellness Stats</Text>
          <View className="flex-row flex-wrap justify-between gap-3">
            <StatCard title="Total Sessions" value={stats.totalSessions} icon="phone-portrait-outline" />
            <StatCard title="Screen Time" value={stats.totalScreenTime} icon="time-outline" />
            <StatCard title="Wellness Streak" value={`${stats.wellnessStreak} days`} icon="flame-outline" />
            <StatCard title="Average Score" value={`${stats.averageScore}%`} icon="trophy-outline" />
          </View>
        </View>

        {/* === MENU SECTIONS === */}
        <MenuSection title="Wellness Settings">
          <MenuItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Break reminders and wellness alerts"
            onPress={() => handleNavigate("Notifications")}
          />
          <MenuItem
            icon="time-outline"
            title="Break Intervals"
            subtitle="Customize your break schedule"
            onPress={() => handleNavigate("Break Intervals")}
          />
          <MenuItem
            icon="eye-outline"
            title="Eye Strain Settings"
            subtitle="Adjust sensitivity and thresholds"
            onPress={() => handleNavigate("Eye Strain Settings")}
          />
          <MenuItem
            icon="body-outline"
            title="Posture Settings"
            subtitle="Configure posture monitoring"
            onPress={() => handleNavigate("Posture Settings")}
          />
        </MenuSection>

        <MenuSection title="Privacy & Data">
          <MenuItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="How we protect your data"
            onPress={() => handleNavigate("Privacy Policy")}
          />
          <MenuItem
            icon="download-outline"
            title="Export Data"
            subtitle="Download your wellness data"
            onPress={handleExportData}
          />
          <MenuItem
            icon="trash-outline"
            title="Clear All Data"
            subtitle="Reset your wellness history"
            onPress={() => handleNavigate("Clear All Data")}
            iconColor="#EF4444"
          />
        </MenuSection>

        <MenuSection title="Support">
          <MenuItem
            icon="help-circle-outline"
            title="Help Center"
            subtitle="FAQs and troubleshooting"
            onPress={() => handleNavigate("Help Center")}
          />
          <MenuItem
            icon="chatbubble-outline"
            title="Contact Support"
            subtitle="Get help from our team"
            onPress={() => handleNavigate("Contact Support")}
          />
          <MenuItem
            icon="star-outline"
            title="Rate App"
            subtitle="Share your feedback"
            onPress={() => handleNavigate("Rate App")}
          />
          <MenuItem
            icon="share-outline"
            title="Share App"
            subtitle="Tell friends about MindfulFlow"
            onPress={() => handleNavigate("Share App")}
          />
        </MenuSection>

        <MenuSection title="Account">
          <MenuItem
            icon="log-out-outline"
            title="Sign Out"
            onPress={handleSignOut}
            showArrow={false}
            iconColor="#EF4444"
          />
          <MenuItem
            icon="person-remove-outline"
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
            showArrow={false}
            iconColor="#EF4444"
          />
        </MenuSection>

        {/* === APP INFO === */}
        <View className="bg-white border border-gray-300 p-6 rounded-2xl shadow-sm mt-2 text-center">
          <Text className="text-gray-500 text-sm font-medium">MindfulFlow v1.0.0</Text>
          <Text className="text-gray-400 text-xs mt-1">
            Made with love for your digital wellness
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
