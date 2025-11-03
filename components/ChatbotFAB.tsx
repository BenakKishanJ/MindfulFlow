// components/TeacherFAB.tsx
import FloatingActionButton from "./FloatingActionButton";
import { router } from "expo-router";
import { View } from "react-native";

export default function ChatbotFAB() {
  // Render the FAB outside of the tab content area
  return (
    <View className="absolute bottom-20 right-4 z-50">
      <FloatingActionButton
        onPress={() => router.push("/(tabs)/chatbot")}
      // visible={user?.role === "teacher"}
      />
    </View>
  );
}
