import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const [user] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@email.com",
    joinDate: "March 2024",
    avatar: "https://via.placeholder.com/100x100/8B5CF6/FFFFFF?text=AJ",
    isPremium: false,
  });

  const [stats] = useState({
    totalSessions: 156,
    totalScreenTime: "247h 32m",
    wellnessStreak: 12,
    averageScore: 84,
  });

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Profile editing feature coming soon!");
  };

  const handleUpgradePremium = () => {
    Alert.alert(
      "Upgrade to Premium",
      "Get advanced AI insights, detailed analytics, and personalized wellness plans.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Learn More", onPress: () => console.log("Premium info") },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "Your wellness data will be exported to a CSV file.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Export", onPress: () => console.log("Exporting data...") },
      ]
    );
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

  const StatCard = ({ title, value, icon, color }: any) => (
    <View className="bg-white rounded-2xl p-4 shadow-sm flex-1 mx-1">
      <View className="items-center">
        <View className={`p-3 rounded-full mb-2 ${color}`}>
          <Ionicons name={icon} size={24} color="white" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
        <Text className="text-gray-600 text-sm text-center">{title}</Text>
      </View>
    </View>
  );

  const MenuSection = ({ title, children }: any) => (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-900 mb-3 px-2">
        {title}
      </Text>
      <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {children}
      </View>
    </View>
  );

  const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true, iconColor = "#8B5CF6" }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center p-4 border-b border-gray-100 last:border-b-0"
    >
      <View className="w-10 h-10 items-center justify-center mr-4">
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-medium">{title}</Text>
        {subtitle && (
          <Text className="text-gray-500 text-sm mt-1">{subtitle}</Text>
        )}
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <Text className="text-3xl font-bold text-gray-900 mb-8">Profile</Text>

        {/* User Info Card */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <View className="flex-row items-center mb-4">
            <View className="relative">
              <Image
                source={{ uri: user.avatar }}
                className="w-20 h-20 rounded-full"
              />
              {user.isPremium && (
                <View className="absolute -top-1 -right-1 bg-yellow-500 w-6 h-6 rounded-full items-center justify-center">
                  <Ionicons name="star" size={14} color="white" />
                </View>
              )}
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-2xl font-bold text-gray-900">
                {user.name}
              </Text>
              <Text className="text-gray-600 mb-2">{user.email}</Text>
              <Text className="text-gray-500 text-sm">
                Member since {user.joinDate}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleEditProfile}
              className="bg-purple-100 p-2 rounded-full"
            >
              <Ionicons name="pencil" size={20} color="#8B5CF6" />
            </TouchableOpacity>
          </View>

          {!user.isPremium && (
            <TouchableOpacity
              onPress={handleUpgradePremium}
              className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <Ionicons name="star" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Upgrade to Premium
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Grid */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Your Wellness Journey
          </Text>
          <View className="flex-row mb-4">
            <StatCard
              title="Total Sessions"
              value={stats.totalSessions}
              icon="play-circle"
              color="bg-blue-500"
            />
            <StatCard
              title="Screen Time Tracked"
              value={stats.totalScreenTime}
              icon="time"
              color="bg-purple-500"
            />
          </View>
          <View className="flex-row">
            <StatCard
              title="Wellness Streak"
              value={`${stats.wellnessStreak} days`}
              icon="flame"
              color="bg-orange-500"
            />
            <StatCard
              title="Average Score"
              value={`${stats.averageScore}%`}
              icon="trophy"
              color="bg-green-500"
            />
          </View>
        </View>

        {/* Wellness Settings */}
        <MenuSection title="Wellness Settings">
          <MenuItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Break reminders and wellness alerts"
            onPress={() => console.log("Notifications")}
          />
          <MenuItem
            icon="time-outline"
            title="Break Intervals"
            subtitle="Customize your break schedule"
            onPress={() => console.log("Break intervals")}
          />
          <MenuItem
            icon="eye-outline"
            title="Eye Strain Settings"
            subtitle="Adjust sensitivity and thresholds"
            onPress={() => console.log("Eye strain settings")}
          />
          <MenuItem
            icon="body-outline"
            title="Posture Settings"
            subtitle="Configure posture monitoring"
            onPress={() => console.log("Posture settings")}
          />
        </MenuSection>

        {/* Privacy & Data */}
        <MenuSection title="Privacy & Data">
          <MenuItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="How we protect your data"
            onPress={() => console.log("Privacy policy")}
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
            onPress={() => console.log("Clear data")}
            iconColor="#EF4444"
          />
        </MenuSection>

        {/* Support */}
        <MenuSection title="Support">
          <MenuItem
            icon="help-circle-outline"
            title="Help Center"
            subtitle="FAQs and troubleshooting"
            onPress={() => console.log("Help center")}
          />
          <MenuItem
            icon="chatbubble-outline"
            title="Contact Support"
            subtitle="Get help from our team"
            onPress={() => console.log("Contact support")}
          />
          <MenuItem
            icon="star-outline"
            title="Rate App"
            subtitle="Share your feedback"
            onPress={() => console.log("Rate app")}
          />
          <MenuItem
            icon="share-outline"
            title="Share App"
            subtitle="Tell friends about MindfulFlow"
            onPress={() => console.log("Share app")}
          />
        </MenuSection>

        {/* Account Actions */}
        <MenuSection title="Account">
          <MenuItem
            icon="log-out-outline"
            title="Sign Out"
            onPress={() => console.log("Sign out")}
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

        {/* App Info */}
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-center text-gray-500 text-sm mb-2">
            MindfulFlow v1.0.0
          </Text>
          <Text className="text-center text-gray-400 text-xs">
            Made with ❤️ for your digital wellness
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
