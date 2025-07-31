import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      breakReminders: true,
      eyeStrainAlerts: true,
      postureAlerts: true,
      dailySummary: true,
      weeklyReport: false,
    },
    monitoring: {
      eyeTracking: true,
      postureTracking: true,
      emotionTracking: false,
      backgroundMonitoring: true,
    },
    privacy: {
      dataCollection: true,
      anonymousAnalytics: false,
      localProcessing: true,
    },
    wellness: {
      breakInterval: 30, // minutes
      eyeStrainSensitivity: "Medium",
      postureSensitivity: "High",
      workingHours: "9 AM - 6 PM",
    },
    appearance: {
      darkMode: false,
      colorTheme: "Purple",
      fontSize: "Medium",
    },
  });

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }));
  };

  const handleResetSettings = () => {
    Alert.alert(
      "Reset Settings",
      "This will reset all settings to their default values. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            // Reset to default settings
            Alert.alert("Settings Reset", "All settings have been reset to defaults.");
          },
        },
      ]
    );
  };

  const SettingsSection = ({ title, children }: any) => (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-900 mb-3 px-2">
        {title}
      </Text>
      <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {children}
      </View>
    </View>
  );

  const ToggleItem = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
    iconColor = "#8B5CF6"
  }: any) => (
    <View className="flex-row items-center p-4 border-b border-gray-100 last:border-b-0">
      <View className="w-10 h-10 items-center justify-center mr-4">
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-medium">{title}</Text>
        {subtitle && (
          <Text className="text-gray-500 text-sm mt-1">{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
        thumbColor={value ? "#8B5CF6" : "#F3F4F6"}
      />
    </View>
  );

  const SelectItem = ({ icon, title, subtitle, value, onPress, iconColor = "#8B5CF6" }: any) => (
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
      <View className="flex-row items-center">
        <Text className="text-purple-600 font-medium mr-2">{value}</Text>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  const handleBreakIntervalChange = () => {
    const intervals = ["15 min", "30 min", "45 min", "60 min", "90 min"];
    Alert.alert(
      "Break Interval",
      "How often would you like break reminders?",
      intervals.map(interval => ({
        text: interval,
        onPress: () => updateSetting("wellness", "breakInterval", interval),
      }))
    );
  };

  const handleSensitivityChange = (type: string, current: string) => {
    const levels = ["Low", "Medium", "High"];
    Alert.alert(
      `${type} Sensitivity`,
      "Choose sensitivity level:",
      levels.map(level => ({
        text: level,
        onPress: () => updateSetting("wellness", `${type.toLowerCase()}Sensitivity`, level),
      }))
    );
  };

  const handleThemeChange = () => {
    const themes = ["Purple", "Blue", "Green", "Orange"];
    Alert.alert(
      "Color Theme",
      "Choose your preferred color theme:",
      themes.map(theme => ({
        text: theme,
        onPress: () => updateSetting("appearance", "colorTheme", theme),
      }))
    );
  };

  const handleFontSizeChange = () => {
    const sizes = ["Small", "Medium", "Large"];
    Alert.alert(
      "Font Size",
      "Choose your preferred font size:",
      sizes.map(size => ({
        text: size,
        onPress: () => updateSetting("appearance", "fontSize", size),
      }))
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Settings
            </Text>
            <Text className="text-gray-600">
              Customize your MindfulFlow experience
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleResetSettings}
            className="bg-gray-100 p-3 rounded-full"
          >
            <Ionicons name="refresh-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Notification Settings */}
        <SettingsSection title="Notifications">
          <ToggleItem
            icon="notifications-outline"
            title="Break Reminders"
            subtitle="Get notified when it's time for a break"
            value={settings.notifications.breakReminders}
            onValueChange={(value: boolean) =>
              updateSetting("notifications", "breakReminders", value)
            }
          />
          <ToggleItem
            icon="eye-outline"
            title="Eye Strain Alerts"
            subtitle="Receive alerts when eye strain is detected"
            value={settings.notifications.eyeStrainAlerts}
            onValueChange={(value: boolean) =>
              updateSetting("notifications", "eyeStrainAlerts", value)
            }
          />
          <ToggleItem
            icon="body-outline"
            title="Posture Alerts"
            subtitle="Get notified about poor posture"
            value={settings.notifications.postureAlerts}
            onValueChange={(value: boolean) =>
              updateSetting("notifications", "postureAlerts", value)
            }
          />
          <ToggleItem
            icon="document-text-outline"
            title="Daily Summary"
            subtitle="Receive daily wellness summaries"
            value={settings.notifications.dailySummary}
            onValueChange={(value: boolean) =>
              updateSetting("notifications", "dailySummary", value)
            }
          />
          <ToggleItem
            icon="calendar-outline"
            title="Weekly Report"
            subtitle="Get weekly wellness reports"
            value={settings.notifications.weeklyReport}
            onValueChange={(value: boolean) =>
              updateSetting("notifications", "weeklyReport", value)
            }
          />
        </SettingsSection>

        {/* Monitoring Settings */}
        <SettingsSection title="Monitoring">
          <ToggleItem
            icon="eye"
            title="Eye Tracking"
            subtitle="Monitor blink rate and eye movements"
            value={settings.monitoring.eyeTracking}
            onValueChange={(value: boolean) =>
              updateSetting("monitoring", "eyeTracking", value)
            }
          />
          <ToggleItem
            icon="body"
            title="Posture Tracking"
            subtitle="Monitor head position and posture"
            value={settings.monitoring.postureTracking}
            onValueChange={(value: boolean) =>
              updateSetting("monitoring", "postureTracking", value)
            }
          />
          <ToggleItem
            icon="happy-outline"
            title="Emotion Tracking"
            subtitle="Analyze emotional state (experimental)"
            value={settings.monitoring.emotionTracking}
            onValueChange={(value: boolean) =>
              updateSetting("monitoring", "emotionTracking", value)
            }
          />
          <ToggleItem
            icon="layers-outline"
            title="Background Monitoring"
            subtitle="Continue monitoring when app is in background"
            value={settings.monitoring.backgroundMonitoring}
            onValueChange={(value: boolean) =>
              updateSetting("monitoring", "backgroundMonitoring", value)
            }
          />
        </SettingsSection>

        {/* Wellness Configuration */}
        <SettingsSection title="Wellness Configuration">
          <SelectItem
            icon="time-outline"
            title="Break Interval"
            subtitle="How often to remind you to take breaks"
            value={`${settings.wellness.breakInterval} min`}
            onPress={handleBreakIntervalChange}
          />
          <SelectItem
            icon="eye-outline"
            title="Eye Strain Sensitivity"
            subtitle="Adjust eye strain detection sensitivity"
            value={settings.wellness.eyeStrainSensitivity}
            onPress={() => handleSensitivityChange("Eye Strain", settings.wellness.eyeStrainSensitivity)}
          />
          <SelectItem
            icon="body-outline"
            title="Posture Sensitivity"
            subtitle="Adjust posture detection sensitivity"
            value={settings.wellness.postureSensitivity}
            onPress={() => handleSensitivityChange("Posture", settings.wellness.postureSensitivity)}
          />
          <SelectItem
            icon="business-outline"
            title="Working Hours"
            subtitle="Set your typical working hours"
            value={settings.wellness.workingHours}
            onPress={() => Alert.alert("Working Hours", "Time picker coming soon!")}
          />
        </SettingsSection>

        {/* Privacy Settings */}
        <SettingsSection title="Privacy & Security">
          <ToggleItem
            icon="shield-checkmark-outline"
            title="Local Processing"
            subtitle="Process all data locally on your device"
            value={settings.privacy.localProcessing}
            onValueChange={(value: boolean) =>
              updateSetting("privacy", "localProcessing", value)
            }
            iconColor="#10B981"
          />
          <ToggleItem
            icon="analytics-outline"
            title="Anonymous Analytics"
            subtitle="Help improve the app with anonymous usage data"
            value={settings.privacy.anonymousAnalytics}
            onValueChange={(value: boolean) =>
              updateSetting("privacy", "anonymousAnalytics", value)
            }
          />
          <ToggleItem
            icon="folder-outline"
            title="Data Collection"
            subtitle="Allow collection of wellness metrics"
            value={settings.privacy.dataCollection}
            onValueChange={(value: boolean) =>
              updateSetting("privacy", "dataCollection", value)
            }
          />
        </SettingsSection>

        {/* Appearance Settings */}
        <SettingsSection title="Appearance">
          <ToggleItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Use dark theme throughout the app"
            value={settings.appearance.darkMode}
            onValueChange={(value: boolean) =>
              updateSetting("appearance", "darkMode", value)
            }
          />
          <SelectItem
            icon="color-palette-outline"
            title="Color Theme"
            subtitle="Choose your preferred color scheme"
            value={settings.appearance.colorTheme}
            onPress={handleThemeChange}
          />
          <SelectItem
            icon="text-outline"
            title="Font Size"
            subtitle="Adjust text size throughout the app"
            value={settings.appearance.fontSize}
            onPress={handleFontSizeChange}
          />
        </SettingsSection>

        {/* Advanced Settings */}
        <SettingsSection title="Advanced">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <View className="w-10 h-10 items-center justify-center mr-4">
              <Ionicons name="code-outline" size={22} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">Developer Options</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Advanced settings for developers
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <View className="w-10 h-10 items-center justify-center mr-4">
              <Ionicons name="bug-outline" size={22} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">Debug Mode</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Enable detailed logging for troubleshooting
              </Text>
            </View>
            <Switch
              value={false}
              onValueChange={() => Alert.alert("Debug Mode", "Feature coming soon!")}
              trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
              thumbColor="#8B5CF6"
            />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-4">
            <View className="w-10 h-10 items-center justify-center mr-4">
              <Ionicons name="download-outline" size={22} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">Export Logs</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Export app logs for debugging
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </SettingsSection>

        {/* Storage Info */}
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Storage Usage
          </Text>
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Wellness Data</Text>
              <Text className="text-gray-900 font-medium">45.2 MB</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">AI Models</Text>
              <Text className="text-gray-900 font-medium">128.7 MB</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Cache</Text>
              <Text className="text-gray-900 font-medium">12.1 MB</Text>
            </View>
            <View className="border-t border-gray-200 pt-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-900 font-semibold">Total</Text>
                <Text className="text-gray-900 font-bold">186.0 MB</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
