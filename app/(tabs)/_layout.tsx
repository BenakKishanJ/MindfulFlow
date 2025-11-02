// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs, useRouter } from "expo-router";
import { View, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      {/* === TAB CONTENT === */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#000",
            borderTopWidth: 0,
            height: 80,
            paddingBottom: 30,
            paddingTop: 10,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="pulse-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="home" focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="dashboard"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="analytics-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="fitness-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="add-circle-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="bulb-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="person-outline" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="settings-outline" focused={focused} />
            ),
          }}
        />
      </Tabs>

      {/* === FLOATING ACTION BUTTON (FAB) === */}
      <FAB onPress={() => router.push("/(pages)/chatbot")} />
    </View>
  );
}

// === TAB ICON WITH LIME DOT ===
function TabIcon({ icon, focused }: { icon: any; focused: boolean }) {
  return (
    <View className="items-center justify-center relative">
      <Ionicons
        name={icon}
        size={26}
        color={focused ? "#A3E635" : "#CACACA"}
      />
      {focused && (
        <View
          className="absolute -bottom-3 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "#A3E635" }}
        />
      )}
    </View>
  );
}

// === FLOATING ACTION BUTTON (FAB) ===
function FAB({ onPress }: { onPress: () => void }) {
  return (
    <View className="absolute bottom-36 right-10 z-50">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.1}
        className="w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-black/40 bg-white border-2 border-black"
        style={{
          // Lime background on press
          backgroundColor: undefined,
        }}
        // Inline press style override
        onPressIn={(e) => {
          (e.currentTarget as any).setNativeProps({
            style: { backgroundColor: "#A3E635", borderColor: "#A3E635" },
          });
        }}
        onPressOut={(e) => {
          (e.currentTarget as any).setNativeProps({
            style: { backgroundColor: "#FFFFFF", borderColor: "#000000" },
          });
        }}
      >
        {/* <View className="w-14 h-14 rounded-full overflow-hidden border-2 border014 border-black"> */}
        <View className="w-24 h-24 rounded-full overflow-hidden">
          <Image
            source={require("@/assets/images/ai_coach.png")}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}
